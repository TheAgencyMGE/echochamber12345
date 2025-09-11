import { reddit } from '@devvit/web/server';

export async function createPost() {
  return await reddit.submitPost({
    title: '🎨 Daily Subreddit Sketch Challenge - Draw & Guess!',
    text: `Welcome to Subreddit Sketch! 🎨

**Today's Challenge:** Get a Reddit-themed prompt and draw it in 60 seconds!

**How to Play:**
1. **Draw** - Express the prompt in a simple sketch (60 seconds)
2. **Guess** - Try to guess what others drew
3. **Vote** - Vote for the best and funniest drawings
4. **Earn Points** - Build your reputation as an artist and detective!

**Daily Themes:**
- **Monday:** Subreddit emotions
- **Tuesday:** Reddit features/mechanics  
- **Wednesday:** Famous Reddit moments
- **Thursday:** Reddit user types
- **Friday:** Meme interpretations
- **Weekend:** Free draw (any Reddit topic)

Click below to start drawing! No artistic skills required - stick figures welcome! 😄

The community draws together, guesses together, and laughs together. Join the fun!`,
    subredditName: 'echochamber12345_dev',
  });
}
