const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

const config = window.PAHADI_CYBER_CAFE_CONFIG;
const storageKeys = {
  station: "pahadiStation",
  volume: "pahadiVolume",
  ambience: "pahadiAmbience",
  localTrack: "pahadiLocalTrack"
};

const state = {
  station: null,
  player: null,
  isReady: false,
  isPlaying: false,
  isLoading: true,
  shouldResumeOnFocus: false,
  volume: Number(localStorage.getItem(storageKeys.volume)) || 70,
  source: "youtube",
  localTrackIndex: Number(localStorage.getItem(storageKeys.localTrack)) || 0,
  localAudio: null,
  ambience: {},
  audioNodes: {},
  autoplay: false,
  failCount: 0
};

// Free, keyless directory of internet radio streams (CORS enabled). Second host is a fallback mirror.
const RADIO_API_HOSTS = ["https://de1.api.radio-browser.info", "https://fi1.api.radio-browser.info"];

function isValidYouTubeId(id) {
  return typeof id === "string" && /^[a-zA-Z0-9_-]{6,}$/.test(id) && !id.includes("YOUR_");
}

function getPlaylistIdFromUrl(url) {
  if (typeof url !== "string" || !url.trim()) return "";
  try {
    const parsed = new URL(url);
    return parsed.searchParams.get("list") || "";
  } catch {
    const match = url.match(/[?&]list=([a-zA-Z0-9_-]+)/);
    return match ? match[1] : "";
  }
}

function getStationMedia(station) {
  const configured = Array.isArray(station.videoIds) ? station.videoIds : [];
  const videoIds = [...new Set([...(station.foundIds || []), ...configured])].filter(isValidYouTubeId);
  const playlistFromUrl = getPlaylistIdFromUrl(station.playlistUrl);
  const playlistId = isValidYouTubeId(playlistFromUrl)
    ? playlistFromUrl
    : isValidYouTubeId(station.playlistId) ? station.playlistId : "";
  return { videoIds, playlistId };
}

// Searches YouTube for the station's songs (needs config.youtube.apiKey). Results are cached
// for 24h per query because each search costs 100 of the key's 10,000 daily quota units.
async function findYouTubeVideos(station) {
  const { apiKey } = config.youtube;
  if (!apiKey || !station.searchQuery || station.foundIds) return;
  const cacheKey = `pahadiYT:${station.searchQuery}`;
  try {
    const cached = JSON.parse(localStorage.getItem(cacheKey));
    if (cached && Date.now() - cached.at < 24 * 3600 * 1000) {
      station.foundIds = cached.ids;
      return;
    }
  } catch {
    // ignore bad cache
  }
  const params = new URLSearchParams({
    part: "id",
    type: "video",
    videoEmbeddable: "true",
    videoSyndicated: "true",
    videoCategoryId: "10",
    maxResults: "50",
    regionCode: "IN",
    relevanceLanguage: "hi",
    q: station.searchQuery,
    key: apiKey
  });
  try {
    const response = await fetch(`https://www.googleapis.com/youtube/v3/search?${params}`);
    if (!response.ok) throw new Error(`YouTube search failed: ${response.status}`);
    const data = await response.json();
    // Shuffle so each visit feels like radio, not the same top result every time.
    station.foundIds = data.items.map((item) => item.id.videoId).sort(() => Math.random() - 0.5);
    localStorage.setItem(cacheKey, JSON.stringify({ at: Date.now(), ids: station.foundIds }));
  } catch (error) {
    console.warn(error);
    station.foundIds = []; // fall back to configured videoIds
  }
}

function getStationSource(station) {
  return ["local", "internet"].includes(station.source) ? station.source : "youtube";
}

async function fetchInternetTracks(station) {
  const params = new URLSearchParams({
    ...station.search,
    hidebroken: "true",
    is_https: "true",
    order: "clickcount",
    reverse: "true",
    limit: "40"
  });
  for (const host of RADIO_API_HOSTS) {
    try {
      const response = await fetch(`${host}/json/stations/search?${params}`);
      if (!response.ok) continue;
      const results = await response.json();
      // https only (mixed content is blocked), and skip HLS/playlist URLs <audio> can't play everywhere.
      return results
        .filter((item) => item.url_resolved?.startsWith("https://") && !item.hls && !/\.(m3u8?|pls)(\?|$)/i.test(item.url_resolved))
        .map((item) => ({
          title: item.name.trim(),
          artist: [item.country, item.tags.split(",").slice(0, 3).join(", ")].filter(Boolean).join(" · "),
          file: item.url_resolved
        }));
    } catch {
      // try next mirror
    }
  }
  return [];
}

