import { generateStory } from './story-engine.mjs';
import { MODERATION_DECISIONS, moderatePrompt } from './moderation-boundary.mjs';
import { addLocalStory, readLocalStories, writeLocalStories } from './story-persistence.mjs';
import { createLocalOnlyPersistenceNotice } from './firebase-adapter.mjs';
import { summarizeRuntimeReadiness } from './runtime-readiness.mjs';

const app = document.getElementById('app');
const SETTINGS_KEY = 'urai_parent_settings';

const escapeHtml = (value = '') =>
  String(value).replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[char]);
const getLib = () => readLocalStories();
const setLib = (value) => writeLocalStories(value);
const getSettings = () => JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{"shareAnalytics":false,"demoOnly":true}');
const setSettings = (value) => localStorage.setItem(SETTINGS_KEY, JSON.stringify(value));
const localPersistenceNotice = createLocalOnlyPersistenceNotice();
const runtimeReadiness = summarizeRuntimeReadiness();

const routes = {
  home,
  features,
  pricing,
  demo,
  create,
  library,
  dashboard,
  login,
  signup,
  about,
  contact,
  privacy,
  terms,
  safety,
  settings,
  admin,
  creator,
  readiness,
};

function route() {
  const hash = location.hash || '#home';
  const routeName = hash.replace('#', '').split('/')[0] || 'home';
  if (hash.startsWith('#story/')) return detail(hash.split('/')[1]);
  const view = routes[routeName] || notFound;
  view();
  app.focus({ preventScroll: true });
}

function page(title, body) {
  document.title = `${title} | URAI Storytime`;
  app.innerHTML = body;
}

function statusPill(status) {
  return `<span class="pill ${status.toLowerCase().replaceAll(' ', '-')}">${status}</span>`;
}

function home() {
  page(
    'Family-safe bedtime stories',
    `<section class="hero">
      <div>
        <p class="eyebrow">Standalone demo · URAI Labs ready</p>
        <h1>Magical bedtime stories with privacy-first guardrails.</h1>
        <p>Create gentle, family-safe story drafts locally in the browser. Cloud accounts, paid billing, admin review, and URAI ecosystem integrations are intentionally marked as not launched until verified.</p>
        <div class="actions"><a class="btn" href="#create">Start a story</a><a class="btn secondary" href="#readiness">Readiness status</a></div>
      </div>
      <aside class="card launch-card"><h2>Launch status</h2><p>${statusPill(runtimeReadiness.status)} Production readiness is blocked until Firebase, auth, deployment, and security evidence are verified.</p><p>${escapeHtml(localPersistenceNotice.message)}</p></aside>
    </section>
    <section class="grid three">
      <article class="card"><h3>Local demo mode</h3><p>No account or API key. Stories save to this browser only.</p></article>
      <article class="card"><h3>Parent-first controls</h3><p>Demo safety language is visible, conservative, and honest about limits.</p></article>
      <article class="card"><h3>URAI integration path</h3><p>Shared auth, analytics, admin, privacy, and content libraries are documented as future integrations until wired and verified.</p></article>
    </section>`
  );
}

function readiness() {
  page(
    'Runtime Readiness',
    `<section class="card"><h1>Runtime readiness</h1><p>${statusPill(runtimeReadiness.status)} URAI Storytime is not production-ready until all critical runtime gates are verified with evidence.</p>
    <div class="matrix">${runtimeReadiness.gates
      .map(
        (gate) => `<div><b>${escapeHtml(gate.name)}</b><span>${statusPill(gate.status)}</span><p>${escapeHtml(gate.evidence || gate.blocker || 'No evidence recorded.')}</p></div>`
      )
      .join('')}</div></section>`
  );
}

function features() {
  page(
    'Features',
    `<section class="card"><h1>Features</h1><div class="matrix">
      <div><b>Local story generation</b><span>${statusPill('VERIFIED IN CODE')}</span><p>Deterministic demo engine generates a short bedtime story.</p></div>
      <div><b>Prompt safety precheck</b><span>${statusPill('PARTIAL')}</span><p>Blocklist filtering is useful for demo only. It is not production moderation.</p></div>
      <div><b>Story library</b><span>${statusPill('LOCAL ONLY')}</span><p>Saved with browser localStorage; no cross-device sync.</p></div>
      <div><b>Narration playback</b><span>${statusPill('BROWSER FALLBACK')}</span><p>Uses Web Speech when available, with graceful unsupported messaging.</p></div>
      <div><b>Cloud accounts</b><span>${statusPill('NOT LAUNCHED')}</span><p>Signup/login routes intentionally route to waitlist until auth is implemented.</p></div>
      <div><b>Billing and tiers</b><span>${statusPill('NOT LAUNCHED')}</span><p>Pricing is displayed as launch intent, not active billing.</p></div>
    </div></section>`
  );
}
