import { createContext, useContext } from 'react';
import type { LaunchProgress } from '../lib/launchWaitlistProgress';

export type LaunchProgressCtx = {
  progress: LaunchProgress;
  live: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  applyProgress: (next: LaunchProgress) => void;
};

export const LaunchProgressContext = createContext<LaunchProgressCtx | null>(null);

export function useLaunchProgress() {
  const ctx = useContext(LaunchProgressContext);
  if (!ctx) {
    throw new Error('useLaunchProgress must be used within LaunchProgressProvider');
  }
  return ctx;
}
