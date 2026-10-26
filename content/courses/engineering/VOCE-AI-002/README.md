# VOCE-AI-002 : édition ingénieur, revue de livraison à effectuer

Huit chapitres rédigés. Le laboratoire transactionnel utilise deux bases SQLite locales, sans dépendance externe ; le fournisseur est simulé. Les exercices et corrigés sont dans exercises.html, exclus du volume pédagogique comme le code et la bibliographie. Les scénarios sont fictifs. Les modèles de politiques, révocation, outils et traces complètent le laboratoire ; ils ne constituent pas une intégration IAM réelle.

Depuis la racine du dépôt, avec Python 3.12 ou supérieur :

```sh
python -m unittest discover -s content/courses/engineering/VOCE-AI-002 -p 'test_*.py' -v
python content/courses/engineering/VOCE-AI-002/check_draft.py
python content/courses/engineering/VOCE-AI-002/render.py --output /tmp/voce-ai002-preview.html
```

Les tests créent et suppriment des bases temporaires. Aucun paiement ni appel réseau. Le laboratoire suppose un appelant de confiance, une seule unité monétaire et un fournisseur conservant les clés d'idempotence. L'admission est le point d'engagement : une révocation ultérieure n'annule pas cette commande. Consulter le chapitre 8 pour les propriétés réellement testées et les limites.

Le compteur de référence est Counter dans scripts/audit-course-volume.py. Seuls les blocs lesson des chapitres contribuent au volume. Le rendu déterministe conserve le gabarit officiel mais retire les anciennes données structurées et impose noindex pour la prévisualisation ; il refuse toute destination dans le dépôt. Cette protection ne doit être levée que dans une livraison ciblée issue du main récent, avec métadonnées et contrôles de publication adaptés.

Prochaine action : revue technique et documentaire des huit chapitres, vérification exercices/corrigés, inspection visuelle desktop/mobile du rendu avec les ressources officielles, puis livraison ciblée. La publication progressive est autorisée dès que le cours est prêt et contrôlé ; il ne faut pas attendre les 120 cours. Aucune publication AI-002 n'est constatée à ce stade. Relecture indépendante et pilote apprenant non effectués.
