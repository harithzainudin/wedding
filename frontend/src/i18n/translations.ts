export type Language = 'ms' | 'en' | 'zh' | 'ta'

export const languageNames: Record<Language, string> = {
  ms: 'BM',
  en: 'EN',
  zh: '中文',
  ta: 'தமிழ்',
}

export interface Translations {
  // Hero Section
  hero: {
    bismillahTranslation: string
    weddingOf: string
  }
  // Details Section
  details: {
    greeting: string
    withGratitude: string
    together: string
    invitation: string
    date: string
    time: string
    venue: string
    dressCode: string
    shareYourMoments: string
    copied: string
  }
  // Schedule Section
  schedule: {
    title: string
  }
  // Contact Section
  contact: {
    title: string
    subtitle: string
    whatsappMessage: string
  }
  // QR Code Section
  qrCode: {
    title: string
    subtitle: string
    download: string
    share: string
    linkCopied: string
    tapToEnlarge: string
  }
  // RSVP Section
  rsvp: {
    title: string
    subtitle: string
    titleLabel: string
    fullName: string
    fullNamePlaceholder: string
    attendance: string
    attending: string
    notAttending: string
    numberOfGuests: string
    guestUnit: string
    phoneNumber: string
    phonePlaceholder: string
    message: string
    messagePlaceholder: string
    submit: string
    submitting: string
    thankYou: string
    responseReceived: string
    prayer: string
    errorName: string
    errorPhone: string
    errorGeneric: string
    // RSVP closed messages
    rsvpClosed: string
    rsvpClosedMessage: string
    rsvpClosedDeadline: string
    // Invitation card
    openInvitation: string
  }
  // Gallery Section
  gallery: {
    title: string
    subtitle: string
    close: string
    previous: string
    next: string
    photoOf: string
    viewAll: string
  }
  // Guestbook Section
  guestbook: {
    title: string
    subtitle: string
    loading: string
    noWishes: string
    errorLoading: string
  }
  // Wishlist Section
  wishlist: {
    title: string
    subtitle: string
    loading: string
    errorLoading: string
    noItems: string
    reserveButton: string
    fullyReserved: string
    viewOnStore: string
    reserveTitle: string
    yourName: string
    yourPhone: string
    namePlaceholder: string
    phonePlaceholder: string
    optionalMessage: string
    messagePlaceholder: string
    submitReserve: string
    submitting: string
    thankYou: string
    reservationReceived: string
    footerNote: string
    needed: string
    close: string
    cancel: string
    tryAgain: string
    // Preview section (home page)
    seeMore: string
    viewAllGifts: string
    more: string
    // Dedicated page
    pageTitle: string
    searchPlaceholder: string
    sortBy: string
    sortDefault: string
    sortPriority: string
    sortAvailability: string
    sortNewest: string
    itemsFound: string
    noResults: string
    clearFilters: string
    viewDetails: string
    categories: {
      all: string
      home: string
      kitchen: string
      electronics: string
      experiences: string
      other: string
    }
  }
  // Navigation
  nav: {
    maps: string
    waze: string
    calendar: string
    weddingInvitation: string
    backToInvitation: string
    // New navigation keys
    navigate: string
    gifts: string
    getDirections: string
    googleMaps: string
    appleMaps: string
    openInApp: string
    bestForIphone: string
  }
  // Common
  common: {
    and: string
    cancel: string
    tapToOpen: string
  }
  // Parking
  parking?: {
    guide: string
    tapToExpand: string
    directions: string
    videoGuide: string
  }
  // QR Code Hub
  qrCodeHub?: {
    title: string
    subtitle: string
    // QR Types
    website: string
    restuDigital: string
    location: string
    wifi: string
    rsvp: string
    calendar: string
    hashtag: string
    // Restu Digital
    restuTagline: string
    bankName: string
    accountName: string
    accountNumber: string
    // Actions
    download: string
    share: string
    close: string
    tapToView: string
    linkCopied: string
  }
  // Wedding Unavailable Page
  weddingUnavailable?: {
    archivedTitle: string
    archivedMessage: string
    draftTitle: string
    draftMessage: string
    notFoundTitle: string
    notFoundMessage: string
    errorTitle: string
    errorMessage: string
  }
  // 404 Not Found Page
  notFound?: {
    title: string
    subtitle: string
    message: string
    goToLogin: string
    goToDashboard: string
    goHome: string
  }
  // Placeholder messages for incomplete data
  placeholder?: {
    coupleInfo: string
    venueInfo: string
    contactInfo: string
    scheduleInfo: string
    giftInfo: string
    galleryInfo: string
    qrHubInfo: string
  }
  // Landing Page
  landing?: {
    // Header
    brandName: string
    features: string
    story: string
    demo: string
    login: string
    // Hero
    heroTitle: string
    heroSubtitle: string
    heroTagline: string
    viewDemo: string
    adminLogin: string
    scrollToExplore: string
    // Story Section
    storyTitle: string
    storySubtitle: string
    storyParagraph1: string
    storyParagraph2: string
    storyParagraph3: string
    storySignature: string
    // Features Section
    featuresTitle: string
    featuresSubtitle: string
    seeAllFeatures: string
    showLess: string
    featureRsvp: string
    featureRsvpDesc: string
    featureGallery: string
    featureGalleryDesc: string
    featureGifts: string
    featureGiftsDesc: string
    featureMusic: string
    featureMusicDesc: string
    featureQrHub: string
    featureQrHubDesc: string
    featureThemes: string
    featureThemesDesc: string
    featureLanguages: string
    featureLanguagesDesc: string
    featureMobile: string
    featureMobileDesc: string
    featureCountdown: string
    featureCountdownDesc: string
    featureParking: string
    featureParkingDesc: string
    featureAdminCms: string
    featureAdminCmsDesc: string
    featureDarkMode: string
    featureDarkModeDesc: string
    // Stats
    statsFeatures: string
    statsLanguages: string
    statsLove: string
    // Demo Section
    demoTitle: string
    demoSubtitle: string
    tryDemo: string
    // Creator Section
    creatorTitle: string
    creatorSubtitle: string
    creatorName: string
    creatorRole: string
    creatorUniversity: string
    creatorQuote: string
    // Footer
    copyright: string
    madeWith: string
    builtBy: string
    forLove: string
  }
}

