-- ============================================================
-- Phase 1b — ajout des colonnes nécessaires au feed
-- Exécute ce fichier dans Supabase SQL Editor, en une fois.
-- Ne recrée aucune table, ne supprime rien.
-- ============================================================

-- description : texte affiché dans le feed (rempli via Wikipédia ou à la main)
alter table tourist_places add column if not exists description text;

-- source_url : lien vers l'article Wikipédia d'origine, pour l'attribution
-- (obligatoire pour réutiliser du contenu Wikipédia légalement — licence CC BY-SA)
alter table tourist_places add column if not exists source_url text;

-- ============================================================
-- Phase 1b — accès d'écriture pour le prototype sans authentification
-- ============================================================
-- Le frontend appelle actuellement l'API Express sans compte utilisateur.
-- On autorise donc temporairement les opérations CRUD via le rôle anon.
-- À la Phase 2, ces policies devront être remplacées par des policies
-- basées sur auth.uid() et les rôles administrateur.

DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['tourist_places', 'circuits', 'hotels', 'media', 'circuit_places', 'circuit_hotels']
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', t);

    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public' AND tablename = t AND policyname = 'Prototype anon insert'
    ) THEN
      EXECUTE format('CREATE POLICY "Prototype anon insert" ON public.%I FOR INSERT TO anon WITH CHECK (true);', t);
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public' AND tablename = t AND policyname = 'Prototype anon update'
    ) THEN
      EXECUTE format('CREATE POLICY "Prototype anon update" ON public.%I FOR UPDATE TO anon USING (true) WITH CHECK (true);', t);
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public' AND tablename = t AND policyname = 'Prototype anon delete'
    ) THEN
      EXECUTE format('CREATE POLICY "Prototype anon delete" ON public.%I FOR DELETE TO anon USING (true);', t);
    END IF;
  END LOOP;
END $$;

-- Supabase Storage : le bucket "media" doit être créé au préalable.
-- Ces policies permettent au prototype de téléverser/supprimer des fichiers
-- sans authentification. Elles devront aussi être durcies avec auth.uid()
-- lorsque l'authentification sera ajoutée.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Prototype anon media select'
  ) THEN
    CREATE POLICY "Prototype anon media select"
      ON storage.objects FOR SELECT TO anon
      USING (bucket_id = 'media');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Prototype anon media insert'
  ) THEN
    CREATE POLICY "Prototype anon media insert"
      ON storage.objects FOR INSERT TO anon
      WITH CHECK (bucket_id = 'media');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Prototype anon media update'
  ) THEN
    CREATE POLICY "Prototype anon media update"
      ON storage.objects FOR UPDATE TO anon
      USING (bucket_id = 'media')
      WITH CHECK (bucket_id = 'media');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Prototype anon media delete'
  ) THEN
    CREATE POLICY "Prototype anon media delete"
      ON storage.objects FOR DELETE TO anon
      USING (bucket_id = 'media');
  END IF;
END $$;
