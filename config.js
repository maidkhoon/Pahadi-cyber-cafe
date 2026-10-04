window.PAHADI_CYBER_CAFE_CONFIG = {
  defaultStationId: "mandyali-hits",
  youtube: {
    // Optional YouTube Data API v3 key. When set, YouTube stations search YouTube for songs
    // using their searchQuery. Without it they play the fixed videoIds below. See README.
    apiKey: window.PAHADI_YT_KEY || "",
    playerVars: {
      rel: 0,
      modestbranding: 1,
      playsinline: 1,
      origin: window.location.origin
    }
  },
  // DJ comments: one line shows each time a new song starts (station lines + these common ones).
  djName: "DJ Bittu",
  djCommon: [
    "Chai ka cup uthao, agla gaana aa gaya! ☕",
    "Cyber cafe ka ek ghanta khatam, par gaane abhi baaki hain! 😄",
    "Volume thoda upar karo, mausam bana do! 🔊",
    "Dost ko bhi bulao, saath mein suno! 👬",
    "Pahadon ki hawa aur ye gaana, bas aur kya chahiye! 🏔️",
    "PC number 3 wale bhai, awaaz kam karo... mazaak tha, full bajao! 😂",
    "Rukna mana hai, agla gaana bhi zabardast hai! 🎶",
    "Maggi ban rahi hai, tab tak ye gaana suno! 🍜"
  ],
  // Station list sections, in display order. Each station's `group` picks one.
  stationGroups: [
    { id: "pahadi", title: "🏔️ Pahadi Gaane", note: "Mandi aur Himachal ke gaane", color: "#f4c35a" },
    { id: "live", title: "📴 Live Radio", note: "Phone lock karke bhi chalega", color: "#5fe08a" },
    { id: "more", title: "🎬 Bollywood, Punjabi aur Rap", note: "Har mood ke gaane", color: "#ff7eb6" }
  ],
  stations: [
    {
      id: "mandyali-hits",
      group: "pahadi",
      icon: "🏔️",
      name: "Mandyali Hits",
      description: "Mandi ke naye Mandyali gaane",
      source: "youtube",
      searchQuery: "mandyali songs",
      playlistUrl: "",
      playlistId: "",
      videoIds: ["lm1z5syVSdg", "RH4cMxUzMy0"],
      djComments: [
        "Mandi waalo, haath upar karo! 🙌",
        "Ye gaana Mandi ki galiyon se seedha aapke phone mein! 📲",
        "Sundernagar, Jogindernagar, Sarkaghat, Karsog... sab sun rahe ho na? 😄",
        "Choti Kashi ka pyaar, gaane mein bhar ke! 🔱"
      ]
    },
    {
      id: "pahadi-nati",
      group: "pahadi",
      icon: "💃",
      name: "Pahadi Nati",
      description: "Haath pakdo, gol ghero, Nati shuru!",
      source: "youtube",
      searchQuery: "pahadi nati non stop",
      playlistUrl: "",
      playlistId: "",
      videoIds: ["lm1z5syVSdg", "RH4cMxUzMy0"],
      djComments: [
        "Haath pakdo, gol ghero, Nati shuru! 💃",
        "Shaadi ho ya mela, Nati ke bina sab adhoora! 🎉",
        "Pair ruk nahi rahe na? Hamare bhi nahi! 😄",
        "Kullu wale, Mandi wale, Shimla wale... sab line mein aao! 🕺"
      ]
    },
    {
      id: "pahadi-dance",
      group: "pahadi",
      icon: "🕺",
      name: "Pahadi Dance",
      description: "DJ wale pahadi gaane, full josh",
      source: "youtube",
      searchQuery: "pahadi dj dance song",
      playlistUrl: "",
      playlistId: "",
      videoIds: ["lm1z5syVSdg", "RH4cMxUzMy0"],
      djComments: [
        "DJ wale babu, pahadi beat baja do! 🕺",
        "Ab to naachna padega, koi bahana nahi chalega! 😂",
        "Dhol, nagada aur DJ, teeno ek saath! 🥁",
        "Bass full, mood full, pahad full! 🔊"
      ]
    },
    {
      id: "himachali-rap",
      group: "pahadi",
      icon: "😎",
      name: "Himachali Rap",
      description: "Pahadi swag, pahadi rap",
      source: "youtube",
      searchQuery: "himachali rap song",
      playlistUrl: "",
      playlistId: "",
      videoIds: [],
      djComments: [
        "Pahadi swag on hai! 😎",
        "Pahadi munde bhi rap mein kisi se kam nahi! 🎤",
        "Ye rap sun ke Shimla tak garmi aa jaayegi! 🔥",
        "Topi seedhi karo, rap shuru! 🧢"
      ]
    },
    {
      id: "purane-pahadi",
      group: "pahadi",
      icon: "📻",
      name: "Purane Pahadi Geet",
      description: "Purane gaane, purani yaadein",
      source: "youtube",
      searchQuery: "purane pahadi geet",
      playlistUrl: "",
      playlistId: "",
      videoIds: ["lm1z5syVSdg", "RH4cMxUzMy0"],
      djComments: [
        "Daadi-naani ke zamane ka gaana, aaj bhi utna hi meetha! ❤️",
        "Purani yaadein, nayi chai! ☕",
        "Ye gaana sun ke gaon yaad aa gaya na? 🏡",
        "Radio pe ye gaana aata tha, sab chup ho ke sunte the! 📻"
      ]
    },
    {
      id: "bollywood-live",
      group: "live",
      icon: "📻",
      name: "Bollywood Live",
      description: "Bollywood radio, seedha live",
      // Live radio from radio-browser.info: plays as plain audio, so it keeps going in the background.
      source: "internet",
      search: [{"tag": "bollywood"}],
      djComments: [
        "Ye live radio hai, phone band karo tab bhi bajega! 📴",
        "Bollywood ka masala, non-stop! 🎬",
        "Filmy mood on hai! 🍿"
      ]
    },
    {
      id: "old-is-gold-live",
      group: "live",
      icon: "📼",
      name: "Old Is Gold Live",
      description: "90s ke gaane, live radio pe",
      // Live radio from radio-browser.info: plays as plain audio, so it keeps going in the background.
      source: "internet",
      search: [{"tag": "90s", "countrycode": "IN"}, {"tag": "retro", "countrycode": "IN"}],
      djComments: [
        "Walkman wale din wapas aa gaye! 📼",
        "Ye live radio hai, phone jeb mein rakho aur suno! 📴",
        "Purana gaana, sona gaana! ✨"
      ]
    },
    {
      id: "punjabi-live",
      group: "live",
      icon: "🌾",
      name: "Punjabi Live",
      description: "Punjabi radio, seedha live",
      // Live radio from radio-browser.info: plays as plain audio, so it keeps going in the background.
      source: "internet",
      search: [{"name": "punjabi"}, {"tag": "punjabi"}, {"tag": "bhangra"}],
      djComments: [
        "Balle balle, live radio chalu! 🌾",
        "Phone lock karo, bhangra chalta rahega! 📴",
        "Oye hoye, Punjabi tadka! 🕺"
      ]
    },
    {
      id: "old-is-gold",
      group: "more",
      icon: "📼",
      name: "Old Is Gold",
      description: "90s aur 2000s ke Bollywood gaane",
      source: "youtube",
      searchQuery: "90s bollywood hit songs",
      playlistUrl: "",
      playlistId: "",
      videoIds: [],
      djComments: [
        "Walkman wale din yaad hain? 📼",
        "Cassette ko pencil se ghuma ke rewind karte the, yaad hai? 😄",
        "Ye gaana DD ke Chitrahaar pe aata tha! 📺",
        "Purana gaana, sona gaana. Old is Gold! ✨"
      ]
    },
    {
      id: "punjabi",
      group: "more",
      icon: "🌾",
      name: "Punjabi Hits",
      description: "Balle balle! Punjabi tadka",
      source: "youtube",
      searchQuery: "punjabi hit songs",
      playlistUrl: "",
      playlistId: "",
      videoIds: [],
      djComments: [
        "Balle balle! Punjabi tadka aa gaya! 🌾",
        "Bhangra paao, oye hoye! 🕺",
        "Volume full, bass full, mood full! 🔊",
        "Gaddi mein bajao ya ghar mein, Punjabi gaana har jagah chalta hai! 🚗"
      ]
    },
    {
      id: "desi-rap",
      group: "more",
      icon: "🎤",
      name: "Desi Rap",
      description: "Hindi aur desi rap",
      source: "youtube",
      searchQuery: "desi hip hop hindi rap song",
      playlistUrl: "",
      playlistId: "",
      videoIds: [],
      djComments: [
        "Mic check 1-2, rap shuru! 🎤",
        "Shabd tez, beat bhaari, sambhal ke! 🔥",
        "Ye rapper aaj aag laga raha hai! 🔥",
        "Gully se nikla, dil mein ghusa! 💯"
      ]
    },
    {
      id: "shaadi-special",
      group: "more",
      icon: "💍",
      name: "Shaadi Special",
      description: "Shaadi aur baraat mein bajne wale gaane",
      source: "youtube",
      searchQuery: "shaadi dance songs bollywood",
      playlistUrl: "",
      playlistId: "",
      videoIds: [],
      djComments: [
        "Baraat nikal padi, sab naacho! 💍",
        "Mama ji, ab aapki baari, dance floor pe aao! 😂",
        "Shaadi ka khaana baad mein, pehle naach! 🍛🕺",
        "Dulhe ke dost kahaan ho? Full dance chahiye! 🎉"
      ]
    }
  ],
  ambience: [
    { id: "rain", icon: "🌧", name: "Baarish", file: "assets/audio/rain.mp3" },
    { id: "keyboard", icon: "⌨", name: "Cyber cafe ki khat-khat", file: "assets/audio/keyboard.mp3" },
    { id: "wind", icon: "💨", name: "Pahadi hawa", file: "assets/audio/wind.mp3" },
    { id: "modem", icon: "📞", name: "Purana internet", file: "assets/audio/modem.mp3" }
  ]
};
