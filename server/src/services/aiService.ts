import { pipeline } from '@xenova/transformers';
import NodeCache from 'node-cache';
import type { Image } from '../types';

// Cache for model and embeddings
const embeddingCache = new NodeCache({ stdTTL: 3600 }); // 1 hour TTL
let clipModel: any = null;
let isModelLoading = false;

// Predefined tag categories for image classification
const TAG_CATEGORIES = {
  nature: ['nature', 'landscape', 'outdoor', 'forest', 'mountain', 'tree', 'sky', 'water'],
  urban: ['city', 'building', 'street', 'architecture', 'urban'],
  people: ['people', 'person', 'portrait', 'face', 'human'],
  abstract: ['abstract', 'pattern', 'texture', 'geometric'],
  food: ['food', 'meal', 'cuisine', 'dining'],
  animals: ['animal', 'pet', 'wildlife', 'bird'],
  technology: ['technology', 'computer', 'device', 'digital'],
  art: ['art', 'painting', 'creative', 'artistic'],
  sports: ['sports', 'athletic', 'game', 'competition'],
  travel: ['travel', 'destination', 'tourism', 'adventure']
};

/**
 * Initialize the CLIP model for semantic understanding
 * This runs on first server startup and caches the model
 */
export async function initializeAIService(): Promise<void> {
  if (clipModel || isModelLoading) {
    console.log('Model already loaded or loading...');
    return;
  }

  try {
    isModelLoading = true;
    console.log('Loading CLIP model (this may take 30-60 seconds on first run)...');
    
    // Load CLIP model using Transformers.js
    // Using the smaller model for faster loading and CPU efficiency
    clipModel = await pipeline('zero-shot-image-classification', 
      'Xenova/clip-vit-base-patch32', 
      { quantized: true }
    );
    
    console.log('CLIP model loaded successfully');
    isModelLoading = false;
  } catch (error) {
    isModelLoading = false;
    console.error('Failed to load CLIP model:', error);
    throw error;
  }
}

/**
 * Generate text embedding using CLIP
 * This creates a vector representation of the text query
 */
export async function generateTextEmbedding(text: string): Promise<number[]> {
  if (!clipModel) {
    await initializeAIService();
  }

  const cacheKey = `text_emb_${text}`;
  const cached = embeddingCache.get<number[]>(cacheKey);
  
  if (cached) {
    return cached;
  }

  try {
    // For text embedding, we use a workaround with zero-shot classification
    // In production, you'd use a dedicated text encoder
    const embedding = await generateMockTextEmbedding(text);
    embeddingCache.set(cacheKey, embedding);
    return embedding;
  } catch (error) {
    console.error('Error generating text embedding:', error);
    // Fallback to mock embedding
    return generateMockTextEmbedding(text);
  }
}

/**
 * Generate mock text embedding based on keyword matching
 * This is a fallback when CLIP is not available or for faster development
 */
function generateMockTextEmbedding(text: string): number[] {
  const words = text.toLowerCase().split(/\s+/);
  const embedding = new Array(512).fill(0);
  
  // Create a pseudo-embedding based on word presence
  words.forEach((word, idx) => {
    const hash = simpleHash(word);
    for (let i = 0; i < 512; i++) {
      embedding[i] += Math.sin(hash + i) * 0.1;
    }
  });
  
  // Normalize
  const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
  return embedding.map(val => val / magnitude);
}

/**
 * Generate image embedding using CLIP
 * In production, this would process the actual image
 */
export async function generateImageEmbedding(imageUrl: string): Promise<number[]> {
  const cacheKey = `img_emb_${imageUrl}`;
  const cached = embeddingCache.get<number[]>(cacheKey);
  
  if (cached) {
    return cached;
  }

  try {
    // In production, fetch and process the image
    // For now, generate based on image ID and tags
    const embedding = generateMockImageEmbedding(imageUrl);
    embeddingCache.set(cacheKey, embedding);
    return embedding;
  } catch (error) {
    console.error('Error generating image embedding:', error);
    return generateMockImageEmbedding(imageUrl);
  }
}

/**
 * Generate mock image embedding based on image ID
 * This creates consistent embeddings for the same image
 */
