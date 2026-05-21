import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

/** One-shot flash from `navigate(path, { state: { flash: '...' } })`. */
export function useFlashMessage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const flash = (location.state as { flash?: string } | null)?.flash;
    if (!flash) return;
    setMessage(flash);
    navigate(location.pathname + location.search, { replace: true, state: {} });
  }, [location.pathname, location.search, location.state, navigate]);

  return { message, clear: () => setMessage(null) };
}
