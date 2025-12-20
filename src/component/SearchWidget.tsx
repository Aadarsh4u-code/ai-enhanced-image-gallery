import { useState, useEffect } from 'react';
import { Search, X, Tag as TagIcon, Sparkles } from 'lucide-react';
import { imageApi } from '../services/api';

interface SearchWidgetProps {
  onSearch: (query: string) => void;
  onTagFilter: (tags: string[]) => void;
}

export default function SearchWidget({ onSearch, onTagFilter }: SearchWidgetProps) {
  const [query, setQuery] = useState('');
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showTags, setShowTags] = useState(false);

  // Fetch available tags on mount
  useEffect(() => {
    imageApi.getTags()
      .then(tags => setAvailableTags(tags))
      .catch(err => console.error('Failed to fetch tags:', err));
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim());
      setSelectedTags([]); // Clear tag filters when searching
    }
  };

  const handleClear = () => {
    setQuery('');
    setSelectedTags([]);
    onSearch('');
    onTagFilter([]);
  };

  const handleTagToggle = (tag: string) => {
    const newTags = selectedTags.includes(tag)
      ? selectedTags.filter(t => t !== tag)
      : [...selectedTags, tag];
    
    setSelectedTags(newTags);
    onTagFilter(newTags);
    
    if (newTags.length > 0) {
      setQuery(''); // Clear search when filtering by tags
      onSearch('');
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-6 space-y-4">
      {/* Search bar */}
      <form onSubmit={handleSearch} className="relative">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="w-5 h-5 text-slate-400" />
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search images with natural language... (e.g., 'sunset over mountains')"
            className="w-full pl-12 pr-24 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
          {(query || selectedTags.length > 0) && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute inset-y-0 right-12 px-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
          <button
            type="submit"
            disabled={!query.trim()}
            className="absolute inset-y-0 right-0 px-6 flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-r-lg hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <Sparkles className="w-4 h-4" />
            <span className="font-medium">Search</span>
          </button>
        </div>
      </form>

      {/* Tag filters */}
      <div className="space-y-3">
        <button
          onClick={() => setShowTags(!showTags)}
          className="flex items-center space-x-2 text-sm font-medium text-slate-700 hover:text-blue-600 transition-colors"
        >
          <TagIcon className="w-4 h-4" />
          <span>Filter by category</span>
          <span className="text-slate-500">
            ({selectedTags.length} selected)
          </span>
        </button>

        {showTags && (
          <div className="flex flex-wrap gap-2 pt-2">
            {availableTags.map((tag) => {
              const isSelected = selectedTags.includes(tag);
              return (
                <button
                  key={tag}
                  onClick={() => handleTagToggle(tag)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        )}

        {/* Selected tags display */}
        {selectedTags.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-200">
            <span className="text-sm text-slate-600 py-1">Active filters:</span>
            {selectedTags.map((tag) => (
              <span
                key={tag}
                className="flex items-center space-x-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium"
              >
                <span>{tag}</span>
                <button
                  onClick={() => handleTagToggle(tag)}
                  className="hover:bg-blue-200 rounded-full p-0.5 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Search tips */}
      <div className="pt-3 border-t border-slate-200">
        <p className="text-xs text-slate-500">
          💡 <span className="font-medium">Tip:</span> Try searching with natural descriptions like "people enjoying outdoor activities" or "modern architecture in cities"
        </p>
      </div>
    </div>
  );
}