import {HELP_COPY, CHECKED_AT} from './legis-help-content.js';
import {makePlan,makeDraft,documentSections,documentText} from './legis-help-core.js';

const lang=document.documentElement.lang,t=HELP_COPY[lang]||HELP_COPY.fr;
const el=id=>document.getElementById('help-'+id);
const form=el('form');
const esc=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let plan=null,prepared=new Set(),downloadUrl=null;
const read=()=>({lang,jurisdiction:el('country').value,category:form.querySelector('input[name="topic"]:checked')?.value,flags:[...form.querySelectorAll('input[name="priority"]:checked')].map(i=>i.value),facts:el('facts').value,timeline:el('timeline').value,goal:el('goal').value,date:el('date').value});
const resourceCard=(s,i)=>`<article class="help-contact ${i===0?'help-contact-first':''}"><p class="help-label">${i===0?esc(t.first):esc(s.publisher)}</p><h4>${esc(s.name[lang])}</h4><p>${esc(s.text[lang])}</p><a class="help-outbound" href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.action[lang])}<span aria-hidden="true">↗</span><span class="help-sr"> (${esc(t.external)})</span></a><small>${esc(t.official)}: ${esc(s.publisher)} · ${CHECKED_AT}</small></article>`;

function updateHints() {
  const c=read(),inFrance=c.jurisdiction==='fr';
  el('date-row').hidden=!c.flags.includes('deadline');
  // Never keep an invisible date active after the deadline choice is removed.
  if(el('date-row').hidden)el('date').value='';
  el('outside-hint').hidden=inFrance;
  el('safety').hidden=!(inFrance&&c.flags.includes('violence'));
}
function invalidate() {
  const hadPlan=Boolean(plan);
  plan=null;prepared.clear();el('result').hidden=true;el('empty').hidden=false;
  el('contacts').replaceChildren();el('documents').replaceChildren();el('questions').replaceChildren();el('actions').replaceChildren();el('summary').replaceChildren();el('priorities').replaceChildren();
  el('draft').value='';el('print-area').replaceChildren();
  if(downloadUrl){URL.revokeObjectURL(downloadUrl);downloadUrl=null;}
  if(hadPlan)el('message').textContent=t.changed;
  updateHints();
}
function showProgress() {el('progress').textContent=prepared.size+' / '+plan.documents.length+' '+t.done;}
function render() {
  el('empty').hidden=true;el('result').hidden=false;
  el('result-topic').textContent=t.categories[plan.case.category][0];
  el('outside').hidden=plan.inFrance;el('stale').hidden=!plan.needsReview;
  el('priorities').hidden=!plan.priorities.length;
  el('priorities').innerHTML=plan.priorities.length?'<h4>'+esc(t.priority)+'</h4>'+plan.priorities.map(p=>'<p>'+esc(p)+'</p>').join(''):'';
  el('contacts').innerHTML=resourceCard(plan.resources[0],0)+(plan.resources.length>1?`<details class="help-more"><summary>${esc(t.allResources)} (${plan.resources.length})</summary>${plan.resources.slice(1).map((s,i)=>resourceCard(s,i+1)).join('')}</details>`:'');
  el('actions').innerHTML=plan.actions.map(a=>'<li>'+esc(a)+'</li>').join('');
  el('documents').innerHTML=plan.documents.map((d,i)=>`<label class="help-document"><input type="checkbox" data-help-document="${i}"><span>${esc(d)}</span></label>`).join('');
  el('questions').innerHTML=plan.questions.map(q=>'<li>'+esc(q)+'</li>').join('');
  el('summary').innerHTML=[[t.facts,plan.case.facts],[t.timeline,plan.case.timeline],[t.goal,plan.case.goal],...(plan.case.date?[[t.dateRecorded,plan.case.date]]:[])].map(([label,value])=>'<div><dt>'+esc(label)+'</dt><dd>'+esc(value||t.missing)+'</dd></div>').join('');
  el('draft').value=makeDraft(plan);showProgress();
  el('message').textContent=t.ready;
  el('result-title').focus({preventScroll:true});
  el('result').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});
}
form.addEventListener('input',invalidate);
form.addEventListener('change',invalidate);
form.addEventListener('submit',event=>{
  event.preventDefault();
  if(!read().category){el('message').textContent=t.needCategory;form.querySelector('input[name="topic"]').focus();return;}
  prepared=new Set();plan=makePlan(read());render();
});
el('reset').addEventListener('click',()=>{
  form.reset();invalidate();el('message').textContent=t.cleared;el('country').focus({preventScroll:true});
});
el('documents').addEventListener('change',event=>{
  if(!plan||!event.target.matches('[data-help-document]'))return;
  const i=Number(event.target.dataset.helpDocument);if(event.target.checked)prepared.add(i);else prepared.delete(i);showProgress();
});
el('download').addEventListener('click',()=>{
  if(!plan)return;
  try {
    if(downloadUrl)URL.revokeObjectURL(downloadUrl);
    downloadUrl=URL.createObjectURL(new Blob([documentText(plan,prepared,el('draft').value)],{type:'text/plain;charset=utf-8'}));
    const a=document.createElement('a');a.href=downloadUrl;a.download='LEGIS-'+lang+'-fiche.txt';a.hidden=true;document.body.append(a);a.click();a.remove();el('message').textContent=t.downloaded;
  }catch{el('message').textContent=t.downloadError;}
});
el('print').addEventListener('click',()=>{
  if(!plan)return;
  const sections=documentSections(plan,prepared,el('draft').value);
  el('print-area').innerHTML=sections.map((s,i)=>`<section><${i===0?'h1':'h2'}>${esc(s.title)}</${i===0?'h1':'h2'}>${s.lines.map(l=>'<p>'+esc(l)+'</p>').join('')}</section>`).join('');
  try{window.print();}catch{el('message').textContent=t.printError;}
});
// No URL/query import, storage, analytics, API calls or AI processing of a case.
el('prepare').disabled=false;updateHints();
