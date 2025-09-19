import { GeminiStoryService } from './geminiStoryService';
import { 
  ActiveStory, 
  CompletedStory, 
  StorySegment, 
  StoryVote, 
  UserVoteHistory,
  CreateStoryRequest 
} from '../../shared/types/story';

export class StoryCollabManager {
  private geminiService: GeminiStoryService;
  private activeStory: ActiveStory | null = null;
  private completedStories: CompletedStory[] = [];
  private userVoteHistories: Map<string, UserVoteHistory> = new Map();
  private hourlyTimer: NodeJS.Timeout | null = null;

  constructor() {
    this.geminiService = new GeminiStoryService();
    this.loadStoriesFromStorage();
    this.checkForActiveStory();
  }

  /**
   * Create a new story and start the 48-hour cycle
   */
  async createNewStory(request: CreateStoryRequest = {}): Promise<ActiveStory> {
    // End current story if one exists
    if (this.activeStory && this.activeStory.status === 'active') {
      await this.completeStory();
    }

    // Generate story start with AI
    const { title, opening, aiPrompt } = await this.geminiService.generateStoryStart(
      request.genre || 'adventure',
      request.theme || 'mystery',
      request.tone || 'exciting'
    );

    const now = Date.now();
    const storyId = `story_${now}`;

    // Create initial story segment
    const initialSegment: StorySegment = {
      id: `segment_${now}_0`,
      content: opening,
      timestamp: now,
      hour: 0,
      addedBy: 'ai'
    };

    // Create the story
    this.activeStory = {
      id: storyId,
      title,
      startTime: now,
      endTime: now + (48 * 60 * 60 * 1000), // 48 hours from now
      currentHour: 0,
      segments: [initialSegment],
      status: 'active',
      participantCount: 0,
      aiPrompt
    };

    // Generate first vote
    await this.generateNextVote();

    // Start the hourly timer
    this.startHourlyTimer();

    this.saveStoriesToStorage();
    return this.activeStory;
  }

  /**
   * Get the current active story
   */
  getActiveStory(): ActiveStory | null {
    return this.activeStory;
  }

  /**
   * Submit a vote for the current voting round
   */
  async submitVote(userId: string, voteId: string, optionId: string): Promise<boolean> {
    if (!this.activeStory || !this.activeStory.currentVote) {
      return false;
    }

    const vote = this.activeStory.currentVote;
    
    // Check if vote is still active
    if (vote.status !== 'active' || Date.now() > vote.endTime) {
      return false;
    }

    // Check if user already voted
    const userHistory = this.getUserVoteHistory(userId);
    const alreadyVoted = userHistory.votes.some(v => v.voteId === voteId);
    if (alreadyVoted) {
      return false;
    }

    // Find the option and add vote
    const option = vote.options.find(opt => opt.id === optionId);
    if (!option) {
      return false;
    }

    // Remove user from any other option they might have voted for (shouldn't happen but safety)
    vote.options.forEach(opt => {
      opt.voters = opt.voters.filter(voterId => voterId !== userId);
    });

    // Add vote to chosen option
    option.voters.push(userId);
    option.votes = option.voters.length;

    // Update user vote history
    userHistory.votes.push({
      hour: this.activeStory.currentHour,
      voteId,
      optionId,
      timestamp: Date.now()
    });

    // Update participant count
    const allVoters = new Set<string>();
    this.activeStory.currentVote.options.forEach(opt => {
      opt.voters.forEach(voter => allVoters.add(voter));
    });
    this.activeStory.participantCount = Math.max(this.activeStory.participantCount, allVoters.size);

    this.saveStoriesToStorage();
    return true;
  }

