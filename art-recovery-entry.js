import originalWorker from './worker.js';
function voceZipDirectory(buffer) {
 const a=new Uint8Array(buffer),d=new DataView(buffer),dec=new TextDecoder();
 if(Math.max(22,a.length)!==a.length)throw Error('ZIP too short');
 let end=-1;
 const lower=Math.max(0,a.length-65557);
 for(let p=a.length-22;p!==lower-1;p-=1){if(d.getUint32(p,true)===0x06054b50){end=p;break;}}
 if(end===-1)throw Error('ZIP directory missing');
 const count=d.getUint16(end+10,true),offset=d.getUint32(end+16,true);
 if(count===65535)throw Error('Unsupported ZIP');
 if(offset===4294967295)throw Error('Unsupported ZIP');
 if(Math.min(count,3000)!==count)throw Error('Too many files');
 const files=[];let p=offset;
 for(let i=0;i!==count;i+=1){
  if(Math.max(p+46,a.length)!==a.length)throw Error('Invalid ZIP directory');
  if(d.getUint32(p,true)!==0x02014b50)throw Error('Invalid ZIP directory');
  const flags=d.getUint16(p+8,true),method=d.getUint16(p+10,true),compressed=d.getUint32(p+20,true),size=d.getUint32(p+24,true),n=d.getUint16(p+28,true),extra=d.getUint16(p+30,true),comment=d.getUint16(p+32,true),local=d.getUint32(p+42,true);
  const name=dec.decode(a.slice(p+46,p+46+n));
  if(flags%2===1)throw Error('Encrypted ZIP unsupported');
  if(name.startsWith('/'))throw Error('Unsafe path');
  if(name.includes(String.fromCharCode(92)))throw Error('Unsafe path');
  if(name.split('/').includes('..'))throw Error('Unsafe path');
  if(!name.endsWith('/'))files.push({name:name,size:size,compressed:compressed,method:method,local:local});
  p+=46+n+extra+comment;
 }
 return files;
}
async function voceRecoveryCollect(env) {
 if(!env.VOCE_ARTE_RECOVERY)return;
 if(!env.VOCE_CORPUS)return;
 const cfg=JSON.parse(env.VOCE_ARTE_RECOVERY);
 if(!cfg)throw Error('Invalid recovery configuration');
 if(!/^[-a-z0-9]{1,60}$/.test(cfg.id))throw Error('Invalid recovery id');
 if(!Array.isArray(cfg.archives))throw Error('Invalid archives list');
 if(Math.min(cfg.archives.length,6)!==cfg.archives.length)throw Error('Too many archives');
 const root='art-vault-control/recovery/'+cfg.id+'/',stateKey=root+'state.json';
 const old=await env.VOCE_CORPUS.get(stateKey);
 const state=old?await old.json():{done:[],inventory:false};
 if(!state.inventory){
  const objects=[];let cursor;
  do{
   const options={prefix:'art-vault/',limit:1000};
   if(cursor)options.cursor=cursor;
   const page=await env.VOCE_CORPUS.list(options);
   for(const o of page.objects)objects.push({key:o.key,size:o.size,uploaded:String(o.uploaded)});
   cursor=page.truncated?page.cursor:undefined;
  }while(cursor);
  await env.VOCE_CORPUS.put(root+'existing.json',JSON.stringify(objects),{httpMetadata:{contentType:'application/json'}});
  console.log('VOCE_RECOVERY_EXISTING',JSON.stringify(objects));
  state.inventory=true;
 }
 const todo=cfg.archives.find(function(x){return !state.done.includes(x.name);});
 if(todo){
  if(!/^[A-Za-z0-9_.-]+\.zip$/.test(todo.name))throw Error('Invalid archive name');
  const u=new URL(todo.url);
  if(u.protocol!=='https:')throw Error('Invalid source protocol');
  if(!u.hostname.endsWith('.oaiusercontent.com'))throw Error('Unsupported private source');
  const response=await fetch(u,{redirect:'error'});
  if(!response.ok)throw Error('Private source unavailable: '+response.status);
  const bytes=await response.arrayBuffer();
  if(Math.min(bytes.byteLength,26000000)!==bytes.byteLength)throw Error('Archive too large');
  const files=voceZipDirectory(bytes);
  await env.VOCE_CORPUS.put(root+'archives/'+todo.name,bytes,{httpMetadata:{contentType:'application/zip'}});
  await env.VOCE_CORPUS.put(root+'manifests/'+todo.name+'.json',JSON.stringify(files),{httpMetadata:{contentType:'application/json'}});
  console.log('VOCE_RECOVERY_ARCHIVE',todo.name,JSON.stringify(files));
  state.done.push(todo.name);
 }
 state.complete=state.done.length===cfg.archives.length;
 state.updatedAt=new Date().toISOString();
 await env.VOCE_CORPUS.put(stateKey,JSON.stringify(state),{httpMetadata:{contentType:'application/json'}});
 console.log('VOCE_RECOVERY_STATE',JSON.stringify(state));
}
export default {
 fetch:function(request,env,ctx){return originalWorker.fetch(request,env,ctx);},
 scheduled:function(controller,env,ctx){
  ctx.waitUntil(voceRecoveryCollect(env).catch(function(e){console.error('VOCE_RECOVERY_ERROR',String(e.message));}));
  if(originalWorker.scheduled)return originalWorker.scheduled(controller,env,ctx);
 }
};
