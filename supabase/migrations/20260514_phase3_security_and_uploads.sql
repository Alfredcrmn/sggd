create extension if not exists pgcrypto;

-- -----------------------------------------------------------------------------
-- Pre-check: bootstrap admin must exist before applying restrictive RLS changes
-- -----------------------------------------------------------------------------
do $$
begin
  if not exists (
    select 1
    from public.perfiles p
    where lower(trim(p.rol::text)) = 'admin'
  ) then
    raise exception
      'Migration blocked: no bootstrap admin found in public.perfiles. Create at least one admin before applying.';
  end if;
end $$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists(
    select 1
    from public.perfiles p
    where p.id = auth.uid()
      and lower(trim(p.rol::text)) = 'admin'
  );
$$;

revoke all on function public.is_admin() from public, anon, authenticated;
grant execute on function public.is_admin() to authenticated, service_role;

create or replace function public.current_user_sucursal_id()
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select p.sucursal_id
  from public.perfiles p
  where p.id = auth.uid();
$$;

revoke all on function public.current_user_sucursal_id() from public, anon, authenticated;
grant execute on function public.current_user_sucursal_id() to authenticated, service_role;

-- -----------------------------------------------------------------------------
-- Policy migration visibility: print what will be dropped and its replacement
-- -----------------------------------------------------------------------------
do $$
declare
  r record;
  replacement text;
begin
  raise notice 'RLS migration plan (public.devoluciones, public.garantias, public.perfiles):';
  for r in
    select schemaname, tablename, policyname, cmd
    from pg_policies
    where schemaname = 'public'
      and tablename in ('devoluciones', 'garantias', 'perfiles')
    order by tablename, cmd, policyname
  loop
    replacement := case
      when r.tablename = 'devoluciones' and r.cmd = 'SELECT' then 'Devoluciones select by sucursal or admin'
      when r.tablename = 'devoluciones' and r.cmd = 'INSERT' then 'Devoluciones insert by sucursal or admin'
      when r.tablename = 'devoluciones' and r.cmd = 'UPDATE' then 'Devoluciones update by sucursal or admin'
      when r.tablename = 'garantias' and r.cmd = 'SELECT' then 'Garantias select by sucursal or admin'
      when r.tablename = 'garantias' and r.cmd = 'INSERT' then 'Garantias insert by sucursal or admin'
      when r.tablename = 'garantias' and r.cmd = 'UPDATE' then 'Garantias update by sucursal or admin'
      when r.tablename = 'perfiles' and r.cmd = 'SELECT' then 'Perfiles select own or admin'
      when r.tablename = 'perfiles' and r.cmd = 'INSERT' then 'Perfiles insert admin'
      when r.tablename = 'perfiles' and r.cmd = 'UPDATE' then 'Perfiles update admin'
      when r.tablename = 'perfiles' and r.cmd = 'DELETE' then 'Perfiles delete admin'
      else 'No direct replacement'
    end;

    raise notice ' - Drop policy %.% (% %), replacement => %',
      r.tablename,
      r.policyname,
      r.cmd,
      r.schemaname,
      replacement;
  end loop;
end $$;

-- -----------------------------------------------------------------------------
-- Preflight inventory: verify current policies before changes
-- -----------------------------------------------------------------------------
do $$
declare
  r record;
begin
  raise notice 'Preflight policy inventory (public + storage):';
  for r in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname in ('public', 'storage')
    order by schemaname, tablename, policyname
  loop
    raise notice ' - %.%.%', r.schemaname, r.tablename, r.policyname;
  end loop;
end $$;

do $$
declare
  r record;
begin
  for r in
    select policyname, tablename
    from pg_policies
    where schemaname = 'public'
      and tablename in ('devoluciones', 'garantias', 'perfiles')
  loop
    execute format('drop policy if exists %I on public.%I', r.policyname, r.tablename);
  end loop;
end $$;

