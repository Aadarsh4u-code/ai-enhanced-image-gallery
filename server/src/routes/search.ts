import { Router } from 'express';
import axios from 'axios';
import { SearchRequest, SearchResponse, SearchResult, PicsumImage, Image } from '../types';
import { 
  generateTextEmbedding, 
  cosineSimilarity, 
  generateImageTags, 
  generateImageDescription,
  generateImageEmbedding 
} from '../services/aiService';

const searchRoutes = Router();
const PICSUM_API = 'https://picsum.photos';

// Cache for search results
const searchCache = new Map<string, SearchResponse>();
const imageVectorStore = new Map<string, { image: Image; embedding: number[] }>();

/**
 * Initialize vector store with image embeddings
 */
async function initializeVectorStore() {
  if (imageVectorStore.size > 0) {
    return; // Already initialized
  }
  
  console.log('Initializing vector store...');
  
  try {
    // Fetch initial batch of images
    const response = await axios.get<PicsumImage[]>(
      `${PICSUM_API}/v2/list?page=1&limit=100`
    );
    
    // Process in parallel but limit concurrency
    const batchSize = 10;
    for (let i = 0; i < response.data.length; i += batchSize) {
      const batch = response.data.slice(i, i + batchSize);
      
      await Promise.all(batch.map(async (picsumImage) => {
        const tags = generateImageTags({ id: picsumImage.id });
        const description = generateImageDescription({ id: picsumImage.id, tags });
        const embedding = await generateImageEmbedding(picsumImage.download_url);
        
        const image: Image = {
          id: picsumImage.id,
          url: `${PICSUM_API}/id/${picsumImage.id}/800/600`,
          thumbnailUrl: `${PICSUM_API}/id/${picsumImage.id}/400/300`,
          author: picsumImage.author,
          tags,
          description,
          width: picsumImage.width,
          height: picsumImage.height,
          downloadUrl: picsumImage.download_url
        };
        
        imageVectorStore.set(picsumImage.id, { image, embedding });
      }));
    }
    
    console.log(`Vector store initialized with ${imageVectorStore.size} images`);
  } catch (error) {
    console.error('Error initializing vector store:', error);
  }
}

// Initialize on module load
initializeVectorStore();

/**
 * POST /api/search
 * Semantic search for images using natural language
 */
searchRoutes.post('/', async (req, res, next) => {
  try {
    const { query, limit = 10, threshold = 0.3 }: SearchRequest = req.body;
    
    if (!query || query.trim().length === 0) {
      return res.status(400).json({ error: 'Query is required' });
    }
    
    const startTime = Date.now();
    
    // Check cache
    const cacheKey = `${query}_${limit}_${threshold}`;
    if (searchCache.has(cacheKey)) {
      const cached = searchCache.get(cacheKey)!;
      return res.json({ ...cached, cached: true });
    }
    
    // Determine search strategy
    const isSimpleTagQuery = query.split(' ').length <= 2;
    let results: SearchResult[] = [];
    let queryType: 'tag' | 'semantic' = 'semantic';
    
    if (isSimpleTagQuery) {
      // Fast tag-based search
      results = tagBasedSearch(query, limit);
      queryType = 'tag';
    }
    
    // If tag search returns few results, fall back to semantic
    if (results.length < limit * 0.3) {
      const semanticResults = await semanticSearch(query, limit, threshold);
      results = [...results, ...semanticResults]
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
      queryType = 'semantic';
    }
    
    const processingTime = Date.now() - startTime;
    
    const response: SearchResponse = {
      results,
      queryType,
      processingTime
    };
    
    // Cache results
    searchCache.set(cacheKey, response);
    
    res.json(response);
  } catch (error) {
    next(error);
  }
});

/**
 * Fast tag-based search for simple queries
 */
function tagBasedSearch(query: string, limit: number): SearchResult[] {
  const queryLower = query.toLowerCase();
  const results: SearchResult[] = [];
  
  for (const [_, { image }] of imageVectorStore) {
    // Check if any tag matches the query
    const matchScore = image.tags.reduce((score, tag) => {
      if (tag.toLowerCase().includes(queryLower) || queryLower.includes(tag.toLowerCase())) {
        return score + 1;
      }
      return score;
    }, 0);
    
    // Also check description
    const descScore = image.description.toLowerCase().includes(queryLower) ? 0.5 : 0;
    
    const totalScore = (matchScore + descScore) / (image.tags.length + 1);
    
    if (totalScore > 0) {
      results.push({ image, score: totalScore });
    }
  }
  
  return results
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

/**
 * Semantic search using embeddings
 */
async function semanticSearch(
  query: string, 
  limit: number, 
  threshold: number
): Promise<SearchResult[]> {
  // Generate query embedding
  const queryEmbedding = await generateTextEmbedding(query);
  
  const results: SearchResult[] = [];
  
  // Calculate similarity with all images
  for (const [_, { image, embedding }] of imageVectorStore) {
    const similarity = cosineSimilarity(queryEmbedding, embedding);
    
    if (similarity >= threshold) {
      results.push({ image, score: similarity });
    }
  }
  
  return results
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

/**
 * GET /api/search/similar/:id
 * Find similar images to a given image
 */
searchRoutes.get('/similar/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const limit = parseInt(req.query.limit as string) || 10;
    
    const source = imageVectorStore.get(id);
    if (!source) {
      return res.status(404).json({ error: 'Image not found' });
    }
    
    const results: SearchResult[] = [];
    
    // Find similar images by comparing embeddings
    for (const [imageId, { image, embedding }] of imageVectorStore) {
      if (imageId === id) continue; // Skip the source image
      
      const similarity = cosineSimilarity(source.embedding, embedding);
      results.push({ image, score: similarity });
    }
    
    // Sort and limit
    const topResults = results
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
    
    res.json({
      sourceImage: source.image,
      results: topResults
    });
  } catch (error) {
    next(error);
  }
});

export default searchRoutes;