# VOCE-AI-001 : édition ingénieur 0.6.0

Cette édition conserve l'URL /cours/modele-et-systeme. Les fondements existants utiles sont conservés dans core.html ; engineering.html ajoute le développement technique spécifique. Les exercices, leurs corrigés et les références sont exclus du décompte pédagogique.

Le laboratoire local utilise Python 3.10+ et deux fichiers SQLite, sans réseau ni compte externe. Depuis le dépôt :

```sh
python -m unittest discover -s content/courses/engineering/VOCE-AI-001 -v
python scripts/build-engineering-course.py
python scripts/audit-course-volume.py --report docs/education/course-volume-audit.json
```

La dernière commande échoue volontairement tant que les autres cours restent insuffisants. Un succès quantitatif ne valide pas le fond.

Le prestataire simulé conserve durablement les clés d'intention et empêche les effets répétés sous la même clé. La répétition de dispatch repose sur cette hypothèse. Aucune identité utilisateur, API réseau, politique de conservation, garantie matérielle de durabilité ou capacité de charge n'est implémentée ou certifiée. Les tests ne représentent ni une intégration bancaire ni une mesure auprès d'apprenants.

Les tests couvrent concurrence, changement de commande, capacité, reprise après perte de réponse, confirmation répétée, reçu étranger et rollback local. La version d'exécution et les résultats sont consignés dans docs/education/ENGINEERING-AI001-REVIEW.md.