alter table public.devoluciones enable row level security;
alter table public.garantias enable row level security;
alter table public.perfiles enable row level security;

-- Idempotency for new policy names (in case of partial previous run)
drop policy if exists "Perfiles select own or admin" on public.perfiles;
drop policy if exists "Perfiles insert admin" on public.perfiles;
drop policy if exists "Perfiles update admin" on public.perfiles;
drop policy if exists "Perfiles delete admin" on public.perfiles;
drop policy if exists "Devoluciones select by sucursal or admin" on public.devoluciones;
drop policy if exists "Devoluciones insert by sucursal or admin" on public.devoluciones;
drop policy if exists "Devoluciones update by sucursal or admin" on public.devoluciones;
drop policy if exists "Devoluciones delete admin only" on public.devoluciones;
drop policy if exists "Garantias select by sucursal or admin" on public.garantias;
drop policy if exists "Garantias insert by sucursal or admin" on public.garantias;
drop policy if exists "Garantias update by sucursal or admin" on public.garantias;
drop policy if exists "Garantias delete admin only" on public.garantias;

create policy "Perfiles select own or admin"
on public.perfiles
for select
to authenticated
using (id = auth.uid() or public.is_admin());

create policy "Perfiles insert admin"
on public.perfiles
for insert
to authenticated
with check (public.is_admin());

create policy "Perfiles update admin"
on public.perfiles
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Perfiles delete admin"
on public.perfiles
for delete
to authenticated
using (public.is_admin());

create policy "Devoluciones select by sucursal or admin"
on public.devoluciones
for select
to authenticated
using (public.is_admin() or sucursal_id = public.current_user_sucursal_id());

create policy "Devoluciones insert by sucursal or admin"
on public.devoluciones
for insert
to authenticated
with check (
  public.is_admin()
  or (
    sucursal_id = public.current_user_sucursal_id()
    and solicitado_por_id = auth.uid()
  )
);

create policy "Devoluciones update by sucursal or admin"
on public.devoluciones
for update
to authenticated
using (public.is_admin() or sucursal_id = public.current_user_sucursal_id())
with check (public.is_admin() or sucursal_id = public.current_user_sucursal_id());

create policy "Devoluciones delete admin only"
on public.devoluciones
for delete
to authenticated
using (public.is_admin());

create policy "Garantias select by sucursal or admin"
on public.garantias
for select
to authenticated
using (public.is_admin() or sucursal_id = public.current_user_sucursal_id());

create policy "Garantias insert by sucursal or admin"
on public.garantias
for insert
to authenticated
with check (
  public.is_admin()
  or (
    sucursal_id = public.current_user_sucursal_id()
    and recibido_por_id = auth.uid()
  )
);

create policy "Garantias update by sucursal or admin"
on public.garantias
for update
to authenticated
using (public.is_admin() or sucursal_id = public.current_user_sucursal_id())
with check (public.is_admin() or sucursal_id = public.current_user_sucursal_id());

create policy "Garantias delete admin only"
on public.garantias
for delete
to authenticated
using (public.is_admin());

create or replace function public.enforce_devoluciones_admin_transitions()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'UPDATE' then
    if new.estatus is distinct from old.estatus then
      if new.estatus in ('activo', 'cerrado') and not public.is_admin() then
        raise exception 'Solo administradores pueden establecer estatus %', new.estatus;
      end if;
    end if;

    if not public.is_admin() then
      if new.sucursal_id is distinct from old.sucursal_id then
        raise exception 'No autorizado para cambiar sucursal';
      end if;
      if new.validado_por_admin_id is distinct from old.validado_por_admin_id then
        raise exception 'No autorizado para validar cierre';
      end if;
      if new.cerrado_por_id is distinct from old.cerrado_por_id then
        raise exception 'No autorizado para cerrar';
      end if;
    end if;
  end if;

  return new;
end;
$$;

