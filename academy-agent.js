(() => {
  const form = document.querySelector("[data-academy-agent-form]");
  const input = document.querySelector("[data-academy-agent-input]");
  const output = document.querySelector("[data-academy-agent-output]");
  const submit = document.querySelector("[data-academy-agent-submit]");
  if (!form || !input || !output || !submit) return;

  function esc(value="") {
    return String(value)
      .replace(/&/g,"&amp;")
      .replace(/</g,"&lt;")
      .replace(/>/g,"&gt;")
      .replace(/"/g,"&quot;")
      .replace(/'/g,"&#39;");
  }

  function lang() {
    return document.documentElement.lang || localStorage.getItem("voce-lang") || "en";
  }

  function ui() {
    const l = lang();
    if (l.startsWith("fr")) return {
      docs:"Documents VOCE",
      routes:"Parcours recommandé",
      none:"Je n’ai pas trouvé de réponse suffisamment solide dans le corpus VOCE.",
      searching:"Recherche…",
      status:"VOCE Guide interroge le corpus et vérifie les documents pertinents.",
      error:"La recherche intelligente est momentanément indisponible. Les parcours VOCE restent accessibles.",
      button:"Interroger"
    };
    if (l.startsWith("it")) return {
      docs:"Documenti VOCE",
      routes:"Percorso consigliato",
      none:"Non ho trovato una risposta sufficientemente solida nel corpus VOCE.",
      searching:"Ricerca…",
      status:"VOCE Guide interroga il corpus e verifica i documenti pertinenti.",
      error:"La ricerca intelligente è temporaneamente indisponibile. I percorsi VOCE restano accessibili.",
      button:"Interroga"
    };
    return {
      docs:"VOCE documents",
      routes:"Recommended pathway",
      none:"I could not find a sufficiently well-supported answer in the VOCE corpus.",
      searching:"Searching…",
      status:"VOCE Guide is querying the corpus and checking the relevant documents.",
      error:"Intelligent search is temporarily unavailable. VOCE pathways remain accessible.",
      button:"Ask VOCE"
    };
  }

  function paragraphize(value="") {
    return esc(value)
      .replace(/\n\n/g,"</p><p>")
      .replace(/^/,"<p>")
      .replace(/$/,"</p>");
  }

  function render(data) {
    const sources = Array.isArray(data.sources) ? data.sources : [];
    const destinations = Array.isArray(data.destinations) ? data.destinations : [];

    const destinationHtml = destinations.length
      ? '<div class="academy-agent-destinations"><div class="academy-agent-label">' + esc(ui().routes) + '</div>' +
        destinations.map((d,i) =>
          '<a class="academy-agent-destination" href="' + esc(d.url) + '">' +
          '<span>' + String(i+1).padStart(2,"0") + '</span><div><strong>' + esc(d.title) +
          '</strong><small>' + esc(d.description || "") + '</small></div><b aria-hidden="true">→</b></a>'
        ).join("") + '</div>'
      : "";

    const sourceHtml = sources.length
      ? '<div class="academy-agent-sources"><div class="academy-agent-label">' + esc(ui().docs) + '</div>' +
        sources.map((s,i) =>
          '<a href="' + esc(s.url) + '"><span>' + String(i+1).padStart(2,"0") + '</span><strong>' +
          esc(s.title) + '</strong><small>' + esc(s.date || "") + '</small></a>'
        ).join("") + '</div>'
      : "";

    output.innerHTML =
      '<div class="academy-agent-answer">' +
      paragraphize(data.answer || ui().none) +
      '</div>' + destinationHtml + sourceHtml;
  }

  async function ask(question) {
    const q = String(question || "").trim();
    if (!q) {
      input.focus();
      return;
    }
    input.value = q;
    submit.disabled = true;
    submit.textContent = ui().searching;
    output.innerHTML = '<p class="academy-agent-status">' + esc(ui().status) + '</p>';
    try {
      const response = await fetch("/api/academy-agent", {
        method:"POST",
        headers:{"content-type":"application/json"},
        body:JSON.stringify({q,lang:lang()})
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Search error");
      render(data);
    } catch (error) {
      output.innerHTML = '<p class="academy-agent-status">' + esc(ui().error) + '</p>';
    } finally {
      submit.disabled = false;
      submit.textContent = ui().button;
    }
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    ask(input.value);
  });

  document.querySelectorAll("[data-guide-query]").forEach(button => {
    button.addEventListener("click", (event) => {
      if (button.tagName === "A") event.preventDefault();
      const l = lang().slice(0,2);
      const query = button.getAttribute("data-guide-query-" + l) || button.getAttribute("data-guide-query-en") || button.getAttribute("data-guide-query") || "";
      ask(query);
      output.scrollIntoView({behavior:"smooth",block:"nearest"});
    });
  });
})();