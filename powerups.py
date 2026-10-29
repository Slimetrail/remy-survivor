# Walk-over power-ups: cadence, limits, despawn, effects, replace-not-stack, caps, pizza rule, no pause; bot drop counts
import subprocess,sys,time,json
from playwright.sync_api import sync_playwright
R=[]
def ok(n,c,extra=""):R.append(bool(c));print(("PASS " if c else "FAIL ")+n+(" "+str(extra) if extra else ""))
BOT=open("/workspace/remy-survivor/endless_ap.py").read().split('"move":"""')[1].split('"""}')[0]
srv=subprocess.Popen([sys.executable,"-m","http.server","8828"],cwd="/workspace/remy-survivor",stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(1)
try:
 with sync_playwright() as p:
  b=p.chromium.launch();pg=b.new_page(viewport={"width":390,"height":844});E=pg.evaluate
  errs=[];pg.on("pageerror",lambda e:errs.append(str(e)))
  pg.goto("http://localhost:8828/");E("localStorage.clear()");pg.reload();pg.wait_for_timeout(300)
  def fresh():
    pg.click("#endlessB");pg.wait_for_timeout(150)
    E("window.__speed=1;window.__botDir=()=>[0,0];__rs.G.p.hp=__rs.G.p.maxHp=1e9;__rs.G.order.length=0;__rs.ent.z.length=0;__rs.G.waveI=9;__rs.G.t=40;__rs.G.lastPop=1e9;window.__K=(ty,n,el)=>{let z;for(let i=0;i<n;i++){z=__rs.spawnZ(ty||'shamb',__rs.G.p.x+300,__rs.G.p.y+200);if(el)z.elite=true;__rs.killZ(z)}return [z.x,z.y]};0")
  fresh();U="__rs.G.pu"
  E("__K('shamb',24)");pg.wait_for_timeout(100);ok("24 kills: no drop",E(U+".board")is None and E(U+".due")==0)
  pos=E("__K('shamb',1)");pg.wait_for_timeout(100);bd=E(U+".board")
  ok("25th kill drops where it died",bd and abs(bd["x"]-pos[0])<1 and abs(bd["y"]-pos[1])<1,bd)
  E("__K('shamb',60)");pg.wait_for_timeout(100);ok("only 1 on board, kills while blocked don't stack",E(U+".board.x")==bd["x"] and E(U+".due")==0)
  E(U+".board=null;__K('shamb',30)");pg.wait_for_timeout(100);ok("gap (35s, >=20s) blocks new drop",E(U+".board") is None and E(U+".due")==0)
  E("__rs.G.t="+U+".last+__rs.PU_GAP+.05;__K('shamb',25)");pg.wait_for_timeout(100);ok("after gap, 25 more kills drop again",E(U+".board")is not None and E(U+".due")==0)
  E(U+".board=null;"+U+".due=0;__K('shamb',1,true)");ok("elite tier1: no forced drop",E(U+".due")==0)
  E("__K('tank',1,true)");ok("elite tier2 always drops",E(U+".due")==1)
  E(U+".due=0;__K('boss',1)");ok("boss drops two (queued, shown one per 20s)",E(U+".due")==2)
  E(U+".due=0;__rs.ent.item.length=0");pg.wait_for_timeout(100)
  if E("__rs.state")=="lvl":pg.click(".up >> nth=0")
  # despawn 12s + 3s blink
  E(U+".last=-99;"+U+".due=1;__rs.G.pu.dx=__rs.G.p.x+150;__rs.G.pu.dy=__rs.G.p.y");pg.wait_for_timeout(100);t0=E("__rs.G.t");E("window.__speed=4")
  blink=None
  w0=time.time()
  while E(U+".board") and time.time()-w0<30:
    if blink is None and E(U+".board.l")<3:blink=E("__rs.G.t")-t0
    pg.wait_for_timeout(30)
  E("window.__speed=1");gone=E("__rs.G.t")-t0;ok("blinks at ~12s, gone at ~15s",11.5<(blink or 0)<12.6 and 14.6<gone<15.6,(round(blink or 0,1),round(gone,1)));ok("miss counted",E(U+".miss")==1)
  # pickup by walking over: no pause, effect, banner, no xp
  s0=E("__rs.stat()");xp0=E("__rs.G.xp");lv0=E("__rs.G.lvl")
  E(U+".board={k:'drink',x:__rs.G.p.x+60,y:__rs.G.p.y,l:15};window.__botDir=()=>[1,0]");pg.wait_for_timeout(600);E("window.__botDir=()=>[0,0]")
  ok("walk-over pickup, no pause",E(U+".board")is None and E("__rs.state")=="play" and E(U+".act.k")=="drink")
  ok("banner like 'Energy Drink! 8s'",E("__rs.G.banner").endswith("Energy Drink! 8s"),E("__rs.G.banner"))
  ok("drink: +20% move",abs(E("__rs.stat().spd")/s0["spd"]-1.2)<1e-6)
  ok("no xp/levels from power-up",E("__rs.G.xp")==xp0 and E("__rs.G.lvl")==lv0)
  ok("timer bar: 8s and counting",7<E(U+".act.t")<8)
  E("__rs.puGet('tape')");s1=E("__rs.stat()")
  ok("replace not stack: tape replaces drink, timer restart",E(U+".act.k")=="tape" and E(U+".act.t")==8 and abs(s1["spd"]-s0["spd"])<1e-9 and abs(s1["cd"]-s0["cd"]/1.2)<1e-9)
  E("__rs.puGet('sock')");ok("sock: big magnet",E("__rs.stat().mag")>=450 and abs(E("__rs.stat().cd")-s0["cd"])<1e-9)
  E("__rs.G.ps.sneakers=5;__rs.G.ps.coffee=5;__rs.puGet('drink')");ok("speed cap 1.6 with upgrades",abs(E("__rs.stat().spd")-1.6)<1e-9)
  E("__rs.puGet('tape')");ok("fire-rate floor 0.6 with upgrades",abs(E("__rs.stat().cd")-0.6)<1e-9)
  E("__rs.G.pu.act.t=0.01");pg.wait_for_timeout(200);ok("expires after timer",E(U+".act") is None)
  E("__rs.G.p.maxHp=100;__rs.G.p.hp=50;__rs.puGet('pizza')");ok("pizza heals 10% once, no timer",E("__rs.G.p.hp")==60 and E(U+".act") is None)
  ks=E("(()=>{const u=__rs.G.pu,o={};for(let i=0;i<120;i++){u.board=null;u.last=-99;u.due=1;u.dx=__rs.G.p.x+500;u.dy=__rs.G.p.y;__rs.G.pu.act=null;window.__tick&&0;}return 0})()")
  kinds=set()
  for i in range(40):
    E("(()=>{const u=__rs.G.pu;u.board=null;u.last=-99;u.due=1;u.dx=__rs.G.p.x+500;u.dy=__rs.G.p.y})()");pg.wait_for_timeout(40);k=E(U+".board&&"+U+".board.k");kinds.add(k)
  ok("rule: pizza is never dropped during its 30s cooldown","pizza" not in kinds and {"drink","tape","sock"}<=kinds,kinds)
  E(U+".pizzaCd=-99");kinds=set()
  for i in range(40):
    E("(()=>{const u=__rs.G.pu;u.board=null;u.last=-99;u.due=1;u.dx=__rs.G.p.x+500;u.dy=__rs.G.p.y})()");pg.wait_for_timeout(40);kinds.add(E(U+".board&&"+U+".board.k"))
  ok("pizza drops again after cooldown",{"pizza","drink","tape","sock"}<=kinds,kinds)
  ok("power-ups not saved",'"pu"' not in json.dumps(E("localStorage")))
  # bot runs: drops per minute, picked vs missed, and level-up popup cadence unaffected
  M={}
  for mode in ["endless","journey"]:
    E("localStorage.clear()");pg.reload();pg.wait_for_timeout(300);E("__rs.save().seenIntro=true")
    if mode=="journey":
      pg.click("#journeyB");pg.wait_for_timeout(200)
      if pg.is_visible("#comic"):pg.click("#comicS")
      pg.click("#mapGo")
    else:pg.click("#endlessB")
    pg.wait_for_timeout(150);E(BOT);E("window.__b0=window.__botDir;window.__botDir=()=>{const G=__rs.G,p=G.p,b=G.pu.board;if(b){const dx=b.x-p.x,dy=b.y-p.y,d=Math.hypot(dx,dy);if(d<350)return[dx/d,dy/d]}return __b0()}");E("__rs.G.p.hp=__rs.G.p.maxHp=1e9;window.__speed=8");drops=[];pops=[];last=0;st=time.time()
    while time.time()-st<240 and E("__rs.state") in("play","lvl") and E("__rs.G.t")<300:
      if E("__rs.state")=="lvl":
        if "LOOT" not in E("document.getElementById('lvlT').textContent"):pops.append(E("__rs.G.t"))
        pg.click(".up >> nth=0");continue
      d=E(U+".drops")
      if d>last:drops+= [E("__rs.G.t")]*(d-last);last=d
      pg.wait_for_timeout(40)
    u=E("({got:%s.got,miss:%s.miss,drops:%s.drops,t:__rs.G.t})"%(U,U,U));g=[b2-a for a,b2 in zip(drops,drops[1:])]
    M[mode]={"drops_1m":sum(t<=60 for t in drops),"drops_2m":sum(t<=120 for t in drops),"drops_5m":len(drops),"per_min":[sum(m*60<t<=(m+1)*60 for t in drops) for m in range(5)],"got":u["got"],"miss":u["miss"],"times":[round(t) for t in drops],"popups_5m":len(pops),"popup_times":[round(t) for t in pops]}
    print(mode,json.dumps(M[mode]))
    ok(mode+": 4-7 drops in 5 min",4<=len(drops)<=7,len(drops));ok(mode+": drops >=20s apart",not g or min(g)>=19.9)
    pg_=[b2-a for a,b2 in zip(pops,pops[1:])];ok(mode+": level-up pacing rules hold (first >=25s, gaps >=25s, <=12 in 5 min)",pops and pops[0]>=24.9 and (not pg_ or min(pg_)>=24.9) and len(pops)<=12,(len(pops),pops[:1]))
  ok("no page errors",not errs,errs)
finally: srv.kill()
print("%d/%d passed"%(sum(R),len(R)));sys.exit(0 if all(R) else 1)
