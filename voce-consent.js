(() => {
  const labels = {
    en:"Cookie preferences",
    fr:"Gestion des cookies",
    it:"Preferenze cookie"
  };
  function currentLang() {
    const path = location.pathname.match(/^\/(fr|it)(?:\/|$)/);
    if(path) return path[1];
    const selected = document.querySelector(".lang [data-lang].active");
    const value = String(selected?.getAttribute("data-lang") || document.documentElement.lang || "en").toLowerCase();
    return value.startsWith("fr") ? "fr" : value.startsWith("it") ? "it" : "en";
  }
  function updateLabels() {
    document.querySelectorAll("[data-voce-cookie-settings]").forEach(element => {
      element.textContent = labels[currentLang()] || labels.en;
    });
  }
  function showPreferences(event) {
    const link=event.target.closest("[data-voce-cookie-settings]");
    if(!link)return;
    try {
      if(window.zaraz && typeof window.zaraz.showConsentModal === "function") {
        event.preventDefault();
        window.zaraz.showConsentModal();
      } else if(window.zaraz?.consent?.APIReady) {
        event.preventDefault();
        window.zaraz.consent.modal=true;
      }
    } catch {}
  }
  document.addEventListener("click",showPreferences);
  document.addEventListener("click",event=>{
    if(event.target.closest(".lang [data-lang]"))setTimeout(updateLabels,0);
  });
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",updateLabels,{once:true});
  else updateLabels();
})();