-- Enforce the intended evidence-upload split:
-- 1. Authenticated desktop users mint short-lived upload tokens.
-- 2. Anonymous mobile users can upload only when Storage RLS consumes a valid token.

revoke all on function public.generate_evidencia_upload_token(text, text, text, integer) from public, anon, authenticated;
grant execute on function public.generate_evidencia_upload_token(text, text, text, integer) to authenticated, service_role;

revoke all on function public.consume_evidencia_upload_token(text, text, text) from public, anon, authenticated;
grant execute on function public.consume_evidencia_upload_token(text, text, text) to anon, authenticated, service_role;

drop policy if exists "Evidencias tokenized insert" on storage.objects;

create policy "Evidencias tokenized insert"
on storage.objects
for insert
to anon, authenticated
with check (
  bucket_id = 'evidencias'
  and public.consume_evidencia_upload_token(
    coalesce(
      case
        when split_part(name, '/', 4) ~ '^[a-f0-9]{64}$'
          then split_part(name, '/', 4)
      end,
      user_metadata->>'upload_token',
      metadata->>'upload_token'
    ),
    name,
    bucket_id
  )
);
