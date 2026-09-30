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

  function ui() {
    const l = document.documentElement.lang || localStorage.getItem("voce-lang") || "en";
    if (l.startsWith("fr")) return {docs:"Documents VOCE",none:"Je n’ai pas trouvé de réponse suffisamment solide dans le corpus VOCE.",searching:"Recherche…",status:"Je cherche uniquement dans le corpus VOCE.",error:"La recherche intelligente est momentanément indisponible. Les parcours et documents de VOCE Academy restent accessibles ci-dessous.",button:"Chercher"};
    if (l.startsWith("it")) return {docs:"Documenti VOCE",none:"Non ho trovato una risposta sufficientemente solida nel corpus VOCE.",searching:"Ricerca…",status:"Cerco esclusivamente nel corpus VOCE.",error:"La ricerca intelligente è temporaneamente indisponibile. I percorsi e i documenti di VOCE Academy restano accessibili qui sotto.",button:"Cerca"};
    return {docs:"VOCE documents",none:"I could not find a sufficiently well-supported answer in the VOCE corpus.",searching:"Searching…",status:"I am searching only the VOCE corpus.",error:"Intelligent search is temporarily unavailable. VOCE Academy pathways and documents remain accessible below.",button:"Search"};
  }

  function render(data) {
    const sources = Array.isArray(data.sources) ? data.sources : [];
    const sourceHtml = sources.length
      ? '<div class="academy-agent-sources"><div class="academy-agent-label">' + esc(ui().docs) + '</div>' +
        sources.map((s,i) =>
          '<a href="' + esc(s.url) + '"><span>' + String(i+1).padStart(2,"0") + '</span><strong>' +
          esc(s.title) + '</strong><small>' + esc(s.date || "") + '</small></a>'
        ).join("") + '</div>'
      : "";
    output.innerHTML =
      '<div class="academy-agent-answer">' +
      esc(data.answer || ui().none)
        .replace(/\n\n/g,"</p><p>")
        .replace(/^/,"<p>").replace(/$/,"</p>") +
      '</div>' + sourceHtml;
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const q = input.value.trim();
    if (!q) return;
    submit.disabled = true;
    submit.textContent = ui().searching;
    output.innerHTML = '<p class="academy-agent-status">' + esc(ui().status) + '</p>';
    try {
      const response = await fetch("/api/academy-agent", {
        method:"POST",
        headers:{"content-type":"application/json"},
        body:JSON.stringify({q})
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Erreur de recherche");
      render(data);
    } catch (error) {
      output.innerHTML = '<p class="academy-agent-status">' + esc(ui().error) + '</p>';
    } finally {
      submit.disabled = false;
      submit.textContent = ui().button;
    }
  });
})();