import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, Users, Vote, BookOpen, Lightbulb, CheckCircle } from 'lucide-react';
import { ActiveStory } from '../../../shared/types/story';

interface ActiveStoryProps {
  story: ActiveStory;
  onVote: (voteId: string, optionId: string) => Promise<boolean>;
  canVote: boolean;
  timeToNextHour: number;
}

export const ActiveStoryView: React.FC<ActiveStoryProps> = ({
  story,
  onVote,
  canVote,
  timeToNextHour
}) => {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isVoting, setIsVoting] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);

  // Format time remaining
  const formatTime = (ms: number): string => {
    const minutes = Math.floor(ms / (1000 * 60));
    const seconds = Math.floor((ms % (1000 * 60)) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Calculate story progress
  const progressPercent = Math.round((story.currentHour / 48) * 100);
  const hoursRemaining = 48 - story.currentHour;

  const handleVote = async (optionId: string) => {
    if (!story.currentVote || !canVote || hasVoted) return;

    setIsVoting(true);
    try {
      const success = await onVote(story.currentVote.id, optionId);
      if (success) {
        setHasVoted(true);
        setSelectedOption(optionId);
      }
    } finally {
      setIsVoting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold text-white mb-2">{story.title}</h1>
          <div className="flex items-center justify-center space-x-6 text-lg">
            <div className="flex items-center space-x-2 text-blue-300">
              <Clock className="w-5 h-5" />
              <span>Hour {story.currentHour + 1} of 48</span>
            </div>
            <div className="flex items-center space-x-2 text-green-300">
              <Users className="w-5 h-5" />
              <span>{story.participantCount} participants</span>
            </div>
          </div>
        </motion.div>

        {/* Progress Bar */}
        <motion.div
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          className="mb-8"
        >
          <div className="bg-white/10 rounded-full h-3 overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
            />
          </div>
          <div className="flex justify-between text-sm text-white/70 mt-2">
            <span>Started {new Date(story.startTime).toLocaleDateString()}</span>
            <span>{progressPercent}% Complete</span>
            <span>{hoursRemaining} hours remaining</span>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Story Content */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-2 space-y-6"
          >
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8">
              <div className="flex items-center space-x-3 mb-6">
                <BookOpen className="w-6 h-6 text-purple-400" />
                <h2 className="text-2xl font-bold text-white">The Story So Far</h2>
              </div>

              <div className="space-y-4 max-h-96 overflow-y-auto">
                {story.segments.map((segment: any, index: number) => (
                  <motion.div
                    key={segment.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`p-4 rounded-xl ${
                      segment.addedBy === 'ai' 
                        ? 'bg-purple-500/20 border-l-4 border-purple-400' 
                        : 'bg-blue-500/20 border-l-4 border-blue-400'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-xs font-medium ${
                        segment.addedBy === 'ai' ? 'text-purple-300' : 'text-blue-300'
                      }`}>
                        {segment.addedBy === 'ai' ? 'AI Narrator' : `Hour ${segment.hour + 1} - Community Choice`}
                      </span>
                      <span className="text-xs text-white/50">
                        {new Date(segment.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-white leading-relaxed">{segment.content}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Voting Panel */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            {story.currentVote && (
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6">
                <div className="flex items-center space-x-3 mb-6">
                  <Vote className="w-6 h-6 text-yellow-400" />
                  <h3 className="text-xl font-bold text-white">What Happens Next?</h3>
                </div>

                {/* Voting Timer */}
                <div className="mb-6 p-4 bg-yellow-500/20 rounded-xl border border-yellow-400/30">
                  <div className="flex items-center justify-between">
                    <span className="text-yellow-300 font-medium">Time to Vote:</span>
                    <span className="text-yellow-100 font-bold text-lg">
                      {formatTime(timeToNextHour)}
                    </span>
                  </div>
                </div>

                <p className="text-white/80 mb-6">{story.currentVote.prompt}</p>

                <div className="space-y-3">
                  {story.currentVote.options.map((option: any, _index: number) => {
                    const isSelected = selectedOption === option.id;
                    const votePercent = story.currentVote!.options.reduce((total: number, opt: any) => total + opt.votes, 0) > 0
                      ? Math.round((option.votes / story.currentVote!.options.reduce((total: number, opt: any) => total + opt.votes, 0)) * 100)
                      : 0;

                    return (
                      <motion.button
                        key={option.id}
                        onClick={() => handleVote(option.id)}
                        disabled={!canVote || hasVoted || isVoting}
                        className={`w-full p-4 rounded-xl border-2 text-left transition-all duration-200 ${
                          isSelected
                            ? 'border-green-400 bg-green-500/20'
                            : hasVoted
                            ? 'border-white/20 bg-white/5 opacity-50'
                            : 'border-white/30 bg-white/10 hover:border-purple-400 hover:bg-purple-500/20'
                        } ${!canVote || hasVoted ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                        whileHover={canVote && !hasVoted ? { scale: 1.02 } : {}}
                        whileTap={canVote && !hasVoted ? { scale: 0.98 } : {}}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="text-white font-medium mb-2">{option.text}</p>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-white/60">{option.votes} votes</span>
                              {hasVoted && (
                                <span className="text-sm text-white/60">{votePercent}%</span>
                              )}
                            </div>
                          </div>
                          {isSelected && (
                            <CheckCircle className="w-5 h-5 text-green-400 ml-3 flex-shrink-0" />
                          )}
                        </div>

                        {/* Vote percentage bar */}
                        {hasVoted && (
                          <div className="mt-3 bg-white/10 rounded-full h-2 overflow-hidden">
                            <motion.div
                              className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                              initial={{ width: 0 }}
                              animate={{ width: `${votePercent}%` }}
                              transition={{ duration: 0.5, ease: 'easeOut' }}
                            />
                          </div>
                        )}
                      </motion.button>
                    );
                  })}
                </div>

                {!canVote && !hasVoted && (
                  <div className="mt-4 p-3 bg-orange-500/20 rounded-xl border border-orange-400/30">
                    <p className="text-orange-300 text-sm text-center">
                      You've already voted this round. Wait for the next hour!
                    </p>
                  </div>
                )}

                {hasVoted && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 p-3 bg-green-500/20 rounded-xl border border-green-400/30"
                  >
                    <p className="text-green-300 text-sm text-center">
                      Vote submitted! Check back next hour to see how the story continues.
                    </p>
                  </motion.div>
                )}
              </div>
            )}

            {/* Story Info */}
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6">
              <div className="flex items-center space-x-3 mb-4">
                <Lightbulb className="w-6 h-6 text-amber-400" />
                <h3 className="text-lg font-bold text-white">Story Info</h3>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-white/60">Started:</span>
                  <span className="text-white">{new Date(story.startTime).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">Ends:</span>
                  <span className="text-white">{new Date(story.endTime).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">Total Segments:</span>
                  <span className="text-white">{story.segments.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">Participants:</span>
                  <span className="text-white">{story.participantCount}</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};