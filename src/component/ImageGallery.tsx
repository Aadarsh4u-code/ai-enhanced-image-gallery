import { useState, useEffect, useRef, useCallback } from 'react';
import type { Image } from '../types';
import { imageApi, searchApi } from '../services/api';
import ImageCard from './ImageCard';
import { Loader2, AlertCircle } from 'lucide-react';

interface ImageGalleryProps {
  searchQuery: string;
  selectedTags: string[];
}

export default function ImageGallery({ searchQuery, selectedTags }: ImageGalleryProps) {
  const [images, setImages] = useState<Image[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isSearchMode, setIsSearchMode] = useState(false);
  
  const observerRef = useRef<IntersectionObserver | null>(null);
  const lastImageRef = useRef<HTMLDivElement | null>(null);

  // Fetch images based on current state
  const fetchImages = useCallback(async (pageNum: number, reset: boolean = false) => {
    if (loading) return;
    
    try {
      setLoading(true);
      setError(null);

      let newImages: Image[] = [];

      // Search mode
      if (searchQuery) {
        const searchResponse = await searchApi.search(searchQuery, 20);
        newImages = searchResponse.results.map(r => r.image);
        setIsSearchMode(true);
        setHasMore(false); // Search results are finite
      }
      // Tag filter mode
      else if (selectedTags.length > 0) {
        const tag = selectedTags[0]; // Use first tag for simplicity
        const response = await imageApi.getImages(pageNum, 20, tag);
        newImages = response.data;
        setHasMore(response.pagination.hasMore);
        setIsSearchMode(false);
      }
      // Normal pagination mode
      else {
        const response = await imageApi.getImages(pageNum, 20);
        newImages = response.data;
        setHasMore(response.pagination.hasMore);
        setIsSearchMode(false);
      }

      if (reset) {
        setImages(newImages);
      } else {
        setImages(prev => [...prev, ...newImages]);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load images');
      console.error('Error fetching images:', err);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedTags, loading]);

  // Reset and fetch when search/filter changes
  useEffect(() => {
    setPage(1);
    setImages([]);
    fetchImages(1, true);
  }, [searchQuery, selectedTags]);

  // Infinite scroll logic
  useEffect(() => {
    if (isSearchMode || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loading && hasMore) {
          setPage(prev => {
            const nextPage = prev + 1;
            fetchImages(nextPage);
            return nextPage;
          });
        }
      },
      { threshold: 0.1 }
    );

    observerRef.current = observer;

    if (lastImageRef.current) {
      observer.observe(lastImageRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [hasMore, loading, isSearchMode, fetchImages]);

  if (error && images.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <h3 className="text-lg font-semibold text-slate-900 mb-2">
          Oops! Something went wrong
        </h3>
        <p className="text-slate-600 mb-4">{error}</p>
        <button
          onClick={() => fetchImages(1, true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Results header */}
      {searchQuery && (
        <div className="bg-white rounded-lg shadow-sm p-4 border border-slate-200">
          <p className="text-slate-700">
            Search results for: <span className="font-semibold">"{searchQuery}"</span>
            {images.length > 0 && (
              <span className="text-slate-500 ml-2">
                ({images.length} {images.length === 1 ? 'image' : 'images'} found)
              </span>
            )}
          </p>
        </div>
      )}

      {selectedTags.length > 0 && !searchQuery && (
        <div className="bg-white rounded-lg shadow-sm p-4 border border-slate-200">
          <p className="text-slate-700">
            Filtered by tags:{' '}
            {selectedTags.map((tag, index) => (
              <span key={tag}>
                <span className="font-semibold">{tag}</span>
                {index < selectedTags.length - 1 && ', '}
              </span>
            ))}
          </p>
        </div>
      )}

      {/* Image grid */}
      {images.length === 0 && !loading ? (
        <div className="text-center py-12">
          <p className="text-slate-600 text-lg">
            {searchQuery || selectedTags.length > 0
              ? 'No images found. Try a different search or filter.'
              : 'No images to display.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {images.map((image, index) => (
            <div
              key={`${image.id}-${index}`}
              ref={index === images.length - 1 ? lastImageRef : null}
            >
              <ImageCard image={image} />
            </div>
          ))}
        </div>
      )}

      {/* Loading indicator */}
      {loading && (
        <div className="flex justify-center py-8">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        </div>
      )}

      {/* End of results */}
      {!hasMore && images.length > 0 && !loading && (
        <div className="text-center py-8">
          <p className="text-slate-600">
            You've reached the end of the gallery
          </p>
        </div>
      )}
    </div>
  );
}