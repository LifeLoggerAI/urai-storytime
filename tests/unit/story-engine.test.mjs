import test from 'node:test';import assert from 'node:assert/strict';import { generateStory, moderatePrompt } from '../../src/story-engine.mjs';

test('moderatePrompt flags unsafe terms',()=>{const r=moderatePrompt('violence and joy');assert.equal(r.safe,false);assert.ok(r.hits.includes('violence'));});
test('generateStory returns structured story',()=>{const s=generateStory({childName:'Ari',theme:'Forest',mood:'gentle',narrator:'Mom',prompt:'friendship'});assert.ok(s.id);assert.match(s.title,/Ari/);});
