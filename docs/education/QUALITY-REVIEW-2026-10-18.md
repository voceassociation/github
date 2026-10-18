# Revue pédagogique des 120 modules, version 0.4.0

La revue renforce chaque module français par une démonstration propre au sujet, une correction spécifique du transfert, un critère observable et un guide de lecture des références. Les situations ajoutées sont pédagogiques, non des résultats empiriques. Les repères communs restent disponibles dans un volet facultatif. Le cas principal est explicitement une consolidation guidée, suivie d'un transfert autonome.

Les 120 parcours prévoient 35 à 45 minutes de travail actif: 8 minutes de compréhension, 12 minutes de consolidation, 10 à 15 minutes de transfert et lecture documentaire, 5 à 10 minutes de correction. Ce sont des estimations de conception, non des durées mesurées. La lecture seule ne constitue pas le parcours.

Corrections ciblées: rapports et études distingués dans le flux documentaire COG-006; calibration et discrimination étayées dans COG-016; étude de rappel de 2025 contextualisée dans COG-011 et COG-012. La présentation du programme matériaux Tsinghua non revérifié a été remplacée par une réserve explicite, sans effacer le fichier source historique. Les références supplémentaires sont consignées dans content/courses/reference-additions.json. Les autres notices conservent leurs dates et limites de vérification antérieures.

Les repères européens restent une orientation de conception. Cette révision ne constitue ni une matrice de conformité certifiée, ni une reconnaissance de qualification, ni un partenariat avec Bocconi. Les pages institutionnelles FR/EN/IT conservent leur statut de concept. Les 120 modules sont en français; aucune traduction de ces modules n'est annoncée comme réalisée.

## Vérifications effectuées

- scripts/check-education.py: 120 identifiants, URL, statuts et compétences conservés; références ajoutées explicitement; six pages institutionnelles; canonical, sitemap, liens locaux et JSON-LD.
- scripts/check-course-depth.py: 120 démonstrations, corrections de transfert, critères et guides distincts; présence exacte dans les pages; références cohérentes; exemples numériques sélectionnés; génération reproductible.
- node --test tests/public-pages.test.mjs tests/post-saas.test.mjs: 15 tests réussis.

Les durées observées, la relecture scientifique indépendante et une conformité d'accessibilité exhaustive restent à évaluer. Le téléchargement du navigateur local a échoué: aucun contrôle visuel local mobile n'est revendiqué.

## Périmètre des fichiers

120 pages HTML de cours; registre data/voce-vclf-public.json; trois fichiers *-depth.txt; référence-additions.json; correction ciblée de cog-workshops.txt; générateur et deux scripts de contrôle; audit JSON et ce compte rendu. La liste exhaustive est fournie par le diff de la pull request. Aucun changement de Post-SaaS, LÉGIS, des automatisations ou du référentiel de compétences.
