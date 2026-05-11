import { generateStory, moderatePrompt } from './story-engine.mjs';

const app = document.getElementById('app');
const LIBRARY_KEY = 'urai_library';
const SETTINGS_KEY = 'urai_parent_settings';

const escapeHtml = (value = '') =>
  String(value).replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[char]);
const getLib = () => JSON.parse(localStorage.getItem(LIBRARY_KEY) || '[]');
const setLib = (value) => localStorage.setItem(LIBRARY_KEY, JSON.stringify(value));
const getSettings = () => JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{"shareAnalytics":false,"demoOnly":true}');
const setSettings = (value) => localStorage.setItem(SETTINGS_KEY, JSON.stringify(value));

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
  creator
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
        <div class="actions"><a class="btn" href="#create">Start a story</a><a class="btn secondary" href="#safety">Review safety model</a></div>
      </div>
      <aside class="card launch-card"><h2>Launch status</h2><p>${statusPill('PARTIAL')} Local demo is usable. Production cloud, auth, billing, and live domain verification remain launch blockers.</p></aside>
    </section>
    <section class="grid three">
      <article class="card"><h3>Local demo mode</h3><p>No account or API key. Stories save to this browser only.</p></article>
      <article class="card"><h3>Parent-first controls</h3><p>Demo safety language is visible, conservative, and honest about limits.</p></article>
      <article class="card"><h3>URAI integration path</h3><p>Shared auth, analytics, admin, privacy, and content libraries are documented as future integrations until wired and verified.</p></article>
    </section>`
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

function pricing() {
  page(
    'Pricing',
    `<section class="card"><h1>Pricing</h1><p class="notice">Billing is not connected in this build. Paid tiers are launch-contract placeholders and must not be sold until backend enforcement and payment flows are verified.</p>
    <div class="grid three">
      <article class="price"><h2>Free Demo</h2><p class="price-tag">$0</p><p>Local browser stories, no account, no cloud sync.</p><a class="btn" href="#create">Use demo</a></article>
      <article class="price"><h2>Family Pro</h2><p class="price-tag">TBD</p><p>Planned: accounts, family library, child profiles, cloud sync.</p><button disabled>Not launched</button></article>
      <article class="price"><h2>Schools / Enterprise</h2><p class="price-tag">Contact</p><p>Planned: admin controls, safety review, organization policies.</p><a class="btn secondary" href="#contact">Contact</a></article>
    </div></section>`
  );
}

function demo() {
  page('Demo', `<section class="card"><h1>Demo</h1><p>The live demo runs entirely in your browser. No story text is sent to a server by this build.</p><a class="btn" href="#create">Open Create Story</a></section>`);
}

function create() {
  page(
    'Create Story',
    `<form class="card form" id="f"><h1>Create Story</h1><p class="notice">Demo mode only. Avoid entering real names or sensitive personal information.</p>
      <label>Child display name<input class="input" name="childName" required maxlength="32" value="Ari" autocomplete="off"></label>
      <label>Theme<input class="input" name="theme" required maxlength="60" value="Moon Garden" autocomplete="off"></label>
      <div class="row"><label>Mood<select name="mood"><option>gentle</option><option>playful</option><option>brave</option><option>sleepy</option></select></label><label>Narrator<select name="narrator"><option>Mom</option><option>Dad</option><option>Grandparent</option><option>Firefly Guide</option></select></label></div>
      <label>Custom prompt<textarea name="prompt" class="input" rows="3" maxlength="500" placeholder="A calm journey about friendship"></textarea></label>
      <button class="btn">Generate Story</button><p id="err" role="alert"></p>
    </form>`
  );
  document.getElementById('f').onsubmit = (event) => {
    event.preventDefault();
    const fd = Object.fromEntries(new FormData(event.target));
    const precheck = moderatePrompt(Object.values(fd).join(' '));
    if (!precheck.safe) {
      document.getElementById('err').textContent = `Please revise unsafe terms: ${precheck.hits.join(', ')}`;
      return;
    }
    try {
      const story = generateStory(fd);
      const lib = getLib();
      lib.unshift(story);
      setLib(lib.slice(0, 50));
      location.hash = `#story/${story.id}`;
    } catch (err) {
      document.getElementById('err').textContent = err.message;
    }
  };
}

function library() {
  const lib = getLib();
  if (!lib.length) {
    page('Library', `<div class="card"><h1>Your Library</h1><p>No stories yet. Create your first magical adventure.</p><a href="#create" class="btn">Create</a></div>`);
    return;
  }
  page(
    'Library',
    `<div class="card"><h1>Your Library</h1>${lib
      .map(
        (s) => `<article class="story-row"><div><h2>${escapeHtml(s.title)}</h2><p>${new Date(s.createdAt).toLocaleString()}</p><p>${escapeHtml(s.summary || s.body.slice(0, 110))}...</p></div><div><a class="btn secondary" href="#story/${escapeHtml(s.id)}">Open</a> <button data-del="${escapeHtml(s.id)}">Delete</button></div></article>`
      )
      .join('')}</div>`
  );
  app.querySelectorAll('[data-del]').forEach((button) => {
    button.onclick = () => {
      setLib(getLib().filter((story) => story.id !== button.dataset.del));
      library();
    };
  });
}