  /**
   * Process hourly progression
   */
  async processHourlyProgression(): Promise<void> {
    if (!this.activeStory || this.activeStory.status !== 'active') {
      return;
    }

    const now = Date.now();
    
    // Check if story should be completed
    if (now >= this.activeStory.endTime || this.activeStory.currentHour >= 47) {
      await this.completeStory();
      return;
    }

    // Complete current vote if it exists
    if (this.activeStory.currentVote && this.activeStory.currentVote.status === 'active') {
      await this.completeCurrentVote();
    }

    // Move to next hour
    this.activeStory.currentHour++;

    // Generate next vote (unless we're at the final hour)
    if (this.activeStory.currentHour < 47) {
      await this.generateNextVote();
    } else {
      // Final hour - generate conclusion
      await this.generateFinalSegment();
      await this.completeStory();
    }

    this.saveStoriesToStorage();
  }

  /**
   * Complete the current vote and add winning segment
   */
  private async completeCurrentVote(): Promise<void> {
    if (!this.activeStory || !this.activeStory.currentVote) {
      return;
    }

    const vote = this.activeStory.currentVote;
    vote.status = 'completed';

    // Find winning option (most votes, ties go to first option)
    const winningOption = vote.options.reduce((winner, current) => 
      current.votes > winner.votes ? current : winner
    );

    vote.winningOptionId = winningOption.id;

    // Generate story segment based on winning option
    const segmentContent = await this.geminiService.generateStorySegment(
      this.activeStory.segments,
      winningOption,
      this.activeStory.currentHour
    );

    // Add new segment
    const newSegment: StorySegment = {
      id: `segment_${Date.now()}_${this.activeStory.currentHour}`,
      content: segmentContent,
      timestamp: Date.now(),
      hour: this.activeStory.currentHour,
      addedBy: 'vote',
      voteId: vote.id
    };

    this.activeStory.segments.push(newSegment);
  }

  /**
   * Generate the next voting round
   */
  private async generateNextVote(): Promise<void> {
    if (!this.activeStory) {
      return;
    }

    const now = Date.now();
    const voteId = `vote_${now}_${this.activeStory.currentHour}`;
    
    // Generate vote options using AI
    const options = await this.geminiService.generateVoteOptions(
      this.activeStory.segments,
      this.activeStory.currentHour
    );

    const vote: StoryVote = {
      id: voteId,
      storyId: this.activeStory.id,
      hour: this.activeStory.currentHour,
      prompt: `What happens next in "${this.activeStory.title}"?`,
      options,
      startTime: now,
      endTime: now + (55 * 60 * 1000), // 55 minutes to vote (5 min buffer for processing)
      status: 'active'
    };

    this.activeStory.currentVote = vote;
  }

  /**
   * Generate final story segment and complete
   */
  private async generateFinalSegment(): Promise<void> {
    if (!this.activeStory) {
      return;
    }

    // Use the last vote's winning option if available
    const lastVote = this.activeStory.currentVote;
    const finalChoice = lastVote?.winningOptionId 
      ? lastVote.options.find(opt => opt.id === lastVote.winningOptionId)
      : undefined;

    const conclusion = await this.geminiService.generateStoryConclusion(
      this.activeStory.segments,
      finalChoice
    );

    const finalSegment: StorySegment = {
      id: `segment_${Date.now()}_final`,
      content: conclusion,
      timestamp: Date.now(),
      hour: 47,
      addedBy: 'ai'
    };

    this.activeStory.segments.push(finalSegment);
  }

  /**
   * Complete the active story and move it to completed stories
   */
  private async completeStory(): Promise<void> {
    if (!this.activeStory) {
      return;
    }

    // Stop timer
    this.stopHourlyTimer();

    // Generate summary
    const summary = await this.geminiService.generateStorySummary(this.activeStory.segments);

    // Create completed story
    const completedStory: CompletedStory = {
      id: this.activeStory.id,
      title: this.activeStory.title,
      completedAt: Date.now(),
      segments: this.activeStory.segments,
      totalParticipants: this.activeStory.participantCount,
      totalVotes: this.getTotalVotes(),
      duration: Date.now() - this.activeStory.startTime,
      summary
    };

    // Add to completed stories
    this.completedStories.unshift(completedStory);
    
    // Keep only last 50 completed stories
    if (this.completedStories.length > 50) {
      this.completedStories = this.completedStories.slice(0, 50);
    }

    // Clear active story
    this.activeStory = null;

    this.saveStoriesToStorage();
  }