function syncPlayerSurface() {
  $("#tvTile").classList.toggle("hide", state.source !== "youtube");
}

function getLocalTracks(station) {
  return Array.isArray(station.tracks)
    ? station.tracks.filter((track) => track.title && track.file)
    : [];
}

function enterSystem() {
  $("#boot").classList.add("hide");
  $("#main").classList.remove("hide");
  $("#nav").classList.remove("hide");
  toast("Namaste! 🙏 Gaane shuru ho rahe hain");
  // The ENTER click is a user gesture, so browsers allow autoplay from here.
  state.autoplay = true;
  if (state.source !== "youtube" || state.isReady) loadStation(state.station, true);
}

function renderStations() {
  const selectedId = getInitialStation().id;
  $("#stationList").innerHTML = config.stations.map((station) => `
    <button class="station ${station.id === selectedId ? "active" : ""}" data-station-id="${station.id}" type="button">
      <span>${station.icon}</span>
      <b>${station.name}</b>
      <small>${station.description}</small>
    </button>
  `).join("");

  $$(".station").forEach((button) => {
    button.addEventListener("click", () => selectStation(button.dataset.stationId, true));
  });
}

function renderAmbience() {
  let saved = {};
  try {
    saved = JSON.parse(localStorage.getItem(storageKeys.ambience) || "{}");
  } catch {
    saved = {};
  }
  state.ambience = saved;

  $("#ambienceList").innerHTML = config.ambience.map((item) => {
    const value = Number(saved[item.id] || 0);
    return `
      <label class="ambience-control" data-audio-id="${item.id}">
        <span>${item.icon} ${item.name}</span>
        <input type="range" min="0" max="100" value="${value}" aria-label="${item.name} ki awaaz">
        
      </label>
    `;
  }).join("");

  $$(".ambience-control").forEach((control) => {
    const id = control.dataset.audioId;
    const item = config.ambience.find((entry) => entry.id === id);
    const input = control.querySelector("input");
    const audio = new Audio(item.file);
    audio.loop = true;
    audio.preload = "metadata";
    state.audioNodes[id] = audio;

    audio.addEventListener("loadedmetadata", () => {
      syncAmbienceVolume(id, Number(input.value));
    }, { once: true });

    audio.addEventListener("error", () => {
      state.audioNodes[id] = createSynthAmbience(id);
      syncAmbienceVolume(id, Number(input.value));
    }, { once: true });

    input.addEventListener("input", () => syncAmbienceVolume(id, Number(input.value)));
  });
}

// Fills a looping buffer with a generated sound, used when an ambience file is missing.
const SYNTH_AMBIENCE = {
  rain: { filter: ["highpass", 900], fill: (data) => data.forEach((_, i) => { data[i] = Math.random() * 2 - 1; }) },
  wind: {
    filter: ["lowpass", 450],
    fill: (data, rate) => data.forEach((_, i) => {
      const gust = 0.55 + 0.45 * Math.sin((2 * Math.PI * i) / (rate * 4)); // one gust per 4s loop
      data[i] = (Math.random() * 2 - 1) * gust * 2;
    })
  },
  keyboard: {
    filter: ["highpass", 2000],
    fill: (data, rate) => {
      for (let t = 0.1; t < 3.9; t += 0.08 + Math.random() * 0.25) {
        const start = Math.floor(t * rate);
        for (let i = 0; i < rate * 0.012; i++) data[start + i] = (Math.random() * 2 - 1) * Math.exp(-i / (rate * 0.002));
      }
    }
  },
  modem: {
    filter: ["bandpass", 1800],
    fill: (data, rate) => data.forEach((_, i) => {
      const t = i / rate;
      if (t < 0.8) data[i] = 0.5 * Math.sin(2 * Math.PI * 2100 * t);
      else if (t < 1.6) data[i] = 0.5 * Math.sin(2 * Math.PI * (Math.floor(t * 20) % 2 ? 1200 : 2400) * t);
      else data[i] = (Math.random() * 2 - 1) * 0.6 * Math.sin(2 * Math.PI * 1800 * t) + 0.3 * Math.sin(2 * Math.PI * 980 * t);
    })
  }
};

