"""Selection only: never equate the 20k preservation threshold with quality."""
from html.parser import HTMLParser
from pathlib import Path
import argparse,json,re,subprocess
class Node:
 def __init__(self,tag='',attrs=()):self.tag=tag;self.attrs=dict(attrs);self.children=[]
 def text(self):return ' '.join(x if isinstance(x,str) else x.text() for x in self.children)
 def walk(self):
  yield self
  for x in self.children:
   if isinstance(x,Node):yield from x.walk()
class Parser(HTMLParser):
 def __init__(self):super().__init__();self.root=Node();self.stack=[self.root]
 def handle_starttag(self,t,a):
  n=Node(t,a);self.stack[-1].children.append(n)
  if t not in {'area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr'}:self.stack.append(n)
 def handle_endtag(self,t):
  for i in range(len(self.stack)-1,0,-1):
   if self.stack[i].tag==t:self.stack=self.stack[:i];break
 def handle_data(self,d):self.stack[-1].children.append(d)
def norm(t):return re.sub(r'\s+',' ',t).strip()
def count(html,fragment=False):
 p=Parser();p.feed(html)
 a=p.root if fragment else next((n for n in p.root.walk() if n.tag=='article'),None)
 if a is None:return None
 def clean(n):
  if n.tag in {'nav','script','style','header','footer','aside'} or 'hidden' in n.attrs:return ''
  if n.attrs.get('data-voce-count') in {'references','metadata'}:return ''
  if n.tag=='section':
   h=next((x for x in n.children if isinstance(x,Node) and x.tag in {'h2','h3'}),None)
   if h and re.search(r'bibliograph|références|sources|version et provenance',h.text(),re.I):return ''
  # Administrative eyebrow is not teaching.
  if 'courses-eyebrow' in n.attrs.get('class',''):return ''
  return ' '.join(x if isinstance(x,str) else clean(x) for x in n.children)
 return len(norm(clean(a)))
def audit(main,branch):
 rows=[]
 for c in json.loads((main/'data/voce-vclf-public.json').read_text())['courses']:
  route=c['url'].split('voce.life/')[1]+'.html'
  counts={k:count((p/route).read_text()) if (p/route).exists() else None for k,p in [('main',main),('branch',branch)]}
  directory=branch/'content/courses/engineering'/c['id']
  counts['saved_chapters']=sum(count(f.read_text(),True) for f in sorted(directory.glob('[0-9][0-9]-*.html')))
  rows.append({'id':c['id'],'title':c['title'],'route':route,'counts':counts,'selection':'preserved' if max(v or 0 for v in counts.values())>=20000 else 'eligible'})
 return {'threshold':20000,'quality_validated':False,'method':'Normalized article text excluding reference/source/provenance sections, administrative eyebrow, navigation and non-content tags. Saved numbered chapters measured separately. Versions never summed. Selection only; not strict lesson acceptance.','main_commit':subprocess.check_output(['git','-C',str(main),'rev-parse','HEAD'],text=True).strip(),'courses':rows}
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--main',type=Path,required=True);p.add_argument('--branch',type=Path,default=Path('.'));p.add_argument('--output',type=Path,required=True);a=p.parse_args();r=audit(a.main,a.branch);a.output.write_text(json.dumps(r,ensure_ascii=False,indent=2)+'\n');print({s:sum(x['selection']==s for x in r['courses']) for s in ['preserved','eligible']})