export const translations: Record<Language, Translations> = {
  // Bahasa Melayu
  ms: {
    hero: {
      bismillahTranslation: 'Dengan Nama Allah Yang Maha Pemurah Lagi Maha Penyayang',
      weddingOf: 'Walimatulurus',
    },
    details: {
      greeting: 'Assalamualaikum Warahmatullahi Wabarakatuh',
      withGratitude: 'Dengan penuh kesyukuran ke hadrat Ilahi, kami',
      together: 'bersama',
      invitation:
        "dengan segala hormatnya menjemput Tan Sri / Puan Sri / Dato' Seri / Datin Seri / Dato' / Datin / Tuan / Puan / Encik / Cik ke majlis perkahwinan puteri/putera kesayangan kami",
      date: 'Tarikh',
      time: 'Masa',
      venue: 'Tempat',
      dressCode: 'Kod Pakaian',
      shareYourMoments: 'Kongsi Momen Anda',
      copied: 'Disalin!',
    },
    schedule: {
      title: 'Aturcara Majlis',
    },
    contact: {
      title: 'Hubungi Kami',
      subtitle: 'Ada pertanyaan? Hubungi kami melalui panggilan atau WhatsApp',
      whatsappMessage: 'Assalamualaikum, saya ingin bertanya mengenai majlis perkahwinan {couple}.',
    },
    qrCode: {
      title: 'Kongsi Jemputan',
      subtitle: 'Imbas kod QR untuk berkongsi jemputan ini',
      download: 'Muat Turun',
      share: 'Kongsi',
      linkCopied: 'Link telah disalin!',
      tapToEnlarge: 'Ketik untuk besarkan',
    },
    rsvp: {
      title: 'RSVP',
      subtitle: 'Sila maklumkan kehadiran anda',
      titleLabel: 'Gelaran',
      fullName: 'Nama Penuh',
      fullNamePlaceholder: 'Nama penuh anda',
      attendance: 'Kehadiran',
      attending: 'Ya, saya akan hadir',
      notAttending: 'Maaf, tidak dapat hadir',
      numberOfGuests: 'Bilangan Tetamu',
      guestUnit: 'orang',
      phoneNumber: 'Nombor Telefon',
      phonePlaceholder: '012-3456789',
      message: 'Ucapan / Doa (Pilihan)',
      messagePlaceholder: 'Tinggalkan ucapan atau doa untuk pengantin...',
      submit: 'Hantar RSVP',
      submitting: 'Menghantar...',
      thankYou: 'Terima Kasih!',
      responseReceived: 'Maklum balas anda telah diterima.',
      prayer:
        '"Ya Allah, berkatilah majlis ini dan kurniakanlah kebahagiaan kepada kedua mempelai. Amin."',
      errorName: 'Sila masukkan nama penuh anda.',
      errorPhone: 'Sila masukkan nombor telefon anda.',
      errorGeneric: 'Maaf, terdapat masalah. Sila cuba lagi.',
      // RSVP closed messages
      rsvpClosed: 'RSVP Ditutup',
      rsvpClosedMessage: 'RSVP untuk majlis ini telah ditutup. Terima kasih atas minat anda.',
      rsvpClosedDeadline: 'Tarikh akhir RSVP telah berlalu pada {date}.',
      // Invitation card
      openInvitation: 'Buka Jemputan',
    },
    gallery: {
      title: 'Galeri Foto',
      subtitle: 'Momen indah bersama kami',
      close: 'Tutup',
      previous: 'Sebelum',
      next: 'Seterusnya',
      photoOf: 'Foto {current} daripada {total}',
      viewAll: 'Lihat Semua Foto',
    },
    guestbook: {
      title: 'Ucapan & Doa',
      subtitle: 'Ucapan dan doa daripada para tetamu',
      loading: 'Memuatkan ucapan...',
      noWishes: 'Belum ada ucapan lagi. Jadilah yang pertama!',
      errorLoading: 'Gagal memuatkan ucapan. Sila cuba lagi.',
    },
    wishlist: {
      title: 'Senarai Hadiah',
      subtitle:
        'Jika anda ingin memberkati kami dengan hadiah, berikut adalah beberapa idea. Kehadiran anda adalah hadiah terbaik!',
      loading: 'Memuatkan senarai...',
      errorLoading: 'Gagal memuatkan senarai. Sila cuba lagi.',
      noItems: 'Tiada hadiah dalam senarai buat masa ini.',
      reserveButton: 'Tempah',
      fullyReserved: 'Ditempah',
      viewOnStore: 'Lihat',
      reserveTitle: 'Tempah Hadiah',
      yourName: 'Nama Anda',
      yourPhone: 'Nombor Telefon',
      namePlaceholder: 'Nama penuh anda',
      phonePlaceholder: '012-3456789',
      optionalMessage: 'Mesej (Pilihan)',
      messagePlaceholder: 'Tinggalkan mesej untuk pengantin...',
      submitReserve: 'Tempah Sekarang',
      submitting: 'Menghantar...',
      thankYou: 'Terima Kasih!',
      reservationReceived: 'Tempahan anda telah diterima.',
      footerNote:
        'Anda bebas memberi sebarang hadiah dari hati - senarai ini hanya untuk mengelakkan pertindihan!',
      needed: 'Penting',
      close: 'Tutup',
      cancel: 'Batal',
      tryAgain: 'Cuba Lagi',
      // Preview section (home page)
      seeMore: 'Lihat Lagi',
      viewAllGifts: 'Lihat Semua Hadiah',
      more: 'lagi',
      // Dedicated page
      pageTitle: 'Senarai Hadiah',
      searchPlaceholder: 'Cari hadiah...',
      sortBy: 'Susun',
      sortDefault: 'Lalai',
      sortPriority: 'Keutamaan',
      sortAvailability: 'Ketersediaan',
      sortNewest: 'Terbaru',
      itemsFound: 'hadiah',
      noResults: 'Tiada hadiah dijumpai.',
      clearFilters: 'Padam penapis',
      viewDetails: 'Lihat Butiran',
      categories: {
        all: 'Semua',
        home: 'Rumah',
        kitchen: 'Dapur',
        electronics: 'Elektronik',
        experiences: 'Pengalaman',
        other: 'Lain-lain',
      },
    },
    nav: {
      maps: 'Maps',
      waze: 'Waze',
      calendar: 'Kalendar',
      weddingInvitation: 'Jemputan Perkahwinan',
      backToInvitation: 'Kembali ke Jemputan',
      navigate: 'Navigasi',
      gifts: 'Hadiah',
      getDirections: 'Dapatkan Arah',
      googleMaps: 'Google Maps',
      appleMaps: 'Apple Maps',
      openInApp: 'Buka dalam aplikasi atau pelayar',
      bestForIphone: 'Terbaik untuk pengguna iPhone',
    },
    common: {
      and: '&',
      cancel: 'Batal',
      tapToOpen: 'Ketik untuk buka',
    },
    parking: {
      guide: 'Panduan Parkir',
      tapToExpand: 'Ketik untuk butiran',
      directions: 'Arah',
      videoGuide: 'Video Panduan',
    },
    qrCodeHub: {
      title: 'QR Hub',
      subtitle: 'Imbas untuk akses pantas',
      website: 'Laman Web',
      restuDigital: 'Restu Digital',
      location: 'Lokasi',
      wifi: 'WiFi',
      rsvp: 'RSVP',
      calendar: 'Kalendar',
      hashtag: 'Hashtag',
      restuTagline: 'Restu anda, walau dalam apa bentuk, amat bermakna',
      bankName: 'Bank',
      accountName: 'Nama Akaun',
      accountNumber: 'Nombor Akaun',
      download: 'Muat Turun',
      share: 'Kongsi',
      close: 'Tutup',
      tapToView: 'Ketik untuk lihat',
      linkCopied: 'Pautan disalin!',
    },
    notFound: {
      title: '404',
      subtitle: 'Halaman Tidak Dijumpai',
      message: 'Maaf, halaman yang anda cari tidak wujud atau telah dialihkan.',
      goToLogin: 'Pergi ke Log Masuk',
      goToDashboard: 'Pergi ke Papan Pemuka',
      goHome: 'Kembali ke Laman Utama',
    },
    placeholder: {
      coupleInfo: 'Maklumat pasangan belum dikemaskini',
      venueInfo: 'Maklumat lokasi akan dikemaskini',
      contactInfo: 'Tiada kenalan ditambah lagi',
      scheduleInfo: 'Jadual akan dikemaskini',
      giftInfo: 'Tiada hadiah dalam senarai buat masa ini',
      galleryInfo: 'Tiada gambar dalam galeri buat masa ini',
      qrHubInfo: 'Tiada QR code diaktifkan buat masa ini',
    },
    landing: {
      // Header
      brandName: 'WeddingApp',
      features: 'Ciri-ciri',
      story: 'Kisah',
      demo: 'Demo',
      login: 'Log Masuk',
      // Hero
      heroTitle: 'Dibina dengan Cinta, Dikodkan dengan Hati',
      heroSubtitle:
        'Laman web jemputan perkahwinan yang lengkap, dibina oleh seorang pembangun yang tidak dapat mencari kad jemputan yang sempurna untuk cintanya.',
      heroTagline: 'Kerana cinta layak mendapat yang terbaik',
      viewDemo: 'Lihat Demo',
      adminLogin: 'Log Masuk Admin',
      scrollToExplore: 'Tatal untuk meneroka',
      // Story Section
      storyTitle: 'Kisah Di Sebalik Kod',
      storySubtitle: 'Mengapa saya membina ini',
      storyParagraph1:
        'Semuanya bermula apabila saya mencari kad jemputan perkahwinan digital yang sempurna untuk hari istimewa kami. Saya mahukan sesuatu yang cantik, boleh disesuaikan sepenuhnya, dan mempunyai semua ciri yang kami perlukan. Tetapi saya tidak menemuinya.',
      storyParagraph2:
        'Jadi, sebagai pembangun, saya melakukan apa yang terbaik — saya membinanya sendiri. Apa yang bermula sebagai projek mudah bertukar menjadi sesuatu yang lebih besar. Setiap ciri, setiap piksel, setiap baris kod ditulis dengan satu orang dalam fikiran: bakal isteri saya.',
      storyParagraph3:
        'Ini bukan sekadar laman web. Ini adalah surat cinta dalam bentuk kod. Bukti bahawa apabila anda membina sesuatu dengan cinta, ia menjadi luar biasa.',
      storySignature: '— Dibina dengan ❤️ oleh Harith Zainudin',
      // Features Section
      featuresTitle: 'Semua Yang Anda Perlukan',
      featuresSubtitle: 'Dimuatkan dengan ciri-ciri yang saya harap wujud dalam perkhidmatan lain',
      seeAllFeatures: 'Lihat semua ciri',
      showLess: 'Tunjuk kurang',
      featureRsvp: 'Pengurusan RSVP',
      featureRsvpDesc: 'Kumpul maklum balas tetamu dengan penjejakan masa nyata dan eksport data',
      featureGallery: 'Galeri Foto',
      featureGalleryDesc:
        'Galeri foto yang cantik dengan susun semula seret-dan-lepas dan paparan skrin penuh',
      featureGifts: 'Pendaftaran Hadiah',
      featureGiftsDesc:
        'Senarai keinginan pintar dengan sistem tempahan untuk mengelakkan hadiah berganda',
      featureMusic: 'Pemain Muzik',
      featureMusicDesc:
        'Muzik latar dengan main automatik, kawalan kelantangan dan sokongan berbilang trek',
      featureQrHub: 'Hab Kod QR',
      featureQrHubDesc: 'Jana kod QR untuk lokasi, WiFi, kalendar, restu digital dan banyak lagi',
      featureThemes: 'Penyesuaian Tema',
      featureThemesDesc: 'Pratetap tema cantik atau cipta sendiri dengan warna dan fon tersuai',
      featureLanguages: '4 Bahasa',
      featureLanguagesDesc:
        'Sokongan untuk Melayu, Inggeris, Mandarin dan Tamil untuk semua tetamu',
      featureMobile: 'Reka Bentuk Responsif',
      featureMobileDesc: 'Pengalaman sempurna di telefon, tablet dan desktop',
      featureCountdown: 'Pemasa Undur',
      featureCountdownDesc:
        'Pemasa undur yang cantik untuk membina keterujaan menjelang hari besar',
      featureParking: 'Panduan Parkir',
      featureParkingDesc:
        'Arahan langkah demi langkah dan panduan video untuk membantu tetamu mencari tempat parkir',
      featureAdminCms: 'CMS Admin',
      featureAdminCmsDesc: 'Panel admin berkuasa untuk mengurus segala-galanya tanpa menyentuh kod',
      featureDarkMode: 'Mod Gelap',
      featureDarkModeDesc: 'Sokong mod gelap sistem untuk tontonan yang selesa pada bila-bila masa',
      // Stats
      statsFeatures: 'Ciri-ciri',
      statsLanguages: 'Bahasa',
      statsLove: 'Cinta',
      // Demo Section
      demoTitle: 'Lihat Sendiri',
      demoSubtitle: 'Alami demo langsung untuk melihat semua ciri dalam aksi',
      tryDemo: 'Cuba Demo Langsung',
      // Creator Section
      creatorTitle: 'Bertemu Pembangunnya',
      creatorSubtitle: 'Orang di sebalik kod',
      creatorName: 'Harith Zainudin',
      creatorRole: 'Pembangun Cloud & Pencipta',
      creatorUniversity: 'Alumni Sains Komputer & Teknologi Maklumat, Universiti Putra Malaysia',
      creatorQuote:
        '"Saya membina ini untuk cinta saya, yang akan menjadi isteri saya. Setiap baris kod adalah surat cinta, setiap ciri adalah janji. Ini adalah cara saya menunjukkan betapa saya menyayanginya."',
      // Footer
      copyright: 'Hak cipta terpelihara',
      madeWith: 'Dibuat dengan',
      builtBy: 'Dibina oleh',
      forLove: 'untuk cinta',
    },
  },

  // English
  en: {
    hero: {
      bismillahTranslation: 'In the Name of Allah, the Most Gracious, the Most Merciful',
      weddingOf: 'The Wedding of',
    },
    details: {
      greeting: 'Assalamualaikum Warahmatullahi Wabarakatuh',
      withGratitude: 'With gratitude to the Almighty, we',
      together: 'together with',
      invitation:
        "cordially invite Tan Sri / Puan Sri / Dato' Seri / Datin Seri / Dato' / Datin / Tuan / Puan / Encik / Cik to the wedding celebration of our beloved",
      date: 'Date',
      time: 'Time',
      venue: 'Venue',
      dressCode: 'Dress Code',
      shareYourMoments: 'Share Your Moments',
      copied: 'Copied!',
    },
    schedule: {
      title: 'Event Schedule',
    },
    contact: {
      title: 'Contact Us',
      subtitle: 'Have questions? Get in touch via call or WhatsApp',
      whatsappMessage: "Hello, I would like to inquire about {couple}'s wedding.",
    },
    qrCode: {
      title: 'Share Invitation',
      subtitle: 'Scan QR code to share this invitation',
      download: 'Download',
      share: 'Share',
      linkCopied: 'Link copied!',
      tapToEnlarge: 'Tap to enlarge',
    },
    rsvp: {
      title: 'RSVP',
      subtitle: 'Please confirm your attendance',
      titleLabel: 'Title',
      fullName: 'Full Name',
      fullNamePlaceholder: 'Your full name',
      attendance: 'Attendance',
      attending: 'Yes, I will attend',
      notAttending: 'Sorry, I cannot attend',
      numberOfGuests: 'Number of Guests',
      guestUnit: 'person(s)',
      phoneNumber: 'Phone Number',
      phonePlaceholder: '012-3456789',
      message: 'Message / Prayer (Optional)',
      messagePlaceholder: 'Leave a message or prayer for the couple...',
      submit: 'Submit RSVP',
      submitting: 'Submitting...',
      thankYou: 'Thank You!',
      responseReceived: 'Your response has been received.',
      prayer: '"O Allah, bless this union and grant happiness to the newlyweds. Amin."',
      errorName: 'Please enter your full name.',
      errorPhone: 'Please enter your phone number.',
      errorGeneric: 'Sorry, there was an error. Please try again.',
      // RSVP closed messages
      rsvpClosed: 'RSVPs Closed',
      rsvpClosedMessage: 'RSVPs for this event are now closed. Thank you for your interest.',
      rsvpClosedDeadline: 'The RSVP deadline has passed on {date}.',
      // Invitation card
      openInvitation: 'Open Invitation',
    },
    gallery: {
      title: 'Photo Gallery',
      subtitle: 'Beautiful moments with us',
      close: 'Close',
      previous: 'Previous',
      next: 'Next',
      photoOf: 'Photo {current} of {total}',
      viewAll: 'View All Photos',
    },
    guestbook: {
      title: 'Wishes & Prayers',
      subtitle: 'Wishes and prayers from our guests',
      loading: 'Loading wishes...',
      noWishes: 'No wishes yet. Be the first!',
      errorLoading: 'Failed to load wishes. Please try again.',
    },
    wishlist: {
      title: 'Gift Wishlist',
      subtitle:
        "If you'd like to bless us with a gift, here are some ideas. Your presence is the greatest gift!",
      loading: 'Loading wishlist...',
      errorLoading: 'Failed to load wishlist. Please try again.',
      noItems: 'No gifts in the wishlist at the moment.',
      reserveButton: 'Reserve',
      fullyReserved: 'Reserved',
      viewOnStore: 'View',
      reserveTitle: 'Reserve Gift',
      yourName: 'Your Name',
      yourPhone: 'Phone Number',
      namePlaceholder: 'Your full name',
      phonePlaceholder: '012-3456789',
      optionalMessage: 'Message (Optional)',
      messagePlaceholder: 'Leave a message for the couple...',
      submitReserve: 'Reserve Now',
      submitting: 'Submitting...',
      thankYou: 'Thank You!',
      reservationReceived: 'Your reservation has been received.',
      footerNote:
        'Feel free to give any gift from the heart - this list is just to help avoid duplicates!',
      needed: 'Needed',
      close: 'Close',
      cancel: 'Cancel',
      tryAgain: 'Try Again',
      // Preview section (home page)
      seeMore: 'See More',
      viewAllGifts: 'View All Gifts',
      more: 'more',
      // Dedicated page
      pageTitle: 'Gift Registry',
      searchPlaceholder: 'Search gifts...',
      sortBy: 'Sort by',
      sortDefault: 'Default',
      sortPriority: 'Priority',
      sortAvailability: 'Availability',
      sortNewest: 'Newest',
      itemsFound: 'items',
      noResults: 'No gifts found matching your criteria.',
      clearFilters: 'Clear filters',
      viewDetails: 'View Details',
      categories: {
        all: 'All',
        home: 'Home',
        kitchen: 'Kitchen',
        electronics: 'Electronics',
        experiences: 'Experiences',
        other: 'Other',
      },
    },
    nav: {
      maps: 'Maps',
      waze: 'Waze',
      calendar: 'Calendar',
      weddingInvitation: 'Wedding Invitation',
      backToInvitation: 'Back to Invitation',
      navigate: 'Navigate',
      gifts: 'Gifts',
      getDirections: 'Get Directions',
      googleMaps: 'Google Maps',
      appleMaps: 'Apple Maps',
      openInApp: 'Open in app or browser',
      bestForIphone: 'Best for iPhone users',
    },
    common: {
      and: '&',
      cancel: 'Cancel',
      tapToOpen: 'Tap to open',
    },
    parking: {
      guide: 'Parking Guide',
      tapToExpand: 'Tap for details',
      directions: 'Directions',
      videoGuide: 'Video Guide',
    },
    qrCodeHub: {
      title: 'QR Hub',
      subtitle: 'Scan for quick access',
      website: 'Website',
      restuDigital: 'Digital Blessing',
      location: 'Location',
      wifi: 'WiFi',
      rsvp: 'RSVP',
      calendar: 'Calendar',
      hashtag: 'Hashtag',
      restuTagline: 'Your blessing, in whatever form, means so much',
      bankName: 'Bank',
      accountName: 'Account Name',
      accountNumber: 'Account Number',
      download: 'Download',
      share: 'Share',
      close: 'Close',
      tapToView: 'Tap to view',
      linkCopied: 'Link copied!',
    },
    notFound: {
      title: '404',
      subtitle: 'Page Not Found',
      message: 'Sorry, the page you are looking for does not exist or has been moved.',
      goToLogin: 'Go to Login',
      goToDashboard: 'Go to Dashboard',
      goHome: 'Back to Home',
    },
    placeholder: {
      coupleInfo: 'Couple information not provided yet',
      venueInfo: 'Venue details coming soon',
      contactInfo: 'No contacts added yet',
      scheduleInfo: 'Schedule coming soon',
      giftInfo: 'No gifts in the wishlist yet',
      galleryInfo: 'No photos in the gallery yet',
      qrHubInfo: 'No QR codes enabled yet',
    },
    landing: {
      // Header
      brandName: 'WeddingApp',
      features: 'Features',
      story: 'Story',
      demo: 'Demo',
      login: 'Login',
      // Hero
      heroTitle: 'Built with Love, Coded with Heart',
      heroSubtitle:
        "A full-fledged wedding invitation website, crafted by a developer who couldn't find the perfect invitation for his love.",
      heroTagline: 'Because love deserves the best',
      viewDemo: 'View Demo',
      adminLogin: 'Admin Login',
      scrollToExplore: 'Scroll to explore',
      // Story Section
      storyTitle: 'The Story Behind the Code',
      storySubtitle: 'Why I built this',
      storyParagraph1:
        "It all started when I was searching for the perfect digital wedding invitation for our special day. I wanted something beautiful, fully customizable, and with all the features we needed. But I couldn't find it.",
      storyParagraph2:
        'So, as a developer, I did what I do best — I built it myself. What started as a simple project turned into something much bigger. Every feature, every pixel, every line of code was written with one person in mind: my future wife.',
      storyParagraph3:
        "This isn't just a website. It's a love letter in code. A testament that when you build something with love, it becomes extraordinary.",
      storySignature: '— Built with ❤️ by Harith Zainudin',
      // Features Section
      featuresTitle: 'Everything You Need',
      featuresSubtitle: 'Packed with features I wished existed in other services',
      seeAllFeatures: 'See all features',
      showLess: 'Show less',
      featureRsvp: 'RSVP Management',
      featureRsvpDesc: 'Collect guest responses with real-time tracking and data export',
      featureGallery: 'Photo Gallery',
      featureGalleryDesc:
        'Beautiful photo gallery with drag-and-drop reordering and fullscreen view',
      featureGifts: 'Gift Registry',
      featureGiftsDesc: 'Smart wishlist with reservation system to avoid duplicate gifts',
      featureMusic: 'Music Player',
      featureMusicDesc: 'Background music with autoplay, volume control, and multi-track support',
      featureQrHub: 'QR Code Hub',
      featureQrHubDesc: 'Generate QR codes for location, WiFi, calendar, digital blessings & more',
      featureThemes: 'Theme Customization',
      featureThemesDesc: 'Beautiful theme presets or create your own with custom colors and fonts',
      featureLanguages: '4 Languages',
      featureLanguagesDesc: 'Support for Malay, English, Mandarin, and Tamil for all your guests',
      featureMobile: 'Responsive Design',
      featureMobileDesc: 'Perfect experience on phones, tablets, and desktops',
      featureCountdown: 'Countdown Timer',
      featureCountdownDesc: 'Beautiful countdown timer to build excitement for the big day',
      featureParking: 'Parking Guide',
      featureParkingDesc: 'Step-by-step directions and video guides to help guests find parking',
      featureAdminCms: 'Admin CMS',
      featureAdminCmsDesc: 'Powerful admin panel to manage everything without touching code',
      featureDarkMode: 'Dark Mode',
      featureDarkModeDesc: 'System dark mode support for comfortable viewing anytime',
      // Stats
      statsFeatures: 'Features',
      statsLanguages: 'Languages',
      statsLove: 'Love',
      // Demo Section
      demoTitle: 'See It In Action',
      demoSubtitle: 'Experience a live demo to see all features in action',
      tryDemo: 'Try Live Demo',
      // Creator Section
      creatorTitle: 'Meet the Creator',
      creatorSubtitle: 'The person behind the code',
      creatorName: 'Harith Zainudin',
      creatorRole: 'Cloud Developer & Creator',
      creatorUniversity:
        'Computer Science & Information Technology Alumni, Universiti Putra Malaysia',
      creatorQuote:
        '"I built this for my love, who will become my wife. Every line of code is a love letter, every feature is a promise. This is my way of showing how much I love her."',
      // Footer
      copyright: 'All rights reserved',
      madeWith: 'Made with',
      builtBy: 'Built by',
      forLove: 'for love',
    },
  },

  // Mandarin (Chinese)
  zh: {
    hero: {
      bismillahTranslation: '奉至仁至慈的真主之名',
      weddingOf: '婚礼邀请',
    },
    details: {
      greeting: '愿真主的平安与祝福与您同在',
      withGratitude: '感谢真主的恩典，我们',
      together: '与',
      invitation:
        "诚挚邀请 Tan Sri / Puan Sri / Dato' Seri / Datin Seri / Dato' / Datin / Tuan / Puan / Encik / Cik 出席我们爱子/爱女的婚礼",
      date: '日期',
      time: '时间',
      venue: '地点',
      dressCode: '着装要求',
      shareYourMoments: '分享精彩时刻',
      copied: '已复制！',
    },
    schedule: {
      title: '活动流程',
    },
    contact: {
      title: '联系我们',
      subtitle: '有疑问？请致电或通过WhatsApp联系我们',
      whatsappMessage: "Hello, I would like to inquire about {couple}'s wedding.",
    },
    qrCode: {
      title: '分享邀请函',
      subtitle: '扫描二维码分享此邀请函',
      download: '下载',
      share: '分享',
      linkCopied: '链接已复制！',
      tapToEnlarge: '点击放大',
    },
    rsvp: {
      title: '回复出席',
      subtitle: '请确认您的出席',
      titleLabel: '称谓',
      fullName: '全名',
      fullNamePlaceholder: '您的全名',
      attendance: '出席确认',
      attending: '是的，我会出席',
      notAttending: '抱歉，无法出席',
      numberOfGuests: '宾客人数',
      guestUnit: '人',
      phoneNumber: '电话号码',
      phonePlaceholder: '012-3456789',
      message: '祝福语（选填）',
      messagePlaceholder: '为新人留下祝福...',
      submit: '提交回复',
      submitting: '提交中...',
      thankYou: '谢谢！',
      responseReceived: '已收到您的回复。',
      prayer: '"愿真主祝福这场婚礼，赐予新人幸福美满。阿敏。"',
      errorName: '请输入您的全名。',
      errorPhone: '请输入您的电话号码。',
      errorGeneric: '抱歉，发生错误。请重试。',
      // RSVP closed messages
      rsvpClosed: '回复已关闭',
      rsvpClosedMessage: '此活动的回复已关闭。感谢您的关注。',
      rsvpClosedDeadline: '回复截止日期已于 {date} 过期。',
      // Invitation card
      openInvitation: '打开邀请函',
    },
    gallery: {
      title: '照片集',
      subtitle: '与我们共度的美好时光',
      close: '关闭',
      previous: '上一张',
      next: '下一张',
      photoOf: '第 {current} 张，共 {total} 张',
      viewAll: '查看全部照片',
    },
    guestbook: {
      title: '祝福留言',
      subtitle: '来自宾客的祝福与祈祷',
      loading: '加载祝福中...',
      noWishes: '暂无祝福。成为第一位留言者！',
      errorLoading: '加载祝福失败。请重试。',
    },
    wishlist: {
      title: '礼物清单',
      subtitle: '如果您想送我们礼物，以下是一些建议。您的出席就是最好的礼物！',
      loading: '加载清单中...',
      errorLoading: '加载清单失败。请重试。',
      noItems: '目前清单中没有礼物。',
      reserveButton: '预订',
      fullyReserved: '已预订',
      viewOnStore: '查看',
      reserveTitle: '预订礼物',
      yourName: '您的姓名',
      yourPhone: '电话号码',
      namePlaceholder: '您的全名',
      phonePlaceholder: '012-3456789',
      optionalMessage: '留言（选填）',
      messagePlaceholder: '为新人留言...',
      submitReserve: '立即预订',
      submitting: '提交中...',
      thankYou: '谢谢！',
      reservationReceived: '已收到您的预订。',
      footerNote: '欢迎送任何来自心意的礼物 - 此清单只是为了避免重复！',
      needed: '需要',
      close: '关闭',
      cancel: '取消',
      tryAgain: '重试',
      // Preview section (home page)
      seeMore: '查看更多',
      viewAllGifts: '查看所有礼物',
      more: '更多',
      // Dedicated page
      pageTitle: '礼物清单',
      searchPlaceholder: '搜索礼物...',
      sortBy: '排序',
      sortDefault: '默认',
      sortPriority: '优先级',
      sortAvailability: '可用性',
      sortNewest: '最新',
      itemsFound: '件礼物',
      noResults: '未找到符合条件的礼物。',
      clearFilters: '清除筛选',
      viewDetails: '查看详情',
      categories: {
        all: '全部',
        home: '家居',
        kitchen: '厨房',
        electronics: '电子产品',
        experiences: '体验',
        other: '其他',
      },
    },
    nav: {
      maps: '地图',
      waze: 'Waze',
      calendar: '日历',
      weddingInvitation: '婚礼邀请',
      backToInvitation: '返回邀请函',
      navigate: '导航',
      gifts: '礼物',
      getDirections: '获取路线',
      googleMaps: '谷歌地图',
      appleMaps: '苹果地图',
      openInApp: '在应用或浏览器中打开',
      bestForIphone: '最适合iPhone用户',
    },
    common: {
      and: '&',
      cancel: '取消',
      tapToOpen: '点击打开',
    },
    parking: {
      guide: '停车指南',
      tapToExpand: '点击查看详情',
      directions: '路线指引',
      videoGuide: '视频指南',
    },
    qrCodeHub: {
      title: '二维码中心',
      subtitle: '扫描快速访问',
      website: '网站',
      restuDigital: '数码祝福',
      location: '位置',
      wifi: 'WiFi',
      rsvp: '出席确认',
      calendar: '日历',
      hashtag: '标签',
      restuTagline: '您的祝福，无论以何种形式，都意义非凡',
      bankName: '银行',
      accountName: '账户名',
      accountNumber: '账号',
      download: '下载',
      share: '分享',
      close: '关闭',
      tapToView: '点击查看',
      linkCopied: '链接已复制！',
    },
    notFound: {
      title: '404',
      subtitle: '页面未找到',
      message: '抱歉，您要查找的页面不存在或已被移动。',
      goToLogin: '前往登录',
      goToDashboard: '前往仪表板',
      goHome: '返回首页',
    },
    placeholder: {
      coupleInfo: '新人信息尚未提供',
      venueInfo: '场地详情即将公布',
      contactInfo: '尚未添加联系人',
      scheduleInfo: '日程安排即将公布',
      giftInfo: '礼物清单暂无内容',
      galleryInfo: '相册暂无照片',
      qrHubInfo: '暂无启用的二维码',
    },
    landing: {
      // Header
      brandName: 'WeddingApp',
      features: '功能特点',
      story: '故事',
      demo: '演示',
      login: '登录',
      // Hero
      heroTitle: '用爱构建，用心编码',
      heroSubtitle: '一个完整的婚礼请柬网站，由一位找不到完美请柬的开发者为他的爱人打造。',
      heroTagline: '因为爱值得最好的',
      viewDemo: '查看演示',
      adminLogin: '管理员登录',
      scrollToExplore: '滚动探索',
      // Story Section
      storyTitle: '代码背后的故事',
      storySubtitle: '为什么我要建造这个',
      storyParagraph1:
        '一切始于我为我们的特别日子寻找完美的数字婚礼请柬。我想要美丽、完全可定制、并具有我们需要的所有功能。但我找不到。',
      storyParagraph2:
        '所以，作为一名开发者，我做了我最擅长的事——自己建造它。一个简单的项目变成了更大的东西。每一个功能，每一个像素，每一行代码都是为一个人写的：我未来的妻子。',
      storyParagraph3:
        '这不仅仅是一个网站。这是用代码写的情书。证明当你用爱建造某物时，它会变得非凡。',
      storySignature: '— 由 Harith Zainudin 用 ❤️ 构建',
      // Features Section
      featuresTitle: '您所需的一切',
      featuresSubtitle: '包含我希望其他服务有的功能',
      seeAllFeatures: '查看所有功能',
      showLess: '显示更少',
      featureRsvp: '宾客回复管理',
      featureRsvpDesc: '实时追踪收集宾客回复，支持数据导出',
      featureGallery: '照片画廊',
      featureGalleryDesc: '精美照片画廊，支持拖拽排序和全屏查看',
      featureGifts: '礼物登记',
      featureGiftsDesc: '智能心愿单，带预订系统避免重复礼物',
      featureMusic: '音乐播放器',
      featureMusicDesc: '背景音乐自动播放，音量控制，多曲目支持',
      featureQrHub: '二维码中心',
      featureQrHubDesc: '生成位置、WiFi、日历、数字祝福等二维码',
      featureThemes: '主题定制',
      featureThemesDesc: '精美主题预设或自定义颜色和字体',
      featureLanguages: '4种语言',
      featureLanguagesDesc: '支持马来语、英语、中文和泰米尔语',
      featureMobile: '响应式设计',
      featureMobileDesc: '在手机、平板和电脑上都有完美体验',
      featureCountdown: '倒计时器',
      featureCountdownDesc: '精美倒计时器，为大日子营造期待感',
      featureParking: '停车指南',
      featureParkingDesc: '逐步指引和视频指南帮助宾客找到停车位',
      featureAdminCms: '管理后台',
      featureAdminCmsDesc: '强大的管理面板，无需代码即可管理一切',
      featureDarkMode: '深色模式',
      featureDarkModeDesc: '支持系统深色模式，随时舒适浏览',
      // Stats
      statsFeatures: '功能',
      statsLanguages: '语言',
      statsLove: '爱',
      // Demo Section
      demoTitle: '亲身体验',
      demoSubtitle: '体验现场演示，查看所有功能',
      tryDemo: '试用演示',
      // Creator Section
      creatorTitle: '认识创作者',
      creatorSubtitle: '代码背后的人',
      creatorName: 'Harith Zainudin',
      creatorRole: '云开发工程师 & 创作者',
      creatorUniversity: '计算机科学与信息技术校友，马来西亚博特拉大学',
      creatorQuote:
        '"我为我的爱人建造了这个，她将成为我的妻子。每一行代码都是情书，每一个功能都是承诺。这是我表达对她爱意的方式。"',
      // Footer
      copyright: '版权所有',
      madeWith: '用',
      builtBy: '由',
      forLove: '为爱而建',
    },
  },

  // Tamil
  ta: {
    hero: {
      bismillahTranslation: 'அருளாளனும் அன்புடையோனுமாகிய அல்லாஹ்வின் திருப்பெயரால்',
      weddingOf: 'திருமண விழா',
    },
    details: {
      greeting: 'அஸ்ஸலாமு அலைக்கும் வரஹ்மதுல்லாஹி வபரகாத்துஹு',
      withGratitude: 'இறைவனுக்கு நன்றியுடன், நாங்கள்',
      together: 'உடன்',
      invitation:
        "Tan Sri / Puan Sri / Dato' Seri / Datin Seri / Dato' / Datin / Tuan / Puan / Encik / Cik அவர்களை எங்கள் அன்பு மகன்/மகளின் திருமண விழாவிற்கு அன்புடன் அழைக்கிறோம்",
      date: 'தேதி',
      time: 'நேரம்',
      venue: 'இடம்',
      dressCode: 'ஆடை குறியீடு',
      shareYourMoments: 'உங்கள் தருணங்களைப் பகிரவும்',
      copied: 'நகலெடுக்கப்பட்டது!',
    },
    schedule: {
      title: 'நிகழ்ச்சி அட்டவணை',
    },
    contact: {
      title: 'எங்களை தொடர்பு கொள்ள',
      subtitle: 'கேள்விகள் உள்ளதா? அழைப்பு அல்லது WhatsApp மூலம் தொடர்பு கொள்ளவும்',
      whatsappMessage: "Hello, I would like to inquire about {couple}'s wedding.",
    },
    qrCode: {
      title: 'அழைப்பிதழைப் பகிரவும்',
      subtitle: 'இந்த அழைப்பிதழைப் பகிர QR குறியீட்டை ஸ்கேன் செய்யவும்',
      download: 'பதிவிறக்கம்',
      share: 'பகிர்',
      linkCopied: 'இணைப்பு நகலெடுக்கப்பட்டது!',
      tapToEnlarge: 'பெரிதாக்க தட்டவும்',
    },
    rsvp: {
      title: 'RSVP',
      subtitle: 'உங்கள் வருகையை உறுதிப்படுத்தவும்',
      titleLabel: 'பட்டம்',
      fullName: 'முழுப் பெயர்',
      fullNamePlaceholder: 'உங்கள் முழுப் பெயர்',
      attendance: 'வருகை',
      attending: 'ஆம், நான் வருவேன்',
      notAttending: 'மன்னிக்கவும், வர இயலாது',
      numberOfGuests: 'விருந்தினர் எண்ணிக்கை',
      guestUnit: 'நபர்',
      phoneNumber: 'தொலைபேசி எண்',
      phonePlaceholder: '012-3456789',
      message: 'செய்தி / பிரார்த்தனை (விருப்பம்)',
      messagePlaceholder: 'தம்பதியருக்கு வாழ்த்துக்களை விடுங்கள்...',
      submit: 'சமர்ப்பிக்கவும்',
      submitting: 'சமர்ப்பிக்கிறது...',
      thankYou: 'நன்றி!',
      responseReceived: 'உங்கள் பதில் பெறப்பட்டது.',
      prayer:
        '"அல்லாஹ், இந்த திருமணத்தை ஆசீர்வதித்து புதுமணத் தம்பதிகளுக்கு மகிழ்ச்சியை வழங்குவாயாக. ஆமீன்."',
      errorName: 'உங்கள் முழுப் பெயரை உள்ளிடவும்.',
      errorPhone: 'உங்கள் தொலைபேசி எண்ணை உள்ளிடவும்.',
      errorGeneric: 'மன்னிக்கவும், பிழை ஏற்பட்டது. மீண்டும் முயற்சிக்கவும்.',
      // RSVP closed messages
      rsvpClosed: 'பதில் மூடப்பட்டது',
      rsvpClosedMessage: 'இந்த நிகழ்வுக்கான பதில்கள் மூடப்பட்டன. உங்கள் ஆர்வத்திற்கு நன்றி.',
      rsvpClosedDeadline: 'பதில் கடைசி தேதி {date} அன்று முடிந்தது.',
      // Invitation card
      openInvitation: 'அழைப்பிதழைத் திறக்கவும்',
    },
    gallery: {
      title: 'புகைப்பட தொகுப்பு',
      subtitle: 'எங்களுடன் இனிய தருணங்கள்',
      close: 'மூடு',
      previous: 'முந்தைய',
      next: 'அடுத்த',
      photoOf: 'படம் {current} / {total}',
      viewAll: 'அனைத்து படங்களையும் காண',
    },
    guestbook: {
      title: 'வாழ்த்துக்கள்',
      subtitle: 'விருந்தினர்களின் வாழ்த்துக்களும் பிரார்த்தனைகளும்',
      loading: 'வாழ்த்துக்களை ஏற்றுகிறது...',
      noWishes: 'இன்னும் வாழ்த்துக்கள் இல்லை. முதல் நபராக இருங்கள்!',
      errorLoading: 'வாழ்த்துக்களை ஏற்ற முடியவில்லை. மீண்டும் முயற்சிக்கவும்.',
    },
    wishlist: {
      title: 'பரிசு பட்டியல்',
      subtitle:
        'எங்களுக்கு பரிசு கொடுக்க விரும்பினால், இங்கே சில யோசனைகள். உங்கள் வருகையே சிறந்த பரிசு!',
      loading: 'பட்டியலை ஏற்றுகிறது...',
      errorLoading: 'பட்டியலை ஏற்ற முடியவில்லை. மீண்டும் முயற்சிக்கவும்.',
      noItems: 'தற்போது பட்டியலில் பரிசுகள் இல்லை.',
      reserveButton: 'முன்பதிவு',
      fullyReserved: 'முன்பதிவு செய்யப்பட்டது',
      viewOnStore: 'பார்',
      reserveTitle: 'பரிசை முன்பதிவு செய்',
      yourName: 'உங்கள் பெயர்',
      yourPhone: 'தொலைபேசி எண்',
      namePlaceholder: 'உங்கள் முழுப் பெயர்',
      phonePlaceholder: '012-3456789',
      optionalMessage: 'செய்தி (விருப்பம்)',
      messagePlaceholder: 'தம்பதியருக்கு செய்தி விடுங்கள்...',
      submitReserve: 'இப்போது முன்பதிவு செய்',
      submitting: 'சமர்ப்பிக்கிறது...',
      thankYou: 'நன்றி!',
      reservationReceived: 'உங்கள் முன்பதிவு பெறப்பட்டது.',
      footerNote:
        'இதயத்திலிருந்து எந்த பரிசும் கொடுக்கலாம் - இப்பட்டியல் நகல்களை தவிர்க்க மட்டுமே!',
      needed: 'தேவை',
      close: 'மூடு',
      cancel: 'ரத்து',
      tryAgain: 'மீண்டும் முயற்சிக்கவும்',
      // Preview section (home page)
      seeMore: 'மேலும் பார்',
      viewAllGifts: 'அனைத்து பரிசுகளையும் பார்',
      more: 'மேலும்',
      // Dedicated page
      pageTitle: 'பரிசு பட்டியல்',
      searchPlaceholder: 'பரிசுகளை தேடு...',
      sortBy: 'வரிசைப்படுத்து',
      sortDefault: 'இயல்புநிலை',
      sortPriority: 'முன்னுரிமை',
      sortAvailability: 'கிடைக்கும்',
      sortNewest: 'புதியது',
      itemsFound: 'பொருட்கள்',
      noResults: 'உங்கள் தேடலுக்கு பொருந்தும் பரிசுகள் இல்லை.',
      clearFilters: 'வடிப்பான்களை அழி',
      viewDetails: 'விவரங்களைக் காண்க',
      categories: {
        all: 'அனைத்தும்',
        home: 'வீடு',
        kitchen: 'சமையலறை',
        electronics: 'மின்னணு',
        experiences: 'அனுபவங்கள்',
        other: 'மற்றவை',
      },
    },
    nav: {
      maps: 'வரைபடம்',
      waze: 'Waze',
      calendar: 'நாட்காட்டி',
      weddingInvitation: 'திருமண அழைப்பிதழ்',
      backToInvitation: 'அழைப்பிதழுக்குத் திரும்பு',
      navigate: 'வழிசெலுத்து',
      gifts: 'பரிசுகள்',
      getDirections: 'வழிகளைப் பெறுங்கள்',
      googleMaps: 'கூகுள் மேப்ஸ்',
      appleMaps: 'ஆப்பிள் மேப்ஸ்',
      openInApp: 'ஆப் அல்லது உலாவியில் திறக்கவும்',
      bestForIphone: 'ஐபோன் பயனர்களுக்கு சிறந்தது',
    },
    common: {
      and: '&',
      cancel: 'ரத்துசெய்',
      tapToOpen: 'திறக்க தட்டவும்',
    },
    parking: {
      guide: 'பார்க்கிங் வழிகாட்டி',
      tapToExpand: 'விவரங்களுக்கு தட்டவும்',
      directions: 'திசைகள்',
      videoGuide: 'வீடியோ வழிகாட்டி',
    },
    qrCodeHub: {
      title: 'QR மையம்',
      subtitle: 'விரைவான அணுகலுக்கு ஸ்கேன் செய்யவும்',
      website: 'இணையதளம்',
      restuDigital: 'டிஜிட்டல் ஆசீர்வாதம்',
      location: 'இடம்',
      wifi: 'WiFi',
      rsvp: 'RSVP',
      calendar: 'நாட்காட்டி',
      hashtag: 'ஹேஷ்டேக்',
      restuTagline: 'உங்கள் ஆசீர்வாதம், எந்த வடிவத்தில் இருந்தாலும், மிகவும் மதிப்புக்குரியது',
      bankName: 'வங்கி',
      accountName: 'கணக்கு பெயர்',
      accountNumber: 'கணக்கு எண்',
      download: 'பதிவிறக்கம்',
      share: 'பகிர்',
      close: 'மூடு',
      tapToView: 'பார்க்க தட்டவும்',
      linkCopied: 'இணைப்பு நகலெடுக்கப்பட்டது!',
    },
    notFound: {
      title: '404',
      subtitle: 'பக்கம் காணப்படவில்லை',
      message: 'மன்னிக்கவும், நீங்கள் தேடும் பக்கம் இல்லை அல்லது நகர்த்தப்பட்டுள்ளது.',
      goToLogin: 'உள்நுழைவுக்கு செல்',
      goToDashboard: 'டாஷ்போர்டுக்கு செல்',
      goHome: 'முகப்புக்கு திரும்பு',
    },
    placeholder: {
      coupleInfo: 'தம்பதியினர் தகவல் இன்னும் வழங்கப்படவில்லை',
      venueInfo: 'இடம் விவரங்கள் விரைவில்',
      contactInfo: 'தொடர்புகள் இன்னும் சேர்க்கப்படவில்லை',
      scheduleInfo: 'அட்டவணை விரைவில்',
      giftInfo: 'பரிசுப் பட்டியல் இன்னும் காலியாக உள்ளது',
      galleryInfo: 'கேலரியில் புகைப்படங்கள் இன்னும் இல்லை',
      qrHubInfo: 'QR குறியீடுகள் இன்னும் இயக்கப்படவில்லை',
    },
    landing: {
      // Header
      brandName: 'WeddingApp',
      features: 'அம்சங்கள்',
      story: 'கதை',
      demo: 'டெமோ',
      login: 'உள்நுழை',
      // Hero
      heroTitle: 'அன்புடன் கட்டமைக்கப்பட்டது, இதயத்துடன் குறியிடப்பட்டது',
      heroSubtitle:
        'தனது காதலிக்கு சரியான அழைப்பிதழ் கண்டுபிடிக்க முடியாத ஒரு டெவலப்பரால் உருவாக்கப்பட்ட முழுமையான திருமண அழைப்பிதழ் வலைத்தளம்.',
      heroTagline: 'ஏனெனில் அன்பு சிறந்ததற்கு தகுதியானது',
      viewDemo: 'டெமோ பார்',
      adminLogin: 'நிர்வாக உள்நுழைவு',
      scrollToExplore: 'ஆராய உருட்டவும்',
      // Story Section
      storyTitle: 'குறியீட்டின் பின்னணி கதை',
      storySubtitle: 'நான் இதை ஏன் உருவாக்கினேன்',
      storyParagraph1:
        'எங்கள் சிறப்பு நாளுக்கு சரியான டிஜிட்டல் திருமண அழைப்பிதழைத் தேடியபோது எல்லாம் தொடங்கியது. அழகான, முழுமையாக தனிப்பயனாக்கக்கூடிய, எங்களுக்குத் தேவையான அனைத்து அம்சங்களும் கொண்ட ஒன்றை நான் விரும்பினேன். ஆனால் என்னால் கண்டுபிடிக்க முடியவில்லை.',
      storyParagraph2:
        'எனவே, ஒரு டெவலப்பராக, நான் சிறந்ததைச் செய்தேன் — நானே உருவாக்கினேன். ஒரு எளிய திட்டம் பெரிய ஒன்றாக மாறியது. ஒவ்வொரு அம்சமும், ஒவ்வொரு பிக்சலும், ஒவ்வொரு குறியீடும் ஒரு நபரை மனதில் கொண்டு எழுதப்பட்டது: என் எதிர்கால மனைவி.',
      storyParagraph3:
        'இது வெறும் வலைத்தளம் அல்ல. இது குறியீட்டில் எழுதப்பட்ட காதல் கடிதம். நீங்கள் அன்புடன் எதையாவது உருவாக்கும்போது, அது அசாதாரணமாகிறது என்பதற்கான சான்று.',
      storySignature: '— Harith Zainudin ❤️ உடன் உருவாக்கியது',
      // Features Section
      featuresTitle: 'உங்களுக்கு தேவையான அனைத்தும்',
      featuresSubtitle: 'மற்ற சேவைகளில் இருக்க வேண்டும் என்று நான் விரும்பிய அம்சங்கள்',
      seeAllFeatures: 'அனைத்து அம்சங்களையும் பார்க்க',
      showLess: 'குறைவாக காட்டு',
      featureRsvp: 'RSVP நிர்வாகம்',
      featureRsvpDesc:
        'நிகழ்நேர கண்காணிப்பு மற்றும் தரவு ஏற்றுமதியுடன் விருந்தினர் பதில்களை சேகரிக்கவும்',
      featureGallery: 'புகைப்பட தொகுப்பு',
      featureGalleryDesc:
        'இழுத்து-விடு மறுவரிசைப்படுத்தல் மற்றும் முழுத்திரை காட்சியுடன் அழகான புகைப்பட தொகுப்பு',
      featureGifts: 'பரிசு பதிவு',
      featureGiftsDesc: 'நகல் பரிசுகளைத் தவிர்க்க முன்பதிவு அமைப்புடன் ஸ்மார்ட் விஷ்லிஸ்ட்',
      featureMusic: 'இசை பிளேயர்',
      featureMusicDesc: 'தானியங்கி இயக்கம், ஒலி கட்டுப்பாடு மற்றும் பல டிராக் ஆதரவுடன் பின்னணி இசை',
      featureQrHub: 'QR குறியீடு மையம்',
      featureQrHubDesc:
        'இடம், WiFi, காலண்டர், டிஜிட்டல் ஆசீர்வாதம் மற்றும் பலவற்றிற்கு QR குறியீடுகள்',
      featureThemes: 'தீம் தனிப்பயனாக்கம்',
      featureThemesDesc:
        'அழகான தீம் முன்னமைவுகள் அல்லது தனிப்பயன் வண்ணங்கள் மற்றும் எழுத்துருக்களுடன் உங்கள் சொந்தத்தை உருவாக்குங்கள்',
      featureLanguages: '4 மொழிகள்',
      featureLanguagesDesc: 'மலாய், ஆங்கிலம், மாண்டரின் மற்றும் தமிழ் ஆதரவு',
      featureMobile: 'பதிலளிக்கக்கூடிய வடிவமைப்பு',
      featureMobileDesc: 'தொலைபேசிகள், டேப்லெட்டுகள் மற்றும் டெஸ்க்டாப்களில் சரியான அனுபவம்',
      featureCountdown: 'கவுண்ட்டவுன் டைமர்',
      featureCountdownDesc: 'பெரிய நாளுக்கான எதிர்பார்ப்பை உருவாக்க அழகான கவுண்ட்டவுன் டைமர்',
      featureParking: 'பார்க்கிங் வழிகாட்டி',
      featureParkingDesc:
        'விருந்தினர்கள் பார்க்கிங் கண்டுபிடிக்க படிப்படியான வழிமுறைகள் மற்றும் வீடியோ வழிகாட்டிகள்',
      featureAdminCms: 'நிர்வாக CMS',
      featureAdminCmsDesc: 'குறியீடு தொடாமல் எல்லாவற்றையும் நிர்வகிக்க சக்திவாய்ந்த நிர்வாக பேனல்',
      featureDarkMode: 'இருண்ட பயன்முறை',
      featureDarkModeDesc: 'எந்த நேரத்திலும் வசதியான பார்வைக்கு கணினி இருண்ட பயன்முறை ஆதரவு',
      // Stats
      statsFeatures: 'அம்சங்கள்',
      statsLanguages: 'மொழிகள்',
      statsLove: 'அன்பு',
      // Demo Section
      demoTitle: 'செயலில் பாருங்கள்',
      demoSubtitle: 'அனைத்து அம்சங்களையும் செயலில் பார்க்க நேரடி டெமோவை அனுபவியுங்கள்',
      tryDemo: 'நேரடி டெமோ முயற்சிக்கவும்',
      // Creator Section
      creatorTitle: 'படைப்பாளரை சந்தியுங்கள்',
      creatorSubtitle: 'குறியீட்டின் பின்னால் உள்ள நபர்',
      creatorName: 'Harith Zainudin',
      creatorRole: 'கிளவுட் டெவலப்பர் & படைப்பாளர்',
      creatorUniversity:
        'கணினி அறிவியல் & தகவல் தொழில்நுட்பம் முன்னாள் மாணவர், உனிவர்சிட்டி புத்ரா மலேசியா',
      creatorQuote:
        '"என் காதலிக்காக இதை உருவாக்கினேன், அவள் என் மனைவியாவாள். ஒவ்வொரு குறியீடும் ஒரு காதல் கடிதம், ஒவ்வொரு அம்சமும் ஒரு வாக்குறுதி. அவளை எவ்வளவு நேசிக்கிறேன் என்பதை காட்ட இது என் வழி."',
      // Footer
      copyright: 'அனைத்து உரிமைகளும் பாதுகாக்கப்பட்டவை',
      madeWith: 'உருவாக்கப்பட்டது',
      builtBy: 'உருவாக்கியவர்',
      forLove: 'அன்புக்காக',
    },
  },
}

