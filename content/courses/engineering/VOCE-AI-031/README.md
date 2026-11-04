# VOCE-AI-031 — Une chaîne d’agents multiplie les frontières

Brouillon incomplet, non publié. Chapitre 01: frontières, atténuation de délégation, budget partagé, réservations, allocations disjointes et résultats inconnus. 15 474 caractères pédagogiques normalisés, hors références et code.

Sélection: main et branche 7 875 caractères chacun; baseline 564 chacun; aucun chapitre développé sauvegardé. Les éditions ne sont pas additionnées. Consigne du 26 octobre déjà présente dans AGENTS.md et COURSE-ACCEPTANCE.md.

Contrôles: `python test_budget.py`, 12 tests réussis. Modèle séquentiel en mémoire, sans OAuth, concurrence, modèle de langage ni fournisseur réel. Le rôle de réconciliation est supposé fiable et non authentifié par ce laboratoire.

Rendu depuis le dépôt: `node content/courses/engineering/VOCE-AI-031/render_draft.mjs /tmp/ai031-preview.html`. Destination hors dépôt imposée. Deux sorties identiques, un H1 et absence de paragraphes identiques dans le chapitre vérifiés. Contrôle visuel et relecture indépendante non réalisés.

Reprise: remesurer main et sources sauvegardées avant sélection. Si toujours sous 20 000, rédiger 02 — Réservations atomiques, révocation des branches et réconciliation des effets. Puis réception intégrée, exercices et corrigés. Si le seuil est atteint, préserver sans allongement ni publication comme cours terminé. Ce lot ne satisfait pas l'objectif d'édition achevée à 75 000 caractères.

## Lot chapitre 02 — 4 novembre 2026

02-reservation-et-revocation.html ajoute 13 814 caractères; total 29 288. Chapitre 01 inchangé. Préservation prioritaire désormais applicable: ne pas allonger ni publier ce brouillon comme cours terminé. La reprise antérieure sous le seuil est remplacée par cette décision.

20 tests passent, dont huit nouveaux essais SQLite: budget commun, rollback, répétition, conflit de clé, révocation avec conservation des engagements, ancienne génération, résultat inconnu puis libération, contention entre deux connexions. Commande: `python -m unittest discover -s content/courses/engineering/VOCE-AI-031 -p 'test_*.py'`.

Limites: une mission et branches directes seulement; identités et preuves de réconciliation supposées fiables. Pas de file distribuée, contrôle de départ réel, fournisseur, OAuth, modèle de langage ni test de panne électrique. Contrôle visuel et relecture indépendante ouverts. Chapitre 03 et exercices non rédigés. Prochain candidat AI-032 à mesurer sur main et dans les sources sauvegardées.
