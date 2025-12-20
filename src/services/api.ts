import axios from 'axios';
import type { Image, PaginatedResponse, SearchResponse, ChatResponse, ChatMessage } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request/response interceptors for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export const imageApi = {
  /**
   * Fetch paginated images
   */
  getImages: async (page: number = 1, limit: number = 20, tag?: string): Promise<PaginatedResponse<Image>> => {
    const params: any = { page, limit };
    if (tag) params.tag = tag;
    
    const response = await api.get<PaginatedResponse<Image>>('/images', { params });
    return response.data;
  },

  /**
   * Get single image by ID
   */
  getImage: async (id: string): Promise<Image> => {
    const response = await api.get<Image>(`/images/${id}`);
    return response.data;
  },

  /**
   * Get all available tags
   */
  getTags: async (): Promise<string[]> => {
    const response = await api.get<{ tags: string[] }>('/images/tags/all');
    return response.data.tags;
  },
};

export const searchApi = {
  /**
   * Semantic search for images
   */
  search: async (query: string, limit: number = 10): Promise<SearchResponse> => {
    const response = await api.post<SearchResponse>('/search', { query, limit });
    return response.data;
  },

  /**
   * Find similar images
   */
  findSimilar: async (imageId: string, limit: number = 10): Promise<{ sourceImage: Image; results: SearchResponse['results'] }> => {
    const response = await api.get(`/search/similar/${imageId}`, { params: { limit } });
    return response.data;
  },
};

export const chatApi = {
  /**
   * Send message to AI assistant
   */
  sendMessage: async (message: string, history: ChatMessage[] = []): Promise<ChatResponse> => {
    const response = await api.post<ChatResponse>('/chat', {
      message,
      conversationHistory: history,
    });
    return response.data;
  },

  /**
   * Get conversation suggestions
   */
  getSuggestions: async (): Promise<string[]> => {
    const response = await api.get<{ suggestions: string[] }>('/chat/suggestions');
    return response.data.suggestions;
  },
};

export default api;