## Echo Chamber

**Your daily destination for creative competition and community fun on Reddit!**

Echo Chamber is a multi-game platform built on Reddit's Devvit platform, featuring three daily creative challenges that bring communities together through art, storytelling, and mini-golf competition.

### 🎮 Featured Games

#### 🎨 **Drawverse** *(Fully Implemented)*
Express your creativity with daily drawing challenges! Create art based on prompts, guess what others have drawn, and compete for the top spot on the leaderboard. Features real-time drawing canvas, community voting, and daily competitions.

#### 📖 **Storycollab** *(In Development)*
Build epic stories together! Contribute to collaborative narratives powered by AI and vote on the best story continuations. Each hour brings new opportunities to shape evolving tales.

#### 🏌️ **Golf Gang** *(In Development)*
Master daily mini golf challenges! Navigate unique procedurally generated courses, compete for the lowest score, and climb the daily leaderboard with physics-based gameplay.

### 🛠️ Tech Stack

- **[Devvit](https://developers.reddit.com/)**: Reddit's developer platform for immersive community experiences
- **[React](https://react.dev/)**: Modern UI with hooks and state management
- **[Vite](https://vite.dev/)**: Fast build tool and development server
- **[Express](https://expressjs.com/)**: Backend API and game logic
- **[Tailwind CSS](https://tailwindcss.com/)**: Utility-first styling with custom animations
- **[Framer Motion](https://www.framer.com/motion/)**: Smooth animations and transitions
- **[Three.js](https://threejs.org/)**: 3D graphics for golf gameplay
- **[TypeScript](https://www.typescriptlang.org/)**: Type safety across the entire stack

## Getting Started

### Prerequisites
- Node.js 22+ installed on your machine
- Reddit account connected to Reddit Developers
- Devvit CLI installed globally
- Google Gemini API key (for AI story generation)

### Installation

1. Clone this repository:
   ```bash
   git clone https://github.com/TheAgencyMGE/echochamber12345.git
   cd echochamber12345
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   ```
   Then edit `.env` and add your Google Gemini API key:
   ```
   GEMINI_API_KEY=your_actual_api_key_here
   ```
   Get your API key from [Google AI Studio](https://makersuite.google.com/app/apikey)

4. Set up your Reddit app on the [Reddit Developers](https://developers.reddit.com/) platform

5. Login to Devvit CLI:
   ```bash
   npm run login
   ```

6. Start development:
   ```bash
   npm run dev
   ```

## Commands

- **`npm run dev`**: Starts development server with live reload on Reddit
- **`npm run build`**: Builds both client and server for production
- **`npm run deploy`**: Uploads new version to Reddit
- **`npm run launch`**: Publishes app for community review
- **`npm run check`**: Runs type checking, linting, and formatting
- **`npm run login`**: Authenticates with Reddit Developers

## Project Structure

```
src/
├── client/           # React frontend
│   ├── components/   # Game components and UI
│   │   ├── Drawverse.tsx      # Drawing game (complete)
│   │   ├── Storycollab.tsx    # Story collaboration (WIP)
│   │   ├── GolfGang.tsx       # Mini golf game (WIP)
│   │   └── DrawingCanvas.tsx  # Canvas implementation
│   ├── hooks/        # Custom React hooks
│   └── types/        # TypeScript definitions
├── server/           # Express backend
│   └── core/         # Game logic and data management
└── shared/           # Shared types and utilities
```

## Features

- **Daily Challenges**: New content every day across all games
- **Community Leaderboards**: Compete with other Reddit users
- **Real-time Gameplay**: Live drawing, guessing, and voting
- **Reddit Integration**: Native Reddit post creation and community features
- **Responsive Design**: Works on desktop and mobile
- **Modern UI**: Smooth animations and polished interface

## Development Notes

This project uses a custom development environment optimized for Reddit's Devvit platform. The app runs as embedded content within Reddit posts, allowing for seamless community integration.

### Cursor Integration

This template includes pre-configured Cursor environment settings. [Download Cursor](https://www.cursor.com/downloads) and enable the `devvit-mcp` integration when prompted for enhanced development experience.
