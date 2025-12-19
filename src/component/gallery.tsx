import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Sparkles, Loader2 } from 'lucide-react';

interface Image {
  id: string;
  author: string;
  download_url: string;
}

export default function App() {
  const [images, setImages] = useState<Image[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  
  const observer = useRef<IntersectionObserver | null>(null);

  // Fetch Infinite Scroll Data
  const fetchImages = useCallback(async () => {
    if (isSearching) return;
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:5001/api/images?page=${page}&limit=12`);
      const data = await res.json();
      setImages(prev => [...prev, ...data]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, isSearching]);

  useEffect(() => { fetchImages(); }, [fetchImages]);

  // AI Search Handler
  const handleAISearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setIsSearching(false);
      setPage(1);
      setImages([]); // Reset and trigger re-fetch
      return;
    }

    setLoading(true);
    setIsSearching(true);
    try {
      const res = await fetch('http://localhost:5001/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery }),
      });
      const data = await res.json();
      setImages(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Intersection Observer for Infinite Scroll
  const lastImageRef = useCallback((node: HTMLDivElement) => {
    if (loading || isSearching) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) {
        setPage(prev => prev + 1);
      }
    });
    if (node) observer.current.observe(node);
  }, [loading, isSearching]);


  console.log(images);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <header className="max-w-6xl mx-auto mb-12 text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">AI Enhanced Gallery</h1>
        
        <form onSubmit={handleAISearch} className="relative max-w-xl mx-auto">
          <input
            type="text"
            className="w-full px-12 py-4 rounded-2xl border-none shadow-lg focus:ring-2 focus:ring-indigo-500 text-lg"
            placeholder="Search by author or mood (AI powered)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Sparkles className="absolute left-4 top-4 text-indigo-500" />
          <button type="submit" className="absolute right-3 top-2 bottom-2 px-4 bg-indigo-600 text-white rounded-xl">
            Search
          </button>
        </form>
      </header>

      <main className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {images.map((img, index) => (
          <div 
            key={`${img.id}-${index}`} 
            ref={index === images.length - 1 ? lastImageRef : null}
            className="group relative bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all"
          >
            <img src={img.download_url} alt={img.author} className="w-full h-64 object-cover" loading="lazy" />
            <div className="p-4 bg-white flex justify-between items-center">
              <span className="font-medium text-gray-700">{img.author}</span>
              <div className="w-2 h-2 rounded-full bg-green-400"></div>
            </div>
          </div>
        ))}
      </main>

      {loading && (
        <div className="flex justify-center mt-12">
          <Loader2 className="animate-spin text-indigo-600 w-10 h-10" />
        </div>
      )}
    </div>
  );
}