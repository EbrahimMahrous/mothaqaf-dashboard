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
  mimeType?: string;
  downloads: number;
  views: number;
  category: "management" | "career" | "business" | "decision" | "other";
  tags: string[];
  coverImage?: string;
  isNew?: boolean;
  isFeatured?: boolean;
  isPublished?: boolean;
  order?: number;
  createdAt: string;
  updatedAt?: string;
  videoUrl?: string;
}

export interface Subscriber {
  _id: string;
  email: string;
  name?: string;
  status: "active" | "unsubscribed";
  lists: { _id: string; name: string; color: string }[];
  tags: string[];
  source: string;
  lastSentAt?: string | null;
  notes?: string;
  createdAt: string;
}

export interface Campaign {
  _id: string;
  subject: string;
  html: string;
  audience: "all" | "lists" | "manual";
  listIds: string[];
  manualEmails: string[];
  attachments: CampaignAttachment[];
  recipientsCount: number;
  sent: number;
  failed: number;
  status: "pending" | "sending" | "sent" | "partial" | "failed";
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
export interface SubscriberList {
  _id: string;
  name: string;
  description: string;
  color: string;
  tags: string[];
  subscriberCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CampaignAttachment {
  url: string;
  publicId?: string;
  name: string;
  type: "image" | "file";
  size: number;
  mime?: string;
}

export type Lang = "ar" | "en";
export type Theme = "light" | "dark";
