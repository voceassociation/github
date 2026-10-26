# VOCE-AI-002 : édition ingénieur 0.8.0

Huit chapitres rédigés. Le laboratoire transactionnel utilise deux bases SQLite locales, sans dépendance externe ; le fournisseur est simulé. Les exercices et corrigés sont dans exercises.html, exclus du volume pédagogique comme le code et la bibliographie. Les scénarios sont fictifs. Les modèles de politiques, révocation, outils et traces complètent le laboratoire ; ils ne constituent pas une intégration IAM réelle.

Depuis la racine du dépôt, avec Python 3.12 ou supérieur :

```sh
python -m unittest discover -s content/courses/engineering/VOCE-AI-002 -p 'test_*.py' -v
python content/courses/engineering/VOCE-AI-002/check_draft.py
python content/courses/engineering/VOCE-AI-002/render.py --output /tmp/voce-ai002-preview.html
```

Les tests créent et suppriment des bases temporaires. Aucun paiement ni appel réseau. Le laboratoire suppose un appelant de confiance, une seule unité monétaire et un fournisseur conservant les clés d'idempotence. L'admission est le point d'engagement : une révocation ultérieure n'annule pas cette commande. Consulter le chapitre 8 pour les propriétés réellement testées et les limites.

Le compteur de référence est Counter dans scripts/audit-course-volume.py. Seuls les blocs lesson des chapitres contribuent au volume. Le rendu déterministe conserve le gabarit officiel mais retire les anciennes données structurées et impose noindex pour la prévisualisation ; il refuse toute destination dans le dépôt. Cette protection ne doit être levée que dans une livraison ciblée issue du main récent, avec métadonnées et contrôles de publication adaptés.

La revue de cohérence du 26 octobre a corrigé les divergences entre architecture complète et laboratoire réduit, notamment révocation, version de politique, échéances et journalisation. 32 tests locaux passent, dont 11 transactionnels. Le rendu a été échantillonné sur ordinateur et mobile via Cloudflare ; aucune revue indépendante ni pilote apprenant n'a été effectué.

Le rendu publiable ciblé utilise le gabarit capturé depuis main, sans modifier les autres cours :

```sh
python content/courses/engineering/VOCE-AI-002/render_release.py --output cours/permissions-agent.html
```

La publication suit une PR ciblée issue de main ; le checkpoint distingue sauvegarde, fusion et vérification publique. Le rendu de travail render.py reste protégé contre une écriture en production.
