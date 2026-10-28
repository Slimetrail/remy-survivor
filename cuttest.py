# Between-town cutscenes: 9 unique scenes, placeholder lines, custom lines, voice/mute, skip, saved-first, no companion after.
import sys,subprocess,time,hashlib
from playwright.sync_api import sync_playwright
srv=subprocess.Popen([sys.executable,"-m","http.server","8863"],cwd="/workspace/remy-survivor",stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(1)
MOCK="""window.__spoken=[];Object.defineProperty(window,'speechSynthesis',{configurable:true,value:{speak(u){__spoken.push(u.text);setTimeout(()=>u.onend&&u.onend(),50)},cancel(){},getVoices(){return [{name:'Mock',lang:'en-US',localService:true}]}}});window.SpeechSynthesisUtterance=function(t){this.text=t};"""
R=[]
def ok(n,c,x=""):R.append(c);print(("PASS " if c else "FAIL ")+n,"" if c else x)
with sync_playwright() as p:
  b=p.chromium.launch();pg=b.new_page(viewport={"width":390,"height":844});pg.add_init_script(MOCK);E=pg.evaluate;errs=[];pg.on("pageerror",lambda e:errs.append(str(e)))
  pg.goto("http://localhost:8863/");E("localStorage.clear()");pg.reload();pg.wait_for_timeout(500)
  ids=E("CUT_LINES.map(x=>x.id)");want=E("[1,2,3,4,5,6,7,8,9].map(i=>townName(i).toLowerCase())")
  ok("cutscene-lines.js: 9 entries, one per transition, ids match towns",len(ids)==9 and len(set(ids))==9 and ids==want,(ids,want))
  ok("all 9 lines are clearly-marked placeholders",E("CUT_LINES.every(x=>x.line==='[JEREMY LINE HERE]')"))
  ok("no invented goofy lines left in game.js",E("typeof CUTL")=="undefined")
  hashes=[];used=[]
  for i in range(1,10):
    E("window.__townCut(%d)"%i);pg.wait_for_timeout(150)
    cid=E("__cutId");used.append(cid);bub=pg.inner_text("#cut .cbub");txt=pg.inner_text("#cut")
    h=hashlib.md5(E("document.querySelector('#cut .beat canvas').toDataURL()").encode()).hexdigest();hashes.append(h)
    tot=E("__cutTotal");nb=E("__cutBeats");tier=E("__cutTier.id")
    ok("scene %s: placeholder shows '...', no bracket tag, not spoken, %d beats, %d ms, tier %s"%(cid,nb,tot,tier),bub.strip()=="..." and "[" not in txt and "JEREMY" not in txt and E("__spoken.length")==0 and 10000<=tot<=15000 and tier==E("tier(TOWNS[%d].pop).id"%i),(bub,txt,tot))
    pg.click("#cutS");pg.wait_for_timeout(250)
  ok("9 distinct cutscene ids",len(set(used))==9,used)
  ok("9 visually distinct first frames",len(set(hashes))==9)
  # beats advance on their own (cinematic sequence)
  E("window.__townCut(3)");b0=E("__cutBeat");pg.wait_for_timeout(4200);b1=E("__cutBeat");ok("beats advance automatically (valdosta 0 -> %d)"%b1,b0==0 and b1>=1);pg.click("#cutS");pg.wait_for_timeout(200)
  # custom line: shown + voiced
  E("CUT_LINES.find(x=>x.id==='valdosta').line='Test line, written by Jeremy.'");E("__spoken.length=0;__rs.setMute(false)")
  E("window.__townCut(3)");pg.wait_for_timeout(200);bub=pg.inner_text("#cut .cbub")
  ok("filled line appears in bubble",'Test line, written by Jeremy.' in bub,bub)
  ok("filled line is voiced",any('Test line, written by Jeremy.' in s for s in E("__spoken")),E("__spoken"))
  pg.click("#cutS");pg.wait_for_timeout(200)
  E("__spoken.length=0;__rs.setMute(true)");E("window.__townCut(3)");pg.wait_for_timeout(200)
  ok("muted: filled line shown but not spoken",'Test line' in pg.inner_text("#cut .cbub") and E("__spoken.length")==0);pg.click("#cutS");pg.wait_for_timeout(200);E("__rs.setMute(false)")
  # real flow: clear stage 0 -> saved first -> cutscene -> skip -> play stage 1, no companion
  E("localStorage.clear()");pg.reload();pg.wait_for_timeout(500);E("CUT_LINES.forEach(x=>x.line='[JEREMY LINE HERE]')")
  E("__rs.save().seenIntro=true");pg.evaluate("document.getElementById('journeyB').click()");pg.wait_for_timeout(200)
  if pg.is_visible("#comic"):pg.click("#comicS")
  pg.click("#mapGo");pg.wait_for_timeout(200)
  E("__rs.G.p.hp=1e6;__rs.G.p.maxHp=1e6;__rs.G.t=__rs.G.nextBoss-0.05");pg.wait_for_timeout(500)
  for _ in range(80):
    s=E("__rs.state")
    if pg.is_visible("#iniSave"):pg.click("#iniSave")
    if pg.is_visible("#againB"):break
    if s=="lvl":pg.click(".up >> nth=0")
    E("__rs.G&&__rs.G.bossAlive&&(__rs.G.bossAlive.hp=1)")
    pg.wait_for_timeout(300)
  if pg.is_visible("#iniSave"):pg.click("#iniSave")
  pg.click("#againB");pg.wait_for_timeout(300)
  saved=E("__rs.prog().cleared.includes(0)")
  ok("stage clear -> crestview cutscene, progress saved first",E("__rs.state")=="cut" and E("__cutId")=="crestview" and saved,(E("__rs.state"),saved))
  pg.click("#cutS");pg.wait_for_timeout(500)
  ok("skip -> play in stage 2 (Crestview)",E("__rs.state")=="play" and E("__rs.G.stage")==1)
  pg.wait_for_timeout(2500)
  info=E("""(()=>{const e=__rs.ent,bad=[];for(const k in e){if(/pet|dog|comp|ally|follow|friend|surv/i.test(k))bad.push(k)}for(const k in __rs.G){if(/pet|comp|ally|follow|friend|surv/i.test(k))bad.push('G.'+k)}
    const nz=e.z.filter(z=>!(z.type in __rs.ZT)).length;return{bad,nz,tur:e.tur.length}})()""")
  ok("no companion/pet/survivor entity in play afterwards",not info["bad"] and info["nz"]==0 and info["tur"]==0,info)
  ok("no page errors",not errs,errs)
  b.close()
srv.kill()
print(sum(R),"/",len(R))
