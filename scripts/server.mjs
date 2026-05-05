import http from 'node:http';import fs from 'node:fs';import path from 'node:path';
const root=path.resolve('src'); const port=process.env.PORT||4173;
const mime={'.html':'text/html','.css':'text/css','.js':'text/javascript','.mjs':'text/javascript'};
http.createServer((req,res)=>{let p=req.url==='/'?'/index.html':req.url; const fp=path.join(root,p); if(!fp.startsWith(root)||!fs.existsSync(fp)){res.statusCode=404;res.end('Not found');return;} const ext=path.extname(fp); res.setHeader('Content-Type',mime[ext]||'text/plain');res.end(fs.readFileSync(fp));}).listen(port,()=>console.log(`http://localhost:${port}`));
