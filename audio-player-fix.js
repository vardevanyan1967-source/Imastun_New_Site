(() => {
  'use strict';

  function installPlayerFixes() {
    if (typeof playlist === 'undefined' || !Array.isArray(playlist)) return;

    const trackSelector = '.track-item[data-pidx], .track-item[data-idx]';
    const rowIndex = row => {
      if (!row) return -1;
      const raw = row.dataset.pidx != null ? row.dataset.pidx : row.dataset.idx;
      const n = Number.parseInt(raw, 10);
      return Number.isInteger(n) ? n : -1;
    };

    if (typeof engines !== 'undefined' && Array.isArray(engines)) {
      engines.forEach(eng => {
        const updateDuration = () => {
          if (typeof active !== 'function' || eng !== active()) return;
          if (eng.duration && Number.isFinite(eng.duration) && typeof fmtTime === 'function' && typeof gpDur !== 'undefined') {
            gpDur.textContent = fmtTime(eng.duration);
          }
        };
        eng.addEventListener('loadedmetadata', updateDuration);
        eng.addEventListener('durationchange', updateDuration);
      });
    }

    const style = document.createElement('style');
    style.id = 'audio-player-sequence-fix-style';
    style.textContent = `
      .track-play-btn {
        display: flex !important;
        visibility: visible !important;
        opacity: 1 !important;
        min-width: 32px !important;
        width: 32px !important;
        height: 32px !important;
        position: relative !important;
        z-index: 5 !important;
        touch-action: manipulation !important;
      }
      #global-player.visible {
        display: flex !important;
        visibility: visible !important;
        opacity: 1 !important;
        transform: translate3d(0,0,0) !important;
      }
      @media (max-width: 700px) {
        .track-item { overflow: visible !important; }
        .track-item[data-pidx] {
          grid-template-columns: 24px minmax(0, 1fr) auto auto auto !important;
        }
        .track-item[data-pidx] > .play-count-badge,
        .track-item[data-pidx] > .new-badge {
          display: none !important;
        }
        .track-item[data-pidx] > .track-fav-btn { grid-column: 3; }
        .track-item[data-pidx] > .track-share-btn { grid-column: 4; }
        .track-item[data-pidx] > .track-play-btn { grid-column: 5; }
        #global-player.visible {
          position: fixed !important;
          left: 0 !important;
          right: 0 !important;
          bottom: env(safe-area-inset-bottom, 0px) !important;
          z-index: 9999 !important;
          pointer-events: auto !important;
        }
      }
    `;
    if (!document.getElementById(style.id)) document.head.appendChild(style);

    function revealPlayer(row) {
      if (typeof gpEl === 'undefined' || !gpEl) return;
      const idx = rowIndex(row);
      if (idx >= 0 && playlist[idx]) {
        const t = playlist[idx];
        if (typeof gpCover !== 'undefined' && gpCover && t.cover) gpCover.src = t.cover;
        if (typeof gpArtist !== 'undefined' && gpArtist) gpArtist.textContent = t.artistName || '';
        if (typeof gpSong !== 'undefined' && gpSong) gpSong.textContent = t.label || t.song || '';
      }
      gpEl.classList.add('visible');
      gpEl.style.display = 'flex';
      gpEl.style.visibility = 'visible';
      gpEl.style.opacity = '1';
      gpEl.style.transform = 'translate3d(0,0,0)';
      requestAnimationFrame(() => gpEl.classList.add('visible'));
    }

    function forcePlayerVisibleFromEvent(event) {
      const target = event.target;
      if (!target || !target.closest) return;
      const row = target.closest(trackSelector);
      if (row) revealPlayer(row);
    }

    // On Android, call playTrack directly from the real button gesture.
    // This avoids cases where the generated row click is delayed or swallowed.
    document.addEventListener('click', event => {
      const target = event.target;
      if (!target || !target.closest) return;
      const playBtn = target.closest('.track-play-btn');
      if (!playBtn) return;
      const row = playBtn.closest(trackSelector);
      const idx = rowIndex(row);
      if (!row || idx < 0 || typeof playTrack !== 'function') return;
      revealPlayer(row);
      event.preventDefault();
      event.stopImmediatePropagation();
      playTrack(idx);
    }, true);

    document.addEventListener('touchstart', forcePlayerVisibleFromEvent, { passive: true, capture: true });
    document.addEventListener('pointerdown', forcePlayerVisibleFromEvent, { passive: true, capture: true });
  }

  requestAnimationFrame(() => requestAnimationFrame(installPlayerFixes));
})();
