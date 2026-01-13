export type Language = "ms" | "en" | "zh" | "ta";

export const languageNames: Record<Language, string> = {
  ms: "BM",
  en: "EN",
  zh: "中文",
  ta: "தமிழ்",
};

export interface Translations {
  // Hero Section
  hero: {
    bismillahTranslation: string;
    weddingOf: string;
  };
  // Details Section
  details: {
    greeting: string;
    withGratitude: string;
    together: string;
    invitation: string;
    date: string;
    time: string;
    venue: string;
    dressCode: string;
    shareYourMoments: string;
    copied: string;
  };
  // Schedule Section
  schedule: {
    title: string;
  };
  // Contact Section
  contact: {
    title: string;
    subtitle: string;
    whatsappMessage: string;
  };
  // QR Code Section
  qrCode: {
    title: string;
    subtitle: string;
    download: string;
    share: string;
    linkCopied: string;
  };
  // RSVP Section
  rsvp: {
    title: string;
    subtitle: string;
    titleLabel: string;
    fullName: string;
    fullNamePlaceholder: string;
    attendance: string;
    attending: string;
    notAttending: string;
    numberOfGuests: string;
    guestUnit: string;
    phoneNumber: string;
    phonePlaceholder: string;
    message: string;
    messagePlaceholder: string;
    submit: string;
    submitting: string;
    thankYou: string;
    responseReceived: string;
    prayer: string;
    errorName: string;
    errorPhone: string;
    errorGeneric: string;
  };
  // Gallery Section
  gallery: {
    title: string;
    subtitle: string;
    close: string;
    previous: string;
    next: string;
    photoOf: string;
    viewAll: string;
  };
  // Guestbook Section
  guestbook: {
    title: string;
    subtitle: string;
    loading: string;
    noWishes: string;
    errorLoading: string;
  };
  // Navigation
  nav: {
    maps: string;
    waze: string;
    calendar: string;
    weddingInvitation: string;
    backToInvitation: string;
  };
  // Common
  common: {
    and: string;
  };
}

