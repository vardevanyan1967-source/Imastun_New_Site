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

    function visibleSequenceFor(idx) {
      const rows = Array.from(document.querySelectorAll(trackSelector));
      const row = rows.find(el => rowIndex(el) === idx);
      if (!row) return [];
      const list = row.closest('.track-list');
      if (!list) return [];
      return Array.from(list.querySelectorAll(trackSelector))
        .map(rowIndex)
        .filter(i => i >= 0);
    }

    function adjacentVisibleIndex(direction) {
      if (typeof currentIdx === 'undefined' || currentIdx < 0) return -1;
      const seq = visibleSequenceFor(currentIdx);
      if (!seq.length) return -1;
      const pos = seq.indexOf(currentIdx);
      if (pos < 0) return -1;
      const target = pos + direction;
      return target >= 0 && target < seq.length ? seq[target] : -1;
    }

    try { startCrossfade = function() {}; } catch (e) {}

    const stopAndPlayAdjacent = direction => event => {
      const nextIdx = adjacentVisibleIndex(direction);
      if (nextIdx < 0 || typeof playTrack !== 'function') return;
      event.preventDefault();
      event.stopImmediatePropagation();
      playTrack(nextIdx);
    };

    if (typeof gpNext !== 'undefined' && gpNext) gpNext.addEventListener('click', stopAndPlayAdjacent(1), true);
    if (typeof gpPrev !== 'undefined' && gpPrev) gpPrev.addEventListener('click', stopAndPlayAdjacent(-1), true);

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

        eng.addEventListener('ended', event => {
          if (typeof active !== 'function' || eng !== active()) return;
          const nextIdx = adjacentVisibleIndex(1);
          if (nextIdx < 0 || typeof playTrack !== 'function') return;
          event.stopImmediatePropagation();
          playTrack(nextIdx);
        }, true);
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

    // Keep this file focused on visible-sequence navigation, duration and CSS.
    // The R2 pilot uses its own native audio controls in index.html.
  }

  requestAnimationFrame(() => requestAnimationFrame(installPlayerFixes));
})();