// ==========================================
// Admin Translations (English & Malay only)
// ==========================================

export type AdminLanguage = 'en' | 'ms'

export const adminLanguageNames: Record<AdminLanguage, string> = {
  en: 'EN',
  ms: 'BM',
}

export interface AdminTranslations {
  // Common UI elements
  common: {
    save: string
    saving: string
    cancel: string
    delete: string
    edit: string
    add: string
    close: string
    loading: string
    refresh: string
    tryAgain: string
    settings: string
    submit: string
    submitting: string
    update: string
    yes: string
    no: string
    confirm: string
    viewSite: string
    superAdmin: string
    logout: string
    actions: string
    saveChanges: string
    saveSettings: string
    resetChanges: string
    saveAllChanges: string
    selected: string
    discard: string
    enabled: string
    disabled: string
    compressing: string
    backToSuperAdmin: string
    clearFilters: string
    dismiss: string
  }

  // Authentication
  auth: {
    adminLogin: string
    username: string
    password: string
    enterUsername: string
    enterPassword: string
    login: string
    loggingIn: string
    masterHint: string
    changePassword: string
    currentPassword: string
    newPassword: string
    confirmPassword: string
    enterCurrentPassword: string
    enterNewPassword: string
    confirmNewPassword: string
    passwordMinLength: string
    changingPassword: string
    passwordChanged: string
    passwordChangedSuccessMessage: string
    passwordChangeRequired: string
    passwordExpiredMessage: string
    setPassword: string
    settingPassword: string
  }

  // Navigation tabs
  nav: {
    dashboard: string
    wedding: string
    venue: string
    schedule: string
    gallery: string
    music: string
    gifts: string
    theme: string
    design: string
    contacts: string
    rsvps: string
    qrHub: string
    adminSettings: string
  }

  // Header
  header: {
    title: string
    subtitle: string
    profileSettings: string
    masterAccount: string
    darkMode: string
    viewLiveSite: string
  }

  // Dashboard
  dashboard: {
    title: string
    subtitle: string
    loadingDashboard: string
    totalRsvps: string
    attending: string
    totalGuests: string
    galleryPhotos: string
    quickActions: string
    refreshStats: string
    weddingDetails: string
    coupleEventInfo: string
    locationSettings: string
    eventTimeline: string
    managePhotos: string
    contactPeople: string
    guestResponses: string
    // Setup Progress Card
    setupProgress: string
    setupComplete: string
    setupItems: {
      weddingDetails: string
      weddingDetailsComplete: string
      weddingDetailsIncomplete: string
      weddingDetailsCoupleIncomplete: string
      weddingDetailsParentsIncomplete: string
      weddingDetailsDressCodeIncomplete: string
      weddingDetailsHashtagIncomplete: string
      venue: string
      venueComplete: string
      venueIncomplete: string
      venueNameIncomplete: string
      venueAddressIncomplete: string
      venueLocationIncomplete: string
      contacts: string
      contactsComplete: string
      contactsIncomplete: string
      contactsDisabled: string
      schedule: string
      scheduleComplete: string
      scheduleIncomplete: string
      scheduleDisabled: string
      gallery: string
      galleryComplete: string
      galleryIncomplete: string
      galleryDisabled: string
      theme: string
      themeComplete: string
      themeDefault: string
      themeIncomplete: string
      music: string
      musicComplete: string
      musicIncomplete: string
      musicDisabled: string
      gifts: string
      giftsComplete: string
      giftsIncomplete: string
      giftsDisabled: string
      qrHub: string
      qrHubComplete: string
      qrHubIncomplete: string
      qrHubDisabled: string
      rsvps: string
      rsvpsComplete: string
      rsvpsIncomplete: string
      rsvpsDisabled: string
      rsvpsClosed: string
    }
  }

  // RSVPs
  rsvps: {
    title: string
    totalRsvps: string
    attending: string
    notAttending: string
    totalGuests: string
    filterAll: string
    filterAttending: string
    filterNotAttending: string
    addGuest: string
    exportCsv: string
    loadingRsvps: string
    noRsvps: string
    addFirstGuest: string
    manual: string
    guests: string
    noPhoneProvided: string
    deleteGuest: string
    deleteGuestConfirm: string
    // Form
    formTitleAdd: string
    formTitleEdit: string
    titleLabel: string
    titleLabelOptional: string
    noTitle: string
    fullName: string
    enterFullName: string
    nameTooShort: string
    phoneNumber: string
    attendance: string
    attendingLabel: string
    notAttendingLabel: string
    numberOfGuests: string
    guestsRange: string
    message: string
    messageOptional: string
    wishesPlaceholder: string
    savingGuest: string
    pressEscToClose: string
    // Settings
    showRsvpSection: string
    showRsvpDesc: string
    acceptRsvps: string
    acceptRsvpsDesc: string
    acceptRsvpsDisabledHint: string
    rsvpDeadline: string
    rsvpDeadlineDesc: string
    noDeadline: string
    clearDeadline: string
    deadlineAfterEventError: string
    rsvpDisabled: string
    rsvpClosed: string
  }

  // Gallery
  gallery: {
    title: string
    imagesCount: string
    slotsRemaining: string
    loadingGallery: string
    noImages: string
    uploadFirst: string
    maxReached: string
    galleryHelp: string
    deleteImage: string
    deleteImageConfirm: string
    gallerySettings: string
    maxImages: string
    compression: string
    uploadImages: string
    dragDrop: string
    dragDropImages: string
    upToSize: string
    showGallerySection: string
    showGalleryDesc: string
    maxFileSize: string
    allowedFormats: string
    imagesLabel: string
    lastUpdatedBy: string
    dragToReorder: string
    tapToMoveOrView: string
    limitsReadOnly: string
  }

  // Gifts
  gifts: {
    title: string
    itemsCount: string
    reserved: string
    viewGifts: string
    viewReservations: string
    addGift: string
    editGift: string
    registryStatus: string
    visibleToGuests: string
    hiddenFromGuests: string
    loadingGifts: string
    noGifts: string
    noGiftsHint: string
    addFirstGift: string
    needed: string
    cardView: string
    listView: string
    // Categories
    categoryHome: string
    categoryKitchen: string
    categoryElectronics: string
    categoryExperiences: string
    categoryOther: string
    // Priority
    priorityNone: string
    priorityHigh: string
    priorityMedium: string
    priorityLow: string
    // Reservations
    totalReservations: string
    itemsReserved: string
    uniqueGuests: string
    noReservations: string
    guest: string
    phone: string
    gift: string
    date: string
    // Form
    image: string
    chooseImage: string
    nameEnglish: string
    nameMalay: string
    descriptionEnglish: string
    descriptionMalay: string
    externalLink: string
    priceRange: string
    priceRangePlaceholder: string
    category: string
    priority: string
    quantity: string
    quantityHint: string
    notes: string
    notesPlaceholder: string
    // Settings
    giftSettings: string
    maxItems: string
    maxImageSize: string
    settingsAutoSave: string
    showGiftsSection: string
    showGiftsDesc: string
    // Delete
    deleteGift: string
    deleteGiftConfirm: string
    // Default gifts
    browseDefaults: string
    defaultGifts: string
    selectDefaults: string
    defaultGiftsHint: string
    addSelectedGifts: string
    selectedCount: string
    alreadyInRegistry: string
    addingGifts: string
    addingProgress: string
    giftsAddedSuccess: string
    noDuplicatesFound: string
    addError: string
    selectAtLeastOne: string
    limitReached: string
    limitReachedTooltip: string
    limitReachedBanner: string
    selectionLimitReached: string
    // Discard selection confirmation
    discardSelectionTitle: string
    discardSelectionMessage: string
    discardSelectionConfirm: string
    discardSelectionCancel: string
    // Search
    searchGifts: string
    giftsFound: string
    noSearchResults: string
    tryDifferentSearch: string
    // Limits (read-only for wedding admin)
    limitsReadOnly: string
    // View modes
    expandAll: string
    collapseAll: string
    // Mobile filter toggle
    filters: string
    // Sorting
    sortBy: string
    sortCustomOrder: string
    sortPriority: string
    sortNameAsc: string
    sortNameDesc: string
    sortCategory: string
    sortAvailability: string
    sortMostReserved: string
    sortNewest: string
    sortOldest: string
    dragDisabledHint: string
    // Selection mode / Bulk delete
    select: string
    selectAll: string
    deselectAll: string
    deleteSelected: string
    exitSelection: string
    bulkDeleteTitle: string
    reservationsWarning: string
    reservationCount: string
    deleteAll: string
    deleteOnlyUnreserved: string
    noReservationsSelected: string
  }

  // Music
  music: {
    title: string
    tracksCount: string
    slotsRemaining: string
    loadingMusic: string
    noTracks: string
    uploadFirst: string
    maxReached: string
    deleteTrack: string
    deleteTrackConfirm: string
    musicSettings: string
    maxTracks: string
    autoPlay: string
    clickToUpload: string
    orDragAndDrop: string
    formatInfo: string
    filesToUpload: string
    trackTitle: string
    artistOptional: string
    trackTitlePlaceholder: string
    artistPlaceholder: string
    uploadTracks: string
    enableMusic: string
    enableMusicDesc: string
    autoplay: string
    autoplayDesc: string
    playMode: string
    singleTrack: string
    playlist: string
    singleTrackDesc: string
    playlistDesc: string
    shuffle: string
    shuffleDesc: string
    loop: string
    loopSingleDesc: string
    loopPlaylistDesc: string
    defaultVolume: string
    autoplayNote: string
    selectTrack: string
    selectedTrack: string
    noTrackSelected: string
    playlistDragToReorder: string
    stopPreview: string
    unknownArtist: string
    // Music Library
    browseLibrary: string
    libraryEmpty: string
    addFromLibrary: string
    alreadyAdded: string
    addedFromLibrary: string
    trackFromLibrary: string
  }

  // Music Library (Super Admin)
  musicLibrary: {
    title: string
    description: string
    addTrack: string
    editTrack: string
    deleteTrack: string
    trackTitle: string
    artist: string
    category: string
    categories: {
      romantic: string
      celebration: string
      classical: string
      traditional: string
      modern: string
      instrumental: string
      other: string
    }
    uploadTrack: string
    noTracksYet: string
    uploadFirst: string
    deleteConfirm: string
    deleteWarning: string
    deleteWarningInUse: string
    selectReplacement: string
    replacementRequired: string
    usedByWeddings: string
    tracksCount: string
    duration: string
    license: string
    licenseType: string
    licenseTypes: {
      free: string
      cc0: string
      ccBy: string
      ccBySa: string
      ccByNc: string
      royaltyFree: string
      purchased: string
      custom: string
    }
    sourceUrl: string
    sourceUrlHint: string
    attributionPreview: string
    // Search and filter
    searchPlaceholder: string
    filterAll: string
    noResults: string
  }

