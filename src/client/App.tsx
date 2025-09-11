import React from 'react';
import { ErrorBoundary } from './components/ErrorBoundary';
import { PremiumGameUI } from './components/PremiumGameUI';

export const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <PremiumGameUI />
    </ErrorBoundary>
  );
};
