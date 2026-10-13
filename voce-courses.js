(() => {
  const audio = document.querySelector('#courses-audio');
  const button = document.querySelector('[data-course-audio]');
  const status = document.querySelector('.courses-audio-status');
  if (!audio || !button || !status) return;
  const idle = '37 secondes · VOCE Audio';
  function render() {
    button.textContent = audio.paused ? 'Écouter le fonctionnement' : 'Mettre en pause';
    button.setAttribute('aria-pressed', String(!audio.paused));
  }
  button.addEventListener('click', async () => {
    if (!audio.paused) { audio.pause(); return; }
    status.textContent = 'Chargement de l’explication…';
    try { await audio.play(); status.textContent = 'Lecture de l’explication'; }
    catch { status.textContent = 'Audio indisponible. L’explication écrite reste accessible ci-dessous.'; render(); }
  });
  audio.addEventListener('play', render);
  audio.addEventListener('pause', () => { render(); status.textContent = idle; });
  audio.addEventListener('ended', () => { audio.currentTime = 0; render(); status.textContent = idle; });
  audio.addEventListener('error', () => {
    render(); status.textContent = 'Audio indisponible. Ouvrez l’explication écrite ci-dessous.';
  });
  window.addEventListener('pagehide', () => audio.pause());
})();
