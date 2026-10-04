# Pahadi Cyber Café

Internet from the mountains.

This is a mobile-first static site for a fictional Himachal cyber café radio. The site uses the official YouTube IFrame Player API for music and keeps all station data in one configuration file.

## Files

- `index.html` contains the app shell, YouTube player mount point, station list mount point, ambience panel, help (FAQ) section, and mobile navigation.
- `config.js` contains station names, descriptions, playlist IDs, video IDs, accent text, and ambience asset paths.
- `app.js` contains the YouTube player integration, station switching, player state, localStorage preferences, Media Session hooks, and ambience controls.
- `style.css` contains the radio, Himachal mountain, station, and responsive mobile/desktop layout.
- `manifest.json`, `icon.svg`, and `service-worker.js` provide installable PWA support.
- `assets/audio/` is reserved for legal ambience files you own or have permission to use.

## Add YouTube Sources

Edit `config.js`.

Use a playlist:

```js
{
  id: "pahadi-classics",
  name: "Pahadi Classics",
  description: "Classic Himachali/Pahadi music",
  playlistUrl: "https://www.youtube.com/playlist?list=PL_YOUR_PLAYLIST_ID",
  playlistId: "PL_YOUR_PLAYLIST_ID",
  videoIds: []
}
```

You can use only `playlistUrl` if you prefer. The app automatically extracts the playlist ID from the URL.

Or use specific video IDs:

```js
{
  id: "mountain-chill",
  name: "Mountain Chill",
  description: "Relaxed mountain sounds",
  playlistUrl: "",
  playlistId: "",
  videoIds: ["YOUTUBE_VIDEO_ID_1", "YOUTUBE_VIDEO_ID_2"]
}
```

The app uses YouTube's embedded player. It does not download, scrape, convert, proxy, cache, or bypass YouTube audio.

## Stations

Mandyali Hits, Pahadi Nati, Pahadi Dance, Himachali Rap, Purane Pahadi Geet, Old Is Gold,
Punjabi Hits, Desi Rap and Shaadi Special. Music starts when you press "Gaane Suno".

## DJ Comments

Each time a new song starts, "DJ Bittu" shows one short line. Lines come from the station's
`djComments` plus the shared `djCommon` list in `config.js`; edit or add lines there.
Keep them in simple Hinglish.

The page looks and works like a radio. YouTube's terms require its player to stay visible and at least
200x200, so it appears as a small "Pahadi TV" tile. YouTube playback stops when a phone is locked or
the browser is in the background; that is a YouTube/browser limit, not a bug.

## Auto-Fetch Songs From YouTube (optional API key)

Each YouTube station has a `searchQuery`. If `youtube.apiKey` in `config.js` is set, the station
searches YouTube for up to 50 embeddable songs and plays them shuffled; otherwise it plays its fixed `videoIds`.

1. In Google Cloud Console, create a project and enable **YouTube Data API v3**.
2. Create an **API key** and restrict it to **HTTP referrers** (your site's domain, plus `localhost:*` for testing) and to the YouTube Data API v3.
3. Keep the key out of GitHub:
   - **On your computer:** copy `key.example.js` to `key.js` and paste the key there. `key.js` is in `.gitignore`.
   - **On Netlify:** Site configuration → Environment variables → add `YOUTUBE_API_KEY` with the key.
     `netlify.toml` creates `key.js` from it on every deploy.

The key is visible in the browser, so the referrer restriction is what protects it. Each search costs
100 of the free 10,000 daily quota units, so results are cached in the browser for 24 hours per query. With 9 stations, one visitor trying every station uses 900 units, so a busy site will need a quota increase from Google, or fixed `playlistUrl`s (which cost no quota).

## Live Internet Radio Stations

Stations with `source: "internet"` play in the site's own audio player. On selection, the app
fetches live stream URLs from the free [radio-browser.info](https://www.radio-browser.info) directory
(no API key) using the `search` filters, then plays them. Dead streams are skipped automatically,
and ◀◀ / ▶▶ switch streams.

```js
{
  id: "lofi-live",
  icon: "☕",
  name: "Lofi Chai",
  description: "Lofi streams for slow café evenings",
  source: "internet",
  search: { tag: "lofi" },      // any radio-browser search param: tag, name, country, language...
  accent: "Live Internet"
}
```

No internet stations are configured by default (the directory has no Himachali stations), but the
type is supported if you want to add one. Unlike YouTube stations, these keep playing in the background
and with the phone screen locked.

## Add A Station

Add another object to `stations` in `config.js`:

```js
{
  id: "new-station",
  icon: "📻",
  name: "New Station",
  description: "Station description",
  playlistUrl: "https://www.youtube.com/playlist?list=PL_YOUR_PLAYLIST_ID",
  playlistId: "PL_YOUR_PLAYLIST_ID",
  videoIds: [],
  accent: "Cafe Signal"
}
```

The station list updates automatically. Keep all visible text in simple Hinglish.

## Ambience

Place legal local ambience assets here:

```text
assets/audio/rain.mp3
assets/audio/keyboard.mp3
assets/audio/wind.mp3
assets/audio/modem.mp3
```

If a file is missing, the browser generates that sound instead (Web Audio), marked "synthesized".

## Run

Because the site uses a service worker and YouTube embeds, serve it over a local HTTP server:

```bash
python3 -m http.server 4173
```

Then open:

```text
http://localhost:4173
```

## YouTube Limitations

Playback follows YouTube's rules. Some videos or playlists may block embedding, be deleted, be private, show ads, require user interaction, or be unavailable in a region. The site reports those errors with friendly status messages and does not attempt to bypass them.
