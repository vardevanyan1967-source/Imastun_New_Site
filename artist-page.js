(function () {
  "use strict";

  var artistId = document.body.getAttribute("data-artist-id");
  var artist = null;
  var TRACKS = [];
  var state = { lang: "hy", filter: "all", poet: "all", query: "", current: -1 };
  var audio = document.getElementById("audio");
  var audio2 = new Audio();
  audio2.preload = "auto";
  var engines = [audio, audio2];
  var activeEngineIdx = 0;
  function curAudio() { return engines[activeEngineIdx]; }
  function idleAudio() { return engines[1 - activeEngineIdx]; }
  var CROSSFADE_SEC = 4;
  var MANUAL_CROSSFADE_SEC = 2;
  var crossfadeTimer = null;
  var crossfadeScheduleTimer = null;
  var crossfadeWatchdog = null;
  var crossfadeNextIndex = -1;
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
      all:"Բոլորը", favorites:"Սիրված երգերը", poets:"Բանաստեղծներ", languageCount:"Երգի տեքստի լեզուների քանակը", playFirst:"Նվագարկել առաջին երգը",
      songWord:"երգ", noResults:"Այս որոնմամբ երգ չի գտնվել։",
      noFavorites:"Սիրված երգ դեռ չկա։ Սեղմեք ♡՝ երգն այստեղ պահելու համար։",
      play:"Նվագարկել", pause:"Դադար", previous:"Նախորդ երգը", next:"Հաջորդ երգը",
      close:"Փակել նվագարկիչը", favorite:"Ավելացնել սիրվածներին",
      unfavorite:"Հեռացնել սիրվածներից", share:"Կիսվել", copied:"Հղումը պատճենվեց",
      copyFailed:"Չհաջողվեց պատճենել հղումը", audioError:"Ձայնային ֆայլը չբացվեց։ Փորձեք նորից։",
      tapAgain:"Սեղմեք նվագարկել ևս մեկ անգամ։", ready:"Պատրաստ է", loading:"Բեռնվում է…",
      playing:"Նվագարկվում է", paused:"Դադարեցված է", theme:"Փոխել գունային ռեժիմը",
      language:"Փոխել լեզուն", loadError:"Երգացանկը չբեռնվեց։ Թարմացրեք էջը։",
      donate:"Աջակցել", donateCardCopied:"Քարտի համարը պատճենվեց ✓", otherArtists:"Այլ արտիստներ",
      recentHeading:"Վերջերս ավելացված"
    },
    ru: {
      back:"Главная", catalog:"Песни", search:"Поиск по песням…",
      all:"Все", favorites:"Любимые песни", poets:"Поэты", languageCount:"Число языков в тексте песни", playFirst:"Включить первую песню",
      songWord:"песен", noResults:"По вашему запросу песен не найдено.",
      noFavorites:"Любимых песен пока нет. Нажмите ♡, чтобы сохранить песню здесь.",
      play:"Воспроизвести", pause:"Пауза", previous:"Предыдущая песня", next:"Следующая песня",
      close:"Закрыть плеер", favorite:"Добавить в избранное", unfavorite:"Убрать из избранного",
      share:"Поделиться", copied:"Ссылка скопирована", copyFailed:"Не удалось скопировать ссылку",
      audioError:"Аудиофайл не открылся. Попробуйте ещё раз.", tapAgain:"Нажмите воспроизведение ещё раз.",
      ready:"Готово", loading:"Загрузка…", playing:"Воспроизводится", paused:"На паузе",
      theme:"Сменить тему", language:"Сменить язык", loadError:"Список песен не загрузился. Обновите страницу.",
      donate:"Поддержать", donateCardCopied:"Номер карты скопирован ✓", otherArtists:"Другие артисты",
      recentHeading:"Недавно добавленные"
    },
    en: {
      back:"Home", catalog:"Track list", search:"Search tracks…",
      all:"All", favorites:"Favorite songs", poets:"Poets", languageCount:"Song text language count", playFirst:"Play the first track",
      songWord:"tracks", noResults:"No tracks match this search.",
      noFavorites:"No favorite songs yet. Tap ♡ to save a song here.",
      play:"Play", pause:"Pause", previous:"Previous track", next:"Next track",
      close:"Close player", favorite:"Add to favorites", unfavorite:"Remove from favorites",
      share:"Share", copied:"Link copied", copyFailed:"Could not copy the link",
      audioError:"The audio file could not be opened. Please try again.", tapAgain:"Tap play once more.",
      ready:"Ready", loading:"Loading…", playing:"Playing", paused:"Paused",
      theme:"Change theme", language:"Change language", loadError:"The track list could not load. Refresh the page.",
      donate:"Support", donateCardCopied:"Card number copied ✓", otherArtists:"Other artists",
      recentHeading:"Recently Added"
    }
  };


  var TRILINGUAL_OVERRIDE = new Set(["vahan-teryan/Golden Stars in Blue(Տխուր զրույց)","vahan-teryan/Կարոտ","vahan-teryan/Մոռանալ","hamo-sahyan/The One in Vain","hamo-sahyan/guce henc ajster","hamo-sahyan/duq lavn eq mardiq","hamo-sahyan/es kuzei ","hamo-sahyan/ev chimacanq te inchu","hamo-sahyan/inchu hishecri","hamo-sahyan/ka mi tulutun","hamo-sahyan/Փնտրում ես դու","Երանի գայիր(Just Like Before)","te karotum es","lok cav u dard","lrutian tchich","Կարոտի խենթի","Hayots_ashkarh_A","Title_Mi_tanjir_hogis_Multilingual_Emotional_Duet_Lyrics_by_Silva_Gulanyan_002","chem moracel","Jaheli_nman_003","Tiezerk_Jinj_Lazur","ser da ardioq","Քո ժպիտները հավաքեմ","ughernery-lac-chen-linum","Ches_moranalu_003","cav anbujeli","ov em qez hamar","bjur u bjur angam","ete asem","gereckuhi","im ser","sirelis","taxicy vat margare e","hamo-sahyan/papy","Իմ Գեղեցկուհի ընկերուհիները"]);
  var BILINGUAL_OVERRIDE = new Set(["vahan-teryan/Աշուն Է անձրև","Astghayin_Shghta_A","Vahan_Teryan_Gisher","Поцелуй_ветра","Vahan_Teryan_MEGhAVOR_AChKERU","Es_kez_sirum_em","Hay_aragil","Tchaxr e pargevum ","Chisht_zhamanakin_At_The_Right_Time","Sirir_indz_hogis_FRAM_Duet","S_irum_em_kez_I_love_you","sirty xentacav","Ka_mi_ashkharh_vor_srtov_e_karutsvats","Ko_koghkin_vorish_em_003","melodia lubvi"]);

  var NEW_SONGS = {"Մեղքի եզրին":"2026-09-06","Իմ Գեղեցկուհի ընկերուհիները twist rock & roil":"2026-09-06","Իմ Գեղեցկուհի ընկերուհիներըroc&roil":"2026-09-06","Սոնետ  45":"2026-08-01","Սոնետ  46":"2026-08-01","Սոնետ  47":"2026-08-01","Սոնետ  48":"2026-08-01","Սոնետ  49":"2026-08-01","Սոնետ  50":"2026-08-01","Սոնետ  51":"2026-08-01","Սոնետ  52":"2026-08-01","Սոնետ  53":"2026-08-01","Սոնետ  54":"2026-08-01","Սոնետ  55":"2026-08-01","Սոնետ  56":"2026-08-01","Սոնետ  57":"2026-08-01","Սոնետ  58":"2026-08-01","Սոնետ  59":"2026-08-01","Սոնետ  60":"2026-08-01","cav anbujeli":"2026-08-01","ov em qez hamar":"2026-08-01","bjur u bjur angam":"2026-08-01","ete asem":"2026-08-01","gereckuhi":"2026-08-01","Հայաստան, մեր սուրբ տուն":"2026-08-02","Армения, наш святой дом":"2026-08-02","Armenia, Our Sacred Home":"2026-08-02","im ser":"2026-08-06","sirelis":"2026-08-06","taxicy vat margare e":"2026-08-06","ergi chapov":"2026-08-06","На расстоянии песни":"2026-08-06","A Song Away":"2026-08-06","Սոնետ  70":"2026-08-08","Սոնետ  71":"2026-08-08","Սոնետ  72":"2026-08-08","Սոնետ  73":"2026-08-08","Սոնետ  75":"2026-08-08","Սոնետ  76":"2026-08-08","Սոնետ  77":"2026-08-08","Սոնետ  78":"2026-08-08","Սոնետ  79":"2026-08-08","Սոնետ  81":"2026-08-08","Սոնետ  82":"2026-08-08","Սոնետ  83":"2026-08-08","Սոնետ  84":"2026-08-08","Սոնետ  85":"2026-08-08","Սոնետ  86":"2026-08-08","Սոնետ  87":"2026-08-08","Սոնետ  88":"2026-08-08","Սոնետ  89":"2026-08-08","Սոնետ  91":"2026-08-08","Սոնետ  92":"2026-08-08","Սոնետ  93":"2026-08-08","Սոնետ  95":"2026-08-08","Սոնետ  96":"2026-08-08","Սոնետ  97":"2026-08-08","Սոնետ  98":"2026-08-08","Սոնետ  99":"2026-08-08","Սոնետ  100":"2026-08-08","Սոնետ  101":"2026-08-08","Սոնետ  102":"2026-08-08","Սոնետ  103":"2026-08-08","Սոնետ  104":"2026-08-08","Սոնետ  105":"2026-08-08","Սոնետ  106":"2026-08-08","Սոնետ  107":"2026-08-08","Սոնետ  108":"2026-08-08","Սոնետ  109":"2026-08-08","Սոնետ  110":"2026-08-08","Սոնետ  111":"2026-08-08","Սոնետ  112":"2026-08-08","Սոնետ  113":"2026-08-08","Սոնետ  114":"2026-08-08","Սոնետ  116":"2026-08-08","Սոնետ  117":"2026-08-08","Սոնետ  118":"2026-08-08","Սոնետ  119":"2026-08-08","Սոնետ  120":"2026-08-08","Սոնետ  122":"2026-08-08","Սոնետ  123":"2026-08-08","Սոնետ  124":"2026-08-08","Սոնետ  125":"2026-08-08","Սոնետ  126":"2026-08-08","Սոնետ  127":"2026-08-08","Սոնետ  128":"2026-08-08","Սոնետ  129":"2026-08-08","Սոնետ  130":"2026-08-08","Սոնետ  132":"2026-08-08","Սոնետ  133":"2026-08-08","Սոնետ  134":"2026-08-08","Սոնետ  135":"2026-08-08","Սոնետ  136":"2026-08-08","Սոնետ  137":"2026-08-08","Սոնետ  138":"2026-08-08","Սոնետ  139":"2026-08-08","Սոնետ  140":"2026-08-08","Սոնետ  141":"2026-08-08","Սոնետ  142":"2026-08-08","Սոնետ  143":"2026-08-08","Սոնետ  144":"2026-08-08","Սոնետ  145":"2026-08-08","Սոնետ  146":"2026-08-08","Սոնետ  147":"2026-08-08","Սոնետ  148":"2026-08-08","Սոնետ  149":"2026-08-08","Սոնետ  150":"2026-08-08","Սոնետ  151":"2026-08-08","Սոնետ  152":"2026-08-08","Սոնետ  153":"2026-08-08","Սոնետ  154":"2026-08-08","Կատակ Յարի Երգը":"2026-08-09","Roses in a Sieve":"2026-08-09","Ρόδα στο Κόσκινο":"2026-08-09","Песня шутка":"2026-08-09","ვარდები საცერში":"2026-08-09","parujr-sevak/What Color Is Love":"2026-08-13","parujr-sevak/Какого цвета любовь":"2026-08-13","Կատակ յարի երգ պար 4 լեզվով":"2026-08-13","ari-khmenq":"2026-08-15","Դու եկար":"2026-08-21","Ты пришёл":"2026-08-21","You Came":"2026-08-21","silva-kaputikyan/Լուսինն ու Արևը":"2026-08-24","silva-kaputikyan/Ծուխը չերևա":"2026-08-24","silva-kaputikyan/Քեզ փնտրում եմ":"2026-08-24","silva-kaputikyan/Ոչ մեր սիրելն էր նման սիրելու":"2026-08-24","silva-kaputikyan/The Moons Jealousy":"2026-08-24","silva-kaputikyan/Белая Луна":"2026-08-24","Our Lovely Mermaids":"2026-08-25","Эй наши русалки":"2026-08-25","ჩვენი ქალთევზებო":"2026-08-25","Իմ Գեղեցկուհի ընկերուհիները":"2026-08-31","IM JEALOUS OF THE MOSQUITO":"2026-09-02","Նախանձում եմ":"2026-09-02","Ревую к комару":"2026-09-02","I Gave My Sorrow The Name":"2026-09-02","Я назвал свою печаль тоской":"2026-09-02","Թախծիս անունը":"2026-09-02","Թախծիս անունը_1":"2026-09-02","Սոնետ  61":"2026-09-05","Սոնետ  62":"2026-09-05","Սոնետ  63":"2026-09-05","Սոնետ  64":"2026-09-05","Սոնետ  65":"2026-09-05","Սոնետ  66":"2026-09-05","Սոնետ  67":"2026-09-05","Սոնետ  68":"2026-09-05","Սոնետ  69":"2026-09-05","Սոնետ  74":"2026-09-05","Սոնետ  80":"2026-09-05","Սոնետ  90":"2026-09-05","Սոնետ  115":"2026-09-05","Սոնետ  131":"2026-09-05","hamo-sahyan/Ամպ է Նորից":"2026-09-05"};
  function isNewSong(id) {
    var added = NEW_SONGS[id];
    if (!added) return false;
    var days = (Date.now() - new Date(added).getTime()) / (1000 * 60 * 60 * 24);
    return days >= 0 && days <= 30;
  }

  function explanationText(value) {
    if (!value) return '';
    if (typeof value === 'string') return value;
    var lang = document.documentElement.lang || 'hy';
    return value[lang] || value.hy || value.en || value.ru || '';
  }

  function hasTranslatedTitle(track) {
    return state.lang !== "hy" && !!(track.explanation && track.explanation[state.lang]);
  }

  function displayTitle(track) {
    return hasTranslatedTitle(track) ? track.explanation[state.lang] : track.label;
  }

  function displaySubtitle(track, fallback) {
    if (hasTranslatedTitle(track)) return track.label;
    return track.explanation ? explanationText(track.explanation) : fallback;
  }

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

  var LEGACY_FAVORITE_KEYS = { "silva-gulanyan": "silva_favorites" };

  function migrateLegacyFavorites() {
    var legacyKey = LEGACY_FAVORITE_KEYS[artist.id];
    if (!legacyKey) return;
    var legacyValue = read(legacyKey, null);
    if (legacyValue === null) return;
    if (read(favoriteKey(), null) !== null) return;
    write(favoriteKey(), legacyValue);
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
      if (artist && artist.id === "haj-poetner" && state.poet !== "all" && item.track.subtitle !== state.poet) return false;
      if (!term) return true;
      return (item.track.label + " " + item.track.id + " " + (item.track.subtitle || "")).toLocaleLowerCase(locale).indexOf(term) >= 0;
    });
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, function (character) {
      return { "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[character];
    });
  }


  function languageCountClass(track) {
    if (artist && artist.id === "shakespeare-reimagined") return "lang-count-three";
    if (TRILINGUAL_OVERRIDE.has(track.id)) return "lang-count-three";
    if (BILINGUAL_OVERRIDE.has(track.id)) return "lang-count-two";
    var stripped = String(track.label || "").replace(/\([^)]*\)/g, "");
    var count = [
      /[\u0530-\u058F]/.test(stripped),
      /[\u0400-\u04FF]/.test(stripped),
      /[a-zA-Z]/.test(stripped)
    ].filter(Boolean).length;
    if (count >= 3) return "lang-count-three";
    if (count === 2) return "lang-count-two";
    return "lang-count-one";
  }

  function renderTracks() {
    if (!artist) return;
    var items = visibleTracks();
    resultCount.textContent = items.length + " " + tr("songWord");
    empty.hidden = items.length !== 0;
    empty.textContent = state.filter === "favorites" && !state.query ? tr("noFavorites") : tr("noResults");
    list.innerHTML = items.map(function (item, position) {
      var favorite = isFavorite(item.track.id);
      var playing = state.current === item.index && !curAudio().paused;
      var groupName = item.track.subtitle || artist.name;
      var previousGroup = position > 0 ? (items[position - 1].track.subtitle || artist.name) : "";
      var showDivider = artist.id === "haj-poetner" && groupName !== previousGroup;
      var groupCount = showDivider ? items.filter(function (candidate) {
        return (candidate.track.subtitle || artist.name) === groupName;
      }).length : 0;
      var divider = showDivider
        ? '<div class="poet-divider"><span>' + escapeHtml(groupName) + '</span><small>' +
          groupCount + ' ' + escapeHtml(tr("songWord")) + '</small></div>'
        : "";
      return divider + '<article class="track-row' + (state.current === item.index ? ' playing' : '') + '" data-index="' + item.index + '">' +
        '<span class="track-num">' + String(item.index + 1).padStart(2, "0") + '</span>' +
        '<button class="track-main" type="button" data-action="play">' +
        '<span class="track-title ' + languageCountClass(item.track) + '">' + escapeHtml(displayTitle(item.track)) + (isNewSong(item.track.id) ? ' <span class="new-badge">NEW</span>' : '') + '</span>' +
        '<span class="track-sub">' + escapeHtml(displaySubtitle(item.track, item.track.subtitle || artist.name)) + '</span>' + (item.track.subtitle && item.track.explanation ? '<span class="track-group">' + escapeHtml(item.track.subtitle) + '</span>' : '') + '</button>' +
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
    var playing = active && !curAudio().paused;
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
    cancelCrossfade();
    curAudio().pause();
    activeEngineIdx = 0;
    state.current = index;
    var track = TRACKS[index];
    var eng = curAudio();

    showPlayer();
    playerTitle.textContent = displayTitle(track);
    playerTitle.className = "player-title " + languageCountClass(track);
    document.getElementById("player-cover").src = artist.cover;
    progress.value = "0";
    currentTime.textContent = "0:00";
    duration.textContent = "0:00";
    setStatus("loading");

    if (eng.src !== track.src) {
      eng.src = track.src;
      eng.load();
    }
    eng.volume = 1;

    write("artistpage_" + artist.id + "_last_track", JSON.stringify({
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
      var promise = eng.play();
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
    var eng = curAudio();
    if (eng.paused) {
      var promise = eng.play();
      if (promise && promise.catch) promise.catch(function () { showToast(tr("tapAgain")); });
      if (crossfadeNextIndex >= 0) {
        var p2 = idleAudio().play();
        if (p2 && p2.catch) p2.catch(function () {});
      }
    } else {
      eng.pause();
      if (crossfadeNextIndex >= 0) cancelCrossfade();
    }
  }

  function move(direction) {
    if (!TRACKS.length) return;
    if (state.current < 0) {
      loadTrack(direction > 0 ? 0 : TRACKS.length - 1, true);
      return;
    }
    var nextIndex = (state.current + direction + TRACKS.length) % TRACKS.length;
    if (direction > 0 && !curAudio().paused && crossfadeNextIndex < 0) {
      startCrossfade(nextIndex, MANUAL_CROSSFADE_SEC);
      return;
    }
    loadTrack(nextIndex, true);
  }

  function setupPlayerSwipe() {
    var zone = document.querySelector(".player-meta") || player;
    var startX = 0, startY = 0, tracking = false;
    zone.addEventListener("touchstart", function (event) {
      if (!event.touches.length) return;
      startX = event.touches[0].clientX;
      startY = event.touches[0].clientY;
      tracking = true;
    }, { passive: true });
    zone.addEventListener("touchend", function (event) {
      if (!tracking) return;
      tracking = false;
      var touch = event.changedTouches[0];
      var dx = touch.clientX - startX;
      var dy = touch.clientY - startY;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) {
        if (dx < 0) move(1); else move(-1);
      }
    }, { passive: true });
  }

  function cancelCrossfade() {
    if (crossfadeTimer) { clearInterval(crossfadeTimer); crossfadeTimer = null; }
    if (crossfadeScheduleTimer) { clearTimeout(crossfadeScheduleTimer); crossfadeScheduleTimer = null; }
    if (crossfadeWatchdog) { clearInterval(crossfadeWatchdog); crossfadeWatchdog = null; }
    crossfadeNextIndex = -1;
    idleAudio().pause();
    idleAudio().removeAttribute("src");
    idleAudio().volume = 1;
    curAudio().volume = 1;
  }

  function armCrossfadeWatchdog() {
    if (crossfadeWatchdog) clearInterval(crossfadeWatchdog);
    crossfadeWatchdog = setInterval(function () {
      var eng = curAudio();
      if (eng.paused || state.current < 0 || TRACKS.length < 2) return;
      if (!Number.isFinite(eng.duration) || eng.duration <= 0) return;
      var remaining = eng.duration - eng.currentTime;
      if (remaining > 0 && remaining <= CROSSFADE_SEC && crossfadeNextIndex < 0) startCrossfade();
    }, 250);
  }

  function scheduleCrossfade() {
    if (state.current < 0 || TRACKS.length < 2 || crossfadeNextIndex >= 0 || crossfadeScheduleTimer) return;
    var eng = curAudio();
    var dur = Number(eng.duration);
    var remaining = dur - Number(eng.currentTime || 0);
    if (!Number.isFinite(dur) || dur <= 0) return;
    if (remaining <= CROSSFADE_SEC) { startCrossfade(); return; }
    var trackAtSchedule = state.current;
    var delay = Math.max(0, (remaining - CROSSFADE_SEC) * 1000);
    crossfadeScheduleTimer = setTimeout(function () {
      crossfadeScheduleTimer = null;
      if (state.current === trackAtSchedule && crossfadeNextIndex < 0) startCrossfade();
    }, delay);
  }

  function handleSeekCrossfade() {
    var eng = curAudio();
    if (eng.paused || state.current < 0 || TRACKS.length < 2 || crossfadeNextIndex >= 0) return;
    var dur = Number(eng.duration);
    var cur = Number(eng.currentTime || 0);
    if (!Number.isFinite(dur) || dur <= 0 || !Number.isFinite(cur)) return;
    var remaining = dur - cur;
    if (remaining > 0 && remaining <= CROSSFADE_SEC) startCrossfade();
    else if (remaining > CROSSFADE_SEC) scheduleCrossfade();
  }

  function finishCrossfadeSwap(nextIndex) {
    activeEngineIdx = 1 - activeEngineIdx;
    state.current = nextIndex;
    var track = TRACKS[nextIndex];
    playerTitle.textContent = displayTitle(track);
    playerTitle.className = "player-title " + languageCountClass(track);
    progress.value = "0";
    write("artistpage_" + artist.id + "_last_track", JSON.stringify({
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
    setStatus("playing");
    syncPlayer();
  }

  function startCrossfade(targetIndex, durationSec) {
    durationSec = durationSec || CROSSFADE_SEC;
    var nextIndex = Number.isInteger(targetIndex) ? targetIndex : (state.current + 1) % TRACKS.length;
    if (nextIndex < 0 || nextIndex >= TRACKS.length || crossfadeNextIndex >= 0) return;
    if (crossfadeScheduleTimer) { clearTimeout(crossfadeScheduleTimer); crossfadeScheduleTimer = null; }
    var cur = curAudio();
    var nxt = idleAudio();
    var track = TRACKS[nextIndex];
    crossfadeNextIndex = nextIndex;
    nxt.src = track.src;
    nxt.currentTime = 0;
    nxt.volume = 0;

    var beginFade = function () {
      if (crossfadeNextIndex !== nextIndex || crossfadeTimer) return;
      var steps = 60;
      var stepMs = (durationSec * 1000) / steps;
      var i = 0;
      crossfadeTimer = setInterval(function () {
        if (crossfadeNextIndex !== nextIndex) return;
        i++;
        var ratio = Math.min(1, i / steps);
        var fadeOut = Math.cos(ratio * Math.PI / 2);
        var fadeIn = Math.sin(ratio * Math.PI / 2);
        cur.volume = Math.max(0, Math.min(1, fadeOut));
        nxt.volume = Math.max(0, Math.min(1, fadeIn));
        if (i >= steps) {
          clearInterval(crossfadeTimer);
          crossfadeTimer = null;
          crossfadeNextIndex = -1;
          cur.pause();
          cur.currentTime = 0;
          cur.volume = 1;
          finishCrossfadeSwap(nextIndex);
        }
      }, stepMs);
    };

    beginFade();
    var playPromise = nxt.play();
    if (playPromise && playPromise.catch) {
      playPromise.catch(function () {
        if (crossfadeNextIndex !== nextIndex) return;
        if (crossfadeTimer) { clearInterval(crossfadeTimer); crossfadeTimer = null; }
        crossfadeNextIndex = -1;
        loadTrack(nextIndex, true);
      });
    }
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
    if (window.isSecureContext && navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url.href).then(function () {
        showToast(tr("copied"));
      }).catch(function () {
        showToast(legacyCopy(url.href) ? tr("copied") : url.href);
      });
      return;
    }
    showToast(legacyCopy(url.href) ? tr("copied") : url.href);
  }

  function legacyCopy(text) {
    try {
      var textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.setAttribute("readonly", "");
      textarea.style.position = "fixed";
      textarea.style.top = "-1000px";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      textarea.setSelectionRange(0, text.length);
      var ok = document.execCommand("copy");
      document.body.removeChild(textarea);
      return ok;
    } catch (error) {
      return false;
    }
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
    var switcherToggle = document.getElementById("artist-switcher-toggle");
    if (switcherToggle) {
      switcherToggle.setAttribute("aria-label", tr("otherArtists"));
      switcherToggle.setAttribute("title", tr("otherArtists"));
    }
    var donateButton = document.getElementById("donate-btn");
    if (donateButton) donateButton.setAttribute("aria-label", tr("donate"));
    setStatus(curAudio().paused ? (state.current >= 0 ? "paused" : "ready") : "playing");
    if (state.current >= 0 && TRACKS[state.current]) {
      var currentTrack = TRACKS[state.current];
      playerTitle.textContent = displayTitle(currentTrack);
      playerTitle.className = "player-title " + languageCountClass(currentTrack);
    }
    if (artist) renderTracks();
    syncPlayer();
  }



  function setupLanguageLegend() {
    if (document.getElementById("language-count-legend")) return;
    var legend = document.createElement("div");
    legend.className = "language-count-legend";
    legend.id = "language-count-legend";
    legend.setAttribute("role", "note");
    legend.innerHTML =
      '<span class="language-count-label" data-i18n="languageCount">' + escapeHtml(tr("languageCount")) + '</span>' +
      '<span class="language-count-items">' +
      '<span><i class="language-dot three"></i><b>3</b></span>' +
      '<span><i class="language-dot two"></i><b>2</b></span>' +
      '<span><i class="language-dot one"></i><b>1</b></span>' +
      '</span>';
    var anchor = document.getElementById("poet-filter-wrap") || document.querySelector(".toolbar");
    anchor.insertAdjacentElement("afterend", legend);
  }

  function setupRecentPanel() {
    var newItems = TRACKS.map(function (track, index) { return { track: track, index: index }; })
      .filter(function (item) { return isNewSong(item.track.id); })
      .sort(function (a, b) { return new Date(NEW_SONGS[b.track.id]) - new Date(NEW_SONGS[a.track.id]); });

    var panel = document.getElementById("recent-added");
    if (!newItems.length) {
      if (panel) panel.hidden = true;
      return;
    }
    if (!panel) {
      panel = document.createElement("section");
      panel.id = "recent-added";
      panel.className = "recent-added";
      panel.innerHTML =
        '<div class="recent-added-head">' +
        '<span class="section-label">New</span>' +
        '<h2 data-i18n="recentHeading">' + escapeHtml(tr("recentHeading")) + '</h2>' +
        '</div>' +
        '<div class="recent-grid" id="recent-added-grid"></div>';
      var catalogSection = document.querySelector(".catalog");
      if (catalogSection && catalogSection.parentNode) {
        catalogSection.parentNode.insertBefore(panel, catalogSection);
      }
    }
    panel.hidden = false;
    var grid = panel.querySelector("#recent-added-grid");
    grid.innerHTML = newItems.slice(0, 12).map(function (item) {
      var sub = item.track.explanation ? explanationText(item.track.explanation) : (item.track.subtitle || artist.name);
      return '<div class="recent-card" data-index="' + item.index + '">' +
        '<div class="rc-top"><span class="rc-badge new-badge">NEW</span></div>' +
        '<div class="rc-title">' + escapeHtml(item.track.label) + '</div>' +
        '<div class="rc-sub">' + escapeHtml(sub) + '</div>' +
        '</div>';
    }).join("");
    grid.querySelectorAll(".recent-card").forEach(function (card) {
      card.addEventListener("click", function () {
        var index = Number(card.dataset.index);
        togglePlay(index);
        var row = document.querySelector('.track-row[data-index="' + index + '"]');
        if (row) row.scrollIntoView({ block:"center", behavior:"smooth" });
      });
    });
  }

  function setupPoetFilters() {
    if (!artist || artist.id !== "haj-poetner" || document.getElementById("poet-filter-wrap")) return;
    var poetNames = [];
    TRACKS.forEach(function (track) {
      if (track.subtitle && poetNames.indexOf(track.subtitle) < 0) poetNames.push(track.subtitle);
    });

    var wrap = document.createElement("div");
    wrap.className = "poet-filter-wrap";
    wrap.id = "poet-filter-wrap";
    wrap.innerHTML =
      '<span class="poet-filter-title" data-i18n="poets">' + escapeHtml(tr("poets")) + '</span>' +
      '<div class="poet-filters" role="group" aria-label="' + escapeHtml(tr("poets")) + '">' +
      '<button class="poet-chip active" type="button" data-poet-filter="all" data-i18n="all" aria-pressed="true">' +
      escapeHtml(tr("all")) + '</button>' +
      poetNames.map(function (name) {
        return '<button class="poet-chip" type="button" data-poet-filter="' + escapeHtml(name) +
          '" aria-pressed="false">' + escapeHtml(name) + '</button>';
      }).join("") + '</div>';

    document.querySelector(".toolbar").insertAdjacentElement("afterend", wrap);
    wrap.addEventListener("click", function (event) {
      var button = event.target.closest("[data-poet-filter]");
      if (!button) return;
      state.poet = button.dataset.poetFilter;
      wrap.querySelectorAll("[data-poet-filter]").forEach(function (candidate) {
        var active = candidate === button;
        candidate.classList.toggle("active", active);
        candidate.setAttribute("aria-pressed", String(active));
      });
      renderTracks();
    });
  }

  var DONATE_CARD_NUMBER = "4578 8900 8055 1169";

  function setupContactButtons() {
    var donateButton = document.getElementById("donate-btn");
    if (donateButton && !donateButton.dataset.bound) {
      donateButton.dataset.bound = "1";
      donateButton.addEventListener("click", function () {
        if (window.isSecureContext && navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(DONATE_CARD_NUMBER).then(function () {
            showToast(tr("donateCardCopied"));
          }).catch(function () {
            showToast(legacyCopy(DONATE_CARD_NUMBER) ? tr("donateCardCopied") : DONATE_CARD_NUMBER);
          });
        } else {
          showToast(legacyCopy(DONATE_CARD_NUMBER) ? tr("donateCardCopied") : DONATE_CARD_NUMBER);
        }
      });
    }
  }

  function setupArtistSwitcher(allArtists) {
    var toggle = document.getElementById("artist-switcher-toggle");
    var menu = document.getElementById("artist-switcher-menu");
    if (!toggle || !menu || !allArtists) return;
    menu.innerHTML = Object.keys(allArtists).map(function (id) {
      var entry = allArtists[id];
      if (!entry || !entry.slug || !entry.name) return "";
      var isActive = id === artistId;
      return '<a href="' + escapeHtml(entry.slug) + '"' +
        (isActive ? ' class="active" aria-current="page"' : "") + '>' +
        escapeHtml(entry.name) + "</a>";
    }).join("");
    if (toggle.dataset.bound) return;
    toggle.dataset.bound = "1";
    toggle.addEventListener("click", function (event) {
      event.stopPropagation();
      var willOpen = menu.hidden;
      menu.hidden = !willOpen;
      toggle.setAttribute("aria-expanded", String(willOpen));
    });
    document.addEventListener("click", function () {
      if (!menu.hidden) {
        menu.hidden = true;
        toggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  function setupSideArtists(allArtists) {
    var aside = document.getElementById("side-artists");
    if (!aside || !allArtists) return;
    var cards = Object.keys(allArtists).map(function (id) {
      var entry = allArtists[id];
      if (!entry || !entry.slug || !entry.name) return "";
      var isActive = id === artistId;
      var cover = entry.cover ? escapeHtml(entry.cover) : "";
      var name = escapeHtml(entry.name);
      return '<a class="side-artist-card' + (isActive ? " active" : "") + '" href="' + escapeHtml(entry.slug) +
        '" title="' + name + '"' + (isActive ? ' aria-current="page"' : "") + '>' +
        '<img class="side-artist-cover" src="' + cover + '" alt="" loading="lazy" />' +
        '<span class="side-artist-name">' + name + "</span></a>";
    }).join("");
    aside.innerHTML = cards;
  }

  function applyArtist() {
    migrateLegacyFavorites();
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
    setupPoetFilters();
    setupLanguageLegend();
    setupContactButtons();
    setupRecentPanel();
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
      curAudio().pause();
      cancelCrossfade();
      player.classList.remove("visible");
      document.body.classList.remove("player-open");
    });
    setupPlayerSwipe();

    progress.addEventListener("input", function () {
      var eng = curAudio();
      if (Number.isFinite(eng.duration) && eng.duration > 0) {
        eng.currentTime = (Number(progress.value) / 1000) * eng.duration;
      }
    });
    progress.addEventListener("change", function () { handleSeekCrossfade(); });

    function setupEngine(eng) {
      eng.addEventListener("play", function () {
        if (eng !== curAudio()) return;
        setStatus("playing");
        syncPlayer();
        armCrossfadeWatchdog();
      });
      eng.addEventListener("pause", function () {
        if (eng !== curAudio()) return;
        if (!eng.ended && state.current >= 0) setStatus("paused");
        syncPlayer();
      });
      eng.addEventListener("waiting", function () { if (eng === curAudio()) setStatus("loading"); });
      eng.addEventListener("canplay", function () { if (eng === curAudio() && eng.paused) setStatus("ready"); });
      eng.addEventListener("loadedmetadata", function () {
        if (eng !== curAudio()) return;
        duration.textContent = formatTime(eng.duration);
        scheduleCrossfade();
      });
      eng.addEventListener("durationchange", function () { if (eng === curAudio()) scheduleCrossfade(); });
      eng.addEventListener("timeupdate", function () {
        if (eng !== curAudio()) return;
        currentTime.textContent = formatTime(eng.currentTime);
        duration.textContent = formatTime(eng.duration);
        progress.value = Number.isFinite(eng.duration) && eng.duration > 0
          ? String(Math.round((eng.currentTime / eng.duration) * 1000)) : "0";
        if (crossfadeNextIndex < 0 && eng.duration && TRACKS.length > 1) {
          var remaining = eng.duration - eng.currentTime;
          if (remaining > 0 && remaining <= CROSSFADE_SEC) startCrossfade();
          else scheduleCrossfade();
        }
      });
      eng.addEventListener("ended", function () {
        if (eng !== curAudio()) return;
        if (crossfadeNextIndex >= 0) {
          var nextIndex = crossfadeNextIndex;
          if (crossfadeTimer) { clearInterval(crossfadeTimer); crossfadeTimer = null; }
          crossfadeNextIndex = -1;
          idleAudio().volume = 1;
          finishCrossfadeSwap(nextIndex);
          return;
        }
        move(1);
      });
      eng.addEventListener("error", function () {
        if (eng !== curAudio()) return;
        setStatus("ready");
        showToast(tr("audioError"));
        syncPlayer();
      });
    }
    setupEngine(audio);
    setupEngine(audio2);

    if ("mediaSession" in navigator) {
      try {
        navigator.mediaSession.setActionHandler("play", function () { if (state.current >= 0) curAudio().play(); });
        navigator.mediaSession.setActionHandler("pause", function () { curAudio().pause(); });
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
    setupArtistSwitcher(data);
    setupSideArtists(data);
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