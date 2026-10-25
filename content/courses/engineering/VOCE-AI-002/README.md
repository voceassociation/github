# VOCE-AI-002 : réécriture ingénieur en cours

Les fichiers 01 et 02 sont une rédaction nouvelle et spécifique. Ils ne reprennent pas les paragraphes de VOCE-AI-001. Le cours reste incomplet ; les anciennes pages, URL, statuts du catalogue et composants officiels ne sont pas modifiés par ce lot. Le volume n'est pas complété avec le contenu historique non révisé.

Les sources HTML balisent uniquement l'enseignement avec `data-voce-count="lesson"`. Introduction, bibliographie et futur laboratoire restent hors de ces blocs. `course.json` impose l'ordre des chapitres. Le compteur de référence est `scripts/audit-course-volume.py`, classe `Counter`, appliquée aux chapitres sous un élément article. Le checkpoint global conserve le résultat mesuré.

Rendu de travail déterministe, depuis la racine du dépôt, avec Python 3.10+ :

```sh
python content/courses/engineering/VOCE-AI-002/render.py --output /tmp/voce-ai002-preview.html
```

Le rendu reprend les composants de la page officielle de cette révision du dépôt, remplace l'article et les repères, retire les anciens JSON-LD et ajoute noindex. Il refuse une destination dans le dépôt pour empêcher qu'un cours partiel remplace une route publique. Les liens absolus vers les ressources du site exigent un serveur approprié pour une inspection visuelle complète ; un contrôle structurel du HTML ne constitue pas cette inspection.

Prochain chapitre : `03-approbation-version-transaction.html`. Enseigner la liaison entre approbation et commande, la normalisation des paramètres, la vérification des versions et la fenêtre entre contrôle et effet. Les chapitres restants figurent dans `course.json`. Développer ensuite un laboratoire d'autorisation propre à ce cours, sans réutiliser le laboratoire de paiement du cours 001 comme substitut pédagogique.

Les sources de protocole consultées sont limitées aux éléments décrits dans `references.html`. Les scénarios et calculs sont fictifs. Pas de relecture indépendante, de pilote apprenant, de mesure de charge ni de contrôle visuel à ce stade. Aucune publication avant réécriture et contrôle des 120 cours.
