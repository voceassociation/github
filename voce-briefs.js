(() => {
  const raw = location.pathname.replace(/\/+$/, "") || "/";
  const prefixed = raw.match(/^\/(fr|it)(?:\/|$)/);
  const path = prefixed ? raw.slice(3) || "/" : raw;
  const aliases = {"/archive":"academy","/research":"research","/art":"art",
    "/governance":"governance","/technoference":"technoference",
    "/sovereignty":"sovereignty","/light-workforce":"workforce",
    "/applied":"applied","/publications":"publications"};
  const pageKey = aliases[path];

  function lang() {
    if(prefixed)return prefixed[1];
    const selected=document.querySelector(".lang [data-lang].active");
    const v=(selected?.getAttribute("data-lang") || document.documentElement.lang || "en").toLowerCase();
    return v.startsWith("fr")?"fr":v.startsWith("it")?"it":"en";
  }
  const i18n={
    en:{
      heading:"How to use VOCE Guide",
      instructions:"Ask a question in your own words. The Guide searches public VOCE publications and offers links to the supporting documents. You can also choose Art, Academy, AI Governance or Technoference to begin with a subject.",
      listen:"Listen to instructions",pause:"Pause",transcript:"Read the transcript"
    },
    fr:{
      heading:"Comment utiliser VOCE Guide",
      instructions:"Posez une question avec vos propres mots. Le Guide explore les publications publiques de VOCE et propose les documents qui soutiennent sa réponse. Vous pouvez aussi commencer par Art, Academy, AI Governance ou Technoference.",
      listen:"Écouter les instructions",pause:"Pause",transcript:"Lire la transcription"
    },
    it:{
      heading:"Come usare VOCE Guide",
      instructions:"Formulate una domanda con parole semplici. La Guida cerca nelle pubblicazioni pubbliche di VOCE e propone i documenti pertinenti. Potete anche iniziare da Arte, Academy, AI Governance o Technoference.",
      listen:"Ascolta le istruzioni",pause:"Pausa",transcript:"Leggi la trascrizione"
    }
  };
  function readable(s){return String(s||"").replace(/\bVotché\b|\bVoce\b/g,"VOCE");}
  async function hasAudio(url){
    try{
      const r=await fetch(url,{method:"HEAD",credentials:"same-origin"});
      return r.ok && /^audio\//i.test(r.headers.get("content-type")||"");
    }catch{return false;}
  }

  function addGuideHelp(){
    if(path!=="/" && path!=="/archive")return null;
    const guide=document.getElementById("guide");
    const target=guide?.querySelector(".guide-pathways");
    if(!target)return null;
    const details=document.createElement("details");
    details.className="voce-guide-howto";
    const summary=document.createElement("summary");
    const p=document.createElement("p");
    const button=document.createElement("button");
    button.type="button";
    button.className="voce-guide-listen";
    button.disabled=true;
    const audio=document.createElement("audio");
    audio.preload="none";
    details.append(summary,p,button,audio);
    target.parentElement.insertBefore(details,target);
    let version=0;
    async function update(l){
      const current=++version;
      const t=i18n[l]||i18n.en;
      summary.textContent=t.heading;
      p.textContent=t.instructions;
      button.textContent=t.listen;
      button.disabled=true;
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
      const url="/assets/audio/voce-brief-guide-"+l+".wav";
      if(!(await hasAudio(url))||current!==version)return;
      audio.src=url;
      button.disabled=false;
    }
    button.addEventListener("click",()=>{
      if(button.disabled)return;
      if(audio.paused){audio.play().catch(()=>{});}
      else audio.pause();
    });
    function refresh(){button.textContent=audio.paused?i18n[lang()].listen:i18n[lang()].pause;}
    ["play","pause","ended"].forEach(event=>audio.addEventListener(event,refresh));
    update(lang());
    return update;
  }

  function addTranscript(){
    if(!pageKey)return null;
    const copy=document.querySelector(".voce-audio-signature .voce-audio-copy");
    if(!copy)return null;
    const details=document.createElement("details");
    details.className="voce-audio-transcript";
    details.hidden=true;
    const summary=document.createElement("summary");
    const p=document.createElement("p");
    details.append(summary,p);
    copy.append(details);
    let catalog=null;
    let ready=false;
    async function update(l){
      if(!ready){
        try{
          const r=await fetch("/data/voce-audio-"+pageKey+".json",{credentials:"same-origin"});
          catalog=r.ok?await r.json():null;
        }catch{catalog=null;}
        ready=true;
      }
      const transcript=catalog?.audios?.[l]?.transcript;
      details.hidden=!transcript;
      summary.textContent=i18n[l].transcript;
      p.textContent=readable(transcript);
    }
    update(lang());
    return update;
  }

  const help=addGuideHelp();
  const transcript=addTranscript();
  document.addEventListener("click",event=>{
    if(!event.target.closest(".lang [data-lang]"))return;
    setTimeout(()=>{
      help?.(lang());
      transcript?.(lang());
    },0);
  });
})();