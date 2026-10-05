(() => {
  const root=document.getElementById("conformance-app");
  if(!root) return;
  const lang=["fr","it"].includes(document.documentElement.lang)?document.documentElement.lang:"en";
  const T={
    en:{
      notAssessed:"Not assessed",notApplicable:"Not applicable",absent:"Absent",declared:"Declared",documented:"Documented",tested:"Tested",verified_in_operation:"Verified in operation",
      maturity:"Agent maturity",criticalGaps:"Critical gaps",applicable:"Applicable controls",targetsMet:"Controls at target evidence",local:"Stored locally in this browser",
      reset:"Reset assessment",export:"Export evidence record",print:"Print / PDF",evidence:"Expected evidence",owner:"Expected owner",target:"Target evidence",
      critical:"Critical",major:"Major",standard:"Standard",notes:"Evidence reference or note",naReason:"Reason not applicable",
      selfOnly:"This public tool creates a Self Assessment. Reviewed and Observed status can only be issued after VOCE specialist review.",
      nothing:"No controls match the selected maturity and filter.",allDomains:"All domains",gapsOnly:"Critical gaps only",
      privacy:"No assessment data is transmitted to VOCE by this page. Browser storage is local to this device/profile.",
      confirmReset:"Reset all locally stored assessment data?",normative:"Normative control text · English",
      cockpit:"Executive cockpit",cockpitDeck:"A board view of authority, evidence depth and the domains that can still stop deployment.",
      board:"Board",risk:"Risk",technology:"Technology",auditLens:"Audit",posture:"Operating posture",evidenceSignature:"Evidence signature",
      domainMap:"Orchestration map",criticalPath:"Critical path",noLensGaps:"No unresolved critical control in this lens.",openControl:"Open control",
      linkedin:"Share on LinkedIn",copyLink:"Copy share link",copied:"Link copied",share:"Share",lensFocus:"Lens focus",freshness:"Assessment freshness",never:"Not yet assessed",
      verdictProgress:"No critical authority gap is open, but evidence has not yet reached the target state across all applicable controls.",
      verdictReady:"Applicable controls currently meet their target evidence state. Re-open the assessment after any material change."
    },
    fr:{
      notAssessed:"Non évalué",notApplicable:"Non applicable",absent:"Absent",declared:"Déclaré",documented:"Documenté",tested:"Testé",verified_in_operation:"Vérifié en exploitation",
      maturity:"Maturité agentique",criticalGaps:"Écarts critiques",applicable:"Contrôles applicables",targetsMet:"Contrôles au niveau de preuve cible",local:"Stocké localement dans ce navigateur",
      reset:"Réinitialiser",export:"Exporter le dossier de preuves",print:"Imprimer / PDF",evidence:"Preuves attendues",owner:"Responsable attendu",target:"Niveau de preuve cible",
      critical:"Critique",major:"Majeur",standard:"Standard",notes:"Référence de preuve ou note",naReason:"Motif de non-applicabilité",
      selfOnly:"Cet outil public produit une auto-évaluation. Les statuts Revue VOCE et Observation en exploitation ne peuvent être attribués qu’après examen par des spécialistes VOCE.",
      nothing:"Aucun contrôle ne correspond au niveau et au filtre sélectionnés.",allDomains:"Tous les domaines",gapsOnly:"Écarts critiques seulement",
      privacy:"Aucune donnée d’évaluation n’est transmise à VOCE par cette page. Le stockage reste local à ce navigateur et à cet appareil.",
      confirmReset:"Réinitialiser toutes les données locales de cette évaluation?",normative:"Texte normatif du contrôle · anglais",
      cockpit:"Cockpit exécutif",cockpitDeck:"Une lecture conseil d’administration de l’autorité, de la profondeur des preuves et des domaines qui peuvent encore bloquer le déploiement.",
      board:"Conseil",risk:"Risques",technology:"Technologie",auditLens:"Audit",posture:"Posture opérationnelle",evidenceSignature:"Signature des preuves",
      domainMap:"Carte d’orchestration",criticalPath:"Chemin critique",noLensGaps:"Aucun contrôle critique non résolu dans cette lecture.",openControl:"Ouvrir le contrôle",
      linkedin:"Partager sur LinkedIn",copyLink:"Copier le lien de partage",copied:"Lien copié",share:"Partager",lensFocus:"Lecture",freshness:"Fraîcheur de l’évaluation",never:"Pas encore évalué",
      verdictProgress:"Aucun écart critique d’autorité n’est ouvert, mais tous les contrôles applicables n’ont pas encore atteint leur niveau de preuve cible.",
      verdictReady:"Les contrôles applicables atteignent actuellement leur niveau de preuve cible. L’évaluation doit être rouverte après tout changement matériel."
    },
    it:{
      notAssessed:"Non valutato",notApplicable:"Non applicabile",absent:"Assente",declared:"Dichiarato",documented:"Documentato",tested:"Testato",verified_in_operation:"Verificato in esercizio",
      maturity:"Maturità agentica",criticalGaps:"Scostamenti critici",applicable:"Controlli applicabili",targetsMet:"Controlli al livello di evidenza richiesto",local:"Memorizzato localmente in questo browser",
      reset:"Reimposta valutazione",export:"Esporta il fascicolo delle evidenze",print:"Stampa / PDF",evidence:"Evidenze attese",owner:"Responsabile atteso",target:"Livello di evidenza richiesto",
      critical:"Critico",major:"Maggiore",standard:"Standard",notes:"Riferimento dell’evidenza o nota",naReason:"Motivo di non applicabilità",
      selfOnly:"Questo strumento pubblico produce un’autovalutazione. Gli stati Revisione VOCE e Osservazione in esercizio possono essere attribuiti solo dopo l’esame da parte di specialisti VOCE.",
      nothing:"Nessun controllo corrisponde al livello e al filtro selezionati.",allDomains:"Tutti i domini",gapsOnly:"Solo scostamenti critici",
      privacy:"Nessun dato della valutazione viene trasmesso a VOCE da questa pagina. I dati restano memorizzati localmente nel browser e nel dispositivo.",
      confirmReset:"Reimpostare tutti i dati locali di questa valutazione?",normative:"Testo normativo del controllo · inglese",
      cockpit:"Cockpit esecutivo",cockpitDeck:"Una lettura per il consiglio di amministrazione di autorità, profondità delle evidenze e domini che possono ancora bloccare il deployment.",
      board:"Consiglio",risk:"Rischi",technology:"Tecnologia",auditLens:"Audit",posture:"Postura operativa",evidenceSignature:"Firma delle evidenze",
      domainMap:"Mappa di orchestrazione",criticalPath:"Percorso critico",noLensGaps:"Nessun controllo critico irrisolto in questa lettura.",openControl:"Apri il controllo",
      linkedin:"Condividi su LinkedIn",copyLink:"Copia il link di condivisione",copied:"Link copiato",share:"Condividi",lensFocus:"Lettura",freshness:"Aggiornamento della valutazione",never:"Non ancora valutato",
      verdictProgress:"Non risultano scostamenti critici di autorità aperti, ma non tutti i controlli applicabili hanno ancora raggiunto il livello di evidenza richiesto.",
      verdictReady:"I controlli applicabili raggiungono attualmente il livello di evidenza richiesto. La valutazione va riaperta dopo ogni modifica sostanziale."
    }
  }[lang];

  const DOMAIN_LABELS={
    en:{api:"API & tool contracts",mcp:"MCP governance",a2a:"A2A & delegation",identity:"Identity & workload trust",authorization:"Authorization & authority",data:"Data, RAG & memory",observability:"Observability & audit",assurance:"Evaluation & assurance",economics:"Economic authority & FinOps",europe:"European regulatory overlay"},
    fr:{api:"Contrats API et outils",mcp:"Gouvernance MCP",a2a:"A2A et délégation",identity:"Identité et confiance des workloads",authorization:"Autorisation et pouvoir d’action",data:"Données, RAG et mémoire",observability:"Observabilité et audit",assurance:"Évaluation et assurance",economics:"Autorité économique et FinOps",europe:"Cadre réglementaire européen"},
    it:{api:"Contratti API e strumenti",mcp:"Governance MCP",a2a:"A2A e delega",identity:"Identità e fiducia dei workload",authorization:"Autorizzazione e potere d’azione",data:"Dati, RAG e memoria",observability:"Osservabilità e audit",assurance:"Valutazione e assurance",economics:"Autorità economica e FinOps",europe:"Quadro regolatorio europeo"}
  }[lang];
  const MATURITY_LABELS={
    en:{A0:"Assistant",A1:"Tool-connected agent",A2:"Delegated action agent",A3:"Multi-agent operating system",A4:"Critical agent network"},
    fr:{A0:"Assistant",A1:"Agent connecté à des outils",A2:"Agent à autorité déléguée",A3:"Système d’exploitation multi-agents",A4:"Réseau agentique critique"},
    it:{A0:"Assistente",A1:"Agente connesso a strumenti",A2:"Agente con autorità delegata",A3:"Sistema operativo multi-agente",A4:"Rete agentica critica"}
  }[lang];
  const LENSES={board:["authorization","identity","assurance","europe","economics"],risk:["authorization","assurance","europe","data","observability"],technology:["api","mcp","a2a","identity","observability"],audit:["observability","authorization","data","europe","assurance"]};
  const STATE_ORDER={not_assessed:-1,absent:0,declared:1,documented:2,tested:3,verified_in_operation:4};
  const LEVEL_ORDER={A0:0,A1:1,A2:2,A3:3,A4:4};
  const KEY="voce-agent-conformance-v1";
  let data=null;
  let maturity="A2";
  let domain="all";
  let lens="board";
  let gapsOnly=false;
  let saved={};
  let updatedAt=null;
  const esc=v=>String(v==null?"":v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));

  function load(){
    try{
      const x=JSON.parse(localStorage.getItem(KEY)||"{}");
      if(x&&typeof x==="object"){saved=x.controls||{};maturity=x.maturity||"A2";updatedAt=x.updated_at||null;}
    }catch(e){}
  }
  function applyUrlContext(){
    const params=new URLSearchParams(location.search);
    const m=(params.get("maturity")||"").toUpperCase();
    const l=(params.get("lens")||"").toLowerCase();
    const d=(params.get("domain")||"").toLowerCase();
    if(LEVEL_ORDER[m]!==undefined) maturity=m;
    if(LENSES[l]) lens=l;
    if(d==="all"||Object.prototype.hasOwnProperty.call(DOMAIN_LABELS,d)) domain=d;
  }

  function persist(){
    updatedAt=new Date().toISOString();
    localStorage.setItem(KEY,JSON.stringify({schema:1,framework_version:data.version,maturity,updated_at:updatedAt,controls:saved}));
    const stamp=root.querySelector("#conformance-local-state");
    if(stamp) stamp.textContent=T.local+" · "+new Date(updatedAt).toLocaleString();
  }
  function stateOf(id){return saved[id]&&saved[id].state?saved[id].state:"not_assessed";}
  function excluded(id){return !!(saved[id]&&saved[id].not_applicable);}
  function applicable(c){return LEVEL_ORDER[c.min_maturity]<=LEVEL_ORDER[maturity];}
  function meets(c){return excluded(c.id)||STATE_ORDER[stateOf(c.id)]>=STATE_ORDER[c.target_state];}
  function isCriticalGap(c){return applicable(c)&&!excluded(c.id)&&c.criticality==="critical"&&!meets(c);}
  function labelState(s){return T[s]||s;}
  function criticalityLabel(c){return T[c]||c;}

  function domainLabel(id){return DOMAIN_LABELS[id]||data.domains.find(x=>x.id===id)?.name||id;}
  function controlUrl(id){return (lang==="en"?"":"/"+lang)+"/agent-conformance/controls/"+String(id).toLowerCase();}
  function lensUrl(){return (lang==="en"?"":"/"+lang)+"/agent-conformance/lens/"+lens+"/"+maturity.toLowerCase();}
  function evidenceDepth(active){
    const assessed=active.filter(c=>STATE_ORDER[stateOf(c.id)]>=0);
    if(!assessed.length) return 0;
    const total=assessed.reduce((sum,c)=>sum+Math.max(STATE_ORDER[stateOf(c.id)],0),0);
    return Math.round(total/(assessed.length*4)*100);
  }
  function verdict(gaps,active,targets){
    if(gaps.length){
      if(lang==="fr") return gaps.length===1?"1 écart critique d’autorité reste à résoudre avant de considérer cette architecture comme maîtrisée.":gaps.length+" écarts critiques d’autorité restent à résoudre avant de considérer cette architecture comme maîtrisée.";
      if(lang==="it") return gaps.length===1?"Resta 1 scostamento critico di autorità da risolvere prima di considerare l’architettura sotto controllo.":"Restano "+gaps.length+" scostamenti critici di autorità da risolvere prima di considerare l’architettura sotto controllo.";
      return gaps.length+" critical authority gap"+(gaps.length===1?"":"s")+" remain before this architecture can be treated as controlled.";
    }
    return targets.length===active.length&&active.length?T.verdictReady:T.verdictProgress;
  }
  function copyShare(url,button){
    if(navigator.clipboard&&navigator.clipboard.writeText){
      navigator.clipboard.writeText(url).then(()=>{const old=button.textContent;button.textContent=T.copied;setTimeout(()=>button.textContent=old,1600);});
    }
  }
  function bindShare(){
    root.querySelectorAll("[data-linkedin-share]").forEach(btn=>btn.addEventListener("click",()=>{
      const url=new URL(btn.dataset.linkedinShare,location.origin).href;
      window.open("https://www.linkedin.com/sharing/share-offsite/?url="+encodeURIComponent(url),"_blank","noopener,noreferrer");
    }));
    root.querySelectorAll("[data-copy-share]").forEach(btn=>btn.addEventListener("click",()=>copyShare(new URL(btn.dataset.copyShare,location.origin).href,btn)));
    root.querySelectorAll("[data-native-share]").forEach(btn=>btn.addEventListener("click",async()=>{
      const url=new URL(btn.dataset.nativeShare,location.origin).href;
      if(navigator.share){try{await navigator.share({title:"VOCE Agent Conformance",url});}catch(e){}}
      else copyShare(url,btn);
    }));
  }
  function renderCockpit(active,gaps,targets){
    const box=root.querySelector("#cf-vvic-cockpit");
    if(!box) return;
    const lensDomains=LENSES[lens];
    const lensControls=active.filter(c=>lensDomains.includes(c.domain));
    const lensGaps=lensControls.filter(isCriticalGap);
    const lensLabels={board:T.board,risk:T.risk,technology:T.technology,audit:T.auditLens};
    const depth=evidenceDepth(active);
    const stateKeys=["not_assessed","absent","declared","documented","tested","verified_in_operation"];
    const signature=stateKeys.map(k=>{
      const n=active.filter(c=>stateOf(c.id)===k).length;
      return '<div><span style="--w:'+Math.round(n/Math.max(active.length,1)*100)+'%"></span><b>'+n+'</b><small>'+esc(labelState(k))+'</small></div>';
    }).join("");
    const map=data.domains.map(d=>{
      const cs=active.filter(c=>c.domain===d.id),crit=cs.filter(isCriticalGap).length,met=cs.filter(meets).length;
      const pct=cs.length?Math.round(met/cs.length*100):0;
      return '<button type="button" class="cf-orbit-node '+(crit?'has-gap':'')+'" data-domain-jump="'+d.id+'"><b>'+esc(domainLabel(d.id))+'</b><span>'+met+'/'+cs.length+'</span><i style="--p:'+pct+'%"></i></button>';
    }).join("");
    const critical=lensGaps.length?lensGaps.slice(0,5).map(c=>'<a href="'+controlUrl(c.id)+'"><b>'+esc(c.id)+'</b><span>'+esc(c.title)+'</span><em>'+T.openControl+' →</em></a>').join(""):'<p>'+T.noLensGaps+'</p>';
    const shareUrl=lensUrl();
    box.innerHTML='<div class="cf-cockpit-head"><div><span class="eyebrow">'+T.cockpit+'</span><h3>'+esc(MATURITY_LABELS[maturity])+' · '+esc(lensLabels[lens])+'</h3><p>'+T.cockpitDeck+'</p></div>'
      +'<div class="cf-lenses">'+Object.entries(lensLabels).map(([id,label])=>'<button type="button" data-lens="'+id+'" class="'+(lens===id?'is-active':'')+'">'+esc(label)+'</button>').join("")+'</div></div>'
      +'<div class="cf-cockpit-grid"><article class="cf-posture"><span>'+T.posture+'</span><strong>'+gaps.length+'</strong><p>'+esc(verdict(gaps,active,targets))+'</p><small>'+T.freshness+': '+(updatedAt?new Date(updatedAt).toLocaleString():T.never)+'</small></article>'
      +'<article class="cf-signature"><span>'+T.evidenceSignature+'</span><strong>'+depth+'%</strong><div>'+signature+'</div></article>'
      +'<article class="cf-map"><span>'+T.domainMap+'</span><div>'+map+'</div></article>'
      +'<article class="cf-critical-path"><span>'+T.criticalPath+' · '+esc(lensLabels[lens])+'</span><div>'+critical+'</div></article></div>'
      +'<div class="cf-sharebar"><span>'+T.lensFocus+': '+esc(lensLabels[lens])+'</span><button type="button" data-linkedin-share="'+shareUrl+'">'+T.linkedin+'</button><button type="button" data-copy-share="'+shareUrl+'">'+T.copyLink+'</button><button type="button" data-native-share="'+shareUrl+'">'+T.share+'</button></div>';
    box.querySelectorAll("[data-lens]").forEach(btn=>btn.addEventListener("click",()=>{lens=btn.dataset.lens;renderCockpit(active,gaps,targets);}));
    box.querySelectorAll("[data-domain-jump]").forEach(btn=>btn.addEventListener("click",()=>{domain=btn.dataset.domainJump;const d=root.querySelector("#cf-domain");if(d)d.value=domain;renderControls();summary();}));
    bindShare();
  }
  function summary(){
    const applicableControls=data.controls.filter(applicable);
    const active=applicableControls.filter(c=>!excluded(c.id));
    const gaps=active.filter(isCriticalGap);
    const targets=active.filter(meets);
    root.querySelector("#cf-applicable").textContent=String(active.length);
    root.querySelector("#cf-gaps").textContent=String(gaps.length);
    root.querySelector("#cf-targets").textContent=String(targets.length);
    const domainBox=root.querySelector("#cf-domain-status");
    domainBox.innerHTML=data.domains.map(d=>{
      const cs=active.filter(c=>c.domain===d.id);
      const crit=cs.filter(isCriticalGap).length;
      const met=cs.filter(meets).length;
      const cls=crit?"has-gap":(cs.length&&met===cs.length?"is-ready":"");
      return '<button type="button" class="cf-domain-chip '+cls+(domain===d.id?' is-active':'')+'" data-domain="'+d.id+'"><b>'+esc(domainLabel(d.id))+'</b><span>'+met+'/'+cs.length+(crit?' · '+crit+' '+T.criticalGaps.toLowerCase():'')+'</span></button>';
    }).join("");
    domainBox.querySelectorAll("[data-domain]").forEach(btn=>btn.addEventListener("click",()=>{domain=btn.dataset.domain;renderControls();summary();}));
    renderCockpit(active,gaps,targets);
  }
  function renderControls(){
    const container=root.querySelector("#conformance-controls");
    let controls=data.controls.filter(applicable);
    if(domain!=="all") controls=controls.filter(c=>c.domain===domain);
    if(gapsOnly) controls=controls.filter(isCriticalGap);
    if(!controls.length){container.innerHTML='<p class="cf-empty">'+T.nothing+'</p>';return;}
    container.innerHTML=controls.map(c=>{
      const current=stateOf(c.id),na=excluded(c.id),gap=isCriticalGap(c);
      const ev=(c.evidence||[]).map(x=>'<li>'+esc(x)+'</li>').join("");
      const opts=["not_assessed","absent","declared","documented","tested","verified_in_operation"].map(s=>'<option value="'+s+'"'+(current===s?' selected':'')+'>'+esc(labelState(s))+'</option>').join("");
      return '<article class="cf-control '+(gap?'has-critical-gap ':'')+(na?'is-na':'')+'" data-control="'+esc(c.id)+'">'
        +'<div class="cf-control-head"><div><span class="cf-id">'+esc(c.id)+'</span><span class="cf-criticality cf-'+esc(c.criticality)+'">'+esc(criticalityLabel(c.criticality))+'</span></div><span class="cf-min">'+esc(c.min_maturity)+'+</span></div>'
        +'<h3><a href="'+controlUrl(c.id)+'">'+esc(c.title)+'</a></h3><p class="cf-normative">'+T.normative+'</p><p class="cf-question">'+esc(c.question)+'</p>'
        +'<div class="cf-control-meta"><div><b>'+T.owner+'</b><span>'+esc(c.owner)+'</span></div><div><b>'+T.target+'</b><span>'+esc(labelState(c.target_state))+'</span></div></div>'
        +'<details class="cf-evidence"><summary>'+T.evidence+'</summary><ul>'+ev+'</ul></details>'
        +'<div class="cf-inputs"><label><span>'+T.evidence+'</span><select data-state="'+esc(c.id)+'">'+opts+'</select></label>'
        +'<label class="cf-na"><input type="checkbox" data-na="'+esc(c.id)+'"'+(na?' checked':'')+'><span>'+T.notApplicable+'</span></label>'
        +'<label class="cf-note"><span>'+(na?T.naReason:T.notes)+'</span><textarea rows="2" data-note="'+esc(c.id)+'" placeholder="'+esc(na?T.naReason:T.notes)+'">'+esc(saved[c.id]&&saved[c.id].note||"")+'</textarea></label></div>'
        +'</article>';
    }).join("");
    container.querySelectorAll("[data-state]").forEach(el=>el.addEventListener("change",e=>{const id=e.target.dataset.state;saved[id]=saved[id]||{};saved[id].state=e.target.value;persist();renderControls();summary();}));
    container.querySelectorAll("[data-na]").forEach(el=>el.addEventListener("change",e=>{const id=e.target.dataset.na;saved[id]=saved[id]||{};saved[id].not_applicable=e.target.checked;persist();renderControls();summary();}));
    container.querySelectorAll("[data-note]").forEach(el=>el.addEventListener("input",e=>{const id=e.target.dataset.note;saved[id]=saved[id]||{};saved[id].note=e.target.value;persist();}));
  }
  function renderToolbar(){
    const m=root.querySelector("#cf-maturity");
    m.innerHTML=data.maturity_levels.map(x=>'<option value="'+x.level+'"'+(x.level===maturity?' selected':'')+'>'+x.level+' · '+esc(MATURITY_LABELS[x.level]||x.name)+'</option>').join("");
    m.addEventListener("change",()=>{maturity=m.value;domain="all";persist();renderControls();summary();});
    const d=root.querySelector("#cf-domain");
    d.innerHTML='<option value="all">'+T.allDomains+'</option>'+data.domains.map(x=>'<option value="'+x.id+'">'+esc(domainLabel(x.id))+'</option>').join("");
    d.addEventListener("change",()=>{domain=d.value;renderControls();summary();});
    const g=root.querySelector("#cf-gaps-only");
    g.nextElementSibling.textContent=T.gapsOnly;
    g.addEventListener("change",()=>{gapsOnly=g.checked;renderControls();});
    root.querySelector("#cf-self-only").textContent=T.selfOnly;
    root.querySelector("#cf-privacy").textContent=T.privacy;
    root.querySelector("#cf-reset").textContent=T.reset;
    root.querySelector("#cf-export").textContent=T.export;
    root.querySelector("#cf-print").textContent=T.print;
    root.querySelector("#cf-reset").addEventListener("click",()=>{if(confirm(T.confirmReset)){saved={};localStorage.removeItem(KEY);renderControls();summary();persist();}});
    root.querySelector("#cf-print").addEventListener("click",()=>window.print());
    root.querySelector("#cf-export").addEventListener("click",exportAssessment);
  }
  function exportAssessment(){
    const applicableControls=data.controls.filter(applicable);
    const record={
      schema:1,
      framework:"VOCE Agent Conformance",
      framework_version:data.version,
      assessment_mode:"self",
      maturity,
      generated_at:new Date().toISOString(),
      notice:"Self Assessment generated locally. It is not a VOCE Reviewed or Observed conformance result and is not a certification.",
      controls:applicableControls.map(c=>({
        id:c.id,domain:c.domain,criticality:c.criticality,target_state:c.target_state,
        not_applicable:excluded(c.id),state:stateOf(c.id),note:saved[c.id]&&saved[c.id].note||"",
        target_met:meets(c)
      }))
    };
    const blob=new Blob([JSON.stringify(record,null,2)],{type:"application/json"});
    const url=URL.createObjectURL(blob);
    const a=document.createElement("a");
    a.href=url;a.download="voce-agent-conformance-self-assessment-"+new Date().toISOString().slice(0,10)+".json";
    document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),500);
  }

  fetch("/data/agent-conformance.json",{headers:{accept:"application/json"}})
    .then(r=>{if(!r.ok)throw new Error("framework unavailable");return r.json();})
    .then(json=>{data=json;load();applyUrlContext();renderToolbar();renderControls();summary();persist();})
    .catch(()=>{root.querySelector("#conformance-controls").innerHTML='<p class="cf-empty">Conformance framework unavailable.</p>';});
})();