function createSynthAmbience(id) {
  const recipe = SYNTH_AMBIENCE[id] || SYNTH_AMBIENCE.rain;
  const ctx = state.audioCtx ||= new AudioContext();
  const buffer = ctx.createBuffer(1, ctx.sampleRate * 4, ctx.sampleRate);
  recipe.fill(buffer.getChannelData(0), ctx.sampleRate);
  const source = ctx.createBufferSource();
  const filter = ctx.createBiquadFilter();
  const gain = ctx.createGain();
  source.buffer = buffer;
  source.loop = true;
  [filter.type, filter.frequency.value] = recipe.filter;
  gain.gain.value = 0;
  source.connect(filter).connect(gain).connect(ctx.destination);
  source.start();
  let volume = 0;
  // Same surface syncAmbienceVolume uses on <audio>: volume, paused, play(), pause().
  return {
    paused: true,
    set volume(value) {
      volume = value * 0.4;
      if (!this.paused) gain.gain.value = volume;
    },
    play() {
      this.paused = false;
      gain.gain.value = volume;
      return ctx.resume();
    },
    pause() {
      this.paused = true;
      gain.gain.value = 0;
    }
  };
}

function syncAmbienceVolume(id, value) {
  const audio = state.audioNodes[id];
  if (!audio) return;
  state.ambience[id] = value;
  audio.volume = value / 100;
  localStorage.setItem(storageKeys.ambience, JSON.stringify(state.ambience));

  if (value > 0 && audio.paused) {
    audio.play().catch(() => toast("Ek baar screen pe tap kijiye"));
  }
  if (value === 0 && !audio.paused) {
    audio.pause();
  }
}

function getInitialStation() {
  const storedId = localStorage.getItem(storageKeys.station);
  return config.stations.find((station) => station.id === storedId)
    || config.stations.find((station) => station.id === config.defaultStationId)
    || config.stations[0];
}

function selectStation(stationId, shouldPlay = false) {
  const station = config.stations.find((entry) => entry.id === stationId);
  if (!station) return;
  if (state.station && state.station.id !== station.id) state.localTrackIndex = 0;
  state.station = station;
  localStorage.setItem(storageKeys.station, station.id);

  $$(".station").forEach((button) => {
    button.classList.toggle("active", button.dataset.stationId === station.id);
  });

  $("#trackTitle").textContent = station.name;
  $("#trackArtist").textContent = station.description;
  state.source = getStationSource(station);
  syncPlayerSurface();

  if (state.source === "youtube" && !state.isReady) {
    setStatus("Gaane aa rahe hain...", "Shuru ho raha hai...");
    return;
  }

  loadStation(station, shouldPlay);
}

async function loadStation(station, shouldPlay) {
  if (getStationSource(station) !== "youtube") {
    loadLocalStation(station, shouldPlay);
    return;
  }

  stopLocalAudio();
  state.isLoading = true;
  setStatus(`${station.name} lag raha hai...`, "Shuru ho raha hai...");
  await findYouTubeVideos(station);
  if (state.station !== station) return;
  const media = getStationMedia(station);

  if (media.playlistId) {
    state.player.loadPlaylist({
      listType: "playlist",
      list: media.playlistId,
      index: 0,
      suggestedQuality: "small"
    });
  } else if (media.videoIds.length) {
    state.player.loadPlaylist(media.videoIds, 0, 0, "small");
  } else {
    setStatus("Is station mein abhi gaane nahi hain. Doosra station chuniye.", "Dikkat");
    state.isLoading = false;
    updateTrackFromStation();
    return;
  }

  if (!shouldPlay) {
    setTimeout(() => {
      if (state.player && !state.isPlaying) state.player.pauseVideo();
    }, 700);
  }
}

