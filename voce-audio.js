(() => {
  const rawPath = location.pathname.replace(/\/+$/, "") || "/";
  const path = rawPath.replace(/^\/(fr|it)(?=\/)/, "") || "/";
  const isArt = path === "/art" || (path.startsWith("/art/") && !path.startsWith("/art/vault"));
  const eligible = ["/","/archive","/research","/governance","/technoference","/sovereignty","/light-workforce","/applied","/publications","/art"].includes(path) || isArt;
  if (!eligible) return;

  const COPY = {
    en: {
      home: ["VOCE Audio", "Hear VOCE", "A voice for research, culture and intelligence."],
      art: ["VOCE Audio", "Hear VOCE Art", "A voice for the work, its matter and its history."],
      research: ["VOCE Audio", "Hear VOCE Research", "A voice for mechanisms, evidence and human consequence."],
      governance: ["VOCE Audio", "Hear AI Governance", "A voice for systems, authority and responsibility."],
      technoference: ["VOCE Audio", "Hear Technoference", "A voice for attention, cognition and digital life."],
      academy: ["VOCE Audio", "Explore Academy", "How to use the public corpus."],
      sovereignty: ["VOCE Audio", "Understand Sovereignty", "Technological dependencies and institutional choice."],
      workforce: ["VOCE Audio", "Explore Light Workforce", "Automation and how expertise develops."],
      applied: ["VOCE Audio", "Discover VOCE Applied", "Institutional expertise in practice."],
      publications: ["VOCE Audio", "Explore Publications", "Research and documented analysis."],
      play: "Play", pause: "Pause", unavailable: "Audio unavailable"
    },
    fr: {
      home: ["VOCE Audio", "Écouter VOCE", "Une voix pour la recherche, la culture et l'intelligence."],
      art: ["VOCE Audio", "Écouter VOCE Art", "Une voix pour l'œuvre, sa matière et son histoire."],
      research: ["VOCE Audio", "Écouter VOCE Research", "Une voix pour les mécanismes, les preuves et leurs conséquences humaines."],
      governance: ["VOCE Audio", "Écouter AI Governance", "Une voix pour les systèmes, l'autorité et la responsabilité."],
      technoference: ["VOCE Audio", "Écouter Technoference", "Une voix pour l'attention, la cognition et la vie numérique."],
      academy: ["VOCE Audio", "Découvrir Academy", "Comment explorer le corpus public."],
      sovereignty: ["VOCE Audio", "Comprendre Sovereignty", "Dépendances technologiques et liberté de choisir."],
      workforce: ["VOCE Audio", "Découvrir Light Workforce", "Automatisation et formation de l'expertise."],
      applied: ["VOCE Audio", "Découvrir VOCE Applied", "L'expertise au service des institutions."],
      publications: ["VOCE Audio", "Explorer les publications", "Travaux et analyses documentés."],
      play: "Écouter", pause: "Pause", unavailable: "Audio indisponible"
    },
    it: {
      home: ["VOCE Audio", "Ascolta VOCE", "Una voce per ricerca, cultura e intelligenza."],
      art: ["VOCE Audio", "Ascolta VOCE Art", "Una voce per l'opera, la sua materia e la sua storia."],
      research: ["VOCE Audio", "Ascolta VOCE Research", "Una voce per meccanismi, prove e conseguenze umane."],
      governance: ["VOCE Audio", "Ascolta AI Governance", "Una voce per sistemi, autorità e responsabilità."],
      technoference: ["VOCE Audio", "Ascolta Technoference", "Una voce per attenzione, cognizione e vita digitale."],
      academy: ["VOCE Audio", "Scopri Academy", "Come esplorare il corpus pubblico."],
      sovereignty: ["VOCE Audio", "Comprendi Sovereignty", "Dipendenze tecnologiche e libertà di scelta."],
      workforce: ["VOCE Audio", "Scopri Light Workforce", "Automazione e competenze."],
      applied: ["VOCE Audio", "Scopri VOCE Applied", "Competenza al servizio delle istituzioni."],
      publications: ["VOCE Audio", "Esplora le pubblicazioni", "Ricerca e analisi documentate."],
      play: "Ascolta", pause: "Pausa", unavailable: "Audio non disponibile"
    }
  };

  const pageKey = path === "/" ? "home" : ({"/archive":"academy","/research":"research","/governance":"governance","/technoference":"technoference","/sovereignty":"sovereignty","/light-workforce":"workforce","/applied":"applied","/publications":"publications","/art":"art"})[path];

  function currentLang() {
    const active = document.querySelector(".lang [data-lang].active");
    const raw = (rawPath.startsWith("/fr/") ? "fr" : rawPath.startsWith("/it/") ? "it" : active?.getAttribute("data-lang") || document.documentElement.lang || "en").toLowerCase();
    return raw.startsWith("fr") ? "fr" : raw.startsWith("it") ? "it" : "en";
  }

  function masterSource(lang) {
    return pageKey === "home" ? `/assets/audio/voce-signature-${lang}.wav` : `/assets/audio/voce-brief-${pageKey}-${lang}.wav`;
  }

  function findAnchor() {
    return document.querySelector("main > .topic-hero, main > .hero, .topic-hero, .hero");
  }

  function makeShell() {
    const shell = document.createElement("section");
    shell.className = "voce-audio-signature";
    shell.setAttribute("aria-label", "VOCE Audio");
    shell.innerHTML = `
      <div class="wrap voce-audio-inner">
        <div class="voce-audio-copy">
          <span class="voce-audio-eyebrow"></span>
          <strong class="voce-audio-title"></strong>
          <small class="voce-audio-note"></small>
        </div>
        <div class="voce-audio-controls">
          <button type="button" class="voce-audio-toggle" aria-pressed="false">
            <span class="voce-audio-glyph" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></span>
            <span class="voce-audio-action"></span>
          </button>
          <audio preload="none"></audio>
        </div>
      </div>`;
    return shell;
  }

  const anchor = findAnchor();
  if (!anchor) return;

  const shell = makeShell();
  const audio = shell.querySelector("audio");
  const button = shell.querySelector(".voce-audio-toggle");
  const eyebrow = shell.querySelector(".voce-audio-eyebrow");
  const title = shell.querySelector(".voce-audio-title");
  const note = shell.querySelector(".voce-audio-note");
  const action = shell.querySelector(".voce-audio-action");
  let activeSource = "";

  async function sourceExists(src) {
    try {
      const response = await fetch(src, { method: "HEAD", cache: "no-store", credentials: "same-origin" });
      return response.ok && (response.headers.get("content-type") || "").toLowerCase().includes("audio");
    } catch {
      return false;
    }
  }

  function renderCopy(lang) {
    const copy = COPY[lang] || COPY.en;
    const page = copy[pageKey] || copy.home;
    eyebrow.textContent = page[0];
    title.textContent = page[1];
    note.textContent = page[2];
    action.textContent = audio.paused ? copy.play : copy.pause;
    button.setAttribute("aria-label", audio.paused ? page[1] : copy.pause);
  }

  async function activate(lang) {
    renderCopy(lang);
    const src = masterSource(lang);
    if (src === activeSource && shell.classList.contains("is-ready")) return;

    if (!audio.paused) audio.pause();
    shell.classList.remove("is-ready", "is-playing");
    button.setAttribute("aria-pressed", "false");
    audio.removeAttribute("src");
    audio.load();

    if (!(await sourceExists(src))) return;
    activeSource = src;
    audio.src = src;
    audio.load();
    shell.classList.add("is-ready");
  }

  button.addEventListener("click", async () => {
    const lang = currentLang();
    if (!shell.classList.contains("is-ready")) {
      await activate(lang);
      if (!shell.classList.contains("is-ready")) return;
    }
    if (audio.paused) {
      try { await audio.play(); } catch { return; }
    } else {
      audio.pause();
    }
  });

  audio.addEventListener("play", () => {
    shell.classList.add("is-playing");
    button.setAttribute("aria-pressed", "true");
    renderCopy(currentLang());
  });
  audio.addEventListener("pause", () => {
    shell.classList.remove("is-playing");
    button.setAttribute("aria-pressed", "false");
    renderCopy(currentLang());
  });
  audio.addEventListener("ended", () => {
    shell.classList.remove("is-playing");
    button.setAttribute("aria-pressed", "false");
    renderCopy(currentLang());
  });

  anchor.insertAdjacentElement("afterend", shell);
  activate(currentLang());

  document.addEventListener("click", event => {
    const langButton = event.target.closest(".lang [data-lang]");
    if (!langButton) return;
    const lang = langButton.getAttribute("data-lang");
    if (lang) setTimeout(() => activate(lang), 0);
  });
})();
