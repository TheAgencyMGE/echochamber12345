import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  BookOpen, 
  Sparkles, 
  Users, 
  Clock, 
  PlayCircle, 
  Library,
  Zap
} from 'lucide-react';
import { ActiveStoryView } from './story/ActiveStoryView';
import { StoryViewer } from './story/StoryViewer';
import { ActiveStory, GetStoryResponse } from '../../shared/types/story';

type GamePhase = 'menu' | 'active-story' | 'story-viewer';

export const Storycollab: React.FC = () => {
  const [gamePhase, setGamePhase] = useState<GamePhase>('menu');
  const [activeStory, setActiveStory] = useState<ActiveStory | null>(null);

  // Save story to localStorage whenever it changes
  useEffect(() => {
    if (activeStory) {
      localStorage.setItem('storycollab-current-story', JSON.stringify(activeStory));
    }
  }, [activeStory]);

  // Load story from localStorage on mount
  useEffect(() => {
    const savedStory = localStorage.getItem('storycollab-current-story');
    if (savedStory) {
      try {
        const parsedStory = JSON.parse(savedStory);
        // Only use saved story if it's still the same day
        const now = Date.now();
        if (parsedStory.endTime > now) {
          setActiveStory(parsedStory);
        }
      } catch (error) {
        console.error('Failed to parse saved story:', error);
      }
    }
  }, []);
  const [canVote, setCanVote] = useState(true);

  // Check if current user has voted
  const userHasVoted = activeStory?.currentVote?.options.some(option =>
    option.voters.includes('demo-user')
  ) || false;
  const [timeToNextHour, setTimeToNextHour] = useState(0);

  // Save timer to localStorage whenever it changes
  useEffect(() => {
    if (timeToNextHour > 0) {
      localStorage.setItem('storycollab-timer', JSON.stringify({
        time: timeToNextHour,
        timestamp: Date.now()
      }));
    }
  }, [timeToNextHour]);

  // Load timer from localStorage on mount
  useEffect(() => {
    const savedTimer = localStorage.getItem('storycollab-timer');
    if (savedTimer) {
      try {
        const { time, timestamp } = JSON.parse(savedTimer);
        const elapsed = Date.now() - timestamp;
        const remaining = Math.max(0, time - elapsed);
        if (remaining > 0) {
          setTimeToNextHour(remaining);
        }
      } catch (error) {
        console.error('Failed to parse saved timer:', error);
      }
    }
  }, []);

  useEffect(() => {
    loadCurrentStory();

    // Refresh story data every minute
    const interval = setInterval(loadCurrentStory, 60000);
    return () => clearInterval(interval);
  }, []);

  // Update countdown timer every second
  useEffect(() => {
    if (timeToNextHour <= 0) return;

    const interval = setInterval(() => {
      setTimeToNextHour(prev => Math.max(0, prev - 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [timeToNextHour]);

  const generateNewStory = async (): Promise<ActiveStory> => {
    // Generate a new story with AI-created first segment
    const storyId = 'story-' + Date.now();
    const startTime = Date.now();

    const newStory: ActiveStory = {
      id: storyId,
      title: 'The Mysterious Echo Chamber',
      startTime,
      endTime: startTime + (48 * 60 * 60 * 1000), // 48 hours
      currentHour: 0,
      status: 'active',
      participantCount: 1,
      aiPrompt: 'A mysterious echo chamber with strange powers',
      segments: [
        {
          id: 'seg-1',
          content: 'In a world where digital echoes hold mysterious powers, Dr. Sarah Chen discovers an abandoned research facility deep in the mountains. As she steps through the rusted doors, strange whispers seem to emanate from the walls themselves...',
          timestamp: startTime,
          hour: 0,
          addedBy: 'ai'
        }
      ],
      currentVote: {
        id: 'vote-' + Date.now(),
        storyId,
        hour: 0,
        prompt: 'Dr. Sarah Chen stands at the threshold of the mysterious facility. What should she do next?',
        options: [
          {
            id: 'opt-1',
            text: 'Sarah follows the whispers deeper into the facility, her flashlight cutting through the darkness.',
            votes: 0,
            voters: []
          },
          {
            id: 'opt-2',
            text: 'She decides to set up camp at the entrance and study the strange acoustic properties first.',
            votes: 0,
            voters: []
          },
          {
            id: 'opt-3',
            text: 'Sarah calls for backup on her radio, but only static and echoing voices respond.',
            votes: 0,
            voters: []
          }
        ],
        startTime,
        endTime: startTime + (60 * 60 * 1000), // 1 hour to vote
        status: 'active'
      }
    };

    // Try to save to API
    try {
      const response = await fetch('/api/story/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          genre: 'mystery',
          theme: 'sci-fi',
          tone: 'mysterious'
        })
      });

      if (response.ok) {
        const data = await response.json();
        return data.story;
      }
    } catch (error) {
      console.error('Failed to save new story to API:', error);
    }

    return newStory;
  };

  const loadCurrentStory = async () => {
    // If we already have a valid story from localStorage, don't overwrite it unless we get newer data
    const savedStory = localStorage.getItem('storycollab-current-story');
    const now = Date.now();

    if (savedStory && activeStory) {
      try {
        const parsedStory = JSON.parse(savedStory);
        if (parsedStory.endTime > now && parsedStory.id === activeStory.id) {
          // We have a valid saved story, only update from API if we get actual new data
          return;
        }
      } catch (error) {
        console.error('Failed to parse saved story:', error);
      }
    }

    try {
      const response = await fetch('/api/story/current');
      if (response.ok) {
        const data: GetStoryResponse = await response.json();

        if (data.story) {
          // Check if story is complete (48 hours passed)
          const now = Date.now();
          if (now >= data.story.endTime) {
            // Story is complete, generate new one
            const newStory = await generateNewStory();
            setActiveStory(newStory);
            setTimeToNextHour(3600000); // 1 hour
          } else {
            // Only update if we don't have this story or it's newer
            if (!activeStory || activeStory.id !== data.story.id) {
              setActiveStory(data.story);
              setTimeToNextHour(data.timeToNextHour);
            }
          }
        } else {
          // No current story, generate new one only if we don't have one
          if (!activeStory) {
            const newStory = await generateNewStory();
            setActiveStory(newStory);
            setTimeToNextHour(3600000); // 1 hour
          }
        }
      } else {
        // API not available, generate new story only if we don't have one
        if (!activeStory) {
          const newStory = await generateNewStory();
          setActiveStory(newStory);
          setTimeToNextHour(3600000); // 1 hour
        }
      }
    } catch (error) {
      console.error('Failed to load current story:', error);
      // Generate new story on error only if we don't have one
      if (!activeStory) {
        const newStory = await generateNewStory();
        setActiveStory(newStory);
        setTimeToNextHour(3600000); // 1 hour
      }
    }
  };


  const handleVote = async (voteId: string, optionId: string): Promise<boolean> => {
    // The canVote prop already handles this check, so don't double-check here

    try {
      const response = await fetch('/api/story/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ voteId, optionId })
      });

      if (response.ok) {
        const data = await response.json();

        // Update the story immediately with the vote
        if (activeStory && activeStory.currentVote) {
          const updatedStory = { ...activeStory };
          const option = updatedStory.currentVote.options.find(opt => opt.id === optionId);
          if (option) {
            option.votes += 1;
            option.voters.push('demo-user');
            updatedStory.participantCount = Math.max(updatedStory.participantCount, option.voters.length);
            setActiveStory(updatedStory);
          }
        }

        return data.success;
      } else {
        // API not available, simulate vote locally for demo
        if (activeStory && activeStory.currentVote) {
          const updatedStory = { ...activeStory };
          const option = updatedStory.currentVote.options.find(opt => opt.id === optionId);
          if (option) {
            option.votes += 1;
            option.voters.push('demo-user');
            // Update participant count
            const totalUniqueVoters = new Set(
              updatedStory.currentVote.options.flatMap(opt => opt.voters)
            ).size;
            updatedStory.participantCount = Math.max(updatedStory.participantCount, totalUniqueVoters);
            setActiveStory(updatedStory);
            return true;
          }
        }
        return false;
      }
    } catch (error) {
      console.error('Failed to submit vote:', error);
      // API not available, simulate vote locally for demo
      if (activeStory && activeStory.currentVote) {
        const updatedStory = { ...activeStory };
        const option = updatedStory.currentVote.options.find(opt => opt.id === optionId);
        if (option) {
          option.votes += 1;
          option.voters.push('demo-user');
          // Update participant count
          const totalUniqueVoters = new Set(
            updatedStory.currentVote.options.flatMap(opt => opt.voters)
          ).size;
          updatedStory.participantCount = Math.max(updatedStory.participantCount, totalUniqueVoters);
          setActiveStory(updatedStory);
          return true;
        }
      }
      return false;
    }
  };

  const handleBackToMenu = () => {
    setGamePhase('menu');
    loadCurrentStory(); // Refresh data when returning to menu
  };

  const formatTimeRemaining = (ms: number): string => {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  if (gamePhase === 'active-story' && activeStory) {
    return (
      <ActiveStoryView
        story={activeStory}
        onVote={handleVote}
        canVote={!userHasVoted}
        timeToNextHour={timeToNextHour}
      />
    );
  }

  if (gamePhase === 'story-viewer') {
    return <StoryViewer onBack={handleBackToMenu} />;
  }

  // Main menu
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-indigo-900 to-cyan-900 flex items-center justify-center">
      <div className="fixed inset-0 overflow-hidden">
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-transparent to-cyan-600/10"
          animate={{
            background: [
              'linear-gradient(to right, rgba(37, 99, 235, 0.1), transparent, rgba(8, 145, 178, 0.1))',
              'linear-gradient(to right, rgba(8, 145, 178, 0.1), transparent, rgba(37, 99, 235, 0.1))',
              'linear-gradient(to right, rgba(37, 99, 235, 0.1), transparent, rgba(8, 145, 178, 0.1))'
            ]
          }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>
      
      <div className="relative z-10 max-w-4xl w-full mx-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center mb-6">
            <motion.div
              className="w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <BookOpen className="w-10 h-10 text-white" />
            </motion.div>
          </div>
          
          <h1 className="text-6xl font-bold bg-gradient-to-r from-white via-blue-200 to-cyan-200 bg-clip-text text-transparent mb-4">
            Storycollab
          </h1>
          <p className="text-xl text-blue-300 mb-2">Collaborative AI Storytelling</p>
          <p className="text-lg text-blue-400 max-w-xl mx-auto mb-8">
            Join the community in creating amazing stories! Vote on story directions every hour for 48 hours.
          </p>
        </motion.div>
        
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Current Story Status */}
          <motion.div
            className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <Sparkles className="w-6 h-6 text-blue-400" />
                <h2 className="text-2xl font-bold text-white">Current Story</h2>
              </div>
              {activeStory && (
                <div className="text-right">
                  <p className="text-sm text-blue-400">Hour {activeStory.currentHour + 1} of 48</p>
                  <p className="text-xs text-blue-500">{formatTimeRemaining(timeToNextHour)} remaining</p>
                </div>
              )}
            </div>
            
            {activeStory && (
              <div>
                <h3 className="text-xl font-bold text-white mb-4">{activeStory.title}</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-white/5 rounded-xl p-4 text-center">
                    <Users className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                    <p className="text-sm text-blue-400 font-medium">Participants</p>
                    <p className="text-2xl font-bold text-white">{activeStory.participantCount}</p>
                  </div>
                  
                  <div className="bg-white/5 rounded-xl p-4 text-center">
                    <Clock className="w-8 h-8 text-green-400 mx-auto mb-2" />
                    <p className="text-sm text-green-400 font-medium">Progress</p>
                    <p className="text-2xl font-bold text-white">
                      {Math.round((activeStory.currentHour / 48) * 100)}%
                    </p>
                  </div>
                  
                  <div className="bg-white/5 rounded-xl p-4 text-center">
                    <BookOpen className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                    <p className="text-sm text-blue-400 font-medium">Segments</p>
                    <p className="text-2xl font-bold text-white">{activeStory.segments.length}</p>
                  </div>
                </div>

                <div className="text-center">
                  <button
                    onClick={() => setGamePhase('active-story')}
                    className="px-8 py-4 bg-gradient-to-r from-blue-500 via-blue-600 to-cyan-600 text-white font-bold text-xl rounded-2xl shadow-lg shadow-blue-500/25 hover:from-blue-600 hover:via-blue-700 hover:to-cyan-700 transform hover:scale-105 transition-all duration-200"
                  >
                    <div className="flex items-center space-x-2">
                      <PlayCircle className="w-6 h-6" />
                      <span>Join Current Story</span>
                    </div>
                  </button>

                  {!userHasVoted ? (
                    <div className="mt-3 flex items-center justify-center space-x-2 text-green-400">
                      <Zap className="w-4 h-4" />
                      <span className="text-sm font-medium">You can vote!</span>
                    </div>
                  ) : (
                    <div className="mt-3 flex items-center justify-center space-x-2 text-blue-400">
                      <Zap className="w-4 h-4" />
                      <span className="text-sm font-medium">Vote cast! Waiting for hour to end...</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {!activeStory && (
              <div className="text-center py-8">
                <div className="animate-spin w-12 h-12 border-4 border-blue-400 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-white/60">Loading current story...</p>
              </div>
            )}
          </motion.div>

          {/* Story Library */}
          <motion.div
            className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center space-x-3 mb-6">
              <Library className="w-6 h-6 text-pink-400" />
              <h2 className="text-2xl font-bold text-white">Story Library</h2>
            </div>
            
            <p className="text-white/70 mb-6">
              Explore completed stories created by our community. Each story is a unique collaborative masterpiece!
            </p>
            
            <div className="text-center">
              <button
                onClick={() => setGamePhase('story-viewer')}
                className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-medium rounded-xl border border-white/20 transition-all duration-200"
              >
                <div className="flex items-center space-x-2">
                  <Library className="w-5 h-5" />
                  <span>Browse Stories</span>
                </div>
              </button>
            </div>
          </motion.div>
        </div>

        <motion.div
          className="text-center mt-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <p className="text-blue-400 text-sm">
            📚 AI-powered collaborative storytelling • 🗳️ Vote every hour • 📖 Create amazing stories together!
          </p>
        </motion.div>
      </div>
    </div>
  );
};