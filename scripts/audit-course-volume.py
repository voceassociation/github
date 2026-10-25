"""Fail closed on VOCE's 75,000-character lesson requirement; never certify quality."""
from pathlib import Path
from html.parser import HTMLParser
import argparse, json, re, sys

ROOT = Path(__file__).resolve().parents[1]
VOID = {'area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr'}
class Counter(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.stack=[]; self.article=[]; self.lesson=[]; self.marked=False
    def handle_starttag(self, tag, attrs):
        attrs=dict(attrs)
        parent=self.stack[-1][1:] if self.stack else (False,False,False)
        article=parent[0] or tag=='article'
        lesson=parent[1] or attrs.get('data-voce-count')=='lesson'
        hidden=parent[2] or tag in {'script','style','nav','header','footer'} or 'hidden' in attrs
        if article and attrs.get('data-voce-count')=='lesson': self.marked=True
        if tag not in VOID: self.stack.append((tag,article,lesson,hidden))
    def handle_endtag(self, tag):
        for i in range(len(self.stack)-1,-1,-1):
            if self.stack[i][0]==tag:
                del self.stack[i:]; break
    def handle_data(self, data):
        if not self.stack: return
        _,article,lesson,hidden=self.stack[-1]
        if article and not hidden:
            self.article.append(data)
            if lesson:self.lesson.append(data)
    def counts(self):
        normalize=lambda chunks: len(re.sub(r'\s+', ' ', ' '.join(chunks)).strip())
        return normalize(self.article),normalize(self.lesson)

def audit(root):
    records=json.loads((root/'data/voce-vclf-public.json').read_text())['courses']
    rows=[]
    for c in records:
        path=root/(c['url'].split('https://voce.life/',1)[1]+'.html')
        if not path.exists():
            rows.append({'id':c['id'],'status':'missing_page'});continue
        parser=Counter();parser.feed(path.read_text())
        total,lesson=parser.counts()
        status=('below_minimum_even_with_extras' if total<75000 else
                'unsegmented_requires_review' if not parser.marked else
                'lesson_below_minimum' if lesson<75000 else 'volume_only_pass')
        rows.append({'id':c['id'],'url':c['url'],'article_characters_including_extras':total,
                     'marked_lesson_characters':lesson if parser.marked else None,'status':status})
    return {'minimum_lesson_characters':75000,'quality_validated':False,'courses':rows}

if __name__=='__main__':
    args=argparse.ArgumentParser();args.add_argument('--report',type=Path);opts=args.parse_args()
    result=audit(ROOT)
    if opts.report:opts.report.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
    counts={}
    for row in result['courses']: counts[row['status']]=counts.get(row['status'],0)+1
    print(json.dumps({'courses':len(result['courses']),'statuses':counts,'quality_validated':False}))
    sys.exit(0 if all(r['status']=='volume_only_pass' for r in result['courses']) else 1)
