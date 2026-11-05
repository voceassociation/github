# VOCE-AI-032 — La mémoire d’un agent peut contaminer demain

Brouillon incomplet, non publié. Chapitre 01: admission, provenance, portée, durée et sélection des souvenirs. 15 388 caractères pédagogiques normalisés hors références et laboratoire.

Sélection avant rédaction: main et branche 7 765 caractères chacun; baseline 558 chacun; aucun chapitre développé sauvegardé. Versions non additionnées. Consignes prioritaires déjà présentes dans AGENTS.md et COURSE-ACCEPTANCE.md.

Contrôles: `python test_memory.py`, 13 tests réussis. Prédicats en mémoire; aucune validation sémantique, aucun modèle ni moteur vectoriel réel exécuté. Rendu: `node content/courses/engineering/VOCE-AI-032/render_draft.mjs /tmp/ai032-preview.html`. Deux sorties identiques, un H1, paragraphes uniques dans le chapitre et destination hors dépôt vérifiés. Contrôle visuel et relecture indépendante ouverts.

Reprise: remesurer main et sources sauvegardées. Si toujours sous 20 000, rédiger 02 — Retrait concurrent, invalidation des résumés et reconstruction des index. Puis réception des attaques persistantes, exercices et corrigés. Si le seuil est atteint, préserver sans allongement ni publication comme cours terminé. Ce lot ne constitue pas une édition achevée à 75 000 caractères.

## Lot chapitre 02 — 5 novembre 2026

02-retrait-et-derivations.html ajoute 13 233 caractères; total 28 621. Chapitre 01 inchangé. Préservation prioritaire désormais applicable: aucune extension ni publication comme cours terminé. Cette décision remplace la reprise antérieure sous le seuil.

20 tests réussis, dont sept essais SQLite: publication nominale, publication tardive refusée, révision périmée, retrait transitif, rollback, répétition et instantané entre deux connexions WAL. Commande: `python -m unittest discover -s content/courses/engineering/VOCE-AI-032 -p 'test_*.py'`.

Limites: publication à un parent, données synthétiques; pas de moteur vectoriel, modèle, sauvegarde restaurée, session distante ou panne électrique testés. Relecture indépendante et contrôle visuel ouverts. Chapitre 03 et exercices restants. Prochain candidat AI-033 à mesurer avant sélection.