async function loadLocalStation(station, shouldPlay) {
  if (state.player?.pauseVideo) state.player.pauseVideo();
  if (station.source === "internet" && !station.tracks?.length) {
    setStatus(`${station.name} lag raha hai...`, "Shuru ho raha hai...");
    station.fetching = station.fetching || fetchInternetTracks(station);
    station.tracks = await station.fetching;
    station.fetching = null;
    if (state.station !== station) return;
    if (!station.tracks.length) {
      updateTrackFromStation();
      setStatus("Gaane nahi mil paaye. Internet check karke dobara koshish kijiye.", "Dikkat");
      return;
    }
  }
  const tracks = getLocalTracks(station);
  state.localTrackIndex = Math.min(state.localTrackIndex, Math.max(tracks.length - 1, 0));

  if (!tracks.length) {
    state.isPlaying = false;
    setPlayButton(false);
    updateTrackFromStation();
    setStatus("Is station mein abhi gaane nahi hain. Doosra station chuniye.", "Dikkat");
    return;
  }

  loadLocalTrack(state.localTrackIndex, shouldPlay);
}

function loadLocalTrack(index, shouldPlay) {
  const tracks = getLocalTracks(state.station);
  const track = tracks[index];
  if (!track) return;

  state.localTrackIndex = index;
  localStorage.setItem(storageKeys.localTrack, String(index));
  $("#trackTitle").textContent = track.title;
  $("#trackArtist").textContent = track.artist || state.station.name;
  $("#localTrackCounter").textContent = `Gaana ${index + 1} / ${tracks.length}`;
  state.localAudio.src = track.file;
  state.localAudio.volume = state.volume / 100;
  state.localAudio.load();
  setStatus("Gaana aa raha hai...", "Shuru ho raha hai...");

  if (shouldPlay) playLocalAudio();
}

function playLocalAudio() {
  state.localAudio.play().catch((error) => {
    // Load failures are handled by the audio "error" listener (which skips ahead).
    if (error.name === "NotAllowedError") setStatus("Gaana sunne ke liye ▶ Chalao dabaiye.", "Ruka hua");
  });
}

function stopLocalAudio() {
  if (!state.localAudio) return;
  state.localAudio.pause();
  state.localAudio.removeAttribute("src");
  state.localAudio.load();
}

function nextLocalTrack(shouldPlay = state.isPlaying) {
  const tracks = getLocalTracks(state.station);
  if (!tracks.length) return;
  loadLocalTrack((state.localTrackIndex + 1) % tracks.length, shouldPlay);
}

function previousLocalTrack() {
  const tracks = getLocalTracks(state.station);
  if (!tracks.length) return;
  loadLocalTrack((state.localTrackIndex + tracks.length - 1) % tracks.length, state.isPlaying);
}

function setupLocalAudio() {
  state.localAudio = $("#localAudio");
  state.localAudio.addEventListener("playing", () => {
    state.isPlaying = true;
    state.failCount = 0;
    setPlayButton(true);
    $("#localPlayerVisual").classList.add("playing");
    setStatus("Gaana baj raha hai. Mazaa lijiye! 🎶", "Baj raha hai");
    showDjComment(state.localAudio.src);
    updateMediaSession();
  });
  state.localAudio.addEventListener("pause", () => {
    $("#localPlayerVisual").classList.remove("playing");
    if (state.source === "youtube") return;
    state.isPlaying = false;
    setPlayButton(false);
    setStatus("Gaana ruka hua hai. ▶ Chalao dabaiye.", "Ruka hua");
  });
  state.localAudio.addEventListener("ended", () => nextLocalTrack(true));
  state.localAudio.addEventListener("error", () => {
    if (state.source === "youtube" || !state.localAudio.getAttribute("src")) return;
    state.isPlaying = false;
    setPlayButton(false);
    // Dead streams are common: skip to the next one until every track has failed once.
    state.failCount += 1;
    if (state.failCount < getLocalTracks(state.station).length) {
      setStatus("Ye gaana nahi chala, agla laga rahe hain...", "Shuru ho raha hai...");
      nextLocalTrack(true);
      return;
    }
    state.failCount = 0;
    setStatus("Koi gaana nahi chal paaya. Doosra station chuniye.", "Dikkat");
  });
}

