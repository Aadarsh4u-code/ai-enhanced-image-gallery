import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import SearchWidget from './component/SearchWidget';
import ImageGallery from './component/ImageGallery';
import ChatAssistant from './component/ChatAssistant';

function App() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showChat, setShowChat] = useState(false);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleTagFilter = (tags: string[]) => {
    setSelectedTags(tags);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-2 rounded-lg">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">
                  AI Gallery
                </h1>
                <p className="text-sm text-slate-600">
                  Powered by semantic search
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowChat(!showChat)}
              className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg"
            >
              <Sparkles className="w-4 h-4" />
              <span className="font-medium">AI Assistant</span>
            </button>
          </div>
        </div>
      </header>

      {/* Search Widget */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <SearchWidget 
          onSearch={handleSearch}
          onTagFilter={handleTagFilter}
        />
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <ImageGallery 
          searchQuery={searchQuery}
          selectedTags={selectedTags}
        />
      </main>

      {/* Chat Assistant */}
      {showChat && (
        <ChatAssistant 
          onClose={() => setShowChat(false)}
          onSearch={handleSearch}
          onTagFilter={handleTagFilter}
        />
      )}

      {/* Footer */}
      <footer className="bg-white/80 backdrop-blur-md border-t border-slate-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-slate-600 text-sm">
            <p>Built with React, TypeScript, and AI • Images from Picsum Photos</p>
            <p className="mt-1">Powered by CLIP semantic search</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;