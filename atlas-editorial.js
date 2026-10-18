// Editorial presentation is dated separately from the underlying graph.
export const ATLAS_PRESENTATION_UPDATED_AT = '2026-10-18';
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const root = lang => lang === 'en' ? '/atlas' : `/${lang}/atlas`;
const label = (node, lang) => node?.i18n?.[lang]?.label || node?.label || '';
const summary = (node, lang) => node?.i18n?.[lang]?.summary || node?.summary || '';

export const ATLAS_EDITORIAL_COPY = {
  fr: {
    title:"VOCE Atlas | Voir les liens qui éclairent vos décisions.",
    description:"Explorez les relations entre intelligence artificielle, travail, santé et culture. Atlas rassemble les connaissances VOCE dans une carte documentée: partez d’une question, suivez les liens et retrouvez les sources qui permettent d’approfondir votre réflexion.",
    kicker:"VOCE Atlas · Cartographie des savoirs",
    heading:"Voir les liens qui éclairent vos décisions.",
    deck:"Explorez les relations entre intelligence artificielle, travail, santé et culture. Atlas rassemble les connaissances VOCE dans une carte documentée: partez d’une question, suivez les liens et retrouvez les sources qui permettent d’approfondir votre réflexion.",
    eyebrow:'Parcours de lecture', dossiers:"Une question. Un parcours pour l’examiner.",
    intro:"Choisir un système d’IA, comprendre son pouvoir d’action, examiner les effets sur le travail ou la perception du luxe: choisissez votre point de départ. Chaque parcours donne accès aux relations documentées et à leurs sources.",
    open:'Examiner le parcours →',
    paths:[
      ['procurement','permissions','Gouvernance et achat d’IA','Du choix d’un système à ses autorisations: quels éléments demander au fournisseur, puis vérifier dans le déploiement ?'],
      ['agents','identity','Identité et capacité d’action','Quel lien documenté relie un agent à son identité technique ? Identifier la dépendance avant d’examiner les contrôles.'],
      ['ai-assistance','ownership','Travail et appropriation','Comment examiner les liens entre assistance, effort cognitif et sentiment d’appropriation d’un travail ?'],
      ['luxury','visual-complexity','Culture et perception','Que permet de dire le dossier sur la complexité visuelle et la perception du luxe, dans le contexte étudié ?']
    ],
    services:'Poursuivre l’examen', applied:'Applied · Comparer les capacités documentées', legis:'LEGIS · Analyse contractuelle en bêta', help:'LEGIS · Accès gratuit aux droits',
    context:'Contexte du dossier', review:'À vérifier avant un usage professionnel',
    scope:'Les liens de preuve renvoient aux dossiers VOCE. Consultez leurs références primaires et leur périmètre avant de retenir une conclusion ou de l’appliquer à une situation.',
    related:'Relations à examiner dans le même contexte', cite:'Citer ce dossier', graph:'Version du graphe', record:'Identifiant', data:'Consulter les données du graphe',
    questions:{
      technical_dependency:'Dans le système envisagé, où cette dépendance s’applique-t-elle et qui peut en démontrer le contrôle ? La présence d’un composant ne prouve pas à elle seule la maîtrise de l’ensemble.',
      correlation:'La population, la mesure et le contexte de la source correspondent-ils au cas examiné ? Une association ne permet pas de prédire un résultat individuel ni d’attribuer une cause.',
      shared_mechanism:'Le mécanisme décrit est-il documenté dans le contexte envisagé ? Précisez les étapes intermédiaires et les explications concurrentes avant de transposer le résultat.',
      human_consequence:'Quelles personnes et quelles conditions sont couvertes par la source ? Examinez la mesure de l’effet et ses limites avant d’en tirer une décision concernant d’autres personnes.',
      direct_evidence:'Quel énoncé exact la source soutient-elle, pour quelle période et quel périmètre ? Distinguez ce constat de toute extrapolation au dossier examiné.'
    }
  },
  en: {
    title:"VOCE Atlas | See the connections behind your decisions.",
    description:"Explore the relationships between artificial intelligence, work, health and culture. Atlas brings VOCE knowledge into a documented map: start with a question, follow the connections and return to the sources that deepen your understanding.",
    kicker:"VOCE Atlas · Mapping knowledge", heading:"See the connections behind your decisions.",
    deck:"Explore the relationships between artificial intelligence, work, health and culture. Atlas brings VOCE knowledge into a documented map: start with a question, follow the connections and return to the sources that deepen your understanding.",
    eyebrow:'Reading paths', dossiers:"A question. A path to explore it.",
    intro:"Choose an AI system, understand its authority, examine effects on work or the perception of luxury: select your starting point. Each path opens documented relationships and their sources.", open:'Examine the path →',
    paths:[
      ['procurement','permissions','AI governance and procurement','From choosing a system to its permissions: what should a supplier document, and what should the deployment demonstrate?'],
      ['agents','identity','Identity and action','Which documented relation connects an agent to its technical identity? Identify the dependency before examining the controls.'],
      ['ai-assistance','ownership','Work and ownership','How can we examine the links between assistance, cognitive effort and psychological ownership of work?'],
      ['luxury','visual-complexity','Culture and perception','What does the record support about visual complexity and luxury perception, within the studied context?']
    ],
    services:'Continue the review', applied:'Applied · Compare documented capabilities', legis:'LEGIS · Contract analysis beta', help:'LEGIS · Free access to legal guidance',
    context:'Record context', review:'Questions before professional use',
    scope:'Evidence links lead to VOCE records. Consult their primary references and scope before adopting a conclusion or applying it to a situation.',
    related:'Relations to examine in the same context', cite:'Cite this record', graph:'Graph version', record:'Identifier', data:'Read the graph data',
    questions:{
      technical_dependency:'Where does this dependency apply in the proposed system, and who can demonstrate its control? The presence of one component does not establish control of the whole system.',
      correlation:'Do the source population, measurements and context match the case being examined? An association cannot predict an individual result or establish a cause.',
      shared_mechanism:'Is the described mechanism documented in the intended context? Specify intermediary steps and competing explanations before transferring a finding.',
      human_consequence:'Which people and conditions does the source cover? Examine how the effect was measured and its limits before using it to inform decisions about other people.',
      direct_evidence:'Which precise statement does the source support, for which period and scope? Distinguish that finding from extrapolation to the case under review.'
    }
  },
  it: {
    title:"VOCE Atlas | Vedere i legami che illuminano le vostre decisioni.",
    description:"Esplorate le relazioni tra intelligenza artificiale, lavoro, salute e cultura. Atlas riunisce i saperi VOCE in una mappa documentata: partite da una domanda, seguite i collegamenti e ritrovate le fonti per approfondire la riflessione.",
    kicker:"VOCE Atlas · Cartografia dei saperi", heading:"Vedere i legami che illuminano le vostre decisioni.",
    deck:"Esplorate le relazioni tra intelligenza artificiale, lavoro, salute e cultura. Atlas riunisce i saperi VOCE in una mappa documentata: partite da una domanda, seguite i collegamenti e ritrovate le fonti per approfondire la riflessione.",
    eyebrow:'Percorsi di lettura', dossiers:"Una domanda. Un percorso per esaminarla.",
    intro:"Scegliere un sistema IA, comprenderne il potere d’azione, esaminare gli effetti sul lavoro o sulla percezione del lusso: scegliete il punto di partenza. Ogni percorso apre relazioni documentate e le relative fonti.", open:'Esamina il percorso →',
    paths:[
      ['procurement','permissions','Governance e acquisto di IA','Dalla scelta di un sistema alle sue autorizzazioni: cosa deve documentare il fornitore e cosa deve dimostrare l’implementazione?'],
      ['agents','identity','Identità e capacità di azione','Quale relazione documentata collega un agente alla sua identità tecnica? Individuare la dipendenza prima di esaminare i controlli.'],
      ['ai-assistance','ownership','Lavoro e appropriazione','Come esaminare i legami tra assistenza, sforzo cognitivo e senso di appropriazione del lavoro?'],
      ['luxury','visual-complexity','Cultura e percezione','Cosa sostiene il dossier sulla complessità visiva e sulla percezione del lusso, nel contesto studiato?']
    ],
    services:'Proseguire l’esame', applied:'Applied · Confrontare le capacità documentate', legis:'LEGIS · Analisi contrattuale in beta', help:'LEGIS · Accesso gratuito ai diritti',
    context:'Contesto del dossier', review:'Domande prima dell’uso professionale',
    scope:'I collegamenti alle prove rimandano ai dossier VOCE. Consultare i riferimenti primari e il loro perimetro prima di adottare una conclusione o applicarla a una situazione.',
    related:'Relazioni da esaminare nello stesso contesto', cite:'Citare questo dossier', graph:'Versione del grafo', record:'Identificativo', data:'Consultare i dati del grafo',
    questions:{
      technical_dependency:'Dove si applica questa dipendenza nel sistema previsto e chi può dimostrarne il controllo? La presenza di un componente non dimostra il controllo dell’intero sistema.',
      correlation:'La popolazione, le misure e il contesto della fonte corrispondono al caso esaminato? Un’associazione non permette di prevedere un risultato individuale o attribuire una causa.',
      shared_mechanism:'Il meccanismo descritto è documentato nel contesto previsto? Precisare passaggi intermedi e spiegazioni alternative prima di trasferire il risultato.',
      human_consequence:'Quali persone e condizioni sono coperte dalla fonte? Esaminare la misura dell’effetto e i suoi limiti prima di informare decisioni su altre persone.',
      direct_evidence:'Quale enunciato preciso sostiene la fonte, per quale periodo e perimetro? Distinguere questo dato da un’estrapolazione al caso esaminato.'
    }
  }
};

