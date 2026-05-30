-- Supabase installs extension functions such as gen_random_bytes() in the
-- extensions schema. These token functions run with a restricted search_path,
-- so include extensions explicitly.

do $$
begin
  if to_regprocedure('public.generate_evidencia_upload_token(text, text, text, integer)') is not null then
    alter function public.generate_evidencia_upload_token(text, text, text, integer)
    set search_path = public, extensions;
  end if;

  if to_regprocedure('public.generate_public_evidencia_upload_token(text, text, text, integer)') is not null then
    alter function public.generate_public_evidencia_upload_token(text, text, text, integer)
    set search_path = public, extensions;
  end if;
end $$;

notify pgrst, 'reload schema';
