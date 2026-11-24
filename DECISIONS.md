# Décisions techniques — DevisPro IA

Chaque décision suit le même format : **contexte**, **choix**, **alternatives écartées**, **conséquences**.

---

## 1. Isolation des entreprises par Row Level Security (RLS)

- **Contexte** : plusieurs artisans partagent la même base ; une fuite de devis entre entreprises serait rédhibitoire.
- **Choix** : la RLS de PostgreSQL filtre chaque ligne selon `company_id = current_company_id()`. Le front n'envoie aucun filtre.
- **Alternatives écartées** : des filtres `WHERE company_id = …` dans chaque requête côté API. Un seul oubli suffit à créer une fuite.
- **Conséquences** : la sécurité vit dans la base, au même endroit pour le web, le mobile et les Edge Functions. 10 tests pgTAP prouvent qu'un utilisateur de l'entreprise A ne peut ni lire, ni modifier, ni référencer les données de B.

## 2. `company_id` sur chaque table et clés étrangères composites

- **Contexte** : les contrôles de clé étrangère **ignorent la RLS**. Un utilisateur de A connaissant l'UUID d'un client de B pourrait le rattacher à son devis.
- **Choix** : chaque table porte un `company_id`, et les références passent par des clés composites `(id, company_id)`.
- **Conséquences** : la base refuse toute référence entre entreprises (erreur 23503), et toutes les politiques RLS ont la même forme simple, sans jointure.

## 3. Défense en profondeur : GRANT explicites

- **Contexte** : en local, Supabase accorde automatiquement les droits sur les tables ; les projets hébergés récents ne le font plus. Le bug n'est apparu qu'au déploiement (`permission denied`).
- **Choix** : les droits sont versionnés dans une migration. `anon` n'a **aucun** droit sur les tables métier, et `authenticated` n'a que ceux dont l'app a besoin.
- **Conséquences** : deux verrous successifs. Le GRANT décide de l'accès à la table, la RLS décide de l'accès aux lignes. Le local se comporte exactement comme la production.

## 4. `company_id` déduit côté serveur

- **Choix** : valeur par défaut `company_id = current_company_id()` en base, et création d'entreprise via la fonction `create_company` (`security definer`), qui garantit une seule entreprise par utilisateur.
- **Conséquences** : le front ne choisit jamais l'entreprise d'une ligne, il ne peut donc pas se tromper.

## 5. Montants en centimes entiers

- **Contexte** : en JavaScript, `0.1 + 0.2 !== 0.3`, et `35.10 * 100` vaut `3509.9999999999995`.
- **Choix** : tous les montants sont des entiers en centimes. Les quantités et les taux sont convertis en centièmes avant calcul. Arrondi au centime, le demi-centime étant arrondi au-dessus.
- **Conséquences** : aucune erreur d'arrondi cumulée, testée par Vitest (cas `35.10`, demi-centimes, remises).

## 6. TVA calculée par taux, et non ligne par ligne

- **Choix** : la TVA est calculée sur le total HT de chaque taux (5,5 %, 10 %, 20 %), comme sur une facture française.
- **Conséquences** : un test montre l'écart concret. Trois lignes à 0,05 € donnent 3 centimes de TVA ligne par ligne (faux), contre 2 centimes par taux (juste).

## 7. Double calcul des totaux : TypeScript et SQL

- **Contexte** : tout ce qui vient du navigateur peut être faux (bug, cache, requête modifiée).
- **Choix** : le navigateur calcule en direct pour l'affichage (`computeQuoteTotals`, dans `packages/shared`), et PostgreSQL recalcule de son côté (`quote_totals`). `save_quote` refuse l'enregistrement si les deux TTC diffèrent d'un seul centime.
- **Conséquences** : les totaux stockés sont **toujours ceux du serveur**. Des tests pgTAP vérifient que le SQL donne exactement les mêmes résultats que les tests Vitest, sur les mêmes cas.

## 8. Enregistrement atomique d'un devis (`save_quote`)

- **Contexte** : enregistrer un devis, c'est trois opérations (mettre à jour le devis, supprimer les anciennes lignes, insérer les nouvelles).
- **Choix** : une fonction SQL `security invoker` exécute le tout dans **une seule transaction**, avec la RLS appliquée.
- **Alternatives écartées** : trois appels depuis le front. Une coupure réseau entre la suppression et l'insertion ferait perdre toutes les lignes.

## 9. Lignes de devis figées

- **Choix** : le libellé, l'unité, le prix et la TVA sont **copiés** du catalogue dans `quote_lines`.
- **Conséquences** : si l'artisan modifie un tarif, ses anciens devis restent inchangés.

## 10. Types TypeScript générés depuis la base

- **Choix** : `supabase gen types` produit `database.types.ts`, partagé par le web et le mobile.
- **Conséquences** : un oubli côté base devient une erreur de compilation côté front, et non un bug en production. Exemple vécu : `company_id` exigé tant que la valeur par défaut n'existait pas.

## 11. IA : liste fermée, prix cachés, validation Zod

- **Contexte** : un LLM peut inventer des prestations ou des montants.
- **Choix** :
  - le LLM ne voit que des **références courtes** (C1, C2…), et toute référence inconnue est rejetée ;
  - le LLM **ne voit jamais les prix**, qui viennent toujours du catalogue en base ;
  - sa sortie est en **JSON structuré** (mode strict), puis **validée par Zod** côté serveur et côté client ;
  - quand une information manque, il **pose une question** au lieu de deviner ;
  - le texte de l'artisan est placé dans le message utilisateur, entre délimiteurs, contre l'injection de prompt.
