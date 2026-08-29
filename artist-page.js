(function () {
  "use strict";

  var artistId = document.body.getAttribute("data-artist-id");
  var artist = null;
  var TRACKS = [];
  var state = { lang: "hy", filter: "all", query: "", current: -1 };
  var audio = document.getElementById("audio");
  var player = document.getElementById("player");
  var list = document.getElementById("track-list");
  var empty = document.getElementById("empty");
  var resultCount = document.getElementById("result-count");
  var search = document.getElementById("search");
  var playButton = document.getElementById("main-play");
  var playerTitle = document.getElementById("player-title");
  var playerStatus = document.getElementById("player-status");
  var progress = document.getElementById("progress");
  var currentTime = document.getElementById("current-time");
  var duration = document.getElementById("duration");
  var toast = document.getElementById("toast");
  var toastTimer = 0;

  var I18N = {
    hy: {
      back:"Գլխավոր էջ", catalog:"Երգացանկ", search:"Որոնել երգերում…",
      all:"Բոլորը", favorites:"Սիրված երգերը", playFirst:"Նվագարկել առաջին երգը",
      songWord:"երգ", noResults:"Այս որոնմամբ երգ չի գտնվել։",
      noFavorites:"Սիրված երգ դեռ չկա։ Սեղմեք ♡՝ երգն այստեղ պահելու համար։",
      play:"Նվագարկել", pause:"Դադար", previous:"Նախորդ երգը", next:"Հաջորդ երգը",
      close:"Փակել նվագարկիչը", favorite:"Ավելացնել սիրվածներին",
      unfavorite:"Հեռացնել սիրվածներից", share:"Կիսվել", copied:"Հղումը պատճենվեց",
      copyFailed:"Չհաջողվեց պատճենել հղումը", audioError:"Ձայնային ֆայլը չբացվեց։ Փորձեք նորից։",
      tapAgain:"Սեղմեք նվագարկել ևս մեկ անգամ։", ready:"Պատրաստ է", loading:"Բեռնվում է…",
      playing:"Նվագարկվում է", paused:"Դադարեցված է", theme:"Փոխել գունային ռեժիմը",
      language:"Փոխել լեզուն", loadError:"Երգացանկը չբեռնվեց։ Թարմացրեք էջը։"
    },
    ru: {
      back:"Главная", catalog:"Песни", search:"Поиск по песням…",
      all:"Все", favorites:"Любимые песни", playFirst:"Включить первую песню",
      songWord:"песен", noResults:"По вашему запросу песен не найдено.",
      noFavorites:"Любимых песен пока нет. Нажмите ♡, чтобы сохранить песню здесь.",
      play:"Воспроизвести", pause:"Пауза", previous:"Предыдущая песня", next:"Следующая песня",
      close:"Закрыть плеер", favorite:"Добавить в избранное", unfavorite:"Убрать из избранного",
      share:"Поделиться", copied:"Ссылка скопирована", copyFailed:"Не удалось скопировать ссылку",
      audioError:"Аудиофайл не открылся. Попробуйте ещё раз.", tapAgain:"Нажмите воспроизведение ещё раз.",
      ready:"Готово", loading:"Загрузка…", playing:"Воспроизводится", paused:"На паузе",
      theme:"Сменить тему", language:"Сменить язык", loadError:"Список песен не загрузился. Обновите страницу."
    },
    en: {
      back:"Home", catalog:"Track list", search:"Search tracks…",
      all:"All", favorites:"Favorite songs", playFirst:"Play the first track",
      songWord:"tracks", noResults:"No tracks match this search.",
      noFavorites:"No favorite songs yet. Tap ♡ to save a song here.",
      play:"Play", pause:"Pause", previous:"Previous track", next:"Next track",
      close:"Close player", favorite:"Add to favorites", unfavorite:"Remove from favorites",
      share:"Share", copied:"Link copied", copyFailed:"Could not copy the link",
      audioError:"The audio file could not be opened. Please try again.", tapAgain:"Tap play once more.",
      ready:"Ready", loading:"Loading…", playing:"Playing", paused:"Paused",
      theme:"Change theme", language:"Change language", loadError:"The track list could not load. Refresh the page."
    }
  };

  function read(key, fallback) {
    try {
      var value = localStorage.getItem(key);
      return value === null ? fallback : value;
    } catch (error) {
      return fallback;
    }
  }

  function write(key, value) {
    try { localStorage.setItem(key, value); } catch (error) {}
  }

  function tr(key) {
    if (artist && key === "role") return artist.role[state.lang] || artist.role.hy;
    if (artist && key === "intro") return artist.intro[state.lang] || artist.intro.hy;
    return (I18N[state.lang] && I18N[state.lang][key]) || I18N.hy[key] || key;
  }

  function favoriteKey() {
    return artist.id + "_favorites";
  }

  function favorites() {
    if (!artist) return [];
    try {
      var value = JSON.parse(read(favoriteKey(), "[]"));
      return Array.isArray(value) ? value : [];
    } catch (error) {
      return [];
    }
  }

  function isFavorite(id) {
    return favorites().indexOf(id) >= 0;
  }

  function toggleFavorite(id) {
    var value = favorites();
    var found = value.indexOf(id);
    if (found >= 0) value.splice(found, 1);
    else value.push(id);
    write(favoriteKey(), JSON.stringify(value));
    renderTracks();
  }

  function visibleTracks() {
    var locale = state.lang === "hy" ? "hy-AM" : state.lang;
    var term = state.query.trim().toLocaleLowerCase(locale);
    return TRACKS.map(function (track, index) {
      return { track: track, index: index };
    }).filter(function (item) {
      if (state.filter === "favorites" && !isFavorite(item.track.id)) return false;
      if (!term) return true;
      return (item.track.label + " " + item.track.id + " " + (item.track.subtitle || "")).toLocaleLowerCase(locale).indexOf(term) >= 0;
    });
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, function (character) {
      return { "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[character];
    });
  }

  function renderTracks() {
    if (!artist) return;
    var items = visibleTracks();
    resultCount.textContent = items.length + " " + tr("songWord");
    empty.hidden = items.length !== 0;
    empty.textContent = state.filter === "favorites" && !state.query ? tr("noFavorites") : tr("noResults");
    list.innerHTML = items.map(function (item) {
      var favorite = isFavorite(item.track.id);
      var playing = state.current === item.index && !audio.paused;
      return '<article class="track-row' + (state.current === item.index ? ' playing' : '') + '" data-index="' + item.index + '">' +
        '<span class="track-num">' + String(item.index + 1).padStart(2, "0") + '</span>' +
        '<button class="track-main" type="button" data-action="play">' +
        '<span class="track-title">' + escapeHtml(item.track.label) + '</span>' +
        '<span class="track-sub">' + escapeHtml(item.track.subtitle || artist.name) + '</span></button>' +
        '<button class="icon-btn' + (favorite ? ' favorite' : '') + '" type="button" data-action="favorite" aria-label="' +
        escapeHtml(favorite ? tr("unfavorite") : tr("favorite")) + '">' + (favorite ? "♥" : "♡") + '</button>' +
        '<button class="icon-btn share-btn" type="button" data-action="share" aria-label="' + escapeHtml(tr("share")) + '">' +
        '<svg class="share-svg" viewBox="0 0 24 24" aria-hidden="true" focusable="false">' +
        '<circle cx="18" cy="5" r="2.2"></circle><circle cx="6" cy="12" r="2.2"></circle><circle cx="18" cy="19" r="2.2"></circle>' +
        '<path d="M8 11l7.8-4.7M8 13l7.8 4.7"></path></svg></button>' +
        '<button class="track-play" type="button" data-action="play" aria-label="' +
        escapeHtml(playing ? tr("pause") : tr("play")) + '">' + (playing ? "❚❚" : "▶") + '</button></article>';
    }).join("");
  }

  function formatTime(seconds) {
    if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
    var minutes = Math.floor(seconds / 60);
    var rest = Math.floor(seconds % 60);
    return minutes + ":" + String(rest).padStart(2, "0");
  }

  function setStatus(key) {
    playerStatus.textContent = tr(key);
  }

  function syncPlayer() {
    var active = state.current >= 0 ? TRACKS[state.current] : null;
    var playing = active && !audio.paused;
    playButton.textContent = playing ? "❚❚" : "▶";
    playButton.setAttribute("aria-label", tr(playing ? "pause" : "play"));
    document.getElementById("prev").setAttribute("aria-label", tr("previous"));
    document.getElementById("next").setAttribute("aria-label", tr("next"));
    document.getElementById("player-close").setAttribute("aria-label", tr("close"));
    renderTracks();
  }

  function showPlayer() {
    player.classList.add("visible");
    document.body.classList.add("player-open");
  }

  function loadTrack(index, autoplay) {
    if (!artist || index < 0 || index >= TRACKS.length) return;
    state.current = index;
    var track = TRACKS[index];

    showPlayer();
    playerTitle.textContent = track.label;
    document.getElementById("player-cover").src = artist.cover;
    progress.value = "0";
    currentTime.textContent = "0:00";
    duration.textContent = "0:00";
    setStatus("loading");

    if (audio.src !== track.src) {
      audio.src = track.src;
      audio.load();
    }

    write(artist.id + "_last_track", JSON.stringify({
      artistId: artist.id, song: track.id, label: track.label, artistName: artist.name
    }));

    if ("mediaSession" in navigator && "MediaMetadata" in window) {
      try {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: track.label,
          artist: artist.name,
          album: "Imastun Studio",
          artwork: [{ src:new URL(artist.cover, location.href).href, sizes:"500x500", type:"image/jpeg" }]
        });
      } catch (error) {}
    }

    syncPlayer();
    if (autoplay) {
      var promise = audio.play();
      if (promise && promise.catch) {
        promise.catch(function () {
          setStatus("ready");
          showToast(tr("tapAgain"));
          syncPlayer();
        });
      }
    }
  }

  function togglePlay(index) {
    if (state.current !== index) {
      loadTrack(index, true);
      return;
    }
    if (audio.paused) {
      var promise = audio.play();
      if (promise && promise.catch) promise.catch(function () { showToast(tr("tapAgain")); });
    } else {
      audio.pause();
    }
  }

  function move(direction) {
    if (!TRACKS.length) return;
    if (state.current < 0) {
      loadTrack(direction > 0 ? 0 : TRACKS.length - 1, true);
      return;
    }
    loadTrack((state.current + direction + TRACKS.length) % TRACKS.length, true);
  }

  function shareTrack(index) {
    var track = TRACKS[index];
    var url = new URL(artist.slug, location.href);
    url.searchParams.set("play", artist.id + "|" + track.id);
    var data = { title:track.label, text:track.label + " — " + artist.name, url:url.href };

    if (navigator.share) {
      navigator.share(data).catch(function () {});
      return;
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url.href).then(function () {
        showToast(tr("copied"));
      }).catch(function () {
        showToast(tr("copyFailed"));
      });
      return;
    }
    showToast(url.href);
  }

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.classList.remove("show"); }, 2200);
  }

  function applyLanguage(lang) {
    state.lang = I18N[lang] ? lang : "hy";
    document.documentElement.lang = state.lang;
    document.body.setAttribute("data-language", state.lang);
    write("imastun_language", state.lang);
    document.querySelectorAll("[data-lang]").forEach(function (button) {
      var active = button.dataset.lang === state.lang;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    document.querySelectorAll("[data-i18n]").forEach(function (element) {
      element.textContent = tr(element.dataset.i18n);
    });
    document.querySelectorAll("[data-i18n-placeholder]").forEach(function (element) {
      element.placeholder = tr(element.dataset.i18nPlaceholder);
    });
    document.querySelector(".lang").setAttribute("aria-label", tr("language"));
    document.getElementById("theme-toggle").setAttribute("aria-label", tr("theme"));
    setStatus(audio.paused ? (state.current >= 0 ? "paused" : "ready") : "playing");
    syncPlayer();
  }

  function applyArtist() {
    TRACKS = Array.isArray(artist.tracks) ? artist.tracks : [];
    document.documentElement.style.setProperty("--cover-position", artist.coverPosition || "center");
    document.getElementById("artist-name").textContent = artist.name;
    document.getElementById("cover").src = artist.cover;
    document.getElementById("cover").alt = artist.name;
    document.getElementById("cover-mark").textContent = artist.mark || "";
    document.getElementById("hero-stat").firstChild.nodeValue = TRACKS.length + " ";
    document.getElementById("player-cover").src = artist.cover;
    playerTitle.textContent = artist.name;
    resultCount.textContent = TRACKS.length + " " + tr("songWord");
  }

  function bindEvents() {
    list.addEventListener("click", function (event) {
      var button = event.target.closest("[data-action]");
      var row = event.target.closest(".track-row");
      if (!button || !row) return;
      var index = Number(row.dataset.index);
      if (button.dataset.action === "play") togglePlay(index);
      else if (button.dataset.action === "favorite") toggleFavorite(TRACKS[index].id);
      else if (button.dataset.action === "share") shareTrack(index);
    });

    search.addEventListener("input", function () {
      state.query = search.value;
      renderTracks();
    });

    document.querySelectorAll("[data-filter]").forEach(function (button) {
      button.addEventListener("click", function () {
        state.filter = button.dataset.filter;
        document.querySelectorAll("[data-filter]").forEach(function (candidate) {
          candidate.classList.toggle("active", candidate === button);
        });
        renderTracks();
      });
    });

    document.querySelectorAll("[data-lang]").forEach(function (button) {
      button.addEventListener("click", function () { applyLanguage(button.dataset.lang); });
    });

    document.getElementById("play-first").addEventListener("click", function () { loadTrack(0, true); });
    playButton.addEventListener("click", function () {
      if (state.current < 0) loadTrack(0, true);
      else togglePlay(state.current);
    });
    document.getElementById("prev").addEventListener("click", function () { move(-1); });
    document.getElementById("next").addEventListener("click", function () { move(1); });
    document.getElementById("player-close").addEventListener("click", function () {
      audio.pause();
      player.classList.remove("visible");
      document.body.classList.remove("player-open");
    });

    progress.addEventListener("input", function () {
      if (Number.isFinite(audio.duration) && audio.duration > 0) {
        audio.currentTime = (Number(progress.value) / 1000) * audio.duration;
      }
    });

    audio.addEventListener("play", function () { setStatus("playing"); syncPlayer(); });
    audio.addEventListener("pause", function () {
      if (!audio.ended && state.current >= 0) setStatus("paused");
      syncPlayer();
    });
    audio.addEventListener("waiting", function () { setStatus("loading"); });
    audio.addEventListener("canplay", function () { if (audio.paused) setStatus("ready"); });
    audio.addEventListener("loadedmetadata", function () { duration.textContent = formatTime(audio.duration); });
    audio.addEventListener("timeupdate", function () {
      currentTime.textContent = formatTime(audio.currentTime);
      duration.textContent = formatTime(audio.duration);
      progress.value = Number.isFinite(audio.duration) && audio.duration > 0
        ? String(Math.round((audio.currentTime / audio.duration) * 1000)) : "0";
    });
    audio.addEventListener("ended", function () { move(1); });
    audio.addEventListener("error", function () {
      setStatus("ready");
      showToast(tr("audioError"));
      syncPlayer();
    });

    if ("mediaSession" in navigator) {
      try {
        navigator.mediaSession.setActionHandler("play", function () { if (state.current >= 0) audio.play(); });
        navigator.mediaSession.setActionHandler("pause", function () { audio.pause(); });
        navigator.mediaSession.setActionHandler("previoustrack", function () { move(-1); });
        navigator.mediaSession.setActionHandler("nexttrack", function () { move(1); });
      } catch (error) {}
    }

    document.getElementById("theme-toggle").addEventListener("click", function () {
      var next = document.body.classList.contains("light-mode") ? "dark" : "light";
      document.body.classList.toggle("light-mode", next === "light");
      document.getElementById("theme-toggle").textContent = next === "light" ? "☀" : "☾";
      write("imastun_theme", next);
    });
  }

  function openRequestedTrack() {
    var requested = new URLSearchParams(location.search).get("play");
    if (!requested) {
      renderTracks();
      return;
    }
    var prefix = artist.id + "|";
    var requestedId = requested.indexOf(prefix) === 0 ? requested.slice(prefix.length) : requested;
    var requestedIndex = TRACKS.findIndex(function (track) { return track.id === requestedId; });
    if (requestedIndex >= 0) {
      loadTrack(requestedIndex, false);
      requestAnimationFrame(function () {
        var row = document.querySelector('.track-row[data-index="' + requestedIndex + '"]');
        if (row) row.scrollIntoView({ block:"center" });
      });
    } else {
      renderTracks();
    }
  }

  function init(data) {
    artist = data && data[artistId];
    if (!artist) throw new Error("Unknown artist: " + artistId);
    applyArtist();
    bindEvents();

    var savedTheme = read("imastun_theme", "dark");
    document.body.classList.toggle("light-mode", savedTheme === "light");
    document.getElementById("theme-toggle").textContent = savedTheme === "light" ? "☀" : "☾";

    applyLanguage(read("imastun_language", "hy"));
    openRequestedTrack();

    document.querySelectorAll("img").forEach(function (image) {
      image.addEventListener("error", function () {
        if (!image.src.endsWith("/logo.png")) image.src = "logo.png";
      }, { once:true });
    });
  }

  fetch(new URL("artist-pages-data.json", document.baseURI), { cache:"no-store" })
    .then(function (response) {
      if (!response.ok) throw new Error("HTTP " + response.status);
      return response.json();
    })
    .then(init)
    .catch(function (error) {
      console.error(error);
      list.innerHTML = '<div class="loading-panel">' + escapeHtml(I18N.hy.loadError) + '</div>';
      resultCount.textContent = "—";
    });
})();