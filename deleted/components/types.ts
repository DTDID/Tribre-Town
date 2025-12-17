
export type ContentType = 'text' | 'image' | 'idea';

export interface WorkItem {
  id: string;
  type: ContentType;
  content: string;
  timestamp: number;
  metadata?: {
    prompt?: string;
    aspectRatio?: string;
  };
}

export interface AppState {
  items: WorkItem[];
  isLoading: boolean;
  theme: 'light' | 'dark';
  isZenMode: boolean;
}
