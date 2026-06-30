import { existsSync, readFileSync } from 'node:fs';

const required = ['firebase.json'];
const ruleFiles = ['firestore.rules', 'storage.rules'];
const missing = [];

for (const file of required) {
  if (!existsSync(file)) missing.push(file);
}

const presentRuleFiles = ruleFiles.filter((file) => existsSync(file));
if (presentRuleFiles.length === 0) {
  missing.push('firestore.rules or storage.rules');
}

if (missing.length) {
  console.error(`Security rules validation failed. Missing: ${missing.join(', ')}`);
  process.exit(1);
}

for (const file of presentRuleFiles) {
  const text = readFileSync(file, 'utf8');
  if (!text.trim()) {
    console.error(`Security rules validation failed. ${file} is empty.`);
    process.exit(1);
  }
  if (text.includes('allow read, write: if true')) {
    console.error(`Security rules validation failed. ${file} contains public write/read allow-all rule.`);
    process.exit(1);
  }
}

console.log(`Security rules scaffold validated: ${presentRuleFiles.join(', ')}`);
