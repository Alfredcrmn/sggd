drop policy if exists "Evidencias tokenized insert" on storage.objects;

create policy "Evidencias tokenized insert"
on storage.objects
for insert
to public
with check (
  bucket_id = 'evidencias'
  and public.consume_evidencia_upload_token(
    coalesce(user_metadata->>'upload_token', metadata->>'upload_token'),
    name,
    bucket_id
  )
);
