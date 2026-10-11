/* Local, on-demand exports. No external rendering service or data transfer. */
const WIDTH=1200,HEIGHT=1500,MARGIN=78;
const PAPER='#fbfaf6',INK='#171917',FOREST='#123e33',LINE='#d9d8d1',MUTED='#6c716d';
const SERIF='"Cormorant Garamond", Georgia, serif',SANS='Inter, Arial, sans-serif';
const LABELS={
  en:{overview:'Overview',detail:'Detailed guide',scope:'Scope and references',evidence:'Evidence states',more:'Full explanations and sources on voce.life',summary:'Overview; detailed steps are available in the PDF.',date:'VOCE editorial summary · 11 October 2026'},
  fr:{overview:'Vue d’ensemble',detail:'Guide détaillé',scope:'Périmètre et références',evidence:'États de preuve',more:'Explications complètes et sources sur voce.life',summary:'Vue d’ensemble; les étapes détaillées sont disponibles dans le PDF.',date:'Synthèse éditoriale VOCE · 11 octobre 2026'},
  it:{overview:'Vista d’insieme',detail:'Guida dettagliata',scope:'Perimetro e riferimenti',evidence:'Stati di evidenza',more:'Spiegazioni complete e fonti su voce.life',summary:'Vista d’insieme; i passaggi dettagliati sono disponibili nel PDF.',date:'Sintesi editoriale VOCE · 11 ottobre 2026'}
};

function font(ctx,size,family=SANS,weight=400){ctx.font=weight+' '+size+'px '+family;}
function wrap(ctx,text,width){
  const lines=[];
  for(const paragraph of String(text).split('\n')){
    let line='';
    for(const word of paragraph.split(/\s+/).filter(Boolean)){
      const next=line?line+' '+word:word;
      if(line && ctx.measureText(next).width>width){lines.push(line);line=word;}
      else line=next;
    }
    lines.push(line);
  }
  return lines;
}
function text(ctx,value,x,y,width,size,lineHeight,family=SANS,color=INK,weight=400){
  font(ctx,size,family,weight);ctx.fillStyle=color;
  const lines=wrap(ctx,value,width);
  lines.forEach((line,i)=>ctx.fillText(line,x,y+i*lineHeight));
  return y+lines.length*lineHeight;
}
function rule(ctx,y){ctx.strokeStyle=LINE;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(MARGIN,y);ctx.lineTo(WIDTH-MARGIN,y);ctx.stroke();}
function canvas(){const c=document.createElement('canvas');c.width=WIDTH;c.height=HEIGHT;const ctx=c.getContext('2d');if(!ctx)throw new Error('Canvas unavailable');ctx.fillStyle=PAPER;ctx.fillRect(0,0,WIDTH,HEIGHT);ctx.textBaseline='top';return {c,ctx};}
function titleEnd(ctx,title,y,size=76){return text(ctx,title,MARGIN,y,WIDTH-MARGIN*2,size,size*1.02,SERIF,FOREST);}
function header(ctx,payload,kicker){
  text(ctx,'VOCE',MARGIN,62,1044,62,68,SERIF,FOREST);
  text(ctx,kicker,MARGIN,155,1044,25,33,SANS,FOREST,500);
  return titleEnd(ctx,payload.copy.title,212);
}
function footer(ctx,payload,page,total){
  const labels=LABELS[payload.lang];rule(ctx,1373);
  text(ctx,labels.date,MARGIN,1392,1044,22,30,SANS,MUTED);
  text(ctx,'voce.life'+(payload.lang==='en'?'':'/'+payload.lang)+'/visual-guides',MARGIN,1437,950,25,32,SANS,FOREST);
  if(total) {font(ctx,23);ctx.fillStyle=MUTED;ctx.textAlign='right';ctx.fillText(page+' / '+total,WIDTH-MARGIN,1437);ctx.textAlign='left';}
}
function number(guide,index){return guide.type==='levels'?'A'+index:String(index+1).padStart(2,'0');}

