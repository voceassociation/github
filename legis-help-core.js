import {HELP_COPY, RESOURCES, CATEGORIES, FLAGS, CHECKED_AT} from './legis-help-content.js';

const clean=(value,max)=>typeof value==='string'?value.replace(/\u0000/g,'').trim().slice(0,max):'';
export function normalizeCase(input={}) {
  const rawDate=clean(input.date,10);
  const date=/^\d{4}-\d{2}-\d{2}$/.test(rawDate)&&Number.isFinite(Date.parse(rawDate))&&new Date(rawDate).toISOString().slice(0,10)===rawDate?rawDate:'';
  return {
    lang:['fr','en','it'].includes(input.lang)?input.lang:'fr',
    jurisdiction:input.jurisdiction==='fr'?'fr':'other',
    category:CATEGORIES.includes(input.category)?input.category:'other',
    flags:[...new Set((Array.isArray(input.flags)?input.flags:[]).filter(f=>FLAGS.includes(f)))],
    facts:clean(input.facts,1600),timeline:clean(input.timeline,1000),goal:clean(input.goal,500),date
  };
}

export function resourcesNeedReview(now=new Date()) {
  const age=(Number(new Date(now))-Date.parse(CHECKED_AT+'T00:00:00Z'))/86400000;
  return !Number.isFinite(age)||age>30||age<0;
}

export function makePlan(input,now=new Date()) {
  const c=normalizeCase(input),t=HELP_COPY[c.lang],inFrance=c.jurisdiction==='fr';
  const initial={housing:['adil','justice'],administration:['france','defender','justice'],work:['work','justice'],debt:['debt','social','justice'],consumer:['consumer','justice'],family:['justice','lawyer'],discrimination:['discrimination','justice'],other:['justice','france']}[c.category];
  let ids=inFrance?[...initial]:['europe'];
  const priorities=[];
  if(inFrance) {
    if(c.flags.includes('violence')) {priorities.push(t.priorityViolence);ids.unshift('victims');}
    if(c.flags.includes('deadline')||c.date)priorities.push(t.priorityDeadline);
    if(c.flags.includes('housing-risk')) {priorities.push(t.priorityHousing);ids.push('adil','social');}
    if(c.flags.includes('essentials')) {priorities.push(t.priorityEssentials);ids.push('social');}
    ids.push('aid','lawyer');
  } else if(c.flags.length||c.date) priorities.push(t.outsideActions[2]);
  ids=[...new Set(ids)];
  return {
    case:c,inFrance,needsReview:resourcesNeedReview(now),priorities,
    resources:ids.map(id=>({id,...RESOURCES[id]})),
    documents:[...t.commonDocs,...t.specificDocs[inFrance?c.category:'other']],
    questions:inFrance?[t.specificQuestions[c.category],...t.commonQuestions]:[...t.commonQuestions],
    actions:inFrance?t.actions:t.outsideActions
  };
}

export function makeDraft(plan) {
  const c=plan.case,t=HELP_COPY[c.lang];
  const parts=[t.draftSubject,t.draftHello,t.draftIntro,c.facts||t.draftPlaceholder];
  if(c.timeline)parts.push(t.timeline+':\n'+c.timeline);
  if(c.goal)parts.push(t.goal+':\n'+c.goal);
  if(c.flags.length||c.date)parts.push(t.draftUrgent+'\n'+c.flags.map(f=>t.flags[f]).join('\n')+(c.date?'\n'+t.dateRecorded+': '+c.date:''));
  parts.push(t.draftAsk,t.draftEnd);
  return parts.join('\n\n');
}

// A shared representation keeps the downloaded and printed sheets consistent.
export function documentSections(plan,prepared=new Set(),draft=makeDraft(plan)) {
  const c=plan.case,t=HELP_COPY[c.lang];
  const sections=[{title:t.resultTitle,lines:['VOCE · LEGIS',t.categories[c.category][0],t.exportWarning,t.scope,t.deadlineNote]}];
  if(!plan.inFrance)sections.push({title:t.outsideTitle,lines:[t.outsideText]});
  if(plan.needsReview)sections.push({title:t.official,lines:[t.stale]});
  if(plan.priorities.length)sections.push({title:t.priority,lines:plan.priorities});
  sections.push({title:t.factsTitle,lines:[t.facts+':\n'+(c.facts||t.missing),t.timeline+':\n'+(c.timeline||t.missing),t.goal+':\n'+(c.goal||t.missing),...(c.date?[t.dateRecorded+': '+c.date]:[])]});
  sections.push({title:t.next,lines:plan.actions.map((v,i)=>(i+1)+'. '+v)});
  sections.push({title:t.first,lines:plan.resources.map(s=>s.name[c.lang]+'\n'+s.text[c.lang]+'\n'+s.url+'\n'+t.sourceDate+': '+CHECKED_AT)});
  sections.push({title:t.documents,lines:[t.documentsHint,...plan.documents.map((d,i)=>(prepared.has(i)?'[x] ':'[ ] ')+d)]});
  sections.push({title:t.questions,lines:plan.questions});
  sections.push({title:t.draftTitle,lines:[t.draftHint,draft]});
  return sections;
}

export function documentText(plan,prepared,draft) {
  return documentSections(plan,prepared,draft).map(s=>s.title+'\n\n'+s.lines.join('\n\n')).join('\n\n────────────────\n\n')+'\n';
}
