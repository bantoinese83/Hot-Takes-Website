import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Loader2, User, X } from 'lucide-react';
import { searchProfiles, type AdminProfileRow } from '../../lib/adminApi';
import { formatShortId } from '../lib/adminFormat';

export function AdminGlobalSearch() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<AdminProfileRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await searchProfiles(query, 6);
        setResults(res.profiles);
        setIsOpen(true);
      } catch (err) {
        console.error('Global search error:', err);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (userId: string) => {
    setQuery('');
    setIsOpen(false);
    navigate(`/admin/users/${userId}`);
  };

  return (
    <div className="admin-global-search" ref={containerRef}>
      <div className="admin-global-search-input-wrap">
        <Search className="admin-global-search-icon" size={16} />
        <input
          type="text"
          placeholder="Jump to user…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.trim() && setIsOpen(true)}
          aria-label="Global user search"
        />
        {query ? (
          <button
            type="button"
            className="admin-global-search-clear"
            onClick={() => setQuery('')}
            aria-label="Clear search"
          >
            <X size={14} />
          </button>
        ) : (
          <span className="admin-global-search-kbd">/</span>
        )}
      </div>

      {isOpen && (query.trim() || loading) && (
        <div className="admin-global-search-results">
          {loading ? (
            <div className="admin-global-search-loading">
              <Loader2 size={16} className="admin-spin" />
              <span>Searching…</span>
            </div>
          ) : results.length > 0 ? (
            <ul className="admin-global-search-list">
              {results.map((user) => (
                <li key={user.id}>
                  <button
                    type="button"
                    className="admin-global-search-item"
                    onClick={() => handleSelect(user.id)}
                  >
                    <User size={14} className="admin-global-search-item-icon" />
                    <div className="admin-global-search-item-info">
                      <span className="admin-global-search-item-name">
                        {user.name || 'Unnamed User'}
                      </span>
                      <span className="admin-global-search-item-id">
                        {formatShortId(user.id)} • {user.location_label || 'No location'}
                      </span>
                    </div>
                  </button>
                </li>
              ))}
              <li className="admin-global-search-more">
                <button
                  type="button"
                  onClick={() => {
                    navigate(`/admin/users?q=${encodeURIComponent(query)}`);
                    setIsOpen(false);
                  }}
                >
                  See all results →
                </button>
              </li>
            </ul>
          ) : (
            <div className="admin-global-search-empty">No users found</div>
          )}
        </div>
      )}
    </div>
  );
}
