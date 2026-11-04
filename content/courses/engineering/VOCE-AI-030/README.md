# VOCE-AI-030 — Une réponse structurée peut être fausse

Brouillon incomplet, non publié. Chapitre 01: contrat de forme, calcul entier, rapprochement externe, verdict indéterminé et limite temporelle. 17 728 caractères pédagogiques normalisés hors bibliographie et laboratoire.

Sélection avant rédaction: main et branche 7 795 caractères chacun; baseline 537 caractères dans chaque version; aucun chapitre développé sauvegardé. Éditions jamais additionnées. Consigne prioritaire du 26 octobre appliquée.

## Vérification locale

Python avec jsonschema 4.26.0: `python test_contract.py` (12 tests). Référentiel fictif en mémoire; aucun document, modèle, service de paiement ou transaction concurrente testé.

Depuis le dépôt: `node content/courses/engineering/VOCE-AI-030/render_draft.mjs /tmp/ai030-preview.html`. Rendu de brouillon hors dépôt uniquement, sans remplacement de la page publique. Le rendu conserve la coquille existante; aucune vérification visuelle effectuée.

## Reprise

Remesurer main et les sources sauvegardées. Si toujours sous 20 000 caractères, rédiger 02 — Liaison documentaire, versions de référence et admission transactionnelle. Puis réception intégrée, exercices et revue indépendante restent ouverts. Si le seuil est atteint, préserver les chapitres sans allongement ni publication comme cours terminé. La cible de profondeur des cours sélectionnés demeure; ce lot n'est pas une édition achevée à 75 000 caractères.

## Lot chapitre 02 — 4 novembre 2026

02-preuve-et-admission.html: liaison documentaire, dépendances versionnées et admission atomique. 14 659 caractères supplémentaires; total 32 387. Le chapitre 01 est conservé sans modification.

20 tests locaux réussis, dont huit nouveaux essais SQLite: persistance après réouverture, répétition, conflit de clé, document périmé, ticket périmé, quantité insuffisante, rollback injecté et contention entre deux connexions. Commande: `python -m unittest discover -s content/courses/engineering/VOCE-AI-030 -p 'test_*.py'`.

La consigne de préservation prime désormais: aucune extension du cours au-delà de ce lot. Chapitre 03, exercices, réception complète, contrôle visuel et relecture indépendante restent ouverts. Brouillon incomplet, non publié. Prochain candidat: AI-031, à mesurer sur main et dans les sources sauvegardées avant sélection. Les anciens éléments de reprise sous le seuil sont historiques et remplacés par cette décision.
