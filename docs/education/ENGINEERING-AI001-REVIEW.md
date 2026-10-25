# VOCE-AI-001 : contrôle de l’édition ingénieur 0.6.0

Date : 25 octobre 2026. Édition proposée dans une branche, non déclarée publiée.

## Contenu

91 018 caractères de corps pédagogique après normalisation des espaces, hors introduction, exercices, corrigés, code du laboratoire et bibliographies. Environ 44 000 caractères de nouveaux développements spécifiques ; fondements antérieurs utiles conservés. Le volume est un critère nécessaire, pas une preuve de qualité.

Les développements portent sur les invariants, la commande déterministe, les transactions, l'identité des intentions, l'effet distant, la réconciliation, le redémarrage, le budget métier, les indicateurs, les traces, les erreurs d'API, les permissions, les événements retardés, la portée des tests, la capacité et la migration. Un laboratoire Python local utilise deux registres SQLite séparés.

## Contrôles réellement exécutés

- Python 3.12.14 : neuf tests du laboratoire réussis, dont concurrence sur le budget et reprise après effet distant avec réponse perdue.
- Génération idempotente du cours : seconde génération identique par SHA-256.
- Générateur historique : arrêt avant écriture en présence du manifeste des éditions longues ; page inchangée après la tentative.
- Un H1, URL canonique conservée, ancres uniques et résolues, fichiers du laboratoire présents, JSON-LD lisible.
- Aucun paragraphe long strictement identique répété dans la page.
- Audit de volume : 1 cours dépasse le seuil dans les blocs pédagogiques explicitement balisés ; 117 restent sous le seuil même avec leurs compléments ; 2 éditions longues nécessitent encore segmentation et revue.

## Sources et portée

Consultations ciblées des documentations officielles HTTP (RFC 9110 et 9457), SQLite, Python sqlite3, PostgreSQL, OpenTelemetry, Google SRE et OWASP. Les explications d'architecture, les cas et les chiffres sont pédagogiques. Les garanties du prestataire sont des hypothèses explicites du simulateur. Aucune validation de l'implémentation par ces organismes n'est revendiquée.

## Vérifications restant à réaliser

Relecture technique indépendante, essais auprès d'apprenants et contrôle visuel dans un navigateur mobile et ordinateur. Le laboratoire ne fournit pas de preuve de sécurité de production, de résistance à une coupure matérielle ou de capacité sous charge. Les tests historiques imposant 35–45 minutes et la version 0.4 ne sont pas utilisés comme critères de réception de cette édition.

## Périmètre

Un cours révisé, pas 120. Les automatisations, le catalogue public, les traductions et les autres cours ne sont pas réécrits par ce générateur. L'estimation est désormais de six à huit heures pour le parcours complet, non mesurée auprès d'apprenants.
