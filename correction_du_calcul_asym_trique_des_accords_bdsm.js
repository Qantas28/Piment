// =========================================================================
    // 1. RETOUR HAPTIQUE & THÈME MÉMORISÉ
    // =========================================================================

    function triggerHaptic(duration = 12) {
      try {
        if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
          navigator.vibrate(duration);
        }
      } catch (e) {
        // Ignorer silencieusement si non supporté
      }
    }

    const THEME_STORAGE_KEY = 'piment_editorial_theme';

    function loadSavedTheme() {
      try {
        const saved = localStorage.getItem(THEME_STORAGE_KEY);
        if (saved === 'evening' || saved === 'day') {
          return saved;
        }
      } catch (e) {
        // Fallback silencieux
      }
      return 'day';
    }

    function applyThemeToDocument(theme) {
      try {
        if (theme === 'evening') {
          document.documentElement.setAttribute('data-theme', 'evening');
        } else {
          document.documentElement.removeAttribute('data-theme');
        }
        try {
          localStorage.setItem(THEME_STORAGE_KEY, theme);
        } catch (e) {
          // Ignorer si stockage indisponible
        }
      } catch (e) {
        // Repli silencieux
      }
    }

    // =========================================================================
    // 2. ÉCRAN D'ACCUEIL NÉON & ANIMATION DE COMBUSTION EN FLAMME (NON BLOQUANTE)
    // =========================================================================

    let isBurningTransition = false;
    let flameRafId = null;
    let flameSafetyTimer = null;

    function dismissWelcomeLayerImmediately() {
      try {
        if (flameRafId) {
          cancelAnimationFrame(flameRafId);
          flameRafId = null;
        }
        if (flameSafetyTimer) {
          clearTimeout(flameSafetyTimer);
          flameSafetyTimer = null;
        }
        const layer = document.getElementById('welcomeLayer');
        const canvas = document.getElementById('flameCanvas');
        if (canvas) {
          canvas.classList.add('hidden');
        }
        if (layer) {
          layer.classList.add('hidden', 'pointer-events-none');
          layer.style.display = 'none';
          layer.style.visibility = 'hidden';
          layer.style.opacity = '0';
          layer.style.zIndex = '-1';
        }
      } catch (e) {
        // Repli minimal
      } finally {
        isBurningTransition = false;
      }
    }

    function startFlameTransition() {
      try {
        if (!state.currentView) {
          state.currentView = 'hub';
        }
        renderApp();
      } catch (e) {
        // Repli silencieux
      }

      if (isBurningTransition) {
        dismissWelcomeLayerImmediately();
        return;
      }

      isBurningTransition = true;
      triggerHaptic(15);

      flameSafetyTimer = setTimeout(() => {
        dismissWelcomeLayerImmediately();
      }, 950);

      try {
        const layer = document.getElementById('welcomeLayer');
        const backdrop = document.getElementById('welcomeBackdrop');
        const content = document.getElementById('welcomeContent');
        const canvas = document.getElementById('flameCanvas');

        if (!layer || !canvas || typeof requestAnimationFrame !== 'function') {
          dismissWelcomeLayerImmediately();
          return;
        }

        const ctx = canvas.getContext ? canvas.getContext('2d') : null;
        if (!ctx) {
          dismissWelcomeLayerImmediately();
          return;
        }

        layer.classList.add('pointer-events-none');
        canvas.classList.remove('hidden');

        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const width = Math.max(1, window.innerWidth || document.documentElement.clientWidth || 360);
        const height = Math.max(1, window.innerHeight || document.documentElement.clientHeight || 640);
        canvas.width = Math.floor(width * dpr);
        canvas.height = Math.floor(height * dpr);
        ctx.scale(dpr, dpr);

        const embers = [];
        const emberCount = Math.min(95, Math.max(45, Math.floor(width / 12)));
        for (let i = 0; i < emberCount; i++) {
          embers.push({
            x: Math.random() * width,
            yOffset: (Math.random() - 0.5) * 45,
            vx: (Math.random() - 0.5) * 1.4,
            vy: -(1.4 + Math.random() * 2.8),
            radius: 1.2 + Math.random() * 2.8,
            alpha: 0.65 + Math.random() * 0.35,
            phase: Math.random() * Math.PI * 2,
            warmth: Math.random()
          });
        }

        const duration = 760;
        const startTime = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();

        function computeBurnLineY(x, baseFrontY, timeSec) {
          const nx = x / Math.max(1, width);
          const wave1 = Math.sin(nx * 7.5 + timeSec * 6.5) * 20;
          const wave2 = Math.cos(nx * 15.0 - timeSec * 9.0) * 11;
          const wave3 = Math.sin(nx * 29.0 + timeSec * 12.0) * 5;
          return baseFrontY + wave1 + wave2 + wave3;
        }

        function frame(now) {
          try {
            const currentNow = typeof now === 'number' ? now : Date.now();
            const elapsed = Math.max(0, currentNow - startTime);
            const rawT = Math.min(1, elapsed / duration);
            const eased = rawT < 0.5
              ? 2 * rawT * rawT
              : 1 - Math.pow(-2 * rawT + 2, 2) / 2;

            const timeSec = elapsed / 1000;
            const baseFrontY = (height + 40) - eased * (height + 130);

            const segments = 40;
            const polygonPoints = ['0% 0%', '100% 0%'];
            for (let s = segments; s >= 0; s--) {
              const px = (s / segments) * width;
              const py = Math.max(0, Math.min(height, computeBurnLineY(px, baseFrontY, timeSec)));
              const xPct = ((px / width) * 100).toFixed(2);
              const yPct = ((py / height) * 100).toFixed(2);
              polygonPoints.push(`${xPct}% ${yPct}%`);
            }
            const clipStr = `polygon(${polygonPoints.join(', ')})`;

            if (backdrop) {
              backdrop.style.clipPath = clipStr;
              backdrop.style.webkitClipPath = clipStr;
            }
            if (content) {
              content.style.clipPath = clipStr;
              content.style.webkitClipPath = clipStr;
              content.style.opacity = String(Math.max(0, 1 - eased * 1.18));
              content.style.transform = `translateY(${(-eased * 16).toFixed(1)}px) scale(${(1 - eased * 0.025).toFixed(4)})`;
            }

            ctx.clearRect(0, 0, width, height);

            if (rawT < 0.98) {
              ctx.save();
              ctx.globalCompositeOperation = 'lighter';

              ctx.beginPath();
              for (let s = 0; s <= segments; s++) {
                const px = (s / segments) * width;
                const py = computeBurnLineY(px, baseFrontY, timeSec);
                if (s === 0) ctx.moveTo(px, py);
                else ctx.lineTo(px, py);
              }
              ctx.lineWidth = 30;
              ctx.strokeStyle = 'rgba(230, 57, 46, 0.42)';
              ctx.stroke();

              ctx.lineWidth = 12;
              ctx.strokeStyle = 'rgba(244, 130, 52, 0.78)';
              ctx.stroke();

              ctx.lineWidth = 3.5;
              ctx.strokeStyle = 'rgba(255, 224, 168, 0.95)';
              ctx.stroke();

              for (const em of embers) {
                em.x += em.vx + Math.sin(timeSec * 5 + em.phase) * 0.45;
                em.yOffset += em.vy;
                if (em.yOffset < -120) {
                  em.yOffset = 18;
                  em.x = Math.random() * width;
                }
                const ey = baseFrontY + em.yOffset;
                if (ey < -20 || ey > height + 20) continue;

                const fade = Math.max(0, 1 - Math.abs(em.yOffset) / 130) * em.alpha;
                ctx.beginPath();
                ctx.arc(em.x, ey, em.radius, 0, Math.PI * 2);
                ctx.fillStyle = em.warmth > 0.45
                  ? `rgba(255, 206, 130, ${fade.toFixed(3)})`
                  : `rgba(230, 72, 54, ${fade.toFixed(3)})`;
                ctx.fill();
              }

              ctx.restore();
            }

            if (rawT < 1) {
              flameRafId = requestAnimationFrame(frame);
            } else {
              dismissWelcomeLayerImmediately();
            }
          } catch (err) {
            dismissWelcomeLayerImmediately();
          }
        }

        flameRafId = requestAnimationFrame(frame);
      } catch (e) {
        dismissWelcomeLayerImmediately();
      }
    }

    function showWelcomeScreen() {
      triggerHaptic(12);
      try {
        const layer = document.getElementById('welcomeLayer');
        const backdrop = document.getElementById('welcomeBackdrop');
        const content = document.getElementById('welcomeContent');
        const canvas = document.getElementById('flameCanvas');
        if (!layer) return;

        if (flameRafId) {
          cancelAnimationFrame(flameRafId);
          flameRafId = null;
        }
        if (flameSafetyTimer) {
          clearTimeout(flameSafetyTimer);
          flameSafetyTimer = null;
        }

        isBurningTransition = false;
        layer.style.display = '';
        layer.style.visibility = 'visible';
        layer.style.opacity = '1';
        layer.style.zIndex = '50';

        if (backdrop) {
          backdrop.style.clipPath = 'none';
          backdrop.style.webkitClipPath = 'none';
          backdrop.style.opacity = '1';
        }
        if (content) {
          content.style.clipPath = 'none';
          content.style.webkitClipPath = 'none';
          content.style.opacity = '1';
          content.style.transform = 'translateY(0) scale(1)';
        }
        if (canvas) {
          canvas.classList.add('hidden');
        }
        layer.classList.remove('hidden', 'pointer-events-none');
      } catch (e) {
        dismissWelcomeLayerImmediately();
      }
    }

    function initWelcomeInteractions() {
      try {
        const layer = document.getElementById('welcomeLayer');
        const halo = document.getElementById('welcomeHalo');
        const enterBtn = document.getElementById('enterAppBtn');
        if (!layer) return;

        if (halo) {
          const moveHalo = (clientX, clientY) => {
            halo.style.left = `${clientX}px`;
            halo.style.top = `${clientY}px`;
          };

          layer.addEventListener('pointermove', (e) => {
            moveHalo(e.clientX, e.clientY);
          }, { passive: true });

          layer.addEventListener('touchmove', (e) => {
            if (e.touches && e.touches[0]) {
              moveHalo(e.touches[0].clientX, e.touches[0].clientY);
            }
          }, { passive: true });
        }

        if (enterBtn) {
          enterBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            startFlameTransition();
          });
        }
      } catch (e) {
        // Ne jamais bloquer l'accès
      }
    }

    // =========================================================================
    // 3. DONNÉES MÉTIER — CARTES, ROLEPLAY & BDSM (30 PRATIQUES / 5 CATÉGORIES)
    // =========================================================================

    const CARDS_LEVELS = {
      1: {
        number: 1,
        roman: 'Acte I',
        name: 'Mise en bouche',
        totalCards: 6,
        ruleSummary: '6 cartes • 3 tours chacun • Action pour la personne qui tire',
        allowSkip: true,
        cards: [
          "Raconter de façon excitante notre meilleur souvenir érotique avec l'autre",
          "Embrasser toutes les parties visibles du corps de l'autre",
          "Chuchoter quelque chose de cochon dans l'oreille de l'autre",
          "Dévoiler une partie intime de son anatomie",
          "Caresser le visage de l'autre",
          "Inventer une histoire érotique avec l'autre"
        ]
      },
      2: {
        number: 2,
        roman: 'Acte II',
        name: 'Pimenté',
        totalCards: 4,
        ruleSummary: '4 cartes • 2 tours chacun • Action pour la personne qui tire',
        allowSkip: false,
        cards: [
          "Faire un massage intégral du corps en gardant les sous-vêtements",
          "Faire un strip-tease",
          "Te toucher le plus près possible de ton partenaire avec interdiction de vous toucher",
          "Prendre possession de l'autre pour qu'il ou elle fasse tout ce que tu veux sur toi"
        ]
      },
      3: {
        number: 3,
        roman: 'Acte III',
        name: 'Caliente',
        totalCards: 5,
        ruleSummary: '5 cartes • 1 tirage unique partagé à deux',
        allowSkip: false,
        cards: [
          "À tour de rôle, amener l'autre proche de la jouissance et vous arrêter — le plus de fois possible",
          "Jouissez en même temps",
          "Essayer de faire jouir l'autre sans toucher son sexe",
          "Imposer le rythme et les changements de position sans que l'autre donne d'indication (version Lui)",
          "Imposer le rythme et les changements de position sans que l'autre donne d'indication (version Elle)"
        ]
      }
    };

    const ROLEPLAY_DUOS = [
      { id: 'prof_eleve', label: 'Professeur particulier & élève', elle: 'Professeure particulière', lui: 'Élève' },
      { id: 'voisin_voisine', label: 'Voisin & voisine', elle: 'Voisine', lui: 'Voisin' },
      { id: 'airbnb_hote', label: 'Locataire Airbnb & hôte', elle: 'Locataire Airbnb', lui: 'Hôte' },
      { id: 'coach_eleve', label: 'Coach de danse & élève', elle: 'Coach de danse', lui: 'Élève' },
      { id: 'photo_modele', label: 'Photographe & modèle', elle: 'Modèle', lui: 'Photographe' }
    ];

    const ROLEPLAY_INTENTIONS = [
      "Séduction lente : la tension monte petit à petit des deux côtés",
      "Tension interdite : le jeu passe par les regards et les sous-entendus",
      "Jeu de pouvoir subtil : l'un des deux prend doucement les choses en main",
      "Complicité espiègle : provocation légère et retenue feinte",
      "Désir impatient : une scène « presque muette » où chaque geste compte"
    ];

    const ROLEPLAY_ACTIONS = [
      "Marquer un arrêt",
      "Faire une demande insolite",
      "Prendre une douche ensemble",
      "Faire tomber « discrètement » ses sous-vêtements",
      "Jouer la scène entièrement nu(e)"
    ];

    const BDSM_CATEGORIES = [
      {
        id: 'vanille',
        label: 'Vanille',
        items: [
          { id: 'v1', label: 'Bander les yeux' },
          { id: 'v2', label: 'Liens légers' },
          { id: 'v3', label: 'Ordres' },
          { id: 'v4', label: 'Collier / laisse' },
          {
            id: 'v5',
            label: 'Sensation contrastée',
            info: 'glaçons, eau froide, eau chaude, cire.'
          },
          {
            id: 'v6',
            label: 'Regard imposé',
            info: 'soutenir le regard ou baisser / détourner les yeux.'
          }
        ]
      },
      {
        id: 'soft',
        label: 'Soft',
        items: [
          { id: 's1', label: 'Contrôle total du rythme' },
          {
            id: 's2',
            label: 'Pied',
            info: 'massage, léchage, pied dans la bouche.'
          },
          { id: 's3', label: 'Pincement' },
          { id: 's4', label: 'Griffures' },
          { id: 's5', label: 'Fessées' },
          {
            id: 's6',
            label: 'Nourriture ou liquide',
            info: 'chocolat, glace, boisson, liquide.'
          }
        ]
      },
      {
        id: 'chaud',
        label: 'Chaud',
        items: [
          { id: 'c1', label: 'Morsure' },
          { id: 'c2', label: 'Tirage de cheveux' },
          { id: 'c3', label: 'Fouet' },
          { id: 'c4', label: 'Bifle' },
          { id: 'c5', label: 'Immobilisé' },
          { id: 'c6', label: 'Chatouilles' }
        ]
      },
      {
        id: 'intense',
        label: 'Intense',
        items: [
          { id: 'i1', label: 'Insulte' },
          { id: 'i2', label: 'Bâillon' },
          { id: 'i3', label: 'Étranglement léger' },
          { id: 'i4', label: 'Presser les couilles' },
          { id: 'i5', label: 'Faciale' },
          {
            id: 'i6',
            label: 'Plaquage',
            info: 'maintenir contre un mur, une porte ou un meuble.'
          }
        ]
      },
      {
        id: 'hard',
        label: 'Hard',
        items: [
          {
            id: 'h1',
            label: 'Crachat',
            info: 'sur le corps ou le visage uniquement.'
          },
          { id: 'h2', label: 'Doigt dans le cul' },
          { id: 'h3', label: 'Anulingus' },
          { id: 'h4', label: 'Pénétration anale' },
          { id: 'h5', label: 'Gifle' },
          { id: 'h6', label: 'Gorge profonde' }
        ]
      }
    ];

    const BDSM_PRACTICES = BDSM_CATEGORIES.flatMap((cat) =>
      cat.items.map((it) => ({ ...it, categoryId: cat.id, categoryLabel: cat.label }))
    );

    const ALLOWED_PUNISHMENT_IDS = new Set([
      's2', // Pied
      's3', // Pincement
      's4', // Griffures
      's5', // Fessées
      'c1', // Morsure
      'c3', // Fouet
      'c4', // Bifle
      'i1', // Insulte
      'h1', // Crachat
      'h5'  // Gifle
    ]);

    // =========================================================================
    // 4. UTILITAIRES
    // =========================================================================

    function escapeHtml(val) {
      return String(val ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    }

    function shuffleArray(list) {
      const arr = [...list];
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr;
    }

    function createEmptyBdsmSelections() {
      const obj = {};
      for (const item of BDSM_PRACTICES) {
        obj[item.id] = { choices: [] };
      }
      return obj;
    }

    function createEmptyBdsmGlobals() {
      return {
        punition: false,
        switchRole: false
      };
    }

    // =========================================================================
    // 5. ÉTAT GLOBAL DE L'APPLICATION
    // =========================================================================

    const initialTheme = loadSavedTheme();
    applyThemeToDocument(initialTheme);

    const state = {
      theme: initialTheme, // 'day' | 'evening'
      currentView: 'hub', // 'hub' | 'cards' | 'roleplay' | 'bdsm'

      infoModal: {
        open: false,
        title: '',
        text: ''
      },

      confirmDialog: {
        open: false,
        title: '',
        message: '',
        confirmLabel: 'Continuer',
        onConfirmAction: null
      },

      toastMessage: '',

      cards: {
        started: false,
        drawingStarter: false,
        drawPreviewPlayer: 'Elle',
        firstPlayer: null,
        currentPlayer: null,
        currentLevel: 1,
        remainingDecks: { 1: [], 2: [], 3: [] },
        playedHistory: { 1: [], 2: [], 3: [] },
        activeCard: '',
        skipsRemaining: { Lui: 1, Elle: 1 },
        noticeMessage: '',
        cardKey: 0,
        completed: false
      },

      roleplay: {
        step: 1, // 1 | 2 | 3
        duoIndex: 0,
        swappedRoles: false,
        rollingDuo: false,
        intentionIndex: 0,
        rollingIntention: false,
        actionCount: 1, // 1 | 2
        selectedActionIndices: [0],
        rollingActions: false
      },

      bdsm: {
        step: 'setup',
        roles: {
          dominateurGender: 'Lui',
          domineGender: 'Elle',
          dominateurName: '',
          domineName: ''
        },
        selections: {
          dominateur: createEmptyBdsmSelections(),
          domine: createEmptyBdsmSelections()
        },
        globals: {
          dominateur: createEmptyBdsmGlobals(),
          domine: createEmptyBdsmGlobals()
        },
        discussResolutions: {},
        punishments: {
          subPunishment: '',
          domPunishment: ''
        },
        progress: {
          domTurn: false,
          domOptions: false,
          handoff: false,
          subTurn: false,
          subOptions: false,
          optionsSummary: false,
          discuss: false,
          agreements: false,
          safeword: false,
          warmup: false
        },
        warmup: {
          enabled: true,
          currentTierIndex: 0,
          picks: {
            vanille: null,
            soft: null,
            chaud: null
          }
        },
        safeword: '',
        screenLocked: false,
        unlockTapCount: 0,
        errorMessage: ''
      }
    };

    // =========================================================================
    // 6. THÈME, MODALES, TOAST & CONFIRMATION DOUCE DE NAVIGATION
    // =========================================================================

    function toggleTheme() {
      triggerHaptic(12);
      state.theme = state.theme === 'day' ? 'evening' : 'day';
      applyThemeToDocument(state.theme);
      renderApp();
    }

    function openPracticeInfo(title, text) {
      triggerHaptic(10);
      state.infoModal = { open: true, title, text };
      renderApp();
    }

    function closePracticeInfo() {
      triggerHaptic(10);
      state.infoModal.open = false;
      renderApp();
    }

    function showToast(msg) {
      state.toastMessage = msg;
      renderApp();
      clearTimeout(window.__pimentsToastTimer);
      window.__pimentsToastTimer = setTimeout(() => {
        state.toastMessage = '';
        renderApp();
      }, 2800);
    }

    function hasActiveProgressInCurrentView() {
      if (state.currentView === 'cards') {
        return state.cards.started && !state.cards.completed;
      }
      if (state.currentView === 'roleplay') {
        return state.roleplay.step > 1;
      }
      if (state.currentView === 'bdsm') {
        const b = state.bdsm;
        if (b.step !== 'setup') return true;
        return Boolean(b.roles.dominateurName.trim() || b.roles.domineName.trim());
      }
      return false;
    }

    function requestReturnToHub() {
      triggerHaptic(12);
      if (state.currentView === 'hub') return;

      if (hasActiveProgressInCurrentView()) {
        state.confirmDialog = {
          open: true,
          title: 'Revenir au Hub ?',
          message: 'Une partie ou une sélection est actuellement en cours. Si vous quittez maintenant, l’avancement de cette session ne sera pas conservé.',
          confirmLabel: 'Quitter vers le Hub',
          onConfirmAction: 'go_hub'
        };
        renderApp();
        return;
      }

      performNavigate('hub');
    }

    function closeConfirmDialog() {
      triggerHaptic(10);
      state.confirmDialog.open = false;
      renderApp();
    }

    function executeConfirmDialog() {
      triggerHaptic(14);
      const action = state.confirmDialog.onConfirmAction;
      state.confirmDialog.open = false;
      if (action === 'go_hub') {
        performNavigate('hub');
      } else if (action === 'wipe_bdsm_hub') {
        resetBdsmState();
        performNavigate('hub');
      }
    }

    function performNavigate(targetView) {
      triggerHaptic(12);
      state.currentView = targetView;
      if (targetView === 'roleplay') {
        initRoleplay();
      }
      renderApp();
      try {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } catch (e) {
        // Ignorer
      }
    }

    // =========================================================================
    // 7. LOGIQUE MÉTIER — MODE CARTES
    // =========================================================================

    function triggerStarterDraw() {
      if (state.cards.drawingStarter) return;
      triggerHaptic(14);
      state.cards.drawingStarter = true;
      state.cards.drawPreviewPlayer = 'Elle';
      renderApp();

      let ticks = 0;
      const totalTicks = 9;
      const interval = setInterval(() => {
        ticks += 1;
        state.cards.drawPreviewPlayer = ticks % 2 === 0 ? 'Lui' : 'Elle';
        renderApp();

        if (ticks >= totalTicks) {
          clearInterval(interval);
          triggerHaptic(16);
          const chosen = Math.random() < 0.5 ? 'Lui' : 'Elle';

          const deck1 = shuffleArray(CARDS_LEVELS[1].cards);
          const deck2 = shuffleArray(CARDS_LEVELS[2].cards);
          const deck3 = shuffleArray(CARDS_LEVELS[3].cards);

          const firstCard = deck1.shift();

          state.cards = {
            started: true,
            drawingStarter: false,
            drawPreviewPlayer: chosen,
            firstPlayer: chosen,
            currentPlayer: chosen,
            currentLevel: 1,
            remainingDecks: {
              1: deck1,
              2: deck2,
              3: deck3
            },
            playedHistory: {
              1: [firstCard],
              2: [],
              3: []
            },
            activeCard: firstCard,
            skipsRemaining: { Lui: 1, Elle: 1 },
            noticeMessage: '',
            cardKey: 1,
            completed: false
          };
          renderApp();
        }
      }, 85);
    }

    function resetCardsSetup() {
      triggerHaptic(12);
      state.cards.started = false;
      state.cards.drawingStarter = false;
      state.cards.completed = false;
      state.cards.noticeMessage = '';
      renderApp();
    }

    function otherPlayer(p) {
      return p === 'Lui' ? 'Elle' : 'Lui';
    }

    function nextCardTurn() {
      triggerHaptic(12);
      const c = state.cards;
      c.noticeMessage = '';
      c.cardKey += 1;

      if (c.currentLevel === 1) {
        if (c.remainingDecks[1].length > 0) {
          const nextCard = c.remainingDecks[1].shift();
          c.activeCard = nextCard;
          c.playedHistory[1].push(nextCard);
          c.currentPlayer = otherPlayer(c.currentPlayer);
        } else {
          c.currentLevel = 2;
          const nextCard = c.remainingDecks[2].shift();
          c.activeCard = nextCard;
          c.playedHistory[2].push(nextCard);
          c.currentPlayer = otherPlayer(c.currentPlayer);
        }
      } else if (c.currentLevel === 2) {
        if (c.remainingDecks[2].length > 0) {
          const nextCard = c.remainingDecks[2].shift();
          c.activeCard = nextCard;
          c.playedHistory[2].push(nextCard);
          c.currentPlayer = otherPlayer(c.currentPlayer);
        } else {
          c.currentLevel = 3;
          const nextCard = c.remainingDecks[3].shift();
          c.activeCard = nextCard;
          c.playedHistory[3].push(nextCard);
        }
      } else if (c.currentLevel === 3) {
        c.completed = true;
      }

      renderApp();
    }

    function useCardSkip() {
      const c = state.cards;
      const p = c.currentPlayer;
      if (c.currentLevel === 2 || !p || c.skipsRemaining[p] <= 0) return;

      triggerHaptic(15);
      c.skipsRemaining[p] -= 1;
      c.cardKey += 1;

      if (c.currentLevel === 1) {
        if (c.remainingDecks[1].length > 0) {
          c.playedHistory[1].pop();
          const replacement = c.remainingDecks[1].shift();
          c.activeCard = replacement;
          c.playedHistory[1].push(replacement);
          c.noticeMessage = `${p} a utilisé son unique joker : une nouvelle carte a été tirée pour ce tour.`;
          renderApp();
        } else {
          c.noticeMessage = `${p} a utilisé son unique joker sur la dernière carte de l’Acte I.`;
          nextCardTurn();
        }
      } else if (c.currentLevel === 3) {
        cycleLevel3Card(true);
        c.noticeMessage = `${p} a utilisé son unique joker : une autre carte Caliente a été tirée.`;
        renderApp();
      }
    }

    function cycleLevel3Card(silentHaptic = false) {
      const c = state.cards;
      if (c.currentLevel !== 3) return;
      if (!silentHaptic) triggerHaptic(12);

      if (c.remainingDecks[3].length === 0) {
        const others = shuffleArray(CARDS_LEVELS[3].cards.filter((txt) => txt !== c.activeCard));
        c.remainingDecks[3] = others;
        c.playedHistory[3] = [c.activeCard];
      }

      if (c.remainingDecks[3].length > 0) {
        const nextCard = c.remainingDecks[3].shift();
        c.activeCard = nextCard;
        c.playedHistory[3].push(nextCard);
        c.cardKey += 1;
      }
      if (!silentHaptic) renderApp();
    }

    function reshuffleCurrentLevelDeck() {
      const c = state.cards;
      const lvl = c.currentLevel;
      const lvlData = CARDS_LEVELS[lvl];
      if (!lvlData) return;

      triggerHaptic(14);
      const freshDeck = shuffleArray(lvlData.cards.filter((txt) => txt !== c.activeCard));
      c.remainingDecks[lvl] = freshDeck;
      c.playedHistory[lvl] = [c.activeCard];
      c.noticeMessage = `Les cartes de ${lvlData.name} ont été remélangées.`;
      renderApp();
    }

    // =========================================================================
    // 8. LOGIQUE MÉTIER — MODE ROLEPLAY (3 ÉTAPES + 1 OU 2 REPÈRES)
    // =========================================================================

    function initRoleplay() {
      const initialCount = 1;
      state.roleplay = {
        step: 1,
        duoIndex: Math.floor(Math.random() * ROLEPLAY_DUOS.length),
        swappedRoles: false,
        rollingDuo: false,
        intentionIndex: Math.floor(Math.random() * ROLEPLAY_INTENTIONS.length),
        rollingIntention: false,
        actionCount: initialCount,
        selectedActionIndices: shuffleArray([0, 1, 2, 3, 4]).slice(0, initialCount),
        rollingActions: false
      };
    }

    function getRoleplayRoles() {
      const duo = ROLEPLAY_DUOS[state.roleplay.duoIndex] || ROLEPLAY_DUOS[0];
      return state.roleplay.swappedRoles
        ? { elle: duo.lui, lui: duo.elle, duoLabel: duo.label }
        : { elle: duo.elle, lui: duo.lui, duoLabel: duo.label };
    }

    function rerollRoleplayDuo() {
      if (state.roleplay.rollingDuo) return;
      triggerHaptic(12);
      state.roleplay.rollingDuo = true;
      renderApp();

      let steps = 0;
      const timer = setInterval(() => {
        steps += 1;
        state.roleplay.duoIndex = (state.roleplay.duoIndex + 1) % ROLEPLAY_DUOS.length;
        renderApp();
        if (steps >= 5) {
          clearInterval(timer);
          triggerHaptic(14);
          state.roleplay.duoIndex = Math.floor(Math.random() * ROLEPLAY_DUOS.length);
          state.roleplay.swappedRoles = false;
          state.roleplay.rollingDuo = false;
          renderApp();
        }
      }, 65);
    }

    function swapRoleplayDuo() {
      triggerHaptic(12);
      state.roleplay.swappedRoles = !state.roleplay.swappedRoles;
      renderApp();
    }

    function rerollRoleplayIntention() {
      if (state.roleplay.rollingIntention) return;
      triggerHaptic(12);
      state.roleplay.rollingIntention = true;
      renderApp();

      let steps = 0;
      const timer = setInterval(() => {
        steps += 1;
        state.roleplay.intentionIndex = (state.roleplay.intentionIndex + 1) % ROLEPLAY_INTENTIONS.length;
        renderApp();
        if (steps >= 5) {
          clearInterval(timer);
          triggerHaptic(14);
          state.roleplay.intentionIndex = Math.floor(Math.random() * ROLEPLAY_INTENTIONS.length);
          state.roleplay.rollingIntention = false;
          renderApp();
        }
      }, 65);
    }

    function setRoleplayActionCount(count) {
      triggerHaptic(12);
      const normalized = count === 2 ? 2 : 1;
      state.roleplay.actionCount = normalized;
      state.roleplay.selectedActionIndices = shuffleArray([0, 1, 2, 3, 4]).slice(0, normalized);
      renderApp();
    }

    function rerollRoleplayActions() {
      if (state.roleplay.rollingActions) return;
      triggerHaptic(12);
      state.roleplay.rollingActions = true;
      renderApp();

      let steps = 0;
      const count = state.roleplay.actionCount || 1;
      const timer = setInterval(() => {
        steps += 1;
        state.roleplay.selectedActionIndices = shuffleArray([0, 1, 2, 3, 4]).slice(0, count);
        renderApp();
        if (steps >= 5) {
          clearInterval(timer);
          triggerHaptic(14);
          state.roleplay.selectedActionIndices = shuffleArray([0, 1, 2, 3, 4]).slice(0, count);
          state.roleplay.rollingActions = false;
          renderApp();
        }
      }, 65);
    }

    function restartFullRoleplayScene() {
      triggerHaptic(14);
      initRoleplay();
      renderApp();
      try {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } catch (e) {
        // Ignorer
      }
    }

    // =========================================================================
    // 9. LOGIQUE MÉTIER — MODE BDSM (30 PRATIQUES, PUNITIONS, SAFEWORD & ÉCHAUFFEMENT)
    // =========================================================================

    function getDomDisplayName() {
      const custom = state.bdsm.roles.dominateurName.trim();
      if (custom) return custom;
      return state.bdsm.roles.dominateurGender === 'Lui' ? 'Lui (Dominateur)' : 'Elle (Dominatrice)';
    }

    function getSubDisplayName() {
      const custom = state.bdsm.roles.domineName.trim();
      if (custom) return custom;
      return state.bdsm.roles.domineGender === 'Elle' ? 'Elle (Dominée)' : 'Lui (Dominé)';
    }

    function getDomShortName() {
      return state.bdsm.roles.dominateurName.trim() || state.bdsm.roles.dominateurGender;
    }

    function getSubShortName() {
      return state.bdsm.roles.domineName.trim() || state.bdsm.roles.domineGender;
    }

    function getPracticeChoices(selMap, practiceId) {
      const entry = selMap && selMap[practiceId];
      if (!entry) return [];
      if (Array.isArray(entry.choices)) return entry.choices;
      if (entry.choice) return [entry.choice];
      return [];
    }

    // Dans computeBdsmMatches(), les punitions autorisées proviennent directement des accords
    // communs validés (domToSub pour ce que le Dominateur fait au Dominé ; subToDom pour ce que
    // le Dominé fait au Dominateur), filtrés sur les 10 pratiques autorisées.
    function getEligiblePunishmentsForReceiver(receiverKey) {
      const { domToSub, subToDom } = computeBdsmMatches();
      const agreedList = receiverKey === 'domine' ? domToSub : subToDom;
      return agreedList.filter((item) => ALLOWED_PUNISHMENT_IDS.has(item.id));
    }

    // Évalue asymétriquement si actorKey peut faire la pratique sur targetKey :
    // actorKey doit avoir coché 'sur_toi' ("OK sur toi") ET targetKey doit avoir coché 'sur_moi' ("OK sur moi").
    function canActorDoToTarget(actorSel, targetSel, practiceId) {
      const aChoices = getPracticeChoices(actorSel, practiceId);
      const tChoices = getPracticeChoices(targetSel, practiceId);
      if (aChoices.includes('non') || tChoices.includes('non')) return false;
      return aChoices.includes('sur_toi') && tChoices.includes('sur_moi');
    }

    function getMutualWarmupPool(categoryId, actorKey, targetKey) {
      const cat = BDSM_CATEGORIES.find((c) => c.id === categoryId);
      if (!cat) return [];
      const actorSel = state.bdsm.selections[actorKey] || {};
      const targetSel = state.bdsm.selections[targetKey] || {};

      return cat.items.filter((it) => {
        if (canActorDoToTarget(actorSel, targetSel, it.id)) return true;

        const actorChoices = getPracticeChoices(actorSel, it.id);
        const targetChoices = getPracticeChoices(targetSel, it.id);
        if (actorChoices.includes('non') || targetChoices.includes('non')) return false;
        if (!actorChoices.includes('discuter') && !targetChoices.includes('discuter')) return false;
        return state.bdsm.discussResolutions[it.id] === 'accepted';
      });
    }

    function drawWarmupTier(tierIndex) {
      const tiers = ['vanille', 'soft', 'chaud'];
      const tierKey = tiers[tierIndex] || 'vanille';
      const bothSwitch = state.bdsm.globals.dominateur.switchRole && state.bdsm.globals.domine.switchRole;
      const domShort = getDomShortName();
      const subShort = getSubShortName();

      const reversePair = bothSwitch && tierIndex % 2 === 1;
      const actorKey = reversePair ? 'domine' : 'dominateur';
      const targetKey = reversePair ? 'dominateur' : 'domine';
      const actorName = reversePair ? subShort : domShort;
      const targetName = reversePair ? domShort : subShort;

      const pool = getMutualWarmupPool(tierKey, actorKey, targetKey);
      const pickedLabel = pool.length > 0
        ? pool[Math.floor(Math.random() * pool.length)].label
        : '';

      state.bdsm.warmup.picks[tierKey] = {
        label: pickedLabel,
        actor: actorName,
        target: targetName,
        poolCount: pool.length
      };
    }

    function startWarmupTour() {
      triggerHaptic(14);
      state.bdsm.warmup.enabled = true;
      state.bdsm.progress.warmup = true;
      state.bdsm.warmup.currentTierIndex = 0;
      state.bdsm.warmup.picks = { vanille: null, soft: null, chaud: null };
      drawWarmupTier(0);
      state.bdsm.screenLocked = false;
      state.bdsm.unlockTapCount = 0;
      state.bdsm.step = 'warmup';
      renderApp();
      try {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } catch (e) {
        // Ignorer
      }
    }

    function skipWarmupToSession() {
      triggerHaptic(12);
      state.bdsm.warmup.enabled = false;
      state.bdsm.step = 'session_ready';
      renderApp();
      try {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } catch (e) {
        // Ignorer
      }
    }

    function rerollCurrentWarmupTier() {
      triggerHaptic(14);
      drawWarmupTier(state.bdsm.warmup.currentTierIndex);
      renderApp();
    }

    function nextWarmupTierOrStartSession() {
      triggerHaptic(14);
      const idx = state.bdsm.warmup.currentTierIndex;
      if (idx < 2) {
        const nextIdx = idx + 1;
        state.bdsm.warmup.currentTierIndex = nextIdx;
        if (!state.bdsm.warmup.picks[['vanille', 'soft', 'chaud'][nextIdx]]) {
          drawWarmupTier(nextIdx);
        }
        renderApp();
        try {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (e) {
          // Ignorer
        }
      } else {
        state.bdsm.step = 'session_ready';
        renderApp();
        try {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (e) {
          // Ignorer
        }
      }
    }

    function prevWarmupTierOrSafeword() {
      triggerHaptic(12);
      const idx = state.bdsm.warmup.currentTierIndex;
      if (idx > 0) {
        state.bdsm.warmup.currentTierIndex = idx - 1;
        renderApp();
        try {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (e) {
          // Ignorer
        }
      } else {
        setBdsmStep('safeword');
      }
    }

    function getDiscussCandidates() {
      const domSel = state.bdsm.selections.dominateur;
      const subSel = state.bdsm.selections.domine;
      const list = [];

      for (const p of BDSM_PRACTICES) {
        const dChoices = getPracticeChoices(domSel, p.id);
        const sChoices = getPracticeChoices(subSel, p.id);

        if (dChoices.includes('non') || sChoices.includes('non')) continue;

        if (dChoices.includes('discuter') || sChoices.includes('discuter')) {
          list.push({
            id: p.id,
            label: p.label,
            categoryLabel: p.categoryLabel,
            domChoseDiscuss: dChoices.includes('discuter'),
            subChoseDiscuss: sChoices.includes('discuter'),
            bothDiscuss: dChoices.includes('discuter') && sChoices.includes('discuter')
          });
        }
      }
      return list;
    }

    function setDiscussResolution(practiceId, status) {
      triggerHaptic(10);
      const current = state.bdsm.discussResolutions[practiceId];
      state.bdsm.discussResolutions[practiceId] = current === status ? 'pending' : status;
      renderApp();
    }

    function computeBdsmMatches() {
      const domSel = state.bdsm.selections.dominateur;
      const subSel = state.bdsm.selections.domine;

      const domToSub = [];
      const subToDom = [];
      const toDiscuss = [];

      for (const p of BDSM_PRACTICES) {
        const dChoices = getPracticeChoices(domSel, p.id);
        const sChoices = getPracticeChoices(subSel, p.id);

        const dHasNon = dChoices.includes('non');
        const sHasNon = sChoices.includes('non');

        // Sens 1 : ce que le Dominateur fait au Dominé -> Dominateur='sur_toi' et Dominé='sur_moi'
        const domCanDoToSub = canActorDoToTarget(domSel, subSel, p.id);
        // Sens 2 : ce que le Dominé fait au Dominateur -> Dominé='sur_toi' et Dominateur='sur_moi'
        const subCanDoToDom = canActorDoToTarget(subSel, domSel, p.id);
        const reciprocal = domCanDoToSub && subCanDoToDom;

        if (domCanDoToSub) {
          domToSub.push({ id: p.id, label: p.label, categoryLabel: p.categoryLabel, reciprocal });
        }
        if (subCanDoToDom) {
          subToDom.push({ id: p.id, label: p.label, categoryLabel: p.categoryLabel, reciprocal });
        }

        if (!dHasNon && !sHasNon && (dChoices.includes('discuter') || sChoices.includes('discuter'))) {
          const resolution = state.bdsm.discussResolutions[p.id] || 'pending';

          if (resolution === 'accepted') {
            domToSub.push({
              id: p.id,
              label: p.label,
              categoryLabel: p.categoryLabel,
              reciprocal: true,
              acceptedDiscuss: true
            });
            subToDom.push({
              id: p.id,
              label: p.label,
              categoryLabel: p.categoryLabel,
              reciprocal: true,
              acceptedDiscuss: true
            });
          }

          toDiscuss.push({
            id: p.id,
            label: p.label,
            categoryLabel: p.categoryLabel,
            bothDiscuss: dChoices.includes('discuter') && sChoices.includes('discuter'),
            resolution
          });
        }
      }

      const dedupeAgreements = (list) => {
        const byId = new Map();
        for (const item of list) {
          const existing = byId.get(item.id);
          if (!existing) {
            byId.set(item.id, { ...item });
          } else {
            existing.reciprocal = existing.reciprocal || item.reciprocal;
            existing.acceptedDiscuss = existing.acceptedDiscuss || item.acceptedDiscuss;
          }
        }
        return Array.from(byId.values());
      };

      return {
        domToSub: dedupeAgreements(domToSub),
        subToDom: dedupeAgreements(subToDom),
        toDiscuss
      };
    }

    function proceedAfterSubOptions() {
      triggerHaptic(12);
      state.bdsm.errorMessage = '';
      state.bdsm.progress.subOptions = true;
      state.bdsm.progress.optionsSummary = true;
      state.bdsm.step = 'options_summary';
      renderApp();
      try {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } catch (e) {
        // Ignorer
      }
    }

    function proceedFromOptionsSummary() {
      triggerHaptic(12);
      state.bdsm.progress.optionsSummary = true;
      state.bdsm.progress.discuss = true;
      state.bdsm.step = 'discuss_reveal';
      renderApp();
      try {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } catch (e) {
        // Ignorer
      }
    }

    function proceedFromDiscussReveal() {
      triggerHaptic(12);
      state.bdsm.progress.discuss = true;
      state.bdsm.progress.agreements = true;
      state.bdsm.step = 'agreements_reveal';
      renderApp();
      try {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } catch (e) {
        // Ignorer
      }
    }

    function proceedFromAgreementsReveal() {
      triggerHaptic(12);
      state.bdsm.progress.agreements = true;
      const mutualPunish = state.bdsm.globals.dominateur.punition && state.bdsm.globals.domine.punition;
      const mutualSwitch = state.bdsm.globals.dominateur.switchRole && state.bdsm.globals.domine.switchRole;

      const subPunishments = getEligiblePunishmentsForReceiver('domine');
      const domPunishments = getEligiblePunishmentsForReceiver('dominateur');

      if (!subPunishments.some((p) => p.label === state.bdsm.punishments.subPunishment)) {
        state.bdsm.punishments.subPunishment = subPunishments.length > 0 ? subPunishments[0].label : '';
      }
      if (mutualSwitch) {
        if (!domPunishments.some((p) => p.label === state.bdsm.punishments.domPunishment)) {
          state.bdsm.punishments.domPunishment = domPunishments.length > 0 ? domPunishments[0].label : '';
        }
      } else {
        state.bdsm.punishments.domPunishment = '';
      }

      state.bdsm.errorMessage = '';
      state.bdsm.step = mutualPunish ? 'punish' : 'safeword';
      renderApp();
      try {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } catch (e) {
        // Ignorer
      }
    }

    function updatePunishmentChoice(fieldKey, value) {
      triggerHaptic(10);
      state.bdsm.punishments[fieldKey] = value;
      renderApp();
    }

    function lockRevealScreen() {
      triggerHaptic(14);
      state.bdsm.screenLocked = true;
      state.bdsm.unlockTapCount = 0;
      renderApp();
    }

    function handleUnlockScreenTap() {
      triggerHaptic(12);
      state.bdsm.unlockTapCount += 1;
      if (state.bdsm.unlockTapCount >= 2) {
        state.bdsm.screenLocked = false;
        state.bdsm.unlockTapCount = 0;
        triggerHaptic(16);
        renderApp();
        return;
      }
      renderApp();
      clearTimeout(window.__pimentUnlockTimer);
      window.__pimentUnlockTimer = setTimeout(() => {
        if (state.bdsm.screenLocked && state.bdsm.unlockTapCount > 0) {
          state.bdsm.unlockTapCount = 0;
          renderApp();
        }
      }, 1500);
    }

    function copyBdsmSummary() {
      triggerHaptic(12);
      const { domToSub, subToDom, toDiscuss } = computeBdsmMatches();
      const domShort = getDomShortName();
      const subShort = getSubShortName();
      const gDom = state.bdsm.globals.dominateur;
      const gSub = state.bdsm.globals.domine;
      const bothSwitch = gDom.switchRole && gSub.switchRole;
      const bothPunish = gDom.punition && gSub.punition;
      const safeword = state.bdsm.safeword.trim();
      const w = state.bdsm.warmup.picks;

      const formatWarmupLine = (tierLabel, item) => {
        if (!item || !item.label) return `${tierLabel} : Aucune action commune validée`;
        return `${tierLabel} (${item.actor} → ${item.target}) : ${item.label}`;
      };

      const lines = [
        'PIMENT — RÉCAPITULATIF DE SESSION BDSM',
        `Safeword : ${safeword || 'Non renseigné'}`,
        formatWarmupLine('Échauffement Vanille', w.vanille),
        formatWarmupLine('Échauffement Soft', w.soft),
        formatWarmupLine('Échauffement Chaud', w.chaud),
        bothSwitch ? 'OK pour inverser les rôles (Switch) : Autorisé des deux côtés' : 'OK pour inverser les rôles (Switch) : Non activé mutuellement',
        ...(bothPunish ? [
          `Punition pour ${subShort} (dominé) : ${state.bdsm.punishments.subPunishment || 'Aucune'}`,
          ...(bothSwitch ? [`Punition pour ${domShort} (dominant) : ${state.bdsm.punishments.domPunishment || 'Aucune'}`] : [])
        ] : []),
        '',
        `Ce que ${domShort} fait à ${subShort} :`,
        ...(domToSub.length ? domToSub.map((i) => `• ${i.label}${i.acceptedDiscuss ? ' (Accord après discussion)' : ''}${i.reciprocal ? ' (Réciproque)' : ''}`) : ['• Aucune pratique commune retenue']),
        '',
        `Ce que ${subShort} fait à ${domShort} :`,
        ...(subToDom.length ? subToDom.map((i) => `• ${i.label}${i.acceptedDiscuss ? ' (Accord après discussion)' : ''}${i.reciprocal ? ' (Réciproque)' : ''}`) : ['• Aucune pratique commune retenue']),
        '',
        'À discuter :',
        ...(toDiscuss.length ? toDiscuss.map((i) => `• ${i.label} (${i.categoryLabel})`) : ['• Aucun point marqué « À discuter »'])
      ];

      const text = lines.join('\n');
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand('copy');
        showToast('Récapitulatif des accords copié dans le presse-papiers.');
      } catch (e) {
        showToast('Impossible de copier le récapitulatif automatiquement.');
      }
      document.body.removeChild(textarea);
    }

    function confirmWipeBdsmAndGoHub() {
      triggerHaptic(12);
      state.confirmDialog = {
        open: true,
        title: 'Effacer la session et revenir au Hub ?',
        message: 'Toutes vos sélections, les punitions, le safeword, l’échauffement et les accords affichés seront immédiatement effacés.',
        confirmLabel: 'Effacer et revenir au Hub',
        onConfirmAction: 'wipe_bdsm_hub'
      };
      renderApp();
    }

    function resetBdsmState() {
      state.bdsm = {
        step: 'setup',
        roles: {
          dominateurGender: 'Lui',
          domineGender: 'Elle',
          dominateurName: '',
          domineName: ''
        },
        selections: {
          dominateur: createEmptyBdsmSelections(),
          domine: createEmptyBdsmSelections()
        },
        globals: {
          dominateur: createEmptyBdsmGlobals(),
          domine: createEmptyBdsmGlobals()
        },
        discussResolutions: {},
        punishments: {
          subPunishment: '',
          domPunishment: ''
        },
        progress: {
          domTurn: false,
          domOptions: false,
          handoff: false,
          subTurn: false,
          subOptions: false,
          optionsSummary: false,
          discuss: false,
          agreements: false,
          safeword: false,
          warmup: false
        },
        warmup: {
          enabled: true,
          currentTierIndex: 0,
          picks: {
            vanille: null,
            soft: null,
            chaud: null
          }
        },
        safeword: '',
        screenLocked: false,
        unlockTapCount: 0,
        errorMessage: ''
      };
    }

    // =========================================================================
    // 10. COMPOSANTS GLOBAUX (EN-TÊTE, MODALES, TOAST)
    // =========================================================================

    function renderHeader(subtitle = '') {
      const isHub = state.currentView === 'hub';
      const isEvening = state.theme === 'evening';

      return `
        <header class="sticky top-0 z-30 sticky-header border-b border-sand transition-colors">
          <div class="max-w-5xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between gap-3">
            <div class="flex items-center gap-2.5">
              ${isHub ? `
                <button
                  type="button"
                  onclick="showWelcomeScreen()"
                  class="tactile-btn w-9 h-9 rounded-full bg-piment hover:bg-pimentHover text-paper flex items-center justify-center shadow-sm focus:outline-none focus:ring-2 focus:ring-piment/40"
                  title="Revoir l'écran d'accueil"
                  aria-label="Revoir l'écran d'accueil"
                >
                  <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M16.5 3.5c1.8-.5 3.7.5 4.1 2.3.4 2.2-.8 5.4-3.4 8.5-2.3 2.8-5.4 4.7-8.1 5.2-1.5.3-2.9-.6-3.2-2-.3-1.3.5-2.6 1.8-3 2.2-.6 4.3-2 5.9-3.9 1.3-1.6 2-3.4 2-5 0-.8.3-1.6.9-2.1z"/>
                  </svg>
                </button>
              ` : `
                <button
                  type="button"
                  onclick="requestReturnToHub()"
                  class="tactile-btn w-9 h-9 rounded-full bg-piment hover:bg-pimentHover text-paper flex items-center justify-center shadow-sm focus:outline-none"
                  aria-label="Retour au Hub"
                >
                  <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M16.5 3.5c1.8-.5 3.7.5 4.1 2.3.4 2.2-.8 5.4-3.4 8.5-2.3 2.8-5.4 4.7-8.1 5.2-1.5.3-2.9-.6-3.2-2-.3-1.3.5-2.6 1.8-3 2.2-.6 4.3-2 5.9-3.9 1.3-1.6 2-3.4 2-5 0-.8.3-1.6.9-2.1z"/>
                  </svg>
                </button>
              `}

              <button
                type="button"
                onclick="${isHub ? 'showWelcomeScreen()' : 'requestReturnToHub()'}"
                class="flex items-baseline gap-2.5 text-left focus:outline-none"
              >
                <span class="font-serif text-2xl sm:text-[1.7rem] font-semibold tracking-tight text-ink">
                  Piment
                </span>
                ${subtitle ? `
                  <span class="text-xs font-semibold tracking-wide uppercase text-piment">
                    ${escapeHtml(subtitle)}
                  </span>
                ` : `
                  <span class="hidden md:inline text-xs text-inkMuted tracking-wide">
                    Carnets &amp; jeux intimes à deux
                  </span>
                `}
              </button>
            </div>

            <div class="flex items-center gap-2 sm:gap-2.5">
              <button
                type="button"
                onclick="toggleTheme()"
                class="tactile-btn inline-flex items-center gap-2 px-3.5 py-2 rounded-full text-xs font-medium text-inkSoft hover:text-ink bg-paper hover:bg-paperAlt border border-sand"
                title="Basculer l'ambiance lumineuse"
              >
                ${isEvening ? `
                  <svg class="w-3.5 h-3.5 text-brass" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  <span class="hidden sm:inline">Lumière jour</span>
                ` : `
                  <svg class="w-3.5 h-3.5 text-piment" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                  <span class="hidden sm:inline">Soirée tamisée</span>
                `}
              </button>

              ${!isHub ? `
                <button
                  type="button"
                  onclick="requestReturnToHub()"
                  class="tactile-btn inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold text-inkSoft hover:text-ink bg-paper hover:bg-paperAlt border border-sand"
                >
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                  <span>Hub</span>
                </button>
              ` : ''}
            </div>
          </div>
        </header>
      `;
    }

    function renderPracticeInfoModal() {
      const m = state.infoModal;
      if (!m.open) return '';

      return `
        <div class="fixed inset-0 z-50 flex items-center justify-center p-5 bg-black/50 backdrop-blur-md animate-view" role="dialog" aria-modal="true" onclick="closePracticeInfo()">
          <div class="liquid-surface max-w-md w-full rounded-2xl bg-paper border border-sand p-6 sm:p-7 shadow-editorialHover" onclick="event.stopPropagation()">
            <span class="text-[11px] font-bold uppercase tracking-[0.16em] text-brass block mb-1.5">
              Précision
            </span>
            <h2 class="font-serif text-2xl font-semibold text-ink mb-2.5">
              ${escapeHtml(m.title)}
            </h2>
            <p class="text-sm text-inkSoft leading-relaxed mb-6">
              ${escapeHtml(m.text)}
            </p>
            <div class="flex justify-end">
              <button
                type="button"
                onclick="closePracticeInfo()"
                class="tactile-btn px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-piment hover:bg-pimentHover text-paper"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      `;
    }

    function renderConfirmModal() {
      const d = state.confirmDialog;
      if (!d.open) return '';

      return `
        <div class="fixed inset-0 z-40 flex items-center justify-center p-5 bg-black/55 backdrop-blur-md animate-view" role="dialog" aria-modal="true">
          <div class="liquid-surface max-w-md w-full rounded-2xl bg-paper border border-sand p-6 sm:p-8 shadow-editorialHover">
            <h2 class="font-serif text-2xl font-semibold text-ink mb-2.5">
              ${escapeHtml(d.title)}
            </h2>
            <p class="text-sm text-inkSoft leading-relaxed mb-7">
              ${escapeHtml(d.message)}
            </p>
            <div class="flex items-center justify-end gap-3">
              <button
                type="button"
                onclick="closeConfirmDialog()"
                class="tactile-btn px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-linen hover:bg-paperAlt text-ink border border-sand"
              >
                Rester ici
              </button>
              <button
                type="button"
                onclick="executeConfirmDialog()"
                class="tactile-btn px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-piment hover:bg-pimentHover text-paper"
              >
                ${escapeHtml(d.confirmLabel)}
              </button>
            </div>
          </div>
        </div>
      `;
    }

    function renderToast() {
      if (!state.toastMessage) return '';
      return `
        <div class="liquid-surface fixed bottom-6 left-1/2 -translate-x-1/2 z-40 px-5 py-3 rounded-full bg-ink text-paper text-xs sm:text-sm font-medium shadow-editorialHover animate-view">
          ${escapeHtml(state.toastMessage)}
        </div>
      `;
    }

    // =========================================================================
    // 11. VUE 1 — HUB CENTRAL (3 MODES UNIQUEMENT)
    // =========================================================================

    function renderHub() {
      const modes = [
        {
          id: 'cards',
          roman: 'I',
          eyebrow: 'Jeu progressif en trois actes',
          title: 'Cartes',
          desc: 'Un tirage au sort désigne la personne qui commence, suivi d’une alternance régulière sans doublon de Mise en bouche jusqu’au défi final Caliente à deux.',
          cta: 'Ouvrir le mode Cartes'
        },
        {
          id: 'roleplay',
          roman: 'II',
          eyebrow: 'Scénario guidé en trois étapes',
          title: 'Roleplay',
          desc: 'Composez votre mise en scène pas à pas : distribution des rôles pour Elle et Lui, couleur d’intention et repères d’actions à glisser dans le jeu.',
          cta: 'Ouvrir le mode Roleplay'
        },
        {
          id: 'bdsm',
          roman: 'III',
          eyebrow: 'Sélection secrète & révélation croisée',
          title: 'BDSM',
          desc: 'Trente pratiques réparties en cinq catégories, quatre options globales, révélation des « À discuter » et des accords, punitions, safeword et échauffement optionnel.',
          cta: 'Ouvrir le mode BDSM'
        }
      ];

      return `
        <main class="flex-1 max-w-5xl w-full mx-auto px-5 sm:px-8 py-12 sm:py-16 animate-view">
          <section class="max-w-2xl mb-12 sm:mb-14">
            <p class="text-xs font-semibold uppercase tracking-[0.18em] text-piment mb-3">
              À huis clos • À deux
            </p>
            <h1 class="font-serif text-4xl sm:text-5xl md:text-[3.35rem] font-semibold text-ink leading-[1.08] mb-4">
              Trois façons d’explorer vos envies ce soir.
            </h1>
            <p class="text-sm sm:text-base text-inkSoft leading-relaxed">
              Choisissez un format selon l’ambiance souhaitée : le rythme progressif des cartes, l’improvisation guidée du roleplay ou l’exploration consentie du mode BDSM.
            </p>
          </section>

          <section class="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-7" aria-label="Modes disponibles">
            ${modes.map((m) => `
              <article
                onclick="performNavigate('${m.id}')"
                role="button"
                tabindex="0"
                onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();performNavigate('${m.id}');}"
                class="tactile-card group cursor-pointer rounded-2xl bg-paper border border-sand hover:border-sandDark p-7 sm:p-8 flex flex-col justify-between shadow-editorial hover:shadow-editorialHover hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-piment/30"
              >
                <div>
                  <div class="flex items-center justify-between mb-6 pb-4 border-b border-sand/70">
                    <span class="font-serif italic text-xl text-brass font-semibold">
                      ${m.roman}.
                    </span>
                    <span class="text-[11px] font-semibold uppercase tracking-wider text-inkMuted">
                      ${escapeHtml(m.eyebrow)}
                    </span>
                  </div>

                  <h2 class="font-serif text-3xl font-semibold text-ink mb-3 group-hover:text-piment transition-colors">
                    ${escapeHtml(m.title)}
                  </h2>

                  <p class="text-sm text-inkSoft leading-relaxed mb-8">
                    ${escapeHtml(m.desc)}
                  </p>
                </div>

                <div class="pt-4 border-t border-sand/80 flex items-center justify-between text-xs sm:text-sm font-semibold text-ink group-hover:text-piment transition-colors">
                  <span>${escapeHtml(m.cta)}</span>
                  <svg class="w-4 h-4 transform group-hover:translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </article>
            `).join('')}
          </section>
        </main>
      `;
    }

    // =========================================================================
    // 12. VUE 2 — MODE CARTES
    // =========================================================================

    function renderCards() {
      const c = state.cards;

      if (!c.started) {
        return `
          <main class="flex-1 max-w-2xl w-full mx-auto px-5 sm:px-8 py-10 sm:py-14 animate-view">
            <section class="liquid-surface rounded-2xl bg-paper border border-sand p-7 sm:p-10 shadow-editorial">
              <p class="text-xs font-semibold uppercase tracking-[0.16em] text-piment mb-2">
                Mode Cartes
              </p>
              <h1 class="font-serif text-3xl sm:text-4xl font-semibold text-ink mb-3">
                Qui tirera la première carte ?
              </h1>
              <p class="text-sm text-inkSoft leading-relaxed mb-8">
                Un tirage au sort désigne la personne qui ouvre la partie entre <strong class="text-ink">Lui</strong> et <strong class="text-ink">Elle</strong>, suivi d’une alternance régulière tour par tour. Vous disposez chacun d’un seul joker sur l’ensemble de la partie, verrouillé durant l’Acte II.
              </p>

              <div class="divide-y divide-sand border-y border-sand mb-8 text-sm">
                <div class="py-4 flex items-baseline justify-between gap-4">
                  <div>
                    <span class="font-serif text-lg font-semibold text-ink">Acte I — Mise en bouche</span>
                    <p class="text-xs text-inkSoft mt-0.5">6 cartes (3 tours chacun) • Action pour la personne qui tire</p>
                  </div>
                  <span class="text-xs font-medium text-brass whitespace-nowrap">Joker autorisé</span>
                </div>
                <div class="py-4 flex items-baseline justify-between gap-4">
                  <div>
                    <span class="font-serif text-lg font-semibold text-ink">Acte II — Pimenté</span>
                    <p class="text-xs text-inkSoft mt-0.5">4 cartes (2 tours chacun) • Action pour la personne qui tire</p>
                  </div>
                  <span class="text-xs font-medium text-piment whitespace-nowrap">Joker verrouillé</span>
                </div>
                <div class="py-4 flex items-baseline justify-between gap-4">
                  <div>
                    <span class="font-serif text-lg font-semibold text-ink">Acte III — Caliente</span>
                    <p class="text-xs text-inkSoft mt-0.5">5 cartes • Action partagée à deux (joker débloqué)</p>
                  </div>
                  <span class="text-xs font-medium text-inkSoft whitespace-nowrap">À deux</span>
                </div>
              </div>

              ${c.drawingStarter ? `
                <div class="rounded-xl bg-linen border border-sand p-6 text-center animate-draw-beat">
                  <span class="text-xs uppercase tracking-widest text-inkMuted block mb-1">Tirage en cours…</span>
                  <span class="font-serif text-3xl font-semibold text-piment">${escapeHtml(c.drawPreviewPlayer)}</span>
                </div>
              ` : `
                <button
                  type="button"
                  onclick="triggerStarterDraw()"
                  class="tactile-btn w-full py-3.5 px-6 rounded-xl text-sm font-semibold bg-piment hover:bg-pimentHover text-paper"
                >
                  Tirer au sort qui commence
                </button>
              `}
            </section>
          </main>
        `;
      }

      if (c.completed) {
        return `
          <main class="flex-1 max-w-2xl w-full mx-auto px-5 sm:px-8 py-12 animate-view">
            <section class="liquid-surface rounded-2xl bg-paper border border-sand p-8 sm:p-11 text-center shadow-editorial">
              <p class="text-xs font-semibold uppercase tracking-[0.16em] text-brass mb-2">
                Fin de partie
              </p>
              <h1 class="font-serif text-3xl sm:text-4xl font-semibold text-ink mb-3">
                Les trois actes sont accomplis.
              </h1>
              <p class="text-sm text-inkSoft leading-relaxed max-w-md mx-auto mb-8">
                Vous avez parcouru Mise en bouche, Pimenté et partagé le tirage final Caliente.
              </p>
              <div class="flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onclick="resetCardsSetup()"
                  class="tactile-btn px-5 py-3 rounded-xl text-sm font-semibold bg-linen hover:bg-paperAlt text-ink border border-sand"
                >
                  Nouvelle partie
                </button>
                <button
                  type="button"
                  onclick="performNavigate('hub')"
                  class="tactile-btn px-6 py-3 rounded-xl text-sm font-semibold bg-piment hover:bg-pimentHover text-paper"
                >
                  Retour au Hub
                </button>
              </div>
            </section>
          </main>
        `;
      }

      const lvl = CARDS_LEVELS[c.currentLevel];
      const playedCount = c.playedHistory[c.currentLevel].length;
      const totalInLevel = lvl.totalCards;
      const previousPlayed = c.playedHistory[c.currentLevel].slice(0, -1);

      const turnHeadline = c.currentLevel === 3
        ? 'Ensemble (Lui & Elle)'
        : `Tour de ${c.currentPlayer}`;

      const targetLabel = c.currentLevel === 3
        ? 'S’applique aux deux'
        : `S’applique à ${c.currentPlayer}`;

      const activePlayer = c.currentPlayer;
      const canSkipNow = c.currentLevel !== 2 && activePlayer && c.skipsRemaining[activePlayer] > 0;

      return `
        <main class="flex-1 max-w-3xl w-full mx-auto px-5 sm:px-8 py-8 sm:py-10 animate-view">
          <div class="liquid-surface rounded-2xl bg-paper border border-sand p-4 sm:p-5 mb-6 flex flex-wrap items-center justify-between gap-4 shadow-editorial">
            <div>
              <div class="flex items-center gap-2.5">
                <span class="font-serif italic text-base font-semibold text-brass">${lvl.roman}</span>
                <span class="text-sandDark">•</span>
                <span class="text-sm font-bold text-ink">${escapeHtml(lvl.name)}</span>
              </div>
              <p class="text-xs text-inkSoft mt-0.5">
                ${c.currentLevel === 3
                  ? `Tirage final à deux • ${playedCount} carte${playedCount > 1 ? 's' : ''} vue${playedCount > 1 ? 's' : ''} sur ${totalInLevel}`
                  : `Carte tirée ${playedCount} sur ${totalInLevel} • Sans doublon sur cet acte`
                }
              </p>
            </div>

            <div class="flex items-center gap-2 text-xs">
              <span class="px-3 py-1.5 rounded-full border ${
                c.skipsRemaining.Lui > 0
                  ? (c.currentLevel === 2 ? 'bg-paperAlt border-sand text-inkMuted' : 'bg-linen border-sand text-ink font-medium')
                  : 'bg-paperAlt/60 border-sand/60 text-inkMuted line-through'
              }">
                Joker Lui : ${c.skipsRemaining.Lui}/1${c.currentLevel === 2 && c.skipsRemaining.Lui > 0 ? ' (verrouillé)' : ''}
              </span>
              <span class="px-3 py-1.5 rounded-full border ${
                c.skipsRemaining.Elle > 0
                  ? (c.currentLevel === 2 ? 'bg-paperAlt border-sand text-inkMuted' : 'bg-linen border-sand text-ink font-medium')
                  : 'bg-paperAlt/60 border-sand/60 text-inkMuted line-through'
              }">
                Joker Elle : ${c.skipsRemaining.Elle}/1${c.currentLevel === 2 && c.skipsRemaining.Elle > 0 ? ' (verrouillé)' : ''}
              </span>
            </div>
          </div>

          <section
            data-card-key="${c.cardKey}"
            class="liquid-surface animate-card rounded-2xl bg-paper border ${
              c.currentLevel === 3 ? 'border-brass/70' : 'border-sand'
            } p-7 sm:p-11 shadow-cardFlip text-center mb-6"
          >
            <div class="flex flex-wrap items-center justify-center gap-2 mb-7">
              <span class="px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                c.currentLevel === 3
                  ? 'bg-brassSoft text-brass border border-brass/30'
                  : 'bg-pimentSoft text-piment border border-piment/25'
              }">
                ${escapeHtml(turnHeadline)}
              </span>
              <span class="px-3.5 py-1 rounded-full text-xs font-medium bg-linen text-inkSoft border border-sand">
                ${escapeHtml(targetLabel)}
              </span>
            </div>

            <blockquote class="font-serif text-2xl sm:text-3xl md:text-[2.15rem] font-semibold text-ink leading-snug max-w-2xl mx-auto mb-9">
              « ${escapeHtml(c.activeCard)} »
            </blockquote>

            ${c.noticeMessage ? `
              <p class="text-xs font-medium text-brass bg-brassSoft border border-brass/30 rounded-xl px-4 py-2.5 mb-6 inline-block">
                ${escapeHtml(c.noticeMessage)}
              </p>
            ` : ''}

            ${c.currentLevel === 3 ? `
              <div class="flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  type="button"
                  onclick="cycleLevel3Card()"
                  class="tactile-btn w-full sm:w-auto px-5 py-3 rounded-xl text-sm font-semibold bg-linen hover:bg-paperAlt text-ink border border-sand"
                >
                  Tirer une autre carte Caliente
                </button>
                <button
                  type="button"
                  onclick="nextCardTurn()"
                  class="tactile-btn w-full sm:w-auto px-6 py-3 rounded-xl text-sm font-semibold bg-piment hover:bg-pimentHover text-paper"
                >
                  Clôturer la partie
                </button>
              </div>
            ` : `
              <div class="flex flex-col sm:flex-row items-center justify-center gap-3">
                ${c.currentLevel === 2 ? `
                  <button
                    type="button"
                    disabled
                    class="w-full sm:w-auto px-4 py-3 rounded-xl text-xs sm:text-sm font-medium bg-paperAlt/80 text-inkMuted border border-sand/80 cursor-not-allowed"
                  >
                    Joker verrouillé à l’Acte II
                  </button>
                ` : `
                  <button
                    type="button"
                    onclick="useCardSkip()"
                    ${canSkipNow ? '' : 'disabled'}
                    class="tactile-btn w-full sm:w-auto px-4 py-3 rounded-xl text-xs sm:text-sm font-medium border ${
                      canSkipNow
                        ? 'bg-linen hover:bg-paperAlt text-ink border-sand'
                        : 'bg-paperAlt/70 text-inkMuted border-sand/70 cursor-not-allowed'
                    }"
                  >
                    ${canSkipNow
                      ? `Passer (joker de ${activePlayer})`
                      : `Joker de ${activePlayer} déjà utilisé`}
                  </button>
                `}

                <button
                  type="button"
                  onclick="nextCardTurn()"
                  class="tactile-btn w-full sm:w-auto px-6 py-3 rounded-xl text-sm font-semibold bg-piment hover:bg-pimentHover text-paper"
                >
                  Carte réalisée • Tour suivant
                </button>
              </div>
            `}
          </section>

          ${previousPlayed.length > 0 ? `
            <details class="liquid-surface rounded-xl bg-paper/75 border border-sand/80 px-4 py-3 mb-5 text-xs text-inkSoft">
              <summary class="cursor-pointer font-medium text-inkSoft hover:text-ink select-none flex items-center justify-between">
                <span>Cartes déjà tirées dans ${escapeHtml(lvl.name)} (${previousPlayed.length})</span>
                ${c.remainingDecks[c.currentLevel].length === 0 ? `
                  <button
                    type="button"
                    onclick="event.preventDefault();reshuffleCurrentLevelDeck();"
                    class="tactile-btn px-2.5 py-1 rounded-lg bg-linen hover:bg-paperAlt text-ink border border-sand font-semibold"
                  >
                    Remélanger l’acte
                  </button>
                ` : ''}
              </summary>
              <ul class="mt-2.5 pt-2.5 border-t border-sand/70 space-y-1.5 text-inkMuted">
                ${previousPlayed.map((txt, idx) => `
                  <li class="flex items-start gap-2">
                    <span class="font-serif italic tabular-nums">${idx + 1}.</span>
                    <span class="line-through">${escapeHtml(txt)}</span>
                  </li>
                `).join('')}
              </ul>
            </details>
          ` : ''}

          <div class="text-center">
            <button
              type="button"
              onclick="resetCardsSetup()"
              class="tactile-btn text-xs text-inkMuted hover:text-ink underline underline-offset-4"
            >
              Recommencer une nouvelle partie
            </button>
          </div>
        </main>
      `;
    }

    // =========================================================================
    // 13. VUE 3 — MODE ROLEPLAY (3 ÉTAPES STRICTES + 1 OU 2 REPÈRES)
    // =========================================================================

    function renderRoleplayProgress(step) {
      const labels = ['1. Rôles', '2. Intention', '3. Actions'];
      return `
        <nav aria-label="Étapes Roleplay" class="flex items-center gap-2 mb-7">
          ${labels.map((lbl, idx) => {
            const num = idx + 1;
            const active = num === step;
            const done = num < step;
            return `
              <span class="liquid-surface px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                active
                  ? 'bg-piment text-paper'
                  : done
                    ? 'bg-brassSoft text-brass border border-brass/30'
                    : 'bg-paper text-inkMuted border border-sand'
              }">
                ${lbl}
              </span>
            `;
          }).join('')}
        </nav>
      `;
    }

    function renderRoleplay() {
      const rp = state.roleplay;
      const roles = getRoleplayRoles();
      const intention = ROLEPLAY_INTENTIONS[rp.intentionIndex] || ROLEPLAY_INTENTIONS[0];

      if (rp.step === 1) {
        return `
          <main class="flex-1 max-w-2xl w-full mx-auto px-5 sm:px-8 py-8 sm:py-10 animate-view">
            ${renderRoleplayProgress(1)}

            <div class="mb-6">
              <h1 class="font-serif text-3xl sm:text-4xl font-semibold text-ink">
                Distribution des rôles
              </h1>
              <p class="text-xs sm:text-sm text-inkSoft mt-1">
                Scénario tiré au sort : <span class="font-semibold text-ink">${escapeHtml(roles.duoLabel)}</span>
              </p>
            </div>

            <div class="space-y-4 mb-8 ${rp.rollingDuo ? 'animate-draw-beat' : ''}">
              <section class="liquid-surface rounded-2xl bg-paper border border-piment/35 p-6 sm:p-7 shadow-editorial">
                <div class="flex items-center justify-between mb-1.5">
                  <span class="text-xs font-bold uppercase tracking-[0.16em] text-piment">Elle</span>
                  <span class="text-xs text-inkMuted">Personnage 1</span>
                </div>
                <p class="font-serif text-3xl sm:text-4xl font-semibold text-ink">
                  ${escapeHtml(roles.elle)}
                </p>
              </section>

              <section class="liquid-surface rounded-2xl bg-paper border border-brass/45 p-6 sm:p-7 shadow-editorial">
                <div class="flex items-center justify-between mb-1.5">
                  <span class="text-xs font-bold uppercase tracking-[0.16em] text-brass">Lui</span>
                  <span class="text-xs text-inkMuted">Personnage 2</span>
                </div>
                <p class="font-serif text-3xl sm:text-4xl font-semibold text-ink">
                  ${escapeHtml(roles.lui)}
                </p>
              </section>
            </div>

            <div class="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-sand">
              <div class="flex w-full sm:w-auto gap-2.5">
                <button
                  type="button"
                  onclick="rerollRoleplayDuo()"
                  class="tactile-btn flex-1 sm:flex-initial px-4 py-3 rounded-xl text-sm font-semibold bg-paper hover:bg-paperAlt text-ink border border-sand"
                >
                  Relancer les rôles
                </button>
                <button
                  type="button"
                  onclick="swapRoleplayDuo()"
                  class="tactile-btn px-4 py-3 rounded-xl text-xs sm:text-sm font-medium bg-paper hover:bg-paperAlt text-inkSoft border border-sand"
                >
                  Inverser
                </button>
              </div>

              <button
                type="button"
                onclick="setRoleplayStep(2)"
                class="tactile-btn w-full sm:w-auto px-6 py-3 rounded-xl text-sm font-semibold bg-piment hover:bg-pimentHover text-paper"
              >
                Étape suivante : Intention
              </button>
            </div>
          </main>
        `;
      }

      if (rp.step === 2) {
        return `
          <main class="flex-1 max-w-2xl w-full mx-auto px-5 sm:px-8 py-8 sm:py-10 animate-view">
            ${renderRoleplayProgress(2)}

            <div class="liquid-surface rounded-xl bg-paper border border-sand px-4 py-3 mb-7 flex flex-wrap items-center justify-between gap-2 text-xs sm:text-sm">
              <div>
                <span class="font-bold text-piment">Elle :</span>
                <span class="font-semibold text-ink">${escapeHtml(roles.elle)}</span>
              </div>
              <span class="text-sandDark hidden sm:inline">|</span>
              <div>
                <span class="font-bold text-brass">Lui :</span>
                <span class="font-semibold text-ink">${escapeHtml(roles.lui)}</span>
              </div>
            </div>

            <div class="mb-5">
              <h1 class="font-serif text-3xl sm:text-4xl font-semibold text-ink">
                L’intention de jeu
              </h1>
              <p class="text-xs sm:text-sm text-inkSoft mt-1">
                La couleur émotionnelle qui guidera votre échange dès les premières répliques.
              </p>
            </div>

            <section class="liquid-surface animate-card rounded-2xl bg-paper border border-brass/50 p-8 sm:p-11 text-center shadow-editorial mb-8 ${rp.rollingIntention ? 'animate-draw-beat' : ''}">
              <span class="inline-block text-[11px] font-bold uppercase tracking-[0.16em] text-brass mb-3">
                Atmosphère de scène
              </span>
              <p class="font-serif text-2xl sm:text-3xl md:text-[2.1rem] font-semibold text-ink leading-snug">
                « ${escapeHtml(intention)} »
              </p>
            </section>

            <div class="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-sand">
              <button
                type="button"
                onclick="rerollRoleplayIntention()"
                class="tactile-btn w-full sm:w-auto px-5 py-3 rounded-xl text-sm font-semibold bg-paper hover:bg-paperAlt text-ink border border-sand"
              >
                Relancer l’intention
              </button>

              <button
                type="button"
                onclick="setRoleplayStep(3)"
                class="tactile-btn w-full sm:w-auto px-6 py-3 rounded-xl text-sm font-semibold bg-piment hover:bg-pimentHover text-paper"
              >
                Étape suivante : Actions
              </button>
            </div>
          </main>
        `;
      }

      const activeActions = rp.selectedActionIndices.map((idx) => ROLEPLAY_ACTIONS[idx]);

      return `
        <main class="flex-1 max-w-2xl w-full mx-auto px-5 sm:px-8 py-8 sm:py-10 animate-view">
          ${renderRoleplayProgress(3)}

          <section class="liquid-surface rounded-2xl bg-paper border border-sand p-4 sm:p-5 mb-7 space-y-2 text-xs sm:text-sm shadow-editorial">
            <div class="flex items-center justify-between">
              <span class="font-bold text-piment">Elle</span>
              <span class="font-semibold text-ink">${escapeHtml(roles.elle)}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="font-bold text-brass">Lui</span>
              <span class="font-semibold text-ink">${escapeHtml(roles.lui)}</span>
            </div>
            <div class="pt-2.5 border-t border-sand flex flex-wrap items-center justify-between gap-2">
              <span class="text-inkSoft">Intention</span>
              <span class="font-semibold text-ink text-right">${escapeHtml(intention)}</span>
            </div>
          </section>

          <div class="flex flex-wrap items-end justify-between gap-4 mb-5">
            <div>
              <h1 class="font-serif text-3xl sm:text-4xl font-semibold text-ink">
                Repères à glisser dans la scène
              </h1>
              <p class="text-xs sm:text-sm text-inkSoft mt-1">
                Actions ponctuelles tirées au sort parmi les cinq propositions.
              </p>
            </div>

            <div class="inline-flex rounded-full bg-paper p-1 border border-sand text-xs">
              <button
                type="button"
                onclick="setRoleplayActionCount(1)"
                class="tactile-btn px-3.5 py-1.5 rounded-full font-semibold ${
                  rp.actionCount === 1
                    ? 'bg-piment text-paper'
                    : 'text-inkSoft hover:text-ink'
                }"
              >
                1 repère
              </button>
              <button
                type="button"
                onclick="setRoleplayActionCount(2)"
                class="tactile-btn px-3.5 py-1.5 rounded-full font-semibold ${
                  rp.actionCount === 2
                    ? 'bg-piment text-paper'
                    : 'text-inkSoft hover:text-ink'
                }"
              >
                2 repères
              </button>
            </div>
          </div>

          <div class="space-y-3.5 mb-8 ${rp.rollingActions ? 'animate-draw-beat' : ''}">
            ${activeActions.map((act, i) => `
              <div class="liquid-surface animate-card rounded-2xl bg-paper border border-piment/35 p-5 sm:p-6 shadow-editorial flex items-center gap-4">
                <span class="w-8 h-8 rounded-full bg-pimentSoft text-piment font-serif italic font-bold text-base flex items-center justify-center flex-shrink-0">
                  ${i + 1}
                </span>
                <p class="font-serif text-xl sm:text-2xl font-semibold text-ink">
                  ${escapeHtml(act)}
                </p>
              </div>
            `).join('')}
          </div>

          <div class="flex flex-wrap items-center justify-between gap-3 pt-5 border-t border-sand">
            <button
              type="button"
              onclick="rerollRoleplayActions()"
              class="tactile-btn px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-paper hover:bg-paperAlt text-ink border border-sand"
            >
              Relancer les repères
            </button>

            <div class="flex flex-wrap gap-2.5">
              <button
                type="button"
                onclick="restartFullRoleplayScene()"
                class="tactile-btn px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-linen hover:bg-paperAlt text-ink border border-sand"
              >
                Relancer toute la scène
              </button>
              <button
                type="button"
                onclick="performNavigate('hub')"
                class="tactile-btn px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-piment hover:bg-pimentHover text-paper"
              >
                Retour au Hub
              </button>
            </div>
          </div>
        </main>
      `;
    }

    // =========================================================================
    // 14. VUE 4 — MODE BDSM (30 PRATIQUES / 5 CATÉGORIES + 8 ÉTAPES VALIDÉES)
    // =========================================================================

    function renderBdsmNav(currentStep) {
      const items = [
        { key: 'setup', label: '1. Rôle + surnom' },
        { key: 'dom_turn', label: '2. Actions (1/2)' },
        { key: 'dom_options', label: '3. Cases (1/2)' },
        { key: 'handoff', label: 'Relais' },
        { key: 'sub_turn', label: '2. Actions (2/2)' },
        { key: 'sub_options', label: '3. Cases (2/2)' },
        { key: 'options_summary', label: 'Résumé commun' },
        { key: 'discuss_reveal', label: '4. À discuter' },
        { key: 'agreements_reveal', label: '5. Accords' },
        { key: 'punish', label: '6. Punition' },
        { key: 'safeword', label: '7. Safeword' },
        { key: 'warmup', label: '8. Échauffement' },
        { key: 'session_ready', label: 'Session' }
      ];
      return `
        <nav aria-label="Progression BDSM" class="flex items-center gap-1.5 overflow-x-auto pb-2 mb-6">
          ${items.map((it) => `
            <span class="liquid-surface px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
              it.key === currentStep
                ? 'bg-piment text-paper'
                : 'bg-paper text-inkMuted border border-sand'
            }">
              ${it.label}
            </span>
          `).join('')}
        </nav>
      `;
    }

    function renderBdsmSelectionTable(actorKey) {
      const selections = state.bdsm.selections[actorKey];

      const choices = [
        { key: 'sur_moi', label: 'OK sur moi', activeCls: 'bg-piment text-paper border-piment' },
        { key: 'sur_toi', label: 'OK sur toi', activeCls: 'bg-brass text-paper border-brass' },
        { key: 'discuter', label: 'À discuter', activeCls: 'bg-ink text-paper border-ink' },
        { key: 'non', label: 'Non', activeCls: 'bg-paperAlt text-piment border-piment' }
      ];

      return `
        <div class="liquid-surface sticky top-16 z-20 rounded-2xl bg-paper/95 border border-sand px-3.5 py-2.5 mb-5 flex items-center gap-2 overflow-x-auto shadow-sm" role="navigation" aria-label="Accès rapide aux catégories">
          <span class="text-[11px] font-bold uppercase tracking-wider text-inkMuted whitespace-nowrap mr-1">
            Catégories :
          </span>
          ${BDSM_CATEGORIES.map((cat) => `
            <button
              type="button"
              onclick="scrollToBdsmCategory('bdsm-cat-${actorKey}-${cat.id}')"
              class="tactile-btn px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap bg-linen hover:bg-paperAlt text-ink border border-sand"
            >
              ${escapeHtml(cat.label)} (6)
            </button>
          `).join('')}
        </div>

        <p class="text-xs font-medium text-inkSoft mb-5">
          Vous pouvez cocher simultanément et indépendamment « OK sur moi » et « OK sur toi » sur une même pratique. Si l’un des deux coche « Non », la pratique n’apparaîtra pas dans les « À discuter » ni en accord commun.
        </p>

        <div class="space-y-7 mb-7">
          ${BDSM_CATEGORIES.map((cat) => `
            <section id="bdsm-cat-${actorKey}-${cat.id}" class="scroll-mt-32 liquid-surface rounded-2xl bg-paper border border-sand overflow-hidden shadow-editorial">
              <div class="px-4 sm:px-6 py-3.5 bg-paperAlt/70 border-b border-sand flex flex-wrap items-center justify-between gap-2">
                <h2 class="font-serif text-xl sm:text-2xl font-semibold text-ink">
                  ${escapeHtml(cat.label)}
                </h2>
                <span class="text-xs font-semibold uppercase tracking-wider text-inkMuted">
                  6 pratiques
                </span>
              </div>

              <div class="divide-y divide-sand/70">
                ${cat.items.map((item, idx) => {
                  const activeChoices = getPracticeChoices(selections, item.id);
                  return `
                    <div class="p-4 sm:px-6 sm:py-4 hover:bg-linen/50 transition-colors">
                      <div class="flex items-center justify-between gap-3 mb-3">
                        <div class="flex items-center gap-2 min-w-0">
                          <span class="font-serif italic text-xs text-inkMuted tabular-nums">${String(idx + 1).padStart(2, '0')}.</span>
                          <span class="text-sm sm:text-[15px] font-semibold text-ink truncate">${escapeHtml(item.label)}</span>
                        </div>

                        ${item.info ? `
                          <button
                            type="button"
                            onclick="openPracticeInfo('${escapeHtml(item.label)}', '${escapeHtml(item.info)}')"
                            class="tactile-btn w-7 h-7 rounded-full bg-brassSoft hover:bg-brass/25 text-brass border border-brass/40 text-xs font-bold flex items-center justify-center flex-shrink-0"
                            title="Précision sur ${escapeHtml(item.label)}"
                            aria-label="Précision sur ${escapeHtml(item.label)}"
                          >
                            ?
                          </button>
                        ` : ''}
                      </div>

                      <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        ${choices.map((ch) => {
                          const selected = activeChoices.includes(ch.key);
                          return `
                            <button
                              type="button"
                              aria-pressed="${selected ? 'true' : 'false'}"
                              onclick="toggleBdsmPracticeChoice('${actorKey}', '${item.id}', '${ch.key}')"
                              class="tactile-btn py-2 px-2.5 rounded-xl text-xs font-semibold border text-center ${
                                selected
                                  ? ch.activeCls
                                  : 'bg-linen/75 hover:bg-paperAlt text-inkSoft hover:text-ink border-sand'
                              }"
                            >
                              ${ch.label}
                            </button>
                          `;
                        }).join('')}
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>
            </section>
          `).join('')}
        </div>
      `;
    }

    function renderBdsmEndOfTurnStep(actorKey, nextStep, backStep, titleLabel) {
      const globals = state.bdsm.globals[actorKey];

      return `
        <main class="flex-1 max-w-2xl w-full mx-auto px-5 sm:px-8 py-8 sm:py-10 animate-view">
          ${renderBdsmNav(actorKey === 'dominateur' ? 'dom_options' : 'sub_options')}

          <div class="mb-6">
            <span class="text-xs font-bold uppercase tracking-[0.16em] text-brass block mb-1">
              Étape 3 • Fin de tour
            </span>
            <h1 class="font-serif text-3xl sm:text-4xl font-semibold text-ink">
              Cases à cocher — ${escapeHtml(titleLabel)}
            </h1>
            <p class="text-xs sm:text-sm text-inkSoft mt-1">
              Le Switch est placé en dernier. Seuls les éléments communs apparaîtront sur la page de résumé.
            </p>
          </div>

          <section class="liquid-surface rounded-2xl bg-paper border border-sand p-5 sm:p-6 shadow-editorial mb-7 space-y-4">
            <label class="tactile-card cursor-pointer rounded-xl bg-linen/75 border border-piment/35 p-4 flex items-start gap-3.5">
              <input
                type="checkbox"
                class="editorial-check mt-0.5"
                ${globals.punition ? 'checked' : ''}
                onchange="toggleBdsmGlobalOption('${actorKey}', 'punition', this.checked)"
              />
              <div>
                <span class="block text-sm font-bold text-ink">1. Système de punition</span>
                <span class="block text-xs text-inkSoft mt-0.5">
                  Si validé des deux côtés, ouvre un écran dédié pour choisir une punition parmi vos accords communs autorisés (et pour le dominant uniquement si Switch est aussi validé des deux côtés).
                </span>
              </div>
            </label>

            <label class="tactile-card cursor-pointer rounded-xl bg-linen/75 border border-brass/45 p-4 flex items-start gap-3.5">
              <input
                type="checkbox"
                class="editorial-check accent-brass mt-0.5"
                ${globals.switchRole ? 'checked' : ''}
                onchange="toggleBdsmGlobalOption('${actorKey}', 'switchRole', this.checked)"
              />
              <div>
                <span class="block text-sm font-bold text-ink">2. OK pour inverser les rôles (Switch)</span>
                <span class="block text-xs text-inkSoft mt-0.5">
                  Placé en dernier : active l’inversion des rôles si coché des deux côtés.
                </span>
              </div>
            </label>
          </section>

          <div class="flex flex-wrap items-center justify-between gap-3 pt-2">
            <button
              type="button"
              onclick="setBdsmStep('${backStep}')"
              class="tactile-btn px-4 py-2.5 rounded-xl text-sm font-medium bg-paper hover:bg-paperAlt text-ink border border-sand"
            >
              Retour aux actions
            </button>
            <button
              type="button"
              onclick="${nextStep === 'after_sub_options' ? 'proceedAfterSubOptions()' : `setBdsmStep('${nextStep}')`}"
              class="tactile-btn px-6 py-3 rounded-xl text-sm font-semibold bg-piment hover:bg-pimentHover text-paper"
            >
              ${actorKey === 'dominateur' ? 'Passer le relais' : 'Voir le résumé commun'}
            </button>
          </div>
        </main>
      `;
    }

    function renderBdsm() {
      const b = state.bdsm;
      const domFull = getDomDisplayName();
      const subFull = getSubDisplayName();
      const domShort = getDomShortName();
      const subShort = getSubShortName();

      if (b.step === 'setup') {
        return `
          <main class="flex-1 max-w-3xl w-full mx-auto px-5 sm:px-8 py-8 sm:py-10 animate-view">
            ${renderBdsmNav('setup')}

            <div class="flex flex-wrap items-end justify-between gap-3 mb-6">
              <div>
                <span class="text-xs font-bold uppercase tracking-[0.16em] text-piment block mb-1">
                  Étape 1 • Rôle + surnom
                </span>
                <h1 class="font-serif text-3xl sm:text-4xl font-semibold text-ink">
                  Rôles &amp; surnoms
                </h1>
                <p class="text-xs sm:text-sm text-inkSoft mt-1">
                  Définissez vos rôles et surnoms (ou laissez vide pour utiliser Lui / Elle).
                </p>
              </div>

              <button
                type="button"
                onclick="swapBdsmRoles()"
                class="tactile-btn inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-paper hover:bg-paperAlt text-ink border border-sand"
              >
                <svg class="w-3.5 h-3.5 text-piment" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                </svg>
                <span>Inverser les rôles</span>
              </button>
            </div>

            <section class="liquid-surface rounded-2xl bg-paper border border-sand p-6 sm:p-8 space-y-6 shadow-editorial">
              <div class="liquid-surface rounded-xl bg-linen/80 border border-sand p-5 space-y-4">
                <div class="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <span class="text-[11px] font-bold uppercase tracking-wider text-piment block">Rôle 1</span>
                    <h2 class="font-serif text-2xl font-semibold text-ink">Dominateur</h2>
                  </div>
                  <div class="inline-flex rounded-full bg-paper p-1 border border-sand">
                    ${['Lui', 'Elle'].map((g) => `
                      <button
                        type="button"
                        onclick="setBdsmRoleGender('dominateur', '${g}')"
                        class="tactile-btn px-4 py-1.5 rounded-full text-xs font-bold ${
                          b.roles.dominateurGender === g
                            ? 'bg-piment text-paper'
                            : 'text-inkSoft hover:text-ink'
                        }"
                      >
                        ${g}
                      </button>
                    `).join('')}
                  </div>
                </div>

                <div>
                  <label class="block text-xs font-medium text-inkSoft mb-1.5">
                    Surnom de ${escapeHtml(b.roles.dominateurGender)} (facultatif)
                  </label>
                  <input
                    type="text"
                    value="${escapeHtml(b.roles.dominateurName)}"
                    oninput="updateBdsmName('dominateurName', this.value)"
                    placeholder="${escapeHtml(b.roles.dominateurGender)}"
                    class="w-full px-4 py-2.5 rounded-xl bg-paper border border-sand text-sm text-ink placeholder-inkMuted focus:outline-none focus:border-piment"
                  />
                </div>
              </div>

              <div class="liquid-surface rounded-xl bg-linen/80 border border-sand p-5 space-y-4">
                <div class="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <span class="text-[11px] font-bold uppercase tracking-wider text-brass block">Rôle 2</span>
                    <h2 class="font-serif text-2xl font-semibold text-ink">Dominé</h2>
                  </div>
                  <div class="inline-flex rounded-full bg-paper p-1 border border-sand">
                    ${['Lui', 'Elle'].map((g) => `
                      <button
                        type="button"
                        onclick="setBdsmRoleGender('domine', '${g}')"
                        class="tactile-btn px-4 py-1.5 rounded-full text-xs font-bold ${
                          b.roles.domineGender === g
                            ? 'bg-brass text-paper'
                            : 'text-inkSoft hover:text-ink'
                        }"
                      >
                        ${g}
                      </button>
                    `).join('')}
                  </div>
                </div>

                <div>
                  <label class="block text-xs font-medium text-inkSoft mb-1.5">
                    Surnom de ${escapeHtml(b.roles.domineGender)} (facultatif)
                  </label>
                  <input
                    type="text"
                    value="${escapeHtml(b.roles.domineName)}"
                    oninput="updateBdsmName('domineName', this.value)"
                    placeholder="${escapeHtml(b.roles.domineGender)}"
                    class="w-full px-4 py-2.5 rounded-xl bg-paper border border-sand text-sm text-ink placeholder-inkMuted focus:outline-none focus:border-brass"
                  />
                </div>
              </div>

              <div class="flex justify-end pt-2">
                <button
                  type="button"
                  onclick="setBdsmStep('dom_turn')"
                  class="tactile-btn w-full sm:w-auto px-6 py-3 rounded-xl text-sm font-semibold bg-piment hover:bg-pimentHover text-paper"
                >
                  Étape 2 : Choix des actions (${escapeHtml(domShort)})
                </button>
              </div>
            </section>
          </main>
        `;
      }

      if (b.step === 'dom_turn') {
        return `
          <main class="flex-1 max-w-4xl w-full mx-auto px-5 sm:px-8 py-8 sm:py-10 animate-view">
            ${renderBdsmNav('dom_turn')}

            <div class="flex flex-wrap items-baseline justify-between gap-3 mb-6">
              <div>
                <span class="text-xs font-bold uppercase tracking-wider text-piment">Étape 2 • Choix des actions (1/2)</span>
                <h1 class="font-serif text-3xl sm:text-4xl font-semibold text-ink mt-0.5">
                  ${escapeHtml(domFull)}
                </h1>
              </div>
              <span class="text-xs text-inkSoft">
                30 pratiques • 5 catégories
              </span>
            </div>

            ${renderBdsmSelectionTable('dominateur')}

            <div class="flex flex-wrap items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onclick="setBdsmStep('setup')"
                class="tactile-btn px-4 py-2.5 rounded-xl text-sm font-medium bg-paper hover:bg-paperAlt text-ink border border-sand"
              >
                Étape 1 : Rôles
              </button>
              <button
                type="button"
                onclick="setBdsmStep('dom_options')"
                class="tactile-btn px-6 py-3 rounded-xl text-sm font-semibold bg-piment hover:bg-pimentHover text-paper"
              >
                Étape 3 : Cases à cocher
              </button>
            </div>
          </main>
        `;
      }

      if (b.step === 'dom_options') {
        return renderBdsmEndOfTurnStep('dominateur', 'handoff', 'dom_turn', domShort);
      }

      if (b.step === 'handoff') {
        return `
          <main class="flex-1 max-w-2xl w-full mx-auto px-5 sm:px-8 py-12 animate-view">
            ${renderBdsmNav('handoff')}

            <section class="liquid-surface rounded-2xl bg-paper border border-sand p-8 sm:p-11 text-center shadow-editorial">
              <div class="w-12 h-12 mx-auto mb-5 rounded-full bg-linen border border-sand flex items-center justify-center text-piment">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <p class="text-xs font-bold uppercase tracking-[0.16em] text-inkMuted mb-2">
                Passage de relais
              </p>
              <h1 class="font-serif text-3xl sm:text-4xl font-semibold text-ink mb-3">
                Passez l’écran à ${escapeHtml(subShort)}
              </h1>
              <p class="text-sm text-inkSoft leading-relaxed max-w-md mx-auto mb-8">
                Les sélections de <strong class="text-ink">${escapeHtml(domShort)}</strong> restent confidentielles. Remettez l’appareil à <strong class="text-ink">${escapeHtml(subShort)}</strong> pour qu’il ou elle choisisse ses actions et cases.
              </p>
              <button
                type="button"
                onclick="setBdsmStep('sub_turn')"
                class="tactile-btn w-full sm:w-auto px-7 py-3.5 rounded-xl text-sm font-semibold bg-piment hover:bg-pimentHover text-paper"
              >
                Continuer en tant que ${escapeHtml(subShort)}
              </button>
            </section>
          </main>
        `;
      }

      if (b.step === 'sub_turn') {
        return `
          <main class="flex-1 max-w-4xl w-full mx-auto px-5 sm:px-8 py-8 sm:py-10 animate-view">
            ${renderBdsmNav('sub_turn')}

            <div class="flex flex-wrap items-baseline justify-between gap-3 mb-6">
              <div>
                <span class="text-xs font-bold uppercase tracking-wider text-brass">Étape 2 • Choix des actions (2/2)</span>
                <h1 class="font-serif text-3xl sm:text-4xl font-semibold text-ink mt-0.5">
                  ${escapeHtml(subFull)}
                </h1>
              </div>
              <span class="text-xs text-inkSoft">
                30 pratiques • 5 catégories
              </span>
            </div>

            ${renderBdsmSelectionTable('domine')}

            <div class="flex justify-end pt-2">
              <button
                type="button"
                onclick="setBdsmStep('sub_options')"
                class="tactile-btn w-full sm:w-auto px-6 py-3 rounded-xl text-sm font-semibold bg-piment hover:bg-pimentHover text-paper"
              >
                Étape 3 : Cases à cocher
              </button>
            </div>
          </main>
        `;
      }

      if (b.step === 'sub_options') {
        return renderBdsmEndOfTurnStep('domine', 'after_sub_options', 'sub_turn', subShort);
      }

      if (b.step === 'options_summary') {
        const gDom = b.globals.dominateur;
        const gSub = b.globals.domine;

        const commonItems = [];
        if (gDom.punition && gSub.punition) {
          commonItems.push({ title: 'Système de punition', detail: 'En commun' });
        }
        if (gDom.switchRole && gSub.switchRole) {
          commonItems.push({ title: 'OK pour inverser les rôles (Switch)', detail: 'En commun' });
        }

        return `
          <main class="flex-1 max-w-2xl w-full mx-auto px-5 sm:px-8 py-10 animate-view">
            ${renderBdsmNav('options_summary')}

            <section class="liquid-surface rounded-2xl bg-paper border border-sand p-7 sm:p-9 shadow-editorial">
              <span class="text-xs font-bold uppercase tracking-[0.16em] text-brass block mb-1">
                Étape 3 • Résumé des cases
              </span>
              <h1 class="font-serif text-3xl sm:text-4xl font-semibold text-ink mb-2">
                Éléments en commun
              </h1>
              <p class="text-sm text-inkSoft leading-relaxed mb-6">
                Seuls les éléments cochés des deux côtés entre <strong class="text-ink">${escapeHtml(domShort)}</strong> et <strong class="text-ink">${escapeHtml(subShort)}</strong> sont affichés.
              </p>

              ${commonItems.length > 0 ? `
                <ul class="space-y-3 mb-8">
                  ${commonItems.map((it) => `
                    <li class="rounded-xl bg-linen/80 border border-sand p-4 flex items-center justify-between gap-3">
                      <span class="text-sm font-bold text-ink">${escapeHtml(it.title)}</span>
                      <span class="text-xs font-semibold px-3 py-1 rounded-full bg-brassSoft text-brass border border-brass/30">
                        ${escapeHtml(it.detail)}
                      </span>
                    </li>
                  `).join('')}
                </ul>
              ` : `
                <div class="rounded-xl bg-linen/80 border border-sand p-6 text-center mb-8">
                  <p class="text-sm text-inkSoft">
                    Aucun élément commun parmi les cases pour cette session.
                  </p>
                </div>
              `}

              <div class="flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onclick="setBdsmStep('sub_options')"
                  class="tactile-btn px-4 py-2.5 rounded-xl text-sm font-medium bg-linen hover:bg-paperAlt text-ink border border-sand"
                >
                  Retour aux cases
                </button>
                <button
                  type="button"
                  onclick="proceedFromOptionsSummary()"
                  class="tactile-btn px-6 py-3 rounded-xl text-sm font-semibold bg-piment hover:bg-pimentHover text-paper"
                >
                  Étape 4 : Reveal « À discuter »
                </button>
              </div>
            </section>
          </main>
        `;
      }

      if (b.step === 'discuss_reveal') {
        const candidates = getDiscussCandidates();

        return `
          <main class="flex-1 max-w-3xl w-full mx-auto px-5 sm:px-8 py-8 sm:py-10 animate-view">
            ${renderBdsmNav('discuss_reveal')}

            <div class="mb-6">
              <span class="text-xs font-bold uppercase tracking-[0.16em] text-brass block mb-1">
                Étape 4 • Reveal « À discuter »
              </span>
              <h1 class="font-serif text-3xl sm:text-4xl font-semibold text-ink">
                Cases « À discuter »
              </h1>
              <p class="text-xs sm:text-sm text-inkSoft mt-1">
                Les pratiques marquées « Non » par l’un des deux sont exclues. Validez ou réfutez chaque point.
              </p>
            </div>

            ${candidates.length > 0 ? `
              <div class="space-y-3.5 mb-8">
                ${candidates.map((item) => {
                  const res = b.discussResolutions[item.id] || 'pending';
                  return `
                    <section class="liquid-surface rounded-2xl bg-paper border border-sand p-5 shadow-editorial flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <div class="flex items-center gap-2 mb-1">
                          <span class="text-[11px] font-bold uppercase tracking-wider text-inkMuted">${escapeHtml(item.categoryLabel)}</span>
                          ${item.bothDiscuss ? `
                            <span class="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-brassSoft text-brass border border-brass/30">
                              Coché des deux côtés
                            </span>
                          ` : ''}
                        </div>
                        <h2 class="font-serif text-xl sm:text-2xl font-semibold text-ink">
                          ${escapeHtml(item.label)}
                        </h2>
                      </div>

                      <div class="flex items-center gap-2 flex-shrink-0">
                        <button
                          type="button"
                          aria-pressed="${res === 'accepted' ? 'true' : 'false'}"
                          onclick="setDiscussResolution('${item.id}', 'accepted')"
                          class="tactile-btn px-4 py-2 rounded-xl text-xs font-bold border ${
                            res === 'accepted'
                              ? 'bg-piment text-paper border-piment'
                              : 'bg-linen hover:bg-paperAlt text-ink border-sand'
                          }"
                        >
                          Valider
                        </button>
                        <button
                          type="button"
                          aria-pressed="${res === 'refuted' ? 'true' : 'false'}"
                          onclick="setDiscussResolution('${item.id}', 'refuted')"
                          class="tactile-btn px-4 py-2 rounded-xl text-xs font-bold border ${
                            res === 'refuted'
                              ? 'bg-ink text-paper border-ink'
                              : 'bg-linen hover:bg-paperAlt text-inkSoft hover:text-ink border-sand'
                          }"
                        >
                          Réfuter
                        </button>
                      </div>
                    </section>
                  `;
                }).join('')}
              </div>
            ` : `
              <section class="liquid-surface rounded-2xl bg-paper border border-sand p-7 text-center shadow-editorial mb-8">
                <p class="text-sm text-inkSoft">
                  Aucune case « À discuter » à révéler pour cette session.
                </p>
              </section>
            `}

            <div class="flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onclick="setBdsmStep('options_summary')"
                class="tactile-btn px-4 py-2.5 rounded-xl text-sm font-medium bg-paper hover:bg-paperAlt text-ink border border-sand"
              >
                Retour au résumé
              </button>
              <button
                type="button"
                onclick="proceedFromDiscussReveal()"
                class="tactile-btn px-6 py-3 rounded-xl text-sm font-semibold bg-piment hover:bg-pimentHover text-paper"
              >
                Étape 5 : Reveal des accords communs
              </button>
            </div>
          </main>
        `;
      }

      const { domToSub, subToDom, toDiscuss } = computeBdsmMatches();
      const gDom = b.globals.dominateur;
      const gSub = b.globals.domine;
      const bothAllowSwitch = gDom.switchRole && gSub.switchRole;
      const bothPunish = gDom.punition && gSub.punition;
      const safewordDisplay = b.safeword.trim() || 'Non renseigné';

      if (b.step === 'agreements_reveal') {
        const acceptedDiscuss = toDiscuss.filter((d) => d.resolution === 'accepted');

        return `
          <main class="flex-1 max-w-5xl w-full mx-auto px-5 sm:px-8 py-8 sm:py-10 animate-view relative">
            ${renderBdsmNav('agreements_reveal')}

            ${b.screenLocked ? `
              <div class="fixed inset-0 z-40 bg-linen/90 backdrop-blur-lg flex flex-col items-center justify-center p-6 text-center animate-view">
                <div class="liquid-surface max-w-sm w-full rounded-2xl bg-paper border border-sand p-8 shadow-editorial">
                  <div class="w-12 h-12 mx-auto mb-4 rounded-full bg-linen border border-sand flex items-center justify-center text-piment">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24" aria-hidden="true">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <p class="text-xs font-bold uppercase tracking-widest text-inkMuted mb-1">Écran verrouillé</p>
                  <h2 class="font-serif text-2xl font-semibold text-ink mb-2">Session protégée</h2>
                  <p class="text-xs sm:text-sm text-inkSoft leading-relaxed mb-6">
                    Vos accords restent en mémoire à l’abri des regards pendant la session.
                  </p>
                  <button
                    type="button"
                    onclick="handleUnlockScreenTap()"
                    class="tactile-btn w-full py-3 px-5 rounded-xl text-sm font-semibold bg-piment hover:bg-pimentHover text-paper"
                  >
                    ${b.unlockTapCount === 1
                      ? 'Appuyez une seconde fois pour déverrouiller'
                      : 'Déverrouiller l’écran (double appui)'}
                  </button>
                </div>
              </div>
            ` : ''}

            <div class="flex flex-wrap items-end justify-between gap-4 mb-6">
              <div>
                <span class="text-[11px] font-bold uppercase tracking-[0.16em] text-piment block mb-1">
                  Étape 5 • Reveal des accords communs &amp; cases validées
                </span>
                <h1 class="font-serif text-3xl sm:text-4xl font-semibold text-ink">
                  Vos accords communs
                </h1>
                <p class="text-xs sm:text-sm text-inkSoft mt-1">
                  Pratiques et cases à cocher validées ensemble entre ${escapeHtml(domShort)} et ${escapeHtml(subShort)}.
                </p>
              </div>

              <div class="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onclick="lockRevealScreen()"
                  class="tactile-btn inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-paper hover:bg-paperAlt text-ink border border-sand"
                >
                  <span>Verrouiller l’écran</span>
                </button>

                <button
                  type="button"
                  onclick="copyBdsmSummary()"
                  class="tactile-btn inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-paper hover:bg-paperAlt text-ink border border-sand"
                >
                  <span>Copier le récapitulatif</span>
                </button>
              </div>
            </div>

            <section class="liquid-surface rounded-2xl bg-paper border border-brass/50 p-5 sm:p-6 shadow-editorial mb-7">
              <span class="text-[11px] font-bold uppercase tracking-[0.16em] text-brass block mb-2.5">
                Cases à cocher validées ensemble
              </span>
              ${(bothPunish || bothAllowSwitch) ? `
                <div class="flex flex-wrap gap-2.5 text-xs">
                  ${bothPunish ? `
                    <span class="px-3.5 py-1.5 rounded-full bg-linen text-ink border border-sand font-semibold">
                      Système de punition : Validé ensemble
                    </span>
                  ` : ''}
                  ${bothAllowSwitch ? `
                    <span class="px-3.5 py-1.5 rounded-full bg-brassSoft text-brass border border-brass/30 font-semibold">
                      OK pour inverser les rôles (Switch) : Validé ensemble
                    </span>
                  ` : ''}
                </div>
              ` : `
                <p class="text-xs sm:text-sm text-inkSoft">
                  Aucune des cases n’a été validée ensemble.
                </p>
              `}
            </section>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6 mb-7 items-start">
              <section class="liquid-surface rounded-2xl bg-paper border border-sand p-5 sm:p-7 shadow-editorial">
                <div class="pb-4 mb-4 border-b border-sand">
                  <span class="text-[11px] font-bold uppercase tracking-wider text-piment block mb-1">
                    ${escapeHtml(domShort)} → ${escapeHtml(subShort)}
                  </span>
                  <h2 class="font-serif text-2xl font-semibold text-ink leading-snug">
                    Ce que <span class="text-piment">${escapeHtml(domShort)}</span> fait à <span class="text-brass">${escapeHtml(subShort)}</span>
                  </h2>
                </div>

                ${domToSub.length > 0 ? `
                  <ul class="space-y-2.5">
                    ${domToSub.map((item) => `
                      <li class="flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl bg-linen/80 border border-sand/80">
                        <span class="text-sm font-medium text-ink">${escapeHtml(item.label)}</span>
                        <span class="flex items-center gap-1.5 flex-shrink-0">
                          ${item.acceptedDiscuss ? `
                            <span class="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-brassSoft text-brass border border-brass/30 whitespace-nowrap">
                              Après discussion
                            </span>
                          ` : ''}
                          ${item.reciprocal ? `
                            <span class="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-brassSoft text-brass border border-brass/30 whitespace-nowrap">
                              Réciproque
                            </span>
                          ` : ''}
                        </span>
                      </li>
                    `).join('')}
                  </ul>
                ` : `
                  <div class="rounded-xl bg-linen/70 border border-sand/70 p-6 text-center">
                    <p class="text-sm text-inkSoft leading-relaxed">
                      Aucune pratique commune retenue dans ce sens.
                    </p>
                  </div>
                `}
              </section>

              <section class="liquid-surface rounded-2xl bg-paper border border-sand p-5 sm:p-7 shadow-editorial">
                <div class="pb-4 mb-4 border-b border-sand">
                  <span class="text-[11px] font-bold uppercase tracking-wider text-brass block mb-1">
                    ${escapeHtml(subShort)} → ${escapeHtml(domShort)}
                  </span>
                  <h2 class="font-serif text-2xl font-semibold text-ink leading-snug">
                    Ce que <span class="text-brass">${escapeHtml(subShort)}</span> fait à <span class="text-piment">${escapeHtml(domShort)}</span>
                  </h2>
                </div>

                ${subToDom.length > 0 ? `
                  <ul class="space-y-2.5">
                    ${subToDom.map((item) => `
                      <li class="flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl bg-linen/80 border border-sand/80">
                        <span class="text-sm font-medium text-ink">${escapeHtml(item.label)}</span>
                        <span class="flex items-center gap-1.5 flex-shrink-0">
                          ${item.acceptedDiscuss ? `
                            <span class="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-brassSoft text-brass border border-brass/30 whitespace-nowrap">
                              Après discussion
                            </span>
                          ` : ''}
                          ${item.reciprocal ? `
                            <span class="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-pimentSoft text-piment border border-piment/25 whitespace-nowrap">
                              Réciproque
                            </span>
                          ` : ''}
                        </span>
                      </li>
                    `).join('')}
                  </ul>
                ` : `
                  <div class="rounded-xl bg-linen/70 border border-sand/70 p-6 text-center">
                    <p class="text-sm text-inkSoft leading-relaxed">
                      Aucune pratique commune retenue dans ce sens.
                    </p>
                  </div>
                `}
              </section>
            </div>

            ${acceptedDiscuss.length > 0 ? `
              <section class="liquid-surface rounded-2xl bg-paper border border-sand p-5 sm:p-6 shadow-editorial mb-7">
                <span class="text-[11px] font-bold uppercase tracking-[0.16em] text-brass block mb-2">
                  Points « À discuter » validés
                </span>
                <div class="flex flex-wrap gap-2">
                  ${acceptedDiscuss.map((it) => `
                    <span class="px-3 py-1.5 rounded-xl bg-brassSoft border border-brass/30 text-xs font-semibold text-ink">
                      ${escapeHtml(it.label)}
                    </span>
                  `).join('')}
                </div>
              </section>
            ` : ''}

            <div class="flex flex-wrap items-center justify-between gap-3 pt-5 border-t border-sand">
              <button
                type="button"
                onclick="setBdsmStep('discuss_reveal')"
                class="tactile-btn px-4 py-2.5 rounded-xl text-xs sm:text-sm font-medium bg-paper hover:bg-paperAlt text-ink border border-sand"
              >
                Retour à « À discuter »
              </button>

              <button
                type="button"
                onclick="proceedFromAgreementsReveal()"
                class="tactile-btn w-full sm:w-auto px-6 py-3.5 rounded-xl text-sm font-semibold bg-piment hover:bg-pimentHover text-paper"
              >
                ${bothPunish ? 'Étape 6 : Choix de la punition' : 'Étape 7 : Safeword'}
              </button>
            </div>
          </main>
        `;
      }

      if (b.step === 'punish') {
        const mutualSwitch = b.globals.dominateur.switchRole && b.globals.domine.switchRole;
        const subEligiblePunishments = getEligiblePunishmentsForReceiver('domine');
        const domEligiblePunishments = getEligiblePunishmentsForReceiver('dominateur');

        return `
          <main class="flex-1 max-w-2xl w-full mx-auto px-5 sm:px-8 py-10 animate-view">
            ${renderBdsmNav('punish')}

            <section class="liquid-surface rounded-2xl bg-paper border border-sand p-7 sm:p-9 shadow-editorial">
              <span class="text-xs font-bold uppercase tracking-[0.16em] text-piment">Étape 6 • Choix de la punition</span>
              <h1 class="font-serif text-3xl sm:text-4xl font-semibold text-ink mt-1 mb-2">
                Sélection de la punition
              </h1>
              <p class="text-sm text-inkSoft leading-relaxed mb-6">
                Sélectionnez une punition uniquement parmi vos <strong class="text-ink">accords communs</strong> autorisés (Pied, Pincement, Griffures, Fessées, Morsure, Fouet, Bifle, Insulte, Crachat, Gifle). ${
                  mutualSwitch
                    ? `Switch étant validé des deux côtés, vous pouvez aussi définir une punition pour le dominant (${escapeHtml(domShort)}).`
                    : `Sans Switch validé par les deux, seule la punition du dominé (${escapeHtml(subShort)}) est demandée.`
                }
              </p>

              <div class="space-y-5 mb-7">
                <div>
                  <label for="subPunishSelect" class="block text-xs font-bold uppercase tracking-wider text-piment mb-2">
                    Punition pour le dominé (${escapeHtml(subShort)})
                  </label>
                  ${subEligiblePunishments.length > 0 ? `
                    <select
                      id="subPunishSelect"
                      onchange="updatePunishmentChoice('subPunishment', this.value)"
                      class="w-full px-4 py-3 rounded-xl bg-linen border border-sand text-sm text-ink focus:outline-none focus:border-piment"
                    >
                      ${subEligiblePunishments.map((it) => `
                        <option value="${escapeHtml(it.label)}" ${b.punishments.subPunishment === it.label ? 'selected' : ''}>
                          ${escapeHtml(it.label)} (${escapeHtml(it.categoryLabel)})
                        </option>
                      `).join('')}
                    </select>
                  ` : `
                    <p class="text-xs text-inkMuted bg-linen/80 border border-sand rounded-xl p-3.5">
                      Aucune punition éligible dans les accords communs de ${escapeHtml(domShort)} → ${escapeHtml(subShort)}.
                    </p>
                  `}
                </div>

                ${mutualSwitch ? `
                  <div>
                    <label for="domPunishSelect" class="block text-xs font-bold uppercase tracking-wider text-brass mb-2">
                      Punition pour le dominant (${escapeHtml(domShort)}) — Switch validé des deux côtés
                    </label>
                    ${domEligiblePunishments.length > 0 ? `
                      <select
                        id="domPunishSelect"
                        onchange="updatePunishmentChoice('domPunishment', this.value)"
                        class="w-full px-4 py-3 rounded-xl bg-linen border border-sand text-sm text-ink focus:outline-none focus:border-brass"
                      >
                        ${domEligiblePunishments.map((it) => `
                          <option value="${escapeHtml(it.label)}" ${b.punishments.domPunishment === it.label ? 'selected' : ''}>
                            ${escapeHtml(it.label)} (${escapeHtml(it.categoryLabel)})
                          </option>
                        `).join('')}
                      </select>
                    ` : `
                      <p class="text-xs text-inkMuted bg-linen/80 border border-sand rounded-xl p-3.5">
                        Aucune punition éligible dans les accords communs de ${escapeHtml(subShort)} → ${escapeHtml(domShort)}.
                      </p>
                    `}
                  </div>
                ` : ''}
              </div>

              <div class="flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onclick="setBdsmStep('agreements_reveal')"
                  class="tactile-btn px-4 py-2.5 rounded-xl text-sm font-medium bg-linen hover:bg-paperAlt text-ink border border-sand"
                >
                  Retour aux accords
                </button>
                <button
                  type="button"
                  onclick="setBdsmStep('safeword')"
                  class="tactile-btn px-6 py-3 rounded-xl text-sm font-semibold bg-piment hover:bg-pimentHover text-paper"
                >
                  Étape 7 : Safeword
                </button>
              </div>
            </section>
          </main>
        `;
      }

      if (b.step === 'safeword') {
        return `
          <main class="flex-1 max-w-xl w-full mx-auto px-5 sm:px-8 py-12 animate-view">
            ${renderBdsmNav('safeword')}

            <section class="liquid-surface rounded-2xl bg-paper border border-sand p-7 sm:p-10 shadow-editorial">
              <span class="text-xs font-bold uppercase tracking-[0.16em] text-piment">Étape 7 • Safeword</span>
              <h1 class="font-serif text-3xl sm:text-4xl font-semibold text-ink mt-1 mb-2">
                Votre safeword commun
              </h1>
              <p class="text-sm text-inkSoft leading-relaxed mb-6">
                Définissez votre mot ou signal de sécurité avant la dernière étape (échauffement optionnel puis début de session).
              </p>

              <div class="mb-6">
                <label for="safewordInput" class="block text-xs font-semibold uppercase tracking-wider text-inkSoft mb-2">
                  Safeword commun (obligatoire)
                </label>
                <input
                  id="safewordInput"
                  type="text"
                  value="${escapeHtml(b.safeword)}"
                  oninput="updateBdsmSafeword(this.value)"
                  placeholder="Ex. : Feu rouge, Halte, Cerise…"
                  class="w-full px-4 py-3 rounded-xl bg-linen border ${
                    b.errorMessage ? 'border-piment' : 'border-sand'
                  } text-base font-medium text-ink placeholder-inkMuted focus:outline-none focus:border-piment"
                />
                ${b.errorMessage ? `
                  <p role="alert" class="mt-2 text-xs font-semibold text-piment">
                    ${escapeHtml(b.errorMessage)}
                  </p>
                ` : ''}
              </div>

              <div class="rounded-xl bg-linen/80 border border-sand p-4 mb-7 flex items-center justify-between gap-4">
                <div>
                  <span class="block text-sm font-bold text-ink">Étape 8 : Échauffement tour par tour (optionnel)</span>
                  <span class="block text-xs text-inkSoft mt-0.5">
                    3 paliers successifs (Vanille → Soft → Chaud), un palier à la fois avant le début de la session.
                  </span>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked="${b.warmup.enabled ? 'true' : 'false'}"
                  onclick="toggleWarmupEnabled()"
                  class="tactile-btn px-3.5 py-1.5 rounded-full text-xs font-bold border ${
                    b.warmup.enabled
                      ? 'bg-piment text-paper border-piment'
                      : 'bg-paper text-inkSoft border-sand'
                  }"
                >
                  ${b.warmup.enabled ? 'Activé' : 'Passer'}
                </button>
              </div>

              <div class="flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onclick="setBdsmStep('agreements_reveal')"
                  class="tactile-btn px-4 py-2.5 rounded-xl text-sm font-medium bg-linen hover:bg-paperAlt text-ink border border-sand"
                >
                  Retour
                </button>
                <button
                  type="button"
                  onclick="validateSafewordAndWarmupChoice()"
                  class="tactile-btn px-6 py-3 rounded-xl text-sm font-semibold bg-piment hover:bg-pimentHover text-paper"
                >
                  ${b.warmup.enabled ? 'Étape 8 : Échauffement tour par tour' : 'Passer l’échauffement'}
                </button>
              </div>
            </section>
          </main>
        `;
      }

      if (b.step === 'warmup') {
        const tiersMeta = [
          { key: 'vanille', index: 0, badge: 'Palier 1 sur 3 • Vanille', title: 'Échauffement Vanille', subtitle: 'Premier palier en douceur' },
          { key: 'soft', index: 1, badge: 'Palier 2 sur 3 • Soft', title: 'Échauffement Soft', subtitle: 'Deuxième palier progressif' },
          { key: 'chaud', index: 2, badge: 'Palier 3 sur 3 • Chaud', title: 'Échauffement Chaud', subtitle: 'Dernier palier avant le début de la session' }
        ];

        const currentMeta = tiersMeta[b.warmup.currentTierIndex] || tiersMeta[0];
        if (!b.warmup.picks[currentMeta.key]) {
          drawWarmupTier(currentMeta.index);
        }
        const pick = b.warmup.picks[currentMeta.key] || { label: '', actor: domShort, target: subShort, poolCount: 0 };
        const isLastTier = currentMeta.index === 2;

        return `
          <main class="flex-1 max-w-2xl w-full mx-auto px-5 sm:px-8 py-8 sm:py-12 animate-view">
            ${renderBdsmNav('warmup')}

            <div class="flex items-center justify-between gap-2 mb-6">
              ${tiersMeta.map((tm) => {
                const active = tm.index === currentMeta.index;
                const done = tm.index < currentMeta.index;
                return `
                  <div class="flex-1 rounded-xl px-3 py-2 border text-center text-xs font-bold ${
                    active
                      ? 'bg-piment text-paper border-piment'
                      : done
                        ? 'bg-brassSoft text-brass border-brass/30'
                        : 'bg-paper text-inkMuted border-sand'
                  }">
                    ${tm.key.charAt(0).toUpperCase() + tm.key.slice(1)}
                  </div>
                `;
              }).join('')}
            </div>

            <section class="liquid-surface animate-card rounded-2xl bg-paper border border-brass/50 p-7 sm:p-10 text-center shadow-cardFlip mb-7">
              <span class="inline-block text-xs font-bold uppercase tracking-[0.16em] text-brass mb-2">
                ${escapeHtml(currentMeta.badge)}
              </span>
              <h1 class="font-serif text-3xl sm:text-4xl font-semibold text-ink mb-1">
                ${escapeHtml(currentMeta.title)}
              </h1>
              <p class="text-xs sm:text-sm text-inkSoft mb-6">
                ${escapeHtml(currentMeta.subtitle)}
              </p>

              <div class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-pimentSoft text-piment border border-piment/25 text-xs sm:text-sm font-bold mb-7">
                <span>${escapeHtml(pick.actor)}</span>
                <span>→</span>
                <span>${escapeHtml(pick.target)}</span>
              </div>

              ${pick.label ? `
                <blockquote class="font-serif text-2xl sm:text-3xl md:text-[2.2rem] font-semibold text-ink leading-snug mb-8">
                  « ${escapeHtml(pick.label)} »
                </blockquote>
              ` : `
                <div class="rounded-xl bg-linen/80 border border-sand p-6 mb-8">
                  <p class="text-sm text-inkSoft">
                    Aucune action validée en commun sur le palier <strong>${escapeHtml(currentMeta.key)}</strong> pour <strong>${escapeHtml(pick.actor)} → ${escapeHtml(pick.target)}</strong>.
                  </p>
                </div>
              `}

              <div class="flex flex-col sm:flex-row items-center justify-center gap-3">
                ${pick.poolCount > 1 ? `
                  <button
                    type="button"
                    onclick="rerollCurrentWarmupTier()"
                    class="tactile-btn w-full sm:w-auto px-4 py-3 rounded-xl text-xs sm:text-sm font-semibold bg-linen hover:bg-paperAlt text-ink border border-sand"
                  >
                    Tirer une autre action (${currentMeta.key})
                  </button>
                ` : ''}

                <button
                  type="button"
                  onclick="nextWarmupTierOrStartSession()"
                  class="tactile-btn w-full sm:w-auto px-6 py-3 rounded-xl text-sm font-semibold bg-piment hover:bg-pimentHover text-paper"
                >
                  ${isLastTier ? 'Terminer l’échauffement & démarrer la session' : 'Palier suivant'}
                </button>
              </div>
            </section>

            <div class="flex flex-wrap items-center justify-between gap-3 text-xs text-inkSoft">
              <button
                type="button"
                onclick="prevWarmupTierOrSafeword()"
                class="tactile-btn px-4 py-2 rounded-xl bg-paper hover:bg-paperAlt text-ink border border-sand font-semibold"
              >
                ${currentMeta.index === 0 ? 'Retour au safeword' : 'Palier précédent'}
              </button>
              <button
                type="button"
                onclick="skipWarmupToSession()"
                class="tactile-btn px-3.5 py-2 rounded-xl bg-linen hover:bg-paperAlt text-inkSoft hover:text-ink border border-sand font-medium"
              >
                Passer l’échauffement
              </button>
              <span>Safeword : <strong class="text-ink">${escapeHtml(safewordDisplay)}</strong></span>
            </div>
          </main>
        `;
      }

      return `
        <main class="flex-1 max-w-2xl w-full mx-auto px-5 sm:px-8 py-10 animate-view">
          ${renderBdsmNav('session_ready')}

          <section class="liquid-surface rounded-2xl bg-paper border border-piment/40 p-8 sm:p-11 text-center shadow-editorial">
            <span class="text-xs font-bold uppercase tracking-[0.16em] text-piment block mb-2">
              Début de la session
            </span>
            <h1 class="font-serif text-3xl sm:text-4xl font-semibold text-ink mb-3">
              La session est lancée.
            </h1>
            <p class="text-sm text-inkSoft leading-relaxed max-w-md mx-auto mb-7">
              ${b.warmup.enabled
                ? 'L’échauffement progressif tour par tour (Vanille → Soft → Chaud) est terminé.'
                : 'L’échauffement optionnel a été ignoré.'
              } Votre safeword commun reste <strong class="text-piment">« ${escapeHtml(safewordDisplay)} »</strong>.
            </p>

            ${b.warmup.enabled ? `
              <div class="rounded-xl bg-linen/80 border border-sand p-4 mb-8 text-left space-y-2 text-xs sm:text-sm">
                ${['vanille', 'soft', 'chaud'].map((tKey, i) => {
                  const item = b.warmup.picks[tKey];
                  const tLabel = tKey.charAt(0).toUpperCase() + tKey.slice(1);
                  return `
                    <div class="flex items-baseline justify-between gap-3">
                      <span class="font-bold text-ink">${i + 1}. ${tLabel} (${escapeHtml(item?.actor || domShort)} → ${escapeHtml(item?.target || subShort)})</span>
                      <span class="text-inkSoft text-right">${item?.label ? escapeHtml(item.label) : '—'}</span>
                    </div>
                  `;
                }).join('')}
              </div>
            ` : ''}

            <div class="flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onclick="startWarmupTour()"
                class="tactile-btn px-4 py-3 rounded-xl text-xs sm:text-sm font-semibold bg-linen hover:bg-paperAlt text-ink border border-sand"
              >
                ${b.warmup.enabled ? 'Refaire l’échauffement' : 'Lancer l’échauffement'}
              </button>
              <button
                type="button"
                onclick="lockRevealScreen(); setBdsmStep('agreements_reveal');"
                class="tactile-btn px-6 py-3.5 rounded-xl text-sm font-semibold bg-piment hover:bg-pimentHover text-paper"
              >
                Verrouiller &amp; voir les accords
              </button>
              <button
                type="button"
                onclick="confirmWipeBdsmAndGoHub()"
                class="tactile-btn px-4 py-3 rounded-xl text-xs sm:text-sm font-semibold bg-paper hover:bg-paperAlt text-ink border border-sand"
              >
                Effacer la session
              </button>
            </div>
          </section>
        </main>
      `;
    }

    // =========================================================================
    // 15. RENDU PRINCIPAL & GESTIONNAIRES D'ÉVÉNEMENTS
    // =========================================================================

    function renderApp() {
      try {
        const container = document.getElementById('app');
        if (!container) return;

        let subtitle = '';
        let viewHtml = '';

        switch (state.currentView) {
          case 'cards':
            subtitle = 'Cartes';
            viewHtml = renderCards();
            break;
          case 'roleplay':
            subtitle = 'Roleplay';
            viewHtml = renderRoleplay();
            break;
          case 'bdsm':
            subtitle = 'BDSM';
            viewHtml = renderBdsm();
            break;
          case 'hub':
          default:
            subtitle = '';
            viewHtml = renderHub();
            break;
        }

        container.innerHTML = `${renderHeader(subtitle)}${viewHtml}${renderPracticeInfoModal()}${renderConfirmModal()}${renderToast()}`;
      } catch (e) {
        // Repli minimal
      }
    }

    function setRoleplayStep(step) {
      triggerHaptic(12);
      state.roleplay.step = step;
      renderApp();
      try {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } catch (e) {
        // Ignorer
      }
    }

    function setBdsmRoleGender(role, gender) {
      triggerHaptic(12);
      const opposite = gender === 'Lui' ? 'Elle' : 'Lui';
      if (role === 'dominateur') {
        state.bdsm.roles.dominateurGender = gender;
        state.bdsm.roles.domineGender = opposite;
      } else {
        state.bdsm.roles.domineGender = gender;
        state.bdsm.roles.dominateurGender = opposite;
      }
      renderApp();
    }

    function swapBdsmRoles() {
      triggerHaptic(12);
      const r = state.bdsm.roles;
      const oldDomGender = r.dominateurGender;
      const oldDomName = r.dominateurName;
      r.dominateurGender = r.domineGender;
      r.dominateurName = r.domineName;
      r.domineGender = oldDomGender;
      r.domineName = oldDomName;
      renderApp();
    }

    function updateBdsmName(key, value) {
      state.bdsm.roles[key] = value;
    }

    function scrollToBdsmCategory(elementId) {
      triggerHaptic(10);
      try {
        const el = document.getElementById(elementId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      } catch (e) {
        // Ignorer
      }
    }

    function toggleBdsmPracticeChoice(actorKey, practiceId, choiceKey) {
      const currentList = getPracticeChoices(state.bdsm.selections[actorKey], practiceId);
      const exists = currentList.includes(choiceKey);
      let nextList;

      if (exists) {
        nextList = currentList.filter((c) => c !== choiceKey);
      } else if (choiceKey === 'non') {
        nextList = ['non'];
      } else {
        nextList = [...currentList.filter((c) => c !== 'non'), choiceKey];
      }

      state.bdsm.selections[actorKey][practiceId] = {
        choices: nextList
      };
      renderApp();
    }

    function toggleBdsmGlobalOption(actorKey, optionKey, isChecked) {
      triggerHaptic(10);
      state.bdsm.globals[actorKey][optionKey] = Boolean(isChecked);
      renderApp();
    }

    function toggleWarmupEnabled() {
      triggerHaptic(10);
      state.bdsm.warmup.enabled = !state.bdsm.warmup.enabled;
      renderApp();
    }

    function setBdsmStep(step) {
      triggerHaptic(12);

      const progress = state.bdsm.progress || {};
      const currentStep = state.bdsm.step;

      if (currentStep === 'dom_turn' && step === 'dom_options') {
        progress.domTurn = true;
      }
      if (currentStep === 'dom_options' && step === 'handoff') {
        progress.domOptions = true;
      }
      if (currentStep === 'handoff' && step === 'sub_turn') {
        progress.handoff = true;
      }
      if (currentStep === 'sub_turn' && step === 'sub_options') {
        progress.subTurn = true;
      }

      const prerequisites = {
        dom_turn: true,
        dom_options: progress.domTurn,
        handoff: progress.domOptions,
        sub_turn: progress.handoff,
        sub_options: progress.subTurn,
        options_summary: progress.subOptions,
        discuss_reveal: progress.optionsSummary,
        agreements_reveal: progress.discuss,
        punish: progress.agreements,
        safeword: progress.agreements,
        warmup: progress.safeword,
        session_ready: progress.safeword
      };

      if (Object.prototype.hasOwnProperty.call(prerequisites, step) && !prerequisites[step]) {
        showToast('Terminez l’étape précédente avant de continuer.');
        return;
      }

      state.bdsm.errorMessage = '';
      state.bdsm.step = step;
      renderApp();
      try {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } catch (e) {
        // Ignorer
      }
    }

    function updateBdsmSafeword(val) {
      state.bdsm.safeword = val;
      if (state.bdsm.errorMessage && val.trim()) {
        state.bdsm.errorMessage = '';
        renderApp();
      }
    }

    function validateSafewordAndWarmupChoice() {
      if (!state.bdsm.safeword.trim()) {
        triggerHaptic(18);
        state.bdsm.errorMessage = 'Veuillez saisir un safeword commun avant de continuer.';
        renderApp();
        const el = document.getElementById('safewordInput');
        if (el && el.focus) el.focus();
        return;
      }
      triggerHaptic(15);
      state.bdsm.errorMessage = '';
      state.bdsm.progress.safeword = true;
      state.bdsm.screenLocked = false;
      state.bdsm.unlockTapCount = 0;

      if (state.bdsm.warmup.enabled) {
        startWarmupTour();
      } else {
        state.bdsm.step = 'session_ready';
        renderApp();
        try {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (e) {
          // Ignorer
        }
      }
    }

    function bootstrapApplication() {
      try {
        initWelcomeInteractions();
      } catch (e) {
        // Ignorer
      }
      try {
        renderApp();
      } catch (e) {
        // Ignorer
      }
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', bootstrapApplication);
    } else {
      bootstrapApplication();
    }
