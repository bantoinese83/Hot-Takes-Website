import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { SITE } from '../siteCopy';

/**
 * Universal-link landing for https://hottakedate.com/join?ref=CODE
 * When the app is installed, iOS opens Hot Take directly; Safari users see this page.
 */
export function JoinInvitePage() {
  const [params] = useSearchParams();
  const ref = useMemo(() => {
    const raw = params.get('ref')?.trim() ?? '';
    return raw.length >= 6 ? raw.toUpperCase() : null;
  }, [params]);

  return (
    <main className="join-invite-page">
      <div className="join-invite-card">
        <p className="join-invite-eyebrow">{SITE.appName}</p>
        <h1>You&apos;re invited to the line</h1>
        {ref ? (
          <p className="join-invite-code">
            Invite code: <strong>{ref}</strong>
          </p>
        ) : null}
        <p>
          {ref
            ? 'Install Hot Take and sign in — your invite is applied automatically when you open the app from this link.'
            : 'Install Hot Take to join live video speed dates built around your hot take.'}
        </p>
        <p className="join-invite-hint">
          Already have the app? Open this page on your iPhone and tap the link again, or paste the invite URL in Notes and
          long-press → Open in {SITE.appName}.
        </p>
        <div className="join-invite-actions">
          <Link to="/" className="admin-btn admin-btn--primary">
            Get the app
          </Link>
          <Link to="/" className="admin-btn admin-btn--ghost">
            Learn more
          </Link>
        </div>
      </div>
    </main>
  );
}
