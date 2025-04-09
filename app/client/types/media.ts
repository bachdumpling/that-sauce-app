export interface Media {
  id: string;
  type: "image" | "video" | "audio";
  url: string;
  thumbnailUrl?: string;
  projectId?: string;
  creatorId: string;
  title?: string;
  description?: string;
  status: string;
  createdAt?: string;
  updatedAt?: string;
  metadata?: Record<string, any>;
} 