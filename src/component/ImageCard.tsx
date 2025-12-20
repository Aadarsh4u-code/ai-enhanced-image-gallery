import { useState } from 'react';
import type { Image } from '../types';
import { User, Tag, X, ExternalLink } from 'lucide-react';

interface ImageCardProps {
  image: Image;
}

export default function ImageCard({ image }: ImageCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <>
      {/* Card */}
      <div 
        onClick={() => setIsModalOpen(true)}
        className="group relative bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer border border-slate-200 hover:border-blue-300"
      >
        {/* Image container */}
        <div className="relative aspect-[4/3] bg-slate-100 overflow-hidden">
          {!imageLoaded && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          <img
            src={image.thumbnailUrl}
            alt={image.description}
            loading="lazy"
            onLoad={() => setImageLoaded(true)}
            className={`w-full h-full object-cover transition-all duration-300 ${
              imageLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
            } group-hover:scale-105`}
          />
          
          {/* Overlay on hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          {/* Tags overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
            <div className="flex flex-wrap gap-1">
              {image.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-1 bg-white/90 backdrop-blur-sm text-xs font-medium text-slate-700 rounded-full"
                >
                  {tag}
                </span>
              ))}
              {image.tags.length > 3 && (
                <span className="px-2 py-1 bg-white/90 backdrop-blur-sm text-xs font-medium text-slate-700 rounded-full">
                  +{image.tags.length - 3}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Author info */}
        <div className="p-4">
          <div className="flex items-center space-x-2 text-sm text-slate-600">
            <User className="w-4 h-4" />
            <span className="font-medium truncate">{image.author}</span>
          </div>
          <p className="mt-2 text-sm text-slate-500 line-clamp-2">
            {image.description}
          </p>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 z-10 p-2 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-colors shadow-lg"
            >
              <X className="w-5 h-5 text-slate-700" />
            </button>

            {/* Image */}
            <div className="relative aspect-video bg-slate-100">
              <img
                src={image.url}
                alt={image.description}
                className="w-full h-full object-contain"
              />
            </div>

            {/* Details */}
            <div className="p-6 space-y-4">
              {/* Author */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <User className="w-5 h-5 text-slate-600" />
                  <span className="font-semibold text-slate-900">{image.author}</span>
                </div>
                <a
                  href={image.downloadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>View Original</span>
                </a>
              </div>

              {/* Description */}
              <div>
                <p className="text-slate-700 leading-relaxed">{image.description}</p>
              </div>

              {/* Tags */}
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <Tag className="w-4 h-4 text-slate-600" />
                  <span className="text-sm font-semibold text-slate-700">Tags</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {image.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Dimensions */}
              <div className="pt-4 border-t border-slate-200">
                <p className="text-sm text-slate-500">
                  Dimensions: {image.width} × {image.height}px
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}