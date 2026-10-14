import {LEGIS_VERSION,MODEL_IDS,MAX_OUTPUT_TOKENS,normalizeInput,selectSources,sourcesAreFresh,buildMessages,outputSchema,parseModelResult,validateNote,tokenUsage,quotaStatements} from './legis-core.js';

const HEADERS={'cache-control':'private, no-store','x-robots-tag':'noindex, nofollow, noarchive','x-content-type-options':'nosniff','referrer-policy':'no-referrer'};
const LIMIT=18000;
const ERROR_STATUS={invalid_input:400,invalid_json:400,clause_required:400,consent_required:400,outside_scope:422,forbidden_origin:403,body_too_large:413,quota_reached:429,sources_stale:503,service_unavailable:503,invalid_model_output:502,unsupported_reference:502,unsupported_conclusion:502};
function json(value,status=200,extra={}) {return Response.json(value,{status,headers:{...HEADERS,...extra}});}

async function limitedText(request, limit=LIMIT) {
  if (Number(request.headers.get('content-length')||0)>limit) throw new Error('body_too_large');
  if (!request.body) return '';
  const reader=request.body.getReader(),chunks=[];let length=0;
  try {
    while (true) {const {done,value}=await reader.read();if(done)break;length+=value.byteLength;if(length>limit){await reader.cancel();throw new Error('body_too_large');}chunks.push(value);}
  } finally {reader.releaseLock();}
  const bytes=new Uint8Array(length);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}
  return new TextDecoder().decode(bytes);
}

async function loadCatalog(env) {
  const response=await env.ASSETS.fetch(new Request('https://voce.life/data/legis-sources.json'));
  if (!response.ok) throw new Error('service_unavailable');
  const catalog=JSON.parse(await limitedText(response,60000));
  if(!Array.isArray(catalog.sources) || !Array.isArray(catalog.checks)) throw new Error('service_unavailable');
  return catalog;
}

async function reserve(env,request,units) {
  if(!env.LEGIS_DB || !env.LEGIS_QUOTA_SALT)throw new Error('service_unavailable');
  const day=new Date().toISOString().slice(0,10),now=Math.floor(Date.now()/1000);
  const address=request.headers.get('cf-connecting-ip');
  if(!address)throw new Error('service_unavailable');
  const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(env.LEGIS_QUOTA_SALT),{name:'HMAC',hash:'SHA-256'},false,['sign']);
  const digest=await crypto.subtle.sign('HMAC',key,new TextEncoder().encode(day+':'+address));
  const client=[...new Uint8Array(digest)].map(b=>b.toString(16).padStart(2,'0')).join('');
  const result=await env.LEGIS_DB.batch(quotaStatements(env.LEGIS_DB,{id:crypto.randomUUID(),day,client,units,now}));
  if(result[1]?.meta?.changes!==1)throw new Error('quota_reached');
  return day;
}

async function saveMetrics(env,day,reads,failed) {
  const input=reads.reduce((sum,r)=>sum+r.usage.input_tokens,0),output=reads.reduce((sum,r)=>sum+r.usage.output_tokens,0),neurons=reads.reduce((sum,r)=>sum+r.usage.neurons,0);
  await env.LEGIS_DB.batch([
    env.LEGIS_DB.prepare(`INSERT INTO metrics(day,requests,completions,failures,input_tokens,output_tokens,neurons) VALUES(?,1,?,?,?,?,?) ON CONFLICT(day) DO UPDATE SET requests=requests+1,completions=completions+excluded.completions,failures=failures+excluded.failures,input_tokens=input_tokens+excluded.input_tokens,output_tokens=output_tokens+excluded.output_tokens,neurons=neurons+excluded.neurons`).bind(day,reads.filter(r=>r.note).length,failed,input,output,neurons),
    env.LEGIS_DB.prepare('DELETE FROM metrics WHERE day < ?').bind(new Date(Date.now()-60*86400000).toISOString().slice(0,10))
  ]);
}