function onYouTubeIframeAPIReady() {
  state.player = new YT.Player("youtubePlayer", {
    width: "100%",
    height: "100%",
    playerVars: config.youtube.playerVars,
    events: {
      onReady: onPlayerReady,
      onStateChange: onPlayerStateChange,
      onError: onPlayerError
    }
  });
}

window.onYouTubeIframeAPIReady = onYouTubeIframeAPIReady;
if (window.YT?.Player) onYouTubeIframeAPIReady();

function onPlayerReady() {
  state.isReady = true;
  state.player.setVolume(state.volume);
  $("#volume").value = state.volume;
  if (state.source === "youtube") {
    setStatus("Gaane aa rahe hain...", "Shuru ho raha hai...");
    loadStation(state.station, state.autoplay);
  }
}

function onPlayerStateChange(event) {
  const YTState = window.YT.PlayerState;
  state.isPlaying = event.data === YTState.PLAYING;
  $("#localPlayerVisual").classList.toggle("playing", state.isPlaying);
  state.isLoading = event.data === YTState.BUFFERING || event.data === YTState.CUED;

  if (event.data === YTState.PLAYING) {
    setPlayButton(true);
    setStatus("Gaana baj raha hai. Mazaa lijiye! 🎶", "Baj raha hai");
    updateTrackFromYouTube();
    showDjComment(state.player.getVideoData?.()?.video_id);
  }

  if (event.data === YTState.ENDED) {
    state.player.playVideoAt(0); // loop the station
    return;
  }

  if (event.data === YTState.PAUSED) {
    setPlayButton(false);
    setStatus("Gaana ruka hua hai. ▶ Chalao dabaiye.", "Ruka hua");
  }

  if (event.data === YTState.BUFFERING) {
    setStatus("Gaana aa raha hai, thoda intezaar...", "Shuru ho raha hai...");
  }

  updateMediaSession();
}

function onPlayerError() {
  // Usually the video was removed or its owner blocked playing it outside YouTube.
  setStatus("Ye gaana nahi chala, agla laga rahe hain...", "Shuru ho raha hai...");
  updateTrackFromStation();
  setTimeout(() => state.player?.nextVideo(), 1500);
}

function togglePlay() {
  if (state.source !== "youtube") {
    if (!getLocalTracks(state.station).length) {
      loadLocalStation(state.station, true);
      return;
    }
    if (state.isPlaying) state.localAudio.pause();
    // Live streams reload on resume so playback is live, not a stale buffer.
    else if (!state.localAudio.getAttribute("src") || state.source === "internet") loadLocalTrack(state.localTrackIndex, true);
    else playLocalAudio();
    return;
  }

  if (!state.isReady) {
    toast("Thoda intezaar kijiye, gaane aa rahe hain");
    return;
  }
  const media = getStationMedia(state.station);
  if (!media.playlistId && !media.videoIds.length) {
    setStatus("Is station mein abhi gaane nahi hain. Doosra station chuniye.", "Dikkat");
    return;
  }
  if (state.isPlaying) state.player.pauseVideo();
  else state.player.playVideo();
}

function updateTrackFromYouTube() {
  const data = state.player.getVideoData ? state.player.getVideoData() : null;
  if (!data || !data.title) {
    updateTrackFromStation();
    return;
  }
  $("#trackTitle").textContent = data.title;
  $("#trackArtist").textContent = data.author || state.station.name;
  const total = state.player.getPlaylist()?.length;
  if (total) $("#localTrackCounter").textContent = `Gaana ${state.player.getPlaylistIndex() + 1} / ${total}`;
}

function updateTrackFromStation() {
  $("#trackTitle").textContent = state.station.name;
  $("#trackArtist").textContent = state.station.description;
}

// DJ line for a new song: station mood lines + common cafe lines, never the same line twice in a row.
function showDjComment(songKey) {
  if (!songKey || songKey === state.lastSong) return;
  state.lastSong = songKey;
  const lines = [...(state.station.djComments || []), ...(config.djCommon || [])]
    .filter((line) => line !== state.lastDjLine);
  if (!lines.length) return;
  state.lastDjLine = lines[Math.floor(Math.random() * lines.length)];
  const box = $("#djComment");
  box.innerHTML = "";
  box.append(Object.assign(document.createElement("b"), { textContent: `🎧 ${config.djName || "DJ"}:` }), ` ${state.lastDjLine}`);
  box.classList.remove("hide", "pop");
  void box.offsetWidth; // restart the pop animation
  box.classList.add("pop");
}