create or replace function public.enforce_garantias_admin_transitions()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'UPDATE' then
    if new.estatus is distinct from old.estatus then
      if new.estatus in ('activo', 'listo_para_entrega', 'cerrado') and not public.is_admin() then
        raise exception 'Solo administradores pueden establecer estatus %', new.estatus;
      end if;
    end if;

    if not public.is_admin() then
      if new.sucursal_id is distinct from old.sucursal_id then
        raise exception 'No autorizado para cambiar sucursal';
      end if;
      if new.validado_por_admin_id is distinct from old.validado_por_admin_id then
        raise exception 'No autorizado para validar';
      end if;
      if new.cerrado_por_id is distinct from old.cerrado_por_id then
        raise exception 'No autorizado para cerrar';
      end if;
    end if;
  end if;

  return new;
end;
$$;

revoke all on function public.enforce_devoluciones_admin_transitions() from public, anon, authenticated;
revoke all on function public.enforce_garantias_admin_transitions() from public, anon, authenticated;

drop trigger if exists trg_enforce_devoluciones_admin_transitions on public.devoluciones;
create trigger trg_enforce_devoluciones_admin_transitions
before update on public.devoluciones
for each row
execute function public.enforce_devoluciones_admin_transitions();

drop trigger if exists trg_enforce_garantias_admin_transitions on public.garantias;
create trigger trg_enforce_garantias_admin_transitions
before update on public.garantias
for each row
execute function public.enforce_garantias_admin_transitions();

