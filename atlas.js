(() => {
  const SVG_NS = "http://www.w3.org/2000/svg";
  const pageLang = ["fr","it"].includes(document.documentElement.lang) ? document.documentElement.lang : "en";
  const storedLang = localStorage.getItem("voce-lang");
  if (location.pathname === "/atlas" && ["fr","it"].includes(storedLang)) {
    location.replace("/" + storedLang + "/atlas" + location.hash);
    return;
  }
  localStorage.setItem("voce-lang", pageLang);

  const UI = {
    en:{source:"Source",read:"Read in VOCE →",permanent:"Permanent page →",relationPage:"Relation record →",relation:"relation",relations:"relations",empty:"No documented relation in this curated edition.",noConcept:"No concept in this curated edition.",unavailable:"Atlas unavailable",unavailableText:"The knowledge map could not be loaded. VOCE Academy remains available as the canonical corpus.",openAcademy:"Open VOCE Academy",readCorpus:"Read the corpus →",concepts:"concepts",documented:"documented relations",sourceRecords:"source records",territories:"knowledge territories",directRelations:"direct relations",uniqueSources:"source records",domainsReached:"territories reached",bridgesTitle:"Documentary bridges",bridge:"bridge",bridges:"bridges",bridgesVia:"via",bridgesNote:"Two-step adjacency only. Each leg is documented separately; the bridge does not assert causality.",noBridges:"No two-step documentary bridge from this concept in the current Atlas.",bridgeRecords:"relation records",pathChoose:"Choose a concept",pathResult:"Documented path",pathNone:"No documented path connects these concepts in the current Atlas.",pathSources:"source records",pathTerritories:"territories",pathCrossings:"cross-domain crossings",pathNote:"Atlas traverses graph adjacency in either direction. Relation statements retain their published source-target wording; the route does not establish direction or causality.",mapDirectNote:"Select a node. Directly documented concepts remain visible; unrelated material recedes.",mapBridgeNote:"Bridge lens: two-step documentary adjacencies appear through dashed connections. Proximity does not imply causality."},
    fr:{source:"Source",read:"Lire dans VOCE →",permanent:"Page permanente →",relationPage:"Dossier de relation →",relation:"relation",relations:"relations",empty:"Aucune relation documentée dans cette édition éditoriale.",noConcept:"Aucun concept dans cette édition éditoriale.",unavailable:"Atlas indisponible",unavailableText:"La carte des connaissances n’a pas pu être chargée. VOCE Academy reste accessible comme corpus canonique.",openAcademy:"Ouvrir VOCE Academy",readCorpus:"Lire le corpus →",concepts:"concepts",documented:"relations documentées",sourceRecords:"dossiers sources",territories:"territoires de connaissance",directRelations:"relations directes",uniqueSources:"dossiers sources",domainsReached:"territoires atteints",bridgesTitle:"Ponts documentaires",bridge:"pont",bridges:"ponts",bridgesVia:"via",bridgesNote:"Adjacence en deux étapes uniquement. Chaque segment est documenté séparément; le pont n’affirme aucune causalité.",noBridges:"Aucun pont documentaire en deux étapes depuis ce concept dans l’Atlas actuel.",bridgeRecords:"dossiers de relation",pathChoose:"Choisir un concept",pathResult:"Chemin documenté",pathNone:"Aucun chemin documenté ne relie ces concepts dans l’Atlas actuel.",pathSources:"dossiers sources",pathTerritories:"territoires",pathCrossings:"franchissements inter-domaines",pathNote:"Atlas parcourt l’adjacence du graphe dans les deux sens. Les énoncés de relation conservent leur formulation source-cible publiée; l’itinéraire n’établit ni direction ni causalité.",mapDirectNote:"Sélectionnez un nœud. Les concepts directement documentés restent visibles; le reste s’efface.",mapBridgeNote:"Mode ponts: les adjacences documentaires en deux étapes apparaissent par des connexions pointillées. La proximité n’implique aucune causalité."},
    it:{source:"Fonte",read:"Leggi in VOCE →",permanent:"Pagina permanente →",relationPage:"Scheda della relazione →",relation:"relazione",relations:"relazioni",empty:"Nessuna relazione documentata in questa edizione curatoriale.",noConcept:"Nessun concetto in questa edizione curatoriale.",unavailable:"Atlas non disponibile",unavailableText:"La mappa della conoscenza non è stata caricata. VOCE Academy resta disponibile come corpus canonico.",openAcademy:"Apri VOCE Academy",readCorpus:"Leggi il corpus →",concepts:"concetti",documented:"relazioni documentate",sourceRecords:"record fonte",territories:"territori di conoscenza",directRelations:"relazioni dirette",uniqueSources:"record fonte",domainsReached:"territori raggiunti",bridgesTitle:"Ponti documentari",bridge:"ponte",bridges:"ponti",bridgesVia:"via",bridgesNote:"Solo adiacenza in due passaggi. Ogni segmento è documentato separatamente; il ponte non afferma causalità.",noBridges:"Nessun ponte documentario in due passaggi da questo concetto nell’Atlas attuale.",bridgeRecords:"schede di relazione",pathChoose:"Scegli un concetto",pathResult:"Percorso documentato",pathNone:"Nessun percorso documentato collega questi concetti nell’Atlas attuale.",pathSources:"record fonte",pathTerritories:"territori",pathCrossings:"attraversamenti inter-dominio",pathNote:"Atlas percorre l’adiacenza del grafo in entrambe le direzioni. Gli enunciati di relazione mantengono la formulazione fonte-destinazione pubblicata; il percorso non stabilisce direzione o causalità.",mapDirectNote:"Seleziona un nodo. I concetti documentati direttamente restano visibili; il resto arretra.",mapBridgeNote:"Modalità ponti: le adiacenze documentarie in due passaggi appaiono con connessioni tratteggiate. La prossimità non implica causalità."}
  }[pageLang];

  const map = document.getElementById("atlas-map");
  const panelTitle = document.getElementById("atlas-panel-title");
  const panelSummary = document.getElementById("atlas-panel-summary");
  const panelMeta = document.getElementById("atlas-panel-meta");
  const panelInsight = document.getElementById("atlas-panel-insight");
  const bridgesEl = document.getElementById("atlas-bridges");
  const relationsEl = document.getElementById("atlas-relations");
  const search = document.getElementById("atlas-search");
  const searchResults = document.getElementById("atlas-search-results");
  const domainsEl = document.getElementById("atlas-domains");
  const reset = document.getElementById("atlas-reset");
  const pathFrom = document.getElementById("atlas-path-from");
  const pathTo = document.getElementById("atlas-path-to");
  const pathButton = document.getElementById("atlas-find-path");
  const pathResult = document.getElementById("atlas-path-result");
  const mapNote = document.querySelector(".atlas-map-note");
  const lensButtons = [...document.querySelectorAll("[data-atlas-lens]")];
  const sourceCountEl = document.getElementById("atlas-source-count");
  const domainCountEl = document.getElementById("atlas-domain-count");
  if (!map) return;

  const centers={cross:[600,360],ai:[295,205],work:[210,480],cognition:[880,205],health:[900,520],culture:[500,610]};
  const domainOrder=["ai","work","cognition","health","culture","cross"];
  const mobileDomainHub={ai:"ai-systems",work:"light-workforce",cognition:"cognition",health:"health",culture:"culture"};
  const mobileQuery=window.matchMedia("(max-width: 760px)");
  let data=null, selectedId="human-systems", activeDomain=null, activePath=null, activeLens="direct";
  let nodeEls=new Map(), edgeEls=[];

  document.querySelectorAll(".lang a").forEach(a=>{
    a.addEventListener("click",e=>{
      const href=a.getAttribute("href")||"";
      const targetLang=href.startsWith("/fr/")?"fr":href.startsWith("/it/")?"it":"en";
      localStorage.setItem("voce-lang",targetLang);
      if(location.hash){
        e.preventDefault();
        location.href=href+location.hash;
      }
    });
  });

  function svgEl(name,attrs={}){const el=document.createElementNS(SVG_NS,name);for(const[k,v]of Object.entries(attrs))el.setAttribute(k,String(v));return el}
  function slugHash(id){return "#"+encodeURIComponent(id)}
  function nodeLabel(node){return node?.i18n?.[pageLang]?.label||node?.label||""}
  function nodeSummary(node){return node?.i18n?.[pageLang]?.summary||node?.summary||""}
  function edgeLabel(edge){return edge?.i18n?.[pageLang]||edge?.label||""}
  function domainLabel(id){const d=data.domains.find(x=>x.id===id);return d?.i18n?.[pageLang]||d?.label||id}
  function conceptPath(id){return (pageLang==="en"?"/atlas/":"/"+pageLang+"/atlas/")+encodeURIComponent(id)}
  function relationPath(edge){const id=edge?.id||`${edge?.source||""}--${edge?.target||""}`;return (pageLang==="en"?"/atlas/relations/":"/"+pageLang+"/atlas/relations/")+encodeURIComponent(id)}
  function relationWord(n){return n===1?UI.relation:UI.relations}
  function bridgeWord(n){return n===1?UI.bridge:UI.bridges}
  function uniqueEvidenceUrls(edges){
    return new Set(edges.flatMap(edge=>(edge?.evidence||[]).map(item=>item?.url).filter(Boolean)));
  }
  function edgeOther(edge,id){return edge.source===id?edge.target:edge.source}
  function twoHopBridges(id){
    const directEdges=data.edges.map((edge,index)=>({edge,index})).filter(x=>x.edge.source===id||x.edge.target===id);
    const directNeighbors=new Set(directEdges.map(x=>edgeOther(x.edge,id)));
    const byTarget=new Map();
    for(const first of directEdges){
      const via=edgeOther(first.edge,id);
      data.edges.forEach((second,secondIndex)=>{
        if(secondIndex===first.index||!(second.source===via||second.target===via))return;
        const target=edgeOther(second,via);
        if(target===id||directNeighbors.has(target))return;
        if(!byTarget.has(target))byTarget.set(target,{target,routes:[]});
        const record=byTarget.get(target);
        if(!record.routes.some(r=>r.via===via&&r.edges[0]===first.index&&r.edges[1]===secondIndex)){
          record.routes.push({via,edges:[first.index,secondIndex]});
        }
      });
    }
    return [...byTarget.values()].sort((a,b)=>b.routes.length-a.routes.length||nodeLabel(data.nodes.find(n=>n.id===a.target)).localeCompare(nodeLabel(data.nodes.find(n=>n.id===b.target)),pageLang));
  }
  function bridgeVisualSet(id){
    const bridges=twoHopBridges(id),nodes=new Set(),edges=new Set();
    bridges.forEach(item=>{nodes.add(item.target);item.routes.forEach(route=>route.edges.forEach(index=>edges.add(index)))});
    return{bridges,nodes,edges};
  }
  function updateLensButtons(){
    lensButtons.forEach(btn=>{
      const active=btn.dataset.atlasLens===activeLens;
      btn.classList.toggle("is-active",active);
      btn.setAttribute("aria-pressed",String(active));
    });
    if(mapNote)mapNote.textContent=activeLens==="bridges"?UI.mapBridgeNote:UI.mapDirectNote;
  }

  function assignPositions(){
    const grouped={}; for(const d of domainOrder)grouped[d]=[];
    for(const node of data.nodes)(grouped[node.domain]||=[]).push(node);
    for(const[domain,nodes]of Object.entries(grouped)){
      const center=centers[domain]||centers.cross, byTier={};
      for(const node of nodes)(byTier[node.tier]||=[]).push(node);
      for(const[tierKey,tierNodes]of Object.entries(byTier)){
        const tier=Number(tierKey);
        if(tier===0){tierNodes.forEach((node,i)=>{node.x=center[0]+i*30;node.y=center[1]+i*18});continue}
        const radius=tier===1?18:tier===2?92:158;
        const offset=domain==="ai"?-.55:domain==="cognition"?-.08:domain==="health"?.25:domain==="culture"?.65:0;
        tierNodes.forEach((node,i)=>{const angle=offset+(Math.PI*2*i/Math.max(tierNodes.length,1));node.x=center[0]+Math.cos(angle)*radius;node.y=center[1]+Math.sin(angle)*radius*.72});
      }
    }
  }

  function renderDomains(){
    domainsEl.innerHTML="";
    for(const d of data.domains.filter(d=>d.id!=="cross")){
      const b=document.createElement("button"); b.type="button"; b.className="atlas-domain-chip"; b.dataset.domain=d.id; b.textContent=domainLabel(d.id);
      b.addEventListener("click",()=>{
        if(mobileQuery.matches){const hub=mobileDomainHub[d.id];if(hub)selectNode(hub);searchResults.hidden=true;return}
        activeDomain=activeDomain===d.id?null:d.id;updateVisualState();
      });
      domainsEl.appendChild(b);
    }
  }

  function renderMap(){
    map.querySelectorAll(".atlas-graph-layer").forEach(el=>el.remove()); assignPositions();
    const edgeLayer=svgEl("g",{class:"atlas-graph-layer atlas-edge-layer"}),nodeLayer=svgEl("g",{class:"atlas-graph-layer atlas-node-layer"});map.append(edgeLayer,nodeLayer);
    const nodeById=new Map(data.nodes.map(n=>[n.id,n]));
    edgeEls=data.edges.map((edge,index)=>{const a=nodeById.get(edge.source),b=nodeById.get(edge.target);if(!a||!b)return null;const line=svgEl("line",{x1:a.x,y1:a.y,x2:b.x,y2:b.y,class:"atlas-edge","data-source":edge.source,"data-target":edge.target,"data-index":index});edgeLayer.appendChild(line);return line}).filter(Boolean);
    nodeEls.clear();
    for(const node of data.nodes){
      const labelText=nodeLabel(node),summaryText=nodeSummary(node);
      const g=svgEl("g",{class:`atlas-node atlas-node--tier-${node.tier}`,transform:`translate(${node.x} ${node.y})`,tabindex:"0",role:"button","aria-label":labelText,"data-id":node.id,"data-domain":node.domain});
      const radius=node.tier===0?17:node.tier===1?12:node.tier===2?8:5.5,circle=svgEl("circle",{r:radius,class:"atlas-node-dot"}),title=svgEl("title");title.textContent=labelText+" — "+summaryText;g.append(circle,title);
      const label=svgEl("text",{x:node.x>600?-14:14,y:node.tier<=1?-16:-11,"text-anchor":node.x>600?"end":"start",class:`atlas-node-label${node.tier===3?" atlas-node-label--minor":""}`});label.textContent=labelText;g.appendChild(label);
      g.addEventListener("click",()=>selectNode(node.id));g.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();selectNode(node.id)}});nodeLayer.appendChild(g);nodeEls.set(node.id,g);
    }
  }

  function relationSet(id){const related=new Set([id]),indexes=new Set();data.edges.forEach((e,i)=>{if(e.source===id||e.target===id){related.add(e.source);related.add(e.target);indexes.add(i)}});return{related,indexes}}
  function updateVisualState(){
    const pathNodes=activePath?new Set(activePath.nodes):null,pathEdges=activePath?new Set(activePath.edges):null;
    const{related,indexes}=relationSet(selectedId);
    const bridgeState=!activePath&&activeLens==="bridges"?bridgeVisualSet(selectedId):{nodes:new Set(),edges:new Set()};
    nodeEls.forEach((el,id)=>{
      const node=data.nodes.find(n=>n.id===id),domainDim=activeDomain&&node.domain!==activeDomain&&id!==selectedId;
      const inPath=pathNodes?.has(id)||false,isBridge=!activePath&&activeLens==="bridges"&&bridgeState.nodes.has(id);
      const relationDim=!activePath&&selectedId&&!related.has(id)&&!isBridge;
      el.classList.toggle("is-selected",!activePath&&id===selectedId);
      el.classList.toggle("is-related",!activePath&&related.has(id)&&id!==selectedId);
      el.classList.toggle("is-bridge",isBridge);
      el.classList.toggle("is-path",inPath);
      el.classList.toggle("is-dimmed",activePath?!inPath:(domainDim||relationDim));
    });
    edgeEls.forEach((el,i)=>{
      const edge=data.edges[i],domainVisible=!activeDomain||[edge.source,edge.target].some(id=>data.nodes.find(n=>n.id===id)?.domain===activeDomain);
      const directActive=indexes.has(i)&&domainVisible;
      const bridgeActive=!activePath&&activeLens==="bridges"&&bridgeState.edges.has(i)&&domainVisible;
      const active=activePath?pathEdges.has(i):(directActive||bridgeActive);
      el.classList.toggle("is-active",active&&!bridgeActive);
      el.classList.toggle("is-bridge",bridgeActive&&!directActive);
      el.classList.toggle("is-path",activePath&&pathEdges.has(i));
      el.classList.toggle("is-dimmed",!active);
    });
    document.querySelectorAll(".atlas-domain-chip").forEach(el=>el.classList.toggle("is-active",!activePath&&el.dataset.domain===activeDomain));
  }

  function escapeHTML(value=""){return String(value).replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]))}
  function evidenceHtml(evidence=[]){
    const unique=[],seen=new Set();for(const item of evidence){if(!item?.url||seen.has(item.url))continue;seen.add(item.url);unique.push(item)}
    return unique.map(item=>`<a class="atlas-evidence-link" href="${item.url}"><span>${UI.source}</span><strong>${escapeHTML(item.title)}</strong><i>${UI.read}</i></a>`).join("");
  }

  function renderBridges(id){
    if(!bridgesEl)return;
    if(activeLens!=="bridges"){bridgesEl.hidden=true;bridgesEl.innerHTML="";return}
    const bridges=twoHopBridges(id).slice(0,8);
    bridgesEl.hidden=false;
    if(!bridges.length){bridgesEl.innerHTML=`<div class="atlas-bridges-head"><strong>${UI.bridgesTitle}</strong><span>0 ${UI.bridges}</span></div><p class="atlas-bridges-note">${UI.noBridges}</p>`;return}
    bridgesEl.innerHTML=`<div class="atlas-bridges-head"><strong>${UI.bridgesTitle}</strong><span>${bridges.length} ${bridgeWord(bridges.length)}</span></div><p class="atlas-bridges-note">${UI.bridgesNote}</p>`+bridges.map(item=>{
      const target=data.nodes.find(n=>n.id===item.target),route=item.routes[0],via=data.nodes.find(n=>n.id===route.via);
      const routeEdges=route.edges.map(index=>data.edges[index]).filter(Boolean);
      const recordLinks=routeEdges.map((edge,i)=>`<a href="${relationPath(edge)}">${UI.bridgeRecords} ${i+1}</a>`).join(" · ");
      const alternativeCount=item.routes.length-1;
      return `<article class="atlas-documentary-bridge"><button type="button" data-node="${item.target}"><strong>${escapeHTML(nodeLabel(target)||item.target)}</strong></button><p class="atlas-documentary-bridge-route">${UI.bridgesVia} <b>${escapeHTML(nodeLabel(via)||route.via)}</b>${alternativeCount>0?` · +${alternativeCount} ${bridgeWord(alternativeCount)}`:""}</p><div class="atlas-documentary-bridge-links">${recordLinks}</div></article>`;
    }).join("");
    bridgesEl.querySelectorAll("[data-node]").forEach(btn=>btn.addEventListener("click",()=>selectNode(btn.dataset.node)));
  }

  function renderPanel(id){
    const node=data.nodes.find(n=>n.id===id);if(!node)return;
    const relations=data.edges.filter(e=>e.source===id||e.target===id);
    const reached=new Set(relations.map(edge=>data.nodes.find(n=>n.id===edgeOther(edge,id))?.domain).filter(Boolean));
    const sources=uniqueEvidenceUrls(relations);
    panelTitle.textContent=nodeLabel(node);panelSummary.textContent=nodeSummary(node);
    panelMeta.innerHTML=`<span>${escapeHTML(domainLabel(node.domain))}</span><span>${relations.length} ${relationWord(relations.length)}</span><a class="atlas-concept-link" href="${conceptPath(node.id)}">${UI.permanent}</a>`;
    if(panelInsight)panelInsight.innerHTML=`<div class="atlas-insight-stat"><strong>${relations.length}</strong><span>${UI.directRelations}</span></div><div class="atlas-insight-stat"><strong>${sources.size}</strong><span>${UI.uniqueSources}</span></div><div class="atlas-insight-stat"><strong>${reached.size}</strong><span>${UI.domainsReached}</span></div>`;
    renderBridges(id);
    if(!relations.length){relationsEl.innerHTML=`<p class="atlas-empty">${UI.empty}</p>`;return}
    relationsEl.innerHTML=relations.map(edge=>{
      const source=data.nodes.find(n=>n.id===edge.source),target=data.nodes.find(n=>n.id===edge.target),otherId=edge.source===id?edge.target:edge.source,other=data.nodes.find(n=>n.id===otherId);
      const statement=`${nodeLabel(source)} ${edgeLabel(edge)} ${nodeLabel(target)}`;
      return `<article class="atlas-relation-card"><button type="button" class="atlas-relation-target" data-node="${otherId}"><span>${escapeHTML(domainLabel(other?.domain||""))}</span><strong>${escapeHTML(nodeLabel(other)||otherId)}</strong></button><p>${escapeHTML(statement)}</p><div class="atlas-evidence">${evidenceHtml(edge.evidence)}</div><a class="atlas-relation-permalink" href="${relationPath(edge)}">${UI.relationPage}</a></article>`;
    }).join("");
    relationsEl.querySelectorAll("[data-node]").forEach(btn=>btn.addEventListener("click",()=>selectNode(btn.dataset.node)));
  }

  function renderPathfinder(){
    if(!pathFrom||!pathTo||!pathButton||!pathResult)return;
    const options=[...data.nodes].sort((a,b)=>nodeLabel(a).localeCompare(nodeLabel(b),pageLang)).map(n=>`<option value="${n.id}">${escapeHTML(nodeLabel(n))}</option>`).join("");
    pathFrom.innerHTML=`<option value="">${UI.pathChoose}</option>${options}`;
    pathTo.innerHTML=`<option value="">${UI.pathChoose}</option>${options}`;
  }

  function shortestPath(from,to){
    if(from===to)return{nodes:[from],edges:[]};
    const queue=[from],seen=new Set([from]),prev=new Map();
    while(queue.length){
      const current=queue.shift();
      for(let i=0;i<data.edges.length;i++){
        const edge=data.edges[i];
        let next=null;
        if(edge.source===current)next=edge.target;else if(edge.target===current)next=edge.source;
        if(!next||seen.has(next))continue;
        seen.add(next);prev.set(next,{node:current,edge:i});
        if(next===to){
          const nodes=[to],edges=[];let cursor=to;
          while(cursor!==from){const step=prev.get(cursor);if(!step)return null;edges.unshift(step.edge);cursor=step.node;nodes.unshift(cursor)}
          return{nodes,edges};
        }
        queue.push(next);
      }
    }
    return null;
  }

  function setPathQuery(from,to){
    const url=new URL(location.href);
    if(from&&to){url.searchParams.set("from",from);url.searchParams.set("to",to)}else{url.searchParams.delete("from");url.searchParams.delete("to")}
    history.replaceState(null,"",url.pathname+url.search+url.hash);
  }

  function renderPath(path){
    if(!pathResult)return;
    if(!path){activePath=null;pathResult.hidden=false;pathResult.innerHTML=`<p class="atlas-path-empty">${UI.pathNone}</p>`;updateVisualState();return}
    activePath=path;activeDomain=null;
    const routeEdges=path.edges.map(index=>data.edges[index]).filter(Boolean);
    const sourceCount=uniqueEvidenceUrls(routeEdges).size;
    const territories=new Set(path.nodes.map(id=>data.nodes.find(n=>n.id===id)?.domain).filter(Boolean));
    let crossings=0;
    for(let i=0;i<path.nodes.length-1;i++){
      const a=data.nodes.find(n=>n.id===path.nodes[i]),b=data.nodes.find(n=>n.id===path.nodes[i+1]);
      if(a&&b&&a.domain!==b.domain)crossings++;
    }
    const rows=path.edges.map((edgeIndex,i)=>{
      const edge=data.edges[edgeIndex],source=data.nodes.find(n=>n.id===edge.source),target=data.nodes.find(n=>n.id===edge.target);
      const stepFrom=data.nodes.find(n=>n.id===path.nodes[i]),stepTo=data.nodes.find(n=>n.id===path.nodes[i+1]);
      const statement=`${nodeLabel(source)} ${edgeLabel(edge)} ${nodeLabel(target)}`;
      return `<article class="atlas-path-step"><div class="atlas-path-step-no">${String(i+1).padStart(2,"0")}</div><div><div class="atlas-path-step-route"><a href="${conceptPath(stepFrom.id)}">${escapeHTML(nodeLabel(stepFrom))}</a><span>↔</span><a href="${conceptPath(stepTo.id)}">${escapeHTML(nodeLabel(stepTo))}</a></div><p>${escapeHTML(statement)}</p><div class="atlas-evidence">${evidenceHtml(edge.evidence)}</div><a class="atlas-relation-permalink" href="${relationPath(edge)}">${UI.relationPage}</a></div></article>`;
    }).join("");
    const count=path.edges.length;
    pathResult.hidden=false;
    pathResult.innerHTML=`<div class="atlas-path-result-head"><strong>${UI.pathResult}</strong><span>${count} ${relationWord(count)}</span></div><div class="atlas-path-integrity"><span><strong>${sourceCount}</strong> ${UI.pathSources}</span><span><strong>${territories.size}</strong> ${UI.pathTerritories}</span><span><strong>${crossings}</strong> ${UI.pathCrossings}</span></div><div class="atlas-path-steps">${rows}</div><p class="atlas-path-note">${UI.pathNote}</p>`;
    updateVisualState();
  }

  function runPath(updateUrl=true){
    if(!pathFrom||!pathTo)return;
    const from=pathFrom.value,to=pathTo.value;
    if(!from||!to)return;
    const path=shortestPath(from,to);
    selectedId=from;
    renderPanel(from);
    if(updateUrl)setPathQuery(from,to);
    renderPath(path);
  }

  function selectNode(id,updateHash=true){if(!data.nodes.some(n=>n.id===id))return;selectedId=id;activeDomain=null;activePath=null;if(pathResult)pathResult.hidden=true;renderPanel(id);updateVisualState();if(updateHash){setPathQuery("","");history.replaceState(null,"",location.pathname+slugHash(id))}}

  function renderSearchResults(value){
    const q=value.trim().toLowerCase();if(!q){searchResults.hidden=true;searchResults.innerHTML="";return}
    const matches=data.nodes.filter(n=>{
      const relationText=data.edges.filter(e=>e.source===n.id||e.target===n.id).flatMap(e=>[e.label,e.i18n?.fr,e.i18n?.it,...(e.evidence||[]).map(item=>item.title)]).filter(Boolean);
      return [n.label,n.summary,n.i18n?.fr?.label,n.i18n?.fr?.summary,n.i18n?.it?.label,n.i18n?.it?.summary,...relationText].join(" ").toLowerCase().includes(q);
    }).slice(0,8);
    searchResults.innerHTML=matches.length?matches.map(n=>`<button type="button" data-node="${n.id}"><strong>${escapeHTML(nodeLabel(n))}</strong><span>${escapeHTML(domainLabel(n.domain))}</span></button>`).join(""):`<div class="atlas-search-empty">${UI.noConcept}</div>`;
    searchResults.hidden=false;searchResults.querySelectorAll("[data-node]").forEach(btn=>btn.addEventListener("click",()=>{const n=data.nodes.find(n=>n.id===btn.dataset.node);search.value=nodeLabel(n);searchResults.hidden=true;selectNode(btn.dataset.node)}));
  }

  search?.addEventListener("input",e=>renderSearchResults(e.target.value));
  search?.addEventListener("keydown",e=>{if(e.key==="Escape"){searchResults.hidden=true;search.blur()}if(e.key==="Enter"){const first=searchResults.querySelector("[data-node]");if(first){e.preventDefault();first.click()}}});
  document.addEventListener("click",e=>{if(!e.target.closest(".atlas-search-wrap"))searchResults.hidden=true});
  lensButtons.forEach(btn=>btn.addEventListener("click",()=>{
    const lens=btn.dataset.atlasLens;
    if(!["direct","bridges"].includes(lens)||lens===activeLens)return;
    activeLens=lens;activePath=null;if(pathResult)pathResult.hidden=true;
    updateLensButtons();renderPanel(selectedId);updateVisualState();
  }));
  pathButton?.addEventListener("click",()=>runPath(true));
  pathFrom?.addEventListener("change",()=>{if(pathFrom.value&&pathTo?.value)runPath(true)});
  pathTo?.addEventListener("change",()=>{if(pathTo.value&&pathFrom?.value)runPath(true)});
  reset?.addEventListener("click",()=>{search.value="";activeDomain=null;activePath=null;activeLens="direct";updateLensButtons();if(pathFrom)pathFrom.value="";if(pathTo)pathTo.value="";if(pathResult)pathResult.hidden=true;setPathQuery("","");selectNode("human-systems")});
  mobileQuery.addEventListener?.("change",()=>{activeDomain=null;updateVisualState()});

  fetch("/data/atlas.json",{headers:{accept:"application/json"}})
    .then(r=>{if(!r.ok)throw new Error("Atlas data unavailable");return r.json()})
    .then(json=>{
      data=json;
      document.getElementById("atlas-node-count").textContent=`${data.nodes.length} ${UI.concepts}`;
      document.getElementById("atlas-edge-count").textContent=`${data.edges.length} ${UI.documented}`;
      if(sourceCountEl)sourceCountEl.textContent=`${uniqueEvidenceUrls(data.edges).size} ${UI.sourceRecords}`;
      if(domainCountEl)domainCountEl.textContent=`${data.domains.length} ${UI.territories}`;
      updateLensButtons();renderDomains();renderMap();renderPathfinder();
      const params=new URLSearchParams(location.search),from=params.get("from"),to=params.get("to");
      if(from&&to&&data.nodes.some(n=>n.id===from)&&data.nodes.some(n=>n.id===to)&&pathFrom&&pathTo){
        pathFrom.value=from;pathTo.value=to;runPath(false);
      }else{
        const hash=decodeURIComponent(location.hash.replace(/^#/,""));
        selectNode(data.nodes.some(n=>n.id===hash)?hash:"human-systems",false);
      }
    })
    .catch(()=>{
      panelTitle.textContent=UI.unavailable;panelSummary.textContent=UI.unavailableText;
      relationsEl.innerHTML=`<a class="atlas-evidence-link" href="/archive"><strong>${UI.openAcademy}</strong><i>${UI.readCorpus}</i></a>`;
    });
})();