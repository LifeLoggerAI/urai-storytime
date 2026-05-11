import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';

const base = 'http://127.0.0.1:4173';
const srv = spawn('node', ['scripts/server.mjs'], { stdio: 'ignore' });

async function waitForServer() {
  for (let i = 0; i < 20; i += 1) {
    try {
      const response = await fetch(base);
      if (response.ok) return;
    } catch {
      // retry
    }
    await new Promise((resolve) => setTimeout(resolve, 150));
  }
  throw new Error('server did not start');
}

await waitForServer();

const html = await fetch(base).then((response) => response.text());
const appJs = await fetch(`${base}/app.js`).then((response) => response.text());
const storyEngine = await fetch(`${base}/story-engine.mjs`).then((response) => response.text());
const robots = await fetch(`${base}/robots.txt`).then((response) => response.text());
const sitemapStatus = await fetch(`${base}/sitemap.xml`).then((response) => response.status);
const notFound = await fetch(`${base}/missing`).then((response) => response.status);

test('home shell loads launch metadata', () => {
  assert.match(html, /URAI Storytime/);
  assert.match(html, /og:title/);
  assert.match(html, /#pricing/);
  assert.match(html, /#privacy/);
});

test('public route handlers exist', () => {
  for (const route of ['features', 'pricing', 'demo', 'privacy', 'terms', 'safety', 'dashboard', 'login', 'signup', 'admin']) {
    assert.match(appJs, new RegExp(`${route}\\(`));
  }
});

test('story engine keeps local demo safety metadata', () => {
  assert.match(storyEngine, /local-demo-template/);
  assert.match(storyEngine, /safetyMode/);
  assert.match(storyEngine, /self-harm/);
});

test('seo helper files load', () => {
  assert.match(robots, /Sitemap: https:\/\/www\.uraistorytime\.com\/sitemap\.xml/);
  assert.equal(sitemapStatus, 200);
});

test('404 works', () => assert.equal(notFound, 404));

srv.kill();