create or replace function public.admin_confirm_user(target_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if not public.is_admin() then
    raise exception 'Admin privileges required';
  end if;

  update auth.users
  set confirmed_at = now(),
      email_confirmed_at = now(),
      updated_at = now()
  where id = target_user_id;

  if not found then
    raise exception 'User not found';
  end if;
end;
$$;

revoke all on function public.admin_confirm_user(uuid) from public, anon, authenticated;
grant execute on function public.admin_confirm_user(uuid) to authenticated, service_role;

-- SECURITY NOTE:
-- Do not create users by direct INSERT into auth.users from SQL migration.
-- Use Supabase Auth Admin API from a trusted backend service instead.
-- Here we only lock down existing admin_create_user RPC(s) if present.
do $$
begin
  if to_regprocedure('public.admin_create_user(text, text, jsonb)') is not null then
    execute 'revoke all on function public.admin_create_user(text, text, jsonb) from public, anon, authenticated';
    execute 'grant execute on function public.admin_create_user(text, text, jsonb) to service_role';
  end if;

  -- Signature used by this project (keep executable only by service_role)
  if to_regprocedure('public.admin_create_user(text, text, text, text, text, integer)') is not null then
    execute 'revoke all on function public.admin_create_user(text, text, text, text, text, integer) from public, anon, authenticated';
    execute 'grant execute on function public.admin_create_user(text, text, text, text, text, integer) to service_role';
  end if;
end $$;

create table if not exists public.evidencia_upload_tokens (
  id uuid primary key default gen_random_uuid(),
  token text not null unique,
  bucket_id text not null default 'evidencias',
  object_prefix text not null,
  target_table text not null,
  target_record_id text not null,
  session_id text not null,
  created_by uuid not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  used_at timestamptz
);

create index if not exists evidencia_upload_tokens_token_idx on public.evidencia_upload_tokens (token);
create index if not exists evidencia_upload_tokens_expires_idx on public.evidencia_upload_tokens (expires_at);
create index if not exists evidencia_upload_tokens_created_by_idx on public.evidencia_upload_tokens (created_by);

alter table public.evidencia_upload_tokens enable row level security;

drop policy if exists "Evidencia tokens select own or admin" on public.evidencia_upload_tokens;

create policy "Evidencia tokens select own or admin"
on public.evidencia_upload_tokens
for select
to authenticated
using (created_by = auth.uid() or public.is_admin());

create or replace function public.generate_evidencia_upload_token(
  p_table text,
  p_record_id text,
  p_session_id text,
  p_ttl_seconds integer default 900
)
returns table(token text, object_prefix text, expires_at timestamptz)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_token text;
  v_prefix text;
  v_expires_at timestamptz;
  v_sucursal_id integer;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if p_table not in ('garantias', 'devoluciones') then
    raise exception 'Tabla no permitida';
  end if;

  if p_record_id is null or length(trim(p_record_id)) = 0 then
    raise exception 'Registro inválido';
  end if;

  if p_session_id is null or length(trim(p_session_id)) = 0 then
    raise exception 'Sesión inválida';
  end if;

  if not public.is_admin() then
    if p_table = 'garantias' then
      select sucursal_id into v_sucursal_id
      from public.garantias
      where id::text = p_record_id;
    else
      select sucursal_id into v_sucursal_id
      from public.devoluciones
      where id::text = p_record_id;
    end if;

    if v_sucursal_id is null or v_sucursal_id is distinct from public.current_user_sucursal_id() then
      raise exception 'No autorizado';
    end if;
  end if;

  v_token := encode(gen_random_bytes(32), 'hex');
  v_prefix := format('%s/%s/%s/', p_table, p_record_id, p_session_id);
  v_expires_at := now() + make_interval(secs => least(greatest(60, p_ttl_seconds), 900));

  insert into public.evidencia_upload_tokens (
    token,
    object_prefix,
    target_table,
    target_record_id,
    session_id,
    created_by,
    expires_at
  ) values (
    v_token,
    v_prefix,
    p_table,
    p_record_id,
    p_session_id,
    auth.uid(),
    v_expires_at
  );

  return query select v_token, v_prefix, v_expires_at;
end;
$$;

revoke all on function public.generate_evidencia_upload_token(text, text, text, integer) from public, anon, authenticated;
grant execute on function public.generate_evidencia_upload_token(text, text, text, integer) to authenticated, service_role;

create or replace function public.consume_evidencia_upload_token(
  p_token text,
  p_object_name text,
  p_bucket_id text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_now timestamptz := now();
begin
  if p_token is null or length(trim(p_token)) = 0 then
    return false;
  end if;

  if p_bucket_id <> 'evidencias' then
    return false;
  end if;

  update public.evidencia_upload_tokens
  set used_at = v_now
  where token = p_token
    and bucket_id = p_bucket_id
    and used_at is null
    and expires_at > v_now
    and p_object_name like object_prefix || '%';

  if found then
    return true;
  end if;

  return false;
end;
$$;

revoke all on function public.consume_evidencia_upload_token(text, text, text) from public, anon, authenticated;
grant execute on function public.consume_evidencia_upload_token(text, text, text) to anon, authenticated, service_role;

do $$
declare
  r record;
begin
  raise notice 'Storage policy migration plan (storage.objects for bucket evidencias):';
  for r in
    select policyname, cmd
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and (qual ilike '%evidencias%' or with_check ilike '%evidencias%')
  loop
    raise notice ' - Drop policy storage.objects.% (%), replacement => %',
      r.policyname,
      r.cmd,
      case
        when r.cmd = 'SELECT' then 'Evidencias public read'
        when r.cmd = 'INSERT' then 'Evidencias tokenized insert'
        else 'No direct replacement'
      end;
    execute format('drop policy if exists %I on storage.objects', r.policyname);
  end loop;
end $$;

drop policy if exists "Evidencias public read" on storage.objects;
drop policy if exists "Evidencias tokenized insert" on storage.objects;

create policy "Evidencias public read"
on storage.objects
for select
to public
using (bucket_id = 'evidencias');

create policy "Evidencias tokenized insert"
on storage.objects
for insert
to public
with check (
  bucket_id = 'evidencias'
  and public.consume_evidencia_upload_token(metadata->>'upload_token', name, bucket_id)
);