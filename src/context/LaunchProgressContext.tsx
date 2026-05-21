import { type ReactNode } from 'react';
import { useLaunchWaitlistProgress } from '../hooks/useLaunchWaitlistProgress';
import { LaunchProgressContext } from '../hooks/useLaunchProgress';

export function LaunchProgressProvider({ children }: { children: ReactNode }) {
  const { progress, live, error, refresh, setProgress } = useLaunchWaitlistProgress();

  return (
    <LaunchProgressContext.Provider
      value={{
        progress,
        live,
        error,
        refresh,
        applyProgress: setProgress,
      }}
    >
      {children}
    </LaunchProgressContext.Provider>
  );
}