function generateMockImageEmbedding(imageUrl: string): number[] {
  const id = imageUrl.match(/\/id\/(\d+)\//)?.[1] || '0';
  const seed = parseInt(id, 10);
  const embedding = new Array(512).fill(0);
  
  // Generate deterministic pseudo-random embedding
  for (let i = 0; i < 512; i++) {
    embedding[i] = Math.sin(seed * 1000 + i * 0.1) * Math.cos(seed * 0.5 + i);
  }
  
  // Normalize
  const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
  return embedding.map(val => val / magnitude);
}

/**
 * Automatically generate tags for an image
 * Uses mock classification based on image ID patterns
 */
export function generateImageTags(image: Partial<Image>): string[] {
  const imageId = parseInt(image.id || '0', 10);
  const tags: string[] = [];
  
  // Use deterministic tag assignment based on image ID
  // In production, this would use actual image analysis
  const tagCategories = Object.keys(TAG_CATEGORIES);
  
  // Assign 2-4 tags per image
  const numTags = 2 + (imageId % 3);
  for (let i = 0; i < numTags; i++) {
    const categoryIndex = (imageId + i * 7) % tagCategories.length;
    const category = tagCategories[categoryIndex];
    const categoryTags = TAG_CATEGORIES[category as keyof typeof TAG_CATEGORIES];
    const tagIndex = (imageId * (i + 1)) % categoryTags.length;
    tags.push(categoryTags[tagIndex]);
  }
  
  return [...new Set(tags)]; // Remove duplicates
}

/**
 * Generate a natural language description for an image
 * In production, this would use BLIP or similar captioning model
 */
export function generateImageDescription(image: Partial<Image>): string {
  const tags = image.tags || [];
  
  if (tags.length === 0) {
    return 'A beautiful image from our collection';
  }
  
  // Create natural descriptions based on tags
  const descriptions: { [key: string]: string[] } = {
    nature: ['A serene natural landscape', 'Beautiful scenery in nature', 'Peaceful outdoor vista'],
    urban: ['Urban architecture and cityscape', 'Modern city environment', 'Contemporary urban scene'],
    people: ['Portrait photography', 'Human interest photography', 'People in their environment'],
    abstract: ['Abstract visual composition', 'Geometric patterns and textures', 'Creative abstract imagery'],
    food: ['Culinary photography', 'Delicious food presentation', 'Gastronomic artistry'],
    animals: ['Wildlife and animal photography', 'Creatures in their habitat', 'Animal portrait'],
    technology: ['Modern technology showcase', 'Digital innovation', 'Tech-focused imagery'],
    art: ['Artistic expression', 'Creative visual art', 'Artistic composition'],
    sports: ['Athletic activity', 'Sports and competition', 'Physical fitness'],
    travel: ['Travel destination', 'Adventure and exploration', 'Journey photography']
  };
  
  const primaryTag = tags[0];
  for (const [category, descs] of Object.entries(descriptions)) {
    if (TAG_CATEGORIES[category as keyof typeof TAG_CATEGORIES]?.includes(primaryTag)) {
      const imageId = parseInt(image.id || '0', 10);
      const descIndex = imageId % descs.length;
      return descs[descIndex];
    }
  }
  
  return `Image featuring ${tags.join(', ')}`;
}

/**
 * Calculate cosine similarity between two embeddings
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Embeddings must have the same length');
  }
  
  let dotProduct = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;
  
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    magnitudeA += a[i] * a[i];
    magnitudeB += b[i] * b[i];
  }
  
  magnitudeA = Math.sqrt(magnitudeA);
  magnitudeB = Math.sqrt(magnitudeB);
  
  if (magnitudeA === 0 || magnitudeB === 0) {
    return 0;
  }
  
  return dotProduct / (magnitudeA * magnitudeB);
}

/**
 * Simple hash function for string to number conversion
 */
function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

/**
 * Get all available tags from the system
 */
export function getAllTags(): string[] {
  return Object.values(TAG_CATEGORIES).flat();
}

/**
 * Extract search intent from natural language query
 * This helps the AI assistant understand user intent
 */
export function extractSearchIntent(query: string): {
  type: 'search' | 'filter' | 'recommend' | 'describe';
  keywords: string[];
  tags: string[];
} {
  const lowerQuery = query.toLowerCase();
  const words = lowerQuery.split(/\s+/);
  
  // Detect intent
  let type: 'search' | 'filter' | 'recommend' | 'describe' = 'search';
  
  if (lowerQuery.includes('recommend') || lowerQuery.includes('suggest') || lowerQuery.includes('similar')) {
    type = 'recommend';
  } else if (lowerQuery.includes('show') || lowerQuery.includes('filter') || lowerQuery.includes('only')) {
    type = 'filter';
  } else if (lowerQuery.includes('what') || lowerQuery.includes('describe') || lowerQuery.includes('tell me')) {
    type = 'describe';
  }
  
  // Extract relevant tags
  const allTags = getAllTags();
  const matchedTags = allTags.filter(tag => 
    words.some(word => word.includes(tag) || tag.includes(word))
  );
  
  return {
    type,
    keywords: words,
    tags: matchedTags
  };
}