- **Conséquences** : même une réponse « hallucinée » ne peut ni ajouter une prestation hors catalogue, ni fausser un montant.

## 12. Fournisseur LLM interchangeable

- **Choix** : un client compatible avec l'API OpenAI, configuré par `LLM_BASE_URL`, `LLM_API_KEY` et `LLM_MODEL`. Groq (offre gratuite) est utilisé pour la génération et pour Whisper.
- **Conséquences** : passer à OpenAI ou à Mistral se fait sans modifier le code. La clé est stockée dans les secrets Supabase, jamais dans le front.

## 13. Tests de l'IA avec un LLM simulé

- **Choix** : le client LLM est une simple fonction, remplacée dans les tests par un faux qui renvoie des réponses fixes.
- **Conséquences** : des tests gratuits, instantanés et déterministes, lancés dans la CI. Ils couvrent les références inventées, les quantités invalides, le JSON cassé, les erreurs du fournisseur et le contenu du prompt (sans prix).

## 14. Dictée : stockage isolé et minimisation des données

- **Choix** : l'audio est déposé dans un bucket **privé**, dans `audio/{company_id}/…`, avec une politique RLS sur Storage. Il est **supprimé dès sa transcription**. Le texte est affiché et modifiable avant la génération.
- **Conséquences** : la voix de l'artisan n'est pas conservée (RGPD), et une erreur de transcription peut être corrigée avant de servir à l'IA.

## 15. Edge Functions isolées du monorepo pnpm

- **Contexte** : Deno 2 lisait le `package.json` racine et cherchait les paquets dans `node_modules`.
- **Choix** : un `deno.json` par fonction (`nodeModulesDir: "none"`) et la variable `DENO_NO_PACKAGE_JSON=1`.
- **Conséquences** : les tests reproduisent l'environnement de déploiement, où chaque fonction est autonome.

## 16. Intégration continue reproductible

- **Choix** : trois jobs obligatoires sur chaque PR (lint, typecheck et Vitest ; tests pgTAP ; tests Deno). Les versions de Node, de la CLI Supabase et de Deno sont **figées**.
- **Contexte** : `version: latest` a fait échouer la CI (limite de requêtes de l'API GitHub).
- **Conséquences** : le même code donne le même résultat aujourd'hui et dans trois mois. Aucune PR ne peut être mergée avec un check rouge.

## 17. Monorepo pnpm avec `packages/shared`

- **Choix** : `apps/web`, `apps/mobile` et `packages/shared` (calculs, schémas Zod, types générés).
- **Conséquences** : une seule implémentation des calculs et des contrats d'API pour toutes les applications.

## 18. Front : architecture par fonctionnalité (feature-based)

- **Choix** : `src/features/{auth,catalog,clients,quotes}`, chacun avec `api.ts` (Supabase), `hooks.ts` (état serveur), `components/` et sa page. Les briques transverses vivent dans `components/common` et `lib/`.
- **Alternatives écartées** : un rangement par type (`pages/`, `components/`, `services/`), où une fonctionnalité est éparpillée dans 4 dossiers.
- **Conséquences** : une fonctionnalité se lit, se modifie et se supprime au même endroit.

## 19. TanStack Query pour l'état serveur

- **Choix** : chaque lecture passe par `useQuery`, chaque écriture par `useMutation`, qui invalide les clés de cache concernées.
- **Conséquences** : plus de `useEffect` de chargement ni de `refresh()` manuel. Les listes se mettent à jour seules, les pages déjà visitées s'affichent instantanément, et le cache est vidé à la déconnexion pour qu'aucune donnée ne passe d'un utilisateur à l'autre.

## 20. Logique séparée de l'affichage (éditeur de devis)

- **Choix** : le hook `useQuoteEditor` porte l'état et les règles. Les fonctions pures (`editor-lines.ts`) sont testées avec Vitest. Les composants (`QuoteHeaderForm`, `AiAssistantPanel`, `QuoteLinesTable`, `QuoteTotalsCard`) ne font qu'afficher et déclencher des actions.
- **UI** : shadcn/ui (Radix + Tailwind) pour des composants accessibles dont le code fait partie du projet.
- **Conséquences** : un fichier de plus de 400 lignes est devenu plusieurs composants courts, et la logique de l'éditeur pourra être réutilisée en partie sur mobile.

---

## Incidents rencontrés et leçons

| Incident | Cause | Correction | Leçon |
|---|---|---|---|
| Tests RLS en échec après l'ajout du seed | Les UUID des tests et du seed étaient identiques | UUID dédiés aux tests | Les données de test ne doivent pas dépendre de l'état de la base |
| CI en échec sans changement de code | `setup-cli` en `latest` et limite de l'API GitHub | Versions figées | Une CI doit être reproductible |
| `permission denied` en production | GRANT implicites en local, absents en ligne | Migration de GRANT explicites | Versionner les droits, aligner local et production |
| Deno modifiait `package.json` | Détection du monorepo pnpm | `deno.json` et `DENO_NO_PACKAGE_JSON` | Isoler les environnements d'exécution |