  // Wedding Details
  wedding: {
    title: string
    subtitle: string
    loadingDetails: string
    coupleInfo: string
    coupleInfoDesc: string
    fullName: string
    fullNamePlaceholder: string
    nickname: string
    nicknamePlaceholder: string
    bride: string
    groom: string
    nameDisplayOrder: string
    nameDisplayOrderDesc: string
    brideFirst: string
    brideFirstDesc: string
    groomFirst: string
    groomFirstDesc: string
    bismillah: string
    bismillahDesc: string
    showTranslation: string
    showTranslationDesc: string
    traditionalStyles: string
    ornateStyles: string
    modernStyles: string
    previewing: string
    bismillahMeaning: string
    parentsInfo: string
    parentsVisibilityDesc: string
    brideParents: string
    groomParents: string
    fatherName: string
    fatherNamePlaceholder: string
    motherName: string
    motherNamePlaceholder: string
    showBrideParents: string
    showBrideParentsDesc: string
    showGroomParents: string
    showGroomParentsDesc: string
    eventDetails: string
    eventDetailsDesc: string
    eventStartDateTime: string
    eventEndDateTime: string
    dressCode: string
    dressCodePlaceholder: string
    showDressCode: string
    showDressCodeDesc: string
    displayFormat: string
    displayFormatSettings: string
    displayFormatDesc: string
    preview: string
    noDateTimeDisplayed: string
    customOptions: string
    showDate: string
    showDayOfWeek: string
    showStartTime: string
    showEndTime: string
    timeFormatLabel: string
    time12Hour: string
    time24Hour: string
    advancedFormat: string
    advancedFormatDesc: string
    dateFormatLabel: string
    dateFormatPlaceholder: string
    timeFormatPlaceholder: string
    formatTokens: string
    dateTokens: string
    timeTokens: string
    presetDateTimeRange: string
    presetDateStartOnly: string
    presetDateOnly: string
    presetFullDetails: string
    presetCustom: string
    websiteDetails: string
    websiteDetailsDesc: string
    hashtag: string
    hashtagPlaceholder: string
    showHashtag: string
    showHashtagDesc: string
    savedSuccess: string
    unsavedChanges: string
    lastUpdated: string
  }

  // Venue/Location
  venue: {
    title: string
    subtitle: string
    loadingVenue: string
    venueName: string
    venueNamePlaceholder: string
    address: string
    addressPlaceholder: string
    coordinates: string
    coordinatesFromMap: string
    latitude: string
    longitude: string
    parking: string
    parkingInfo: string
    parkingInfoPlaceholder: string
    parkingImages: string
    showParkingImages: string
    parkingDirections: string
    showParkingDirections: string
    parkingVideo: string
    showParkingVideo: string
    parkingVideoUrl: string
    addParkingStep: string
    remove: string
    savedSuccess: string
    unsavedChanges: string
    selectLocation: string
    venueDetails: string
    // Map picker
    searchLocation: string
    searchPlaceholder: string
    typeAtLeast3Chars: string
    searchingFor: string
    locationsFound: string
    locationFound: string
    noLocationsFound: string
    tryDifferentSearch: string
    clickMapOrDragMarker: string
    // Form
    required: string
    optional: string
    characters: string
    fillRequiredFields: string
    // Preview
    previewTitle: string
    howGuestsWillSee: string
    venueLabel: string
    addressLabel: string
    parkingLabel: string
    enterDetailsToPreview: string
    testNavigationLinks: string
    googleMaps: string
    waze: string
    // Parking form
    showOnWebsite: string
    uploadParkingPhotosDesc: string
    maxImagesReached: string
    directionsTitle: string
    step: string
    steps: string
    addDirectionsDesc: string
    enterDirectionPlaceholder: string
    addStep: string
    maxStepsAllowed: string
    videoGuide: string
    added: string
    addVideoDesc: string
    validYoutubeUrl: string
    // Direction icons
    iconNoIcon: string
    iconGoStraight: string
    iconTurnLeft: string
    iconTurnRight: string
    iconLandmark: string
    iconParking: string
    iconEntrance: string
  }

  // Schedule
  schedule: {
    title: string
    subtitle: string
    loadingSchedule: string
    showScheduleSection: string
    showScheduleDesc: string
    addItem: string
    editItem: string
    deleteItem: string
    time: string
    timePlaceholder: string
    eventTitle: string
    noItems: string
    savedSuccess: string
    deleteItemConfirm: string
    clearAll: string
    clearAllConfirm: string
    clearAllSuccess: string
  }

  // Contacts
  contacts: {
    title: string
    subtitle: string
    loadingContacts: string
    addContact: string
    editContact: string
    deleteContact: string
    contactName: string
    contactNamePlaceholder: string
    phoneNumber: string
    role: string
    rolePlaceholder: string
    noContacts: string
    savedSuccess: string
    deleteContactConfirm: string
    showContactsSection: string
    showContactsDesc: string
  }

  // Theme
  theme: {
    title: string
    subtitle: string
    loadingTheme: string
    selectTheme: string
    preview: string
    customize: string
    customColors: string
    primaryColor: string
    secondaryColor: string
    accentColor: string
    savedSuccess: string
    unsavedChanges: string
    previewModeActive: string
    cancelPreview: string
    presetThemes: string
    customTheme: string
    customThemeDescription: string
    saveTheme: string
    // Customizer
    themeName: string
    myCustomTheme: string
    lightModeColors: string
    darkModeColors: string
    fonts: string
    selectFontPairing: string
    currentSelection: string
    headingFont: string
    bodyFont: string
    // Light mode color labels
    primary: string
    primaryDesc: string
    primaryLight: string
    primaryLightDesc: string
    primaryDark: string
    primaryDarkDesc: string
    secondary: string
    secondaryDesc: string
    secondaryDark: string
    secondaryDarkDesc: string
    text: string
    textDesc: string
    textLight: string
    textLightDesc: string
    background: string
    backgroundDesc: string
    // Dark mode color labels
    backgroundSecondary: string
    backgroundSecondaryDesc: string
    backgroundElevated: string
    backgroundElevatedDesc: string
    border: string
    borderDesc: string
    textSecondary: string
    textSecondaryDesc: string
    darkModeText: string
    darkModeTextDesc: string
    // Preset theme names (10 themes)
    earthyMinimalist: string
    earthyMinimalistDesc: string
    romanticBlush: string
    romanticBlushDesc: string
    elegantClassic: string
    elegantClassicDesc: string
    modernBold: string
    modernBoldDesc: string
    gardenFresh: string
    gardenFreshDesc: string
    rusticCharm: string
    rusticCharmDesc: string
    oceanBreeze: string
    oceanBreezeDesc: string
    lavenderDream: string
    lavenderDreamDesc: string
    midnightLuxe: string
    midnightLuxeDesc: string
    sunsetGlow: string
    sunsetGlowDesc: string
  }

  // Design/Layout
  design: {
    title: string
    subtitle: string
    layoutSelection: string
    sectionOrder: string
    sectionOrderHint: string
    resetOrder: string
    animationSpeed: string
    preview: string
    saveDesign: string
    savedSuccess: string
    alwaysFirst: string
    // Layout-specific settings
    invitationCardSettings: string
    showCoupleNames: string
    showWeddingDate: string
    autoOpenDelay: string
    slideshowSettings: string
    showDots: string
    showArrows: string
    autoPlay: string
    autoPlayInterval: string
    storybookSettings: string
    showPageNumbers: string
    // Background features
    backgroundFeatures: string
    backgroundFeaturesHint: string
    backgroundMusic: string
    backgroundMusicDescription: string
    // Empty content warnings
    emptyGallery: string
    emptySchedule: string
    emptyWishlist: string
    emptyMusic: string
  }

  // Hero Background
  heroBackground: {
    title: string
    subtitle: string
    mediaType: string
    none: string
    image: string
    video: string
    uploadMode: string
    singleUpload: string
    singleUploadDesc: string
    separateUpload: string
    separateUploadDesc: string
    universalBackground: string
    universalRecommend: string
    desktopBackground: string
    desktopRecommend: string
    mobileBackground: string
    mobileRecommend: string
    clickToUpload: string
    uploadDesktop: string
    uploadMobile: string
    overlaySettings: string
    enableOverlay: string
    overlayHelp: string
    overlayColor: string
    overlayOpacity: string
    resolution: string
    size: string
    format: string
    aspectRatio: string
    confirmDelete: string
    uploading: string
    deleting: string
    pleaseWait: string
    hiddenMediaTitle: string
    hiddenMediaDesc: string
    hiddenMediaHint: string
    switchModeConfirm: string
  }

  // QR Hub
  qrHub: {
    title: string
    subtitle: string
    loadingSettings: string
    saveSettings: string
    savedSuccess: string
    configure: string
    close: string
    // QR Types
    websiteTitle: string
    websiteSubtitle: string
    restuDigitalTitle: string
    restuDigitalSubtitle: string
    locationTitle: string
    locationSubtitle: string
    wifiTitle: string
    wifiSubtitle: string
    rsvpTitle: string
    rsvpSubtitle: string
    calendarTitle: string
    calendarSubtitle: string
    hashtagTitle: string
    hashtagSubtitle: string
    hashtagNote: string
    // Location Apps
    googleMapsOnly: string
    wazeOnly: string
    googleMapsAndWaze: string
    // WiFi Encryption
    wpaRecommended: string
    wep: string
    noPassword: string
    // Warnings
    uploadOrDisable: string
    fillBankDetails: string
    enterWifiSsid: string
    passwordVisibleWarning: string
    // Digital Blessing Config
    digitalBlessingConfig: string
    taglineMessage: string
    qrDisplayMethod: string
    uploadQrImage: string
    enterBankDetails: string
    qrImageFromBank: string
    uploading: string
    uploadImage: string
    bankName: string
    accountHolderName: string
    accountNumber: string
    // WiFi Config
    wifiConfiguration: string
    networkNameSsid: string
    password: string
    encryptionType: string
    hiddenNetwork: string
    // Location Config
    locationConfiguration: string
    navigationApp: string
    locationFromVenue: string
    // Hub Status
    qrHubStatus: string
    qrHubVisible: string
    qrHubHidden: string
    hubDisabledInfo: string
    showQrHubSection: string
    showQrHubDesc: string
  }

  // Admin Settings (Master user)
  adminUsers: {
    title: string
    addAdmin: string
    createNewAdmin: string
    email: string
    emailOptional: string
    emailHint: string
    enterUsername: string
    enterPassword: string
    enterEmail: string
    creating: string
    loadingAdmins: string
    noAdmins: string
    createFirst: string
    createdBy: string
    resetPassword: string
    deleteAdmin: string
    deleteConfirm: string
    resetConfirm: string
    adminCreated: string
    adminCreatedTitle: string
    adminCreatedMessage: string
    emailSentNote: string
    emailSendFailed: string
    temporaryPassword: string
  }

  // Profile
  profile: {
    title: string
    username: string
    email: string
    save: string
    updateSuccess: string
    loadingProfile: string
    usernameCannotChange: string
    emailPlaceholder: string
    emailRecoveryHint: string
    profileUpdated: string
  }

  // Modals
  modals: {
    confirmDelete: string
    actionCannotBeUndone: string
    unsavedChanges: string
    discardChanges: string
    pleaseWait: string
  }

  // Loading Overlay
  loadingOverlay: {
    loading: string
    saving: string
    deleting: string
    uploading: string
    processing: string
    success: string
    workingOnIt: string
    almostThere: string
    justAMoment: string
    processing2: string
  }

  // Toast notifications
  toast: {
    // Success messages
    archiveSuccess: string
    deleteSuccess: string
    createSuccess: string
    updateSuccess: string
    addOwnerSuccess: string
    removeOwnerSuccess: string
    resetPasswordSuccess: string
    addStaffSuccess: string
    updateStaffSuccess: string
    deleteStaffSuccess: string
    // Error messages
    genericError: string
  }

  // Hard Delete
  hardDelete: {
    title: string
    warningMessage: string
    loadingPreview: string
    deletionSummary: string
    rsvps: string
    images: string
    music: string
    gifts: string
    parking: string
    qrCodes: string
    files: string
    noDataToDelete: string
    confirmInstruction: string
    deleteButton: string
    deleting: string
    successMessage: string
  }

  // Messages
  messages: {
    saveSuccess: string
    saveFailed: string
    deleteSuccess: string
    deleteFailed: string
    uploadSuccess: string
    uploadFailed: string
    loadFailed: string
    networkError: string
    lastUpdated: string
    by: string
    unsavedChanges: string
    savedSuccess: string
  }

  // Staff Management (Super Admin)
  staff: {
    title: string
    description: string
    addStaff: string
    editStaff: string
    deleteStaff: string
    username: string
    email: string
    password: string
    managingWeddings: string
    noWeddings: string
    noStaffYet: string
    createFirst: string
    deleteConfirm: string
    deleteWarning: string
    createdAt: string
    // Assignment modal
    assignStaff: string
    createClient: string
    noAssignment: string
    noAssignmentDesc: string
    selectStaff: string
    selectStaffPlaceholder: string
    clientDetails: string
    roleLabel: string
    roleLabelPlaceholder: string
    bride: string
    groom: string
    parent: string
    other: string
    // Search and filter
    searchPlaceholder: string
    filterAll: string
    filterWithWeddings: string
    filterNoWeddings: string
    noResults: string
  }

  // Super Admin (upload limits in settings modal)
  superAdmin: {
    uploadLimits: string
    galleryLimits: string
    giftLimits: string
    // Search and filter for weddings
    searchPlaceholder: string
    filterAll: string
    filterActive: string
    filterArchived: string
    filterDraft: string
    noResults: string
  }

  // Super Admin Settings
  superAdminSettings: {
    title: string
    description: string
    // Change Password Section
    changePassword: string
    changePasswordDesc: string
    currentPassword: string
    newPassword: string
    confirmPassword: string
    passwordMinLength: string
    passwordsDoNotMatch: string
    passwordSameAsCurrent: string
    passwordChanged: string
    changingPassword: string
    // Manage Super Admins Section (master only)
    manageSuperAdmins: string
    manageSuperAdminsDesc: string
    noOtherAdmins: string
    resetPassword: string
    resetPasswordConfirm: string
    resetPasswordWarning: string
    noEmail: string
    createdAt: string
    // Tab label
    settingsTab: string
  }

  // Wedding context bar
  weddingContext: {
    switchWedding: string
    selectWedding: string
    statusActive: string
    statusDraft: string
    statusArchived: string
    loading: string
    errorLoading: string
    noWeddingSelected: string
  }

  // Unsaved changes detection
  unsavedChanges: {
    title: string
    message: string
    saveAndContinue: string
    discard: string
    stay: string
    saving: string
    saveError: string
    changesSaved: string
  }
}

// String interpolation helper
export function interpolate(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => String(values[key] ?? ''))
}

