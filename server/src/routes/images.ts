
import express from 'express';
import axios from 'axios';
import  { Image, PicsumImage, PaginatedResponse } from '../types';
import { generateImageTags, generateImageDescription, generateImageEmbedding, getAllTags } from '../services/aiService';

const imageRoutes = express.Router();

// In-memory cache for processed images
const imageCache = new Map<string, Image>();
const PICSUM_API = 'https://picsum.photos';

/**
 * Transform Picsum image to our Image format with AI enhancements
 */
async function transformImage(picsumImage: PicsumImage): Promise<Image> {
  const cacheKey = picsumImage.id;
  
  if (imageCache.has(cacheKey)) {
    return imageCache.get(cacheKey)!;
  }
  
  const tags = generateImageTags({ id: picsumImage.id });
  const description = generateImageDescription({ id: picsumImage.id, tags });
  
  // Generate embedding asynchronously (non-blocking)
  const embeddingPromise = generateImageEmbedding(picsumImage.download_url);
  
  const image: Image = {
    id: picsumImage.id,
    url: `${PICSUM_API}/id/${picsumImage.id}/800/600`,
    thumbnailUrl: `${PICSUM_API}/id/${picsumImage.id}/400/300`,
    author: picsumImage.author,
    tags,
    description,
    width: picsumImage.width,
    height: picsumImage.height,
    downloadUrl: picsumImage.download_url,
    embedding: await embeddingPromise
  };
  
  imageCache.set(cacheKey, image);
  return image;
}

/**
 * GET /api/images
 * Fetch paginated images with optional tag filtering
 */
imageRoutes.get('/', async (req, res, next) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const tag = req.query.tag as string | undefined;
    
    // Fetch from Picsum API
    // Picsum has ~1000 images, we'll fetch a reasonable subset
    const picsumPage = Math.ceil(page * limit / 30); // Picsum returns 30 per page
    const response = await axios.get<PicsumImage[]>(
      `${PICSUM_API}/v2/list?page=${picsumPage}&limit=30`
    );
    
    // Transform and enhance with AI
    const transformedImages = await Promise.all(
      response.data.map(img => transformImage(img))
    );
    
    // Filter by tag if provided
    let filteredImages = transformedImages;
    if (tag) {
      filteredImages = transformedImages.filter(img => 
        img.tags.some(t => t.toLowerCase().includes(tag.toLowerCase()))
      );
    }
    
    // Paginate results
    const startIdx = ((page - 1) * limit) % filteredImages.length;
    const endIdx = startIdx + limit;
    const paginatedImages = filteredImages.slice(startIdx, endIdx);
    
    const response_data: PaginatedResponse<Image> = {
      data: paginatedImages,
      pagination: {
        page,
        limit,
        total: tag ? filteredImages.length : 1000, // Approximate total
        hasMore: endIdx < filteredImages.length || picsumPage < 10
      }
    };
    
    res.json(response_data);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/images/:id
 * Fetch a single image by ID
 */
imageRoutes.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Check cache first
    if (imageCache.has(id)) {
      return res.json(imageCache.get(id));
    }
    
    // Fetch from Picsum
    const response = await axios.get<PicsumImage>(
      `${PICSUM_API}/id/${id}/info`
    );
    
    const image = await transformImage(response.data);
    res.json(image);
  } catch (error: any) {
    if (error.response?.status === 404) {
      return res.status(404).json({ error: 'Image not found' });
    }
    next(error);
  }
});

/**
 * GET /api/tags
 * Get all available tags
 */
imageRoutes.get('/tags/all', (req, res) => {
  const allTags = getAllTags();
  const uniqueTags = [...new Set(allTags)].sort();
  
  res.json({ tags: uniqueTags });
});


// // Example route: Get all images (replace with your logic)
// imageRoutes.get('/', (req: Request, res: Response) => {
//   // TODO: Implement image retrieval logic
//   res.json({ message: 'Images endpoint' });
// });

// // Example route: Upload an image (replace with your logic)
// imageRoutes.post('/upload', (req: Request, res: Response) => {
//   // TODO: Implement image upload logic
//   res.json({ message: 'Image uploaded' });
// });


export default imageRoutes;