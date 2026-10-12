(() => {
  // Optional, aggregate, consent-gated engagement events.
  // Never send query text, visitor identifiers, medical topics or form values.
  function track(name, fields) {
    try {
      const z=window.zaraz;
      if (!z || typeof z.track!=="function" ||
          z.consent?.APIReady!==true || z.consent.get("stats")!==true) return;
      z.track(name,fields||{});
    } catch {}
  }

  document.addEventListener("submit",event=>{
    const form=event.target;
    if(form?.matches?.("[data-academy-agent-form]")) {
      track("voce_guide_search");
    }
  },true);

  document.addEventListener("click",event=>{
    const audio=event.target.closest?.(".voce-audio-toggle");
    if(audio && audio.getAttribute("aria-pressed")!=="true") {
      track("voce_audio_play");
      return;
    }
    const link=event.target.closest?.("a[href]");
    if(!link)return;
    const href=link.getAttribute("href")||"";
    if(/^mailto:contact@voce\.life/i.test(href)) {
      track("voce_contact_interest");
      return;
    }
    let url;
    try{url=new URL(href,location.href)}catch{return}
    if(url.origin!==location.origin)return;
    const path=url.pathname.replace(/^\/(fr|it)(?=\/)/,"").replace(/\/+$/,"")||"/";
    if(path==="/contact"){track("voce_contact_interest");return}
    if(/^\/archive\/\d{4}\/\d{2}\/\d{2}\//.test(path)){
      track("voce_article_open");return;
    }
    const pillars=new Set(["/archive","/art","/research","/governance","/technoference","/applied","/sovereignty","/light-workforce"]);
    if(pillars.has(path))track("voce_pillar_open",{pillar:path.slice(1)});
  },true);
})();