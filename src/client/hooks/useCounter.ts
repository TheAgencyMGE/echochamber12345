import { useState } from 'react';

interface CounterState {
  count: number;
  username: string | null;
  loading: boolean;
}

export const useCounter = () => {
  const [state] = useState<CounterState>({
    count: 0,
    username: 'Player',
    loading: false
  });

  const increment = () => {
    // Not used in drawing game
  };

  const decrement = () => {
    // Not used in drawing game
  };

  return {
    ...state,
    increment,
    decrement
  };
};
