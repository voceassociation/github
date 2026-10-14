import {COPY} from './legis-copy.js';
import {localChecklist,selectSources,sourcesAreFresh} from './legis-core.js';

const lang=document.documentElement.lang,t=COPY[lang] || COPY.en;
const el=id=>document.getElementById('legis-'+id);
const form=el('form'),message=el('message');
let catalog=null,snapshot=null,readings=null,progress={},busy=false;
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function notice(text='',error=false){message.textContent=text;message.classList.toggle('error',error);}
function input(){return {lang,workflow:el('workflow').value,institution:el('institution').value,jurisdiction:'fr-eu',question:el('question').value.trim(),clause:el('clause').value.trim(),model:el('model').value,consent:el('consent').checked};}
function sourceLink(id){const s=catalog.sources.find(s=>s.id===id);return s?`<a href="#source-${esc(s.id)}">${esc(s.reference)}</a>`:'';}
function checkLabel(check){return check.type==='legal'?t.legal:t.contractual;}
function scrollToWorkshop(){document.getElementById('workshop').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});}

function invalidate(){snapshot=null;readings=null;progress={};el('result').hidden=true;el('empty').hidden=false;el('readings').replaceChildren();el('consent').checked=false;el('analyse').disabled=true;notice();}
form.addEventListener('input',invalidate);
form.addEventListener('change',()=>{invalidate();el('clause').required=el('workflow').value==='clauses';});
document.querySelectorAll('[data-legis-example]').forEach(button=>button.addEventListener('click',()=>{if(busy)return;invalidate();el('workflow').value='ticketing';el('institution').value='unknown';el('question').value=t.demoQuestion;el('clause').value=t.demoClause;el('clause').required=false;scrollToWorkshop();el('question').focus({preventScroll:true});}));
el('clear').addEventListener('click',()=>{if(busy)return;form.reset();el('clause').required=false;el('model').value='glm';invalidate();el('question').focus();});

form.addEventListener('submit',event=>{
  event.preventDefault();if(busy||!catalog||!form.reportValidity())return;
  const data=input();
  if(data.question.length<8){notice(t.errors.invalid_input,true);return;}
  if(data.workflow==='clauses' && data.clause.length<20){notice(t.clauseRequired,true);el('clause').focus();return;}
  snapshot={...data,consent:false};readings=null;progress={};
  const checks=localChecklist(catalog,snapshot);
  el('grid').innerHTML=`<p class="legis-grid-intro">${esc(t.gridLead)}</p>`+checks.map((c,i)=>`<article class="legis-check"><h4>${String(i+1).padStart(2,'0')} · ${esc(c.title[lang])}</h4><p>${esc(c.question[lang])}</p><div class="legis-check-meta"><span>${esc(checkLabel(c))}</span><label class="legis-sr" for="progress-${c.id}">${esc(c.title[lang])}</label><select id="progress-${c.id}" data-legis-progress="${c.id}">${t.progress.map((s,n)=>`<option value="${n}">${esc(s)}</option>`).join('')}</select></div><div class="legis-reference-links">${c.source_ids.map(sourceLink).join('')}</div></article>`).join('');
  el('readings').replaceChildren();el('empty').hidden=true;el('result').hidden=false;el('analyse').disabled=false;el('consent').checked=false;notice();
});
el('grid').addEventListener('change',event=>{const id=event.target.dataset.legisProgress;if(id)progress[id]=Number(event.target.value);});

function renderReadings(){
  const reads=readings?.reads || [];
  el('readings').innerHTML=(readings?.status==='partial'?`<p class="legis-message">${esc(t.partial)}</p>`:'')+reads.map(read=>{
    const name=read.model.includes('/qwen/')?'Qwen3-30B-A3B':'GLM-4.7-Flash';
    if(read.error)return `<article class="legis-reading"><h3>${name}</h3><p>${esc(t.errors[read.error]||t.errors.service_unavailable)}</p></article>`;
    const n=read.note;
    return `<article class="legis-reading"><h3>${name}</h3><p>${esc(n.summary)}</p><h4>${esc(t.observations)}</h4>${n.issues.map(issue=>`<div><h5>${esc(issue.title)}</h5><p>${esc(issue.observation)}</p><div class="legis-reference-links">${issue.source_ids.map(sourceLink).join('')}</div></div>`).join('')}<h4>${esc(t.questions)}</h4><ul>${n.questions.map(q=>`<li>${esc(q)}</li>`).join('')}</ul><h4>${esc(t.limits)}</h4><ul>${n.limits.map(q=>`<li>${esc(q)}</li>`).join('')}</ul><p class="legis-trace">${esc(t.trace)}</p><p class="legis-usage">${esc(readings.generated_at)} · ${read.usage.input_tokens+read.usage.output_tokens} tokens</p></article>`;
  }).join('');
}

