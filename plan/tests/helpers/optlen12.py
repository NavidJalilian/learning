import re,sys,glob
for f in sorted(glob.glob('/home/user/learning/lessons/120*.html')):
    s=open(f).read()
    for m in re.finditer(r"\b(options|o)\s*:\s*\[(.*?)\]\s*,",s):
        opts=re.findall(r"'((?:[^'\\]|\\.)*)'",m.group(2))
        L=[len(o) for o in opts]
        if len(L)>1 and max(L)>1.5*min(L) and max(L)-min(L)>12:
            print(f.split('/')[-1][:4], L, opts)
