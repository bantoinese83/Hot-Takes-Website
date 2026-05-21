/** Factual product copy — keep aligned with iOS `HotTakeBrandLanguage` + `AppConstants`. */
export const SITE = {
  appName: 'Hot Take',
  tagline: 'Live video speed dating for people with opinions.',
  dateMinutes: 3,
  supportEmail: 'connect@monarch-labs.com',
  company: 'Monarch Labs Collective Inc.',
  siteUrl: 'https://hottakedate.com',
} as const;

export const TRUST_PILLARS = [
  {
    title: 'No endless scroll',
    body: 'One queue, one live conversation — not hundreds of profiles to compare.',
  },
  {
    title: 'Privacy-first location',
    body: 'Approximate area only (~0.1° buckets). We never show your exact pin on a map.',
  },
  {
    title: 'Encrypted live video',
    body: `${SITE.dateMinutes}-minute dates over WebRTC (LiveKit). Streams are not recorded on our servers.`,
  },
  {
    title: 'Real deletion',
    body: 'Profile → Delete account removes auth, profile, queue, and match history permanently.',
  },
] as const;

export const FAQ_DATA = [
  {
    question: 'How is Hot Take different from swipe apps?',
    answer:
      'We pair for short live video instead of an endless catalog to cut comparison fatigue. Plus, we use AI to find people with similar vibes based on your Hot Take as a light tie-breaker!',
  },
  {
    question: 'Are video dates recorded?',
    answer:
      'No. Live video runs over encrypted WebRTC (LiveKit). We do not store your camera or microphone streams.',
  },
  {
    question: 'Why does the app need camera and microphone?',
    answer:
      'Video dates require both. iOS shows a clear permission sheet before access is requested.',
  },
  {
    question: 'How does Match work after a date?',
    answer:
      'Tap Match when the timer ends. If you both choose Match, a thread opens under Matches for messaging.',
  },
  {
    question: 'How do I delete my account?',
    answer:
      'Profile → Delete account. That removes your auth user, profile, queue state, and match data from our backend.',
  },
  {
    question: 'What are Profile Avatars?',
    answer: 'You can upload a photo or use a fun, shuffle-able DiceBear avatar to represent yourself on the app!',
  },
  {
    question: 'How do I get the app?',
    answer:
      'Join the waitlist on this site with your email. We invite people in waves as we open more cities and capacity — no TestFlight link required.',
  },
  {
    question: 'How do I contact support?',
    answer: `Email ${SITE.supportEmail} for account help or to report another member.`,
  },
] as const;
