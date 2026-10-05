(() => {
  const root=document.getElementById("conformance-app");
  if(!root) return;
  const lang=["fr","it"].includes(document.documentElement.lang)?document.documentElement.lang:"en";
  const T={
    en:{notAssessed:"Not assessed",notApplicable:"Not applicable",absent:"Absent",declared:"Declared",documented:"Documented",tested:"Tested",verified_in_operation:"Verified in operation",maturity:"Agent maturity",criticalGaps:"Critical gaps",applicable:"Applicable controls",targetsMet:"Controls at target evidence",local:"Stored locally in this browser",reset:"Reset assessment",export:"Export evidence record",print:"Print / PDF",evidence:"Expected evidence",owner:"Expected owner",target:"Target evidence",critical:"Critical",major:"Major",standard:"Standard",notes:"Evidence reference or note",naReason:"Reason not applicable",selfOnly:"This public tool creates a Self Assessment. Reviewed and Observed status can only be issued after VOCE specialist review.",nothing:"No controls match the selected maturity and filter.",allDomains:"All domains",gapsOnly:"Critical gaps only",privacy:"No assessment data is transmitted to VOCE by this page. Browser storage is local to this device/profile.",confirmReset:"Reset all locally stored assessment data?"},
    fr:{notAssessed:"Non évalué",notApplicable:"Non applicable",absent:"Absent",declared:"Déclaré",documented:"Documenté",tested:"Testé",verified_in_operation:"Vérifié en exploitation",maturity:"Maturité agentique",criticalGaps:"Écarts critiques",applicable:"Contrôles applicables",targetsMet:"Contrôles au niveau de preuve cible",local:"Stocké localement dans ce navigateur",reset:"Réinitialiser",export:"Exporter le dossier de preuve",print:"Imprimer / PDF",evidence:"Preuves attendues",owner:"Responsable attendu",target:"Preuve cible",critical:"Critique",major:"Majeur",standard:"Standard",notes:"Référence de preuve ou note",naReason:"Motif de non-applicabilité",selfOnly:"Cet outil public produit un Self Assessment. Les statuts Reviewed et Observed ne peuvent être attribués qu'après revue par des spécialistes VOCE.",nothing:"Aucun contrôle ne correspond au niveau et au filtre sélectionnés.",allDomains:"Tous les domaines",gapsOnly:"Écarts critiques seulement",privacy:"Aucune donnée d'évaluation n'est transmise à VOCE par cette page. Le stockage reste local à ce navigateur/appareil.",confirmReset:"Réinitialiser toutes les données locales de cette évaluation?"},
    it:{notAssessed:"Non valutato",notApplicable:"Non applicabile",absent:"Assente",declared:"Dichiarato",documented:"Documentato",tested:"Testato",verified_in_operation:"Verificato in esercizio",maturity:"Maturità agentica",criticalGaps:"Gap critici",applicable:"Controlli applicabili",targetsMet:"Controlli al livello di evidenza richiesto",local:"Memorizzato localmente in questo browser",reset:"Reimposta assessment",export:"Esporta evidence record",print:"Stampa / PDF",evidence:"Evidenze attese",owner:"Owner atteso",target:"Evidenza target",critical:"Critico",major:"Maggiore",standard:"Standard",notes:"Riferimento evidenza o nota",naReason:"Motivo di non applicabilità",selfOnly:"Questo strumento pubblico produce un Self Assessment. Gli status Reviewed e Observed possono essere attribuiti solo dopo una review da specialisti VOCE.",nothing:"Nessun controllo corrisponde al livello e al filtro selezionati.",allDomains:"Tutti i domini",gapsOnly:"Solo gap critici",privacy:"Nessun dato dell'assessment viene trasmesso a VOCE da questa pagina. Lo storage resta locale a questo browser/dispositivo.",confirmReset:"Reimpostare tutti i dati locali di questo assessment?"}
  }[lang];
  const STATE_ORDER={not_assessed:-1,absent:0,declared:1,documented:2,tested:3,verified_in_operation:4};
  const LEVEL_ORDER={A0:0,A1:1,A2:2,A3:3,A4:4};
  const KEY="voce-agent-conformance-v1";
  let data=null;
  let maturity="A2";
  let domain="all";
  let gapsOnly=false;
  let saved={};
  const esc=v=>String(v==null?"":v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));

  function load(){
    try{
      const x=JSON.parse(localStorage.getItem(KEY)||"{}");
      if(x&&typeof x==="object"){saved=x.controls||{};maturity=x.maturity||"A2";}
    }catch(e){}
  }
  function persist(){
    localStorage.setItem(KEY,JSON.stringify({schema:1,framework_version:data.version,maturity,updated_at:new Date().toISOString(),controls:saved}));
    const stamp=root.querySelector("#conformance-local-state");
    if(stamp) stamp.textContent=T.local+" · "+new Date().toLocaleString();
  }
  function stateOf(id){return saved[id]&&saved[id].state?saved[id].state:"not_assessed";}
  function excluded(id){return !!(saved[id]&&saved[id].not_applicable);}
  function applicable(c){return LEVEL_ORDER[c.min_maturity]<=LEVEL_ORDER[maturity];}
  function meets(c){return excluded(c.id)||STATE_ORDER[stateOf(c.id)]>=STATE_ORDER[c.target_state];}
  function isCriticalGap(c){return applicable(c)&&!excluded(c.id)&&c.criticality==="critical"&&!meets(c);}
  function labelState(s){return T[s]||s;}
  function criticalityLabel(c){return T[c]||c;}
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
      return '<button type="button" class="cf-domain-chip '+cls+(domain===d.id?' is-active':'')+'" data-domain="'+d.id+'"><b>'+esc(d.name)+'</b><span>'+met+'/'+cs.length+(crit?' · '+crit+' '+T.criticalGaps.toLowerCase():'')+'</span></button>';
    }).join("");
    domainBox.querySelectorAll("[data-domain]").forEach(btn=>btn.addEventListener("click",()=>{domain=btn.dataset.domain;renderControls();summary();}));
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
        +'<h3>'+esc(c.title)+'</h3><p class="cf-question">'+esc(c.question)+'</p>'
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
    m.innerHTML=data.maturity_levels.map(x=>'<option value="'+x.level+'"'+(x.level===maturity?' selected':'')+'>'+x.level+' · '+esc(x.name)+'</option>').join("");
    m.addEventListener("change",()=>{maturity=m.value;domain="all";persist();renderControls();summary();});
    const d=root.querySelector("#cf-domain");
    d.innerHTML='<option value="all">'+T.allDomains+'</option>'+data.domains.map(x=>'<option value="'+x.id+'">'+esc(x.name)+'</option>').join("");
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
    .then(json=>{data=json;load();renderToolbar();renderControls();summary();persist();})
    .catch(()=>{root.querySelector("#conformance-controls").innerHTML='<p class="cf-empty">Conformance framework unavailable.</p>';});
})();