export const adminTranslations: Record<AdminLanguage, AdminTranslations> = {
  en: {
    common: {
      save: 'Save',
      saving: 'Saving...',
      cancel: 'Cancel',
      delete: 'Delete',
      edit: 'Edit',
      add: 'Add',
      close: 'Close',
      loading: 'Loading...',
      refresh: 'Refresh',
      tryAgain: 'Try Again',
      settings: 'Settings',
      submit: 'Submit',
      submitting: 'Submitting...',
      update: 'Update',
      yes: 'Yes',
      no: 'No',
      confirm: 'Confirm',
      viewSite: 'View Site',
      superAdmin: 'Super Admin',
      logout: 'Logout',
      actions: 'Actions',
      saveChanges: 'Save Changes',
      saveSettings: 'Save Settings',
      resetChanges: 'Reset Changes',
      saveAllChanges: 'Save All Changes',
      selected: 'Selected',
      discard: 'Discard',
      enabled: 'Enabled',
      disabled: 'Disabled',
      compressing: 'Compressing...',
      backToSuperAdmin: 'Back to Super Admin',
      clearFilters: 'Clear filters',
      dismiss: 'Dismiss',
    },

    auth: {
      adminLogin: 'Your Wedding Hub',
      username: 'Username',
      password: 'Password',
      enterUsername: 'Enter username',
      enterPassword: 'Enter password',
      login: 'Login',
      loggingIn: 'Logging in...',
      masterHint: 'Use "master" as username with the master password for initial setup.',
      changePassword: 'Change Password',
      currentPassword: 'Current Password',
      newPassword: 'New Password',
      confirmPassword: 'Confirm New Password',
      enterCurrentPassword: 'Enter current password',
      enterNewPassword: 'Enter new password',
      confirmNewPassword: 'Confirm new password',
      passwordMinLength: 'Password must be at least 6 characters.',
      changingPassword: 'Changing...',
      passwordChanged: 'Password Changed',
      passwordChangedSuccessMessage: 'Your password has been updated successfully.',
      passwordChangeRequired: 'Password Change Required',
      passwordExpiredMessage: 'Your password has expired. Please set a new one to continue.',
      setPassword: 'Set Password',
      settingPassword: 'Setting...',
    },

    nav: {
      dashboard: 'Dashboard',
      wedding: 'Wedding',
      venue: 'Venue',
      schedule: 'Schedule',
      gallery: 'Gallery',
      music: 'Music',
      gifts: 'Gifts',
      theme: 'Theme',
      design: 'Design',
      contacts: 'Contacts',
      rsvps: 'RSVPs',
      qrHub: 'QR Hub',
      adminSettings: 'Settings',
    },

    header: {
      title: 'Admin Dashboard',
      subtitle: 'Manage your wedding website content',
      profileSettings: 'Profile Settings',
      masterAccount: 'Master Account',
      darkMode: 'Dark Mode',
      viewLiveSite: 'View Live Site',
    },

    dashboard: {
      title: 'Dashboard',
      subtitle: 'Overview of your wedding website',
      loadingDashboard: 'Loading dashboard...',
      totalRsvps: 'Total RSVPs',
      attending: 'Attending',
      totalGuests: 'Total Guests',
      galleryPhotos: 'Gallery Photos',
      quickActions: 'Quick Actions',
      refreshStats: 'Refresh Stats',
      weddingDetails: 'Wedding Details',
      coupleEventInfo: 'Couple & event info',
      locationSettings: 'Location settings',
      eventTimeline: 'Event timeline',
      managePhotos: 'Manage photos',
      contactPeople: 'Contact people',
      guestResponses: 'Guest responses',
      // Setup Progress Card
      setupProgress: 'Setup Progress',
      setupComplete: 'Setup Complete',
      setupItems: {
        weddingDetails: 'Wedding Details',
        weddingDetailsComplete: 'All wedding details configured',
        weddingDetailsIncomplete: 'Add bride and groom names',
        weddingDetailsCoupleIncomplete: 'Complete couple names',
        weddingDetailsParentsIncomplete: 'Complete parents names',
        weddingDetailsDressCodeIncomplete: 'Update dress code',
        weddingDetailsHashtagIncomplete: 'Add hashtag',
        venue: 'Venue Location',
        venueComplete: 'Venue details configured',
        venueIncomplete: 'Set venue name and location',
        venueNameIncomplete: 'Set venue name',
        venueAddressIncomplete: 'Add address',
        venueLocationIncomplete: 'Set map location',
        contacts: 'Contact Information',
        contactsComplete: '{count} contact(s) added',
        contactsIncomplete: 'Add at least 1 contact person',
        contactsDisabled: 'Contacts hidden from guests',
        schedule: 'Event Schedule',
        scheduleComplete: '{count} event(s) scheduled',
        scheduleIncomplete: 'Add event timeline items',
        scheduleDisabled: 'Schedule hidden from guests',
        gallery: 'Photo Gallery',
        galleryComplete: '{count} photo(s) uploaded',
        galleryIncomplete: 'Upload at least 1 photo',
        galleryDisabled: 'Gallery hidden from guests',
        theme: 'Theme Selection',
        themeComplete: 'Theme customized',
        themeDefault: 'Using default theme',
        themeIncomplete: 'Review and customize theme',
        music: 'Background Music',
        musicComplete: '{count} track(s) uploaded',
        musicIncomplete: 'Upload at least 1 music track',
        musicDisabled: 'Music hidden from guests',
        gifts: 'Gift Registry',
        giftsComplete: '{count} gift(s) added',
        giftsIncomplete: 'Add at least 1 gift item',
        giftsDisabled: 'Gift registry hidden from guests',
        qrHub: 'QR Code Hub',
        qrHubComplete: '{count} QR code(s) enabled',
        qrHubIncomplete: 'Enable at least 1 QR code type',
        qrHubDisabled: 'QR Hub hidden from guests',
        rsvps: 'RSVPs',
        rsvpsComplete: '{count} RSVP(s) received',
        rsvpsIncomplete: 'Waiting for RSVPs',
        rsvpsDisabled: 'RSVP section hidden from guests',
        rsvpsClosed: '{count} RSVP(s) - Closed',
      },
    },

    rsvps: {
      title: 'RSVPs',
      totalRsvps: 'Total RSVPs',
      attending: 'Attending',
      notAttending: 'Not Attending',
      totalGuests: 'Total Guests',
      filterAll: 'All',
      filterAttending: 'Attending',
      filterNotAttending: 'Not Attending',
      addGuest: 'Add Guest',
      exportCsv: 'Export CSV',
      loadingRsvps: 'Loading RSVPs...',
      noRsvps: 'No RSVPs found.',
      addFirstGuest: 'Add First Guest',
      manual: 'Manual',
      guests: 'guest(s)',
      noPhoneProvided: 'No phone provided',
      deleteGuest: 'Delete Guest?',
      deleteGuestConfirm:
        "Are you sure you want to delete {name}'s RSVP? This action cannot be undone.",
      formTitleAdd: 'Add Guest',
      formTitleEdit: 'Edit Guest',
      titleLabel: 'Title',
      titleLabelOptional: 'Title (Optional)',
      noTitle: '-- No Title --',
      fullName: 'Full Name',
      enterFullName: 'Enter full name',
      nameTooShort: 'Name must be at least 2 characters',
      phoneNumber: 'Phone Number',
      attendance: 'Attendance',
      attendingLabel: 'Attending',
      notAttendingLabel: 'Not Attending',
      numberOfGuests: 'Number of Guests',
      guestsRange: 'Enter 1-10 guests',
      message: 'Message',
      messageOptional: 'Message (Optional)',
      wishesPlaceholder: 'Any wishes or notes...',
      savingGuest: 'Saving...',
      pressEscToClose: 'Press Esc to close',
      // Settings
      showRsvpSection: 'Show RSVP Section',
      showRsvpDesc: 'Display the RSVP section on the public website',
      acceptRsvps: 'Accept RSVPs',
      acceptRsvpsDesc: 'Allow guests to submit new RSVPs',
      acceptRsvpsDisabledHint: 'Enable RSVP section first to accept RSVPs',
      rsvpDeadline: 'RSVP Deadline',
      rsvpDeadlineDesc:
        'Optional deadline for RSVP submissions. Leave empty for no deadline (open until event day).',
      noDeadline: 'No deadline set',
      clearDeadline: 'Clear deadline',
      deadlineAfterEventError: 'Deadline cannot be after the event date',
      rsvpDisabled: 'Disabled',
      rsvpClosed: 'RSVPs Closed',
    },

    gallery: {
      title: 'Gallery Management',
      imagesCount: '{count} / {max} images',
      slotsRemaining: '({remaining} slots remaining)',
      loadingGallery: 'Loading gallery...',
      noImages: 'No images in gallery yet.',
      uploadFirst: 'Upload your first image to get started.',
      maxReached: 'Maximum number of images ({max}) reached. Delete some images to upload more.',
      galleryHelp: 'Gallery Help',
      deleteImage: 'Delete Image?',
      deleteImageConfirm:
        'Are you sure you want to delete this image? This action cannot be undone.',
      gallerySettings: 'Gallery Settings',
      maxImages: 'Maximum Images',
      compression: 'Image Compression',
      uploadImages: 'Upload Images',
      dragDrop: 'Drag and drop or click to upload',
      dragDropImages: 'Drag & drop images here or click to browse',
      upToSize: '{formats} up to {size}',
      showGallerySection: 'Show Gallery Section',
      showGalleryDesc: 'Display the photo gallery on the public website',
      maxFileSize: 'Max File Size',
      allowedFormats: 'Allowed Formats',
      imagesLabel: '{count} images',
      lastUpdatedBy: 'Last updated: {date} by {user}',
      dragToReorder: 'Drag images to reorder them.',
      tapToMoveOrView: 'Tap an image to move or view it.',
      limitsReadOnly: 'Limits are managed by Super Admin',
    },

    gifts: {
      title: 'Gift Registry',
      itemsCount: '{count} items',
      reserved: '{reserved} / {total} reserved',
      viewGifts: 'Gifts',
      viewReservations: 'Reservations',
      addGift: 'Add Gift',
      editGift: 'Edit Gift',
      registryStatus: 'Gift Registry Status',
      visibleToGuests: 'Wishlist is visible to guests',
      hiddenFromGuests: 'Wishlist is hidden from guests',
      loadingGifts: 'Loading gifts...',
      noGifts: 'No gifts in the registry yet.',
      noGiftsHint: 'Add your first gift to create a wishlist for guests.',
      addFirstGift: 'Add First Gift',
      needed: 'Needed',
      cardView: 'Card View',
      listView: 'List View',
      categoryHome: 'Home',
      categoryKitchen: 'Kitchen',
      categoryElectronics: 'Electronics',
      categoryExperiences: 'Experiences',
      categoryOther: 'Other',
      priorityNone: 'No Priority',
      priorityHigh: 'High (Needed)',
      priorityMedium: 'Medium',
      priorityLow: 'Low',
      totalReservations: 'Total Reservations',
      itemsReserved: 'Items Reserved',
      uniqueGuests: 'Unique Guests',
      noReservations: 'No reservations yet.',
      guest: 'Guest',
      phone: 'Phone',
      gift: 'Gift',
      date: 'Date',
      image: 'Image',
      chooseImage: 'Choose Image',
      nameEnglish: 'Name (English)',
      nameMalay: 'Name (Malay)',
      descriptionEnglish: 'Description (English)',
      descriptionMalay: 'Description (Malay)',
      externalLink: 'External Link (Shopee, etc.)',
      priceRange: 'Price Range',
      priceRangePlaceholder: 'Optional - e.g., RM150 - RM200',
      category: 'Category',
      priority: 'Priority',
      quantity: 'Quantity',
      quantityHint:
        'How many of this item would you like? Multiple guests can reserve different units.',
      notes: 'Notes (specifications, preferred color/brand)',
      notesPlaceholder: 'e.g., Preferably in white color, Philips brand...',
      giftSettings: 'Gift Settings',
      maxItems: 'Maximum Items',
      maxImageSize: 'Maximum Image Size (MB)',
      settingsAutoSave: 'Settings are saved automatically when changed.',
      showGiftsSection: 'Show Gift Registry on Public Site',
      showGiftsDesc: 'Enable or disable the gift registry for your guests',
      deleteGift: 'Delete Gift',
      deleteGiftConfirm:
        "Are you sure you want to delete '{name}'? This will also delete all reservations for this gift.",
      browseDefaults: 'Browse Defaults',
      defaultGifts: 'Default Gift Ideas',
      selectDefaults: 'Select gifts to add to your registry',
      defaultGiftsHint:
        'These are suggestions to help you get started. After adding, you can edit the name, price, description, and add images to personalize each gift.',
      addSelectedGifts: 'Add {count} Selected',
      selectedCount: '{count} selected',
      alreadyInRegistry: 'Already Added',
      addingGifts: 'Adding gifts...',
      addingProgress: 'Adding {current} of {total}...',
      giftsAddedSuccess: '{count} gift(s) added successfully!',
      noDuplicatesFound: 'All items already in your registry',
      addError: 'Failed to add gifts. Please try again.',
      selectAtLeastOne: 'Select at least one gift to add',
      limitReached: 'Registry limit reached',
      limitReachedTooltip: 'Registry limit reached. Delete existing gifts to add more.',
      limitReachedBanner:
        'Registry limit reached ({current}/{max}). Remove existing gifts to add new ones.',
      selectionLimitReached:
        'Selection limit reached. Deselect some gifts or save your current selection first.',
      // Discard selection confirmation
      discardSelectionTitle: 'Discard Selection?',
      discardSelectionMessage:
        'You have {count} gift(s) selected. Are you sure you want to close without adding them?',
      discardSelectionConfirm: 'Discard',
      discardSelectionCancel: 'Keep Selecting',
      // Search
      searchGifts: 'Search gifts...',
      giftsFound: '{count} gifts found',
      noSearchResults: 'No gifts match your search',
      tryDifferentSearch: 'Try a different search term or category',
      limitsReadOnly: 'Limits are managed by Super Admin',
      // View modes
      expandAll: 'Expand all',
      collapseAll: 'Collapse all',
      filters: 'Filters',
      // Sorting
      sortBy: 'Sort by',
      sortCustomOrder: 'Custom Order',
      sortPriority: 'Priority (High → Low)',
      sortNameAsc: 'Name (A-Z)',
      sortNameDesc: 'Name (Z-A)',
      sortCategory: 'Category',
      sortAvailability: 'Availability',
      sortMostReserved: 'Most Reserved',
      sortNewest: 'Recently Added',
      sortOldest: 'Oldest First',
      dragDisabledHint: 'Switch to Custom Order to reorder items',
      // Selection mode / Bulk delete
      select: 'Select',
      selectAll: 'Select All',
      deselectAll: 'Deselect All',
      deleteSelected: 'Delete Selected',
      exitSelection: 'Cancel',
      bulkDeleteTitle: 'Delete {count} Gifts',
      reservationsWarning: '{count} gift(s) have reservations that will also be deleted',
      reservationCount: '{count} reservations',
      deleteAll: 'Delete All',
      deleteOnlyUnreserved: 'Delete Only Unreserved',
      noReservationsSelected: 'None of the selected gifts have reservations.',
    },

    music: {
      title: 'Music Management',
      tracksCount: '{count} / {max} tracks',
      slotsRemaining: '({remaining} slots remaining)',
      loadingMusic: 'Loading music...',
      noTracks: 'No music tracks yet.',
      uploadFirst: 'Upload your first track to get started.',
      maxReached: 'Maximum number of tracks ({max}) reached. Delete some tracks to upload more.',
      deleteTrack: 'Delete Track?',
      deleteTrackConfirm: 'Are you sure you want to delete this track?',
      musicSettings: 'Music Settings',
      maxTracks: 'Maximum Tracks',
      autoPlay: 'Auto Play',
      clickToUpload: 'Click to upload',
      orDragAndDrop: 'or drag and drop',
      formatInfo: 'MP3, M4A, WAV, OGG up to {size}',
      filesToUpload: 'Files to upload ({count})',
      trackTitle: 'Title *',
      artistOptional: 'Artist (optional)',
      trackTitlePlaceholder: 'Track title',
      artistPlaceholder: 'Artist name',
      uploadTracks: 'Upload {count} track(s)',
      enableMusic: 'Show Music Section',
      enableMusicDesc: 'Display the music player on the public website',
      autoplay: 'Autoplay',
      autoplayDesc: 'Try to play music automatically when page loads',
      playMode: 'Play Mode',
      singleTrack: 'Single Track',
      playlist: 'Playlist',
      singleTrackDesc: 'Play selected track only',
      playlistDesc: 'Play all tracks in order',
      shuffle: 'Shuffle',
      shuffleDesc: 'Randomize track order',
      loop: 'Loop',
      loopSingleDesc: 'Repeat track continuously',
      loopPlaylistDesc: 'Repeat playlist when finished',
      defaultVolume: 'Default Volume',
      autoplayNote:
        'Most browsers block autoplay until user interaction. Even with autoplay enabled, music may not start automatically on first visit. Visitors can always click the music button to start playing.',
      selectTrack: 'Select a track',
      selectedTrack: 'Selected',
      noTrackSelected: 'No track selected',
      playlistDragToReorder: 'Playlist (drag to reorder)',
      stopPreview: 'Stop preview',
      unknownArtist: 'Unknown artist',
      // Music Library
      browseLibrary: 'Browse Library',
      libraryEmpty: 'No tracks available in the library yet',
      addFromLibrary: 'Add',
      alreadyAdded: 'Added',
      addedFromLibrary: 'Added from library',
      trackFromLibrary: 'From library',
    },

    musicLibrary: {
      title: 'Music Library',
      description: 'Manage global music tracks for all weddings',
      addTrack: 'Add Track',
      editTrack: 'Edit Track',
      deleteTrack: 'Delete Track',
      trackTitle: 'Title',
      artist: 'Artist',
      category: 'Category',
      categories: {
        romantic: 'Romantic',
        celebration: 'Celebration',
        classical: 'Classical',
        traditional: 'Traditional',
        modern: 'Modern',
        instrumental: 'Instrumental',
        other: 'Other',
      },
      uploadTrack: 'Upload Track',
      noTracksYet: 'No tracks in the library yet',
      uploadFirst: 'Upload your first track to get started',
      deleteConfirm: 'Are you sure you want to delete this track?',
      deleteWarning: 'This track will be permanently deleted.',
      deleteWarningInUse: 'This track is currently used by weddings.',
      selectReplacement: 'Select a replacement track:',
      replacementRequired: 'Select a replacement track...',
      usedByWeddings: 'This track is used by {count} wedding(s)',
      tracksCount: '{count} tracks total',
      duration: 'Duration',
      license: 'License',
      licenseType: 'License Type',
      licenseTypes: {
        free: 'Free',
        cc0: 'CC0 (Public Domain)',
        ccBy: 'CC-BY (Attribution)',
        ccBySa: 'CC-BY-SA',
        ccByNc: 'CC-BY-NC',
        royaltyFree: 'Royalty Free',
        purchased: 'Purchased',
        custom: 'Custom',
      },
      sourceUrl: 'Source URL',
      sourceUrlHint: 'Where did you get this track? (optional)',
      attributionPreview: 'Attribution Preview',
      searchPlaceholder: 'Search by title or artist...',
      filterAll: 'All Categories',
      noResults: 'No tracks found matching your search',
    },

    wedding: {
      title: 'Wedding Details',
      subtitle: 'Manage couple information, parents, and event details',
      loadingDetails: 'Loading wedding details...',
      coupleInfo: 'Couple Information',
      coupleInfoDesc: 'Enter the names that will appear on the wedding invitation',
      fullName: 'Full Name',
      fullNamePlaceholder: 'Full name',
      nickname: 'Nickname',
      nicknamePlaceholder: 'Nickname',
      bride: 'Bride',
      groom: 'Groom',
      nameDisplayOrder: 'Name Display Order',
      nameDisplayOrderDesc:
        'Choose whether to display the bride or groom name first throughout the website.',
      brideFirst: 'Bride First',
      brideFirstDesc: 'Traditional arrangement',
      groomFirst: 'Groom First',
      groomFirstDesc: 'Alternative arrangement',
      bismillah: 'Bismillah Calligraphy',
      bismillahDesc: 'Choose the calligraphy style for the Bismillah displayed on the hero section',
      showTranslation: 'Show Translation',
      showTranslationDesc: 'Display English translation below calligraphy',
      traditionalStyles: 'Traditional Styles',
      ornateStyles: 'Ornate Styles',
      modernStyles: 'Modern Styles',
      previewing: 'Previewing:',
      bismillahMeaning: 'In the Name of Allah, the Most Gracious, the Most Merciful',
      parentsInfo: 'Parents Information',
      parentsVisibilityDesc: 'Control which parents names appear on the public invitation',
      brideParents: "Bride's Parents",
      groomParents: "Groom's Parents",
      fatherName: "Father's Name",
      fatherNamePlaceholder: "Father's name",
      motherName: "Mother's Name",
      motherNamePlaceholder: "Mother's name",
      showBrideParents: "Show Bride's Parents",
      showBrideParentsDesc: "Display bride's parents names on the invitation",
      showGroomParents: "Show Groom's Parents",
      showGroomParentsDesc: "Display groom's parents names on the invitation",
      eventDetails: 'Event Details',
      eventDetailsDesc: 'Set the wedding date, time, and dress code for your guests',
      eventStartDateTime: 'Event Start Date & Time',
      eventEndDateTime: 'Event End Date & Time',
      dressCode: 'Dress Code',
      dressCodePlaceholder: 'e.g., Pastel / Earthy Tones',
      showDressCode: 'Show Dress Code',
      showDressCodeDesc: 'Display the dress code section on the public wedding page',
      displayFormat: 'Display Format',
      displayFormatSettings: 'Display Format Settings',
      displayFormatDesc: 'Choose how the event date and time should appear on the public website',
      preview: 'Preview:',
      noDateTimeDisplayed: 'No date/time will be displayed',
      customOptions: 'Custom Options',
      showDate: 'Show date',
      showDayOfWeek: 'Show day of week',
      showStartTime: 'Show start time',
      showEndTime: 'Show end time',
      timeFormatLabel: 'Time format:',
      time12Hour: '12-hour (AM/PM)',
      time24Hour: '24-hour',
      advancedFormat: 'Advanced Format (Optional)',
      advancedFormatDesc: 'Use custom format strings. Leave empty to use default formatting.',
      dateFormatLabel: 'Date Format',
      dateFormatPlaceholder: 'e.g., DD/MM/YYYY or MMMM D, YYYY',
      timeFormatPlaceholder: 'e.g., hh:mm A or HH:mm',
      formatTokens: 'Format tokens:',
      dateTokens: 'Date: YYYY (year), MM (month), DD (day), MMMM (month name), dddd (day name)',
      timeTokens: 'Time: HH (24h), hh (12h), mm (minutes), A (AM/PM)',
      presetDateTimeRange: 'Date + Time Range',
      presetDateStartOnly: 'Date + Start Time Only',
      presetDateOnly: 'Date Only',
      presetFullDetails: 'Full Details (Separate Lines)',
      presetCustom: 'Custom',
      websiteDetails: 'Website Details',
      websiteDetailsDesc: 'Set a hashtag for guests to use when sharing photos on social media',
      hashtag: 'Wedding Hashtag',
      hashtagPlaceholder: '#YourWeddingHashtag',
      showHashtag: 'Show Hashtag',
      showHashtagDesc: 'Display the wedding hashtag on the public wedding page',
      savedSuccess: 'Wedding details saved successfully!',
      unsavedChanges: 'You have unsaved changes',
      lastUpdated: 'Last updated: {date} by {user}',
    },

    venue: {
      title: 'Location Management',
      subtitle: 'Update the venue location for guests to find your wedding',
      loadingVenue: 'Loading venue settings...',
      venueName: 'Venue Name',
      venueNamePlaceholder: 'e.g., Dewan Seri Endon',
      address: 'Address',
      addressPlaceholder: 'Full venue address',
      coordinates: 'Coordinates',
      coordinatesFromMap: 'Coordinates (from map)',
      latitude: 'Latitude',
      longitude: 'Longitude',
      parking: 'Parking Information',
      parkingInfo: 'Parking Information',
      parkingInfoPlaceholder: 'Parking instructions for guests',
      parkingImages: 'Parking Images',
      showParkingImages: 'Show Parking Images',
      parkingDirections: 'Parking Directions',
      showParkingDirections: 'Show Parking Directions',
      parkingVideo: 'Parking Video',
      showParkingVideo: 'Show Parking Video',
      parkingVideoUrl: 'Parking Video URL',
      addParkingStep: 'Add Parking Step',
      remove: 'Remove',
      savedSuccess: 'Venue location saved successfully!',
      unsavedChanges: 'You have unsaved changes',
      selectLocation: 'Select Location',
      venueDetails: 'Venue Details',
      // Map picker
      searchLocation: 'Search Location',
      searchPlaceholder: 'Type venue name or address...',
      typeAtLeast3Chars: 'Type at least 3 characters to search',
      searchingFor: 'Searching for "{query}"...',
      locationsFound: '{count} locations found',
      locationFound: '{count} location found',
      noLocationsFound: 'No locations found for "{query}"',
      tryDifferentSearch: 'Try a different search term',
      clickMapOrDragMarker: 'Click on the map or drag the marker to set the exact location',
      // Form
      required: '*',
      optional: '(optional)',
      characters: '{count}/{max} characters',
      fillRequiredFields: 'Please fill in all required fields',
      // Preview
      previewTitle: 'Preview',
      howGuestsWillSee: 'How guests will see the venue',
      venueLabel: 'Venue',
      addressLabel: 'Address',
      parkingLabel: 'Parking',
      enterDetailsToPreview: 'Enter venue details to see preview',
      testNavigationLinks: 'Test navigation links:',
      googleMaps: 'Maps',
      waze: 'Waze',
      // Parking form
      showOnWebsite: 'Show on website',
      uploadParkingPhotosDesc:
        'Upload photos of parking areas or map diagrams to help guests find parking.',
      maxImagesReached: 'Maximum {max} images reached',
      directionsTitle: 'Directions',
      step: 'step',
      steps: 'steps',
      addDirectionsDesc: 'Add numbered directions to help guests navigate to parking.',
      enterDirectionPlaceholder: 'Enter direction...',
      addStep: '+ Add Step',
      maxStepsAllowed: 'Maximum 10 steps allowed',
      videoGuide: 'Video Guide',
      added: 'Added',
      addVideoDesc: 'Add a YouTube video showing guests how to get to the parking area.',
      validYoutubeUrl: 'Please enter a valid YouTube URL',
      // Direction icons
      iconNoIcon: 'No icon',
      iconGoStraight: 'Go straight',
      iconTurnLeft: 'Turn left',
      iconTurnRight: 'Turn right',
      iconLandmark: 'Landmark',
      iconParking: 'Parking',
      iconEntrance: 'Entrance',
    },

    schedule: {
      title: 'Schedule Management',
      subtitle: 'Manage your wedding event timeline',
      loadingSchedule: 'Loading schedule...',
      showScheduleSection: 'Show Schedule Section',
      showScheduleDesc: 'Display the event timeline on the public website',
      addItem: 'Add Event',
      editItem: 'Edit Event',
      deleteItem: 'Delete Event',
      time: 'Event Time',
      timePlaceholder: 'e.g., 11:00 AM',
      eventTitle: 'Event Title',
      noItems: 'No events added yet.',
      savedSuccess: 'Schedule saved successfully!',
      deleteItemConfirm: 'Are you sure you want to delete "{title}"?',
      clearAll: 'Clear All',
      clearAllConfirm:
        'Are you sure you want to delete all {count} schedule events? This action cannot be undone.',
      clearAllSuccess: 'All schedule events cleared successfully!',
    },

    contacts: {
      title: 'Contacts Management',
      subtitle: 'Manage contact people for your wedding',
      loadingContacts: 'Loading contacts...',
      addContact: 'Add Contact',
      editContact: 'Edit Contact',
      deleteContact: 'Delete Contact',
      contactName: 'Name',
      contactNamePlaceholder: 'Contact name',
      phoneNumber: 'Phone Number',
      role: 'Role',
      rolePlaceholder: 'e.g., Bride, Groom, Family',
      noContacts: 'No contacts added yet.',
      savedSuccess: 'Contacts saved successfully!',
      deleteContactConfirm: 'Are you sure you want to delete "{name}"?',
      showContactsSection: 'Show Contacts Section',
      showContactsDesc: 'Display contact information on the public website',
    },

    theme: {
      title: 'Theme Customization',
      subtitle: 'Select a theme for your wedding website',
      loadingTheme: 'Loading themes...',
      selectTheme: 'Select',
      preview: 'Preview',
      customize: 'Customize',
      customColors: 'Custom Colors',
      primaryColor: 'Primary Color',
      secondaryColor: 'Secondary Color',
      accentColor: 'Accent Color',
      savedSuccess: 'Theme saved successfully!',
      unsavedChanges: 'You have unsaved changes',
      previewModeActive: 'Preview mode active. Changes are not saved yet.',
      cancelPreview: 'Cancel Preview',
      presetThemes: 'Preset Themes',
      customTheme: 'Custom Theme',
      customThemeDescription: 'Create your own unique color scheme',
      saveTheme: 'Save Theme',
      // Customizer
      themeName: 'Theme Name',
      myCustomTheme: 'My Custom Theme',
      lightModeColors: 'Light Mode Colors',
      darkModeColors: 'Dark Mode Colors',
      fonts: 'Fonts',
      selectFontPairing: 'Select a font pairing preset:',
      currentSelection: 'Current selection:',
      headingFont: 'Heading:',
      bodyFont: 'Body:',
      // Light mode color labels
      primary: 'Primary',
      primaryDesc: 'Main accent color',
      primaryLight: 'Primary Light',
      primaryLightDesc: 'Lighter variant of primary',
      primaryDark: 'Primary Dark',
      primaryDarkDesc: 'Darker variant of primary',
      secondary: 'Secondary',
      secondaryDesc: 'Background and card color',
      secondaryDark: 'Secondary Dark',
      secondaryDarkDesc: 'Darker secondary',
      text: 'Text',
      textDesc: 'Primary text color',
      textLight: 'Text Light',
      textLightDesc: 'Secondary text color',
      background: 'Background',
      backgroundDesc: 'Page background',
      // Dark mode color labels
      backgroundSecondary: 'Background Secondary',
      backgroundSecondaryDesc: 'Card background',
      backgroundElevated: 'Background Elevated',
      backgroundElevatedDesc: 'Modal/popup background',
      border: 'Border',
      borderDesc: 'Border color',
      textSecondary: 'Text Secondary',
      textSecondaryDesc: 'Secondary text in dark mode',
      darkModeText: 'Text',
      darkModeTextDesc: 'Primary text in dark mode',
      // Preset theme names
      // Preset theme names (10 themes)
      earthyMinimalist: 'Earthy Minimalist',
      earthyMinimalistDesc: 'Warm sage greens with natural sand tones',
      romanticBlush: 'Romantic Blush',
      romanticBlushDesc: 'Soft dusty rose with elegant cream accents',
      elegantClassic: 'Elegant Classic',
      elegantClassicDesc: 'Timeless gold with sophisticated ivory',
      modernBold: 'Modern Bold',
      modernBoldDesc: 'Vibrant coral with clean contemporary style',
      gardenFresh: 'Garden Fresh',
      gardenFreshDesc: 'Lush forest green with fresh mint tones',
      rusticCharm: 'Rustic Charm',
      rusticCharmDesc: 'Warm terracotta with cozy linen textures',
      oceanBreeze: 'Ocean Breeze',
      oceanBreezeDesc: 'Calming coastal blues with sandy neutrals',
      lavenderDream: 'Lavender Dream',
      lavenderDreamDesc: 'Soft purple hues with romantic elegance',
      midnightLuxe: 'Midnight Luxe',
      midnightLuxeDesc: 'Deep navy elegance with gold accents',
      sunsetGlow: 'Sunset Glow',
      sunsetGlowDesc: 'Warm amber and coral sunset vibes',
    },

    design: {
      title: 'Design & Layout',
      subtitle: 'Choose how your wedding website looks and feels',
      layoutSelection: 'Website Layout',
      sectionOrder: 'Section Order & Visibility',
      sectionOrderHint: 'Drag to reorder. Click eye to toggle visibility.',
      resetOrder: 'Reset to default',
      animationSpeed: 'Animation Speed',
      preview: 'Preview',
      saveDesign: 'Save Design',
      savedSuccess: 'Design settings saved successfully!',
      alwaysFirst: 'always first',
      // Layout-specific settings
      invitationCardSettings: 'Invitation Card Settings',
      showCoupleNames: 'Show couple names on cover',
      showWeddingDate: 'Show wedding date on cover',
      autoOpenDelay: 'Auto-open delay (seconds, 0 = manual only)',
      slideshowSettings: 'Slideshow Settings',
      showDots: 'Show navigation dots',
      showArrows: 'Show navigation arrows (desktop)',
      autoPlay: 'Auto-play slides',
      autoPlayInterval: 'Seconds between slides',
      storybookSettings: 'Storybook Settings',
      showPageNumbers: 'Show page numbers',
      // Background features
      backgroundFeatures: 'Background Features',
      backgroundFeaturesHint: 'Enable or disable background features',
      backgroundMusic: 'Background Music',
      backgroundMusicDescription: 'Play music while guests browse your wedding site',
      // Empty content warnings
      emptyGallery: 'No images',
      emptySchedule: 'No schedule',
      emptyWishlist: 'No gifts',
      emptyMusic: 'No music',
    },

    heroBackground: {
      title: 'Hero Background',
      subtitle: 'Add an image or video behind your wedding info',
      mediaType: 'Media Type',
      none: 'None (Solid Color)',
      image: 'Image',
      video: 'Video',
      uploadMode: 'Upload Mode',
      singleUpload: 'Single upload for both devices',
      singleUploadDesc: 'Quick option - one media works everywhere',
      separateUpload: 'Separate uploads for desktop & mobile',
      separateUploadDesc: 'Best quality - optimized for each device',
      universalBackground: 'Universal Background',
      universalRecommend: 'Recommended: 1920x1440px (4:3) or square',
      desktopBackground: 'Desktop Background',
      desktopRecommend: 'Recommended: 1920x1080px (16:9 landscape)',
      mobileBackground: 'Mobile Background',
      mobileRecommend: 'Recommended: 1080x1920px (9:16 portrait)',
      clickToUpload: 'Click to upload',
      uploadDesktop: 'Upload desktop background',
      uploadMobile: 'Upload mobile background',
      overlaySettings: 'Overlay Settings',
      enableOverlay: 'Enable overlay',
      overlayHelp: 'Recommended for text readability',
      overlayColor: 'Color',
      overlayOpacity: 'Opacity',
      resolution: 'Resolution',
      size: 'Size',
      format: 'Format',
      aspectRatio: 'Aspect',
      confirmDelete: 'Delete this background media?',
      uploading: 'Uploading...',
      deleting: 'Deleting...',
      pleaseWait: 'Please wait while your file is being uploaded',
      hiddenMediaTitle: "You have existing media that won't be displayed",
      hiddenMediaDesc: "The following media exists but won't show with current settings:",
      hiddenMediaHint:
        'Switch back to the original settings to see it, or upload new media for the current mode.',
      switchModeConfirm:
        "Switching modes will hide your current media (it won't be deleted). You can switch back anytime to see it again. Continue?",
    },

    qrHub: {
      title: 'QR Code Hub',
      subtitle: 'Manage QR codes for your wedding',
      loadingSettings: 'Loading settings...',
      saveSettings: 'Save Settings',
      savedSuccess: 'Settings saved successfully!',
      configure: 'Configure',
      close: 'Close',
      // QR Types
      websiteTitle: 'Website',
      websiteSubtitle: 'Share wedding invitation',
      restuDigitalTitle: 'Digital Blessing',
      restuDigitalSubtitle: 'For those who wish to give blessings',
      locationTitle: 'Location',
      locationSubtitle: 'Navigate to venue',
      wifiTitle: 'Venue WiFi',
      wifiSubtitle: 'Internet connection for guests',
      rsvpTitle: 'RSVP',
      rsvpSubtitle: 'For sharing - guests can also use RSVP button on page',
      calendarTitle: 'Calendar',
      calendarSubtitle: 'Save the date',
      hashtagTitle: 'Instagram Hashtag',
      hashtagSubtitle: 'Opens Instagram hashtag search',
      hashtagNote: 'Uses hashtag from Wedding Details. Opens Instagram search when scanned.',
      // Location Apps
      googleMapsOnly: 'Google Maps only',
      wazeOnly: 'Waze only',
      googleMapsAndWaze: 'Google Maps & Waze',
      // WiFi Encryption
      wpaRecommended: 'WPA/WPA2 (Recommended)',
      wep: 'WEP',
      noPassword: 'No password',
      // Warnings
      uploadOrDisable: 'Please upload a QR image or disable this feature',
      fillBankDetails: 'Please fill in all bank details or disable this feature',
      enterWifiSsid: 'Please enter the WiFi network name (SSID) or disable this feature',
      passwordVisibleWarning: 'Password will be visible to guests',
      // Digital Blessing Config
      digitalBlessingConfig: 'Digital Blessing Configuration',
      taglineMessage: 'Tagline (Message)',
      qrDisplayMethod: 'QR Display Method',
      uploadQrImage: 'Upload QR image',
      enterBankDetails: 'Enter bank details',
      qrImageFromBank: 'QR image from bank app',
      uploading: 'Uploading... {progress}%',
      uploadImage: 'Upload image',
      bankName: 'Bank Name',
      accountHolderName: 'Account Holder Name',
      accountNumber: 'Account Number',
      // WiFi Config
      wifiConfiguration: 'WiFi Configuration',
      networkNameSsid: 'Network Name (SSID)',
      password: 'Password',
      encryptionType: 'Encryption Type',
      hiddenNetwork: 'Hidden network',
      // Location Config
      locationConfiguration: 'Location Configuration',
      navigationApp: 'Navigation App',
      locationFromVenue: 'Location coordinates are taken from Venue settings',
      // Hub Status
      qrHubStatus: 'QR Hub Status',
      qrHubVisible: 'QR Hub is available',
      qrHubHidden: 'QR Hub is hidden',
      hubDisabledInfo: 'Enable the QR Code Hub above to configure individual QR codes.',
      showQrHubSection: 'Show QR Code Hub on Public Site',
      showQrHubDesc: 'Enable or disable the QR code hub for your guests',
    },

    adminUsers: {
      title: 'Manage Admin Users',
      addAdmin: 'Add Admin',
      createNewAdmin: 'Create New Admin',
      email: 'Email',
      emailOptional: 'Email (Optional)',
      emailHint: 'A welcome email with login credentials will be sent to this address.',
      enterUsername: 'Enter username',
      enterPassword: 'Enter password',
      enterEmail: 'Enter email for welcome notification',
      creating: 'Creating...',
      loadingAdmins: 'Loading admin users...',
      noAdmins: 'No admin users found.',
      createFirst: 'Create the first admin user to get started.',
      createdBy: 'Created by {user} on {date}',
      resetPassword: 'Reset Password',
      deleteAdmin: 'Delete',
      deleteConfirm: 'Are you sure you want to delete this admin user?',
      resetConfirm: 'Reset password for this user?',
      adminCreated: 'Admin user {username} created successfully!',
      adminCreatedTitle: 'Admin Created Successfully',
      adminCreatedMessage: 'User "{username}" has been created',
      emailSentNote: 'and a welcome email has been sent.',
      emailSendFailed: 'Failed to send welcome email',
      temporaryPassword: 'Temporary Password',
    },

    profile: {
      title: 'Profile Settings',
      username: 'Username',
      email: 'Email',
      save: 'Save',
      updateSuccess: 'Profile updated successfully',
      loadingProfile: 'Loading profile...',
      usernameCannotChange: 'Username cannot be changed.',
      emailPlaceholder: 'Enter your email',
      emailRecoveryHint: 'Used for account recovery and notifications.',
      profileUpdated: 'Profile Updated',
    },

    modals: {
      confirmDelete: 'Confirm Delete',
      actionCannotBeUndone: 'This action cannot be undone.',
      unsavedChanges: 'Unsaved Changes',
      discardChanges: 'Discard Changes',
      pleaseWait: 'Please wait...',
    },

    loadingOverlay: {
      loading: 'Loading...',
      saving: 'Saving changes...',
      deleting: 'Deleting...',
      uploading: 'Uploading...',
      processing: 'Processing...',
      success: 'Done!',
      workingOnIt: 'Working on it...',
      almostThere: 'Almost there...',
      justAMoment: 'Just a moment...',
      processing2: 'Processing your request...',
    },

    toast: {
      archiveSuccess: 'Wedding archived successfully',
      deleteSuccess: 'Wedding deleted permanently',
      createSuccess: 'Wedding created successfully',
      updateSuccess: 'Changes saved successfully',
      addOwnerSuccess: 'Admin added successfully',
      removeOwnerSuccess: 'Admin removed successfully',
      resetPasswordSuccess: 'Password reset successfully',
      addStaffSuccess: 'Staff member added successfully',
      updateStaffSuccess: 'Staff member updated successfully',
      deleteStaffSuccess: 'Staff member deleted successfully',
      genericError: 'An error occurred. Please try again.',
    },

    hardDelete: {
      title: 'Permanently Delete Wedding',
      warningMessage:
        'This action is permanent and cannot be undone. All wedding data, RSVPs, images, and files will be permanently deleted.',
      loadingPreview: 'Loading deletion preview...',
      deletionSummary: 'The following data will be permanently deleted:',
      rsvps: 'RSVPs',
      images: 'Images',
      music: 'Music tracks',
      gifts: 'Gifts',
      parking: 'Parking images',
      qrCodes: 'QR codes',
      files: 'Files in storage',
      noDataToDelete: 'No additional data to delete.',
      confirmInstruction: 'To confirm, type the wedding slug:',
      deleteButton: 'Delete Forever',
      deleting: 'Deleting...',
      successMessage: 'Wedding permanently deleted',
    },

    messages: {
      saveSuccess: 'Saved successfully!',
      saveFailed: 'Failed to save. Please try again.',
      deleteSuccess: 'Deleted successfully!',
      deleteFailed: 'Failed to delete. Please try again.',
      uploadSuccess: 'Uploaded successfully!',
      uploadFailed: 'Failed to upload. Please try again.',
      loadFailed: 'Failed to load. Please try again.',
      networkError: 'Network error. Please check your connection.',
      lastUpdated: 'Last updated',
      by: 'by',
      unsavedChanges: 'You have unsaved changes',
      savedSuccess: 'Changes saved successfully!',
    },

    staff: {
      title: 'Staff Management',
      description: 'Manage your team who can help manage weddings',
      addStaff: 'Add Staff',
      editStaff: 'Edit Staff',
      deleteStaff: 'Delete Staff',
      username: 'Username',
      email: 'Email',
      password: 'Password',
      managingWeddings: 'Managing {count} wedding(s)',
      noWeddings: 'No weddings assigned',
      noStaffYet: 'No staff members yet',
      createFirst: 'Create your first staff member to get started',
      deleteConfirm: 'Are you sure you want to delete "{username}"?',
      deleteWarning: 'They will be removed from all weddings they manage.',
      createdAt: 'Created',
      assignStaff: 'Assign Staff',
      createClient: 'Create Client',
      noAssignment: 'No Assignment',
      noAssignmentDesc: 'Super admin will manage this wedding directly. You can add owners later.',
      selectStaff: 'Select Staff Member',
      selectStaffPlaceholder: 'Choose a staff member...',
      clientDetails: 'Client Details',
      roleLabel: 'Role',
      roleLabelPlaceholder: 'e.g., Bride, Groom, Parent',
      bride: 'Bride',
      groom: 'Groom',
      parent: 'Parent',
      other: 'Other',
      searchPlaceholder: 'Search by username or email...',
      filterAll: 'All',
      filterWithWeddings: 'With Weddings',
      filterNoWeddings: 'No Weddings',
      noResults: 'No staff found matching your search',
    },

    superAdmin: {
      uploadLimits: 'Upload Limits',
      galleryLimits: 'Gallery Limits',
      giftLimits: 'Gift Limits',
      searchPlaceholder: 'Search by name, slug, or owner...',
      filterAll: 'All',
      filterActive: 'Active',
      filterArchived: 'Archived',
      filterDraft: 'Draft',
      noResults: 'No weddings found matching your search',
    },

    superAdminSettings: {
      title: 'Settings',
      description: 'Manage your account settings',
      changePassword: 'Change Password',
      changePasswordDesc: 'Update your login credentials',
      currentPassword: 'Current Password',
      newPassword: 'New Password',
      confirmPassword: 'Confirm New Password',
      passwordMinLength: 'Password must be at least 6 characters',
      passwordsDoNotMatch: 'Passwords do not match',
      passwordSameAsCurrent: 'New password must be different from current password',
      passwordChanged: 'Password changed successfully',
      changingPassword: 'Changing password...',
      manageSuperAdmins: 'Manage Super Admins',
      manageSuperAdminsDesc: 'Reset passwords for other super admin accounts',
      noOtherAdmins: 'No other super admin accounts',
      resetPassword: 'Reset Password',
      resetPasswordConfirm: 'Reset password for "{username}"?',
      resetPasswordWarning:
        'They will receive a temporary password and must change it on next login.',
      noEmail: 'No email configured',
      createdAt: 'Created',
      settingsTab: 'Settings',
    },

    weddingContext: {
      switchWedding: 'Switch Wedding',
      selectWedding: 'Select Wedding',
      statusActive: 'Active',
      statusDraft: 'Draft',
      statusArchived: 'Archived',
      loading: 'Loading...',
      errorLoading: 'Failed to load weddings',
      noWeddingSelected: 'No wedding selected',
    },

    unsavedChanges: {
      title: 'Unsaved Changes',
      message: 'You have unsaved changes in {tab}. What would you like to do?',
      saveAndContinue: 'Save & Continue',
      discard: 'Discard',
      stay: 'Stay',
      saving: 'Saving...',
      saveError: 'Failed to save changes. Please try again.',
      changesSaved: 'Changes saved!',
    },
  },

  ms: {
    common: {
      save: 'Simpan',
      saving: 'Menyimpan...',
      cancel: 'Batal',
      delete: 'Padam',
      edit: 'Sunting',
      add: 'Tambah',
      close: 'Tutup',
      loading: 'Memuatkan...',
      refresh: 'Muat Semula',
      tryAgain: 'Cuba Lagi',
      settings: 'Tetapan',
      submit: 'Hantar',
      submitting: 'Menghantar...',
      update: 'Kemaskini',
      yes: 'Ya',
      no: 'Tidak',
      confirm: 'Sahkan',
      viewSite: 'Lihat Laman',
      superAdmin: 'Super Admin',
      logout: 'Log Keluar',
      actions: 'Tindakan',
      saveChanges: 'Simpan Perubahan',
      saveSettings: 'Simpan Tetapan',
      resetChanges: 'Set Semula Perubahan',
      saveAllChanges: 'Simpan Semua Perubahan',
      selected: 'Dipilih',
      discard: 'Buang',
      enabled: 'Diaktifkan',
      disabled: 'Dinyahaktifkan',
      compressing: 'Memampatkan...',
      backToSuperAdmin: 'Kembali ke Super Admin',
      clearFilters: 'Padam penapis',
      dismiss: 'Abaikan',
    },

    auth: {
      adminLogin: 'Hub Perkahwinan Anda',
      username: 'Nama Pengguna',
      password: 'Kata Laluan',
      enterUsername: 'Masukkan nama pengguna',
      enterPassword: 'Masukkan kata laluan',
      login: 'Log Masuk',
      loggingIn: 'Sedang log masuk...',
      masterHint:
        'Guna "master" sebagai nama pengguna dengan kata laluan master untuk persediaan awal.',
      changePassword: 'Tukar Kata Laluan',
      currentPassword: 'Kata Laluan Semasa',
      newPassword: 'Kata Laluan Baharu',
      confirmPassword: 'Sahkan Kata Laluan Baharu',
      enterCurrentPassword: 'Masukkan kata laluan semasa',
      enterNewPassword: 'Masukkan kata laluan baharu',
      confirmNewPassword: 'Sahkan kata laluan baharu',
      passwordMinLength: 'Kata laluan mesti sekurang-kurangnya 6 aksara.',
      changingPassword: 'Menukar...',
      passwordChanged: 'Kata Laluan Ditukar',
      passwordChangedSuccessMessage: 'Kata laluan anda telah berjaya dikemaskini.',
      passwordChangeRequired: 'Tukar Kata Laluan Diperlukan',
      passwordExpiredMessage:
        'Kata laluan anda telah tamat tempoh. Sila tetapkan yang baharu untuk teruskan.',
      setPassword: 'Tetapkan Kata Laluan',
      settingPassword: 'Menetapkan...',
    },

    nav: {
      dashboard: 'Papan Pemuka',
      wedding: 'Perkahwinan',
      venue: 'Lokasi',
      schedule: 'Jadual',
      gallery: 'Galeri',
      music: 'Muzik',
      gifts: 'Hadiah',
      theme: 'Tema',
      design: 'Reka Bentuk',
      contacts: 'Hubungan',
      rsvps: 'RSVP',
      qrHub: 'Hub QR',
      adminSettings: 'Tetapan',
    },

    header: {
      title: 'Panel Pentadbir',
      subtitle: 'Urus kandungan laman web perkahwinan anda',
      profileSettings: 'Tetapan Profil',
      masterAccount: 'Akaun Master',
      darkMode: 'Mod Gelap',
      viewLiveSite: 'Lihat Laman Langsung',
    },

    dashboard: {
      title: 'Papan Pemuka',
      subtitle: 'Gambaran keseluruhan laman web perkahwinan anda',
      loadingDashboard: 'Memuatkan papan pemuka...',
      totalRsvps: 'Jumlah RSVP',
      attending: 'Hadir',
      totalGuests: 'Jumlah Tetamu',
      galleryPhotos: 'Foto Galeri',
      quickActions: 'Tindakan Pantas',
      refreshStats: 'Muat Semula Statistik',
      weddingDetails: 'Butiran Perkahwinan',
      coupleEventInfo: 'Info pasangan & acara',
      locationSettings: 'Tetapan lokasi',
      eventTimeline: 'Garis masa acara',
      managePhotos: 'Urus foto',
      contactPeople: 'Kenalan',
      guestResponses: 'Maklum balas tetamu',
      // Setup Progress Card
      setupProgress: 'Kemajuan Persediaan',
      setupComplete: 'Persediaan Selesai',
      setupItems: {
        weddingDetails: 'Butiran Perkahwinan',
        weddingDetailsComplete: 'Semua butiran perkahwinan telah dikonfigurasikan',
        weddingDetailsIncomplete: 'Tambah nama pengantin',
        weddingDetailsCoupleIncomplete: 'Lengkapkan nama pasangan',
        weddingDetailsParentsIncomplete: 'Lengkapkan nama ibu bapa',
        weddingDetailsDressCodeIncomplete: 'Kemas kini kod pakaian',
        weddingDetailsHashtagIncomplete: 'Tambah hashtag',
        venue: 'Lokasi Majlis',
        venueComplete: 'Butiran lokasi telah dikonfigurasikan',
        venueIncomplete: 'Tetapkan nama dan lokasi tempat',
        venueNameIncomplete: 'Tetapkan nama tempat',
        venueAddressIncomplete: 'Tambah alamat',
        venueLocationIncomplete: 'Tetapkan lokasi peta',
        contacts: 'Maklumat Hubungan',
        contactsComplete: '{count} kenalan ditambah',
        contactsIncomplete: 'Tambah sekurang-kurangnya 1 kenalan',
        contactsDisabled: 'Kenalan disembunyikan daripada tetamu',
        schedule: 'Jadual Acara',
        scheduleComplete: '{count} acara dijadualkan',
        scheduleIncomplete: 'Tambah item garis masa acara',
        scheduleDisabled: 'Jadual disembunyikan daripada tetamu',
        gallery: 'Galeri Foto',
        galleryComplete: '{count} foto dimuat naik',
        galleryIncomplete: 'Muat naik sekurang-kurangnya 1 foto',
        galleryDisabled: 'Galeri disembunyikan daripada tetamu',
        theme: 'Pilihan Tema',
        themeComplete: 'Tema telah disesuaikan',
        themeDefault: 'Menggunakan tema lalai',
        themeIncomplete: 'Semak dan sesuaikan tema',
        music: 'Muzik Latar',
        musicComplete: '{count} lagu dimuat naik',
        musicIncomplete: 'Muat naik sekurang-kurangnya 1 lagu',
        musicDisabled: 'Muzik disembunyikan daripada tetamu',
        gifts: 'Senarai Hadiah',
        giftsComplete: '{count} hadiah ditambah',
        giftsIncomplete: 'Tambah sekurang-kurangnya 1 hadiah',
        giftsDisabled: 'Senarai hadiah disembunyikan daripada tetamu',
        qrHub: 'Hub Kod QR',
        qrHubComplete: '{count} kod QR diaktifkan',
        qrHubIncomplete: 'Aktifkan sekurang-kurangnya 1 jenis kod QR',
        qrHubDisabled: 'Hub QR disembunyikan daripada tetamu',
        rsvps: 'RSVP',
        rsvpsComplete: '{count} RSVP diterima',
        rsvpsIncomplete: 'Menunggu RSVP',
        rsvpsDisabled: 'Bahagian RSVP disembunyikan daripada tetamu',
        rsvpsClosed: '{count} RSVP - Ditutup',
      },
    },

    rsvps: {
      title: 'RSVP',
      totalRsvps: 'Jumlah RSVP',
      attending: 'Hadir',
      notAttending: 'Tidak Hadir',
      totalGuests: 'Jumlah Tetamu',
      filterAll: 'Semua',
      filterAttending: 'Hadir',
      filterNotAttending: 'Tidak Hadir',
      addGuest: 'Tambah Tetamu',
      exportCsv: 'Eksport CSV',
      loadingRsvps: 'Memuatkan RSVP...',
      noRsvps: 'Tiada RSVP dijumpai.',
      addFirstGuest: 'Tambah Tetamu Pertama',
      manual: 'Manual',
      guests: 'tetamu',
      noPhoneProvided: 'Tiada nombor telefon',
      deleteGuest: 'Padam Tetamu?',
      deleteGuestConfirm:
        'Adakah anda pasti mahu memadam RSVP {name}? Tindakan ini tidak boleh dibatalkan.',
      formTitleAdd: 'Tambah Tetamu',
      formTitleEdit: 'Sunting Tetamu',
      titleLabel: 'Gelaran',
      titleLabelOptional: 'Gelaran (Pilihan)',
      noTitle: '-- Tiada Gelaran --',
      fullName: 'Nama Penuh',
      enterFullName: 'Masukkan nama penuh',
      nameTooShort: 'Nama mesti sekurang-kurangnya 2 aksara',
      phoneNumber: 'Nombor Telefon',
      attendance: 'Kehadiran',
      attendingLabel: 'Hadir',
      notAttendingLabel: 'Tidak Hadir',
      numberOfGuests: 'Bilangan Tetamu',
      guestsRange: 'Masukkan 1-10 tetamu',
      message: 'Mesej',
      messageOptional: 'Mesej (Pilihan)',
      wishesPlaceholder: 'Sebarang ucapan atau catatan...',
      savingGuest: 'Menyimpan...',
      pressEscToClose: 'Tekan Esc untuk tutup',
      // Settings
      showRsvpSection: 'Papar Bahagian RSVP',
      showRsvpDesc: 'Paparkan bahagian RSVP di laman web awam',
      acceptRsvps: 'Terima RSVP',
      acceptRsvpsDesc: 'Benarkan tetamu menghantar RSVP baharu',
      acceptRsvpsDisabledHint: 'Aktifkan bahagian RSVP dahulu untuk menerima RSVP',
      rsvpDeadline: 'Tarikh Akhir RSVP',
      rsvpDeadlineDesc:
        'Tarikh akhir pilihan untuk penghantaran RSVP. Biarkan kosong untuk tiada tarikh akhir (terbuka sehingga hari majlis).',
      noDeadline: 'Tiada tarikh akhir ditetapkan',
      clearDeadline: 'Kosongkan tarikh akhir',
      deadlineAfterEventError: 'Tarikh akhir tidak boleh selepas tarikh majlis',
      rsvpDisabled: 'Dilumpuhkan',
      rsvpClosed: 'RSVP Ditutup',
    },

    gallery: {
      title: 'Pengurusan Galeri',
      imagesCount: '{count} / {max} imej',
      slotsRemaining: '({remaining} slot berbaki)',
      loadingGallery: 'Memuatkan galeri...',
      noImages: 'Belum ada imej dalam galeri.',
      uploadFirst: 'Muat naik imej pertama anda untuk bermula.',
      maxReached:
        'Bilangan maksimum imej ({max}) telah dicapai. Padam beberapa imej untuk muat naik lebih.',
      galleryHelp: 'Bantuan Galeri',
      deleteImage: 'Padam Imej?',
      deleteImageConfirm:
        'Adakah anda pasti mahu memadam imej ini? Tindakan ini tidak boleh dibatalkan.',
      gallerySettings: 'Tetapan Galeri',
      maxImages: 'Maksimum Imej',
      compression: 'Pemampatan Imej',
      uploadImages: 'Muat Naik Imej',
      dragDrop: 'Seret dan lepas atau klik untuk muat naik',
      dragDropImages: 'Seret & lepas imej di sini atau klik untuk semak imbas',
      upToSize: '{formats} sehingga {size}',
      showGallerySection: 'Papar Bahagian Galeri',
      showGalleryDesc: 'Paparkan galeri foto di laman web awam',
      maxFileSize: 'Saiz Fail Maksimum',
      allowedFormats: 'Format Yang Dibenarkan',
      imagesLabel: '{count} imej',
      lastUpdatedBy: 'Terakhir dikemaskini: {date} oleh {user}',
      dragToReorder: 'Seret imej untuk menyusun semula.',
      tapToMoveOrView: 'Ketik imej untuk alih atau lihat.',
      limitsReadOnly: 'Had diuruskan oleh Super Admin',
    },

    gifts: {
      title: 'Senarai Hadiah',
      itemsCount: '{count} item',
      reserved: '{reserved} / {total} ditempah',
      viewGifts: 'Hadiah',
      viewReservations: 'Tempahan',
      addGift: 'Tambah Hadiah',
      editGift: 'Sunting Hadiah',
      registryStatus: 'Status Senarai Hadiah',
      visibleToGuests: 'Senarai hadiah boleh dilihat tetamu',
      hiddenFromGuests: 'Senarai hadiah tersembunyi dari tetamu',
      loadingGifts: 'Memuatkan hadiah...',
      noGifts: 'Belum ada hadiah dalam senarai.',
      noGiftsHint: 'Tambah hadiah pertama anda untuk mencipta senarai untuk tetamu.',
      addFirstGift: 'Tambah Hadiah Pertama',
      needed: 'Diperlukan',
      cardView: 'Paparan Kad',
      listView: 'Paparan Senarai',
      categoryHome: 'Rumah',
      categoryKitchen: 'Dapur',
      categoryElectronics: 'Elektronik',
      categoryExperiences: 'Pengalaman',
      categoryOther: 'Lain-lain',
      priorityNone: 'Tiada Keutamaan',
      priorityHigh: 'Tinggi (Diperlukan)',
      priorityMedium: 'Sederhana',
      priorityLow: 'Rendah',
      totalReservations: 'Jumlah Tempahan',
      itemsReserved: 'Item Ditempah',
      uniqueGuests: 'Tetamu Unik',
      noReservations: 'Belum ada tempahan.',
      guest: 'Tetamu',
      phone: 'Telefon',
      gift: 'Hadiah',
      date: 'Tarikh',
      image: 'Imej',
      chooseImage: 'Pilih Imej',
      nameEnglish: 'Nama (Bahasa Inggeris)',
      nameMalay: 'Nama (Bahasa Melayu)',
      descriptionEnglish: 'Penerangan (Bahasa Inggeris)',
      descriptionMalay: 'Penerangan (Bahasa Melayu)',
      externalLink: 'Pautan Luaran (Shopee, dll.)',
      priceRange: 'Julat Harga',
      priceRangePlaceholder: 'Pilihan - cth., RM150 - RM200',
      category: 'Kategori',
      priority: 'Keutamaan',
      quantity: 'Kuantiti',
      quantityHint:
        'Berapa banyak item ini yang anda mahu? Beberapa tetamu boleh menempah unit berbeza.',
      notes: 'Nota (spesifikasi, warna/jenama pilihan)',
      notesPlaceholder: 'cth., Sebaik-baiknya warna putih, jenama Philips...',
      giftSettings: 'Tetapan Hadiah',
      maxItems: 'Maksimum Item',
      maxImageSize: 'Saiz Imej Maksimum (MB)',
      settingsAutoSave: 'Tetapan disimpan secara automatik apabila diubah.',
      showGiftsSection: 'Papar Senarai Hadiah di Laman Awam',
      showGiftsDesc: 'Aktifkan atau nyahaktifkan senarai hadiah untuk tetamu anda',
      deleteGift: 'Padam Hadiah',
      deleteGiftConfirm:
        "Adakah anda pasti mahu memadam '{name}'? Ini juga akan memadam semua tempahan untuk hadiah ini.",
      browseDefaults: 'Lihat Senarai Lalai',
      defaultGifts: 'Idea Hadiah Lalai',
      selectDefaults: 'Pilih hadiah untuk ditambah ke senarai anda',
      defaultGiftsHint:
        'Ini adalah cadangan untuk membantu anda bermula. Selepas ditambah, anda boleh mengedit nama, harga, penerangan, dan menambah imej untuk menyesuaikan setiap hadiah.',
      addSelectedGifts: 'Tambah {count} Dipilih',
      selectedCount: '{count} dipilih',
      alreadyInRegistry: 'Sudah Ditambah',
      addingGifts: 'Menambah hadiah...',
      addingProgress: 'Menambah {current} daripada {total}...',
      giftsAddedSuccess: '{count} hadiah berjaya ditambah!',
      noDuplicatesFound: 'Semua item sudah dalam senarai anda',
      addError: 'Gagal menambah hadiah. Sila cuba lagi.',
      selectAtLeastOne: 'Pilih sekurang-kurangnya satu hadiah',
      limitReached: 'Had senarai telah dicapai',
      limitReachedTooltip: 'Had senarai telah dicapai. Padam hadiah sedia ada untuk menambah lagi.',
      limitReachedBanner:
        'Had senarai telah dicapai ({current}/{max}). Padam hadiah sedia ada untuk menambah yang baharu.',
      selectionLimitReached:
        'Had pilihan telah dicapai. Nyahpilih beberapa hadiah atau simpan pilihan semasa terlebih dahulu.',
      // Discard selection confirmation
      discardSelectionTitle: 'Buang Pilihan?',
      discardSelectionMessage:
        'Anda mempunyai {count} hadiah dipilih. Adakah anda pasti mahu tutup tanpa menambahnya?',
      discardSelectionConfirm: 'Buang',
      discardSelectionCancel: 'Terus Memilih',
      // Search
      searchGifts: 'Cari hadiah...',
      giftsFound: '{count} hadiah dijumpai',
      noSearchResults: 'Tiada hadiah sepadan dengan carian anda',
      tryDifferentSearch: 'Cuba istilah carian atau kategori lain',
      limitsReadOnly: 'Had diuruskan oleh Super Admin',
      // View modes
      expandAll: 'Kembangkan semua',
      collapseAll: 'Kuncupkan semua',
      filters: 'Tapis',
      // Sorting
      sortBy: 'Susun mengikut',
      sortCustomOrder: 'Susunan Tersuai',
      sortPriority: 'Keutamaan (Tinggi → Rendah)',
      sortNameAsc: 'Nama (A-Z)',
      sortNameDesc: 'Nama (Z-A)',
      sortCategory: 'Kategori',
      sortAvailability: 'Ketersediaan',
      sortMostReserved: 'Paling Banyak Ditempah',
      sortNewest: 'Terkini Ditambah',
      sortOldest: 'Terlama',
      dragDisabledHint: 'Tukar ke Susunan Tersuai untuk menyusun semula item',
      // Selection mode / Bulk delete
      select: 'Pilih',
      selectAll: 'Pilih Semua',
      deselectAll: 'Nyahpilih Semua',
      deleteSelected: 'Padam Dipilih',
      exitSelection: 'Batal',
      bulkDeleteTitle: 'Padam {count} Hadiah',
      reservationsWarning: '{count} hadiah mempunyai tempahan yang juga akan dipadam',
      reservationCount: '{count} tempahan',
      deleteAll: 'Padam Semua',
      deleteOnlyUnreserved: 'Padam Tanpa Tempahan Sahaja',
      noReservationsSelected: 'Tiada hadiah dipilih yang mempunyai tempahan.',
    },

    music: {
      title: 'Pengurusan Muzik',
      tracksCount: '{count} / {max} trek',
      slotsRemaining: '({remaining} slot berbaki)',
      loadingMusic: 'Memuatkan muzik...',
      noTracks: 'Belum ada trek muzik.',
      uploadFirst: 'Muat naik trek pertama anda untuk bermula.',
      maxReached:
        'Bilangan maksimum trek ({max}) telah dicapai. Padam beberapa trek untuk muat naik lebih.',
      deleteTrack: 'Padam Trek?',
      deleteTrackConfirm: 'Adakah anda pasti mahu memadam trek ini?',
      musicSettings: 'Tetapan Muzik',
      maxTracks: 'Maksimum Trek',
      autoPlay: 'Main Automatik',
      clickToUpload: 'Klik untuk muat naik',
      orDragAndDrop: 'atau seret dan lepas',
      formatInfo: 'MP3, M4A, WAV, OGG sehingga {size}',
      filesToUpload: 'Fail untuk dimuat naik ({count})',
      trackTitle: 'Tajuk *',
      artistOptional: 'Artis (pilihan)',
      trackTitlePlaceholder: 'Tajuk trek',
      artistPlaceholder: 'Nama artis',
      uploadTracks: 'Muat naik {count} trek',
      enableMusic: 'Papar Bahagian Muzik',
      enableMusicDesc: 'Paparkan pemain muzik di laman web awam',
      autoplay: 'Main Automatik',
      autoplayDesc: 'Cuba mainkan muzik secara automatik apabila halaman dimuatkan',
      playMode: 'Mod Main',
      singleTrack: 'Trek Tunggal',
      playlist: 'Senarai Main',
      singleTrackDesc: 'Main trek terpilih sahaja',
      playlistDesc: 'Main semua trek mengikut urutan',
      shuffle: 'Kocok',
      shuffleDesc: 'Rawakkan urutan trek',
      loop: 'Ulang',
      loopSingleDesc: 'Ulang trek secara berterusan',
      loopPlaylistDesc: 'Ulang senarai main apabila selesai',
      defaultVolume: 'Kelantangan Lalai',
      autoplayNote:
        'Kebanyakan pelayar menyekat main automatik sehingga interaksi pengguna. Walaupun main automatik diaktifkan, muzik mungkin tidak bermula secara automatik pada lawatan pertama. Pelawat sentiasa boleh klik butang muzik untuk mula bermain.',
      selectTrack: 'Pilih trek',
      selectedTrack: 'Dipilih',
      noTrackSelected: 'Tiada trek dipilih',
      playlistDragToReorder: 'Senarai main (seret untuk susun semula)',
      stopPreview: 'Henti pratonton',
      unknownArtist: 'Artis tidak diketahui',
      // Music Library
      browseLibrary: 'Layari Perpustakaan',
      libraryEmpty: 'Belum ada trek dalam perpustakaan',
      addFromLibrary: 'Tambah',
      alreadyAdded: 'Ditambah',
      addedFromLibrary: 'Ditambah dari perpustakaan',
      trackFromLibrary: 'Dari perpustakaan',
    },

    musicLibrary: {
      title: 'Perpustakaan Muzik',
      description: 'Urus trek muzik global untuk semua majlis perkahwinan',
      addTrack: 'Tambah Trek',
      editTrack: 'Edit Trek',
      deleteTrack: 'Padam Trek',
      trackTitle: 'Tajuk',
      artist: 'Artis',
      category: 'Kategori',
      categories: {
        romantic: 'Romantik',
        celebration: 'Perayaan',
        classical: 'Klasik',
        traditional: 'Tradisional',
        modern: 'Moden',
        instrumental: 'Instrumental',
        other: 'Lain-lain',
      },
      uploadTrack: 'Muat Naik Trek',
      noTracksYet: 'Belum ada trek dalam perpustakaan',
      uploadFirst: 'Muat naik trek pertama anda untuk bermula',
      deleteConfirm: 'Adakah anda pasti mahu memadam trek ini?',
      deleteWarning: 'Trek ini akan dipadam secara kekal.',
      deleteWarningInUse: 'Trek ini sedang digunakan oleh majlis perkahwinan.',
      selectReplacement: 'Pilih trek pengganti:',
      replacementRequired: 'Pilih trek pengganti...',
      usedByWeddings: 'Trek ini digunakan oleh {count} majlis perkahwinan',
      tracksCount: '{count} trek jumlah',
      duration: 'Tempoh',
      license: 'Lesen',
      licenseType: 'Jenis Lesen',
      licenseTypes: {
        free: 'Percuma',
        cc0: 'CC0 (Domain Awam)',
        ccBy: 'CC-BY (Atribusi)',
        ccBySa: 'CC-BY-SA',
        ccByNc: 'CC-BY-NC',
        royaltyFree: 'Bebas Royalti',
        purchased: 'Dibeli',
        custom: 'Tersuai',
      },
      sourceUrl: 'URL Sumber',
      sourceUrlHint: 'Dari mana anda dapat trek ini? (pilihan)',
      attributionPreview: 'Pratonton Atribusi',
      searchPlaceholder: 'Cari mengikut tajuk atau artis...',
      filterAll: 'Semua Kategori',
      noResults: 'Tiada trek ditemui',
    },

    wedding: {
      title: 'Butiran Perkahwinan',
      subtitle: 'Urus maklumat pasangan, ibu bapa, dan butiran acara',
      loadingDetails: 'Memuatkan butiran perkahwinan...',
      coupleInfo: 'Maklumat Pasangan',
      coupleInfoDesc: 'Masukkan nama yang akan dipaparkan pada kad jemputan',
      fullName: 'Nama Penuh',
      fullNamePlaceholder: 'Nama penuh',
      nickname: 'Nama Panggilan',
      nicknamePlaceholder: 'Nama panggilan',
      bride: 'Pengantin Perempuan',
      groom: 'Pengantin Lelaki',
      nameDisplayOrder: 'Susunan Paparan Nama',
      nameDisplayOrderDesc:
        'Pilih sama ada untuk memaparkan nama pengantin perempuan atau lelaki dahulu di seluruh laman web.',
      brideFirst: 'Pengantin Perempuan Dahulu',
      brideFirstDesc: 'Susunan tradisional',
      groomFirst: 'Pengantin Lelaki Dahulu',
      groomFirstDesc: 'Susunan alternatif',
      bismillah: 'Kaligrafi Bismillah',
      bismillahDesc: 'Pilih gaya kaligrafi untuk Bismillah yang dipaparkan pada bahagian hero',
      showTranslation: 'Papar Terjemahan',
      showTranslationDesc: 'Paparkan terjemahan Bahasa Inggeris di bawah kaligrafi',
      traditionalStyles: 'Gaya Tradisional',
      ornateStyles: 'Gaya Hiasan',
      modernStyles: 'Gaya Moden',
      previewing: 'Pratonton:',
      bismillahMeaning: 'Dengan Nama Allah Yang Maha Pemurah Lagi Maha Penyayang',
      parentsInfo: 'Maklumat Ibu Bapa',
      parentsVisibilityDesc: 'Kawal nama ibu bapa mana yang dipaparkan pada jemputan awam',
      brideParents: 'Ibu Bapa Pengantin Perempuan',
      groomParents: 'Ibu Bapa Pengantin Lelaki',
      fatherName: 'Nama Bapa',
      fatherNamePlaceholder: 'Nama bapa',
      motherName: 'Nama Ibu',
      motherNamePlaceholder: 'Nama ibu',
      showBrideParents: 'Papar Ibu Bapa Pengantin Perempuan',
      showBrideParentsDesc: 'Paparkan nama ibu bapa pengantin perempuan pada jemputan',
      showGroomParents: 'Papar Ibu Bapa Pengantin Lelaki',
      showGroomParentsDesc: 'Paparkan nama ibu bapa pengantin lelaki pada jemputan',
      eventDetails: 'Butiran Acara',
      eventDetailsDesc: 'Tetapkan tarikh, masa, dan kod pakaian untuk tetamu anda',
      eventStartDateTime: 'Tarikh & Masa Mula Acara',
      eventEndDateTime: 'Tarikh & Masa Tamat Acara',
      dressCode: 'Kod Pakaian',
      dressCodePlaceholder: 'cth., Pastel / Warna Earthy',
      showDressCode: 'Papar Kod Pakaian',
      showDressCodeDesc: 'Paparkan bahagian kod pakaian di laman perkahwinan awam',
      displayFormat: 'Format Paparan',
      displayFormatSettings: 'Tetapan Format Paparan',
      displayFormatDesc: 'Pilih bagaimana tarikh dan masa acara akan dipaparkan di laman web awam',
      preview: 'Pratonton:',
      noDateTimeDisplayed: 'Tiada tarikh/masa akan dipaparkan',
      customOptions: 'Pilihan Tersuai',
      showDate: 'Papar tarikh',
      showDayOfWeek: 'Papar hari dalam minggu',
      showStartTime: 'Papar masa mula',
      showEndTime: 'Papar masa tamat',
      timeFormatLabel: 'Format masa:',
      time12Hour: '12-jam (AM/PM)',
      time24Hour: '24-jam',
      advancedFormat: 'Format Lanjutan (Pilihan)',
      advancedFormatDesc:
        'Gunakan rentetan format tersuai. Biarkan kosong untuk menggunakan format lalai.',
      dateFormatLabel: 'Format Tarikh',
      dateFormatPlaceholder: 'cth., DD/MM/YYYY atau MMMM D, YYYY',
      timeFormatPlaceholder: 'cth., hh:mm A atau HH:mm',
      formatTokens: 'Token format:',
      dateTokens:
        'Tarikh: YYYY (tahun), MM (bulan), DD (hari), MMMM (nama bulan), dddd (nama hari)',
      timeTokens: 'Masa: HH (24j), hh (12j), mm (minit), A (AM/PM)',
      presetDateTimeRange: 'Tarikh + Julat Masa',
      presetDateStartOnly: 'Tarikh + Masa Mula Sahaja',
      presetDateOnly: 'Tarikh Sahaja',
      presetFullDetails: 'Butiran Penuh (Baris Berasingan)',
      presetCustom: 'Tersuai',
      websiteDetails: 'Butiran Laman Web',
      websiteDetailsDesc:
        'Tetapkan hashtag untuk tetamu gunakan semasa berkongsi foto di media sosial',
      hashtag: 'Hashtag Perkahwinan',
      hashtagPlaceholder: '#HashtagPerkahwinanAnda',
      showHashtag: 'Papar Hashtag',
      showHashtagDesc: 'Paparkan hashtag perkahwinan di laman perkahwinan awam',
      savedSuccess: 'Butiran perkahwinan berjaya disimpan!',
      unsavedChanges: 'Anda mempunyai perubahan yang belum disimpan',
      lastUpdated: 'Terakhir dikemaskini: {date} oleh {user}',
    },

    venue: {
      title: 'Pengurusan Lokasi',
      subtitle: 'Kemaskini lokasi tempat untuk tetamu mencari majlis perkahwinan anda',
      loadingVenue: 'Memuatkan tetapan lokasi...',
      venueName: 'Nama Tempat',
      venueNamePlaceholder: 'cth., Dewan Seri Endon',
      address: 'Alamat',
      addressPlaceholder: 'Alamat penuh tempat',
      coordinates: 'Koordinat',
      coordinatesFromMap: 'Koordinat (dari peta)',
      latitude: 'Latitud',
      longitude: 'Longitud',
      parking: 'Maklumat Parkir',
      parkingInfo: 'Maklumat Parkir',
      parkingInfoPlaceholder: 'Arahan parkir untuk tetamu',
      parkingImages: 'Imej Parkir',
      showParkingImages: 'Papar Imej Parkir',
      parkingDirections: 'Arah Parkir',
      showParkingDirections: 'Papar Arah Parkir',
      parkingVideo: 'Video Parkir',
      showParkingVideo: 'Papar Video Parkir',
      parkingVideoUrl: 'URL Video Parkir',
      addParkingStep: 'Tambah Langkah Parkir',
      remove: 'Buang',
      savedSuccess: 'Lokasi tempat berjaya disimpan!',
      unsavedChanges: 'Anda mempunyai perubahan yang belum disimpan',
      selectLocation: 'Pilih Lokasi',
      venueDetails: 'Butiran Tempat',
      // Map picker
      searchLocation: 'Cari Lokasi',
      searchPlaceholder: 'Taip nama atau alamat tempat...',
      typeAtLeast3Chars: 'Taip sekurang-kurangnya 3 aksara untuk mencari',
      searchingFor: 'Mencari "{query}"...',
      locationsFound: '{count} lokasi ditemui',
      locationFound: '{count} lokasi ditemui',
      noLocationsFound: 'Tiada lokasi ditemui untuk "{query}"',
      tryDifferentSearch: 'Cuba istilah carian lain',
      clickMapOrDragMarker: 'Klik pada peta atau seret penanda untuk menetapkan lokasi tepat',
      // Form
      required: '*',
      optional: '(pilihan)',
      characters: '{count}/{max} aksara',
      fillRequiredFields: 'Sila lengkapkan semua ruangan wajib',
      // Preview
      previewTitle: 'Pratonton',
      howGuestsWillSee: 'Cara tetamu melihat tempat ini',
      venueLabel: 'Tempat',
      addressLabel: 'Alamat',
      parkingLabel: 'Parkir',
      enterDetailsToPreview: 'Masukkan butiran tempat untuk melihat pratonton',
      testNavigationLinks: 'Uji pautan navigasi:',
      googleMaps: 'Maps',
      waze: 'Waze',
      // Parking form
      showOnWebsite: 'Papar di laman web',
      uploadParkingPhotosDesc:
        'Muat naik foto kawasan parkir atau gambarajah peta untuk membantu tetamu mencari parkir.',
      maxImagesReached: 'Maksimum {max} imej dicapai',
      directionsTitle: 'Arah',
      step: 'langkah',
      steps: 'langkah',
      addDirectionsDesc: 'Tambah arah bernombor untuk membantu tetamu mencari parkir.',
      enterDirectionPlaceholder: 'Masukkan arah...',
      addStep: '+ Tambah Langkah',
      maxStepsAllowed: 'Maksimum 10 langkah dibenarkan',
      videoGuide: 'Panduan Video',
      added: 'Ditambah',
      addVideoDesc: 'Tambah video YouTube yang menunjukkan tetamu cara ke kawasan parkir.',
      validYoutubeUrl: 'Sila masukkan URL YouTube yang sah',
      // Direction icons
      iconNoIcon: 'Tiada ikon',
      iconGoStraight: 'Terus lurus',
      iconTurnLeft: 'Belok kiri',
      iconTurnRight: 'Belok kanan',
      iconLandmark: 'Mercu tanda',
      iconParking: 'Parkir',
      iconEntrance: 'Pintu masuk',
    },

    schedule: {
      title: 'Pengurusan Jadual',
      subtitle: 'Urus garis masa acara perkahwinan anda',
      loadingSchedule: 'Memuatkan jadual...',
      showScheduleSection: 'Papar Bahagian Jadual',
      showScheduleDesc: 'Paparkan garis masa acara di laman web awam',
      addItem: 'Tambah Acara',
      editItem: 'Sunting Acara',
      deleteItem: 'Padam Acara',
      time: 'Masa Acara',
      timePlaceholder: 'cth., 11:00 PG',
      eventTitle: 'Tajuk Acara',
      noItems: 'Belum ada acara ditambah.',
      savedSuccess: 'Jadual berjaya disimpan!',
      deleteItemConfirm: 'Adakah anda pasti mahu memadam "{title}"?',
      clearAll: 'Kosongkan Semua',
      clearAllConfirm:
        'Adakah anda pasti mahu memadam semua {count} acara jadual? Tindakan ini tidak boleh dibatalkan.',
      clearAllSuccess: 'Semua acara jadual berjaya dikosongkan!',
    },

    contacts: {
      title: 'Pengurusan Hubungan',
      subtitle: 'Urus kenalan untuk perkahwinan anda',
      loadingContacts: 'Memuatkan hubungan...',
      addContact: 'Tambah Hubungan',
      editContact: 'Sunting Hubungan',
      deleteContact: 'Padam Hubungan',
      contactName: 'Nama',
      contactNamePlaceholder: 'Nama kenalan',
      phoneNumber: 'Nombor Telefon',
      role: 'Peranan',
      rolePlaceholder: 'cth., Pengantin, Keluarga',
      noContacts: 'Belum ada hubungan ditambah.',
      savedSuccess: 'Hubungan berjaya disimpan!',
      deleteContactConfirm: 'Adakah anda pasti mahu memadam "{name}"?',
      showContactsSection: 'Papar Bahagian Kenalan',
      showContactsDesc: 'Paparkan maklumat hubungan di laman web awam',
    },

    theme: {
      title: 'Penyesuaian Tema',
      subtitle: 'Pilih tema untuk laman web perkahwinan anda',
      loadingTheme: 'Memuatkan tema...',
      selectTheme: 'Pilih',
      preview: 'Pratonton',
      customize: 'Sesuaikan',
      customColors: 'Warna Tersuai',
      primaryColor: 'Warna Utama',
      secondaryColor: 'Warna Sekunder',
      accentColor: 'Warna Aksen',
      savedSuccess: 'Tema berjaya disimpan!',
      unsavedChanges: 'Anda mempunyai perubahan yang belum disimpan',
      previewModeActive: 'Mod pratonton aktif. Perubahan belum disimpan.',
      cancelPreview: 'Batal Pratonton',
      presetThemes: 'Tema Pratetap',
      customTheme: 'Tema Tersuai',
      customThemeDescription: 'Cipta skema warna unik anda sendiri',
      saveTheme: 'Simpan Tema',
      // Customizer
      themeName: 'Nama Tema',
      myCustomTheme: 'Tema Tersuai Saya',
      lightModeColors: 'Warna Mod Cerah',
      darkModeColors: 'Warna Mod Gelap',
      fonts: 'Fon',
      selectFontPairing: 'Pilih pasangan fon pratetap:',
      currentSelection: 'Pilihan semasa:',
      headingFont: 'Tajuk:',
      bodyFont: 'Isi:',
      // Light mode color labels
      primary: 'Utama',
      primaryDesc: 'Warna aksen utama',
      primaryLight: 'Utama Cerah',
      primaryLightDesc: 'Varian lebih cerah warna utama',
      primaryDark: 'Utama Gelap',
      primaryDarkDesc: 'Varian lebih gelap warna utama',
      secondary: 'Sekunder',
      secondaryDesc: 'Warna latar belakang dan kad',
      secondaryDark: 'Sekunder Gelap',
      secondaryDarkDesc: 'Sekunder lebih gelap',
      text: 'Teks',
      textDesc: 'Warna teks utama',
      textLight: 'Teks Cerah',
      textLightDesc: 'Warna teks sekunder',
      background: 'Latar Belakang',
      backgroundDesc: 'Latar belakang halaman',
      // Dark mode color labels
      backgroundSecondary: 'Latar Belakang Sekunder',
      backgroundSecondaryDesc: 'Latar belakang kad',
      backgroundElevated: 'Latar Belakang Tinggi',
      backgroundElevatedDesc: 'Latar belakang modal/popup',
      border: 'Sempadan',
      borderDesc: 'Warna sempadan',
      textSecondary: 'Teks Sekunder',
      textSecondaryDesc: 'Teks sekunder dalam mod gelap',
      darkModeText: 'Teks',
      darkModeTextDesc: 'Teks utama dalam mod gelap',
      // Preset theme names
      // Preset theme names (10 themes)
      earthyMinimalist: 'Minimalis Bersahaja',
      earthyMinimalistDesc: 'Hijau sage hangat dengan ton pasir semula jadi',
      romanticBlush: 'Romantik Merah Jambu',
      romanticBlushDesc: 'Merah jambu debu lembut dengan aksen krim elegan',
      elegantClassic: 'Klasik Elegan',
      elegantClassicDesc: 'Emas abadi dengan gading sofistikated',
      modernBold: 'Moden Berani',
      modernBoldDesc: 'Coral ceria dengan gaya kontemporari bersih',
      gardenFresh: 'Taman Segar',
      gardenFreshDesc: 'Hijau hutan lebat dengan ton pudina segar',
      rusticCharm: 'Pesona Rustik',
      rusticCharmDesc: 'Terakota hangat dengan tekstur linen selesa',
      oceanBreeze: 'Bayu Lautan',
      oceanBreezeDesc: 'Biru pantai menenangkan dengan neutral berpasir',
      lavenderDream: 'Mimpi Lavender',
      lavenderDreamDesc: 'Warna ungu lembut dengan keanggunan romantik',
      midnightLuxe: 'Mewah Tengah Malam',
      midnightLuxeDesc: 'Keanggunan biru tua dengan aksen emas',
      sunsetGlow: 'Sinar Matahari Terbenam',
      sunsetGlowDesc: 'Ambar hangat dan coral dengan suasana matahari terbenam',
    },

    design: {
      title: 'Reka Bentuk & Susun Atur',
      subtitle: 'Pilih bagaimana laman web perkahwinan anda kelihatan',
      layoutSelection: 'Susun Atur Laman Web',
      sectionOrder: 'Susunan & Keterlihatan Bahagian',
      sectionOrderHint: 'Seret untuk susun semula. Klik ikon mata untuk togol keterlihatan.',
      resetOrder: 'Set semula ke asal',
      animationSpeed: 'Kelajuan Animasi',
      preview: 'Pratonton',
      saveDesign: 'Simpan Reka Bentuk',
      savedSuccess: 'Tetapan reka bentuk berjaya disimpan!',
      alwaysFirst: 'sentiasa pertama',
      // Layout-specific settings
      invitationCardSettings: 'Tetapan Kad Jemputan',
      showCoupleNames: 'Papar nama pasangan pada muka',
      showWeddingDate: 'Papar tarikh perkahwinan pada muka',
      autoOpenDelay: 'Kelewatan buka auto (saat, 0 = manual sahaja)',
      slideshowSettings: 'Tetapan Tayangan Slaid',
      showDots: 'Papar titik navigasi',
      showArrows: 'Papar anak panah navigasi (desktop)',
      autoPlay: 'Main slaid automatik',
      autoPlayInterval: 'Saat antara slaid',
      storybookSettings: 'Tetapan Buku Cerita',
      showPageNumbers: 'Papar nombor halaman',
      // Background features
      backgroundFeatures: 'Ciri Latar Belakang',
      backgroundFeaturesHint: 'Aktifkan atau nyahaktifkan ciri latar belakang',
      backgroundMusic: 'Muzik Latar Belakang',
      backgroundMusicDescription: 'Main muzik semasa tetamu melayari laman perkahwinan anda',
      // Empty content warnings
      emptyGallery: 'Tiada imej',
      emptySchedule: 'Tiada jadual',
      emptyWishlist: 'Tiada hadiah',
      emptyMusic: 'Tiada muzik',
    },

    heroBackground: {
      title: 'Latar Belakang Hero',
      subtitle: 'Tambah imej atau video di belakang maklumat perkahwinan anda',
      mediaType: 'Jenis Media',
      none: 'Tiada (Warna Pepejal)',
      image: 'Imej',
      video: 'Video',
      uploadMode: 'Mod Muat Naik',
      singleUpload: 'Satu muat naik untuk kedua-dua peranti',
      singleUploadDesc: 'Pilihan cepat - satu media berfungsi di mana-mana',
      separateUpload: 'Muat naik berasingan untuk desktop & mudah alih',
      separateUploadDesc: 'Kualiti terbaik - dioptimumkan untuk setiap peranti',
      universalBackground: 'Latar Belakang Universal',
      universalRecommend: 'Disyorkan: 1920x1440px (4:3) atau segi empat',
      desktopBackground: 'Latar Belakang Desktop',
      desktopRecommend: 'Disyorkan: 1920x1080px (16:9 landskap)',
      mobileBackground: 'Latar Belakang Mudah Alih',
      mobileRecommend: 'Disyorkan: 1080x1920px (9:16 potret)',
      clickToUpload: 'Klik untuk muat naik',
      uploadDesktop: 'Muat naik latar belakang desktop',
      uploadMobile: 'Muat naik latar belakang mudah alih',
      overlaySettings: 'Tetapan Lapisan',
      enableOverlay: 'Aktifkan lapisan',
      overlayHelp: 'Disyorkan untuk kebolehbacaan teks',
      overlayColor: 'Warna',
      overlayOpacity: 'Kelegapan',
      resolution: 'Resolusi',
      size: 'Saiz',
      format: 'Format',
      aspectRatio: 'Nisbah',
      confirmDelete: 'Padam media latar belakang ini?',
      uploading: 'Memuat naik...',
      deleting: 'Memadam...',
      pleaseWait: 'Sila tunggu sementara fail anda dimuat naik',
      hiddenMediaTitle: 'Anda mempunyai media sedia ada yang tidak akan dipaparkan',
      hiddenMediaDesc: 'Media berikut wujud tetapi tidak akan dipaparkan dengan tetapan semasa:',
      hiddenMediaHint:
        'Tukar kembali ke tetapan asal untuk melihatnya, atau muat naik media baharu untuk mod semasa.',
      switchModeConfirm:
        'Menukar mod akan menyembunyikan media semasa anda (ia tidak akan dipadam). Anda boleh tukar kembali bila-bila masa untuk melihatnya semula. Teruskan?',
    },

    qrHub: {
      title: 'Hub Kod QR',
      subtitle: 'Urus kod QR untuk perkahwinan anda',
      loadingSettings: 'Memuatkan tetapan...',
      saveSettings: 'Simpan Tetapan',
      savedSuccess: 'Tetapan berjaya disimpan!',
      configure: 'Konfigurasi',
      close: 'Tutup',
      // QR Types
      websiteTitle: 'Laman Web',
      websiteSubtitle: 'Kongsi jemputan perkahwinan',
      restuDigitalTitle: 'Restu Digital',
      restuDigitalSubtitle: 'Untuk yang ingin memberi restu',
      locationTitle: 'Lokasi',
      locationSubtitle: 'Navigasi ke lokasi majlis',
      wifiTitle: 'WiFi Majlis',
      wifiSubtitle: 'Sambungan internet untuk tetamu',
      rsvpTitle: 'RSVP',
      rsvpSubtitle: 'Untuk dikongsi - tetamu juga boleh guna butang RSVP di halaman',
      calendarTitle: 'Kalendar',
      calendarSubtitle: 'Simpan tarikh',
      hashtagTitle: 'Hashtag Instagram',
      hashtagSubtitle: 'Buka carian hashtag Instagram',
      hashtagNote:
        'Menggunakan hashtag dari Butiran Perkahwinan. Buka carian Instagram apabila diimbas.',
      // Location Apps
      googleMapsOnly: 'Google Maps sahaja',
      wazeOnly: 'Waze sahaja',
      googleMapsAndWaze: 'Google Maps & Waze',
      // WiFi Encryption
      wpaRecommended: 'WPA/WPA2 (Disyorkan)',
      wep: 'WEP',
      noPassword: 'Tiada kata laluan',
      // Warnings
      uploadOrDisable: 'Sila muat naik imej QR atau nyahaktifkan ciri ini',
      fillBankDetails: 'Sila isi semua butiran bank atau nyahaktifkan ciri ini',
      enterWifiSsid: 'Sila masukkan nama rangkaian WiFi (SSID) atau nyahaktifkan ciri ini',
      passwordVisibleWarning: 'Kata laluan akan kelihatan kepada tetamu',
      // Digital Blessing Config
      digitalBlessingConfig: 'Konfigurasi Restu Digital',
      taglineMessage: 'Tagline (Mesej)',
      qrDisplayMethod: 'Kaedah Paparan QR',
      uploadQrImage: 'Muat naik imej QR',
      enterBankDetails: 'Masukkan butiran bank',
      qrImageFromBank: 'Imej QR dari aplikasi bank',
      uploading: 'Memuat naik... {progress}%',
      uploadImage: 'Muat naik imej',
      bankName: 'Nama Bank',
      accountHolderName: 'Nama Pemegang Akaun',
      accountNumber: 'Nombor Akaun',
      // WiFi Config
      wifiConfiguration: 'Konfigurasi WiFi',
      networkNameSsid: 'Nama Rangkaian (SSID)',
      password: 'Kata Laluan',
      encryptionType: 'Jenis Enkripsi',
      hiddenNetwork: 'Rangkaian tersembunyi',
      // Location Config
      locationConfiguration: 'Konfigurasi Lokasi',
      navigationApp: 'Aplikasi Navigasi',
      locationFromVenue: 'Koordinat lokasi diambil dari tetapan Lokasi Majlis',
      // Hub Status
      qrHubStatus: 'Status Hub QR',
      qrHubVisible: 'Hub QR tersedia',
      qrHubHidden: 'Hub QR disembunyikan',
      hubDisabledInfo: 'Aktifkan QR Code Hub di atas untuk mengkonfigurasi kod QR individu.',
      showQrHubSection: 'Papar Hub Kod QR di Laman Awam',
      showQrHubDesc: 'Aktifkan atau nyahaktifkan hub kod QR untuk tetamu anda',
    },

    adminUsers: {
      title: 'Urus Pengguna Pentadbir',
      addAdmin: 'Tambah Pentadbir',
      createNewAdmin: 'Cipta Pentadbir Baharu',
      email: 'Emel',
      emailOptional: 'Emel (Pilihan)',
      emailHint: 'Emel selamat datang dengan maklumat log masuk akan dihantar ke alamat ini.',
      enterUsername: 'Masukkan nama pengguna',
      enterPassword: 'Masukkan kata laluan',
      enterEmail: 'Masukkan emel untuk notifikasi',
      creating: 'Mencipta...',
      loadingAdmins: 'Memuatkan pengguna pentadbir...',
      noAdmins: 'Tiada pengguna pentadbir dijumpai.',
      createFirst: 'Cipta pengguna pentadbir pertama untuk bermula.',
      createdBy: 'Dicipta oleh {user} pada {date}',
      resetPassword: 'Set Semula Kata Laluan',
      deleteAdmin: 'Padam',
      deleteConfirm: 'Adakah anda pasti mahu memadam pengguna pentadbir ini?',
      resetConfirm: 'Set semula kata laluan untuk pengguna ini?',
      adminCreated: 'Pengguna pentadbir {username} berjaya dicipta!',
      adminCreatedTitle: 'Pentadbir Berjaya Dicipta',
      adminCreatedMessage: 'Pengguna "{username}" telah dicipta',
      emailSentNote: 'dan emel selamat datang telah dihantar.',
      emailSendFailed: 'Gagal menghantar emel selamat datang',
      temporaryPassword: 'Kata Laluan Sementara',
    },

    profile: {
      title: 'Tetapan Profil',
      username: 'Nama Pengguna',
      email: 'Emel',
      save: 'Simpan',
      updateSuccess: 'Profil berjaya dikemaskini',
      loadingProfile: 'Memuatkan profil...',
      usernameCannotChange: 'Nama pengguna tidak boleh ditukar.',
      emailPlaceholder: 'Masukkan emel anda',
      emailRecoveryHint: 'Digunakan untuk pemulihan akaun dan notifikasi.',
      profileUpdated: 'Profil Dikemaskini',
    },

    modals: {
      confirmDelete: 'Sahkan Padam',
      actionCannotBeUndone: 'Tindakan ini tidak boleh dibatalkan.',
      unsavedChanges: 'Perubahan Belum Disimpan',
      discardChanges: 'Buang Perubahan',
      pleaseWait: 'Sila tunggu...',
    },

    loadingOverlay: {
      loading: 'Memuatkan...',
      saving: 'Menyimpan perubahan...',
      deleting: 'Memadam...',
      uploading: 'Memuat naik...',
      processing: 'Memproses...',
      success: 'Selesai!',
      workingOnIt: 'Sedang diproses...',
      almostThere: 'Hampir siap...',
      justAMoment: 'Sebentar lagi...',
      processing2: 'Memproses permintaan anda...',
    },

    toast: {
      archiveSuccess: 'Majlis berjaya diarkib',
      deleteSuccess: 'Majlis dipadam secara kekal',
      createSuccess: 'Majlis berjaya dicipta',
      updateSuccess: 'Perubahan berjaya disimpan',
      addOwnerSuccess: 'Admin berjaya ditambah',
      removeOwnerSuccess: 'Admin berjaya dialih keluar',
      resetPasswordSuccess: 'Kata laluan berjaya ditetapkan semula',
      addStaffSuccess: 'Staf berjaya ditambah',
      updateStaffSuccess: 'Staf berjaya dikemaskini',
      deleteStaffSuccess: 'Staf berjaya dipadam',
      genericError: 'Ralat berlaku. Sila cuba lagi.',
    },

    hardDelete: {
      title: 'Padam Majlis Secara Kekal',
      warningMessage:
        'Tindakan ini kekal dan tidak boleh dibatalkan. Semua data majlis, RSVP, gambar, dan fail akan dipadam secara kekal.',
      loadingPreview: 'Memuatkan pratonton pemadaman...',
      deletionSummary: 'Data berikut akan dipadam secara kekal:',
      rsvps: 'RSVP',
      images: 'Gambar',
      music: 'Trek muzik',
      gifts: 'Hadiah',
      parking: 'Gambar parkir',
      qrCodes: 'Kod QR',
      files: 'Fail dalam storan',
      noDataToDelete: 'Tiada data tambahan untuk dipadam.',
      confirmInstruction: 'Untuk mengesahkan, taip slug majlis:',
      deleteButton: 'Padam Selama-lamanya',
      deleting: 'Memadam...',
      successMessage: 'Majlis berjaya dipadam secara kekal',
    },

    messages: {
      saveSuccess: 'Berjaya disimpan!',
      saveFailed: 'Gagal menyimpan. Sila cuba lagi.',
      deleteSuccess: 'Berjaya dipadam!',
      deleteFailed: 'Gagal memadam. Sila cuba lagi.',
      uploadSuccess: 'Berjaya dimuat naik!',
      uploadFailed: 'Gagal memuat naik. Sila cuba lagi.',
      loadFailed: 'Gagal memuatkan. Sila cuba lagi.',
      networkError: 'Ralat rangkaian. Sila semak sambungan anda.',
      lastUpdated: 'Terakhir dikemaskini',
      by: 'oleh',
      unsavedChanges: 'Anda mempunyai perubahan yang belum disimpan',
      savedSuccess: 'Perubahan berjaya disimpan!',
    },

    staff: {
      title: 'Pengurusan Staf',
      description: 'Urus pasukan anda yang membantu menguruskan majlis',
      addStaff: 'Tambah Staf',
      editStaff: 'Edit Staf',
      deleteStaff: 'Padam Staf',
      username: 'Nama Pengguna',
      email: 'Emel',
      password: 'Kata Laluan',
      managingWeddings: 'Menguruskan {count} majlis',
      noWeddings: 'Tiada majlis ditugaskan',
      noStaffYet: 'Tiada staf lagi',
      createFirst: 'Cipta staf pertama anda untuk bermula',
      deleteConfirm: 'Adakah anda pasti mahu memadam "{username}"?',
      deleteWarning: 'Mereka akan dikeluarkan dari semua majlis yang diuruskan.',
      createdAt: 'Dicipta',
      assignStaff: 'Tugaskan Staf',
      createClient: 'Cipta Klien',
      noAssignment: 'Tiada Tugasan',
      noAssignmentDesc:
        'Super admin akan menguruskan perkahwinan ini secara langsung. Anda boleh menambah pemilik kemudian.',
      selectStaff: 'Pilih Ahli Staf',
      selectStaffPlaceholder: 'Pilih ahli staf...',
      clientDetails: 'Butiran Klien',
      roleLabel: 'Peranan',
      roleLabelPlaceholder: 'cth., Pengantin Perempuan, Pengantin Lelaki, Ibu Bapa',
      bride: 'Pengantin Perempuan',
      groom: 'Pengantin Lelaki',
      parent: 'Ibu Bapa',
      other: 'Lain-lain',
      searchPlaceholder: 'Cari mengikut nama pengguna atau emel...',
      filterAll: 'Semua',
      filterWithWeddings: 'Dengan Majlis',
      filterNoWeddings: 'Tiada Majlis',
      noResults: 'Tiada staf ditemui',
    },

    superAdmin: {
      uploadLimits: 'Had Muat Naik',
      galleryLimits: 'Had Galeri',
      giftLimits: 'Had Hadiah',
      searchPlaceholder: 'Cari mengikut nama, slug, atau pemilik...',
      filterAll: 'Semua',
      filterActive: 'Aktif',
      filterArchived: 'Diarkib',
      filterDraft: 'Draf',
      noResults: 'Tiada majlis ditemui',
    },

    superAdminSettings: {
      title: 'Tetapan',
      description: 'Urus tetapan akaun anda',
      changePassword: 'Tukar Kata Laluan',
      changePasswordDesc: 'Kemaskini kelayakan log masuk anda',
      currentPassword: 'Kata Laluan Semasa',
      newPassword: 'Kata Laluan Baharu',
      confirmPassword: 'Sahkan Kata Laluan Baharu',
      passwordMinLength: 'Kata laluan mestilah sekurang-kurangnya 6 aksara',
      passwordsDoNotMatch: 'Kata laluan tidak sepadan',
      passwordSameAsCurrent: 'Kata laluan baharu mestilah berbeza daripada kata laluan semasa',
      passwordChanged: 'Kata laluan berjaya ditukar',
      changingPassword: 'Menukar kata laluan...',
      manageSuperAdmins: 'Urus Super Admin',
      manageSuperAdminsDesc: 'Tetapkan semula kata laluan untuk akaun super admin lain',
      noOtherAdmins: 'Tiada akaun super admin lain',
      resetPassword: 'Tetapkan Semula Kata Laluan',
      resetPasswordConfirm: 'Tetapkan semula kata laluan untuk "{username}"?',
      resetPasswordWarning:
        'Mereka akan menerima kata laluan sementara dan mesti menukarnya semasa log masuk seterusnya.',
      noEmail: 'Tiada emel dikonfigurasi',
      createdAt: 'Dicipta',
      settingsTab: 'Tetapan',
    },

    weddingContext: {
      switchWedding: 'Tukar Majlis',
      selectWedding: 'Pilih Majlis',
      statusActive: 'Aktif',
      statusDraft: 'Draf',
      statusArchived: 'Diarkib',
      loading: 'Memuatkan...',
      errorLoading: 'Gagal memuatkan senarai majlis',
      noWeddingSelected: 'Tiada majlis dipilih',
    },

    unsavedChanges: {
      title: 'Perubahan Belum Disimpan',
      message:
        'Anda mempunyai perubahan yang belum disimpan di {tab}. Apa yang ingin anda lakukan?',
      saveAndContinue: 'Simpan & Teruskan',
      discard: 'Buang',
      stay: 'Kekal',
      saving: 'Menyimpan...',
      saveError: 'Gagal menyimpan perubahan. Sila cuba lagi.',
      changesSaved: 'Perubahan disimpan!',
    },
  },
}
