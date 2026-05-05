import fs from 'node:fs';import path from 'node:path';
fs.rmSync('dist',{recursive:true,force:true});fs.mkdirSync('dist',{recursive:true});
for(const f of fs.readdirSync('src')) fs.copyFileSync(path.join('src',f),path.join('dist',f));
fs.copyFileSync('scripts/server.mjs','dist/server.mjs');console.log('build complete');