function overview(payload,page=1,total=0){
  const {c,ctx}=canvas(),copy=payload.copy,labels=LABELS[payload.lang];
  let y=header(ctx,payload,labels.overview)+28;
  y=text(ctx,copy.intro,MARGIN,y,1044,30,41)+34;
  let compact=copy.stages.length>4;
  const rows=copy.stages.map((stage,index)=>({stage,index}));
  // Measure the complete layout before drawing. Never clip a long translation.
  let titleSize=43,bodySize=30,rowGap=compact?10:20;
  function required(){
    let result=0;
    for(const {stage} of rows){font(ctx,titleSize,SERIF);result+=wrap(ctx,stage[0],926).length*titleSize*1.1;
      if(!compact){font(ctx,bodySize);result+=14+wrap(ctx,stage[1],926).length*bodySize*1.32;}
      result+=rowGap+16;
    }
    font(ctx,25);const scope=wrap(ctx,copy.boundary,1044).length*34;
    return result+scope+64+(compact?68:0);
  }
  while(y+required()>1330 && titleSize>35){titleSize-=2;bodySize-=1;rowGap-=1;}
  // A long translation gets an explicitly labelled overview, with the full
  // explanations retained on the following PDF pages and in the HTML guide.
  if(y+required()>1330){compact=true;titleSize=43;rowGap=10;
    while(y+required()>1330 && titleSize>35){titleSize-=2;rowGap-=1;}
  }
  if(y+required()>1330)throw new Error('Overview text exceeds the export area');
  for(const {stage,index} of rows){
    rule(ctx,y);y+=16;
    text(ctx,number(payload.guide,index),MARGIN,y,98,39,46,SERIF,FOREST);
    y=text(ctx,stage[0],196,y,926,titleSize,titleSize*1.1,SERIF,FOREST);
    if(!compact)y=text(ctx,stage[1],196,y+14,926,bodySize,bodySize*1.32);
    y+=rowGap;
  }
  if(compact)y=text(ctx,labels.summary,MARGIN,y+4,1044,25,34,SANS,MUTED)+12;
  y=text(ctx,copy.boundary,MARGIN,y+14,1044,25,34)+16;
  text(ctx,labels.more,MARGIN,y,1044,25,34,SANS,FOREST,500);
  footer(ctx,payload,page,total);
  return c;
}

function stagePage(payload,index,page,total){
  const {c,ctx}=canvas(),stage=payload.copy.stages[index],labels=LABELS[payload.lang];
  let y=header(ctx,payload,labels.detail)+48;
  rule(ctx,y);y+=30;
  y=text(ctx,number(payload.guide,index),MARGIN,y,1044,90,100,SERIF,FOREST)+12;
  y=text(ctx,stage[0],MARGIN,y,1044,68,73,SERIF,FOREST)+32;
  y=text(ctx,stage[1],MARGIN,y,1044,40,56)+38;
  if(stage[2]){
    y=text(ctx,payload.ui.human,MARGIN,y,1044,27,37,SANS,FOREST,500)+18;
    y=text(ctx,stage[2],MARGIN,y,1044,38,53)+28;
  }
  if(y>1330)throw new Error('Stage text exceeds the export area');
  footer(ctx,payload,page,total);return c;
}
function evidencePage(payload,page,total){
  const {c,ctx}=canvas(),labels=LABELS[payload.lang];let y=header(ctx,payload,labels.evidence)+38;
  for(const state of payload.ui.states){rule(ctx,y);y+=16;y=text(ctx,state[0],MARGIN,y,1044,48,55,SERIF,FOREST)+12;y=text(ctx,state[1],MARGIN,y,1044,34,46)+28;}
  if(y>1330)throw new Error('Evidence text exceeds the export area');
  footer(ctx,payload,page,total);return c;
}
function referencePage(payload,page,total){
  const {c,ctx}=canvas(),labels=LABELS[payload.lang];let y=header(ctx,payload,labels.scope)+42;
  y=text(ctx,payload.copy.boundary,MARGIN,y,1044,40,56)+52;rule(ctx,y);y+=32;
  for(const [label] of payload.copy.actions)y=text(ctx,label,MARGIN,y,1044,44,52,SERIF,FOREST)+18;
  y=text(ctx,labels.more,MARGIN,y+28,1044,30,42)+18;
  if(y>1330)throw new Error('References exceed the export area');
  footer(ctx,payload,page,total);return c;
}
function asBlob(c,type){return new Promise((resolve,reject)=>c.toBlob(b=>b?resolve(b):reject(new Error('Image export failed')),type,.94));}

