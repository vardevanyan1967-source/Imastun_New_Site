(() => {
  'use strict';

  function installPlayerFixes() {
    if (typeof playlist === 'undefined' || !Array.isArray(playlist)) return;

    // Do not reorder the master playlist. Instead, derive next/previous directly
    // from the track rows as they are shown inside the current artist list.
    function visibleSequenceFor(idx) {
      const row = document.querySelector(`.track-item[data-pidx="${idx}"]`);
      if (!row) return [];
      const list = row.closest('.track-list');
      if (!list) return [];
      return Array.from(list.querySelectorAll('.track-item[data-pidx]'))
        .map(el => Number.parseInt(el.dataset.pidx, 10))
        .filter(Number.isInteger);
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

    // Disable the old crossfade path because it assumes currentIdx + 1.
    // Auto-advance is handled below from the visible list order.
    try {
      startCrossfade = function() {};
    } catch (e) {}

    const stopAndPlayAdjacent = direction => event => {
      const nextIdx = adjacentVisibleIndex(direction);
      if (nextIdx < 0 || typeof playTrack !== 'function') return;
      event.preventDefault();
      event.stopImmediatePropagation();
      playTrack(nextIdx);
    };

    if (typeof gpNext !== 'undefined' && gpNext) {
      gpNext.addEventListener('click', stopAndPlayAdjacent(1), true);
    }
    if (typeof gpPrev !== 'undefined' && gpPrev) {
      gpPrev.addEventListener('click', stopAndPlayAdjacent(-1), true);
    }

    if (typeof engines !== 'undefined' && Array.isArray(engines)) {
      engines.forEach(eng => {
        // Show duration as soon as metadata is available, before playback moves.
        const updateDuration = () => {
          if (typeof active !== 'function' || eng !== active()) return;
          if (eng.duration && Number.isFinite(eng.duration) && typeof fmtTime === 'function' && typeof gpDur !== 'undefined') {
            gpDur.textContent = fmtTime(eng.duration);
          }
        };
        eng.addEventListener('loadedmetadata', updateDuration);
        eng.addEventListener('durationchange', updateDuration);

        // Capture ended before the original handler and follow the visible order.
        eng.addEventListener('ended', event => {
          if (typeof active !== 'function' || eng !== active()) return;
          const nextIdx = adjacentVisibleIndex(1);
          if (nextIdx < 0 || typeof playTrack !== 'function') return;
          event.stopImmediatePropagation();
          playTrack(nextIdx);
        }, true);
      });
    }

    // Android/mobile: keep the row Play button and global player visible.
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
      }
      #global-player.visible {
        display: flex !important;
        visibility: visible !important;
        opacity: 1 !important;
        transform: translateY(0) !important;
      }
      @media (max-width: 700px) {
        .track-item {
          grid-template-columns: 24px minmax(0, 1fr) auto auto auto !important;
          overflow: visible !important;
        }
        .track-item > .play-count-badge,
        .track-item > .new-badge {
          display: none !important;
        }
        .track-item > .track-fav-btn { grid-column: 3; }
        .track-item > .track-share-btn { grid-column: 4; }
        .track-item > .track-play-btn { grid-column: 5; }
        #global-player.visible {
          position: fixed !important;
          left: 0 !important;
          right: 0 !important;
          bottom: 0 !important;
          z-index: 999 !important;
        }
      }
    `;
    if (!document.getElementById(style.id)) document.head.appendChild(style);

    // On touch, force the global player visible immediately; playTrack/loadTrack
    // will fill in the actual song information and audio source.
    document.addEventListener('touchstart', event => {
      const row = event.target.closest && event.target.closest('.track-item[data-pidx]');
      if (!row) return;
      if (typeof gpEl !== 'undefined' && gpEl) gpEl.classList.add('visible');
    }, { passive: true, capture: true });
  }

  requestAnimationFrame(() => requestAnimationFrame(installPlayerFixes));
})();
