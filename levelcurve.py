# Level-up pacing check: no popup in first ~25s, 4-8 popups in first 5 min of bot play, min gap LVL_GAP, xp carried not lost
import subprocess,sys,time
from playwright.sync_api import sync_playwright
R=[]
def ok(n,c,extra=""):R.append(bool(c));print(("PASS " if c else "FAIL ")+n+(" "+str(extra) if extra else ""))
BOT=open("/workspace/remy-survivor/endless_ap.py").read().split('"move":"""')[1].split('"""}')[0]
srv=subprocess.Popen([sys.executable,"-m","http.server","8827"],cwd="/workspace/remy-survivor",stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(1)
try:
 with sync_playwright() as p:
  b=p.chromium.launch();pg=b.new_page(viewport={"width":390,"height":844});E=pg.evaluate
  errs=[];pg.on("pageerror",lambda e:errs.append(str(e)))
  pg.goto("http://localhost:8827/");E("localStorage.clear()");pg.reload();pg.wait_for_timeout(300)
  gap=E("__rs.LVL_GAP");need=E("[1,2,3,4,5,6,8,10,15].map(__rs.xpNeed)")
  ok("gap is 25s",gap==25);ok("xp curve rises gently",all(b2>a for a,b2 in zip(need,need[1:])) and need[0]>=15,need)
  # queued levels: huge xp -> one popup, no second popup inside the gap, xp kept
  pg.click("#endlessB");pg.wait_for_timeout(200);E("window.__botDir=()=>[0,0];__rs.G.p.hp=__rs.G.p.maxHp=1e9;__rs.ent.z.length=0;__rs.G.t=30;__rs.G.xp=500");pg.wait_for_timeout(200)
  ok("big xp -> one popup",E("__rs.state")=="lvl" and E("__rs.G.lvl")==2);pg.click(".up >> nth=0");pg.wait_for_timeout(400)
  ok("no back-to-back popup, xp kept",E("__rs.state")=="play" and E("__rs.G.xp")>400)
  E("__rs.G.t=__rs.G.lastPop+25.1");pg.wait_for_timeout(200);ok("next popup after gap",E("__rs.state")=="lvl" and E("__rs.G.lvl")==3);pg.click(".up >> nth=0")
  # bot run: endless, medium, immortal, 300 game-s at speed 8
  E("localStorage.clear()");pg.reload();pg.wait_for_timeout(300);pg.click("#endlessB");pg.wait_for_timeout(200)
  E(BOT);E("__rs.G.p.hp=__rs.G.p.maxHp=1e9;window.__speed=8");T=[];st=time.time()
  while time.time()-st<240 and E("__rs.G.t")<300:
    if E("__rs.state")=="lvl":T.append(E("__rs.G.t"));pg.click(".up >> nth=0");continue
    pg.wait_for_timeout(50)
  g=[b2-a for a,b2 in zip(T,T[1:])];print("popup times",[round(x) for x in T])
  ok("no popup in first 25s",T and T[0]>=24.9,T[:1]);ok("4-8 popups in first 5 min",4<=len(T)<=8,len(T));ok("min gap >= 25s",not g or min(g)>=24.9,min(g) if g else None)
  ok("no page errors",not errs,errs)
finally: srv.kill()
print("%d/%d passed"%(sum(R),len(R)));sys.exit(0 if all(R) else 1)
