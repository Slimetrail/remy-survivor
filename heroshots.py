import sys,subprocess,time
from playwright.sync_api import sync_playwright
srv=subprocess.Popen([sys.executable,"-m","http.server","8861"],cwd="/workspace/remy-survivor",stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(1)
O="/workspace/remy-shots-v11/"
with sync_playwright() as p:
  b=p.chromium.launch();pg=b.new_page(viewport={"width":1000,"height":620});errs=[];pg.on("pageerror",lambda e:errs.append(str(e)))
  pg.goto("http://localhost:8861/");pg.wait_for_timeout(500)
  pg.evaluate("""(()=>{const c=document.createElement('canvas');c.width=1000;c.height=620;const g=c.getContext('2d');g.fillStyle='#3a3d33';g.fillRect(0,0,900,560);g.font='bold 15px system-ui';g.fillStyle='#eee';
   const ks=Object.keys(__HS);ks.forEach((k,i)=>{const fr=__HS[k];g.fillText(k,20,40+i*135);fr.forEach((f,j)=>g.drawImage(f,110+j*120,i*135,180,180));
    g.save();g.translate(110+4*120+112,i*135);g.scale(-1,1);g.drawImage(fr[0],0,0,180,180);g.restore()});
   g.fillText('gnome (turret)',740,40);g.drawImage(document.querySelector('canvas')?__rs.SPR&&__rs.SPR.gnome||window.__gn:null,740,50,108,108);
   document.body.innerHTML='';document.body.appendChild(c)})()""") if False else None
  pg.evaluate("""(()=>{const c=document.createElement('canvas');c.width=1000;c.height=620;const g=c.getContext('2d');g.fillStyle='#3a3d33';g.fillRect(0,0,900,560);g.font='bold 15px system-ui';g.fillStyle='#eee';
   const ks=Object.keys(__HS);ks.forEach((k,i)=>{const fr=__HS[k];g.fillText(k,20,60+i*135);fr.forEach((f,j)=>g.drawImage(f,90+j*160,i*135,180,180));
    g.save();g.translate(90+4*160+112,i*135);g.scale(-1,1);g.drawImage(fr[0],0,0,180,180);g.restore()});
   g.fillText('gnome',850,50);g.drawImage(window.__GN,850,60,140,140);g.fillText('frames 1-4 + facing left',90,605);
   document.body.innerHTML='';document.body.style.margin=0;document.body.appendChild(c)})()""")
  pg.screenshot(path=O+"heroes-contact-sheet.png");print(errs)
  b.close()
srv.kill()
