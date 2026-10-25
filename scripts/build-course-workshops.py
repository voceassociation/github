"""Render the 120 versioned French learning sequences without changing their routes."""
from pathlib import Path
import json,re,html,hashlib
R=Path(__file__).resolve().parents[1]
# Hand-authored long editions must never be overwritten by the historical capsule renderer.
if (R/'content/courses/engineering/manifest.json').exists():
 raise SystemExit('Stopped before writes: engineered editions exist. Use scripts/build-engineering-course.py for VOCE-AI-001; migrate other courses explicitly. The legacy 0.4 renderer would overwrite reviewed content.')
E=html.escape
registry=json.loads((R/'data/voce-vclf-public.json').read_text())
units={}
for pillar in ['ai','art','cog']:
 for line in (R/f'content/courses/{pillar}-workshops.txt').read_text().splitlines():
  if not line:continue
  n,heading,mechanism,case,answer,transfer=line.split('|')
  units[f'VOCE-{pillar.upper()}-{n}']=dict(heading=heading,mechanism=mechanism,case=case,answer=answer,transfer=transfer)
assert len(units)==120
depth={}
for pillar in ['ai','art','cog']:
 for line in (R/f'content/courses/{pillar}-depth.txt').read_text().splitlines():
  n,heading,demonstration,transfer_answer,criterion,reading=line.split('|')
  depth[f'VOCE-{pillar.upper()}-{n}']=dict(heading=heading,demonstration=demonstration,transfer_answer=transfer_answer,criterion=criterion,reading=reading)
assert set(depth)==set(units)
supplement=json.loads((R/'content/courses/reference-additions.json').read_text())
for ref in supplement['references']:
 if not any(x['id']==ref['id'] for x in registry['references']):registry['references'].append(ref)
for course in registry['courses']:
 for rid in supplement['course_additions'].get(course['id'],[]):
  if rid not in course['references']:course['references'].append(rid)
  ref=next(x for x in registry['references'] if x['id']==rid)
  if course['id'] not in ref.setdefault('course_ids',[]):ref['course_ids'].append(course['id'])
refs={x['id']:x for x in registry['references']}
method={
'AI':('Un dossier de décision technique','Présentez les composants, les états et les frontières de responsabilité. Séparez la sortie proposée par un modèle de l’action effectivement exécutée. Pour chaque contrôle, indiquez son emplacement, sa condition de déclenchement et la preuve observable. Un prompt prudent ne remplace pas un refus appliqué par le service.','Une matrice de contrôle comportant entrée, règle, résultat attendu, preuve et propriétaire; les calculs détaillés lorsqu’ils sont pertinents.'),
'ART':('Un dossier documentaire contradictoire','Séparez l’objet, ses représentations et les documents qui le décrivent. Conservez le vocabulaire exact des sources lorsqu’il détermine le degré de certitude. Distinguez observation matérielle, interprétation et hypothèse. Toute relation proposée doit pouvoir être révisée sans effacer l’état documentaire précédent.','Une table comportant proposition, source, date, force de la preuve, interprétation concurrente et recherche nécessaire; une notice destinée au public.'),
'COG':('Une analyse méthodologique examinable','Définissez le construit étudié, la mesure, la population et la comparaison. Distinguez effet estimé, incertitude et pertinence pratique. Une mesure de groupe ne devient pas automatiquement une prédiction individuelle. Les termes diagnostic, causalité et efficacité demandent des preuves spécifiques.','Une grille comportant hypothèse, variable, mesure, biais possible, contrôle proposé et limite; une conclusion proportionnée aux données.')}
foundations=json.loads((R/'content/courses/foundations.json').read_text())
def foundation_key(c):
 n=int(c['id'].rsplit('-',1)[1])
 if c['pillar']=='AI':return 'systems' if n<=10 else 'engineering' if n<=16 else 'models' if n<=23 else 'retrieval' if n<=37 else 'governance' if n<=45 else 'operations'
 if c['pillar']=='ART':return 'art_history' if n<=5 else 'conservation' if n<=13 else 'heritage_data' if n<=20 else 'heritage_decisions'
 return 'research_methods' if n<=10 else 'learning' if n<=19 else 'measurement'
