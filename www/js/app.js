
document.addEventListener('deviceready', onDeviceReady, false);
if (!window.cordova) {
  window.addEventListener('load', onDeviceReady);
}

function onDeviceReady() {
  App.init();
}

const App = (function(){
  const API_BASE = 'https://tyradex.vercel.app/api/v1/pokemon';
  const TOTAL_QUESTIONS = 10;
  const MAX_POKEMON_ID = 1025;

  // Pages
  const pages = {
    home: document.getElementById('home'),
    quiz: document.getElementById('quiz'),
    result: document.getElementById('result'),
    board: document.getElementById('board')
  };

  // Quiz refs
  const qIndexEl = document.getElementById('q-index');
  const canvas = document.getElementById('pkmCanvas');
  const answerInput = document.getElementById('answer');
  const messageEl = document.getElementById('message');

  // Result refs
  const finalScoreEl = document.getElementById('final-score');
  const finalTimeEl = document.getElementById('final-time');
  const nameInput = document.getElementById('player-name');

  // Board
  const leaderList = document.getElementById('leader-list');

  // State
  let currentQuestion = 0;
  let correctCount = 0;
  let startTime = null;
  let currentPokemon = null;
  const usedIds = new Set();

  function show(pageName) {
    Object.values(pages).forEach(p => p.classList.add('hidden'));
    pages[pageName].classList.remove('hidden');
  }

  function hookButtons() {
    document.getElementById('btn-start').addEventListener('click', startQuiz);
    document.getElementById('btn-board').addEventListener('click', showBoard);
    document.getElementById('btn-back-home').addEventListener('click', ()=>show('home'));
    document.getElementById('btn-back-home-2').addEventListener('click', ()=>show('home'));
    document.getElementById('btn-submit').addEventListener('click', submitAnswer);
    document.getElementById('btn-save-score').addEventListener('click', saveScoreAndShowBoard);
    document.getElementById('btn-play-again').addEventListener('click', startQuiz);
    answerInput.addEventListener('keyup', e => { if (e.key === 'Enter') submitAnswer(); });
  }

  function startQuiz() {
    currentQuestion = 0;
    correctCount = 0;
    usedIds.clear();
    startTime = Date.now();
    messageEl.textContent = '';
    answerInput.value = '';
    show('quiz');
    nextQuestion();
  }

  function randomId() {
    let id;
    do { id = Math.floor(Math.random() * MAX_POKEMON_ID) + 1; }
    while (usedIds.has(id));
    usedIds.add(id);
    return id;
  }

  async function nextQuestion() {
    currentQuestion++;
    qIndexEl.textContent = currentQuestion;
    messageEl.textContent = '';
    answerInput.value = '';
    if (currentQuestion > TOTAL_QUESTIONS) {
      finishQuiz();
      return;
    }
    try {
      const id = randomId();
      const data = await fetchPokemon(id);
      const pokeName = data.name?.fr || data.name?.en || data.name || '';
      const imageUrl = data.sprites?.regular || null;
      currentPokemon = { id, name: pokeName, img: imageUrl };
      if (!imageUrl) { setTimeout(nextQuestion, 500); return; }
      await drawImageAsBlackAndWhite(imageUrl, canvas);
      answerInput.focus();
    } catch (err) {
      console.error(err);
      messageEl.textContent = 'Erreur réseau, réessaie...';
    }
  }

  async function fetchPokemon(id) {
    const res = await fetch(`${API_BASE}/${id}`);
    if (!res.ok) throw new Error('Pokemon not found');
    return res.json();
  }

  function normalizeName(s) {
    return (s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,'').toLowerCase();
  }

  async function submitAnswer() {
    if (!currentPokemon) return;
    const guess = answerInput.value.trim();
    if (!guess) { messageEl.textContent = 'Écris un nom !'; return; }
    const correct = normalizeName(guess) === normalizeName(currentPokemon.name);
    if (correct) { correctCount++; messageEl.textContent = `✔️ Bravo — ${currentPokemon.name}`; }
    else { messageEl.textContent = `❌ Raté — c'était ${currentPokemon.name}`; }
    setTimeout(nextQuestion, 900);
  }

  function finishQuiz() {
    const elapsedSec = Math.round((Date.now() - startTime) / 1000);
    App._lastResult = { score: correctCount, time: elapsedSec, date: new Date().toISOString() };
    finalScoreEl.textContent = correctCount;
    finalTimeEl.textContent = elapsedSec;
    nameInput.value = '';
    show('result');
  }

  async function saveScoreAndShowBoard() {
    const playerName = nameInput.value.trim() || 'Anonyme';
    const payload = Object.assign({ name: playerName }, App._lastResult || {});
    try {
      await Storage.saveScore(payload);
      await showBoard();
    } catch(e) {
      alert('Erreur sauvegarde');
    }
  }

  async function showBoard() {
    show('board');
    leaderList.innerHTML = '<li>Chargement...</li>';
    const arr = await Storage.readScores();
    const top5 = (arr||[]).slice(0,5);
    leaderList.innerHTML = '';
    if (!top5.length) { leaderList.innerHTML = '<li>Aucun score enregistré</li>'; return; }
    top5.forEach(s => {
      const li = document.createElement('li');
      li.textContent = `${s.name} — ${s.score}/10 — ${s.time || 0}s`;
      leaderList.appendChild(li);
    });
  }

  function drawImageAsBlackAndWhite(url, canvasEl, threshold = 128) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const ctx = canvasEl.getContext('2d');
        const w = canvasEl.width, h = canvasEl.height;
        ctx.clearRect(0,0,w,h);
        ctx.drawImage(img, 0,0,w,h);
        let imageData;
        try { imageData = ctx.getImageData(0,0,w,h); }
        catch { canvasEl.style.filter = 'grayscale(1) contrast(1.2)'; resolve(); return; }
        const d = imageData.data;
        for (let i=0;i<d.length;i+=4){
          const lum = 0.299*d[i] + 0.587*d[i+1] + 0.114*d[i+2];
          const v = lum < threshold ? 0 : 255;
          d[i]=d[i+1]=d[i+2]=v;
        }
        ctx.putImageData(imageData,0,0);
        resolve();
      };
      img.onerror = reject;
      img.src = url;
    });
  }

  function init(){ hookButtons(); show('home'); }
  return { init, _lastResult:null };
})();