function setPlayButton(isPlaying) {
  $("#play").textContent = isPlaying ? "⏸ Roko" : "▶ Chalao";
}

function setStatus(message, status) {
  $("#statusMessage").textContent = message;
  $("#playerState").textContent = status;
}

function updateMediaSession() {
  if (!("mediaSession" in navigator)) return;
  navigator.mediaSession.metadata = new MediaMetadata({
    title: $("#trackTitle").textContent,
    artist: $("#trackArtist").textContent,
    album: "Pahadi Radio"
  });
}

function setupMediaSession() {
  if (!("mediaSession" in navigator)) return;
  navigator.mediaSession.setActionHandler("play", () => {
    if (state.source !== "youtube") playLocalAudio();
    else state.player?.playVideo();
  });
  navigator.mediaSession.setActionHandler("pause", () => {
    if (state.source !== "youtube") state.localAudio?.pause();
    else state.player?.pauseVideo();
  });
  navigator.mediaSession.setActionHandler("nexttrack", () => {
    if (state.source !== "youtube") nextLocalTrack();
    else state.player?.nextVideo();
  });
  navigator.mediaSession.setActionHandler("previoustrack", () => {
    if (state.source !== "youtube") previousLocalTrack();
    else state.player?.previousVideo();
  });
}

function setupControls() {
  $("#play").addEventListener("click", togglePlay);
  $("#next").addEventListener("click", () => {
    if (state.source !== "youtube") nextLocalTrack();
    else if (state.isReady) state.player.nextVideo();
  });
  $("#prev").addEventListener("click", () => {
    if (state.source !== "youtube") previousLocalTrack();
    else if (state.isReady) state.player.previousVideo();
  });
  $("#volume").addEventListener("input", (event) => {
    state.volume = Number(event.target.value);
    localStorage.setItem(storageKeys.volume, String(state.volume));
    if (state.player?.setVolume) state.player.setVolume(state.volume);
    if (state.localAudio) state.localAudio.volume = state.volume / 100;
  });
}

function setupVisibilityResume() {
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      state.shouldResumeOnFocus = state.isPlaying;
      return;
    }

    // <audio> keeps playing in the background on its own; only the YouTube iframe needs a nudge.
    if (state.shouldResumeOnFocus && state.isReady && state.source === "youtube") {
      setTimeout(() => {
        state.player.playVideo();
        setStatus("Wapas aa gaye! Gaana phir se chal raha hai 🎶", "Baj raha hai");
      }, 250);
    }
  });

  window.addEventListener("focus", () => {
    if (state.shouldResumeOnFocus && state.isReady && state.source === "youtube" && !state.isPlaying) {
      state.player.playVideo();
    }
  });
}

function setupNavigation() {
  $$("#nav button").forEach((button) => {
    button.addEventListener("click", () => {
      $(`#${button.dataset.target}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });
}

function clock() {
  $("#clock").textContent = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function toast(message) {
  const toastEl = $("#toast");
  toastEl.textContent = message;
  toastEl.style.display = "block";
  clearTimeout(window.pahadiToastTimer);
  window.pahadiToastTimer = setTimeout(() => {
    toastEl.style.display = "none";
  }, 1800);
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator) || location.protocol === "file:") return;
  navigator.serviceWorker.register("service-worker.js").catch(() => {});
}

function init() {
  state.station = getInitialStation();
  renderStations();
  renderAmbience();
  setupLocalAudio();
  setupControls();
  // Synthesized ambience needs a user gesture to start the AudioContext.
  document.addEventListener("pointerdown", () => state.audioCtx?.resume());
  setupVisibilityResume();
  setupNavigation();
  setupMediaSession();
  selectStation(state.station.id, false);
  clock();
  setInterval(clock, 1000);
  $("#enter").addEventListener("click", enterSystem);
  registerServiceWorker();
}

init();
