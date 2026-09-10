import React, { useState, useEffect } from 'react';
import { 
  Library, 
  Search, 
  BookOpen, 
  ExternalLink, 
  Download, 
  Filter, 
  Sparkles, 
  School, 
  Globe, 
  Book, 
  Lock,
  ArrowRight
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import apiFetch from '../../services/api';
import { alertDialog } from '../../services/dialogService';
import { useAuth } from '../../hooks/useAuth';

export default function DigitalLibraryPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all'); // 'all', 'school', 'open_library', 'google_books'
  const [results, setResults] = useState({
    school_library: [],
    open_library: [],
    google_books: [],
    total: 0,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    handleSearch();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCategory]);

  const handleSearch = async (e) => {
    e?.preventDefault();
    setLoading(true);
    try {
      const res = await apiFetch(`/library/search?q=${encodeURIComponent(query)}&category=${activeCategory}`);
      setResults(res || { school_library: [], open_library: [], google_books: [], total: 0 });
    } catch (err) {
      console.error('Library search error', err);
    } finally {
      setLoading(false);
    }
  };

  const allItems = [
    ...(results.school_library || []),
    ...(results.open_library || []),
    ...(results.google_books || []),
  ];

  return (
    <div className="min-h-screen bg-slate-50">

        {/* ── Hero Banner ── */}
        <section className="bg-gradient-to-br from-[#0B1528] via-blue-950 to-indigo-950 text-white pt-36 pb-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-500/10 via-transparent to-transparent pointer-events-none" />
          
          <div className="max-w-5xl mx-auto text-center space-y-4 relative z-10">
            <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-blue-500/10 border border-blue-400/20 text-blue-300 text-xs font-bold uppercase tracking-widest">
              <Sparkles className="w-3.5 h-3.5" />
              <span>GHRA Unified Digital Library</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black tracking-tight font-heading uppercase">
              Shaping Young Minds
            </h1>
            <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
              Explore thousands of curriculum textbooks, open-access scholarly publications, research papers, and digitized GHRA course materials.
            </p>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="max-w-2xl mx-auto flex gap-2 pt-4">
              <div className="relative flex-1">
                <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by title, subject, author (e.g. Chemistry, Mathematics, Physics)..."
                  className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white/20 transition"
                />
              </div>
              <button
                type="submit"
                className="px-6 py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-xs font-black uppercase tracking-wider shadow-lg shadow-blue-600/30 transition cursor-pointer"
              >
                Search
              </button>
            </form>
          </div>
        </section>

        {/* ── Main Library Catalog ── */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
          
          {/* Category Tabs */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
            <div className="flex items-center gap-2 overflow-x-auto">
              {[
                { key: 'all', label: 'All Repositories', icon: Library },
                { key: 'school', label: 'GHRA School Library', icon: School },
                { key: 'open_library', label: 'Open Library', icon: Globe },
                { key: 'google_books', label: 'Google Books', icon: Book },
              ].map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveCategory(tab.key)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                      activeCategory === tab.key
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            <span className="text-xs font-bold text-slate-400">
              {allItems.length} Books & Resources Found
            </span>
          </div>

          {/* Catalog Grid */}
          {loading ? (
            <div className="py-20 text-center text-slate-400">
              <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-xs font-bold">Querying digital library catalog...</p>
            </div>
          ) : allItems.length === 0 ? (
            <div className="py-20 text-center text-slate-400 space-y-3">
              <BookOpen className="w-12 h-12 mx-auto text-slate-300" />
              <p className="text-sm font-bold text-slate-600">No resources found matching your search.</p>
              <p className="text-xs text-slate-400">Try searching for subjects like "Biology", "English Literature", or "Physics".</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {allItems.map((item, idx) => (
                <div 
                  key={item.id || idx}
                  className="bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition duration-200 p-5 flex flex-col justify-between space-y-4 group"
                >
                  <div className="space-y-3">
                    {/* Cover Preview */}
                    <div className="h-44 w-full bg-slate-100 rounded-2xl overflow-hidden flex items-center justify-center relative border border-slate-200/60 shadow-inner">
                      {item.cover_image ? (
                        <img src={item.cover_image} alt={item.title} className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform" />
                      ) : (
                        <div className="text-center p-4 text-slate-400">
                          <BookOpen className="w-10 h-10 mx-auto text-blue-700/50 mb-1" />
                          <span className="text-[10px] font-bold uppercase tracking-wider block">{item.source}</span>
                        </div>
                      )}

                      <span className="absolute top-2 right-2 text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-slate-900/80 backdrop-blur text-white">
                        {item.source}
                      </span>
                    </div>

                    <div>
                      <h3 className="font-bold text-slate-900 text-sm line-clamp-2 leading-snug group-hover:text-blue-800 transition">
                        {item.title}
                      </h3>
                      <p className="text-xs text-slate-500 font-medium mt-1 truncate">
                        By {item.author || 'Author'}
                      </p>
                      {item.class_name && (
                        <span className="inline-block mt-2 text-[10px] bg-blue-50 text-blue-800 font-bold px-2 py-0.5 rounded-md border border-blue-200">
                          {item.class_name}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-3 border-t border-slate-100">
                    {item.url ? (
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition shadow-sm"
                      >
                        <span>Access Material</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    ) : (
                      <button
                        onClick={async () => {
                          if (!user) navigate('/login');
                          else await alertDialog({
                            title: 'Resource Link Notice',
                            message: 'Resource link is being updated by library administration.',
                            type: 'info',
                          });
                        }}
                        className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition"
                      >
                        <Lock className="w-3.5 h-3.5" />
                        <span>Sign In to Read</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
    </div>
  );
}
