import { Job } from "./types";

export const JOBS: Job[] = [
  {
    id: "ojol",
    title: "Driver Ojek Online (Ojol)",
    desc: "Narik penumpang & anter paket seblak keliling kota.",
    reward: 50000,
    durationMs: 4000,
    icon: "Bike"
  },
  {
    id: "freelance",
    title: "Kuli IT / Jasa Desain Canva",
    desc: "Bikin revisi logo kelima belas buat klien rewel.",
    reward: 180000,
    durationMs: 8000,
    icon: "Laptop"
  },
  {
    id: "lembur",
    title: "Lembur Admin Kantoran",
    desc: "Ngerapihin spreadsheet dari tahun 2020 demi upah tambahan.",
    reward: 450000,
    durationMs: 15000,
    icon: "Briefcase"
  },
  {
    id: "crypto",
    title: "Main Koin Kucing (Investasi)",
    desc: "Spekulasi koin micin. Ada resiko cuan gede atau rugi bandar!",
    reward: 350000, // randomized logic handled in UI, can be positive/negative
    durationMs: 6000,
    icon: "Coins"
  }
];