export async function handleLegis(request,env,ctx) {
  const path=new URL(request.url).pathname.replace(/\/+$/,'');
  try {
    if(path==='/api/legis/status') {
      if(request.method!=='GET')return json({error:'method_not_allowed'},405,{allow:'GET'});
      const catalog=await loadCatalog(env),fresh=sourcesAreFresh(catalog.sources);
      let database=false;
      if(env.LEGIS_DB) {try{await env.LEGIS_DB.prepare('SELECT day FROM metrics LIMIT 1').all();database=true;}catch{}}
      const enabled=fresh && database && Boolean(env.AI && env.LEGIS_QUOTA_SALT);
      return json({version:LEGIS_VERSION,status:enabled?'ready':'limited',scope:'France / EU: ticketing contracts, processors and procurement definitions',source_mode:'curated_official_sources',source_count:catalog.sources.length,checked_at:catalog.checked_at,live_legifrance_api:false,models:Object.values(MODEL_IDS),daily_generation_limit:60,per_network_daily_limit:8},enabled?200:503);
    }
    if(path!=='/api/legis/analyse')return json({error:'not_found'},404);
    if(request.method!=='POST')return json({error:'method_not_allowed'},405,{allow:'POST'});
    const origin=request.headers.get('origin');
    if(origin!=='https://voce.life' && origin!=='https://www.voce.life')throw new Error('forbidden_origin');
    if(request.headers.get('sec-fetch-site')==='cross-site')throw new Error('forbidden_origin');
    if(!(request.headers.get('content-type')||'').toLowerCase().startsWith('application/json'))throw new Error('invalid_json');
    let body;try {body=JSON.parse(await limitedText(request));}catch(error){if(error.message==='body_too_large')throw error;throw new Error('invalid_json');}
    const input=normalizeInput(body),catalog=await loadCatalog(env),sources=selectSources(catalog,input);
    if(!sourcesAreFresh(sources))throw new Error('sources_stale');
    if(!env.AI)throw new Error('service_unavailable');
    const models=input.model==='compare'?['qwen','glm']:[input.model];
    const day=await reserve(env,request,models.length);
    const messages=buildMessages(input,sources),reads=[];
    for(const model of models) {
      let result;
      try {
        const parameters={messages,max_tokens:MAX_OUTPUT_TOKENS,temperature:0.2,response_format:{type:'json_schema',json_schema:outputSchema(sources)}};
        if(model==='glm')parameters.chat_template_kwargs={enable_thinking:false};
        result=await env.AI.run(MODEL_IDS[model],parameters);
        const note=validateNote(parseModelResult(result),sources);
        reads.push({model:MODEL_IDS[model],note,usage:tokenUsage(result)});
      } catch(error) {
        const code=['invalid_model_output','unsupported_reference','unsupported_conclusion'].includes(error.message)?error.message:'model_unavailable';
        reads.push({model:MODEL_IDS[model],error:code,usage:tokenUsage(result)});
      }
    }
    const failed=reads.filter(r=>r.error).length;
    ctx.waitUntil(saveMetrics(env,day,reads,failed).catch(()=>{}));
    if(reads.every(r=>r.error))return json({error:reads[0].error,version:LEGIS_VERSION},502);
    return json({version:LEGIS_VERSION,status:failed?'partial':'complete',jurisdiction:'fr-eu',source_mode:'curated_official_sources',checked_at:catalog.checked_at,generated_at:new Date().toISOString(),reads,sources:sources.map(({id,topic,reference,articles,checked_at,publisher,url,title})=>({id,topic,reference,articles,checked_at,publisher,url,title}))});
  } catch(error) {
    const code=Object.hasOwn(ERROR_STATUS,error.message)?error.message:'service_unavailable';
    return json({error:code},ERROR_STATUS[code],code==='quota_reached'?{'retry-after':String(Math.ceil((Date.parse(new Date().toISOString().slice(0,10)+'T00:00:00Z')+86400000-Date.now())/1000))}:{});
  }
}
