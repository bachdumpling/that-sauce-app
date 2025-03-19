export interface Project {
  id: string;
  title: string;
  description: string | null;
  creator_id: string;
  portfolio_id: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectWithMedia extends Project {
  media: (ImageMedia | VideoMedia)[];
}

export interface ImageMedia {
  id: string;
  project_id: string;
  url: string;
  order: number;
  created_at: string;
  analysis?: string;
  embedding?: number[];
  file_type: 'image';
}

export interface VideoMedia {
  id: string;
  project_id: string;
  url: string;
  created_at: string;
  analysis?: string;
  embedding?: number[];
  file_type: 'video';
} 