(() => {
  const root = document.getElementById("applied-solutions");
  if (!root) return;
  const lang = ["fr","it"].includes(document.documentElement.lang) ? document.documentElement.lang : "en";
  const UI = {
    en:{all:"All",search:"Search a solution or use case",verified:"Verified",official:"Official source",evidence:"VOCE evidence",fit:"Best fit",caution:"Deployment note",autonomy:"Autonomy",empty:"No solution matches these filters.",registry:"solutions",proofs:"VOCE publications",read:"Read VOCE →",independence:"Inclusion is documentary, not a recommendation, certification or commercial ranking."},
    fr:{all:"Tous",search:"Rechercher une solution ou un usage",verified:"Vérifié",official:"Source officielle",evidence:"Preuves VOCE",fit:"Usage pertinent",caution:"Point de déploiement",autonomy:"Autonomie",empty:"Aucune solution ne correspond à ces filtres.",registry:"solutions",proofs:"publications VOCE",read:"Lire VOCE →",independence:"La présence dans ce registre est documentaire: elle ne constitue ni recommandation, ni certification, ni classement commercial."},
    it:{all:"Tutti",search:"Cerca una soluzione o un caso d'uso",verified:"Verificato",official:"Fonte ufficiale",evidence:"Evidenze VOCE",fit:"Uso pertinente",caution:"Nota di deployment",autonomy:"Autonomia",empty:"Nessuna soluzione corrisponde a questi filtri.",registry:"soluzioni",proofs:"pubblicazioni VOCE",read:"Leggi VOCE →",independence:"La presenza nel registro è documentaria: non costituisce raccomandazione, certificazione o classifica commerciale."}
  }[lang];
  const sectorLabels = {
    en:{legal:"Legal & compliance",hr:"Human resources",finance:"Finance & accounting",culture:"Museums & culture",marketing:"Marketing & communications",banking:"Banking & insurance",healthops:"Healthcare operations",it:"IT, software & cyber",cross:"Cross-functional"},
    fr:{legal:"Juridique & conformité",hr:"Ressources humaines",finance:"Finance & comptabilité",culture:"Musées & culture",marketing:"Marketing & communication",banking:"Banque & assurance",healthops:"Opérations de santé",it:"IT, logiciel & cyber",cross:"Transversal"},
    it:{legal:"Legale & conformità",hr:"Risorse umane",finance:"Finanza & contabilità",culture:"Musei & cultura",marketing:"Marketing & comunicazione",banking:"Banca & assicurazioni",healthops:"Operazioni sanitarie",it:"IT, software & cyber",cross:"Trasversale"}
  }[lang];
  const layerLabels = {
    en:{vertical:"Specialist product","enterprise-suite":"Enterprise suite","enterprise-workflow":"Enterprise workflow","agent-platform":"Agent platform","build-platform":"Build platform","foundation-model":"Foundation model","creative-media":"Creative media","vertical-infrastructure":"Vertical infrastructure","vertical-tools":"Specialist tools",cyber:"Cybersecurity","legacy-execution":"Legacy execution"},
    fr:{vertical:"Produit métier","enterprise-suite":"Suite entreprise","enterprise-workflow":"Workflow entreprise","agent-platform":"Plateforme d'agents","build-platform":"Plateforme de construction","foundation-model":"Modèle fondation","creative-media":"Média créatif","vertical-infrastructure":"Infrastructure métier","vertical-tools":"Outils métier",cyber:"Cybersécurité","legacy-execution":"Exécution legacy"},
    it:{vertical:"Prodotto verticale","enterprise-suite":"Suite enterprise","enterprise-workflow":"Workflow enterprise","agent-platform":"Piattaforma agenti","build-platform":"Piattaforma di sviluppo","foundation-model":"Foundation model","creative-media":"Media creativo","vertical-infrastructure":"Infrastruttura verticale","vertical-tools":"Strumenti verticali",cyber:"Cybersecurity","legacy-execution":"Esecuzione legacy"}
  }[lang];

  const filters = root.querySelector("#solution-filters");
  const cards = root.querySelector("#solution-cards");
  const search = root.querySelector("#solution-search");
  const evidence = root.querySelector("#solution-evidence");
  const count = root.querySelector("#solution-count");
  const evidenceCount = root.querySelector("#solution-evidence-count");
  const independence = root.querySelector("#solution-independence");
  let data = null;
  let sector = "all";

  function esc(value){
    return String(value == null ? "" : value).replace(/[&<>"']/g,function(ch){
      return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch];
    });
  }
  function localizedSolution(s){
    const local = s.i18n && s.i18n[lang] ? s.i18n[lang] : null;
    return {
      use_cases: local && local.use_cases ? local.use_cases : s.use_cases,
      fit: local && local.fit ? local.fit : s.fit,
      caution: local && local.caution ? local.caution : s.caution
    };
  }
  function renderFilters(){
    const list = [{id:"all",label:UI.all}].concat(data.sectors.map(function(item){return {id:item.id,label:sectorLabels[item.id]||item.id};}));
    filters.innerHTML = list.map(function(item){
      return '<button type="button" class="solution-filter'+(sector===item.id?' is-active':'')+'" data-sector="'+esc(item.id)+'">'+esc(item.label)+'</button>';
    }).join("");
    filters.querySelectorAll("[data-sector]").forEach(function(btn){
      btn.addEventListener("click",function(){sector=btn.dataset.sector;renderFilters();renderCards();});
    });
  }
  function proofLinks(ids){
    return (ids||[]).map(function(id){
      const e=data.evidence.find(function(item){return item.id===id;});
      if(!e) return "";
      return '<a href="'+esc(e.path)+'"><span>'+esc(e.date)+'</span><strong>'+esc(e.title)+'</strong><i>'+UI.read+'</i></a>';
    }).join("");
  }
  function renderCards(){
    const q=(search.value||"").trim().toLowerCase();
    const filtered=data.solutions.filter(function(s){
      const t=localizedSolution(s);
      const sectorOk=sector==="all"||s.sectors.includes(sector);
      const hay=[s.vendor,s.product,s.layer,s.autonomy].concat(s.sectors.map(function(x){return sectorLabels[x]||x;}),t.use_cases,[t.fit,t.caution]).join(" ").toLowerCase();
      return sectorOk && (!q || hay.includes(q));
    });
    count.textContent=filtered.length+" "+UI.registry;
    if(!filtered.length){cards.innerHTML='<p class="solution-empty">'+UI.empty+'</p>';return;}
    cards.innerHTML=filtered.map(function(s){
      const t=localizedSolution(s);
      const sectorBadges=s.sectors.map(function(x){return '<span>'+esc(sectorLabels[x]||x)+'</span>';}).join("");
      const useCases=t.use_cases.map(function(x){return '<li>'+esc(x)+'</li>';}).join("");
      const official=s.official_sources && s.official_sources[0] ? '<a class="solution-official" href="'+esc(s.official_sources[0])+'" target="_blank" rel="noopener">'+UI.official+' ↗</a>' : "";
      return '<article class="solution-card">'
        +'<div class="solution-card-head"><div><div class="solution-layer">'+esc(layerLabels[s.layer]||s.layer)+'</div><h3>'+esc(s.product)+'</h3><p class="solution-vendor">'+esc(s.vendor)+'</p></div><div class="solution-sectors">'+sectorBadges+'</div></div>'
        +'<ul class="solution-usecases">'+useCases+'</ul>'
        +'<div class="solution-notes"><p><b>'+UI.fit+'</b>'+esc(t.fit)+'</p><p><b>'+UI.autonomy+'</b>'+esc(s.autonomy)+'</p><p><b>'+UI.caution+'</b>'+esc(t.caution)+'</p></div>'
        +'<div class="solution-card-meta"><span>'+UI.verified+': '+esc(s.verified_at)+'</span>'+official+'</div>'
        +'<details class="solution-proof"><summary>'+UI.evidence+' · '+(s.voce_evidence||[]).length+'</summary><div class="solution-proof-list">'+proofLinks(s.voce_evidence)+'</div></details>'
        +'</article>';
    }).join("");
  }
  function renderEvidence(){
    evidenceCount.textContent=data.evidence.length+" "+UI.proofs;
    evidence.innerHTML=data.evidence.map(function(e){
      return '<a class="solution-evidence-row" href="'+esc(e.path)+'"><span>'+esc(e.date)+'</span><strong>'+esc(e.title)+'</strong><small>'+e.sectors.map(function(x){return esc(sectorLabels[x]||x);}).join(" · ")+'</small></a>';
    }).join("");
  }

  fetch("/data/applied-solutions.json",{headers:{accept:"application/json"}})
    .then(function(r){if(!r.ok)throw new Error("registry unavailable");return r.json();})
    .then(function(json){
      data=json;
      independence.textContent=UI.independence;
      search.placeholder=UI.search;
      renderFilters();
      renderCards();
      renderEvidence();
      search.addEventListener("input",renderCards);
    })
    .catch(function(){
      cards.innerHTML='<p class="solution-empty">Registry unavailable.</p>';
    });
})();