report=[]
for c in registry['courses']:
 if c['id'] not in units:continue
 u=units[c['id']];d=depth[c['id']];p=R/(c['url'].split('https://voce.life/')[1]+'.html');old=p.read_text()
 # Keep source provenance, existing identity, route, navigation and publication status.
 original=re.search(r'<section><h2>Le cours</h2>(.*?)</section>',old,re.S)
 if original:
  baseline=original.group(1)
 else:
  baseline=''
 # Persist initial concept exactly once so builds remain reproducible.
 basefile=R/'content/courses'/f'{c["id"]}-baseline.html'
 if not basefile.exists():basefile.write_text(baseline)
 baseline=basefile.read_text()
 if c['id']=='VOCE-AI-016':baseline=re.sub(r'^<p>.*?</p>', '<p>Le rapprochement entre matériaux, procédés et production industrielle sert ici de cadre pédagogique. La notice de formation Tsinghua citée au registre n’a pas pu être revérifiée; aucune caractéristique précise de ce programme n’est déduite de cette référence.</p>', baseline, count=1)
 title,approach,deliverable=method[c['pillar']]
 def para(t):return '<p>'+E(t)+'</p>'
 def section(t,s):return '<section><h2>'+E(t)+'</h2>'+s+'</section>'
 body='<div class="courses-eyebrow">'+c['id']+' · Version pédagogique 0.4.0 · 18 octobre 2026</div><h1>'+E(c['title'])+'</h1>'
 body+=para('Accès libre · Séquence de travail: 35 à 45 minutes estimées, comprenant lecture, analyse, production et correction. Durée à confirmer par un pilote; adaptez le temps à votre rythme.')
 body+=section('Objectif professionnel',para(c['objective'])+para('Production attendue: '+deliverable))
 body+=section('Parcours de travail', '<ol><li>Comprendre et reformuler le mécanisme: 8 minutes.</li><li>Construire le dossier du cas et vérifier les hypothèses: 12 minutes.</li><li>Traiter la variante de transfert et examiner une référence: 10 à 15 minutes.</li><li>Comparer au corrigé et réviser la production: 5 à 10 minutes.</li></ol>'+para('Ces temps organisent une activité complète. La seule lecture de la page est plus courte. Conservez votre première réponse avant de consulter la correction; une production de 400 à 600 mots, ou un tableau et son commentaire d’une précision équivalente, permet de rendre le raisonnement examinable.'))
 body+=section('Le mécanisme',para(u['mechanism'])+baseline)
 body+=section(d['heading'],para(d['demonstration'])+para('Démonstration pédagogique: les données ajoutées à titre d’exemple ne sont pas des résultats empiriques.'))
 body+='<details><summary>Repères méthodologiques communs</summary>'+''.join(para(t) for t in foundations[foundation_key(c)])+'</details>'
 body+=section(title,para(approach)+para('Travaillez d’abord avec les informations effectivement fournies. Énumérez séparément les hypothèses nécessaires, en précisant lesquelles changeraient la décision. Si une donnée manque, formulez une conclusion conditionnelle ou une demande de preuve. Une valeur inventée ne doit jamais devenir une observation.'))
 body+=section('Cas professionnel: consolidation guidée',para('Situation fictive conçue pour l’apprentissage; les chiffres ne décrivent ni une étude ni un client réel.')+para(u['case'])+'<ol><li>Définissez la décision ou la proposition à examiner et son périmètre.</li><li>Construisez la production attendue avec les données du cas. Montrez les calculs et les unités, ou reliez chaque affirmation à une observation.</li><li>Présentez au moins une interprétation concurrente. Indiquez la donnée qui permettrait de la départager.</li><li>Rédigez une recommandation de 120 à 180 mots avec ses conditions de validité. Précisez ce qui reste impossible à conclure.</li></ol>')
 body+=section('Transfert à une situation nouvelle',para(u['transfer'])+para('Répondez avant d’ouvrir le corrigé. Modifiez explicitement votre dossier initial: quelle règle reste valable, quelle hypothèse tombe et quelle preuve supplémentaire devient nécessaire? Une réponse qui répète simplement la conclusion du premier cas ne démontre pas le transfert.'))
 body+=section('Travail sur les références',para(d['reading'])+para('L’objectif documentaire est de soutenir ou de limiter la conclusion suivante: '+c['objective']+'.')+para('Choisissez ci-dessous la source dont le périmètre correspond directement au mécanisme étudié. Identifiez sa section, sa version et sa date; relevez une proposition précise et expliquez son lien avec une étape de votre production. Indiquez également une conclusion que cette source ne permet pas de soutenir. Les portails généraux et programmes de formation constituent des points d’entrée, non une preuve scientifique du cas.')+para('Si le texte intégral est inaccessible ou sous licence, ne prétendez pas l’avoir vérifié. Consignez la limite, identifiez le document ou la section à obtenir et rédigez votre conclusion sous cette réserve. Les calculs et situations fictives restent des constructions pédagogiques VOCE.'))
 body+='<details class="course-correction"><summary>Ouvrir le corrigé argumenté</summary>'+'<h2>Correction du cas</h2>'+para(u['answer'])+'<h2>Correction du transfert</h2>'+para(d['transfer_answer'])+'</details>'
 body+=section('Évaluer puis réviser', para('Critère propre à ce module: '+d['criterion'])+'<ul><li>4 points: analyse du mécanisme, calculs ou relations documentaires corrects.</li><li>3 points: justification de la décision par des données et des hypothèses explicites.</li><li>2 points: traitement réel de la variante, avec une conclusion adaptée.</li><li>1 point: référence précise et limite de portée correctement identifiées.</li></ul>'+para('Repère interne proposé: 8/10 sans erreur critique. Une preuve inventée, une causalité non démontrée, une unité erronée décisive ou un droit supposé sans fondement imposent une reprise. Ce barème sert à l’autoévaluation; il n’atteste pas à lui seul une compétence acquise.')+para('Après comparaison, corrigez votre dossier dans une seconde version et ajoutez un court journal: erreur repérée, effet sur la conclusion, correction et vérification restante. Conservez les deux versions seulement si vous avez réellement effectué l’activité.'))
 sourcehtml=''
 for rid in c['references']:
  r=refs[rid]
  sourcehtml+='<div class="course-reference">'+para(r['title'])+'<p><a href="'+E(r['url'],quote=True)+'">Consulter la source '+E(rid)+'</a></p>'+para('Nature: '+r.get('nature','Non précisée')+'. Version: '+r.get('version','À vérifier')+'.')+para('Portée du registre: '+r.get('applicability','À préciser')+'. Vérification documentaire enregistrée: '+r.get('verification_date','non renseignée')+'.')+para(r.get('verification_scope',''))+'</div>'
 body+=section('Références et portée',sourcehtml+para('Les compétences VCLF sont des repères internes. Aucun alignement supplémentaire avec ESCO, e-CF ou un niveau de qualification n’est déduit automatiquement de cette réécriture. Les statuts de vérification ci-dessus restent ceux du registre; ils ne constituent pas une nouvelle lecture intégrale de chaque source.'))
 body+=section('Version et provenance',para('Compétence: '+c['competence_id']+'. Réécriture et cas complémentaires: VOCE Association avec assistance IA, 18 octobre 2026. Le socle documentaire antérieur et ses réserves sont conservés. Relecture indépendante et mesure des durées auprès d’apprenants: à réaliser.'))
 new=re.sub(r'(<article class="course-written">).*?(</article>)',lambda m:m[1]+body+m[2],old,flags=re.S)
 def schema_update(m):
  d=json.loads(m[1]);d.update(version='0.4.0',dateModified='2026-10-18',learningResourceType='Module avec étude de cas',educationalUse='Étude, production autonome et autoévaluation');d.pop('timeRequired',None)
  return '<script type="application/ld+json">'+json.dumps(d,ensure_ascii=False).replace('</','<\\/')+'</script>'
 new=re.sub(r'<script type="application/ld\+json">(.*?)</script>',schema_update,new,flags=re.S)
 # Keep duration estimates out of schema timeRequired until observed.
 new=re.sub(r'· Version 0\.[23]\.0','· Version 0.4.0',new)
 new=re.sub(r'<p>Lecture indicative de la section pédagogique:.*?</p>', '<p>Temps de travail prévu: 35 à 45 minutes, lecture, production et correction incluses. Estimation pédagogique à confirmer au pilote.</p>', new, flags=re.S)
 p.write_text(new)
 c['version']='0.4.0';c['date_modified']='2026-10-18';c['planned_learning_minutes']={'min':35,'max':45,'basis':'Learning design estimate, not observed duration; includes written work and correction'}
 c['assessment_id']=c['id']+'-CASE-20261018';c['content_source']='content/courses/'+c['pillar'].lower()+'-workshops.txt'
 c['depth_source']='content/courses/'+c['pillar'].lower()+'-depth.txt'
 c['history']=c.get('history',[])
 if not any(h.get('version')=='0.4.0' for h in c['history']):c['history'].append({'version':'0.4.0','date':'2026-10-18','change':'Distinct worked demonstration, specific transfer correction and success criterion, targeted source guidance; stable URL and status'})
 report.append({'id':c['id'],'url':c['url'],'distinct_depth_words':sum(len(d[k].split()) for k in ['demonstration','transfer_answer','criterion','reading']),'words_rendered':len(re.sub('<[^>]+>',' ',body).split()),'planned_minutes':[35,45],'timing_validated':False,'reference_review':'existing scope preserved','sha256':hashlib.sha256(new.encode()).hexdigest()})