el('analyse').addEventListener('click',async()=>{
  if(busy)return;if(!snapshot){notice(t.needGrid,true);return;}if(!el('consent').checked){notice(t.needConsent,true);el('consent').focus();return;}
  if(!sourcesAreFresh(selectSources(catalog,snapshot))){notice(t.errors.sources_stale,true);return;}
  busy=true;notice(t.analysing);el('analyse').textContent=t.analysing;
  const controls=[...form.querySelectorAll('input,textarea,select,button'),el('model'),el('consent'),el('analyse')];controls.forEach(c=>c.disabled=true);
  el('readings').replaceChildren();readings=null;
  const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),100000);
  try{
    const response=await fetch('/api/legis/analyse',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({...snapshot,model:el('model').value,consent:true}),signal:controller.signal});
    const data=await response.json();if(!response.ok)throw new Error(data.error||'service_unavailable');
    readings=data;renderReadings();notice();
  }catch(error){notice(t.errors[error.message]||t.errors.network,true);}
  finally{clearTimeout(timeout);busy=false;controls.forEach(c=>c.disabled=false);el('analyse').textContent=t.analyse;el('consent').checked=false;}
});

function textNote(){
  const checks=localChecklist(catalog,snapshot),lines=['VOCE · LEGIS 0.1',t.noteTitle,t.noteLabel,new Date().toISOString(),'',t.jurisdictionValue,t.workflow+': '+t.flows[['ticketing','data','clauses'].indexOf(snapshot.workflow)],t.institution+': '+t.statuses[['unknown','public','private'].indexOf(snapshot.institution)],t.statusNote,'',t.question+':',snapshot.question];
  if(snapshot.clause)lines.push('',t.clause+':',snapshot.clause);
  lines.push('',t.gridTitle);
  checks.forEach((c,i)=>lines.push('',String(i+1).padStart(2,'0')+'. '+c.title[lang],checkLabel(c),c.question[lang],t.progress[progress[c.id]||0],...c.source_ids.map(id=>{const s=catalog.sources.find(s=>s.id===id);return s.reference+' · '+s.url;})));
  for(const read of readings?.reads||[]){lines.push('',read.model);if(read.error){lines.push(t.errors[read.error]||t.errors.service_unavailable);continue;}const n=read.note;lines.push(n.summary,'',t.observations);for(const issue of n.issues)lines.push('',issue.title,issue.observation,...issue.source_ids.map(id=>catalog.sources.find(s=>s.id===id)?.reference));lines.push('',t.questions,...n.questions.map(s=>'- '+s),'',t.limits,...n.limits.map(s=>'- '+s),t.trace);}
  lines.push('',t.sourcesTitle,t.sourcesLead);selectSources(catalog,snapshot).forEach(s=>lines.push('',s.reference,s.url,t.checked+': '+s.checked_at));
  return lines.join('\n');
}
el('export').addEventListener('click',()=>{if(!snapshot)return;const blob=new Blob([textNote()],{type:'text/plain;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='VOCE_LEGIS_'+lang+'_'+new Date().toISOString().slice(0,10)+'.txt';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);notice(t.copied);});
el('print').addEventListener('click',()=>{if(!snapshot)return;const content=textNote().split('\n').map(line=>line?`<p>${esc(line)}</p>`:'<br>').join('');el('print-area').innerHTML=`<h1>VOCE · LEGIS</h1><h2>${esc(t.noteTitle)}</h2>${content}`;window.print();});
window.addEventListener('afterprint',()=>el('print-area').replaceChildren());

async function init(){
  try{const response=await fetch('/data/legis-sources.json',{cache:'no-cache'});if(!response.ok)throw new Error();catalog=await response.json();el('prepare').disabled=false;}
  catch{notice(t.errors.service_unavailable,true);return;}
  try{const response=await fetch('/api/legis/status');el('service').textContent=response.ok?t.ready:t.limited;}
  catch{el('service').textContent=t.limited;}
}
init();