  /**
   * Get completed stories with pagination
   */
  getCompletedStories(page: number = 1, limit: number = 10): {
    stories: CompletedStory[];
    total: number;
    totalPages: number;
  } {
    const start = (page - 1) * limit;
    const end = start + limit;
    
    return {
      stories: this.completedStories.slice(start, end),
      total: this.completedStories.length,
      totalPages: Math.ceil(this.completedStories.length / limit)
    };
  }

  /**
   * Get a specific completed story
   */
  getCompletedStory(storyId: string): CompletedStory | null {
    return this.completedStories.find(story => story.id === storyId) || null;
  }

  /**
   * Get user vote history
   */
  private getUserVoteHistory(userId: string): UserVoteHistory {
    if (!this.userVoteHistories.has(userId)) {
      this.userVoteHistories.set(userId, {
        userId,
        storyId: this.activeStory?.id || '',
        votes: []
      });
    }
    return this.userVoteHistories.get(userId)!;
  }

  /**
   * Get total votes cast in current story
   */
  private getTotalVotes(): number {
    let total = 0;
    this.userVoteHistories.forEach(history => {
      total += history.votes.length;
    });
    return total;
  }

  /**
   * Start the hourly timer for story progression
   */
  private startHourlyTimer(): void {
    this.stopHourlyTimer();
    
    // Check every minute and process if an hour has passed
    this.hourlyTimer = setInterval(async () => {
      if (this.activeStory && this.activeStory.status === 'active') {
        const now = Date.now();
        const hoursSinceStart = Math.floor((now - this.activeStory.startTime) / (60 * 60 * 1000));
        
        if (hoursSinceStart > this.activeStory.currentHour) {
          await this.processHourlyProgression();
        }
      }
    }, 60 * 1000); // Check every minute
  }

  /**
   * Stop the hourly timer
   */
  private stopHourlyTimer(): void {
    if (this.hourlyTimer) {
      clearInterval(this.hourlyTimer);
      this.hourlyTimer = null;
    }
  }

  /**
   * Check if there should be an active story on startup
   */
  private checkForActiveStory(): void {
    if (this.activeStory && this.activeStory.status === 'active') {
      const now = Date.now();
      
      if (now >= this.activeStory.endTime) {
        // Story should have ended, complete it
        this.completeStory();
      } else {
        // Resume the timer
        this.startHourlyTimer();
      }
    }
  }

  /**
   * Save data to storage (in a real app, this would be a database)
   */
  private saveStoriesToStorage(): void {
    // In a real app, this would save to a database
    // For now, we'll keep it in memory
    console.log('Story data saved');
  }

  /**
   * Load data from storage (in a real app, this would be a database)
   */
  private loadStoriesFromStorage(): void {
    // In a real app, this would load from a database
    // For now, we'll start with empty data
    console.log('Story data loaded');
  }

  /**
   * Get time until next hour progression
   */
  getTimeToNextHour(): number {
    if (!this.activeStory || this.activeStory.status !== 'active') {
      return 0;
    }

    const now = Date.now();
    const nextHourTime = this.activeStory.startTime + ((this.activeStory.currentHour + 1) * 60 * 60 * 1000);
    return Math.max(0, nextHourTime - now);
  }

  /**
   * Check if user can vote
   */
  canUserVote(userId: string): boolean {
    if (!this.activeStory || !this.activeStory.currentVote) {
      return false;
    }

    const vote = this.activeStory.currentVote;
    if (vote.status !== 'active' || Date.now() > vote.endTime) {
      return false;
    }

    // Check if user already voted this round
    const userHistory = this.getUserVoteHistory(userId);
    return !userHistory.votes.some(v => v.voteId === vote.id);
  }
}