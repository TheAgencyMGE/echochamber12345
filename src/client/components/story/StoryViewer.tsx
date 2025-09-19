import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, 
  Clock, 
  Users, 
  ArrowLeft, 
  Search, 
  Filter,
  Calendar,
  Star,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { CompletedStory } from '../../../shared/types/story';

interface StoryViewerProps {
  onBack: () => void;
}

export const StoryViewer: React.FC<StoryViewerProps> = ({ onBack }) => {
  const [stories, setStories] = useState<CompletedStory[]>([]);
  const [selectedStory, setSelectedStory] = useState<CompletedStory | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'recent' | 'popular' | 'title'>('recent');

  useEffect(() => {
    loadStories();
  }, [currentPage, sortBy]);

  const loadStories = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/story/completed?page=${currentPage}&limit=6&sortBy=${sortBy}`);
      if (response.ok) {
        const data = await response.json();
        setStories(data.stories);
        setTotalPages(data.totalPages);
      }
    } catch (error) {
      console.error('Failed to load stories:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDuration = (ms: number): string => {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    return `${hours} hours`;
  };

  const formatDate = (timestamp: number): string => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (selectedStory) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="container mx-auto px-4 py-8">
          {/* Story Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <button
              onClick={() => setSelectedStory(null)}
              className="flex items-center space-x-2 text-purple-300 hover:text-white mb-6 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Stories</span>
            </button>

            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8">
              <h1 className="text-4xl font-bold text-white mb-4">{selectedStory.title}</h1>
              
              <div className="flex flex-wrap items-center gap-6 text-sm text-white/70 mb-6">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4" />
                  <span>Completed {formatDate(selectedStory.completedAt)}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4" />
                  <span>{formatDuration(selectedStory.duration)}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4" />
                  <span>{selectedStory.totalParticipants} participants</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Star className="w-4 h-4" />
                  <span>{selectedStory.totalVotes} total votes</span>
                </div>
              </div>

              {selectedStory.summary && (
                <p className="text-lg text-purple-200 italic border-l-4 border-purple-400 pl-4">
                  {selectedStory.summary}
                </p>
              )}
            </div>
          </motion.div>

          {/* Story Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8"
          >
            <div className="flex items-center space-x-3 mb-8">
              <BookOpen className="w-6 h-6 text-purple-400" />
              <h2 className="text-2xl font-bold text-white">The Complete Story</h2>
            </div>

            <div className="space-y-6">
              {selectedStory.segments.map((segment: any, index: number) => (
                <motion.div
                  key={segment.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`p-6 rounded-xl ${
                    segment.addedBy === 'ai' 
                      ? 'bg-purple-500/20 border-l-4 border-purple-400' 
                      : 'bg-blue-500/20 border-l-4 border-blue-400'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-sm font-medium ${
                      segment.addedBy === 'ai' ? 'text-purple-300' : 'text-blue-300'
                    }`}>
                      {segment.addedBy === 'ai' ? '🤖 AI Narrator' : `📊 Hour ${segment.hour + 1} - Community Choice`}
                    </span>
                    <span className="text-xs text-white/50">
                      {new Date(segment.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-white leading-relaxed text-lg">{segment.content}</p>
                </motion.div>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: selectedStory.segments.length * 0.1 + 0.5 }}
              className="mt-12 text-center p-8 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl border border-purple-400/30"
            >
              <h3 className="text-2xl font-bold text-white mb-2">The End</h3>
              <p className="text-purple-200">
                This collaborative story was created by the community over {formatDuration(selectedStory.duration)}, 
                with {selectedStory.totalParticipants} participants contributing {selectedStory.totalVotes} votes 
                to shape its direction.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <button
            onClick={onBack}
            className="flex items-center space-x-2 text-purple-300 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Storycollab</span>
          </button>

          <div className="text-center">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent mb-4">
              Story Library
            </h1>
            <p className="text-xl text-purple-300 mb-8">
              Discover amazing stories created by our community
            </p>
          </div>
        </motion.div>

        {/* Search and Filter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/50" />
                <input
                  type="text"
                  placeholder="Search stories..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-purple-400"
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Filter className="w-5 h-5 text-white/50" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'recent' | 'popular' | 'title')}
                  className="px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:border-purple-400"
                >
                  <option value="recent">Most Recent</option>
                  <option value="popular">Most Popular</option>
                  <option value="title">Title A-Z</option>
                </select>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stories Grid */}
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 animate-pulse">
                  <div className="h-6 bg-white/20 rounded mb-4"></div>
                  <div className="h-4 bg-white/10 rounded mb-2"></div>
                  <div className="h-4 bg-white/10 rounded mb-4"></div>
                  <div className="h-20 bg-white/5 rounded"></div>
                </div>
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="stories"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {stories.map((story, index) => (
                <motion.div
                  key={story.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => setSelectedStory(story)}
                  className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 cursor-pointer hover:bg-white/15 transition-all duration-200 group"
                >
                  <h3 className="text-xl font-bold text-white mb-3 group-hover:text-purple-300 transition-colors">
                    {story.title}
                  </h3>
                  
                  <div className="flex flex-wrap gap-3 text-xs text-white/60 mb-4">
                    <span className="flex items-center space-x-1">
                      <Calendar className="w-3 h-3" />
                      <span>{formatDate(story.completedAt)}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <Users className="w-3 h-3" />
                      <span>{story.totalParticipants}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <Star className="w-3 h-3" />
                      <span>{story.totalVotes}</span>
                    </span>
                  </div>

                  {story.summary && (
                    <p className="text-white/70 text-sm line-clamp-3 leading-relaxed">
                      {story.summary}
                    </p>
                  )}

                  <div className="mt-4 pt-4 border-t border-white/10">
                    <span className="text-purple-300 text-sm font-medium group-hover:text-purple-200 transition-colors">
                      Read Story →
                    </span>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pagination */}
        {totalPages > 1 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-12 flex justify-center items-center space-x-4"
          >
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="flex items-center space-x-2 px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/20 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>

            <div className="flex items-center space-x-2">
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`w-10 h-10 rounded-xl font-medium transition-colors ${
                    currentPage === i + 1
                      ? 'bg-purple-500 text-white'
                      : 'bg-white/10 text-white/70 hover:bg-white/20'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>

            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="flex items-center space-x-2 px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/20 transition-colors"
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </motion.div>
        )}

        {/* Empty State */}
        {!isLoading && stories.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <BookOpen className="w-16 h-16 text-white/30 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-white mb-2">No Stories Yet</h3>
            <p className="text-white/60">
              Be part of creating the first collaborative story in Storycollab!
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
};