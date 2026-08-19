(() => {
  'use strict';

  function installPlayerFixes() {
    if (typeof playlist === 'undefined' || !Array.isArray(playlist)) return;

    // Keep the flat playlist in exactly the same order the user sees on screen.
    // buildTracks() sorts several artist lists for display, while the original
    // auto-advance logic uses currentIdx + 1. Reordering the mutable playlist
    // array after the DOM is built keeps every existing next/prev/ended path
    // aligned with the visible track sequence without replacing the player.
    const oldOrder = playlist.slice();
    const rows = Array.from(document.querySelectorAll('.track-item[data-pidx]'));
    if (rows.length) {
      const visibleTracks = [];
      const seen = new Set();

      rows.forEach(row => {
        const oldIdx = Number.parseInt(row.dataset.pidx, 10);
        const track = oldOrder[oldIdx];
        if (track && !seen.has(track)) {
          seen.add(track);
          visibleTracks.push(track);
        }
      });

      // Preserve any tracks that are not currently represented by a visible row.
      oldOrder.forEach(track => {
        if (!seen.has(track)) visibleTracks.push(track);
      });

      if (visibleTracks.length === playlist.length) {
        playlist.splice(0, playlist.length, ...visibleTracks);
        const newIndex = new Map(playlist.map((track, idx) => [track, idx]));
        rows.forEach(row => {
          const track = oldOrder[Number.parseInt(row.dataset.pidx, 10)];
          if (track && newIndex.has(track)) row.dataset.pidx = String(newIndex.get(track));
        });
      }
    }

    // Show duration as soon as metadata is available, even before timeupdate fires.
    const updateDuration = eng => {
      if (typeof active !== 'function' || eng !== active()) return;
      if (eng.duration && Number.isFinite(eng.duration) && typeof fmtTime === 'function' && typeof gpDur !== 'undefined') {
        gpDur.textContent = fmtTime(eng.duration);
      }
    };

    if (typeof engines !== 'undefined' && Array.isArray(engines)) {
      engines.forEach(eng => {
        eng.addEventListener('loadedmetadata', () => updateDuration(eng));
        eng.addEventListener('durationchange', () => updateDuration(eng));
      });
    }

    // Make every per-track Play control permanently visible and keep it inside
    // the mobile row instead of allowing optional badges to push it off-screen.
    const style = document.createElement('style');
    style.id = 'audio-player-sequence-fix-style';
    style.textContent = `
      .track-play-btn {
        display: flex !important;
        visibility: visible !important;
        opacity: 1 !important;
        position: relative;
        z-index: 3;
      }
      @media (max-width: 700px) {
        .track-item {
          grid-template-columns: 24px minmax(0, 1fr) auto auto auto !important;
        }
        .track-item > .play-count-badge,
        .track-item > .new-badge {
          display: none !important;
        }
        .track-item > .track-fav-btn { grid-column: 3; }
        .track-item > .track-share-btn { grid-column: 4; }
        .track-item > .track-play-btn { grid-column: 5; }
      }
    `;
    if (!document.getElementById(style.id)) document.head.appendChild(style);
  }

  // Artist rows are created inside requestAnimationFrame in index.html.
  requestAnimationFrame(() => requestAnimationFrame(installPlayerFixes));
})();
