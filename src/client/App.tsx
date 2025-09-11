import { GameUI } from './components/GameUI';
import { ErrorBoundary } from './components/ErrorBoundary';

export const App = () => {
  return (
    <ErrorBoundary>
      <GameUI />
    </ErrorBoundary>
  );
};