registry['version']='0.4.0';registry['revision_date']='2026-10-18'
(R/'data/voce-vclf-public.json').write_text(json.dumps(registry,ensure_ascii=False,indent=2)+'\n')
# Modify only stale catalogue descriptions, preserving the approved Medici mission.
p=R/'cours.html';s=p.read_text();s=s.replace('Capsule en développement','Module en développement')
s=re.sub(r'<p class="courses-access">.*?</p>', '<p class="courses-access">120 modules en accès libre. Chaque séquence associe compréhension, cas professionnel, travail sur les références et correction. Prévoir 35 à 45 minutes de travail actif par module; les durées sont des estimations pédagogiques à confirmer auprès des apprenants.</p>',s,flags=re.S)
s=s.replace('Trois piliers, 120 modules gratuits avec exercices, corrigés et références documentées. Version de travail relue, sans certification.','120 modules en accès libre: intelligence artificielle, art et cognition. Cas professionnels, exercices, corrigés et références documentées.')
p.write_text(s)
p=R/'sitemap.xml';s=p.read_text()
for c in registry['courses']:
 if c['id'] not in units:continue
 pat=r'<url>\s*<loc>'+re.escape(c['url'])+r'</loc>.*?</url>'
 s=re.sub(pat,'<url><loc>'+c['url']+'</loc><lastmod>2026-10-18</lastmod></url>',s,flags=re.S)
p.write_text(s)
(R/'docs/education/course-rewrite-audit.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print('Rendered',len(report),'modules;',min(x['words_rendered'] for x in report),'to',max(x['words_rendered'] for x in report),'words including guidance and references.')
