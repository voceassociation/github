(() => {
  const audio = document.querySelector('#courses-audio');
  const button = document.querySelector('[data-course-audio]');
  const status = document.querySelector('.courses-audio-status');
  if (!audio || !button || !status) return;
  const lang = document.documentElement.lang || 'fr';
  const strings = {
    fr: {play:'Écouter le fonctionnement',pause:'Mettre en pause',loading:'Chargement de l’explication…',playing:'Lecture de l’explication',error:'Audio indisponible. L’explication écrite reste accessible ci-dessous.',seconds:'secondes'},
    en: {play:'Listen to how it works',pause:'Pause',loading:'Loading the explanation…',playing:'Playing the explanation',error:'Audio unavailable. The written explanation is available below.',seconds:'seconds'},
    it: {play:'Ascolta come funziona',pause:'Pausa',loading:'Caricamento della spiegazione…',playing:'Riproduzione della spiegazione',error:'Audio non disponibile. La spiegazione scritta è disponibile qui sotto.',seconds:'secondi'}
  };
  const copy = strings[lang] || strings.fr;
  const idle = Math.round(Number(audio.dataset.duration || 37)) + ' ' + copy.seconds + ' · VOCE Audio';
  function render() {
    button.textContent = audio.paused ? copy.play : copy.pause;
    button.setAttribute('aria-pressed', String(!audio.paused));
  }
  render(); status.textContent = idle;
  button.addEventListener('click', async () => {
    if (!audio.paused) { audio.pause(); return; }
    status.textContent = copy.loading;
    try { await audio.play(); status.textContent = copy.playing; }
    catch { status.textContent = copy.error; render(); }
  });
  audio.addEventListener('play', render);
  audio.addEventListener('pause', () => {render(); status.textContent = idle;});
  audio.addEventListener('ended', () => {audio.currentTime = 0;render();status.textContent = idle;});
  audio.addEventListener('error', () => {render();status.textContent = copy.error;});
  window.addEventListener('pagehide', () => audio.pause());
})();
