(() => {
  const form=document.querySelector("[data-cognitive-agent-form]");
  const input=document.querySelector("[data-cognitive-agent-input]");
  const output=document.querySelector("[data-cognitive-agent-output]");
  const submit=document.querySelector("[data-cognitive-agent-submit]");
  if(!form||!input||!output||!submit) return;

  const lang=(document.documentElement.lang||"en").slice(0,2);
  const UI={
    en:{ask:"Analyse with VOCE",searching:"Corpus analysis…",status:"VOCE Cognitive Agent is searching the VOCE corpus and mapping relevant cognitive controls.",none:"The corpus does not support a sufficiently grounded analysis.",docs:"VOCE corpus evidence",controls:"Cognitive controls to examine",critical:"Critical",major:"Major",boundary:"System and workflow analysis only. No individual psychological or neuropsychological diagnosis.",error:"The cognitive synthesis is temporarily unavailable.",open:"Open control →"},
    fr:{ask:"Analyser avec VOCE",searching:"Analyse du corpus…",status:"VOCE Cognitive Agent interroge le corpus VOCE et cartographie les contrôles cognitifs pertinents.",none:"Le corpus ne permet pas une analyse suffisamment étayée.",docs:"Éléments du corpus VOCE",controls:"Contrôles cognitifs à examiner",critical:"Critique",major:"Majeur",boundary:"Analyse de systèmes et de workflows uniquement. Aucun diagnostic psychologique ou neuropsychologique individuel.",error:"La synthèse cognitive est momentanément indisponible.",open:"Ouvrir le contrôle →"},
    it:{ask:"Analizza con VOCE",searching:"Analisi del corpus…",status:"VOCE Cognitive Agent interroga il corpus VOCE e mappa i controlli cognitivi pertinenti.",none:"Il corpus non consente un'analisi sufficientemente fondata.",docs:"Evidenze dal corpus VOCE",controls:"Controlli cognitivi da esaminare",critical:"Critico",major:"Maggiore",boundary:"Analisi esclusivamente di sistemi e workflow. Nessuna diagnosi psicologica o neuropsicologica individuale.",error:"La sintesi cognitiva è temporaneamente indisponibile.",open:"Apri il controllo →"}
  }[lang]||null;

  const esc=v=>String(v==null?"":v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const paragraphize=v=>esc(v||"").replace(/\n\n/g,"</p><p>").replace(/^/,"<p>").replace(/$/,"</p>");
  const controlPath=id=>(lang==="en"?"":"/"+lang)+"/human-cognitive-assurance/controls/"+String(id).toLowerCase();

  function render(data){
    const sources=Array.isArray(data.sources)?data.sources:[];
    const controls=Array.isArray(data.controls)?data.controls:[];
    const sourceHtml=sources.length?'<section class="cog-agent-sources"><div class="cog-agent-label">'+UI.docs+'</div>'+sources.map((s,i)=>'<a href="'+esc(s.url)+'"><span>'+String(i+1).padStart(2,"0")+'</span><strong>'+esc(s.title)+'</strong><small>'+esc(s.date||"")+'</small></a>').join("")+'</section>':"";
    const controlsHtml=controls.length?'<section class="cog-agent-controls"><div class="cog-agent-label">'+UI.controls+'</div>'+controls.map(c=>'<a class="'+(c.criticality==="critical"?"is-critical":"")+'" href="'+controlPath(c.id)+'"><b>'+esc(c.id)+'</b><span><strong>'+esc(c.title)+'</strong><small>'+esc(c.criticality==="critical"?UI.critical:UI.major)+'</small></span><em>'+UI.open+'</em></a>').join("")+'</section>':"";
    output.innerHTML='<div class="cog-agent-answer">'+paragraphize(data.answer||UI.none)+'</div>'+controlsHtml+sourceHtml+'<p class="cog-agent-boundary">'+esc(data.boundary||UI.boundary)+'</p>';
  }

  async function ask(q){
    q=String(q||"").trim();
    if(!q){input.focus();return;}
    input.value=q;
    submit.disabled=true; submit.textContent=UI.searching;
    output.innerHTML='<p class="cog-agent-status">'+UI.status+'</p>';
    try{
      const r=await fetch("/api/cognitive-agent",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({q,lang})});
      const data=await r.json();
      if(!r.ok) throw new Error(data.error||"error");
      render(data);
    }catch(e){
      output.innerHTML='<p class="cog-agent-status">'+UI.error+'</p><p class="cog-agent-boundary">'+UI.boundary+'</p>';
    }finally{
      submit.disabled=false; submit.textContent=UI.ask;
    }
  }
  form.addEventListener("submit",e=>{e.preventDefault();ask(input.value);});
  document.querySelectorAll("[data-cognitive-query-en],[data-cognitive-query-fr],[data-cognitive-query-it]").forEach(btn=>btn.addEventListener("click",()=>{
    const q=btn.getAttribute("data-cognitive-query-"+lang)||btn.getAttribute("data-cognitive-query-en")||"";
    input.value=q;
    input.focus();
    output.innerHTML="";
  }));
})();