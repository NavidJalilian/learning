"""integrate.py <ch> — fold plans/ch<ch>.json into the engine's WORLDS/CATALOG and write per-quest briefs.
ids: chapter*100 + k  ('0101' … '1506'); files lessons/<id>-<slug>.html; all added with ready:false."""
import json, re, sys
ENG = '/home/user/learning/lessons/quest-engine.js'
SLUG = {1:'scale-from-zero-to-millions-of-users',2:'back-of-the-envelope-estimation',3:'a-framework-for-system-design-interviews',
 4:'design-a-rate-limiter',5:'design-consistent-hashing',6:'design-a-key-value-store',7:'design-a-unique-id-generator-in-distributed-systems',
 8:'design-a-url-shortener',9:'design-a-web-crawler',10:'design-a-notification-system',11:'design-a-news-feed-system',
 12:'design-a-chat-system',13:'design-a-search-autocomplete-system',14:'design-youtube',15:'design-google-drive'}
TITLE = {1:'Scale From Zero to Millions of Users',2:'Back-of-the-Envelope Estimation',3:'A Framework for System Design Interviews',
 4:'Design a Rate Limiter',5:'Design Consistent Hashing',6:'Design a Key-Value Store',7:'Design a Unique ID Generator',
 8:'Design a URL Shortener',9:'Design a Web Crawler',10:'Design a Notification System',11:'Design a News Feed System',
 12:'Design a Chat System',13:'Design a Search Autocomplete System',14:'Design YouTube',15:'Design Google Drive'}
CHEAT = {1:'ch01-scaling-cheatsheet.html',2:'ch02-estimation-cheatsheet.html',3:'ch03-framework-cheatsheet.html',4:'ch04-rate-limiter-cheatsheet.html',
 5:'ch05-consistent-hashing-cheatsheet.html',7:'ch07-unique-id-cheatsheet.html',8:'ch08-url-shortener-cheatsheet.html',9:'ch09-web-crawler-cheatsheet.html',
 10:'ch10-notification-cheatsheet.html',11:'ch11-news-feed-cheatsheet.html',12:'ch12-chat-cheatsheet.html',13:'ch13-autocomplete-cheatsheet.html',
 14:'ch14-youtube-cheatsheet.html',15:'ch15-google-drive-cheatsheet.html'}
js = lambda v: json.dumps(v, ensure_ascii=False).replace("'", "\\'").strip('"') if isinstance(v, str) else v
def q(s): return "'" + json.dumps(s, ensure_ascii=False)[1:-1].replace("'", "\\'").replace('\\"', '"') + "'"

def parse_block(src, name):
    m = re.search(r'  const %s = \[\n(.*?)\n  \];' % name, src, re.S); return m, m.group(1).split('\n')
def wnum(line): return int(re.search(r"\bw: (\d+)", line).group(1))

def main(ch):
    plan = json.load(open(f'plans/ch{ch}.json'))
    src = open(ENG).read()
    # WORLDS
    m, lines = parse_block(src, 'WORLDS')
    lines = [l for l in lines if wnum(l) != ch]
    lines.append(f"    {{ w: {ch}, t: {q(TITLE[ch])}, name: {q(plan['worldName'])}, slug: '{SLUG[ch]}' }},")
    lines.sort(key=wnum)
    src = src[:m.start(1)] + '\n'.join(lines) + src[m.end(1):]
    # CATALOG
    m, lines = parse_block(src, 'CATALOG')
    lines = [l for l in lines if wnum(l) != ch]
    out = []
    for k, qu in enumerate(plan['quests'], 1):
        qid = f'{ch:02d}{k:02d}'
        f = f"{qid}-{qu['slug']}.html"
        qu.update(id=qid, file=f, world=ch, chapterTitle=TITLE[ch], bookUrl=f'https://bytebytego.com/courses/system-design-interview/{SLUG[ch]}',
                  cheatsheet='../reference/' + CHEAT[ch], prev=None, next=None)
        lines.append(f"    {{ id: '{qid}', w: {ch}, n: {q(qu['n'])}, t: {q(qu['t'])}, d: {q(qu['d'])}, file: '{f}'{', boss: true' if qu.get('boss') else ''}, ready: false }},")
        out.append(qu)
    # stable sort by world keeps within-world order
    lines.sort(key=wnum)
    src = src[:m.start(1)] + '\n'.join(lines) + src[m.end(1):]
    open(ENG, 'w').write(src)
    for i, qu in enumerate(out):
        qu['siblings'] = [{'id': o['id'], 'n': o['n'], 't': o['t'], 'd': o['d']} for o in out]
        json.dump(qu, open(f"plans/quest-{qu['id']}.json", 'w'), ensure_ascii=False, indent=1)
        print(qu['id'], qu['n'], qu['t'], '->', qu['file'], f"({len(qu['stages'])} stages)")

if __name__ == '__main__':
    for a in sys.argv[1:]: main(int(a))
