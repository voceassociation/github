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
    en:{source:"Source",read:"Read in VOCE →",permanent:"Permanent page →",relation:"relation",relations:"relations",empty:"No documented relation in this curated edition.",noConcept:"No concept in this curated edition.",unavailable:"Atlas unavailable",unavailableText:"The knowledge map could not be loaded. VOCE Academy remains available as the canonical corpus.",openAcademy:"Open VOCE Academy",readCorpus:"Read the corpus →",concepts:"concepts",documented:"documented relations"},
    fr:{source:"Source",read:"Lire dans VOCE →",permanent:"Page permanente →",relation:"relation",relations:"relations",empty:"Aucune relation documentée dans cette édition éditoriale.",noConcept:"Aucun concept dans cette édition éditoriale.",unavailable:"Atlas indisponible",unavailableText:"La carte des connaissances n’a pas pu être chargée. VOCE Academy reste accessible comme corpus canonique.",openAcademy:"Ouvrir VOCE Academy",readCorpus:"Lire le corpus →",concepts:"concepts",documented:"relations documentées"},
    it:{source:"Fonte",read:"Leggi in VOCE →",permanent:"Pagina permanente →",relation:"relazione",relations:"relazioni",empty:"Nessuna relazione documentata in questa edizione curatoriale.",noConcept:"Nessun concetto in questa edizione curatoriale.",unavailable:"Atlas non disponibile",unavailableText:"La mappa della conoscenza non è stata caricata. VOCE Academy resta disponibile come corpus canonico.",openAcademy:"Apri VOCE Academy",readCorpus:"Leggi il corpus →",concepts:"concetti",documented:"relazioni documentate"}
  }[pageLang];

  const map = document.getElementById("atlas-map");
  const panelTitle = document.getElementById("atlas-panel-title");
  const panelSummary = document.getElementById("atlas-panel-summary");
  const panelMeta = document.getElementById("atlas-panel-meta");
  const relationsEl = document.getElementById("atlas-relations");
  const search = document.getElementById("atlas-search");
  const searchResults = document.getElementById("atlas-search-results");
  const domainsEl = document.getElementById("atlas-domains");
  const reset = document.getElementById("atlas-reset");
  if (!map) return;

  const centers={cross:[600,360],ai:[295,205],work:[210,480],cognition:[880,205],health:[900,520],culture:[500,610]};
  const domainOrder=["ai","work","cognition","health","culture","cross"];
  const mobileDomainHub={ai:"ai-systems",work:"light-workforce",cognition:"cognition",health:"health",culture:"culture"};
  const mobileQuery=window.matchMedia("(max-width: 760px)");
  let data=null, selectedId="human-systems", activeDomain=null;
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
  function relationWord(n){return n===1?UI.relation:UI.relations}

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
    const{related,indexes}=relationSet(selectedId);
    nodeEls.forEach((el,id)=>{const node=data.nodes.find(n=>n.id===id),domainDim=activeDomain&&node.domain!==activeDomain&&id!==selectedId,relationDim=selectedId&&!related.has(id);el.classList.toggle("is-selected",id===selectedId);el.classList.toggle("is-related",related.has(id)&&id!==selectedId);el.classList.toggle("is-dimmed",domainDim||relationDim)});
    edgeEls.forEach((el,i)=>{const edge=data.edges[i],domainVisible=!activeDomain||[edge.source,edge.target].some(id=>data.nodes.find(n=>n.id===id)?.domain===activeDomain);el.classList.toggle("is-active",indexes.has(i)&&domainVisible);el.classList.toggle("is-dimmed",!indexes.has(i)||!domainVisible)});
    document.querySelectorAll(".atlas-domain-chip").forEach(el=>el.classList.toggle("is-active",el.dataset.domain===activeDomain));
  }

  function escapeHTML(value=""){return String(value).replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]))}
  function evidenceHtml(evidence=[]){
    const unique=[],seen=new Set();for(const item of evidence){if(!item?.url||seen.has(item.url))continue;seen.add(item.url);unique.push(item)}
    return unique.map(item=>`<a class="atlas-evidence-link" href="${item.url}"><span>${UI.source}</span><strong>${escapeHTML(item.title)}</strong><i>${UI.read}</i></a>`).join("");
  }

  function renderPanel(id){
    const node=data.nodes.find(n=>n.id===id);if(!node)return;
    const relations=data.edges.filter(e=>e.source===id||e.target===id);
    panelTitle.textContent=nodeLabel(node);panelSummary.textContent=nodeSummary(node);
    panelMeta.innerHTML=`<span>${escapeHTML(domainLabel(node.domain))}</span><span>${relations.length} ${relationWord(relations.length)}</span><a class="atlas-concept-link" href="${conceptPath(node.id)}">${UI.permanent}</a>`;
    if(!relations.length){relationsEl.innerHTML=`<p class="atlas-empty">${UI.empty}</p>`;return}
    relationsEl.innerHTML=relations.map(edge=>{
      const source=data.nodes.find(n=>n.id===edge.source),target=data.nodes.find(n=>n.id===edge.target),otherId=edge.source===id?edge.target:edge.source,other=data.nodes.find(n=>n.id===otherId);
      const statement=`${nodeLabel(source)} ${edgeLabel(edge)} ${nodeLabel(target)}`;
      return `<article class="atlas-relation-card"><button type="button" class="atlas-relation-target" data-node="${otherId}"><span>${escapeHTML(domainLabel(other?.domain||""))}</span><strong>${escapeHTML(nodeLabel(other)||otherId)}</strong></button><p>${escapeHTML(statement)}</p><div class="atlas-evidence">${evidenceHtml(edge.evidence)}</div></article>`;
    }).join("");
    relationsEl.querySelectorAll("[data-node]").forEach(btn=>btn.addEventListener("click",()=>selectNode(btn.dataset.node)));
  }

  function selectNode(id,updateHash=true){if(!data.nodes.some(n=>n.id===id))return;selectedId=id;activeDomain=null;renderPanel(id);updateVisualState();if(updateHash)history.replaceState(null,"",slugHash(id))}

  function renderSearchResults(value){
    const q=value.trim().toLowerCase();if(!q){searchResults.hidden=true;searchResults.innerHTML="";return}
    const matches=data.nodes.filter(n=>[n.label,n.summary,n.i18n?.fr?.label,n.i18n?.fr?.summary,n.i18n?.it?.label,n.i18n?.it?.summary].filter(Boolean).join(" ").toLowerCase().includes(q)).slice(0,8);
    searchResults.innerHTML=matches.length?matches.map(n=>`<button type="button" data-node="${n.id}"><strong>${escapeHTML(nodeLabel(n))}</strong><span>${escapeHTML(domainLabel(n.domain))}</span></button>`).join(""):`<div class="atlas-search-empty">${UI.noConcept}</div>`;
    searchResults.hidden=false;searchResults.querySelectorAll("[data-node]").forEach(btn=>btn.addEventListener("click",()=>{const n=data.nodes.find(n=>n.id===btn.dataset.node);search.value=nodeLabel(n);searchResults.hidden=true;selectNode(btn.dataset.node)}));
  }

  search?.addEventListener("input",e=>renderSearchResults(e.target.value));
  search?.addEventListener("keydown",e=>{if(e.key==="Escape"){searchResults.hidden=true;search.blur()}if(e.key==="Enter"){const first=searchResults.querySelector("[data-node]");if(first){e.preventDefault();first.click()}}});
  document.addEventListener("click",e=>{if(!e.target.closest(".atlas-search-wrap"))searchResults.hidden=true});
  reset?.addEventListener("click",()=>{search.value="";activeDomain=null;selectNode("human-systems")});
  mobileQuery.addEventListener?.("change",()=>{activeDomain=null;updateVisualState()});

  fetch("/data/atlas.json",{headers:{accept:"application/json"}})
    .then(r=>{if(!r.ok)throw new Error("Atlas data unavailable");return r.json()})
    .then(json=>{
      data=json;
      document.getElementById("atlas-node-count").textContent=`${data.nodes.length} ${UI.concepts}`;
      document.getElementById("atlas-edge-count").textContent=`${data.edges.length} ${UI.documented}`;
      renderDomains();renderMap();
      const hash=decodeURIComponent(location.hash.replace(/^#/,""));
      selectNode(data.nodes.some(n=>n.id===hash)?hash:"human-systems",false);
    })
    .catch(()=>{
      panelTitle.textContent=UI.unavailable;panelSummary.textContent=UI.unavailableText;
      relationsEl.innerHTML=`<a class="atlas-evidence-link" href="/archive"><strong>${UI.openAcademy}</strong><i>${UI.readCorpus}</i></a>`;
    });
})();