# busy-scene frame cost at CPU x4: times each rAF callback (update+render)
import sys,subprocess,time
from playwright.sync_api import sync_playwright
port=sys.argv[1] if len(sys.argv)>1 else "8824";root=sys.argv[2] if len(sys.argv)>2 else "/workspace/remy-survivor"
srv=subprocess.Popen([sys.executable,"-m","http.server",port],cwd=root,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(1)
INIT="""(()=>{const r=window.requestAnimationFrame.bind(window);window.__ft=[];window.requestAnimationFrame=f=>r(t=>{const a=performance.now();f(t);window.__ft.push(performance.now()-a)})})()"""
with sync_playwright() as p:
  b=p.chromium.launch();pg=b.new_page(viewport={"width":915,"height":412},device_scale_factor=2);pg.add_init_script(INIT);E=pg.evaluate
  errs=[];pg.on("pageerror",lambda e:errs.append(str(e)))
  pg.goto("http://localhost:%s/"%port);E("localStorage.clear()");pg.reload();pg.wait_for_timeout(400)
  pg.click("#endlessB");pg.wait_for_timeout(300)
  E("""(()=>{const G=__rs.G,p=G.p;p.hp=p.maxHp=1e9;window.__botDir=()=>[0,0];G.order.length=0;const T=['shamb','runner','bloat','dog','spit','clown','tank'];for(let i=0;i<180;i++){const a=Math.random()*6.28,d=60+Math.random()*380;const z=__rs.spawnZ(T[i%7],p.x+Math.cos(a)*d,p.y+Math.sin(a)*d*.5);if(i%9==0)z.elite=true}__rs.spawnZ('boss',p.x+120,p.y)})()""")
  cdp=pg.context.new_cdp_session(pg);cdp.send("Emulation.setCPUThrottlingRate",{"rate":4})
  pg.wait_for_timeout(1000);E("__ft.length=0");pg.wait_for_timeout(4000)
  ft=sorted(E("__ft"));n=len(ft);zc=E("__rs.ent.z.length")
  print("zombies",zc,"frames",n,"avg_ms %.2f"%(sum(ft)/n),"p95_ms %.2f"%ft[int(n*.95)],"max_ms %.2f"%ft[-1],"errors",errs)
  b.close()
srv.kill()
