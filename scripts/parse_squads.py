from pypdf import PdfReader
import re, json
PDF='/root/.claude/uploads/34dab182-e380-51c3-bb4c-727aa4e2fa27/0703ba4a-SquadListsSpanish.pdf'
r=PdfReader(PDF)
line_re=re.compile(r'^(PO|DF|MC|DC)(.*?)(\d{1,2}/\d{1,2}/\d{4})(.+?)\(([A-Z]{3})\)\s*(\d{2,3})?\s*(\d+)?\s*(\d+)?\s*$')
def tc(s): return ' '.join(w.capitalize() for w in s.split())
def parse_name(block):
    b=block.strip()
    # try "SURNAME(S) Given" with a space
    m=re.match(r"^([A-ZÀ-ÝÄ-Ü'’\.\- ]+?) ([A-ZÀ-Ý][a-zà-ÿ])", b)
    if m:
        surname=m.group(1).strip(); rest=b[m.end(1):].strip()
        gt=rest.split()[0] if rest.split() else ''
    else:
        # camelCase boundary: ALLCAPS surname stuck to Titlecase given
        m2=re.match(r"^([A-ZÀ-Ý][A-ZÀ-Ý’'\.\- ]+?)([A-ZÀ-Ý][a-zà-ÿ].*)$", b)
        if m2:
            surname=m2.group(1).strip(); gt=m2.group(2).split()[0]
        else:
            return tc(b.split()[0]) if b.split() else b
    gm=re.match(r"[A-ZÀ-Ý][a-zà-ÿ’'\-]*", gt); given=gm.group() if gm else gt
    given_tc=tc(given); surname_tc=tc(surname)
    # mononym/dup guard: if given equals (start of) surname, drop given
    if given_tc and surname_tc.lower().startswith(given_tc.lower()):
        return surname_tc
    return f"{given_tc} {surname_tc}".strip() if given_tc else surname_tc

CLUB={'Real Madrid':93,'Barcelona':91,'Manchester City':92,'Liverpool':90,'Bayern':90,'München':90,
 'Arsenal':89,'Paris Saint':91,'Internazionale':88,'Atlético':86,'Chelsea':86,'Napoli':85,'Juventus':84,
 'Borussia Dortmund':84,'Milan':84,'Tottenham':84,'Leverkusen':85,'Manchester United':83,'Atalanta':82,
 'Newcastle':82,'Aston Villa':81,'Leipzig':82,'Benfica':80,'Sporting CP':80,'Porto':79,'Villarreal':80,
 'Real Sociedad':79,'Athletic':79,'Brighton':79,'West Ham':78,'Girona':79,'Crystal Palace':77,'Fulham':77,
 'Brentford':76,'Galatasaray':78,'Fenerbahçe':77,'Al Hilal':78,'Al Nassr':76,'Al Ahli':76,'Al Ittihad':76,
 'Marseille':80,'Lyon':77,'Monaco':78,'Lille':77,'PSV':74,'Feyenoord':74,'Ajax':75,'Inter Miami':70,
 'Wolfsburg':76,'Eintracht Frankfurt':79,'Stuttgart':79,'Bologna':79,'Roma':81,'Lazio':80,'Fiorentina':77}
LEAGUE={'ENG':80,'ESP':80,'GER':78,'ITA':78,'FRA':76,'POR':72,'NED':72,'KSA':72,'TUR':70,'BEL':68,'USA':66,
 'MEX':66,'BRA':70,'ARG':68,'SUI':66,'AUT':64,'GRE':64,'SCO':62,'DEN':64,'CRO':62,'JPN':62,'KOR':60,'RUS':66,
 'QAT':62,'UAE':60,'POL':62,'CZE':62,'NOR':62,'SWE':62,'UKR':62}
def club_strength(club,cc):
    for k,v in CLUB.items():
        if k.lower() in club.lower(): return v
    return LEAGUE.get(cc,58)

