(() => {
  const pageId = document.body.dataset.artistId;
  const $ = (selector) => document.querySelector(selector);
  const escapeHtml = (value) => String(value).replace(/[&<>'"]/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  }[char]));

  const displayNames = {
    'Դու եկար': 'Դու եկար',
    'Ты пришёл': 'Ты пришёл',
    'You Came': 'You Came',
    'Сոնет  13': 'Սոնետ 13',
    'Սոնետ  14': 'Սոնետ 14',
    'Սոնետ  15': 'Սոնետ 15',
    'Սոնետ  16': 'Սոնետ 16',
    'Սոնետ  17': 'Սոնետ 17',
    'Սոնետ  18': 'Սոնետ 18',
    'Սոնետ  19': 'Սոնետ 19',
    'Սոնետ  20': 'Սոնետ 20',
    'Սոնետ  21': 'Սոնետ 21',
    'Սոնետ  22': 'Սոնետ 22',
    'Սոնետ  121': 'Սոնետ 121',
  };

  const titleFor = (song) => displayNames[song] || song.replaceAll('_', ' ');
  const audioPath = (artist, song) => `audio/${artist.id}/featured/${encodeURIComponent(song)}.mp3`;

  async function init() {
    let data;
    try {
      const response = await fetch('artist-pages-data.json', { cache: 'no-store' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      data = await response.json();
    } catch (error) {
      $('#track-grid').innerHTML = '<div class="empty">Երգերի ցանկը չհաջողվեց բեռնել։ Փորձեք թարմացնել էջը։</div>';
      return;
    }

    const artist = data[pageId];
    if (!artist) return;
    document.title = `${artist.name} — Imastun Studio`;
    $('#artist-name').textContent = artist.name;
    $('#artist-role').textContent = artist.role;
    $('#artist-description').textContent = artist.description;
    $('#artist-cover').src = artist.cover;
    $('#artist-cover').alt = artist.name;
    $('#track-count').textContent = artist.songs.length;
    $('#archive-count').textContent = `${artist.songs.length} tracks`;

    const durationValue = $('#duration-value');
    const formatDuration = (seconds) => {
      const minutes = Math.round(seconds / 60);
      const hours = Math.floor(minutes / 60);
      const remainder = minutes % 60;
      return hours ? `${hours}ժ ${remainder}ր` : `${remainder}ր`;
    };
    Promise.all(artist.songs.map((song) => new Promise((resolve) => {
      const probe = new Audio();
      probe.preload = 'metadata';
      probe.addEventListener('loadedmetadata', () => resolve(Number.isFinite(probe.duration) ? probe.duration : 0), { once: true });
      probe.addEventListener('error', () => resolve(0), { once: true });
      probe.src = audioPath(artist, song);
    }))).then((durations) => {
      const total = durations.reduce((sum, value) => sum + value, 0);
      if (durationValue) durationValue.textContent = total ? formatDuration(total) : '—';
    });

    const copyDonate = $('#copy-donate');
    const copyStatus = $('#copy-status');
    copyDonate.addEventListener('click', async () => {
      const cardNumber = '4578 8900 8055 1169';
      try {
        await navigator.clipboard.writeText(cardNumber);
      } catch (error) {
        const helper = document.createElement('textarea');
        helper.value = cardNumber;
        helper.style.position = 'fixed';
        helper.style.opacity = '0';
        document.body.appendChild(helper);
        helper.select();
        document.execCommand('copy');
        helper.remove();
      }
      copyStatus.textContent = 'Պատճենվեց ✓';
      setTimeout(() => { copyStatus.textContent = ''; }, 2400);
    });

    let currentIndex = -1;
    const audio = $('#audio');
    const nowTitle = $('#now-title');
    const trackGrid = $('#track-grid');
    const search = $('#track-search');

    const render = (query = '') => {
      const normalized = query.trim().toLocaleLowerCase();
      const visible = artist.songs.map((song, index) => ({ song, index })).filter(({ song }) => {
        const title = titleFor(song).toLocaleLowerCase();
        return !normalized || title.includes(normalized) || song.toLocaleLowerCase().includes(normalized);
      });
      if (!visible.length) {
        trackGrid.innerHTML = '<div class="empty">Ոչ մի երգ չգտնվեց։</div>';
        return;
      }
      trackGrid.innerHTML = visible.map(({ song, index }) => `
        <div class="track${index === currentIndex ? ' active' : ''}" data-index="${index}">
          <span class="track-number">${String(index + 1).padStart(2, '0')}</span>
          <div>
            <div class="track-title">${escapeHtml(titleFor(song))}</div>
            <div class="track-subtitle">${escapeHtml(artist.name)} · MP3</div>
          </div>
          <button class="play-btn" type="button" aria-label="Նվագարկել ${escapeHtml(titleFor(song))}">▶</button>
        </div>`).join('');
      trackGrid.querySelectorAll('.track').forEach((row) => {
        row.addEventListener('click', () => play(Number(row.dataset.index)));
      });
    };

    const play = (index) => {
      if (index < 0 || index >= artist.songs.length) return;
      currentIndex = index;
      const song = artist.songs[index];
      audio.src = audioPath(artist, song);
      nowTitle.textContent = titleFor(song);
      audio.play().catch(() => {});
      render(search.value);
      document.querySelector('.archive').scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    $('#previous').addEventListener('click', () => play(currentIndex <= 0 ? artist.songs.length - 1 : currentIndex - 1));
    $('#next').addEventListener('click', () => play(currentIndex >= artist.songs.length - 1 ? 0 : currentIndex + 1));
    audio.addEventListener('ended', () => $('#next').click());
    search.addEventListener('input', () => render(search.value));
    render();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
