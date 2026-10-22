(() => {
  const narrow = window.matchMedia("(max-width: 760px)");
  const phrases = {
    fr: {open:"Menu",close:"Fermer",label:"Ouvrir la navigation VOCE",closeLabel:"Fermer la navigation VOCE"},
    en: {open:"Menu",close:"Close",label:"Open VOCE navigation",closeLabel:"Close VOCE navigation"},
    it: {open:"Menu",close:"Chiudi",label:"Apri la navigazione VOCE",closeLabel:"Chiudi la navigazione VOCE"}
  };

  function setup() {
    const header=document.querySelector("body > header") || document.querySelector("header");
    const wrap=header?.querySelector(".nav");
    const menu=wrap?.querySelector(":scope > nav.menu");
    if (!header || !wrap || !menu || wrap.querySelector(".voce-mobile-toggle")) return;

    const button=document.createElement("button");
    button.type="button";
    button.className="voce-mobile-toggle";
    button.setAttribute("aria-expanded","false");
    menu.id=menu.id||"voce-main-navigation";
    button.setAttribute("aria-controls",menu.id);
    button.innerHTML='<span class="voce-mobile-toggle-icon" aria-hidden="true"></span><span class="voce-mobile-toggle-label">Menu</span>';
    wrap.insertBefore(button,menu);
    const label=button.querySelector(".voce-mobile-toggle-label");
    const navigation = {
      en: {themes:"Themes",research:"Research",archive:"Academy",atlas:"Atlas",applied:"Applied",standards:"Standards",publications:"Publications",art:"Art",about:"About",philanthropy:"Philanthropy",guide:"Guide",home:"Home",cours:"VOCE Courses®",label:"Primary navigation",language:"Language"},
      fr: {themes:"Thèmes",research:"Recherche",archive:"Academy",atlas:"Atlas",applied:"Applied",standards:"Normes",publications:"Publications",art:"Art",about:"À propos",philanthropy:"Philanthropie",guide:"Guide",home:"Accueil",cours:"COURS VOCE®",label:"Navigation principale",language:"Langue"},
      it: {themes:"Temi",research:"Ricerca",archive:"Academy",atlas:"Atlas",applied:"Applied",standards:"Standard",publications:"Pubblicazioni",art:"Art",about:"Chi siamo",philanthropy:"Filantropia",guide:"Guida",home:"Home",cours:"CORSI VOCE®",label:"Navigazione principale",language:"Lingua"}
    };
    let expanded=false;

    function sync() {
      const lang=String(document.documentElement.lang||"en").toLowerCase().slice(0,2);
      const messages=phrases[lang]||phrases.en;
      const names=navigation[lang]||navigation.en;
      menu.setAttribute("aria-label",names.label);
      menu.querySelector(".lang")?.setAttribute("aria-label",names.language);
      menu.querySelectorAll(":scope > a[href]").forEach(link=>{
        const url=new URL(link.getAttribute("href"),location.href);
        if(url.origin!==location.origin)return;
        const segments=url.pathname.split("/").filter(Boolean);
        if(["en","fr","it"].includes(segments[0]))segments.shift();
        const key=url.hash==="#themes"?"themes":url.hash==="#guide"?"guide":segments.join("/")||"home";
        if(names[key])link.textContent=names[key];
        if(["philanthropy","applied","atlas","cours"].includes(key)){
          const path=key==="cours"?(lang==="it"?"/it/cours":lang==="fr"?"/cours":"/en/cours"):(lang==="en"?"/":"/"+lang+"/")+key;
          link.setAttribute("href",path+url.search+url.hash);
        }
      });
      const compact=narrow.matches;
      header.classList.toggle("voce-mobile-ready",compact);
      if(!compact) expanded=false;
      menu.hidden=compact&&!expanded;
      button.setAttribute("aria-expanded",String(compact&&expanded));
      button.setAttribute("aria-label",compact&&expanded?messages.closeLabel:messages.label);
      label.textContent=compact&&expanded?messages.close:messages.open;
      button.classList.toggle("is-open",compact&&expanded);
    }

    button.addEventListener("click",()=>{
      if(!narrow.matches)return;
      expanded=!expanded;
      sync();
      if(expanded)menu.querySelector("a,button")?.focus({preventScroll:true});
      else button.focus({preventScroll:true});
    });
    document.addEventListener("keydown",event=>{
      if(event.key==="Escape"&&narrow.matches&&expanded){
        expanded=false;sync();button.focus({preventScroll:true});
      }
    });
    document.addEventListener("click",event=>{
      if(!narrow.matches||!expanded||wrap.contains(event.target))return;
      expanded=false;sync();
    });
    menu.addEventListener("click",event=>{
      const link=event.target.closest("a[href]");
      if(!link||!narrow.matches)return;
      expanded=false;sync();
    });
    if(typeof narrow.addEventListener==="function")narrow.addEventListener("change",sync);
    else narrow.addListener(sync);
    new MutationObserver(sync).observe(document.documentElement,{attributes:true,attributeFilter:["lang"]});
    sync();
  }

  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",setup,{once:true});
  else setup();
})();
