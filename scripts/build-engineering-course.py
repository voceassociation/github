"""Render a hand-authored engineering edition without regenerating other courses."""
from pathlib import Path
import json,re,html
R=Path(__file__).resolve().parents[1]
D=R/'content/courses/engineering/VOCE-AI-001'
intro='''<h1>Un modèle ne suffit pas à faire fonctionner un service</h1>
<p>VOCE-AI-001 · Ingénierie des services IA · Édition 0.6.0</p>
<p>Ce cours s'adresse aux ingénieurs logiciels, architectes et responsables techniques. Prérequis : fonctions Python, transactions SQL, contrats HTTP et lecture d'un journal d'exécution. Il enseigne la construction d'un service dont les effets restent contrôlables malgré les doublons, les interruptions et les réponses perdues.</p>
<p>À l'issue du travail, vous devrez pouvoir définir des invariants métier, justifier les frontières transactionnelles et démontrer une reprise sur un laboratoire local. Les cas et leurs données sont fictifs. Le parcours complet représente environ six à huit heures de travail estimé, lecture, programmation et corrections comprises ; cette estimation n'a pas été mesurée auprès d'apprenants.</p>
<nav aria-label="Sommaire du cours"><a href="#foundations">Fondements</a> · <a href="#engineering">Implémentation et raisonnement</a> · <a href="#lab">Laboratoire Python</a> · <a href="#cases">Cas et corrigés</a> · <a href="#sources-engineering">Sources techniques</a></nav>'''
lab_intro='''<section data-voce-count="practice" id="lab"><h2>Laboratoire : reprendre un remboursement sans double effet</h2>
<p>Téléchargez les deux fichiers dans le même répertoire : <a href="/content/courses/engineering/VOCE-AI-001/lab.py" download>lab.py</a> et <a href="/content/courses/engineering/VOCE-AI-001/test_lab.py" download>test_lab.py</a>. Python 3.10 ou ultérieur et sa bibliothèque standard suffisent. Aucun réseau, compte fournisseur ou paiement n'est utilisé.</p>
<pre><code>python -m unittest discover -s . -p test_lab.py -v</code></pre>
<p>Commencez par lire admit, puis tracez sur papier les transactions de dispatch. Exécutez les tests et conservez leur résultat. Pour chaque scénario, relevez l'état local, le nombre d'effets distants et le montant alloué. Ne modifiez qu'une propriété à la fois.</p>
<h3>Travail demandé</h3><ol><li>Expliquez pourquoi deux intentions de 5 000 centimes ne peuvent pas être admises sur un plafond de 8 000. Identifiez l'instruction qui protège la propriété.</li><li>Injectez une interruption après l'effet distant, recréez le service et comparez reconcile à dispatch. Justifiez pourquoi dispatch peut être répété dans ce laboratoire.</li><li>Proposez une variante du fournisseur qui oublie les clés. Décrivez le contre-exemple produit par une répétition et la condition qui interdirait cette répétition dans le service.</li><li>Concevez l'extension multi-organisation : clés, contrôles d'accès et test négatif empêchant un établissement de consulter une autre réservation.</li><li>Expliquez pourquoi l'empreinte de commande n'authentifie pas un opérateur et quelles données une approbation devrait couvrir.</li></ol>
<details class="course-correction"><summary>Correction technique du laboratoire</summary>
<p>1. UPDATE booking ne modifie la ligne que si allocated + amount reste inférieur ou égal à cap ; la vérification et l'allocation sont réalisées dans la même transaction d'écriture. L'insertion de l'intention doit être atomique avec cette allocation. Une lecture préalable sans protection ne suffit pas.</p>
<p>2. Après la panne injectée, l'état local vaut unknown et le fournisseur contient un effet. reconcile retrouve cet effet puis confirme. dispatch répète une commande de même identité : le fournisseur simulé restitue son reçu parce que sa clé primaire et son contrôle d'empreinte empêchent un nouvel effet. Sans cette hypothèse contractuelle, la même reprise n'est pas justifiée.</p>
<p>3. Si le fournisseur supprime l'identité après exécution, la commande répétée peut produire un deuxième effet. Il faut bloquer la répétition après expiration de la garantie et obtenir une preuve appropriée par un autre mécanisme de suivi. L'absence de ligne dans une mémoire expirée n'est pas une preuve de non-exécution.</p>
<p>4. Une extension recevable dérive l'organisation de l'identité authentifiée, inclut cette portée dans toutes les recherches et protège les intentions comme les réservations. Le test tente une consultation et une admission avec un identifiant appartenant à une autre organisation ; aucune donnée ni effet ne doit être obtenu. L'ajout d'une colonne sans contrôle sur chaque chemin est insuffisant.</p>
<p>5. Un hachage non secret peut être recalculé par tout détenteur des données. L'approbation doit être liée à l'opérateur habilité et à une version précise de la commande, notamment son organisation, son bénéficiaire, son montant et sa devise. Un changement de ces champs impose une nouvelle vérification selon la politique définie.</p>
</details><h3>Critères d'évaluation</h3><p>La production comprend un diagramme de transitions, les observations des tests et un contre-exemple à une reprise naïve. Une erreur sur le double effet, une libération de budget sans preuve ou une confusion entre hachage et autorisation impose une correction. La réussite des tests fournis ne remplace pas l'explication des invariants.</p>'''
code=''
for name in ['lab.py','test_lab.py']:
 code+='<details><summary>Code complet : '+name+'</summary><pre><code>'+html.escape((D/name).read_text())+'</code></pre></details>'