export function renderAtlasDossiers(lang = 'en') {
  const ui = ATLAS_EDITORIAL_COPY[lang] || ATLAS_EDITORIAL_COPY.en;
  const prefix = lang === 'en' ? '' : `/${lang}`;
  const help = {en:'/legis/help',fr:'/fr/legis/aide',it:'/it/legis/aiuto'}[lang] || '/legis/help';
  return `<section class="atlas-dossiers" aria-labelledby="atlas-dossiers-title"><div class="wrap">
    <div class="eyebrow">${ui.eyebrow}</div><h2 id="atlas-dossiers-title">${ui.dossiers}</h2><p class="atlas-dossiers-intro">${ui.intro}</p>
    <div class="atlas-dossier-grid">${ui.paths.map(([from,to,title,question],i) => `<article class="atlas-dossier"><span class="atlas-dossier-number">0${i+1}</span><h3>${esc(title)}</h3><p>${esc(question)}</p><a href="${root(lang)}?from=${from}&amp;to=${to}#atlas-pathfinder">${ui.open}</a></article>`).join('')}</div>
    <nav class="atlas-review-links" aria-label="${ui.services}"><span>${ui.services}</span><a href="${prefix}/applied">${ui.applied}</a><a href="${prefix}/legis">${ui.legis}</a><a href="${help}">${ui.help}</a></nav>
  </div></section>`;
}

