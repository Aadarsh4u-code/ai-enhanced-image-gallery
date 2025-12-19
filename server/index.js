import express from 'express';
import cors from 'cors';
import axios from 'axios';
import { pipeline } from '@xenova/transformers';

const app = express();
// 1. Precise CORS Configuration
app.use(cors({
  origin: 'http://localhost:5173', // Your Vite dev server URL
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
app.use(express.json());

const PORT = 5001;
let extractor = null;
let imageDatabase = []; // In-memory cache for semantic search demo

// Initialize AI Model
async function initAI() {
    console.log("📥 Loading AI Model (all-MiniLM-L6-v2)...");
    extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
    console.log("✅ AI Model Loaded");
}

// Helper: Cosine Similarity for Semantic Search
function cosineSimilarity(vecA, vecB) {
    let dotProduct = 0, normA = 0, normB = 0;
    for (let i = 0; i < vecA.length; i++) {
        dotProduct += vecA[i] * vecB[i];
        normA += vecA[i] * vecA[i];
        normB += vecB[i] * vecB[i];
    }
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// API: Source of Truth for Images
app.get('/api/images', async (req, res) => {
    const { page = 1, limit = 12 } = req.query;
    try {
        const response = await axios.get(`https://picsum.photos/v2/list?page=${page}&limit=${limit}`);
        // Cache images for search demonstration
        imageDatabase = [...new Set([...imageDatabase, ...response.data])];
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch images" });
    }
});

// API: AI Semantic Search
app.post('/api/search', async (req, res) => {
    const { query } = req.body;
    if (!extractor || !query) return res.status(400).json({ error: "AI not ready" });

    // Generate embedding for query
    const output = await extractor(query, { pooling: 'mean', normalize: true });
    const queryVector = Array.from(output.data);

    // Mock Semantic Search: Compare query vector against author names
    // In production, you'd compare against image captions/tags
    const scoredResults = await Promise.all(imageDatabase.map(async (img) => {
        const textToMatch = `Photo by ${img.author}`;
        const imgOutput = await extractor(textToMatch, { pooling: 'mean', normalize: true });
        const imgVector = Array.from(imgOutput.data);
        return { ...img, score: cosineSimilarity(queryVector, imgVector) };
    }));

    const results = scoredResults
        .sort((a, b) => b.score - a.score)
        .slice(0, 10);

    res.json(results);
});

app.listen(PORT, () => {
    console.log(`🚀 Server: http://localhost:${PORT}`);
    initAI();
});


































// import express from 'express';
// import cors from 'cors';
// import axios from 'axios';
// import { pipeline } from '@xenova/transformers';

// const app = express();
// app.use(cors());
// app.use(express.json());

// const PORT = 5000;
// let extractor = null;

// // AI Initialization
// async function initAI() {
//     try {
//         console.log("Loading AI Embedding Model...");
//         // Using a tiny but powerful model for local inference
//         extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
//         console.log("AI Model Ready");
//     } catch (err) {
//         console.error("AI Init Error:", err);
//     }
// }

// // Image Gallery API (Source of Truth)
// app.get('/api/images', async (req, res) => {
//     const { page = 1, limit = 12 } = req.query;
//     try {
//         const response = await axios.get(`https://picsum.photos/v2/list?page=${page}&limit=${limit}`);
//         res.json(response.data);
//     } catch (error) {
//         res.status(500).json({ error: "Failed to fetch images" });
//     }
// });

// // AI Search Placeholder
// app.post('/api/search', (req, res) => {
//     const { query } = req.body;
//     console.log(`AI Search requested for: ${query}`);
//     // We will expand this logic once the UI is connected
//     res.json({ message: "Search received", results: [] });
// });

// app.listen(PORT, () => {
//     console.log(`Backend listening at http://localhost:${PORT}`);
//     initAI();
// });