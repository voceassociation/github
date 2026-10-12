(() => {
  function detectLanguage() {
    const pathLang = location.pathname.match(/^\/(fr|it)\//);
    if (pathLang) return pathLang[1];
    const current = document.querySelector(".lang [data-lang].active");
    if (current) return current.getAttribute("data-lang");
    const htmlLang = (document.documentElement.lang || "en").toLowerCase();
    return htmlLang.startsWith("fr") ? "fr" : htmlLang.startsWith("it") ? "it" : "en";
  }

  function updateBriefs() {
    const lang = detectLanguage();
    document.querySelectorAll("[data-voce-brief]").forEach(element => {
      let options;
      try { options = JSON.parse(element.getAttribute("data-voce-brief-copy") || "{}"); } catch { return; }
      const selected = options[lang] || options.en;
      if (!Array.isArray(selected) || selected.length < 2) return;
      const heading = element.querySelector("[data-voce-brief-label]");
      const copy = element.querySelector("[data-voce-brief-text]");
      if (heading) heading.textContent = selected[0];
      if (copy) copy.textContent = selected[1];
      element.setAttribute("lang", lang);
    });
  }

  updateBriefs();
  document.addEventListener("click", event => {
    if (event.target.closest(".lang [data-lang]")) {
      requestAnimationFrame(updateBriefs);
    }
  });
})();
