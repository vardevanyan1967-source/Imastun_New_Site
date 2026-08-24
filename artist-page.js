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
    'Սոնետ  13': 'Սոնետ 13',
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

  const titleFor = (artist, song) => artist.labels?.[song] || displayNames[song] || song.replaceAll('_', ' ');
  const AUDIO_BASE_URL = 'https://pub-2d663d6d59994b7fa7390c9851966548.r2.dev/audio';
  const audioPath = (artist, song) => `${AUDIO_BASE_URL}/${encodeURIComponent(artist.id)}/featured/${encodeURIComponent(song)}.mp3`;

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
    document.querySelectorAll('.mobile-track-count').forEach((node) => { node.textContent = artist.songs.length; });
    $('#archive-count').textContent = `${artist.songs.length} tracks`;

    const menuToggle = $('#menu-toggle');
    const mobileMenu = $('#mobile-menu');
    menuToggle.addEventListener('click', () => {
      const isOpen = mobileMenu.hasAttribute('hidden');
      if (isOpen) mobileMenu.removeAttribute('hidden');
      else mobileMenu.setAttribute('hidden', '');
      menuToggle.setAttribute('aria-expanded', String(isOpen));
    });
    mobileMenu.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => {
      mobileMenu.setAttribute('hidden', '');
      menuToggle.setAttribute('aria-expanded', 'false');
    }));

    const themeToggle = $('#theme-toggle');
    if (localStorage.getItem('imastun-theme') === 'light') document.body.classList.add('light-mode');
    themeToggle.addEventListener('click', () => {
      document.body.classList.toggle('light-mode');
      localStorage.setItem('imastun-theme', document.body.classList.contains('light-mode') ? 'light' : 'dark');
    });

    const savedLanguage = localStorage.getItem('imastun-language') || 'hy';
    document.documentElement.lang = savedLanguage;
    document.querySelectorAll('.language-btn').forEach((button) => {
      button.classList.toggle('active', button.dataset.lang === savedLanguage);
      button.addEventListener('click', () => {
        document.documentElement.lang = button.dataset.lang;
        localStorage.setItem('imastun-language', button.dataset.lang);
        document.querySelectorAll('.language-btn').forEach((item) => item.classList.toggle('active', item === button));
      });
    });

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
      const formattedDuration = total ? formatDuration(total) : '—';
      if (durationValue) durationValue.textContent = formattedDuration;
      document.querySelectorAll('.mobile-duration-stat').forEach((node) => { node.textContent = formattedDuration; });
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

    const favoritesKey = `imastun_${artist.id}_favorites`;
    const getFavorites = () => {
      try { return JSON.parse(localStorage.getItem(favoritesKey) || '[]'); } catch (error) { return []; }
    };
    const saveFavorites = (values) => localStorage.setItem(favoritesKey, JSON.stringify(values));
    const isFavorite = (song) => getFavorites().includes(song);
    const toggleFavorite = (song) => {
      const values = getFavorites();
      const next = values.includes(song) ? values.filter((value) => value !== song) : [...values, song];
      saveFavorites(next);
      return next.includes(song);
    };

    let mode = 'all';
    let currentIndex = -1;
    const audio = $('#audio');
    const nowTitle = $('#now-title');
    const trackGrid = $('#track-grid');
    const search = $('#track-search');
    const shareStatus = $('#share-status');

    const updateTabs = () => {
      document.querySelectorAll('.archive-tab').forEach((tab) => tab.classList.toggle('active', tab.dataset.mode === mode));
    };

    const shareSong = async (song) => {
      const label = titleFor(artist, song);
      const shareUrl = `https://imastun.org${location.pathname}?play=${encodeURIComponent(song)}`;
      const shareData = { title: `${label} — ${artist.name}`, text: `${label} — ${artist.name}\nListen on Imastun Studio`, url: shareUrl };
      try {
        if (navigator.share) await navigator.share(shareData);
        else await navigator.clipboard.writeText(shareUrl);
        shareStatus.textContent = navigator.share ? 'Կիսվելու պատուհանը բացվեց' : 'Հղումը պատճենվեց ✓';
      } catch (error) {
        shareStatus.textContent = '';
      }
      setTimeout(() => { shareStatus.textContent = ''; }, 2400);
    };

    const render = (query = '') => {
      const normalized = query.trim().toLocaleLowerCase();
      const candidates = mode === 'favorites' ? artist.songs.filter(isFavorite) : artist.songs;
      const visible = candidates.map((song) => ({ song, index: artist.songs.indexOf(song) })).filter(({ song }) => {
        const title = titleFor(artist, song).toLocaleLowerCase();
        return !normalized || title.includes(normalized) || song.toLocaleLowerCase().includes(normalized);
      });
      if (!visible.length) {
        trackGrid.innerHTML = `<div class="empty">${mode === 'favorites' && !normalized ? 'Դեռ սիրած երգ չկա — սեղմիր ♡' : 'Ոչ մի երգ չգտնվեց։'}</div>`;
        return;
      }
      trackGrid.innerHTML = visible.map(({ song, index }) => `
        <div class="track${index === currentIndex ? ' active' : ''}" data-index="${index}">
          <span class="track-number">${String(index + 1).padStart(2, '0')}</span>
          <div>
            <div class="track-title">${escapeHtml(titleFor(artist, song))}</div>
            <div class="track-subtitle">${escapeHtml(artist.name)} · MP3</div>
          </div>
          <div class="track-tools">
            <button class="icon-btn favorite-btn${isFavorite(song) ? ' active' : ''}" type="button" aria-label="${isFavorite(song) ? 'Հեռացնել սիրածներից' : 'Ավելացնել սիրածներին'}">${isFavorite(song) ? '♥' : '♡'}</button>
            <button class="icon-btn share-btn" type="button" aria-label="Կիսվել երգով">↗</button>
            <button class="play-btn" type="button" aria-label="Նվագարկել ${escapeHtml(titleFor(artist, song))}">▶</button>
          </div>
        </div>`).join('');
      trackGrid.querySelectorAll('.track').forEach((row) => {
        const song = artist.songs[Number(row.dataset.index)];
        row.addEventListener('click', () => play(Number(row.dataset.index)));
        row.querySelector('.favorite-btn').addEventListener('click', (event) => {
          event.stopPropagation();
          toggleFavorite(song);
          render(search.value);
        });
        row.querySelector('.share-btn').addEventListener('click', (event) => {
          event.stopPropagation();
          shareSong(song);
        });
      });
    };

    const play = (index) => {
      if (index < 0 || index >= artist.songs.length) return;
      currentIndex = index;
      const song = artist.songs[index];
      audio.src = audioPath(artist, song);
      nowTitle.textContent = titleFor(artist, song);
      audio.play().catch(() => {});
      render(search.value);
      document.querySelector('.archive').scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    document.querySelectorAll('.archive-tab').forEach((tab) => tab.addEventListener('click', () => {
      mode = tab.dataset.mode;
      updateTabs();
      render(search.value);
    }));
    $('#previous').addEventListener('click', () => play(currentIndex <= 0 ? artist.songs.length - 1 : currentIndex - 1));
    $('#next').addEventListener('click', () => play(currentIndex >= artist.songs.length - 1 ? 0 : currentIndex + 1));
    audio.addEventListener('ended', () => $('#next').click());
    search.addEventListener('input', () => render(search.value));
    updateTabs();
    render();

    const requestedSong = new URLSearchParams(location.search).get('play');
    const requestedIndex = artist.songs.indexOf(requestedSong);
    if (requestedIndex >= 0) setTimeout(() => play(requestedIndex), 500);
  }

  document.addEventListener('DOMContentLoaded', init);
})();