export const translations: Record<Language, Translations> = {
  // Bahasa Melayu
  ms: {
    hero: {
      bismillahTranslation: "Dengan Nama Allah Yang Maha Pemurah Lagi Maha Penyayang",
      weddingOf: "Walimatulurus",
    },
    details: {
      greeting: "Assalamualaikum Warahmatullahi Wabarakatuh",
      withGratitude: "Dengan penuh kesyukuran ke hadrat Ilahi, kami",
      together: "bersama",
      invitation:
        "dengan segala hormatnya menjemput Tan Sri / Puan Sri / Dato' Seri / Datin Seri / Dato' / Datin / Tuan / Puan / Encik / Cik ke majlis perkahwinan puteri/putera kesayangan kami",
      date: "Tarikh",
      time: "Masa",
      venue: "Tempat",
      dressCode: "Kod Pakaian",
      shareYourMoments: "Kongsi Momen Anda",
      copied: "Disalin!",
    },
    schedule: {
      title: "Aturcara Majlis",
    },
    contact: {
      title: "Hubungi Kami",
      subtitle: "Ada pertanyaan? Hubungi kami melalui WhatsApp",
      whatsappMessage: "Assalamualaikum, saya ingin bertanya mengenai majlis perkahwinan {couple}.",
    },
    qrCode: {
      title: "Kongsi Jemputan",
      subtitle: "Imbas kod QR untuk berkongsi jemputan ini",
      download: "Muat Turun",
      share: "Kongsi",
      linkCopied: "Link telah disalin!",
    },
    rsvp: {
      title: "RSVP",
      subtitle: "Sila maklumkan kehadiran anda",
      titleLabel: "Gelaran",
      fullName: "Nama Penuh",
      fullNamePlaceholder: "Nama penuh anda",
      attendance: "Kehadiran",
      attending: "Ya, saya akan hadir",
      notAttending: "Maaf, tidak dapat hadir",
      numberOfGuests: "Bilangan Tetamu",
      guestUnit: "orang",
      phoneNumber: "Nombor Telefon",
      phonePlaceholder: "012-3456789",
      message: "Ucapan / Doa (Pilihan)",
      messagePlaceholder: "Tinggalkan ucapan atau doa untuk pengantin...",
      submit: "Hantar RSVP",
      submitting: "Menghantar...",
      thankYou: "Terima Kasih!",
      responseReceived: "Maklum balas anda telah diterima.",
      prayer:
        '"Ya Allah, berkatilah majlis ini dan kurniakanlah kebahagiaan kepada kedua mempelai. Amin."',
      errorName: "Sila masukkan nama penuh anda.",
      errorPhone: "Sila masukkan nombor telefon anda.",
      errorGeneric: "Maaf, terdapat masalah. Sila cuba lagi.",
    },
    gallery: {
      title: "Galeri Foto",
      subtitle: "Momen indah bersama kami",
      close: "Tutup",
      previous: "Sebelum",
      next: "Seterusnya",
      photoOf: "Foto {current} daripada {total}",
      viewAll: "Lihat Semua Foto",
    },
    guestbook: {
      title: "Ucapan & Doa",
      subtitle: "Ucapan dan doa daripada para tetamu",
      loading: "Memuatkan ucapan...",
      noWishes: "Belum ada ucapan lagi. Jadilah yang pertama!",
      errorLoading: "Gagal memuatkan ucapan. Sila cuba lagi.",
    },
    nav: {
      maps: "Maps",
      waze: "Waze",
      calendar: "Kalendar",
      weddingInvitation: "Jemputan Perkahwinan",
      backToInvitation: "Kembali ke Jemputan",
    },
    common: {
      and: "&",
    },
  },

  // English
  en: {
    hero: {
      bismillahTranslation: "In the Name of Allah, the Most Gracious, the Most Merciful",
      weddingOf: "The Wedding of",
    },
    details: {
      greeting: "Assalamualaikum Warahmatullahi Wabarakatuh",
      withGratitude: "With gratitude to the Almighty, we",
      together: "together with",
      invitation:
        "cordially invite Tan Sri / Puan Sri / Dato' Seri / Datin Seri / Dato' / Datin / Tuan / Puan / Encik / Cik to the wedding celebration of our beloved",
      date: "Date",
      time: "Time",
      venue: "Venue",
      dressCode: "Dress Code",
      shareYourMoments: "Share Your Moments",
      copied: "Copied!",
    },
    schedule: {
      title: "Event Schedule",
    },
    contact: {
      title: "Contact Us",
      subtitle: "Have questions? Reach us via WhatsApp",
      whatsappMessage: "Hello, I would like to inquire about {couple}'s wedding.",
    },
    qrCode: {
      title: "Share Invitation",
      subtitle: "Scan QR code to share this invitation",
      download: "Download",
      share: "Share",
      linkCopied: "Link copied!",
    },
    rsvp: {
      title: "RSVP",
      subtitle: "Please confirm your attendance",
      titleLabel: "Title",
      fullName: "Full Name",
      fullNamePlaceholder: "Your full name",
      attendance: "Attendance",
      attending: "Yes, I will attend",
      notAttending: "Sorry, I cannot attend",
      numberOfGuests: "Number of Guests",
      guestUnit: "person(s)",
      phoneNumber: "Phone Number",
      phonePlaceholder: "012-3456789",
      message: "Message / Prayer (Optional)",
      messagePlaceholder: "Leave a message or prayer for the couple...",
      submit: "Submit RSVP",
      submitting: "Submitting...",
      thankYou: "Thank You!",
      responseReceived: "Your response has been received.",
      prayer:
        '"O Allah, bless this union and grant happiness to the newlyweds. Amin."',
      errorName: "Please enter your full name.",
      errorPhone: "Please enter your phone number.",
      errorGeneric: "Sorry, there was an error. Please try again.",
    },
    gallery: {
      title: "Photo Gallery",
      subtitle: "Beautiful moments with us",
      close: "Close",
      previous: "Previous",
      next: "Next",
      photoOf: "Photo {current} of {total}",
      viewAll: "View All Photos",
    },
    guestbook: {
      title: "Wishes & Prayers",
      subtitle: "Wishes and prayers from our guests",
      loading: "Loading wishes...",
      noWishes: "No wishes yet. Be the first!",
      errorLoading: "Failed to load wishes. Please try again.",
    },
    nav: {
      maps: "Maps",
      waze: "Waze",
      calendar: "Calendar",
      weddingInvitation: "Wedding Invitation",
      backToInvitation: "Back to Invitation",
    },
    common: {
      and: "&",
    },
  },

  // Mandarin (Chinese)
  zh: {
    hero: {
      bismillahTranslation: "奉至仁至慈的真主之名",
      weddingOf: "婚礼邀请",
    },
    details: {
      greeting: "愿真主的平安与祝福与您同在",
      withGratitude: "感谢真主的恩典，我们",
      together: "与",
      invitation:
        "诚挚邀请 Tan Sri / Puan Sri / Dato' Seri / Datin Seri / Dato' / Datin / Tuan / Puan / Encik / Cik 出席我们爱子/爱女的婚礼",
      date: "日期",
      time: "时间",
      venue: "地点",
      dressCode: "着装要求",
      shareYourMoments: "分享精彩时刻",
      copied: "已复制！",
    },
    schedule: {
      title: "活动流程",
    },
    contact: {
      title: "联系我们",
      subtitle: "有疑问？请通过WhatsApp联系我们",
      whatsappMessage: "Hello, I would like to inquire about {couple}'s wedding.",
    },
    qrCode: {
      title: "分享邀请函",
      subtitle: "扫描二维码分享此邀请函",
      download: "下载",
      share: "分享",
      linkCopied: "链接已复制！",
    },
    rsvp: {
      title: "回复出席",
      subtitle: "请确认您的出席",
      titleLabel: "称谓",
      fullName: "全名",
      fullNamePlaceholder: "您的全名",
      attendance: "出席确认",
      attending: "是的，我会出席",
      notAttending: "抱歉，无法出席",
      numberOfGuests: "宾客人数",
      guestUnit: "人",
      phoneNumber: "电话号码",
      phonePlaceholder: "012-3456789",
      message: "祝福语（选填）",
      messagePlaceholder: "为新人留下祝福...",
      submit: "提交回复",
      submitting: "提交中...",
      thankYou: "谢谢！",
      responseReceived: "已收到您的回复。",
      prayer: '"愿真主祝福这场婚礼，赐予新人幸福美满。阿敏。"',
      errorName: "请输入您的全名。",
      errorPhone: "请输入您的电话号码。",
      errorGeneric: "抱歉，发生错误。请重试。",
    },
    gallery: {
      title: "照片集",
      subtitle: "与我们共度的美好时光",
      close: "关闭",
      previous: "上一张",
      next: "下一张",
      photoOf: "第 {current} 张，共 {total} 张",
      viewAll: "查看全部照片",
    },
    guestbook: {
      title: "祝福留言",
      subtitle: "来自宾客的祝福与祈祷",
      loading: "加载祝福中...",
      noWishes: "暂无祝福。成为第一位留言者！",
      errorLoading: "加载祝福失败。请重试。",
    },
    nav: {
      maps: "地图",
      waze: "Waze",
      calendar: "日历",
      weddingInvitation: "婚礼邀请",
      backToInvitation: "返回邀请函",
    },
    common: {
      and: "&",
    },
  },

  // Tamil
  ta: {
    hero: {
      bismillahTranslation: "அருளாளனும் அன்புடையோனுமாகிய அல்லாஹ்வின் திருப்பெயரால்",
      weddingOf: "திருமண விழா",
    },
    details: {
      greeting: "அஸ்ஸலாமு அலைக்கும் வரஹ்மதுல்லாஹி வபரகாத்துஹு",
      withGratitude: "இறைவனுக்கு நன்றியுடன், நாங்கள்",
      together: "உடன்",
      invitation:
        "Tan Sri / Puan Sri / Dato' Seri / Datin Seri / Dato' / Datin / Tuan / Puan / Encik / Cik அவர்களை எங்கள் அன்பு மகன்/மகளின் திருமண விழாவிற்கு அன்புடன் அழைக்கிறோம்",
      date: "தேதி",
      time: "நேரம்",
      venue: "இடம்",
      dressCode: "ஆடை குறியீடு",
      shareYourMoments: "உங்கள் தருணங்களைப் பகிரவும்",
      copied: "நகலெடுக்கப்பட்டது!",
    },
    schedule: {
      title: "நிகழ்ச்சி அட்டவணை",
    },
    contact: {
      title: "எங்களை தொடர்பு கொள்ள",
      subtitle: "கேள்விகள் உள்ளதா? WhatsApp மூலம் தொடர்பு கொள்ளவும்",
      whatsappMessage: "Hello, I would like to inquire about {couple}'s wedding.",
    },
    qrCode: {
      title: "அழைப்பிதழைப் பகிரவும்",
      subtitle: "இந்த அழைப்பிதழைப் பகிர QR குறியீட்டை ஸ்கேன் செய்யவும்",
      download: "பதிவிறக்கம்",
      share: "பகிர்",
      linkCopied: "இணைப்பு நகலெடுக்கப்பட்டது!",
    },
    rsvp: {
      title: "RSVP",
      subtitle: "உங்கள் வருகையை உறுதிப்படுத்தவும்",
      titleLabel: "பட்டம்",
      fullName: "முழுப் பெயர்",
      fullNamePlaceholder: "உங்கள் முழுப் பெயர்",
      attendance: "வருகை",
      attending: "ஆம், நான் வருவேன்",
      notAttending: "மன்னிக்கவும், வர இயலாது",
      numberOfGuests: "விருந்தினர் எண்ணிக்கை",
      guestUnit: "நபர்",
      phoneNumber: "தொலைபேசி எண்",
      phonePlaceholder: "012-3456789",
      message: "செய்தி / பிரார்த்தனை (விருப்பம்)",
      messagePlaceholder: "தம்பதியருக்கு வாழ்த்துக்களை விடுங்கள்...",
      submit: "சமர்ப்பிக்கவும்",
      submitting: "சமர்ப்பிக்கிறது...",
      thankYou: "நன்றி!",
      responseReceived: "உங்கள் பதில் பெறப்பட்டது.",
      prayer:
        '"அல்லாஹ், இந்த திருமணத்தை ஆசீர்வதித்து புதுமணத் தம்பதிகளுக்கு மகிழ்ச்சியை வழங்குவாயாக. ஆமீன்."',
      errorName: "உங்கள் முழுப் பெயரை உள்ளிடவும்.",
      errorPhone: "உங்கள் தொலைபேசி எண்ணை உள்ளிடவும்.",
      errorGeneric: "மன்னிக்கவும், பிழை ஏற்பட்டது. மீண்டும் முயற்சிக்கவும்.",
    },
    gallery: {
      title: "புகைப்பட தொகுப்பு",
      subtitle: "எங்களுடன் இனிய தருணங்கள்",
      close: "மூடு",
      previous: "முந்தைய",
      next: "அடுத்த",
      photoOf: "படம் {current} / {total}",
      viewAll: "அனைத்து படங்களையும் காண",
    },
    guestbook: {
      title: "வாழ்த்துக்கள்",
      subtitle: "விருந்தினர்களின் வாழ்த்துக்களும் பிரார்த்தனைகளும்",
      loading: "வாழ்த்துக்களை ஏற்றுகிறது...",
      noWishes: "இன்னும் வாழ்த்துக்கள் இல்லை. முதல் நபராக இருங்கள்!",
      errorLoading: "வாழ்த்துக்களை ஏற்ற முடியவில்லை. மீண்டும் முயற்சிக்கவும்.",
    },
    nav: {
      maps: "வரைபடம்",
      waze: "Waze",
      calendar: "நாட்காட்டி",
      weddingInvitation: "திருமண அழைப்பிதழ்",
      backToInvitation: "அழைப்பிதழுக்குத் திரும்பு",
    },
    common: {
      and: "&",
    },
  },
};
