(() => {
  const panel=document.querySelector("[data-voce-share]");
  if(!panel)return;
  const sourceUrl=panel.dataset.voceUrl||location.origin+location.pathname;
  const title=panel.dataset.voceTitle||document.title.replace(/ — VOCE$/,"");
  const tags=(panel.dataset.voceTags||"#VOCEAssociation").trim();
  const tagLine=tags.split(/\s+/).filter(Boolean).slice(0,5).join(" ");
  const language=(document.documentElement.lang||"fr").slice(0,2);
  const copy={
    fr:{heading:"Faire découvrir cette publication",intro:"Partager cet article et ses sources à d'autres lecteurs.",linkedin:"Partager sur LinkedIn",facebook:"Partager sur Facebook",copy:"Copier le texte et les hashtags",done:"Texte copié",failed:"Sélectionnez et copiez le texte affiché."},
    en:{heading:"Share this publication",intro:"Help other readers discover this article and its sources.",linkedin:"Share on LinkedIn",facebook:"Share on Facebook",copy:"Copy caption and hashtags",done:"Copied",failed:"Select and copy the displayed text."},
    it:{heading:"Condividi questa pubblicazione",intro:"Aiuta altri lettori a scoprire questo articolo e le sue fonti.",linkedin:"Condividi su LinkedIn",facebook:"Condividi su Facebook",copy:"Copia testo e hashtag",done:"Copiato",failed:"Seleziona e copia il testo."}
  }[language]||{
    heading:"Faire découvrir cette publication",intro:"Partager cet article et ses sources à d'autres lecteurs.",linkedin:"Partager sur LinkedIn",facebook:"Partager sur Facebook",copy:"Copier le texte et les hashtags",done:"Texte copié",failed:"Sélectionnez et copiez le texte affiché."
  };
  function taggedUrl(source) {
    const u=new URL(sourceUrl);
    u.searchParams.set("utm_source",source);
    u.searchParams.set("utm_medium","social");
    u.searchParams.set("utm_campaign","voce-corpus");
    u.searchParams.set("utm_content",(panel.dataset.voceId||"article").slice(0,70).replace(/[^a-zA-Z0-9-]/g,"-"));
    return u.href;
  }
  function track(method) {
    try {
      if(window.zaraz?.consent?.APIReady && window.zaraz.consent.get("stats")===true) {
        window.zaraz.track("voce_share",{platform:method});
      }
    } catch {}
  }
  const h=panel.querySelector(".voce-share-title");
  const intro=panel.querySelector(".voce-share-intro");
  const linkedin=panel.querySelector("[data-voce-share-linkedin]");
  const facebook=panel.querySelector("[data-voce-share-facebook]");
  const button=panel.querySelector("[data-voce-share-copy]");
  const sample=panel.querySelector(".voce-share-template");
  const status=panel.querySelector("[data-voce-share-status]");
  if(h)h.textContent=copy.heading;
  if(intro)intro.textContent=copy.intro;
  if(linkedin){
    linkedin.textContent=copy.linkedin;
    linkedin.href="https://www.linkedin.com/sharing/share-offsite/?url="+encodeURIComponent(taggedUrl("linkedin"));
    linkedin.addEventListener("click",()=>track("linkedin"));
  }
  if(facebook){
    facebook.textContent=copy.facebook;
    facebook.href="https://www.facebook.com/sharer/sharer.php?u="+encodeURIComponent(taggedUrl("facebook"));
    facebook.addEventListener("click",()=>track("facebook"));
  }
  const caption=title+"\n\n"+(language==="en"?"Read the full text and references: ":language==="it"?"Leggi il testo e le fonti: ":"Lire le texte intégral et ses sources: ")+taggedUrl("reader_share")+"\n\n"+tagLine;
  if(sample)sample.value=caption;
  if(button){
    button.textContent=copy.copy;
    button.addEventListener("click",async()=>{
      track("copy");
      try {
        await navigator.clipboard.writeText(caption);
        if(status)status.textContent=copy.done;
      }catch{
        if(sample){sample.hidden=false;sample.focus();sample.select();}
        if(status)status.textContent=copy.failed;
      }
    });
  }
})();