extra_refs='''<section id="sources-engineering" data-voce-count="bibliography"><h2>Sources techniques de l'édition ingénieur</h2>
<p>Les développements, scénarios et chiffres du laboratoire sont des constructions pédagogiques VOCE. Les documents ci-dessous ont été consultés le 25 octobre 2026 pour les points indiqués ; ils ne valident pas l'architecture proposée.</p><ul>
<li><a href="https://www.rfc-editor.org/rfc/rfc9110.html">IETF, RFC 9110, HTTP Semantics, 2022</a> : sections 9.2.2 et 15.3.3, idempotence des méthodes et acceptation asynchrone. La clé d'intention du laboratoire relève de notre contrat applicatif.</li>
<li><a href="https://www.sqlite.org/lang_transaction.html">SQLite, Transaction</a> : BEGIN IMMEDIATE et limites de concurrence en écriture. Ne prouve pas la durabilité d'une infrastructure particulière.</li>
<li><a href="https://docs.python.org/3/library/sqlite3.html">Python, module sqlite3</a> : connexions, transactions et exceptions ; laboratoire exécuté avec la version Python consignée dans le rapport de contrôle.</li>
<li><a href="https://www.postgresql.org/docs/18/transaction-iso.html">PostgreSQL 18, Transaction Isolation</a> : propriétés d'isolation et reprises après conflit. Le laboratoire n'exécute pas PostgreSQL.</li>
<li><a href="https://www.rfc-editor.org/rfc/rfc9457.html">IETF, RFC 9457, Problem Details for HTTP APIs, 2023</a> : structure des erreurs HTTP ; aucune API HTTP n'est implémentée dans ce laboratoire.</li>
<li><a href="https://opentelemetry.io/docs/concepts/signals/traces/">OpenTelemetry, Traces</a> : identifiants et relations entre spans ; distincts de l'identité métier.</li>
<li><a href="https://sre.google/workbook/implementing-slos/">Google SRE Workbook, Implementing SLOs</a> : distinction objectif, indicateur et budget d'erreur. Les valeurs utilisées sont fictives.</li>
<li><a href="https://genai.owasp.org/llmrisk/llm062025-excessive-agency/">OWASP, LLM06:2025 Excessive Agency</a> : limites des outils et permissions ; ne constitue pas une certification de sécurité.</li></ul>
<p>Cadre pédagogique : objectifs observables, productions techniques, critères explicites et traces de révision. Les compétences VCLF restent des repères internes ; les correspondances détaillées aux référentiels européens relèvent d'un travail distinct.</p></section>'''
body=intro+(D/'core.html').read_text()+(D/'engineering.html').read_text()+lab_intro+code+'</section>'+(D/'practice.html').read_text()+extra_refs+'<section data-voce-count="bibliography">'+(D/'references.html').read_text()+'</section>'
s=(D/'shell.html').read_text().replace('<!-- VOCE_AI001_CONTENT -->',body)
def schema(m):
 d=json.loads(m[1])
 if d.get('@type')=='Course':
  d.update(version='0.6.0',dateModified='2026-10-25',educationalLevel='Ingénieurs et architectes logiciels',coursePrerequisites='Python, transactions SQL, HTTP, lecture de journaux')
  d.pop('timeRequired',None)
 return '<script type="application/ld+json">'+json.dumps(d,ensure_ascii=False).replace('</','<\\/')+'</script>'
s=re.sub(r'<script type="application/ld\+json">(.*?)</script>',schema,s,flags=re.S)
s=s.replace('Comprendre pourquoi un modèle ne suffit pas à un service : états, preuves, pannes et reprise, avec deux cas complets corrigés.','Architecture des services IA pour ingénieurs : transactions, idempotence, reprise après panne et laboratoire Python testé.')
# Scoped overflow rules for executable examples; existing header/footer and fonts retained.
s=s.replace('</head>','<style>.course-written pre{max-width:100%;overflow-x:auto;padding:1rem;background:#f3f1e8;white-space:pre}.course-written code{overflow-wrap:anywhere}.course-written details{margin-block:1rem}</style></head>')
(R/'cours/modele-et-systeme.html').write_text(s)
print('Rendered VOCE-AI-001 only.')