// PDF 1.4: each canvas is a JPEG page with a clickable source URL.
// Byte offsets and stream lengths are measured from encoded bytes, not characters.
export function pdfFromJpegs(jpegs,url){
  const encoder=new TextEncoder(),parts=[],offsets=[0];let length=0;
  const add=value=>{const bytes=typeof value==='string'?encoder.encode(value):value;parts.push(bytes);length+=bytes.length;};
  const object=(id,body,stream)=>{offsets[id]=length;add(id+' 0 obj\n'+body+'\n');if(stream){add('stream\n');add(stream);add('\nendstream\n');}add('endobj\n');};
  const quote=value=>String(value).replace(/[\\()]/g,'\\$&');
  add('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n');
  object(1,'<< /Type /Catalog /Pages 2 0 R >>');
  object(2,'<< /Type /Pages /Count '+jpegs.length+' /Kids ['+jpegs.map((_,i)=>(3+i*4)+' 0 R').join(' ')+'] >>');
  jpegs.forEach((bytes,i)=>{
    const id=3+i*4,commands=encoder.encode('q\n600 0 0 750 0 0 cm\n/Im0 Do\nQ\n');
    object(id,'<< /Type /Page /Parent 2 0 R /MediaBox [0 0 600 750] /Resources << /XObject << /Im0 '+(id+1)+' 0 R >> >> /Contents '+(id+2)+' 0 R /Annots ['+(id+3)+' 0 R] >>');
    object(id+1,'<< /Type /XObject /Subtype /Image /Width 1200 /Height 1500 /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length '+bytes.length+' >>',bytes);
    object(id+2,'<< /Length '+commands.length+' >>',commands);
    object(id+3,'<< /Type /Annot /Subtype /Link /Rect [39 16 561 55] /Border [0 0 0] /A << /S /URI /URI ('+quote(url)+') >> >>');
  });
  const xref=length;add('xref\n0 '+offsets.length+'\n0000000000 65535 f \n');
  for(let i=1;i<offsets.length;i++)add(String(offsets[i]).padStart(10,'0')+' 00000 n \n');
  add('trailer\n<< /Size '+offsets.length+' /Root 1 0 R >>\nstartxref\n'+xref+'\n%%EOF\n');
  return new Blob(parts,{type:'application/pdf'});
}

export async function createExport(payload,format){
  if(!Object.prototype.hasOwnProperty.call(LABELS,payload.lang))throw new Error('Unsupported language');
  if(format!=='png' && format!=='pdf')throw new Error('Unsupported format');
  // Both families already belong to the site. Wait for their normal styles to load.
  await document.fonts.ready;
  await Promise.all([document.fonts.load('400 76px "Cormorant Garamond"'),document.fonts.load('400 40px Inter'),document.fonts.load('500 30px Inter')]);
  if(format==='png')return asBlob(overview(payload),'image/png');
  const count=payload.copy.stages.length+2+(payload.guide.proof?1:0),jpegs=[];
  async function append(c){const blob=await asBlob(c,'image/jpeg');jpegs.push(new Uint8Array(await blob.arrayBuffer()));c.width=1;c.height=1;}
  await append(overview(payload,1,count));
  for(let i=0;i<payload.copy.stages.length;i++)await append(stagePage(payload,i,i+2,count));
  if(payload.guide.proof)await append(evidencePage(payload,count-1,count));
  await append(referencePage(payload,count,count));
  const url='https://voce.life'+(payload.lang==='en'?'':'/'+payload.lang)+'/visual-guides#'+payload.key;
  return pdfFromJpegs(jpegs,url);
}
