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
    embedding?: number[];
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
  
  export interface SearchRequest {
    query: string;
    limit?: number;
    threshold?: number;
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
  
  export interface ChatRequest {
    message: string;
    conversationHistory?: ChatMessage[];
  }
  
  export interface ChatResponse {
    reply: string;
    suggestedImages?: Image[];
    suggestedTags?: string[];
    action?: 'search' | 'filter' | 'recommend';
  }
  
  export interface PicsumImage {
    id: string;
    author: string;
    width: number;
    height: number;
    url: string;
    download_url: string;
  }