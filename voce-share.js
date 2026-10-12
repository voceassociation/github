(() => {
  const panel=document.querySelector("[data-voce-share]");
  if(!panel)return;
  const sourceUrl=panel.dataset.voceUrl||location.origin+location.pathname;
  const title=panel.dataset.voceTitle||document.title.replace(/ — VOCE$/,"");
  const tags=(panel.dataset.voceTags||"#VOCEAssociation").trim();
  const tagLine=[...new Set(tags.split(/\s+/).filter(Boolean))].slice(0,5).join(" ");
  const language=(document.documentElement.lang||"fr").slice(0,2);
  const locale={
    fr:{
      heading:"Faire découvrir cette publication",
      intro:"Un texte documenté, cinq voies de diffusion. La source reste sur VOCE Academy.",
      linkedin:"Partager sur LinkedIn",facebook:"Partager sur Facebook",instagram:"Copier pour Instagram",
      youtube:"Copier pour YouTube",tiktok:"Copier pour TikTok",copy:"Copier pour LinkedIn / Facebook",
      done:"Texte et hashtags copiés",failed:"Sélectionnez et copiez le texte affiché.",
      read:"Lire le texte intégral et ses sources",bio:"Texte intégral: lien VOCE Academy dans la bio.",
      yt:"Découvrir cette recherche VOCE et ses références",tiktokBio:"Recherche complète sur VOCE Academy. Lien dans la bio."
    },
    en:{
      heading:"Share this publication",intro:"One documented article, five distribution pathways. The source stays in VOCE Academy.",
      linkedin:"Share on LinkedIn",facebook:"Share on Facebook",instagram:"Copy for Instagram",
      youtube:"Copy for YouTube",tiktok:"Copy for TikTok",copy:"Copy for LinkedIn / Facebook",
      done:"Caption and hashtags copied",failed:"Select and copy the text displayed.",
      read:"Read the full article and sources",bio:"Full article: VOCE Academy link in bio.",
      yt:"Discover this VOCE research and its references",tiktokBio:"Full research on VOCE Academy. Link in bio."
    },
    it:{
      heading:"Condividi questa pubblicazione",intro:"Un articolo documentato, cinque percorsi di diffusione. La fonte rimane su VOCE Academy.",
      linkedin:"Condividi su LinkedIn",facebook:"Condividi su Facebook",instagram:"Copia per Instagram",
      youtube:"Copia per YouTube",tiktok:"Copia per TikTok",copy:"Copia per LinkedIn / Facebook",
      done:"Testo e hashtag copiati",failed:"Seleziona e copia il testo visualizzato.",
      read:"Leggi il testo integrale e le fonti",bio:"Articolo integrale: link VOCE Academy nella bio.",
      yt:"Scopri questa ricerca VOCE e le sue fonti",tiktokBio:"Ricerca completa su VOCE Academy. Link in bio."
    }
  }[language]||null;
  const copy=locale;
  function taggedUrl(source){
    const url=new URL(sourceUrl,location.origin);
    url.searchParams.set("utm_source",source);
    url.searchParams.set("utm_medium","social");
    url.searchParams.set("utm_campaign","voce-corpus");
    url.searchParams.set("utm_content",(panel.dataset.voceId||"article").slice(0,70).replace(/[^a-zA-Z0-9-]/g,"-"));
    return url.href;
  }
  function track(method){
    try{
      if(window.zaraz?.consent?.APIReady===true&&window.zaraz.consent.get("stats")===true){
        window.zaraz.track("voce_share",{platform:method});
      }
    }catch{}
  }
  function caption(platform){
    const network=["facebook","instagram","youtube","tiktok"].includes(platform)?platform:"linkedin";
    if(network==="instagram")return [title,"",copy.bio,"",tagLine].join("\n");
    if(network==="tiktok")return [title,"",copy.tiktokBio,"",tagLine].join("\n");
    if(network==="youtube")return [title,"",copy.yt+": "+taggedUrl("youtube"),"",tagLine].join("\n");
    return [title,"",copy.read+": "+taggedUrl(network),"",tagLine].join("\n");
  }
  const h=panel.querySelector(".voce-share-title");
  const intro=panel.querySelector(".voce-share-intro");
  const linkedin=panel.querySelector("[data-voce-share-linkedin]");
  const facebook=panel.querySelector("[data-voce-share-facebook]");
  const button=panel.querySelector("[data-voce-share-copy]");
  const instagram=panel.querySelector("[data-voce-share-instagram]");
  const youtube=panel.querySelector("[data-voce-share-youtube]");
  const tiktok=panel.querySelector("[data-voce-share-tiktok]");
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
  async function copyFor(platform){
    track(platform+"_copy");
    const text=caption(platform);
    if(sample)sample.value=text;
    try{
      await navigator.clipboard.writeText(text);
      if(status)status.textContent=copy.done;
    }catch{
      if(sample){sample.hidden=false;sample.focus();sample.select();}
      if(status)status.textContent=copy.failed;
    }
  }
  if(button){button.textContent=copy.copy;button.addEventListener("click",()=>copyFor("linkedin"));}
  if(instagram){instagram.textContent=copy.instagram;instagram.addEventListener("click",()=>copyFor("instagram"));}
  if(youtube){youtube.textContent=copy.youtube;youtube.addEventListener("click",()=>copyFor("youtube"));}
  if(tiktok){tiktok.textContent=copy.tiktok;tiktok.addEventListener("click",()=>copyFor("tiktok"));}
  if(sample)sample.value=caption("linkedin");
})();