import sys,subprocess,time
from playwright.sync_api import sync_playwright
O="/workspace/remy-shots-v11/"
srv=subprocess.Popen([sys.executable,"-m","http.server","8825"],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(1)
with sync_playwright() as p:
  b=p.chromium.launch();pg=b.new_page(viewport={"width":1100,"height":700});errs=[];pg.on("pageerror",lambda e:errs.append(str(e)));pg.on("console",lambda m:m.type=="error" and errs.append(m.text))
  pg.goto("http://localhost:8825/");pg.wait_for_timeout(500)
  pg.evaluate("""(()=>{const d=document.createElement('canvas');d.width=1100;d.height=700;d.style.cssText='position:fixed;left:0;top:0;z-index:9999';document.body.appendChild(d);const g=d.getContext('2d');g.fillStyle='#4a5040';g.fillRect(0,0,1100,700);g.fillStyle='#e5e5e5';g.font='13px sans-serif';
  const rows=[[1,'TIER 1 basic horde (gaunt)'],[2,'TIER 2 mutated (bulky)'],[3,'TIER 3 boss']];let y=8;
  for(const[t,lab]of rows){const ks=Object.keys(__rs.ZT).filter(k=>__rs.ZT[k].tier===t);g.fillText(lab,10,y+12);let x=10,mh=0;
   for(const k of ks){const fr=__ZS[k],S=t===3?1.25:t===2?1.75:2.2,w=fr[0].width/2*S;g.fillText(k,x,y+28);g.drawImage(fr[0],x,y+30,w,w);g.drawImage(fr[2],x+w*.7,y+30,w,w);
    const rw=fr[0].width/2;g.drawImage(fr[1],x+w*.6,y+30+w-rw,rw,rw);x+=w*1.6+10;mh=Math.max(mh,w)}y+=mh+40}})()""")
  pg.screenshot(path=O+"tiers-contact-sheet.png");print("errs",errs)
  b.close()
srv.kill()