export function renderAtlasRelationContext(atlas, edge, lang = 'en') {
  const ui = ATLAS_EDITORIAL_COPY[lang] || ATLAS_EDITORIAL_COPY.en;
  const nodes = new Map(atlas.nodes.map(node => [node.id,node]));
  const endpoints = [nodes.get(edge.source),nodes.get(edge.target)].filter(Boolean);
  const neighbours = atlas.edges.filter(item => item.id !== edge.id && endpoints.some(node => item.source === node.id || item.target === node.id)).slice(0,6);
  const canonical = `https://voce.life${root(lang)}/relations/${edge.id}`;
  return `<section class="chapter atlas-record-context"><div class="chapter-no">${ui.context}</div>
    <div class="atlas-context-grid">${endpoints.map(node => `<article><h2><a href="${root(lang)}/${esc(node.id)}">${esc(label(node,lang))}</a></h2><p>${esc(summary(node,lang))}</p></article>`).join('')}</div>
    <h2>${ui.review}</h2><p>${esc(ui.questions[edge.semantic_type] || ui.questions.direct_evidence)}</p><p class="atlas-scope-note">${ui.scope}</p>
    ${neighbours.length ? `<h3>${ui.related}</h3><ul class="atlas-related-records">${neighbours.map(item => `<li><a href="${root(lang)}/relations/${esc(item.id)}">${esc(label(nodes.get(item.source),lang))} ↔ ${esc(label(nodes.get(item.target),lang))}</a></li>`).join('')}</ul>` : ''}
    <details class="atlas-citation"><summary>${ui.cite}</summary><p>VOCE Association. ${esc(label(endpoints[0],lang))} ↔ ${esc(label(endpoints[1],lang))}. VOCE Atlas. ${ui.record}: ${esc(edge.id)}. ${ui.graph}: ${esc(atlas.generated_at || '2026-10-06')}. <a href="${canonical}">${canonical}</a></p><a href="/data/atlas.json">${ui.data}</a></details>
  </section>`;
}
