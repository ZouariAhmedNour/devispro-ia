# DevisPro IA

Application de devis pour artisans : catalogue de prestations, brouillon de devis généré par IA (dictée/photo), relecture, PDF.

## Stack
- apps/web : React + Vite + TypeScript (back-office)
- apps/mobile : Expo (React Native, TypeScript)
- packages/shared : types et schémas Zod partagés (@devispro/shared)
- supabase/ : migrations SQL, politiques RLS, Edge Functions (Deno)
- Tests : Vitest (logique), tests SQL des politiques RLS, Playwright (E2E web)

## Commandes
- pnpm lint | pnpm typecheck | pnpm test
- pnpm supabase start | pnpm supabase db reset

## Règles
- Pas de merge sans tests : toute logique métier nouvelle arrive avec ses tests.
- Toute table métier porte un company_id et a la RLS activée, avec des politiques testées.
- Aucune sortie de LLM n'est utilisée sans validation Zod ; un catalog_item_id absent du catalogue est rejeté.
- Si une règle métier est ambiguë, poser la question au lieu de deviner.
- Les types partagés vivent dans packages/shared, jamais dupliqués.
- Aucun secret dans le code : variables d'environnement uniquement (.env non versionné).
- Commits petits, en français, au format `type(scope): message`. Ne jamais ajouter de ligne Co-Authored-By ni de trailer mentionnant Claude.