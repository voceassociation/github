# VOCE-AI-003 — sources de réécriture en cours

Trois chapitres ingénieur, isolé de l’édition publique 0.5.1. Aucune page du site, donnée de catalogue ou entrée du manifeste de livraison n’est remplacée par ce lot. Le chapitre doit être intégré après comparaison avec l’édition récente de main, pas ajouté mécaniquement à celle-ci pour atteindre un seuil.

Depuis ce dossier :

```
python render.py --output /tmp/voce-ai003-draft.html
python -m unittest discover -v
```

Le rendu est déterministe, sans dépendance tierce, sans copie des annexes Python dans le volume pédagogique. Le compteur normalise les espaces du texte des seuls fichiers de chapitres. Ces fichiers doivent contenir uniquement des sections `data-voce-count="lesson"`. Références, exercices futurs et code annexe restent séparés.

L’oracle est un modèle synthétique, sans authentification des traces ni collecte réelle. Il accepte une déclaration de couverture et de fermeture : ces entrées sont des hypothèses, pas des garanties obtenues par le programme. Ses tests vérifient la règle de classement et quelques transformations ; ils ne prouvent aucun contrôle d’un agent réel. La relecture indépendante et le contrôle visuel restent à faire.

Prochaine rédaction : chapitre 04, quantification de l’incertitude et décision de réception. Poursuivre ensuite par assurance et laboratoire corrigé. Le plan demeure révisable selon l’examen des sections existantes.

Le module provenance.py vérifie une enveloppe contre un manifeste fourni comme fiable. Il ne signe rien, ne collecte pas de transactions et ne détecte pas un manifeste initial mensonger. Les dix tests de provenance exposent notamment cette limite.
