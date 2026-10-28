import sys,subprocess,time
from playwright.sync_api import sync_playwright
srv=subprocess.Popen([sys.executable,"-m","http.server","8864"],cwd="/workspace/remy-survivor",stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(1)
O="/workspace/remy-shots-v11/"
with sync_playwright() as p:
  b=p.chromium.launch();pg=b.new_page(viewport={"width":390,"height":844},device_scale_factor=2);E=pg.evaluate;errs=[];pg.on("pageerror",lambda e:errs.append(str(e)))
  pg.goto("http://localhost:8864/");E("localStorage.clear()");pg.reload();pg.wait_for_timeout(400);pg.click("#endlessB");pg.wait_for_timeout(300)
  SET="const G=__rs.G,p=G.p;__rs.ent.z.length=0;G.t=5;p.hp=p.maxHp=1e6;G.order.length=0;window.__botDir=()=>[0,0];"
  E(SET+"window.__c=__rs.spawnZ('charger',p.x+150,p.y-60);__c.dashCd=0");
  for k in range(12):
    pg.wait_for_timeout(60);s=E("[__c.dash||0,__c.tel||0,__c.x|0]")
    if k==3:pg.screenshot(path=O+"charger-rush-telegraph.png")
    if k==9:pg.screenshot(path=O+"charger-rushing.png")
  E(SET+"window.__g=__rs.spawnZ('grabber',p.x+5,p.y);__g.spd=0;p.inv=0");pg.wait_for_timeout(120);print("stun",E("__rs.G.p.stun"));pg.screenshot(path=O+"grabber-holding-player.png")
  print(errs);b.close()
srv.kill()
