export interface Admin {
  id: string;
  name: string;
  email: string;
  role: "admin" | "superadmin";
}

export interface HeroImage {
  _id: string;
  url: string;
  publicId: string;
  alt: string;
  order: number;
  createdAt: string;
}

export interface DownloadFile {
  _id: string;
  title: string;
  description: string;
  url: string;
  publicId: string;
  size: number;
  format: string;
  downloads: number;
  createdAt: string;
}

export interface Subscriber {
  _id: string;
  email: string;
  status: "active" | "unsubscribed";
  createdAt: string;
}

export interface Campaign {
  _id: string;
  subject: string;
  html: string;
  recipientsCount: number;
  sent: number;
  failed: number;
  status: "pending" | "sent" | "partial" | "failed";
  createdAt: string;
}

export interface Settings {
  _id: string;
  logo: { url: string; publicId: string };
  social: {
    facebook: string;
    instagram: string;
    twitter: string;
    youtube: string;
    tiktok: string;
    linkedin: string;
  };
  whatsapp: string;
  contactEmail: string;
}

export type Lang = "ar" | "en";
export type Theme = "light" | "dark";
