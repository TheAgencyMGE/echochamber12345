// Story collaboration types for Storycollab game

export interface StorySegment {
  id: string;
  content: string;
  timestamp: number;
  hour: number; // Which hour of the 48-hour cycle this was added
  addedBy: 'ai' | 'vote';
  voteId?: string; // If added by vote, which vote resulted in this
}

export interface VoteOption {
  id: string;
  text: string;
  description?: string;
  votes: number;
  voters: string[]; // User IDs who voted for this option
}

export interface StoryVote {
  id: string;
  storyId: string;
  hour: number; // Which hour of the story this vote is for
  prompt: string; // Context for what users are voting on
  options: VoteOption[];
  startTime: number;
  endTime: number;
  status: 'active' | 'completed' | 'pending';
  winningOptionId?: string;
}

export interface ActiveStory {
  id: string;
  title: string;
  startTime: number;
  endTime: number; // 48 hours after start
  currentHour: number; // 0-47, which hour we're in
  segments: StorySegment[];
  currentVote?: StoryVote;
  status: 'active' | 'completed';
  participantCount: number;
  aiPrompt: string; // The initial AI prompt that started the story
}

export interface CompletedStory {
  id: string;
  title: string;
  completedAt: number;
  segments: StorySegment[];
  totalParticipants: number;
  totalVotes: number;
  duration: number; // Actual duration in milliseconds
  tags?: string[];
  summary?: string; // AI-generated summary
}

export interface UserVoteHistory {
  userId: string;
  storyId: string;
  votes: {
    hour: number;
    voteId: string;
    optionId: string;
    timestamp: number;
  }[];
}

export interface StoryStats {
  totalStories: number;
  activeStory?: ActiveStory;
  recentCompletedStories: CompletedStory[];
  userParticipation?: {
    storiesParticipated: number;
    totalVotes: number;
    winningVotes: number; // How many times user voted for winning option
  };
}

// API request/response types
export interface CreateStoryRequest {
  genre?: string;
  theme?: string;
  tone?: 'serious' | 'humorous' | 'mysterious' | 'romantic' | 'adventure';
}

export interface CreateStoryResponse {
  story: ActiveStory;
  vote: StoryVote;
}

export interface SubmitVoteRequest {
  voteId: string;
  optionId: string;
}

export interface SubmitVoteResponse {
  success: boolean;
  vote: StoryVote;
  timeRemaining: number;
}

export interface GetStoryResponse {
  story: ActiveStory | null;
  timeToNextHour: number;
  canVote: boolean;
}

export interface GetCompletedStoriesRequest {
  page?: number;
  limit?: number;
  sortBy?: 'recent' | 'popular' | 'title';
  search?: string;
}

export interface GetCompletedStoriesResponse {
  stories: CompletedStory[];
  total: number;
  page: number;
  totalPages: number;
}