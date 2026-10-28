import sys,subprocess,time
from playwright.sync_api import sync_playwright
srv=subprocess.Popen([sys.executable,"-m","http.server","8862"],cwd="/workspace/remy-survivor",stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(1)
O="/workspace/remy-shots-v11/"
with sync_playwright() as p:
  b=p.chromium.launch();pg=b.new_page(viewport={"width":915,"height":412},device_scale_factor=1);errs=[];pg.on("pageerror",lambda e:errs.append(str(e)))
  pg.goto("http://localhost:8862/");pg.wait_for_timeout(500);pg.evaluate("__rs.setMute&&__rs.setMute(true)")
  for i in [int(a) for a in (sys.argv[1:] or range(1,10))]:
    pg.evaluate("window.__townCut(%d,()=>{window.__done=1})"%i);ids=pg.evaluate("[__cutId,__cutBeats,__cutTotal]")
    k=0;t=0
    while True:
      pg.wait_for_timeout(300 if k==0 else 0);t0=pg.evaluate("__cutBeat")
      pg.wait_for_timeout(1600);pg.screenshot(path="/tmp/cs_%d_%d.png"%(i,pg.evaluate("__cutBeat")))
      if pg.evaluate("__cutBeat")>=ids[1]-1:break
      pg.wait_for_function("__cutBeat>%d"%pg.evaluate("__cutBeat"),timeout=9000);k+=1
    print(i,ids)
    pg.click("#cutS")
  print("errs",errs)
  b.close()
srv.kill()
