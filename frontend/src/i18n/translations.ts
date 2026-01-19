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
  }
  // Common
  common: {
    and: string
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
      subtitle: 'Ada pertanyaan? Hubungi kami melalui WhatsApp',
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
    },
    common: {
      and: '&',
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
      subtitle: 'Have questions? Reach us via WhatsApp',
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
    },
    common: {
      and: '&',
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
      subtitle: '有疑问？请通过WhatsApp联系我们',
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
    },
    common: {
      and: '&',
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
      subtitle: 'கேள்விகள் உள்ளதா? WhatsApp மூலம் தொடர்பு கொள்ளவும்',
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
    },
    common: {
      and: '&',
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
    // Categories
    categoryHome: string
    categoryKitchen: string
    categoryElectronics: string
    categoryExperiences: string
    categoryOther: string
    // Priority
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
    // Delete
    deleteGift: string
    deleteGiftConfirm: string
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
    eventEndTime: string
    dressCode: string
    dressCodePlaceholder: string
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
      categoryHome: 'Home',
      categoryKitchen: 'Kitchen',
      categoryElectronics: 'Electronics',
      categoryExperiences: 'Experiences',
      categoryOther: 'Other',
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
      deleteGift: 'Delete Gift',
      deleteGiftConfirm:
        "Are you sure you want to delete '{name}'? This will also delete all reservations for this gift.",
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
      eventEndTime: 'Event End Time',
      dressCode: 'Dress Code',
      dressCodePlaceholder: 'e.g., Pastel / Earthy Tones',
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
      categoryHome: 'Rumah',
      categoryKitchen: 'Dapur',
      categoryElectronics: 'Elektronik',
      categoryExperiences: 'Pengalaman',
      categoryOther: 'Lain-lain',
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
      deleteGift: 'Padam Hadiah',
      deleteGiftConfirm:
        "Adakah anda pasti mahu memadam '{name}'? Ini juga akan memadam semua tempahan untuk hadiah ini.",
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
      eventEndTime: 'Masa Tamat Acara',
      dressCode: 'Kod Pakaian',
      dressCodePlaceholder: 'cth., Pastel / Warna Earthy',
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
