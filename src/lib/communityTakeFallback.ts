import type { CommunityTakePromptUI } from './communityTakes';

/** Offline / pre-migration fallback — keep in sync with `20260518200000_refresh_community_take_prompts.sql`. */
export const FALLBACK_PROMPTS: CommunityTakePromptUI[] = [
  { id: 'ranch-everything', category: 'Ranch · Unhinged', question: 'Ranch isn\'t a condiment — it\'s a lifestyle. Fries, eggs, pizza crust: all fair game.', hot: 58, cold: 42 },
  { id: 'hot-honey-era', category: 'Food Trends', question: 'Hot honey on everything already jumped the shark and we\'re still pretending it\'s revolutionary.', hot: 41, cold: 59 },
  { id: 'espresso-martini-dinner', category: 'Drinks · Comedy', question: 'Two espresso martinis absolutely count as dinner if you called it "girl dinner."', hot: 72, cold: 28 },
  { id: 'brat-summer', category: 'Pop Culture · 2025–26', question: '"Brat summer" was a personality substitute, not an aesthetic — and we all knew it.', hot: 63, cold: 37 },
  { id: 'standup-podcast', category: 'Comedy', question: 'Half of new "comedy specials" are podcast opinions with a microphone and a leather couch.', hot: 79, cold: 21 },
  { id: 'reality-villain-edit', category: 'Ranch · TV', question: 'Reality-TV villains are produced harder than any scripted show — and that\'s the product.', hot: 68, cold: 32 },
  { id: 'ai-slop-feeds', category: 'Tech & AI', question: 'AI slop in your feed is worse than ads because it pretends a human actually posted it.', hot: 84, cold: 16 },
  { id: 'brain-rot-scroll', category: 'Ranch · Tech', question: '2 a.m. algorithm scrolling is voluntary brain damage we call "winding down."', hot: 77, cold: 23 },
  { id: 'hinge-ai-prompts', category: 'Dating · Tech', question: 'AI-written Hinge prompts are obvious — they should be an automatic left swipe.', hot: 88, cold: 12 },
  { id: 'situationship-era', category: 'Dating · Adult', question: 'Situationships aren\'t mysterious — someone chose low effort and the other person cooperated.', hot: 71, cold: 29 },
  { id: 'talking-stage-tax', category: 'Adult · Dating', question: 'A three-week talking stage with zero plan is emotional freeloading with read receipts.', hot: 82, cold: 18 },
  { id: 'split-bill-first-date', category: 'Ranch · Dating', question: 'Splitting the bill on a first date you asked for isn\'t "equality" — it\'s a vibe-check fail.', hot: 54, cold: 46 },
  { id: 'ghosting-normalized', category: 'Dating Culture', question: 'Ghosting being "normal" is why everyone has trust issues — send one honest text.', hot: 76, cold: 24 },
  { id: 'body-count-question', category: 'Spicy · Adult', question: 'Asking "body count" on date two tells me everything about you and nothing about them.', hot: 91, cold: 9 },
];
