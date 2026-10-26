# VOCE-AI-003 — sources de réécriture en cours

Un premier chapitre ingénieur, isolé de l’édition publique 0.5.1. Aucune page du site, donnée de catalogue ou entrée du manifeste de livraison n’est remplacée par ce lot. Le chapitre doit être intégré après comparaison avec l’édition récente de main, pas ajouté mécaniquement à celle-ci pour atteindre un seuil.

Depuis ce dossier :

```
python render.py --output /tmp/voce-ai003-draft.html
python -m unittest -v test_oracle.py
```

Le rendu est déterministe, sans dépendance tierce, sans copie des annexes Python dans le volume pédagogique. Le compteur normalise les espaces du texte des seuls fichiers de chapitres. Ces fichiers doivent contenir uniquement des sections `data-voce-count="lesson"`. Références, exercices futurs et code annexe restent séparés.

L’oracle est un modèle synthétique, sans authentification des traces ni collecte réelle. Il accepte une déclaration de couverture et de fermeture : ces entrées sont des hypothèses, pas des garanties obtenues par le programme. Ses tests vérifient la règle de classement et quelques transformations ; ils ne prouvent aucun contrôle d’un agent réel. La relecture indépendante et le contrôle visuel restent à faire.

Prochaine rédaction : chapitre 02, sélection des scénarios de contrôle, partitions et frontières, mutations de l’instrumentation, séparation des jeux de construction et de réception. Poursuivre ensuite par provenance, causalité des traces, quantification, assurance et laboratoire corrigé. Le plan demeure révisable selon l’examen des sections existantes.
