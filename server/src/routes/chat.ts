import { Router } from 'express';
import { ChatRequest, ChatResponse, Image } from '../types';
import { extractSearchIntent, getAllTags } from '../services/aiService';
import axios from 'axios';

const chatRoutes = Router();
const PICSUM_API = 'https://picsum.photos';

// Conversation context storage (in production, use Redis or similar)
const conversationContexts = new Map<string, any>();

/**
 * POST /api/chat
 * AI assistant endpoint for natural language interaction
 */
chatRoutes.post('/', async (req, res, next) => {
  try {
    const { message, conversationHistory = [] }: ChatRequest = req.body;
    
    if (!message || message.trim().length === 0) {
      return res.status(400).json({ error: 'Message is required' });
    }
    
    // Extract intent from user message
    const intent = extractSearchIntent(message);
    
    // Generate response based on intent
    const response = await generateChatResponse(message, intent, conversationHistory);
    
    res.json(response);
  } catch (error) {
    next(error);
  }
});

/**
 * Generate contextual chat response
 */
async function generateChatResponse(
  message: string,
  intent: ReturnType<typeof extractSearchIntent>,
  history: any[]
): Promise<ChatResponse> {
  const messageLower = message.toLowerCase();
  
  // Handle different types of queries
  
  // Greeting
  if (messageLower.match(/^(hi|hello|hey|greetings)/)) {
    return {
      reply: "Hello! I'm your AI gallery assistant. I can help you search for images, recommend similar ones, or filter by categories. What would you like to explore?",
      suggestedTags: ['nature', 'urban', 'people', 'abstract'].slice(0, 4)
    };
  }
  
  // Help request
  if (messageLower.includes('help') || messageLower.includes('what can you do')) {
    return {
      reply: "I can help you in several ways:\n\n• Search for images using natural language (e.g., 'show me sunset photos')\n• Filter images by categories\n• Recommend similar images\n• Explain what's in an image\n\nJust describe what you're looking for!",
      suggestedTags: getAllTags().slice(0, 6)
    };
  }
  
  // Search intent
  if (intent.type === 'search' || messageLower.includes('find') || messageLower.includes('search')) {
    const searchQuery = intent.keywords.filter(w => 
      !['find', 'search', 'show', 'me', 'get', 'a', 'an', 'the'].includes(w)
    ).join(' ');
    
    if (searchQuery.length === 0) {
      return {
        reply: "I'd be happy to search for images! Could you tell me what kind of images you're looking for? For example: 'nature photos' or 'urban architecture'.",
        suggestedTags: ['nature', 'urban', 'people', 'food']
      };
    }
    
    // Perform search via internal search endpoint
    try {
      const searchResponse = await axios.post('http://localhost:3001/api/search', {
        query: searchQuery,
        limit: 5
      });
      
      const results = searchResponse.data.results || [];
      
      if (results.length === 0) {
        return {
          reply: `I couldn't find any images matching "${searchQuery}". Try searching for: ${getAllTags().slice(0, 5).join(', ')}`,
          suggestedTags: getAllTags().slice(0, 6)
        };
      }
      
      return {
        reply: `I found ${results.length} images matching "${searchQuery}". Here are the top results:`,
        suggestedImages: results.map((r: any) => r.image).slice(0, 5),
        action: 'search',
        suggestedTags: [...new Set(results.flatMap((r: any) => r.image.tags))] as string[]
      };
    } catch (error) {
      console.error('Search error:', error);
      return {
        reply: `I can search for images with these categories: ${getAllTags().slice(0, 8).join(', ')}. What interests you?`,
        suggestedTags: getAllTags().slice(0, 6)
      };
    }
  }
  
  // Filter intent
  if (intent.type === 'filter' || messageLower.includes('only') || messageLower.includes('just')) {
    const matchedTags = intent.tags;
    
    if (matchedTags.length === 0) {
      return {
        reply: "I can filter images by category. Available categories include: " + 
               getAllTags().slice(0, 10).join(', ') + 
               ". Which would you like to see?",
        suggestedTags: getAllTags().slice(0, 8)
      };
    }
    
    return {
      reply: `Filtering gallery to show only images tagged with: ${matchedTags.join(', ')}`,
      action: 'filter',
      suggestedTags: matchedTags
    };
  }
  
  // Recommend intent
  if (intent.type === 'recommend' || messageLower.includes('suggest') || messageLower.includes('similar')) {
    return {
      reply: "I can recommend similar images! To get started, you can:\n\n• Search for images you like\n• Click on any image to find similar ones\n• Tell me your interests (e.g., 'I like nature photos')",
      suggestedTags: ['nature', 'urban', 'abstract', 'people']
    };
  }
  
  // Describe intent
  if (intent.type === 'describe') {
    return {
      reply: "I can describe images in the gallery. Each image has:\n\n• AI-generated tags\n• Natural language descriptions\n• Author information\n\nClick on any image to see its full details!",
      suggestedTags: getAllTags().slice(0, 6)
    };
  }
  
  // Tag-specific queries
  if (intent.tags.length > 0) {
    return {
      reply: `I found these relevant categories: ${intent.tags.join(', ')}. Would you like to see images from these categories?`,
      action: 'filter',
      suggestedTags: intent.tags
    };
  }
  
  // Default fallback
  return {
    reply: "I'm here to help you explore the image gallery! You can:\n\n• Search with natural language\n• Ask for recommendations\n• Filter by category\n\nWhat would you like to do?",
    suggestedTags: ['nature', 'urban', 'people', 'abstract', 'food', 'art']
  };
}

/**
 * GET /api/chat/suggestions
 * Get conversation starters and suggestions
 */
chatRoutes.get('/suggestions', (req, res) => {
  const suggestions = [
    "Show me nature photos",
    "Find images with people",
    "I want to see urban architecture",
    "Recommend abstract art",
    "Search for food photography",
    "Show me outdoor landscapes"
  ];
  
  res.json({ suggestions });
});

export default chatRoutes;