import type { WeddingConfig } from "@/types";

export const weddingConfig: WeddingConfig = {
  couple: {
    bride: {
      fullName: "Nama Penuh Pengantin Perempuan",
      nickname: "Aisyah",
    },
    groom: {
      fullName: "Nama Penuh Pengantin Lelaki",
      nickname: "Ahmad",
    },
  },
  parents: {
    bride: {
      father: "Encik Bapa Pengantin Perempuan",
      mother: "Puan Ibu Pengantin Perempuan",
    },
    groom: {
      father: "Encik Bapa Pengantin Lelaki",
      mother: "Puan Ibu Pengantin Lelaki",
    },
  },
  event: {
    date: new Date("2026-12-12T11:00:00+08:00"),
    venue: {
      name: "Dewan Seri Endon",
      address:
        "Persiaran Mahameru, Presint 10, 62502 Putrajaya, Wilayah Persekutuan Putrajaya",
      googleMapsUrl: "https://maps.google.com/?q=Dewan+Seri+Endon+Putrajaya",
      wazeUrl: "https://waze.com/ul/hw283h2z5c",
      coordinates: {
        lat: 2.9264,
        lng: 101.6964,
      },
    },
    schedule: [
      {
        time: "11:00 AM",
        title: "Guest Arrival",
        titleMalay: "Ketibaan Tetamu",
      },
      {
        time: "11:30 AM",
        title: "Lunch Begins",
        titleMalay: "Jamuan Makan Bermula",
      },
      {
        time: "12:30 PM",
        title: "Bride & Groom Arrival",
        titleMalay: "Ketibaan Pengantin",
      },
      {
        time: "4:00 PM",
        title: "Event Ends",
        titleMalay: "Majlis Tamat",
      },
    ],
  },
  contacts: [
    {
      name: "Abang Ahmad",
      role: "Abang Pengantin Lelaki",
      phone: "+60123456789",
    },
    {
      name: "Kakak Aisyah",
      role: "Kakak Pengantin Perempuan",
      phone: "+60198765432",
    },
  ],
  hashtag: "#AisyahAhmadWedding",
  dressCode: "Pastel / Earthy Tones",
};
