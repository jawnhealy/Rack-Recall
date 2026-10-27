"""Builds the app page: embeds the NWL lexicon (and optionally the Collins-only words used as phonies).
usage: build.py NWL2023.db template.html out.html [CSW24.db]"""
import sqlite3,gzip,base64,json,sys
db,tpl,out=sys.argv[1:4]; csw=sys.argv[4] if len(sys.argv)>4 else None
c=sqlite3.connect(f'file:{db}?mode=ro',uri=True)
rows=c.execute('select word,ifnull(front_hooks,""),ifnull(back_hooks,""),ifnull(lexicon_symbols,""),cast(playability_order as text),cast(ifnull(playability,0) as text),ifnull(definition,"") from words order by length,probability_order2').fetchall()
for r in rows: assert '\t' not in ''.join(r) and '\n' not in ''.join(r)
pack=lambda s:base64.b64encode(gzip.compress(s.encode(),9)).decode()
b64=pack('\n'.join('\t'.join(r) for r in rows))
name=c.execute('select lexicon,revision from lexicon_revision').fetchone()[0]
date=c.execute('select date from lexicon_date').fetchone()[0]
meta={"name":name,"date":date,"count":len(rows)}
cb=""
if csw:
    nwl={r[0] for r in rows}
    k=sqlite3.connect(f'file:{csw}?mode=ro',uri=True)
    only=[(w,d.replace("\t"," ").replace("\n"," ")) for w,d in k.execute('select word,ifnull(definition,"") from words order by length,probability_order2') if w not in nwl]
    cb=pack('\n'.join(w+'\t'+d for w,d in only))
    meta["csw"]={"name":k.execute('select lexicon from lexicon_revision').fetchone()[0],"count":len(only)}
# wrong-ending phonies: common words given an S, ED or ING they don't take.
# "Common" = how often a word appears in other words' definitions, a stand-in for everyday English.
import re,collections
defs=[(r[0],r[6]) for r in rows]; nwl=set(w for w,_ in defs); freq=collections.Counter()
for w,d in defs:
    for t in re.findall(r"[a-z]+",re.sub(r"\[[^\]]*\]","",d)): freq[t.upper()]+=1
def inflect(b,t):
    if t=="S": return None if re.search(r"(S|X|Z|CH|SH|Y)$",b) else b+"S"
    if t=="ED": return b+"D" if b.endswith("E") else (b[:-1]+"IED" if re.search(r"[^AEIOU]Y$",b) else b+"ED")
    return b[:-1]+"ING" if re.search(r"[^E]E$",b) else b+"ING"
endings=[]
for w,d in defs:
    if not(2<=len(w)<=13) or d.startswith("<") or re.search(r"(S|ED|ING)$",w) or freq[w]<5: continue
    p=(re.search(r"\[(\w+)",d) or [None,""])[1]; allp=set(re.findall(r"\[(\w+)",d))
    for t in ("S","ED","ING"):
        if t=="S" and p not in ("n","adj"): continue
        if t!="S" and (p!="n" or "v" in allp or len(w)>6): continue  # turning a short noun into a verb is believable; long ones aren't
        f=inflect(w,t)
        if f and f not in nwl: endings.append([f,w,t])
meta["endings"]=len(endings)
html=open(tpl).read().replace('/*__ENDINGS__*/',json.dumps(endings,separators=(",",":"))).replace('/*__LEX__*/',b64).replace('/*__CSW__*/',cb).replace('/*__META__*/',json.dumps(meta))
open(out,'w').write(html)
print(len(rows),'words;',meta['endings'],'ending phonies;',meta.get("csw",{}).get("count",0),'Collins-only;',round(len(html)/1e6,2),'MB')
