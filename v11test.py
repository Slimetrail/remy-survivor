# v11 feature tests: tiers/sprites, boss telegraphs, mutated specials, spewer infest/glob, comic intro + voice mock, town panels + tiers, offline
import subprocess,sys,time,json
from playwright.sync_api import sync_playwright
O="/workspace/remy-shots-v11/";R=[]
def ok(n,c,extra=""):R.append(bool(c));print(("PASS " if c else "FAIL ")+n+(" "+str(extra) if extra else ""))
srv=subprocess.Popen([sys.executable,"-m","http.server","8826"],cwd="/workspace/remy-survivor",stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(1)
MOCK="""window.__spoken=[];Object.defineProperty(window,'speechSynthesis',{configurable:true,value:{speak(u){__spoken.push({t:u.text,p:u.pitch,r:u.rate});setTimeout(()=>u.onend&&u.onend(),50)},cancel(){window.__cancels=(window.__cancels||0)+1},getVoices(){return [{name:'Mock Daniel',lang:'en-GB',localService:true}]}}});window.SpeechSynthesisUtterance=function(t){this.text=t};"""
with sync_playwright() as p:
  b=p.chromium.launch();ctx=b.new_context(viewport={"width":390,"height":844},device_scale_factor=2);ctx.add_init_script(MOCK);pg=ctx.new_page();E=pg.evaluate
  errs=[];pg.on("pageerror",lambda e:errs.append(str(e)));pg.on("console",lambda m:m.type=="error" and errs.append(m.text))
  pg.goto("http://localhost:8826/");E("localStorage.clear()");pg.reload();pg.wait_for_timeout(500)
  ZT=E("__rs.ZT");tiers={k:v["tier"] for k,v in ZT.items()}
  ok("tier table",tiers=={"shamb":1,"runner":1,"dog":1,"spit":1,"clown":1,"charger":2,"spewer":2,"grabber":2,"bloat":2,"tank":2,"boss":3},tiers)
  ok("tier2 tougher+faster than basic shamb",all(ZT[k]["hp"]>ZT["shamb"]["hp"] and ZT[k]["spd"]>ZT["shamb"]["spd"]-5 for k in ["charger","spewer","bloat","tank"]) and ZT["grabber"]["hp"]>=max(ZT["charger"]["hp"],ZT["spewer"]["hp"]))
  ok("boss hp >> tier2",ZT["boss"]["hp"]>4*max(v["hp"] for v in ZT.values() if v["tier"]==2))
  ok("charger fastest tier2",ZT["charger"]["spd"]==max(v["spd"] for v in ZT.values() if v["tier"]==2))
  # silhouette width: tier1 thinner than tier2 (opaque pixel count)
  area=E("""(()=>{const o={};for(const k in __ZS){const c=__ZS[k][0],d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let n=0;for(let i=3;i<d.length;i+=4)if(d[i]>200)n++;o[k]=n/(__rs.ZT[k].r**2)}return o})()""")
  ok("silhouette: tier1 thinner than tier2 (area/r^2)",max(area[k] for k in ["shamb","runner","spit","clown"])<min(area[k] for k in ["bloat","tank","grabber","spewer"]),{k:round(v,1) for k,v in area.items()})
  # --- comic intro: texts in order, voice mock, skip
  intro=E("(()=>{const o=[];return null})()")
  pg.click("#journeyB");pg.wait_for_timeout(300)
  src=open("/workspace/remy-survivor/game.js").read()
  n=E("document.querySelector('#comicP .cnum').textContent")
  seen=[];shots=0
  for i in range(5):
    seen.append(E("[...document.querySelectorAll('#comicP .cap,#comicP .narr,#comicP .bub')].map(e=>e.textContent)"))
    if i in(0,1,3):pg.wait_for_timeout(400);pg.screenshot(path=O+"comic-panel-%d.png"%(i+1))
    if i<4:pg.click("#comicN");pg.wait_for_timeout(120)
  orig=E("(()=>{return null})()")
  ok("comic: 5 intro panels shown in order",len(seen)==5 and all(len(x)==3 for x in seen))
  ok("comic: words unchanged (each in game.js INTRO)",all(all(t.replace('"','\\"') in src for t in x) for x in seen))
  sp=E("__spoken");ok("comic: speech called with panel text, pitch .7 rate .85",len(sp)>=5 and sp[0]["t"].startswith(seen[0][0]) and sp[0]["p"]==0.7 and sp[0]["r"]==0.85)
  c0=E("window.__cancels||0");pg.click("#comicS");pg.wait_for_timeout(300);ok("comic: skip -> map, speech cancelled",pg.is_visible("#map") and (E("window.__cancels") or 0)>c0)
  E("__rs.setMute(true);__spoken.length=0");pg.click("#mapB") if pg.is_visible("#mapB") else None
  E("document.getElementById('storyB')&&document.getElementById('storyB').click()");pg.wait_for_timeout(300);ok("comic: muted -> no speech",E("__spoken.length")==0 and pg.is_visible("#comic"));E("__rs.setMute(false)")
  pg.click("#comicS");pg.wait_for_timeout(200)
  # --- landscape comic
  pg.set_viewport_size({"width":915,"height":412});E("document.getElementById('storyB').click()");pg.wait_for_timeout(500);pg.screenshot(path=O+"comic-panel-landscape.png");pg.click("#comicS");pg.set_viewport_size({"width":390,"height":844})
  # --- tiers from population
  td=E("TOWNS.map(t=>[t.n,t.pop,tier(t.pop).id])");print(td)
  exp={"Niceville, FL":"town","Crestview, FL":"town","Tallahassee, FL":"major","Valdosta, GA":"mid","Waycross, GA":"town","Savannah, GA":"mid","Charleston, SC":"major","Kingstree, SC":"small","Florence, SC":"town","Pamplico, SC":"rural"}
  ok("tier(pop) per real town",all(exp[n]==t for n,_,t in td))
  ok("tier boundaries",E("[tier(150000).id,tier(149999).id,tier(50000).id,tier(9999).id,tier(2999).id,tier(1061).id].join()")=="major,mid,mid,small,rural,rural")
  # --- town panel after every boss: real stage-clear flow per transition
  for st in range(0,9):
    E("__rs.prog().cleared=[...Array(%d).keys()];__rs.prog().stage=%d;__rs.save().seenIntro=true;"%(st,st))
    E("document.querySelectorAll('.screen').forEach(s=>s.classList.add('hidden'))");E("window.__go=1")
    E("__rs.endRun&&0");E("(()=>{})()")
    pg.evaluate("document.getElementById('journeyB').click()");pg.wait_for_timeout(150)
    if pg.is_visible("#comic"):pg.click("#comicS")
    pg.click("#mapGo");pg.wait_for_timeout(150)
    E("__rs.G.p.hp=1e6;__rs.G.p.maxHp=1e6;__rs.G.t=__rs.G.nextBoss-0.05");pg.wait_for_timeout(500)
    for _ in range(80):
      s=E("__rs.state")
      if pg.is_visible("#iniSave"):pg.click("#iniSave")
      if pg.is_visible("#againB"):break
      if s=="lvl":pg.click(".up >> nth=0")
      E("__rs.G&&__rs.G.bossAlive&&(__rs.G.bossAlive.hp=1)")
      if s=="over":break
      pg.wait_for_timeout(300)
    if pg.is_visible("#iniSave"):pg.click("#iniSave")
    saved=E("__rs.prog().cleared.includes(%d)&&Object.keys(localStorage).some(k=>k.startsWith('rs_')&&localStorage.getItem(k).includes('cleared'))"%st)
    pg.click("#againB");pg.wait_for_timeout(400)
    town=E("window.__cutTown");want=E("townName(%d)"%(st+1));ti=E("window.__cutTier.id");cnt=E("window.__cutCounts")
    a1=E("__rs.state")=="cut" and pg.is_visible("#cut")
    img1=pg.screenshot();pg.wait_for_timeout(700);img2=pg.screenshot()
    static=E("document.querySelector('#cut canvas').width")>0
    print("dbg",a1,town,want,ti,type(saved),str(saved)[:120])
    ok("stage %d->%d: panel shown, sign %s, tier %s, saved first"%(st,st+1,town,ti),a1 and town==want and ti==exp[E("TOWNS[%d].n"%(st+1))] and saved,cnt)
    if st+1 in(2,3,9):pg.screenshot(path=O+"town-panel-%d-%s.png"%(st+1,town.lower()))
    if st+1==9:ok("Pamplico rural: few buildings many trees",cnt["b"]<=5 and cnt["t"]>=20,cnt)
    if st+1==2:ok("Tallahassee major dense",cnt["b"]>=40,cnt)
    if st%2==0:pg.click("#cutS")
    else:pg.wait_for_timeout(12300)
    pg.wait_for_timeout(300);ok("  -> play in stage %d"%(st+1),E("__rs.state")=="play" and E("__rs.G.stage")==st+1)
  # --- gameplay specials
  E("__rs.endRun(false,true)");pg.wait_for_timeout(200);E("document.getElementById('homeB').click()");pg.click("#endlessB");pg.wait_for_timeout(300)
  SET="const G=__rs.G,p=G.p;__rs.ent.z.length=0;G.t=5;p.hp=p.maxHp=1e6;G.order.length=0;window.__botDir=()=>[0,0];"
  # boss charge telegraph
  E(SET+"window.__b=__rs.spawnZ('boss',p.x+300,p.y);G.bossAlive=__b;__b.dashCd=0;__b.atk=0;Math.__r=Math.random;Math.random=()=>.99");pg.wait_for_timeout(150)
  a=E("[__b.atk,__b.x]");pg.wait_for_timeout(200);pg.screenshot(path=O+"boss-charge-telegraph.png");pg.wait_for_timeout(750);b2=E("[__b.atk,__b.x]");E("Math.random=Math.__r")
  ok("boss: charge wind-up (atk1, stands still) then rush (atk2/3, moved toward player)",a[0]==1 and b2[0] in(2,3) and b2[1]<a[1]-60,(a,b2))
  E(SET+"window.__b=__rs.spawnZ('boss',p.x+120,p.y);G.bossAlive=__b;__b.dashCd=0;__b.atk=0;Math.__r=Math.random;Math.random=()=>.1;p.inv=0");pg.wait_for_timeout(120);E("Math.random=Math.__r")
  s1=E("__b.atk");pg.wait_for_timeout(400);pg.screenshot(path=O+"boss-slam-telegraph.png");hp0=E("p=__rs.G.p;p.inv=0;p.hp");pg.wait_for_timeout(650);pg.screenshot(path=O+"boss-slam-shockwave.png");pg.wait_for_timeout(600)
  ok("boss: slam telegraph then shockwave hits player in ring",s1==4 and E("__rs.G.p.hp")<hp0,(s1,hp0,E("__rs.G.p.hp")))
  # charger
  E(SET+"window.__c=__rs.spawnZ('charger',p.x+220,p.y);__c.dashCd=0");pg.wait_for_timeout(250);c1=E("[__c.dash>0,__c.x]");pg.screenshot(path=O+"charger-rush-telegraph.png");pg.wait_for_timeout(350);pg.screenshot(path=O+"charger-rushing.png");pg.wait_for_timeout(350);c2=E("__c.x")
  ok("charger: telegraph then straight rush",c1[0] and c2<c1[1]-100,(c1,c2))
  # grabber
  E(SET+"window.__g=__rs.spawnZ('grabber',p.x+5,p.y);__g.spd=0;p.inv=0");pg.wait_for_timeout(100);st1=E("__rs.G.p.stun");pg.screenshot(path=O+"grabber-holding-player.png");E("window.__botDir=()=>[1,0]");x0=E("__rs.G.p.x");pg.wait_for_timeout(300);x1=E("__rs.G.p.x")
  ok("grabber: grab stuns ~0.7s (no movement)",st1>0.4 and abs(x1-x0)<3,(st1,x0,x1))
  E("__g.x=__rs.G.p.x+5;__g.y=__rs.G.p.y;__rs.G.p.inv=0;__rs.G.p.stun=0");pg.wait_for_timeout(150);ok("grabber: 2s cooldown, no chain grab",E("__rs.G.p.stun")<=0)
  # spewer vomit -> infest; edge spawns
  E(SET+"window.__s=__rs.spawnZ('spewer',p.x+140,p.y);__s.spitCd=0;p.inv=0");pg.wait_for_timeout(450);pg.screenshot(path=O+"spewer-vomit.png");pg.wait_for_timeout(1300)
  ok("spewer: vomit hit -> infested ~10s",E("__rs.G.infT")>8,E("__rs.G.infT"))
  E("__s.hp=0");pg.wait_for_timeout(100)
  edge=E("""(()=>{const G=__rs.G,p=G.p;return __rs.ent.z.filter(z=>z.edge).map(z=>[Math.round(z.ex0),Math.round(z.y-p.y)])})()""")
  W=E("__rs.W");ok("infest: extras spawned outside viewport L+R edges",len(edge)>=8 and all(abs(x)>W/2 for x,y in edge) and any(x<0 for x,y in edge) and any(x>0 for x,y in edge),(W,edge[:6]))
  pg.screenshot(path=O+"infest-edge-swarm-390.png");pg.wait_for_timeout(1200)
  moved=E("""(()=>{const p=__rs.G.p;const e=__rs.ent.z.filter(z=>z.edge);return e.filter(z=>Math.abs(z.x-p.x)<__rs.W/2).length/e.length})()""")
  ok("infest: edge zombies walk in",moved>.3,moved);pg.screenshot(path=O+"infest-big-horde-390.png")
  E("__rs.infest();__rs.infest()");ok("infest: refresh no stack",E("__rs.G.infT")<=10.01 and E("__rs.INF.spd")==1.25)
  E("__rs.G.infT=0.05");pg.wait_for_timeout(200);ok("infest: expires",E("__rs.G.infT")==0)
  cap_ok=E("""(()=>{const G=__rs.G;G.t=5;__rs.infest();let mx=0;for(let i=0;i<400;i++){__rs.spawnZ('shamb',G.p.x+2000,G.p.y)}return __rs.ent.z.length})()""");pg.wait_for_timeout(500)
  n2=E("__rs.ent.z.length");ok("infest: cap respected (no extra spawns when over cap)",n2<=cap_ok+2,(cap_ok,n2))
  # glob
  E(SET+"window.__s=__rs.spawnZ('spewer',p.x+200,p.y);__rs.hurt(__s,1e9);window.__H=[];for(let i=0;i<12;i++)__H.push(__rs.spawnZ('shamb',p.x+200+Math.cos(i)*220,p.y+Math.sin(i)*220));window.__el=__rs.spawnZ('runner',p.x+400,p.y);__el.elite=true;window.__bb=__rs.spawnZ('boss',p.x+380,p.y+60);__bb.spd=60");pg.wait_for_timeout(120)
  gl=E("__rs.G.globs.length");d0=E("__H.reduce((a,z)=>a+Math.hypot(z.x-__rs.G.globs[0].x,z.y-__rs.G.globs[0].y),0)");pg.wait_for_timeout(1500);pg.screenshot(path=O+"glob-decoy-converging.png")
  d1=E("__H.reduce((a,z)=>a+Math.hypot(z.x-__rs.G.globs[0].x,z.y-__rs.G.globs[0].y),0)")
  ok("glob: spawned on spewer kill, horde converges on it",gl==1 and d1<d0*.7,(d0,d1))
  ok("glob: elite + boss ignore it",not E("__el.lure") and not E("__bb.lure"))
  pg.wait_for_timeout(4800);ok("glob: expires ~6s",E("__rs.G.globs.length")==0)
  # screenshots busy scene 390 + 915, tank/boss shots
  E(SET+"const T=['shamb','runner','dog','spit','clown','charger','spewer','grabber','bloat','tank'];for(let i=0;i<140;i++){const a=Math.random()*6.28,d=70+Math.random()*330;__rs.spawnZ(T[i%10],p.x+Math.cos(a)*d,p.y+Math.sin(a)*d)}");pg.wait_for_timeout(700);pg.screenshot(path=O+"busy-390x844.png")
  pg.set_viewport_size({"width":915,"height":412});pg.wait_for_timeout(700);pg.screenshot(path=O+"busy-915x412.png")
  E(SET+"for(let i=0;i<3;i++){const t=__rs.spawnZ('tank',p.x+60+i*50,p.y-20+i*30);t.spd=0}const b=__rs.spawnZ('boss',p.x-140,p.y);b.spd=0;b.dashCd=99;");pg.wait_for_timeout(400);pg.screenshot(path=O+"boss-and-tanks-915.png")
  # offline
  pg.goto("http://localhost:8826/");pg.wait_for_timeout(1500);E("navigator.serviceWorker.ready");pg.wait_for_timeout(800);keys=E("caches.keys()");ctx.set_offline(True);pg.reload();pg.wait_for_timeout(800)
  ok("offline: loads from SW cache remysurv-v16","remysurv-v16" in keys and E("typeof TOWNS!=='undefined'&&typeof __rs!=='undefined'"),keys);ctx.set_offline(False)
  print("errors",errs);ok("no console errors",not errs)
  b.close()
srv.kill();print(sum(R),"/",len(R))
