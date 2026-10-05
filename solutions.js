(() => {
  const root = document.getElementById("applied-solutions");
  if (!root) return;
  const lang = ["fr","it"].includes(document.documentElement.lang) ? document.documentElement.lang : "en";
  const UI = {
    en:{
      all:"All",search:"Search a solution or use case",verified:"Verified",official:"Official source",evidence:"VOCE evidence",fit:"Best fit",caution:"Deployment note",autonomy:"Autonomy",empty:"No solution matches these filters.",registry:"solutions",proofs:"VOCE publications",read:"Read VOCE →",
      independence:"Inclusion is documentary, not a recommendation, certification or commercial ranking. Documentation coverage measures public evidence, not product quality.",
      compare:"Institutional comparison",profile:"Institutional profile",availability:"Availability",deployment:"Deployment",residency:"Data boundary",identity:"Identity & access",audit:"Auditability",interfaces:"Interfaces",pricing:"Pricing",security:"Security",coverage:"Documentation",sources:"Official evidence",
      documented:"Documented",partial:"Partial",notPublic:"Not publicly documented",suiteDependent:"Suite / region dependent",productDependent:"Product dependent",notApplicable:"Not applicable",contactSales:"Contact sales",publicPricing:"Public pricing",market:"Market available",
      capAll:"All profiles",capResidency:"Residency documented",capAudit:"Audit trail",capInterface:"API / MCP",capPricing:"Public pricing",capMarket:"Available now",capChina:"China",capOpen:"Open / open-weight",capSelfHost:"Self-hostable",capCommercialOpen:"Commercial open use",origin:"Origin",openness:"Openness",license:"License",selfHost:"Self-hosting",commercialUse:"Commercial use",openRelease:"Open release",targetedBeta:"Targeted beta",deploymentControlled:"Deployment-controlled",restricted:"Restricted",openWeights:"Downloadable weights",subscription:"Subscription",permitted:"Permitted",conditional:"Conditional",authorizationRequired:"Authorisation required",verifyCheckpoint:"Verify checkpoint",unknown:"Not public"
    },
    fr:{
      all:"Tous",search:"Rechercher une solution ou un usage",verified:"Vérifié",official:"Source officielle",evidence:"Preuves VOCE",fit:"Usage pertinent",caution:"Point de déploiement",autonomy:"Autonomie",empty:"Aucune solution ne correspond à ces filtres.",registry:"solutions",proofs:"publications VOCE",read:"Lire VOCE →",
      independence:"La présence dans ce registre est documentaire: elle ne constitue ni recommandation, ni certification, ni classement commercial. La couverture documentaire mesure les preuves publiques, pas la qualité du produit.",
      compare:"Comparaison institutionnelle",profile:"Profil institutionnel",availability:"Disponibilité",deployment:"Déploiement",residency:"Frontière des données",identity:"Identité & accès",audit:"Auditabilité",interfaces:"Interfaces",pricing:"Tarification",security:"Sécurité",coverage:"Documentation",sources:"Preuves officielles",
      documented:"Documenté",partial:"Partiel",notPublic:"Non documenté publiquement",suiteDependent:"Dépend du produit / de la région",productDependent:"Dépend du produit",notApplicable:"Non applicable",contactSales:"Sur devis",publicPricing:"Tarif public",market:"Disponible",capAll:"Tous les profils",capResidency:"Résidence documentée",capAudit:"Traçabilité",capInterface:"API / MCP",capPricing:"Tarif public",capMarket:"Disponible maintenant",capChina:"Chine",capOpen:"Open / open-weight",capSelfHost:"Auto-hébergeable",capCommercialOpen:"Usage commercial ouvert",origin:"Origine",openness:"Ouverture",license:"Licence",selfHost:"Auto-hébergement",commercialUse:"Usage commercial",openRelease:"Publication ouverte",targetedBeta:"Bêta ciblée",deploymentControlled:"Contrôlé par le déploiement",restricted:"Restreint",openWeights:"Poids téléchargeables",subscription:"Abonnement",permitted:"Permis",conditional:"Conditionnel",authorizationRequired:"Autorisation requise",verifyCheckpoint:"Vérifier le checkpoint",unknown:"Non public"
    },
    it:{
      all:"Tutti",search:"Cerca una soluzione o un caso d'uso",verified:"Verificato",official:"Fonte ufficiale",evidence:"Evidenze VOCE",fit:"Uso pertinente",caution:"Nota di deployment",autonomy:"Autonomia",empty:"Nessuna soluzione corrisponde a questi filtri.",registry:"soluzioni",proofs:"pubblicazioni VOCE",read:"Leggi VOCE →",
      independence:"La presenza nel registro è documentaria: non costituisce raccomandazione, certificazione o classifica commerciale. La copertura documentale misura le evidenze pubbliche, non la qualità del prodotto.",
      compare:"Confronto istituzionale",profile:"Profilo istituzionale",availability:"Disponibilità",deployment:"Deployment",residency:"Confine dei dati",identity:"Identità & accesso",audit:"Auditabilità",interfaces:"Interfacce",pricing:"Prezzi",security:"Sicurezza",coverage:"Documentazione",sources:"Evidenze ufficiali",
      documented:"Documentato",partial:"Parziale",notPublic:"Non documentato pubblicamente",suiteDependent:"Dipende da suite / regione",productDependent:"Dipende dal prodotto",notApplicable:"Non applicabile",contactSales:"Su preventivo",publicPricing:"Prezzo pubblico",market:"Disponibile",capAll:"Tutti i profili",capResidency:"Residenza documentata",capAudit:"Audit trail",capInterface:"API / MCP",capPricing:"Prezzo pubblico",capMarket:"Disponibile ora",capChina:"Cina",capOpen:"Open / open-weight",capSelfHost:"Self-hostable",capCommercialOpen:"Uso commerciale aperto",origin:"Origine",openness:"Apertura",license:"Licenza",selfHost:"Self-hosting",commercialUse:"Uso commerciale",openRelease:"Release aperta",targetedBeta:"Beta mirata",deploymentControlled:"Controllato dal deployment",restricted:"Limitato",openWeights:"Pesi scaricabili",subscription:"Abbonamento",permitted:"Consentito",conditional:"Condizionale",authorizationRequired:"Autorizzazione richiesta",verifyCheckpoint:"Verificare checkpoint",unknown:"Non pubblico"
    }
  }[lang];
  const sectorLabels = {
    en:{legal:"Legal & compliance",hr:"Human resources",finance:"Finance & accounting",culture:"Museums & culture",marketing:"Marketing & communications",banking:"Banking & insurance",healthops:"Healthcare operations",it:"IT, software & cyber",cross:"Cross-functional"},
    fr:{legal:"Juridique & conformité",hr:"Ressources humaines",finance:"Finance & comptabilité",culture:"Musées & culture",marketing:"Marketing & communication",banking:"Banque & assurance",healthops:"Opérations de santé",it:"IT, logiciel & cyber",cross:"Transversal"},
    it:{legal:"Legale & conformità",hr:"Risorse umane",finance:"Finanza & contabilità",culture:"Musei & cultura",marketing:"Marketing & comunicazione",banking:"Banca & assicurazioni",healthops:"Operazioni sanitarie",it:"IT, software & cyber",cross:"Trasversale"}
  }[lang];
  const layerLabels = {
    en:{vertical:"Specialist product","professional-foundation":"Professional foundation","enterprise-suite":"Enterprise suite","enterprise-workflow":"Enterprise workflow","agent-platform":"Agent platform","build-platform":"Build platform","foundation-model":"Foundation model","open-model":"Open / open-weight model","creative-media":"Creative media","vertical-infrastructure":"Vertical infrastructure","vertical-tools":"Specialist tools",cyber:"Cybersecurity","legacy-execution":"Legacy execution"},
    fr:{vertical:"Produit métier","professional-foundation":"Fondation professionnelle","enterprise-suite":"Suite entreprise","enterprise-workflow":"Workflow entreprise","agent-platform":"Plateforme d'agents","build-platform":"Plateforme de construction","foundation-model":"Modèle fondation","open-model":"Modèle open / open-weight","creative-media":"Média créatif","vertical-infrastructure":"Infrastructure métier","vertical-tools":"Outils métier",cyber:"Cybersécurité","legacy-execution":"Exécution legacy"},
    it:{vertical:"Prodotto verticale","professional-foundation":"Fondazione professionale","enterprise-suite":"Suite enterprise","enterprise-workflow":"Workflow enterprise","agent-platform":"Piattaforma agenti","build-platform":"Piattaforma di sviluppo","foundation-model":"Foundation model","open-model":"Modello open / open-weight","creative-media":"Media creativo","vertical-infrastructure":"Infrastruttura verticale","vertical-tools":"Strumenti verticali",cyber:"Cybersecurity","legacy-execution":"Esecuzione legacy"}
  }[lang];

  const filters = root.querySelector("#solution-filters");
  const diligenceFilters = root.querySelector("#solution-diligence-filters");
  const cards = root.querySelector("#solution-cards");
  const comparison = root.querySelector("#solution-comparison");
  const search = root.querySelector("#solution-search");
  const evidence = root.querySelector("#solution-evidence");
  const count = root.querySelector("#solution-count");
  const evidenceCount = root.querySelector("#solution-evidence-count");
  const independence = root.querySelector("#solution-independence");
  let data = null;
  let sector = "all";
  let capability = "all";

  function esc(value){
    return String(value == null ? "" : value).replace(/[&<>"']/g,function(ch){
      return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch];
    });
  }
  function localizedSolution(s){
    const local = s.i18n && s.i18n[lang] ? s.i18n[lang] : null;
    return {use_cases:local&&local.use_cases?local.use_cases:s.use_cases,fit:local&&local.fit?local.fit:s.fit,caution:local&&local.caution?local.caution:s.caution};
  }
  function statusLabel(value){
    const v=String(value||"").toLowerCase();
    if(["documented","ga","commercial","ga_api","service","commercial_addon"].includes(v)) return UI.documented;
    if(["documented_partial","partial","mixed","ga_varies","ga_with_previews","early_access","acquisition_pending","engagement_defined","service_deliverable","supported_application_layer","ecosystem","plugin_ecosystem","flex_credits","public_partial","public_usage","source_available"].includes(v)) return UI.partial;
    if(v==="open_release") return UI.openRelease;
    if(v==="targeted_beta") return UI.targetedBeta;
    if(v==="deployment_controlled") return UI.deploymentControlled;
    if(v==="license_restricted") return UI.restricted;
    if(v==="open_weights") return UI.openWeights;
    if(v==="subscription") return UI.subscription;
    if(["suite_dependent"].includes(v)) return UI.suiteDependent;
    if(["product_dependent"].includes(v)) return UI.productDependent;
    if(["not_applicable"].includes(v)) return UI.notApplicable;
    if(["not_public","not_assessed"].includes(v)) return UI.notPublic;
    if(["public"].includes(v)) return UI.publicPricing;
    if(["contact_sales"].includes(v)) return UI.contactSales;
    return value || UI.unknown;
  }
  function coverageLabel(v){
    if(v==="high") return lang==="fr"?"Élevée":lang==="it"?"Alta":"High";
    if(v==="medium") return lang==="fr"?"Moyenne":lang==="it"?"Media":"Medium";
    return lang==="fr"?"Limitée":lang==="it"?"Limitata":"Limited";
  }
  function yesNoStatus(ok){return ok?UI.documented:UI.notPublic;}
  function commercialUseLabel(value){
    if(value==="permitted") return UI.permitted;
    if(value==="conditional") return UI.conditional;
    if(value==="authorization_required") return UI.authorizationRequired;
    if(value==="verify_checkpoint") return UI.verifyCheckpoint;
    if(value==="commercial_service") return UI.market;
    return value||UI.unknown;
  }
  function hasAudit(i){return !!(i&&i.auditability&&((i.auditability.controls||[]).length||["documented","partial","service_deliverable"].includes(i.auditability.status)));}
  function hasInterface(i){
    if(!i) return false;
    const joined=(i.interfaces||[]).join(" ").toLowerCase();
    const m=i.mcp&&i.mcp.status;
    return /api|mcp|a2a/.test(joined)||!["not_public","not_applicable",undefined].includes(m);
  }
  function hasResidency(i){return !!(i&&i.data_residency&&["documented","documented_partial","deployment_controlled"].includes(i.data_residency.status));}
  function isMarket(i){return !!(i&&i.availability&&!["early_access","acquisition_pending","targeted_beta","not_public"].includes(i.availability.status));}
  function capabilityOk(s){
    const i=s.institutional||{};
    if(capability==="residency") return hasResidency(i);
    if(capability==="audit") return hasAudit(i);
    if(capability==="interface") return hasInterface(i);
    if(capability==="pricing") return !!(i.pricing&&i.pricing.public);
    if(capability==="market") return isMarket(i);
    if(capability==="china") return s.origin_country==="China";
    if(capability==="open") return ["open_weight","code_and_weights","open_weight_custom_license","open_weight_and_toolkit","source_available_restricted"].includes(s.openness);
    if(capability==="selfhost") return s.self_hosting===true;
    if(capability==="commercialopen") return s.self_hosting===true && s.commercial_use==="permitted";
    return true;
  }
  function currentFiltered(){
    const q=(search.value||"").trim().toLowerCase();
    return data.solutions.filter(function(s){
      const t=localizedSolution(s),i=s.institutional||{};
      const sectorOk=sector==="all"||s.sectors.includes(sector);
      const hay=[s.vendor,s.product,s.layer,s.autonomy,s.origin_country,s.openness,s.license,s.commercial_use,JSON.stringify(i)].concat(s.sectors.map(function(x){return sectorLabels[x]||x;}),t.use_cases,[t.fit,t.caution]).join(" ").toLowerCase();
      return sectorOk&&capabilityOk(s)&&(!q||hay.includes(q));
    });
  }
  function renderFilters(){
    const list=[{id:"all",label:UI.all}].concat(data.sectors.map(function(item){return{id:item.id,label:sectorLabels[item.id]||item.id};}));
    filters.innerHTML=list.map(function(item){return '<button type="button" class="solution-filter'+(sector===item.id?' is-active':'')+'" data-sector="'+esc(item.id)+'">'+esc(item.label)+'</button>';}).join("");
    filters.querySelectorAll("[data-sector]").forEach(function(btn){btn.addEventListener("click",function(){sector=btn.dataset.sector;renderFilters();renderAll();});});
    const caps=[["all",UI.capAll],["china",UI.capChina],["open",UI.capOpen],["selfhost",UI.capSelfHost],["commercialopen",UI.capCommercialOpen],["residency",UI.capResidency],["audit",UI.capAudit],["interface",UI.capInterface],["pricing",UI.capPricing],["market",UI.capMarket]];
    diligenceFilters.innerHTML=caps.map(function(item){return '<button type="button" class="solution-filter solution-filter--diligence'+(capability===item[0]?' is-active':'')+'" data-capability="'+item[0]+'">'+item[1]+'</button>';}).join("");
    diligenceFilters.querySelectorAll("[data-capability]").forEach(function(btn){btn.addEventListener("click",function(){capability=btn.dataset.capability;renderFilters();renderAll();});});
  }
  function proofLinks(ids){
    return (ids||[]).map(function(id){
      const e=data.evidence.find(function(item){return item.id===id;});
      if(!e)return "";
      return '<a href="'+esc(e.path)+'"><span>'+esc(e.date)+'</span><strong>'+esc(e.title)+'</strong><i>'+UI.read+'</i></a>';
    }).join("");
  }
  function institutionalProfile(s){
    const i=s.institutional||{};
    const deployment=(i.deployment||[]).join(" · ")||UI.unknown;
    const residency=i.data_residency||{};
    const identity=i.identity_access||{};
    const audit=i.auditability||{};
    const interfaces=(i.interfaces||[]).slice(0,8).join(" · ")||UI.unknown;
    const pricing=i.pricing||{};
    const certs=(i.security_certifications||[]).join(" · ")||UI.unknown;
    const sources=(i.source_urls||[]).map(function(url,idx){return '<a href="'+esc(url)+'" target="_blank" rel="noopener">'+UI.official+' '+(idx+1)+' ↗</a>';}).join("");
    const selfHosting=s.self_hosting===true?(lang==="fr"?"Oui":lang==="it"?"Sì":"Yes"):(lang==="fr"?"Non":lang==="it"?"No":"No");
    const openness=[s.openness,s.license].filter(Boolean).join(" · ")||UI.unknown;
    return '<div class="solution-diligence-grid">'
      +'<div><b>'+UI.origin+'</b><span>'+esc(s.origin_country||UI.unknown)+'</span></div>'
      +'<div><b>'+UI.openness+'</b><span>'+esc(openness)+'</span><small>'+UI.selfHost+': '+selfHosting+'</small></div>'
      +'<div><b>'+UI.availability+'</b><span>'+esc(statusLabel(i.availability&&i.availability.status))+'</span><small>'+esc(i.availability&&i.availability.detail||"")+'</small></div>'
      +'<div><b>'+UI.deployment+'</b><span>'+esc(deployment)+'</span></div>'
      +'<div><b>'+UI.residency+'</b><span>'+esc(statusLabel(residency.status))+'</span><small>'+esc(residency.detail||"")+'</small></div>'
      +'<div><b>'+UI.identity+'</b><span>'+esc(statusLabel(identity.status))+'</span><small>'+esc((identity.controls||[]).join(" · "))+'</small></div>'
      +'<div><b>'+UI.audit+'</b><span>'+esc(statusLabel(audit.status))+'</span><small>'+esc((audit.controls||[]).join(" · "))+'</small></div>'
      +'<div><b>'+UI.interfaces+'</b><span>'+esc(interfaces)+'</span></div>'
      +'<div><b>'+UI.pricing+'</b><span>'+esc(statusLabel(pricing.status))+'</span><small>'+esc(pricing.detail||"")+'</small></div>'
      +'<div><b>'+UI.security+'</b><span>'+esc(certs)+'</span></div>'
      +'<div><b>'+UI.coverage+'</b><span>'+esc(coverageLabel(i.documentation_coverage))+'</span><small>'+esc((i.source_urls||[]).length+" "+UI.sources.toLowerCase())+'</small></div>'
      +'</div><div class="solution-source-links">'+sources+'</div>';
  }
  function renderCards(filtered){
    count.textContent=filtered.length+" "+UI.registry;
    if(!filtered.length){cards.innerHTML='<p class="solution-empty">'+UI.empty+'</p>';return;}
    cards.innerHTML=filtered.map(function(s){
      const t=localizedSolution(s);
      const sectorBadges=s.sectors.map(function(x){return '<span>'+esc(sectorLabels[x]||x)+'</span>';}).join("");
      const useCases=t.use_cases.map(function(x){return '<li>'+esc(x)+'</li>';}).join("");
      const official=s.official_sources&&s.official_sources[0]?'<a class="solution-official" href="'+esc(s.official_sources[0])+'" target="_blank" rel="noopener">'+UI.official+' ↗</a>':"";
      return '<article class="solution-card">'
        +'<div class="solution-card-head"><div><div class="solution-layer">'+esc(layerLabels[s.layer]||s.layer)+'</div><h3>'+esc(s.product)+'</h3><p class="solution-vendor">'+esc(s.vendor)+'</p></div><div class="solution-sectors">'+sectorBadges+'</div></div>'
        +'<ul class="solution-usecases">'+useCases+'</ul>'
        +'<div class="solution-notes"><p><b>'+UI.fit+'</b>'+esc(t.fit)+'</p><p><b>'+UI.autonomy+'</b>'+esc(s.autonomy)+'</p><p><b>'+UI.caution+'</b>'+esc(t.caution)+'</p></div>'
        +'<div class="solution-card-meta"><span>'+UI.verified+': '+esc(s.verified_at)+'</span>'+official+'</div>'
        +'<details class="solution-diligence"><summary>'+UI.profile+'</summary>'+institutionalProfile(s)+'</details>'
        +'<details class="solution-proof"><summary>'+UI.evidence+' · '+(s.voce_evidence||[]).length+'</summary><div class="solution-proof-list">'+proofLinks(s.voce_evidence)+'</div></details>'
        +'</article>';
    }).join("");
  }
  function tableCell(value,cls){return '<td'+(cls?' class="'+cls+'"':'')+'>'+value+'</td>';}
  function renderComparison(filtered){
    const rows=filtered.map(function(s){
      const i=s.institutional||{},pricing=i.pricing||{},res=i.data_residency||{},ident=i.identity_access||{};
      const interfaceText=hasInterface(i)?(i.mcp&&i.mcp.status&&!["not_public","not_applicable"].includes(i.mcp.status)?"MCP / API":"API / integrations"):UI.unknown;
      return '<tr>'
        +'<th scope="row"><strong>'+esc(s.product)+'</strong><small>'+esc(s.vendor)+'</small></th>'
        +tableCell(esc(layerLabels[s.layer]||s.layer))
        +tableCell(esc(s.origin_country||UI.unknown),s.origin_country==="China"?"is-documented":"")
        +tableCell(esc((s.openness||UI.unknown)+(s.license?" · "+s.license:"")),s.self_hosting?"is-documented":"")
        +tableCell(esc((s.self_hosting?(lang==="fr"?"Oui":lang==="it"?"Sì":"Yes"):(lang==="fr"?"Non":lang==="it"?"No":"No"))+" · "+commercialUseLabel(s.commercial_use)),s.self_hosting&&s.commercial_use==="permitted"?"is-documented":"")
        +tableCell(esc(statusLabel(res.status)),hasResidency(i)?"is-documented":"")
        +tableCell(esc(statusLabel(ident.status)),ident.status==="documented"?"is-documented":"")
        +tableCell(esc(hasAudit(i)?UI.documented:UI.notPublic),hasAudit(i)?"is-documented":"")
        +tableCell(esc(interfaceText),hasInterface(i)?"is-documented":"")
        +tableCell(esc(pricing.public?UI.publicPricing:statusLabel(pricing.status)),pricing.public?"is-documented":"")
        +tableCell(esc(statusLabel(i.availability&&i.availability.status)),isMarket(i)?"is-documented":"")
        +tableCell(esc(coverageLabel(i.documentation_coverage)))
        +'</tr>';
    }).join("");
    comparison.innerHTML='<div class="solution-comparison-title"><strong>'+UI.compare+'</strong><span>'+filtered.length+' '+UI.registry+'</span></div><div class="solution-table-scroll"><table><thead><tr><th>Solution</th><th>'+UI.profile+'</th><th>'+UI.origin+'</th><th>'+UI.license+'</th><th>'+UI.selfHost+' / '+UI.commercialUse+'</th><th>'+UI.residency+'</th><th>'+UI.identity+'</th><th>'+UI.audit+'</th><th>API / MCP</th><th>'+UI.pricing+'</th><th>'+UI.availability+'</th><th>'+UI.coverage+'</th></tr></thead><tbody>'+rows+'</tbody></table></div>';
  }
  function renderEvidence(){
    evidenceCount.textContent=data.evidence.length+" "+UI.proofs;
    evidence.innerHTML=data.evidence.map(function(e){return '<a class="solution-evidence-row" href="'+esc(e.path)+'"><span>'+esc(e.date)+'</span><strong>'+esc(e.title)+'</strong><small>'+e.sectors.map(function(x){return esc(sectorLabels[x]||x);}).join(" · ")+'</small></a>';}).join("");
  }
  function renderAll(){
    const filtered=currentFiltered();
    renderCards(filtered);
    renderComparison(filtered);
  }

  fetch("/data/applied-solutions.json",{headers:{accept:"application/json"}})
    .then(function(r){if(!r.ok)throw new Error("registry unavailable");return r.json();})
    .then(function(json){
      data=json;
      independence.textContent=UI.independence;
      search.placeholder=UI.search;
      renderFilters();
      renderAll();
      renderEvidence();
      search.addEventListener("input",renderAll);
    })
    .catch(function(){cards.innerHTML='<p class="solution-empty">Registry unavailable.</p>';});
})();