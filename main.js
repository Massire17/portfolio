import { runMaliLangInterpreter } from './malilang-engine.js';

document.addEventListener('DOMContentLoaded', () => {

  // ======================================================
  // 0. CURSEUR NÉON CYBERNÉTIQUE ET HORLOGE BAMAKO
  // ======================================================
  const cursorOuter = document.getElementById('cursor-outer');
  const cursorInner = document.getElementById('cursor-inner');

  if (cursorOuter && cursorInner && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let outerX = mouseX;
    let outerY = mouseY;

    cursorInner.style.left = `${mouseX}px`;
    cursorInner.style.top = `${mouseY}px`;
    cursorOuter.style.left = `${outerX}px`;
    cursorOuter.style.top = `${outerY}px`;

    window.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      cursorInner.style.left = `${mouseX}px`;
      cursorInner.style.top = `${mouseY}px`;
    }, { passive: true });

    function renderCursor() {
      outerX += (mouseX - outerX) * 0.18;
      outerY += (mouseY - outerY) * 0.18;
      cursorOuter.style.left = `${outerX}px`;
      cursorOuter.style.top = `${outerY}px`;
      requestAnimationFrame(renderCursor);
    }
    requestAnimationFrame(renderCursor);
  }


  // Horloge Bamako & Locale Dynamiques
  const bamakoClock = document.getElementById('bamakoClock');
  if (bamakoClock) {
    function updateClock() {
      const now = new Date();
      const optionsBamako = { timeZone: 'Africa/Bamako', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false };
      const bamakoTime = new Intl.DateTimeFormat('fr-FR', optionsBamako).format(now);
      
      const optionsLocal = { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false };
      const localTime = new Intl.DateTimeFormat('fr-FR', optionsLocal).format(now);
      
      bamakoClock.innerHTML = `${bamakoTime} <span class="text-gray-500 text-[10px]">(LOCAL: ${localTime})</span>`;
    }
    updateClock();
    setInterval(updateClock, 1000);
  }

  document.body.classList.add('js-observer-active');

  // ======================================================
  // 0.5 INTERSECTION OBSERVER POUR NAVIGATION & REVEAL
  // ======================================================
  const sections = document.querySelectorAll('section[id]');
  const navDots = document.querySelectorAll('.nav-dot');
  const mobileNavLinks = document.querySelectorAll('#mobile-nav a');

  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('strate-visible');

        const id = entry.target.getAttribute('id');
        navDots.forEach(dot => {
          if (dot.getAttribute('href') === `#${id}`) {
            dot.classList.add('active');
          } else {
            dot.classList.remove('active');
          }
        });

        mobileNavLinks.forEach(link => {
          if (link.getAttribute('href') === `#${id}`) {
            link.classList.add('active');
          } else {
            link.classList.remove('active');
          }
        });
      }
    });
  }, { threshold: 0.25 });

  sections.forEach(section => {
    section.classList.add('strate-hidden');
    sectionObserver.observe(section);
  });

  // ======================================================
  // 0.6 GRAPHE DE COMPÉTENCES INTERACTIF
  // ======================================================
  const skillNodes = document.querySelectorAll('.skill-node');
  const skillPanel = document.getElementById('skillPanel');
  const skillPanelTechs = document.getElementById('skillPanelTechs');
  const skillPanelProjectName = document.getElementById('skillPanelProjectName');

  skillNodes.forEach(node => {
    node.addEventListener('click', () => {
      const techs = node.getAttribute('data-techs');
      const project = node.getAttribute('data-project');

      if (skillPanel && skillPanelTechs && skillPanelProjectName) {
        skillPanelTechs.innerText = techs;
        skillPanelProjectName.innerText = project;
        skillPanel.classList.remove('hidden');
        playBeep(900, 0.05);
      }
    });
  });

  // ======================================================
  // 1. SYNTHÉTISEUR AUDIO (WEB AUDIO API)
  // ======================================================
  let audioEnabled = false;
  const soundToggle = document.getElementById('soundToggle');
  const soundIndicator = document.getElementById('soundIndicator');
  const soundText = document.getElementById('soundText');
  let audioCtx = null;

  if (soundToggle) {
    soundToggle.addEventListener('click', () => {
      audioEnabled = !audioEnabled;
      if (audioEnabled) {
        soundIndicator.className = 'w-2 h-2 rounded-full bg-cyan-400 animate-pulse';
        soundText.innerText = 'AUDIO : ACTIVÉ';
        soundText.classList.add('text-cyan-400');
        if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        playBeep(600, 0.1);
      } else {
        soundIndicator.className = 'w-2 h-2 rounded-full bg-gray-500';
        soundText.innerText = 'AUDIO : DÉSACTIVÉ';
        soundText.classList.remove('text-cyan-400');
      }
    });
  }

  function playBeep(freq = 440, duration = 0.08) {
    if (!audioEnabled || !audioCtx) return;
    try {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + duration);
    } catch (e) {}
  }

  // Sons au survol et clic des boutons
  document.querySelectorAll('button, a, input[type="range"]').forEach(el => {
    el.addEventListener('mouseenter', () => playBeep(800, 0.03));
    el.addEventListener('click', () => playBeep(400, 0.08));
  });

  // ======================================================
  // 2. SIMULATEUR IA PRÉDICTION DE CHURN (AVEC ANIMATION PIPELINE)
  // ======================================================
  const tenureInput = document.getElementById('tenureInput');
  const chargesInput = document.getElementById('chargesInput');
  const callsInput = document.getElementById('callsInput');

  const tenureVal = document.getElementById('tenureVal');
  const chargesVal = document.getElementById('chargesVal');
  const callsVal = document.getElementById('callsVal');

  const churnProb = document.getElementById('churnProb');
  const churnStatus = document.getElementById('churnStatus');

  const pipeData = document.getElementById('pipe-data');
  const pipeEncode = document.getElementById('pipe-encode');
  const pipeModel = document.getElementById('pipe-model');
  const pipePredict = document.getElementById('pipe-predict');

  function animatePipeline() {
    const steps = [pipeData, pipeEncode, pipeModel, pipePredict];
    steps.forEach(s => s && s.classList.remove('active'));

    steps.forEach((step, idx) => {
      if (step) {
        setTimeout(() => {
          step.classList.add('active');
        }, idx * 100);
      }
    });
  }

  function calculateChurn() {
    const tenure = Number(tenureInput.value);
    const charges = Number(chargesInput.value);
    const calls = Number(callsInput.value);

    tenureVal.innerText = tenure;
    chargesVal.innerText = charges;
    callsVal.innerText = calls;

    animatePipeline();

    // Simulation de formule d'inférence de régression logistique
    let score = (calls * 12.5) + (charges * 0.45) - (tenure * 1.8);
    let probability = 1 / (1 + Math.exp(-score / 20));
    let pct = Math.min(Math.max((probability * 100).toFixed(1), 3.2), 98.7);

    churnProb.innerText = `${pct}%`;

    if (pct > 60) {
      churnProb.className = 'text-3xl font-extrabold text-amber-400 mb-1';
      churnStatus.innerText = '[ RISQUE D\'ABANDON ÉLEVÉ DÉTECTÉ ]';
      churnStatus.className = 'text-amber-400 font-semibold text-xs';
    } else if (pct > 35) {
      churnProb.className = 'text-3xl font-extrabold text-yellow-400 mb-1';
      churnStatus.innerText = '[ RISQUE DE RÉTENTION MODÉRÉ ]';
      churnStatus.className = 'text-yellow-400 font-semibold text-xs';
    } else {
      churnProb.className = 'text-3xl font-extrabold text-emerald-400 mb-1';
      churnStatus.innerText = '[ ABONNÉ STABLE / CHURN FAIBLE ]';
      churnStatus.className = 'text-emerald-400 font-semibold text-xs';
    }
  }

  if (tenureInput) {
    [tenureInput, chargesInput, callsInput].forEach(inp => {
      inp.addEventListener('input', calculateChurn);
    });
    calculateChurn();
  }

  // ======================================================
  // 3. EXÉCUTEUR REPL MALILANG
  // ======================================================
  const runMaliLangBtn = document.getElementById('runMaliLangBtn');
  const loadPresetBtn = document.getElementById('loadPresetBtn');
  const maliLangInput = document.getElementById('maliLangInput');
  const maliLangConsole = document.getElementById('maliLangConsole');
  const execTime = document.getElementById('execTime');

  const presetCode = `# Programme écrit en langage Bambara

faleden nom = "Papin"
sebeni "An ni sogoma, " + nom

faleden age = 24
ni age >= 18 {
    sebeni "Mogoba de don! (Accès Adulte)"
} note {
    sebeni "Denmisen (Mineur)"
}`;

  if (loadPresetBtn) {
    loadPresetBtn.addEventListener('click', () => {
      maliLangInput.value = presetCode;
      playBeep(900, 0.05);
    });
  }

  if (runMaliLangBtn) {
    runMaliLangBtn.addEventListener('click', () => {
      const code = maliLangInput.value;
      maliLangConsole.innerText = '';
      execTime.innerText = 'EXÉCUTION...';
      execTime.className = 'text-amber-400 animate-pulse';

      let outputs = [];
      setTimeout(() => {
        runMaliLangInterpreter(code, (outputLine) => {
          outputs.push(outputLine);
        });

        if (outputs.length === 0) {
          maliLangConsole.innerText = '[Programme exécuté avec succès sans sortie console]';
        } else {
          maliLangConsole.innerText = outputs.join('\n');
        }

        execTime.innerText = 'TERMINÉ (0.04ms)';
        execTime.className = 'text-emerald-400';
        playBeep(700, 0.1);
      }, 200);
    });
  }

  // ======================================================
  // 4. SOUMISSION CONSOLE DE TRANSMISSION (CONTACT & MAILTO)
  // ======================================================
  const transmissionForm = document.getElementById('transmissionForm');
  const transmissionSuccess = document.getElementById('transmissionSuccess');

  if (transmissionForm) {
    transmissionForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const senderName = document.getElementById('senderName').value;
      const senderEmail = document.getElementById('senderEmail').value;
      const senderMessage = document.getElementById('senderMessage').value;

      document.getElementById('submitTransmission').innerText = 'ENVOI EN COURS...';
      setTimeout(() => {
        const mailtoUri = `mailto:massire.kamara@example.com?subject=${encodeURIComponent('Transmission Portfolio de ' + senderName)}&body=${encodeURIComponent(senderMessage + '\n\n---\nExpéditeur: ' + senderName + ' (' + senderEmail + ')')}`;
        window.location.href = mailtoUri;

        transmissionForm.reset();
        transmissionSuccess.classList.remove('hidden');
        document.getElementById('submitTransmission').innerText = 'TRANSMISSION ENVOYÉE ✓';
        playBeep(1000, 0.2);
      }, 600);
    });
  }

  // ======================================================
  // 5. EASTER EGGS (KONAMI CODE & GLITCH)
  // ======================================================
  const konamiCode = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
  let konamiIndex = 0;

  document.addEventListener('keydown', (e) => {
    if (e.key === konamiCode[konamiIndex]) {
      konamiIndex++;
      if (konamiIndex === konamiCode.length) {
        const modal = document.getElementById('easterEggModal');
        if (modal) modal.classList.add('show');
        playBeep(1200, 0.3);
        konamiIndex = 0;
      }
    } else {
      konamiIndex = 0;
    }
  });

  console.log("%c[ THE MASSIRE ENGINE ] %cBienvenue dans la console système. Nœud Bamako connecté.", "color: #06b6d4; font-weight: bold; font-size: 14px;", "color: #10b981; font-size: 12px;");
});
