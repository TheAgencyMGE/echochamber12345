import { GoogleGenerativeAI } from '@google/generative-ai';
import { StorySegment, VoteOption } from '../../shared/types/story';

// Get API key from environment variables with fallback for development
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyCeo2y7AsEKu1DtykOk9ltVcSkpJ1PVlEE';

if (!GEMINI_API_KEY || GEMINI_API_KEY === 'your_gemini_api_key_here') {
  console.warn('Warning: GEMINI_API_KEY not properly configured. Please set it in your .env file.');
}

export class GeminiStoryService {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor() {
    this.genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
  }

  /**
   * Generate the opening of a new story
   */
  async generateStoryStart(
    genre: string = 'fantasy',
    theme: string = 'adventure',
    tone: string = 'exciting'
  ): Promise<{ title: string; opening: string; aiPrompt: string }> {
    const prompt = `Create the opening paragraph for a collaborative story with the following parameters:
- Genre: ${genre}
- Theme: ${theme}
- Tone: ${tone}

Requirements:
1. Write a compelling opening paragraph (2-3 sentences, 50-100 words)
2. End with a cliffhanger or decision point that sets up choices for readers
3. Include vivid imagery and engaging characters
4. Leave room for the story to develop in multiple directions
5. Don't resolve any major conflicts - this is just the beginning

Also provide a short, catchy title for this story (3-6 words).

Format your response as:
TITLE: [story title]
OPENING: [opening paragraph]`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Parse the response
      const titleMatch = text.match(/TITLE:\s*(.+?)(?:\n|$)/);
      const openingMatch = text.match(/OPENING:\s*([\s\S]+?)(?:\n\n|$)/);

      const title = titleMatch ? titleMatch[1].trim() : 'Untitled Story';
      const opening = openingMatch ? openingMatch[1].trim() : text.trim();

      return {
        title,
        opening,
        aiPrompt: prompt
      };
    } catch (error) {
      console.error('Error generating story start:', error);
      // Fallback story
      return {
        title: 'The Mysterious Journey',
        opening: 'The old map crinkled in Sarah\'s hands as she stood at the crossroads. Three paths stretched before her: one leading into a dark forest, another toward distant mountains, and the third following a winding river. Each seemed to promise adventure, but also danger.',
        aiPrompt: prompt
      };
    }
  }

  /**
   * Generate voting options for the next story segment
   */
  async generateVoteOptions(
    storySegments: StorySegment[],
    currentHour: number
  ): Promise<VoteOption[]> {
    const storyText = storySegments.map(segment => segment.content).join('\n\n');
    const progressPercent = Math.round((currentHour / 48) * 100);

    const prompt = `Based on this ongoing collaborative story, generate 3 compelling options for what happens next:

CURRENT STORY:
${storyText}

CONTEXT:
- This is hour ${currentHour} of a 48-hour story (${progressPercent}% complete)
- The story should gradually build toward a climax and resolution
- Each option should be 15-25 words
- Options should offer meaningfully different story directions
- Consider character development, plot advancement, and reader engagement

Generate exactly 3 options that:
1. Advance the plot in different ways
2. Are equally compelling and viable
3. Could lead to interesting story developments
4. Match the established tone and genre

Format as:
OPTION1: [brief description]
OPTION2: [brief description]  
OPTION3: [brief description]`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Parse options
      const option1Match = text.match(/OPTION1:\s*(.+?)(?:\n|$)/);
      const option2Match = text.match(/OPTION2:\s*(.+?)(?:\n|$)/);
      const option3Match = text.match(/OPTION3:\s*(.+?)(?:\n|$)/);

      const options: VoteOption[] = [
        {
          id: `option_${Date.now()}_1`,
          text: option1Match ? option1Match[1].trim() : 'Continue the adventure forward',
          votes: 0,
          voters: []
        },
        {
          id: `option_${Date.now()}_2`,
          text: option2Match ? option2Match[1].trim() : 'Take a different approach',
          votes: 0,
          voters: []
        },
        {
          id: `option_${Date.now()}_3`,
          text: option3Match ? option3Match[1].trim() : 'Explore an unexpected path',
          votes: 0,
          voters: []
        }
      ];

      return options;
    } catch (error) {
      console.error('Error generating vote options:', error);
      // Fallback options
      return [
        {
          id: `option_${Date.now()}_1`,
          text: 'Continue forward with determination',
          votes: 0,
          voters: []
        },
        {
          id: `option_${Date.now()}_2`,
          text: 'Pause to consider other possibilities',
          votes: 0,
          voters: []
        },
        {
          id: `option_${Date.now()}_3`,
          text: 'Take a bold, unexpected action',
          votes: 0,
          voters: []
        }
      ];
    }
  }

  /**
   * Generate the next story segment based on winning vote option
   */
  async generateStorySegment(
    storySegments: StorySegment[],
    winningOption: VoteOption,
    currentHour: number
  ): Promise<string> {
    const storyText = storySegments.map(segment => segment.content).join('\n\n');
    const progressPercent = Math.round((currentHour / 48) * 100);

    const prompt = `Continue this collaborative story based on the winning vote option:

CURRENT STORY:
${storyText}

WINNING CHOICE: ${winningOption.text}

CONTEXT:
- This is hour ${currentHour} of a 48-hour story (${progressPercent}% complete)
- Write a story segment that implements the chosen option
- Segment should be 1-2 paragraphs (75-150 words)
- Maintain consistency with established characters, tone, and plot
- End with a natural transition point for the next choice
- If near the end (hours 40+), start building toward resolution

Requirements:
- Stay true to the winning option
- Advance the plot meaningfully
- Maintain narrative flow from previous segments
- Create engagement for the next choice point
- Use vivid, engaging prose`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text().trim();
    } catch (error) {
      console.error('Error generating story segment:', error);
      // Fallback continuation
      return `Following the chosen path, our story continues to unfold in unexpected ways. The characters find themselves facing new challenges and opportunities that will shape their destiny.`;
    }
  }

  /**
   * Generate a story conclusion for the final hour
   */
  async generateStoryConclusion(
    storySegments: StorySegment[],
    finalChoice?: VoteOption
  ): Promise<string> {
    const storyText = storySegments.map(segment => segment.content).join('\n\n');

    const prompt = `Write a satisfying conclusion for this 48-hour collaborative story:

FULL STORY:
${storyText}

${finalChoice ? `FINAL CHOICE: ${finalChoice.text}` : ''}

Requirements:
- Write a conclusive ending (100-200 words)
- Resolve major plot threads and character arcs
- Provide emotional satisfaction
- Reference key events from the story
- End on a note that feels complete but memorable
- Maintain the established tone and style

This should feel like a proper story ending that brings closure to the collaborative journey.`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text().trim();
    } catch (error) {
      console.error('Error generating story conclusion:', error);
      return `And so our tale comes to an end, with our characters having grown and changed through their incredible journey. Though this story concludes, its memory will live on, a testament to the power of collaborative storytelling and shared imagination.`;
    }
  }

  /**
   * Generate a summary for a completed story
   */
  async generateStorySummary(completedStory: StorySegment[]): Promise<string> {
    const storyText = completedStory.map(segment => segment.content).join('\n\n');

    const prompt = `Create a brief, engaging summary (2-3 sentences, 40-80 words) for this collaborative story:

STORY:
${storyText}

The summary should:
- Capture the main plot and themes
- Be engaging for potential readers
- Highlight what makes this story unique
- Work as a preview/teaser for the story viewer`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text().trim();
    } catch (error) {
      console.error('Error generating story summary:', error);
      return 'A collaborative story created through community choices, featuring adventure, character growth, and unexpected twists.';
    }
  }
}