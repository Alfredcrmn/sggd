create or replace function public.generate_public_evidencia_upload_token(
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
  v_record_exists boolean;
begin
  if p_table not in ('garantias', 'devoluciones') then
    raise exception 'Tabla no permitida';
  end if;

  if p_record_id is null or length(trim(p_record_id)) = 0 then
    raise exception 'Registro inválido';
  end if;

  if p_session_id is null or length(trim(p_session_id)) = 0 then
    raise exception 'Sesión inválida';
  end if;

  if p_table = 'garantias' then
    select exists(
      select 1
      from public.garantias
      where id::text = p_record_id
        and estatus in ('activo', 'pendiente_validacion')
    ) into v_record_exists;
  else
    select exists(
      select 1
      from public.devoluciones
      where id::text = p_record_id
        and estatus in ('activo', 'pendiente_validacion')
    ) into v_record_exists;
  end if;

  if not v_record_exists then
    raise exception 'Registro no disponible para carga de evidencia';
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
    coalesce(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid),
    v_expires_at
  );

  return query select v_token, v_prefix, v_expires_at;
end;
$$;

revoke all on function public.generate_public_evidencia_upload_token(text, text, text, integer) from public, anon, authenticated;
grant execute on function public.generate_public_evidencia_upload_token(text, text, text, integer) to anon, authenticated, service_role;

notify pgrst, 'reload schema';
