import sys,subprocess,time
from playwright.sync_api import sync_playwright
srv=subprocess.Popen([sys.executable,"-m","http.server","8871"],cwd="/workspace/remy-survivor",stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(1)
bad=0
with sync_playwright() as p:
  b=p.chromium.launch()
  for (w,h) in [(915,412),(844,390),(740,360),(640,360),(932,430)]:
    pg=b.new_page(viewport={"width":w,"height":h});pg.goto("http://localhost:8871/");pg.wait_for_timeout(400);pg.evaluate("__rs.setMute&&__rs.setMute(true)")
    for i in range(1,10):
      pg.evaluate("window.__townCut(%d)"%i);pg.wait_for_timeout(200)
      r=pg.evaluate("""()=>{const q=s=>document.querySelector('#cut '+s).getBoundingClientRect();const b=q('.cbub'),c=q('.cap'),s=q('#cutS'),pn=q('.cscene');const ov=(a,d)=>!(a.right<=d.left||a.left>=d.right||a.bottom<=d.top||a.top>=d.bottom);return{bub:[b.left|0,b.top|0,b.right|0,b.bottom|0],cap:ov(b,c),skip:ov(b,s),inside:b.left>=pn.left&&b.right<=pn.right&&b.top>=pn.top&&b.bottom<=pn.bottom,hcenter:Math.abs((b.left+b.right)/2-(pn.left+pn.right)/2)<3,h:b.height|0,ph:pn.height|0}}""")
      if r['cap'] or r['skip'] or not r['inside'] or not r['hcenter']: bad+=1;print("BAD",w,h,i,r)
      if w==915: pg.screenshot(path="/tmp/nb_%d.png"%i)
      pg.click("#cutS");pg.wait_for_timeout(120)
    print(w,h,"done last",r)
    pg.close()
  b.close()
print("bad",bad);srv.kill()