OVR={'kylian mbappe':95,'erling haaland':94,'jude bellingham':92,'ousmane dembele':91,'harry kane':91,
 'jamal musiala':91,'lamine yamal':91,'mohamed salah':91,'rodri hernandez':92,'rodri':92,'vinicius':93,
 'vinicius junior':93,'lautaro martinez':90,'kevin de bruyne':90,'bukayo saka':90,'florian wirtz':90,
 'thibaut courtois':89,'federico valverde':89,'pedri gonzalez':88,'pedri':88,'phil foden':88,
 'antoine griezmann':87,'bruno fernandes':88,'achraf hakimi':88,'virgil van dijk':87,'alisson':88,
 'ruben dias':88,'marquinhos':87,'william saliba':87,'declan rice':87,'martin odegaard':87,'cole palmer':88,
 'nico williams':86,'rafael leao':86,'victor osimhen':88,'julian alvarez':88,'robert lewandowski':87,
 'joshua kimmich':87,'antonio rudiger':86,'aurelien tchouameni':86,'jules kounde':85,'theo hernandez':85,
 'mike maignan':86,'ibrahima konate':84,'dayot upamecano':85,'adrien rabiot':84,'michael olise':86,
 'bernardo silva':87,'vitinha':86,'nuno mendes':85,'emiliano martinez':86,'enzo fernandez':85,
 'alexis mac allister':86,'gavi':84,'dani olmo':85,'mateo kovacic':82,'luka modric':83,'jan oblak':87,
 'son heung':87,'heung-min son':87,'takefusa kubo':84,'kaoru mitoma':84,'memphis depay':82,'cody gakpo':84,
 'frenkie de jong':86,'denzel dumfries':82,'serhou guirassy':85,'leroy sane':84,'gregor kobel':84,
 'cristiano ronaldo':86,'lionel messi':88,'mohammed kudus':84,'romelu lukaku':85,'dusan vlahovic':84}

cur=2026; teams=[]
for pi in range(len(r.pages)):
    lines=[l for l in r.pages[pi].extract_text().split('\n') if l.strip()]
    tm=re.match(r'^(.*?)\s*\(([A-Z]{3})\)',lines[0])
    tname=tm.group(1).strip() if tm else lines[0]; tcode=tm.group(2) if tm else '???'
    ps=[]
    for ln in lines:
        m=line_re.match(ln)
        if not m: continue
        pos,block,dob,club,cc,h,caps,goals=m.groups()
        d,mo,y=[int(x) for x in dob.split('/')]
        ps.append(dict(pos4=pos,name=parse_name(block),age=cur-y,club=club.strip(),cc=cc,
                       height=int(h or 180),caps=int(caps or 0),goals=int(goals or 0),
                       cs=club_strength(club.strip(),cc)))
    teams.append(dict(name=tname,code=tcode,players=ps))

def base(p):
    v=46+p['cs']*0.42+min(8,p['caps']*0.05)
    if p['pos4']=='DC': v+=min(5,p['goals']*0.12)
    if p['pos4']=='MC': v+=min(3,p['goals']*0.06)
    a=p['age']; v+=(-5 if a<=19 else -2 if a<=21 else 0 if a<=25 else 1 if a<=30 else -1 if a<=32 else -3 if a<=34 else -6)
    return v
def ovr_lookup(name):
    k=name.lower()
    if k in OVR: return OVR[k]
    sn=k.split()[-1]
    if sn in OVR: return OVR[sn]
    return None
for t in teams:
    for p in t['players']:
        o=ovr_lookup(p['name'])
        p['overall']=int(max(67,min(95, round(o if o is not None else min(base(p),88)))))
        del p['cs']

# validation
allp=[p for t in teams for p in t['players']]
bad=[]
print("players",len(allp),"teams",len(teams))
print("name artifacts remaining:",len([n for n in allp if re.search(r'[a-zà-ÿ][A-ZÀ-Ý]',n['name'])]))
import collections;h=collections.Counter(p['overall'] for p in allp)
print(">=90:",sum(v for k,v in h.items() if k>=90),"85-89:",sum(v for k,v in h.items() if 85<=k<=89))
allp.sort(key=lambda x:-x['overall'])
for p in allp[:8]: print("  ",p['overall'],p['name'],p['pos4'])
json.dump(teams,open('src/data/squads.json','w'),ensure_ascii=False,separators=(',',':'))
import os;print("WROTE src/data/squads.json",os.path.getsize('src/data/squads.json'),"bytes")
