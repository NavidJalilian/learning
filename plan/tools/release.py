"""release.py <ch> — mark every quest of world <ch> ready:true (only if its file exists) and add the world's cheatsheet."""
import os, re, sys
from integrate import ENG, CHEAT
def main(ch):
    s = open(ENG).read()
    def flip(m):
        line = m.group(0)
        f = re.search(r"file: '([^']+)'", line).group(1)
        return line.replace('ready: false', 'ready: true') if os.path.exists('/home/user/learning/lessons/' + f) else line
    s = re.sub(r"    \{ id: '\d{4}', w: %d,.*\}," % ch, flip, s)
    cs = CHEAT[ch]
    if os.path.exists('/home/user/learning/reference/' + cs):
        s = re.sub(r"(    \{ w: %d, [^\n]*?slug: '[^']+')( \},)" % ch, r"\1, cheatsheet: '%s'\2" % cs, s) if f"w: {ch}," in s and cs not in s else s
    open(ENG, 'w').write(s)
    for l in s.split('\n'):
        if re.search(r"\bw: %d\b" % ch, l): print(l.strip()[:150])
for a in sys.argv[1:]: main(int(a))
