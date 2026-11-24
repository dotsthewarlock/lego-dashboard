import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {createHash,timingSafeEqual} from 'node:crypto';
import {FixtureProvider,BricksetProvider} from './dist/provider.js';
import {DiagnosticError} from './dist/domain.js';
const mode=process.env.DIAGNOSTIC_MODE??'fixture';
if(!['fixture','live'].includes(mode))throw Error('Unknown mode');
const password=process.env.DIAGNOSTIC_PASSWORD??'';
if(mode==='live'&&password.length<24)throw Error('Live preview requires a separate strong preview password (24+ characters).');
const digest=v=>createHash('sha256').update(v).digest();
const allowed=req=>mode==='fixture'||timingSafeEqual(digest(req.headers.authorization??''),digest('Basic '+Buffer.from('owner:'+password).toString('base64')));
const provider=mode==='fixture'?new FixtureProvider():new BricksetProvider({apiKey:process.env.BRICKSET_API_KEY??'',userHash:process.env.BRICKSET_USER_HASH??'',permissionConfirmed:process.env.BRICKSET_PERMISSION_CONFIRMED==='yes',remainingCalls:Number(process.env.BRICKSET_REMAINING_CALLS),year:Number(process.env.BRICKSET_SAMPLE_YEAR??2025)});
// One explicitly initiated diagnostic per process; no refresh from browser or polling.
let result;try{result={status:'success',snapshot:await provider.snapshot()};}catch(e){result={status:'error',mode,code:e instanceof DiagnosticError?e.code:'upstream'};}
const files=new Map([['/',['index.html','text/html; charset=utf-8']],['/app.js',['app.js','text/javascript; charset=utf-8']],['/style.css',['style.css','text/css; charset=utf-8']]]);
const server=http.createServer(async(req,res)=>{
  res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','no-referrer');res.setHeader('Content-Security-Policy',"default-src 'none'; script-src 'self'; style-src 'self'; connect-src 'self'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'");
  if(!allowed(req)){res.writeHead(401,{'WWW-Authenticate':'Basic realm="Private diagnostic", charset="UTF-8"'});return res.end('Unauthorized');}
  if(req.method!=='GET'){res.writeHead(405,{'Allow':'GET'});return res.end('Read-only');}
  if(req.url==='/api/diagnostic'){res.writeHead(result.status==='success'?200:503,{'Content-Type':'application/json'});return res.end(JSON.stringify(result));}
  const f=files.get(req.url);if(!f){res.writeHead(404);return res.end('Not found');}
  try{const data=await readFile(new URL('./public/'+f[0],import.meta.url));res.writeHead(200,{'Content-Type':f[1]});res.end(data);}catch{res.writeHead(500);res.end('Preview unavailable');}
});
server.listen(Number(process.env.PORT??3000),'127.0.0.1',()=>console.log(`Compatibility preview (${mode}); loopback port ${server.address().port} (http://127.0.0.1:${server.address().port})`));
