export interface Image {
    id: string;
    url: string;
    thumbnailUrl: string;
    author: string;
    tags: string[];
    description: string;
    width: number;
    height: number;
    downloadUrl: string;
  }
  
  export interface PaginatedResponse<T> {
    data: T[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      hasMore: boolean;
    };
  }
  
  export interface SearchResult {
    image: Image;
    score: number;
  }
  
  export interface SearchResponse {
    results: SearchResult[];
    queryType: 'tag' | 'semantic';
    processingTime: number;
  }
  
  export interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
  }
  
  export interface ChatResponse {
    reply: string;
    suggestedImages?: Image[];
    suggestedTags?: string[];
    action?: 'search' | 'filter' | 'recommend';
  }