function detail(id) {
  const story = getLib().find((entry) => entry.id === id);
  if (!story) {
    page('Story not found', `<div class="card"><h1>Story not found</h1><p>This story exists only in the browser where it was created.</p><a class="btn" href="#library">Back to library</a></div>`);
    return;
  }
  page(
    story.title,
    `<article class="card story-detail"><h1>${escapeHtml(story.title)}</h1><p>${escapeHtml(story.body)}</p><dl><dt>Narrator</dt><dd>${escapeHtml(story.narrator)}</dd><dt>Mood</dt><dd>${escapeHtml(story.mood)}</dd><dt>Safety mode</dt><dd>Local precheck only</dd></dl><button class="btn" id="speak">Play narration</button> <button id="share">Copy</button> <a class="btn secondary" href="#create">Regenerate</a><p id="storyStatus" role="status"></p></article>`
  );
  document.getElementById('speak').onclick = () => {
    const status = document.getElementById('storyStatus');
    if (!('speechSynthesis' in window) || !('SpeechSynthesisUtterance' in window)) {
      status.textContent = 'Narration is not supported in this browser.';
      return;
    }
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(new SpeechSynthesisUtterance(story.body));
  };
  document.getElementById('share').onclick = async () => {
    await navigator.clipboard.writeText(`${story.title}\n\n${story.body}`);
    document.getElementById('storyStatus').textContent = 'Copied story text.';
  };
}

function dashboard() {
  page('Dashboard', `<section class="card"><h1>Dashboard</h1><p>${statusPill('AUTH REQUIRED')} Cloud dashboard is intentionally disabled until shared auth, database rules, and family data models are implemented.</p><a class="btn" href="#create">Use local demo instead</a></section>`);
}

function login() { page('Login', `<section class="card"><h1>Login</h1><p>Login is not launched in this static demo. Use local demo mode or join the waitlist.</p><a class="btn" href="#contact">Join waitlist</a></section>`); }
function signup() { page('Signup', `<section class="card"><h1>Signup</h1><p>Account creation is not launched until auth, billing, and child privacy controls are verified.</p><a class="btn" href="#contact">Join waitlist</a></section>`); }
function about() { page('About', `<section class="card"><h1>About</h1><p>URAI Storytime is a URAI Labs storytelling system. This public build is a standalone local demo with a documented path to production cloud, admin, safety, and URAI ecosystem integration.</p></section>`); }
function contact() { page('Contact', `<section class="card"><h1>Contact</h1><p>Email <a href="mailto:hello@urailabs.com">hello@urailabs.com</a> for pilots, school/enterprise interest, safety questions, or launch access.</p></section>`); }
function privacy() { page('Privacy', `<section class="card"><h1>Privacy Policy</h1><p>This demo stores stories in browser localStorage only. It does not provide cloud accounts, server storage, analytics, or billing in this build.</p><p>Production launch requires a full product-specific privacy policy, deletion/export flow, child/family consent model, and verified data-processing inventory.</p></section>`); }
function terms() { page('Terms', `<section class="card"><h1>Terms of Service</h1><p>This is a demo, not a production service. Do not enter sensitive personal information. Production launch requires legal review before accepting paid users, children, schools, or organizations.</p></section>`); }
function safety() { page('Safety', `<section class="card"><h1>Safety and child privacy</h1><p>${statusPill('DEMO ONLY')} The current safety layer is a conservative prompt precheck and must not be treated as comprehensive moderation.</p><ul><li>No real child data is required.</li><li>Stories remain on the local device.</li><li>Cloud launch requires age bands, parent consent, content review, audit logs, deletion/export, and security rules.</li></ul></section>`); }
function settings() {
  const settings = getSettings();
  page('Parent Settings', `<form class="card form" id="settingsForm"><h1>Parent Settings</h1><label><input type="checkbox" name="shareAnalytics" ${settings.shareAnalytics ? 'checked' : ''}> Share anonymous product analytics when cloud mode launches</label><label><input type="checkbox" name="demoOnly" ${settings.demoOnly ? 'checked' : ''}> Keep this browser in demo-only mode</label><button class="btn">Save settings</button><p id="settingsStatus" role="status"></p></form>`);
  document.getElementById('settingsForm').onsubmit = (event) => {
    event.preventDefault();
    const fd = new FormData(event.target);
    setSettings({ shareAnalytics: fd.has('shareAnalytics'), demoOnly: fd.has('demoOnly') });
    document.getElementById('settingsStatus').textContent = 'Settings saved locally.';
  };
}
function admin() { page('Admin', `<section class="card"><h1>Admin</h1><p>${statusPill('PROTECTED FUTURE ROUTE')} Admin/moderation requires verified role claims, audit logs, and security rules before launch.</p></section>`); }
function creator() { page('Creator', `<section class="card"><h1>Creator</h1><p>${statusPill('POST-LAUNCH')} Creator publishing is roadmap-only in this build.</p></section>`); }
function notFound() { page('Page not found', `<section class="card"><h1>404</h1><p>That page does not exist.</p><a class="btn" href="#home">Go home</a></section>`); }

window.addEventListener('hashchange', route);
route();
