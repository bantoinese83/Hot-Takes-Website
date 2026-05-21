import { useEffect, useState } from 'react';
import {
  demoLaunchProgress,
  fetchLaunchWaitlistProgress,
  subscribeLaunchWaitlistProgress,
  type LaunchProgress,
} from '../lib/launchWaitlistProgress';
import { isSupabaseConfigured } from '../lib/supabase';

export function useLaunchWaitlistProgress() {
  const [progress, setProgress] = useState<LaunchProgress>(demoLaunchProgress());
  const [live, setLive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLive(false);
      return;
    }

    setLive(true);
    return subscribeLaunchWaitlistProgress(
      (next) => {
        setProgress(next);
        setError(null);
      },
      (msg) => setError(msg),
    );
  }, []);

  const refresh = async () => {
    try {
      const next = await fetchLaunchWaitlistProgress();
      setProgress(next);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Refresh failed');
    }
  };

  return { progress, live, error, refresh, setProgress };
}
