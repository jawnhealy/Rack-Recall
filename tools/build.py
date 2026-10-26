import sqlite3,gzip,base64,json,sys
db,tpl,out=sys.argv[1:4]
c=sqlite3.connect(f'file:{db}?mode=ro',uri=True)
rows=c.execute('select word,ifnull(front_hooks,""),ifnull(back_hooks,""),ifnull(lexicon_symbols,""),cast(playability_order as text),cast(ifnull(playability,0) as text),ifnull(definition,"") from words order by length,probability_order2').fetchall()
for r in rows: assert '\t' not in ''.join(r) and '\n' not in ''.join(r)
data='\n'.join('\t'.join(r) for r in rows).encode()
b64=base64.b64encode(gzip.compress(data,9)).decode()
name=c.execute('select lexicon,revision from lexicon_revision').fetchone()[0]
date=c.execute('select date from lexicon_date').fetchone()[0]
html=open(tpl).read().replace('/*__LEX__*/',b64).replace('/*__META__*/',json.dumps({"name":name,"date":date,"count":len(rows)}))
open(out,'w').write(html)
print(len(rows),'words;',round(len(html)/1e6,2),'MB')
