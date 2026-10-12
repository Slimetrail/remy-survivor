"use strict";
// ===== Remy Survivor — original zombie survivor-style game =====
const $=id=>document.getElementById(id);
const cv=$("c"),cx=cv.getContext("2d");let W=390,H=844,DPR=1;
function resize(){DPR=Math.min(2,devicePixelRatio||1);W=innerWidth;H=innerHeight;cv.width=W*DPR;cv.height=H*DPR}
addEventListener("resize",resize);resize();
const rnd=(a,b)=>a+Math.random()*(b-a),ri=(a,b)=>Math.floor(rnd(a,b+1)),pick=a=>a[Math.floor(Math.random()*a.length)];
const LS={get:(k,d)=>{try{const v=localStorage.getItem("rs_"+k);return v==null?d:JSON.parse(v)}catch(e){return d}},set:(k,v)=>localStorage.setItem("rs_"+k,JSON.stringify(v))};
let save=LS.get("save",{coins:0,heroes:["remy"],hero:"remy",shop:{},stage:0,cleared:[],seenIntro:false,mute:false});
const persist=()=>LS.set("save",save);
const DIFF={easy:{n:"🌱 Easy",hp:.7,dmg:.6,spd:.9,sp:.75,coin:1},medium:{n:"🌟 Medium",hp:1,dmg:1,spd:1,sp:1,coin:1.3},hard:{n:"🔥 Hard",hp:1.45,dmg:1.35,spd:1.1,sp:1.25,coin:1.7},brutal:{n:"💀 Brutal",hp:2.1,dmg:1.8,spd:1.2,sp:1.6,coin:2.5}};
if(!save.diff)save.diff="medium";if(!save.prog)save.prog={};
if((save.ver||1)<2){const M=[0,1,2,3,5,6,8,9];for(const k in save.prog){const p=save.prog[k],c=p.cleared.map(i=>M[i]);if(c.includes(5))c.push(4);if(c.includes(8))c.push(7);p.cleared=[...new Set(c)];p.stage=M[p.stage]??0}save.ver=2;LS.set("save",save)}
function prog(){return save.prog[save.diff]||(save.prog[save.diff]={stage:0,cleared:[]})}
const DF=()=>DIFF[(G&&G.df)||save.diff];

// ===== Audio =====
let AC=null;const lastS={};
function ac(){if(!AC){try{AC=new (window.AudioContext||window.webkitAudioContext)()}catch(e){}}if(AC&&AC.state==="suspended"&&!save.mute)AC.resume();return AC}
function hudBtns(on){$("pauseB").classList.toggle("hidden",!on);$("muteHud").classList.toggle("hidden",!on)}
function setMute(v){save.mute=v;persist();if(AC){v?AC.suspend():AC.resume()}const t=v?"🔇":"🔊";$("muteHud").textContent=t;$("muteHud").setAttribute("aria-label",v?"Sound off":"Sound on");$("muteB").textContent=v?"🔇 Sound off":"🔊 Sound on"}
function tone(f1,f2,dur,type,vol,delay=0){const a=AC;if(!a)return;const t=a.currentTime+delay,o=a.createOscillator(),g=a.createGain();o.type=type;o.frequency.setValueAtTime(f1,t);o.frequency.exponentialRampToValueAtTime(Math.max(20,f2),t+dur);g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.001,t+dur);o.connect(g).connect(a.destination);o.start(t);o.stop(t+dur+.02)}
function noise(dur,vol,f=800){const a=AC;if(!a)return;const b=a.createBuffer(1,a.sampleRate*dur,a.sampleRate),d=b.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*(1-i/d.length);const s=a.createBufferSource(),fl=a.createBiquadFilter(),g=a.createGain();fl.type="lowpass";fl.frequency.value=f;g.gain.value=vol;s.buffer=b;s.connect(fl).connect(g).connect(a.destination);s.start()}
function sfx(n){if(save.mute||!AC)return;const now=performance.now();if(lastS[n]&&now-lastS[n]<60)return;lastS[n]=now;
 switch(n){case"squeak":tone(900,1500,.08,"square",.04);break;case"pop":tone(500,120,.1,"triangle",.07);break;case"gem":tone(1200,1800,.05,"sine",.04);break;
 case"toot":tone(110,60,.35,"sawtooth",.08);noise(.3,.05,300);break;case"boing":tone(300,700,.15,"sine",.06);break;case"quack":tone(600,350,.12,"square",.06);tone(500,300,.1,"square",.05,.12);break;
 case"splat":noise(.18,.12,1200);break;case"boom":noise(.4,.2,500);tone(120,40,.4,"sine",.12);break;case"laser":tone(1500,300,.2,"sawtooth",.04);break;
 case"hurt":tone(220,90,.2,"square",.08);break;case"lvl":[523,659,784,1046].forEach((f,i)=>tone(f,f,.12,"triangle",.08,i*.08));break;
 case"boss":tone(80,80,.6,"sawtooth",.1);tone(60,60,.6,"sawtooth",.1,.6);break;case"coin":tone(1300,1300,.05,"square",.03);tone(1750,1750,.08,"square",.03,.05);break;
 case"honk":tone(350,330,.15,"square",.06);break;case"win":[392,523,659,784,659,784,1046].forEach((f,i)=>tone(f,f,.15,"triangle",.09,i*.12));break;
 case"fire":noise(.15,.06,2000);break;case"bubble":tone(400,900,.07,"sine",.04);break;}}

// ===== Data =====
const STAGES=[
 {n:"Niceville, FL",s:"Grandpa's cul-de-sac",g:"#3f6b35",d:"#35602d",x:.08,y:.88,boss:"Coach Chompers",tm:150,deco:"grave"},
 {n:"Crestview / I-10",s:"Traffic jam of the undead",g:"#5b5f55",d:"#4f534a",x:.18,y:.79,boss:"Big Rig Randy",tm:160,deco:"road"},
 {n:"Tallahassee, FL",s:"Campus of the Living Dead",g:"#4d7a3a",d:"#426b31",x:.32,y:.73,boss:"Professor Brainsworth",tm:170,deco:"grave"},
 {n:"Valdosta, GA",s:"Peach orchard panic",g:"#6b7d33",d:"#5d6e2b",x:.44,y:.65,boss:"The Peach Fuzz Monster",tm:180,deco:"peach"},
 {n:"Waycross, GA",s:"Okefenokee Swamp stomp",g:"#3a5a3a",d:"#2f4a30",x:.56,y:.58,boss:"Swamp Thang the Gator King",tm:190,deco:"swamp"},
 {n:"Savannah, GA",s:"Haunted squares (extra haunted)",g:"#3e5e4a",d:"#344f3e",x:.68,y:.47,boss:"Captain Moss-beard",tm:200,deco:"grave"},
 {n:"Charleston, SC",s:"Rainbow Row rumble",g:"#4a6b6b",d:"#3f5c5c",x:.82,y:.36,boss:"Shrimp & Grits Goliath",tm:210,deco:"rainbow"},
 {n:"Kingstree, SC",s:"Tobacco barn throwdown",g:"#7a6a3a",d:"#6a5b30",x:.70,y:.25,boss:"The Burger King-stree",tm:220,deco:"barn"},
 {n:"Florence, SC",s:"Interstate truck-stop terror",g:"#5a6e3d",d:"#4d5f34",x:.56,y:.16,boss:"Mega Mall Santa",tm:230,deco:"road"},
 {n:"Pamplico, SC",s:"HOME. Mom, Dad & Leo are inside!",g:"#3b6e2c",d:"#325e25",x:.82,y:.07,boss:"The Mayor of Zombietown",tm:240,deco:"grave"}];
const LAST=STAGES.length-1;
[[0, 46, "center"], [0, -32, "center"], [28, 7, "left"], [-28, 7, "right"], [28, 7, "left"], [-32, 7, "right"], [-28, 7, "right"], [-28, 7, "right"], [-28, 7, "right"], [0, -34, "center"]].forEach((l,i)=>STAGES[i].lab=l);
const W8={ // weapons
 chicken:{n:"Rubber Chicken Launcher",i:"🐔",d:"Fires squeaky chickens at the closest zombie.",f:"\"BAWK!\" — Grandpa's secret weapon.",evo:"spicy",en:"Rotisserie Rocket Rooster",ei:"🍗",ef:"Chickens now EXPLODE. Grandpa would be so proud."},
 banana:{n:"Banana Boomerang",i:"🍌",d:"Bananas swing out, smack everything, and come back.",f:"Potassium-powered justice.",evo:"sneakers",en:"Banana Split-nado",ei:"🍨",ef:"Six bananas. Zero chill."},
 whoopee:{n:"Whoopee Cushion Shockwave",i:"💨",d:"A toot blast knocks back nearby zombies.",f:"Excuse you. EXCUSE YOU.",evo:"disco",en:"Thunder Toot 3000",ei:"🌪️",ef:"Registered as a natural disaster in 3 states."},
 plunger:{n:"Spinning Toilet Plungers",i:"🪠",d:"Plungers orbit you, bonking zombies.",f:"Freshly used? Don't ask.",evo:"wrap",en:"Plunger-nado of Porcelain Doom",ei:"🚽",ef:"Brings a whole new meaning to 'flush them out'."},
 gnome:{n:"Garden Gnome Turret",i:"🍄",d:"Drops a grumpy gnome that pelts zombies with pebbles.",f:"He hates zombies. He hates you a little too.",evo:"coffee",en:"Gnome Depot Grand Opening",ei:"🏪",ef:"Gnomes on espresso. God help us all."},
 duck:{n:"Rubber Duck Mines",i:"🦆",d:"Leaves ducks behind that go KA-QUACK.",f:"Bath time is OVER.",evo:"sock",en:"Quackpocalypse Armada",ei:"🛁",ef:"Lucky ducks. Unlucky zombies."},
 pie:{n:"Pie Launcher",i:"🥧",d:"Lobs cream pies that splat an area and slow zombies.",f:"Comedy's oldest weapon.",evo:"catfood",en:"Grandma's Thanksgiving Pie-pocalypse",ei:"🎂",ef:"Every pie is a family recipe. The family is angry."},
 bubble:{n:"Bubble Wand",i:"🫧",d:"Floaty bubbles pop zombies and slow them down.",f:"So pretty. So deadly.",evo:"disco",en:"Bubble Trouble Foam Party",ei:"🪩",ef:"The undead now have to dance AND die."},
 kitty:{n:"Laser Kitty",i:"🐱",d:"A cat shoots eye lasers at zombies. Obviously.",f:"Pew pew, meow meow.",evo:"tinfoil",en:"Cosmic Meowtrix Prime",ei:"😼",ef:"The cat has contacted the mothership."},
 flip:{n:"Flaming Flip-Flops",i:"🩴",d:"Spinning flip-flops that leave fire puddles.",f:"Mom's sandal, now on fire.",evo:"spicy",en:"The Chancla of Destiny",ei:"🔥",ef:"Every zombie fears its power. Every kid does too."}};
const WK=Object.keys(W8);
const PS={ // passives
 spicy:{n:"Extra Spicy Hot Sauce",i:"🌶️",d:"+12% damage",f:"Your sweat is now a weapon."},
 sneakers:{n:"Grandma's Sneakers",i:"👟",d:"+10% move speed",f:"Light-up soles. Velcro straps. Pure speed."},
 tinfoil:{n:"Tinfoil Hat",i:"🛸",d:"+35% gem magnet range",f:"The gems can't hide their thoughts from you."},
 catfood:{n:"Cat Food Diet",i:"🥫",d:"+0.5 HP regen per second",f:"Tastes like tuna. Heals like magic."},
 disco:{n:"Disco Fever",i:"🕺",d:"+12% weapon area",f:"Your aura is now groovy and hostile."},
 coffee:{n:"Too Much Coffee",i:"☕",d:"-8% weapon cooldowns",f:"You can hear colors now."},
 sock:{n:"Lucky Sock",i:"🧦",d:"+6% crit chance, +15% coins",f:"Never washed. Never lost."},
 wrap:{n:"Bubble Wrap Onesie",i:"🎽",d:"+1 armor, +15 max HP",f:"Pop pop pop pop pop."}};
const PK=Object.keys(PS);
const HEROES={
 remy:{n:"Remy",i:"🧢",c:"#3b82f6",hp:100,spd:150,w:"chicken",cost:0,d:"Teen on a mission: get home to Mom, Dad & Leo."},
 gus:{n:"Grandpa Gus",i:"👴",c:"#a3a3a3",hp:150,spd:128,w:"plunger",cost:250,armor:1,d:"Slow, tough, and VERY opinionated. Starts with plungers."},
 tina:{n:"Turbo Tina",i:"🛹",c:"#ec4899",hp:80,spd:190,w:"banana",cost:500,d:"Remy's skater cousin. Fast, fragile, bananas."},
 dee:{n:"DJ Dee",i:"🎧",c:"#a855f7",hp:100,spd:150,w:"whoopee",cost:800,area:.2,d:"Drops beats AND toots. +20% area."}};
const SHOP={hp:{n:"Thicc Skin",i:"❤️",d:"+10 max HP",m:5,c:60},dmg:{n:"Angry Eyebrows",i:"😠",d:"+6% damage",m:5,c:80},spd:{n:"Zoomies",i:"💨",d:"+4% speed",m:5,c:60},
 mag:{n:"Pocket Magnet",i:"🧲",d:"+15% pickup range",m:5,c:50},greed:{n:"Piggy Bank",i:"🐷",d:"+10% coins",m:5,c:70},rev:{n:"Extra Life Juice Box",i:"🧃",d:"Revive once per run",m:1,c:400}};
const ZT={ // zombie types
 shamb:{r:13,hp:12,spd:42,dmg:8,xp:1,c:"#7fb069",t:0},
 runner:{r:11,hp:9,spd:85,dmg:7,xp:1,c:"#a3c95a",t:35},
 bloat:{r:20,hp:34,spd:30,dmg:12,xp:3,c:"#9b7fb0",t:60},
 dog:{r:10,hp:10,spd:120,dmg:6,xp:1,c:"#8d6e4c",t:80},
 clown:{r:13,hp:22,spd:60,dmg:9,xp:2,c:"#e8e8e8",t:110},
 tank:{r:18,hp:90,spd:38,dmg:15,xp:5,c:"#6d8f5a",t:140},
 boss:{r:42,hp:650,spd:60,dmg:18,xp:40,c:"#557a46",t:9e9}};

// ===== State =====
let G=null,state="title";
const ent={z:[],b:[],gem:[],part:[],txt:[],zone:[],tur:[],beam:[],item:[]};
function shopLv(k){return save.shop[k]||0}
function newRun(mode){const h=HEROES[save.hero];const st=mode==="journey"?prog().stage:-1;
 G={mode,stage:st,t:0,kills:0,lvl:1,xp:0,xpN:3,coins:0,shake:0,spawnAcc:0,bossN:0,bossAlive:null,nextBoss:st>=0?STAGES[st].tm:150,won:false,revive:shopLv("rev")>0,
  p:{x:0,y:0,r:14,hp:0,maxHp:h.hp+shopLv("hp")*10,spd:h.spd*(1+shopLv("spd")*.04),armor:h.armor||0,inv:0,face:1,dx:1,dy:0,walk:0},
  w:{},ps:{},order:[],banner:null,bannerT:0,dmgMul:1+shopLv("dmg")*.06,magBase:1+shopLv("mag")*.15,hero:save.hero,diff:st>=0?1+st*.17:1,df:save.diff};
 G.p.hp=G.p.maxHp;for(const k in ent)ent[k].length=0;addWeapon(h.w);
 G.banner=st>=0?"📍 "+STAGES[st].n:"♾️ Endless Mode";G.bannerT=3}
function stat(){const p=G.ps,h=HEROES[G.hero];return{dmg:G.dmgMul*(1+.12*(p.spicy||0)),spd:1+.1*(p.sneakers||0),mag:90*G.magBase*(1+.35*(p.tinfoil||0)),regen:.5*(p.catfood||0),
 area:(1+(h.area||0))*(1+.12*(p.disco||0)),cd:Math.pow(.92,p.coffee||0),crit:.05+.06*(p.sock||0),coin:(1+.15*(p.sock||0))*(1+shopLv("greed")*.1)}}
function addWeapon(k){G.w[k]={lv:1,cd:0,evo:false,a:0};G.order.push(k)}

// ===== Input: floating joystick =====
const joy={on:false,id:null,bx:0,by:0,x:0,y:0};const keys={};
cv.addEventListener("pointerdown",e=>{ac();if(state!=="play")return;joy.on=true;joy.id=e.pointerId;joy.bx=joy.x=e.clientX;joy.by=joy.y=e.clientY;try{cv.setPointerCapture(e.pointerId)}catch(_){}});
cv.addEventListener("pointermove",e=>{if(joy.on&&e.pointerId===joy.id){joy.x=e.clientX;joy.y=e.clientY}});
const jend=e=>{if(e.pointerId===joy.id)joy.on=false};cv.addEventListener("pointerup",jend);cv.addEventListener("pointercancel",jend);
addEventListener("keydown",e=>{keys[e.key.toLowerCase()]=1;if((e.key==="Escape"||e.key==="p")&&state==="play")pause()});addEventListener("keyup",e=>keys[e.key.toLowerCase()]=0);
function inputDir(){if(window.__botDir)return window.__botDir();let x=0,y=0;if(joy.on){x=joy.x-joy.bx;y=joy.y-joy.by;const d=Math.hypot(x,y);if(d<6)return[0,0];const m=Math.min(1,d/50);return[x/d*m,y/d*m]}
 if(keys.a||keys.arrowleft)x--;if(keys.d||keys.arrowright)x++;if(keys.w||keys.arrowup)y--;if(keys.s||keys.arrowdown)y++;const d=Math.hypot(x,y);return d?[x/d,y/d]:[0,0]}

// ===== Pools =====
const pools={};function obtain(kind){const pl=pools[kind]||(pools[kind]=[]);return pl.pop()||{}}
function release(kind,arr,i){const o=arr[i];arr[i]=arr[arr.length-1];arr.pop();(pools[kind]||(pools[kind]=[])).push(o)}

// ===== Sprites (pre-rendered) =====
const SPR={};
function mkSpr(key,size,fn){const c=document.createElement("canvas");c.width=c.height=size*2;const g=c.getContext("2d");g.scale(2,2);fn(g,size/2);SPR[key]=c}
function zFace(g,c,r,col,eye="#fff"){g.fillStyle=col;g.strokeStyle="#000";g.lineWidth=2;g.beginPath();g.arc(c,c,r,0,7);g.fill();g.stroke();
 g.fillStyle=eye;g.beginPath();g.arc(c-r*.35,c-r*.2,r*.28,0,7);g.arc(c+r*.38,c-r*.15,r*.2,0,7);g.fill();g.fillStyle="#000";g.beginPath();g.arc(c-r*.3,c-r*.15,r*.11,0,7);g.arc(c+r*.4,c-r*.1,r*.09,0,7);g.fill();
 g.beginPath();g.moveTo(c-r*.4,c+r*.4);for(let i=0;i<=4;i++)g.lineTo(c-r*.4+i*r*.2,c+r*(i%2?.3:.45));g.stroke()}
function buildSprites(){
 for(const k in ZT){const z=ZT[k],s=Math.ceil(z.r*2+16);mkSpr("z_"+k,s,(g,c)=>{const r=z.r;
  if(k==="dog"){g.fillStyle=z.c;g.strokeStyle="#000";g.lineWidth=2;g.beginPath();g.ellipse(c,c+2,r*1.3,r*.85,0,0,7);g.fill();g.stroke();g.beginPath();g.moveTo(c-r,c-r*.4);g.lineTo(c-r*.6,c-r*1.4);g.lineTo(c-r*.2,c-r*.5);g.moveTo(c+r,c-r*.4);g.lineTo(c+r*.6,c-r*1.4);g.lineTo(c+r*.2,c-r*.5);g.fill();g.stroke();
   g.fillStyle="#ff0";g.beginPath();g.arc(c-r*.4,c-r*.1,r*.2,0,7);g.arc(c+r*.4,c-r*.1,r*.2,0,7);g.fill();g.fillStyle="#f472b6";g.fillRect(c-r*.15,c+r*.4,r*.3,r*.6);return}
  zFace(g,c,r,z.c,k==="runner"?"#fde047":"#fff");
  if(k==="bloat"){g.fillStyle="#c4b5fd88";for(let i=0;i<4;i++){g.beginPath();g.arc(c+rnd(-r*.6,r*.6),c+rnd(0,r*.6),3,0,7);g.fill()}}
  if(k==="tank"){g.fillStyle="#b91c1c";g.beginPath();g.arc(c,c-2,r+2,Math.PI*1.02,Math.PI*1.98);g.lineTo(c+r+2,c);g.fill();g.stroke();g.strokeStyle="#fff";g.lineWidth=3;g.beginPath();g.moveTo(c,c-r-1);g.lineTo(c,c-r*.4);g.stroke();g.strokeStyle="#ccc";g.beginPath();g.moveTo(c-r*.6,c+r*.1);g.lineTo(c+r*.6,c+r*.1);g.stroke()}
  if(k==="clown"){const cols=["#ef4444","#f59e0b","#3b82f6","#22c55e"];for(let i=0;i<6;i++){g.fillStyle=cols[i%4];g.beginPath();g.arc(c+(i-2.5)*r*.4,c-r*.85+Math.abs(i-2.5)*2,r*.32,0,7);g.fill()}g.fillStyle="#ef4444";g.beginPath();g.arc(c,c+r*.1,r*.22,0,7);g.fill()}
  if(k==="boss"){g.fillStyle="#facc15";g.strokeStyle="#000";g.beginPath();g.moveTo(c-r*.6,c-r*.8);g.lineTo(c-r*.5,c-r*1.25);g.lineTo(c-r*.2,c-r*.95);g.lineTo(c,c-r*1.35);g.lineTo(c+r*.2,c-r*.95);g.lineTo(c+r*.5,c-r*1.25);g.lineTo(c+r*.6,c-r*.8);g.closePath();g.fill();g.stroke()}
 })}
 for(const k in HEROES){const h=HEROES[k];mkSpr("h_"+k,44,(g,c)=>{g.fillStyle="#fcd9b6";g.strokeStyle="#000";g.lineWidth=2;g.beginPath();g.arc(c,c+2,13,0,7);g.fill();g.stroke();
  g.fillStyle=h.c;if(k==="gus"){g.fillStyle="#eee";g.beginPath();g.arc(c-10,c-2,5,0,7);g.arc(c+10,c-2,5,0,7);g.fill()}else{g.beginPath();g.arc(c,c-2,14,Math.PI,0);g.fill();g.stroke();g.fillRect(c,c-4,18,5)}
  g.fillStyle="#000";g.beginPath();g.arc(c-5,c+2,2.2,0,7);g.arc(c+5,c+2,2.2,0,7);g.fill();g.beginPath();g.arc(c,c+6,5,.2,Math.PI-.2);g.stroke();
  if(k==="tina"){g.fillStyle="#ec4899";g.fillRect(c-16,c-6,6,18)}if(k==="dee"){g.strokeStyle="#111";g.lineWidth=4;g.beginPath();g.arc(c,c,15,Math.PI*1.1,Math.PI*1.9);g.stroke()}})}
 const em=["🐔","🍌","🪠","🦆","🥧","🩴","🍗","🪙","🍕","🧲","🎁","🐱","😼","🍨","🔥","🧀"];
 for(const e of em)mkSpr("e_"+e,36,(g,c)=>{g.font="26px serif";g.textAlign="center";g.textBaseline="middle";g.fillText(e,c,c+1)});
 mkSpr("gnome",34,(g,c)=>{g.fillStyle="#2563eb";g.strokeStyle="#000";g.lineWidth=1.5;g.fillRect(c-7,c+2,14,10);g.strokeRect(c-7,c+2,14,10);g.fillStyle="#fcd9b6";g.beginPath();g.arc(c,c,6,0,7);g.fill();g.fillStyle="#fff";g.beginPath();g.moveTo(c-7,c+1);g.lineTo(c,c+12);g.lineTo(c+7,c+1);g.fill();
  g.fillStyle="#dc2626";g.beginPath();g.moveTo(c-8,c-2);g.lineTo(c,c-16);g.lineTo(c+8,c-2);g.closePath();g.fill();g.stroke();g.fillStyle="#000";g.fillRect(c-3,c-2,2,2);g.fillRect(c+1,c-2,2,2)});
 // ground tiles per stage
 STAGES.forEach((s,i)=>{const t=document.createElement("canvas");t.width=t.height=160;const g=t.getContext("2d");g.fillStyle=s.g;g.fillRect(0,0,160,160);g.fillStyle=s.d;for(let j=0;j<40;j++){g.fillRect(Math.random()*160,Math.random()*160,3,6)}
  g.fillStyle="#0002";g.beginPath();g.arc(40,120,9,0,7);g.fill();const D=s.deco;
  if(D==="road"){g.fillStyle="#ddd8";g.fillRect(0,78,160,4);for(let x=0;x<160;x+=40)g.fillRect(x,40,20,3)}
  if(D==="grave"){g.fillStyle="#9ca3af";g.fillRect(110,30,14,18);g.beginPath();g.arc(117,30,7,Math.PI,0);g.fill();g.fillStyle="#0005";g.fillRect(114,34,6,2)}
  if(D==="peach"){g.fillStyle="#fb923c";for(const[x,y]of[[30,30],[120,100],[70,140]]){g.beginPath();g.arc(x,y,6,0,7);g.fill()}g.fillStyle="#4d7c0f";g.fillRect(118,92,4,4)}
  if(D==="swamp"){g.fillStyle="#1e3a3a";g.beginPath();g.ellipse(50,50,34,18,0,0,7);g.ellipse(125,125,24,13,0,0,7);g.fill();g.fillStyle="#65a30d";g.beginPath();g.arc(42,46,5,0,7);g.arc(60,55,4,0,7);g.fill();g.strokeStyle="#4b3621";g.lineWidth=3;g.beginPath();g.moveTo(130,20);g.lineTo(130,55);g.moveTo(130,30);g.lineTo(140,22);g.stroke()}
  if(D==="rainbow"){["#f9a8d4","#fde68a","#a5f3fc","#bbf7d0"].forEach((c,j)=>{g.fillStyle=c+"55";g.fillRect(j*40,0,40,12)})}
  if(D==="barn"){g.fillStyle="#991b1b";g.fillRect(100,30,34,24);g.beginPath();g.moveTo(96,30);g.lineTo(117,14);g.lineTo(138,30);g.fill();g.fillStyle="#fef3c7";g.fillRect(113,40,8,14);g.fillStyle="#d9b25a";g.fillRect(30,110,18,12)}
  SPR["g"+i]=t})}

// ===== Spawning =====
function spawnZ(type,x,y,boss){const z=obtain("z"),T=ZT[type];const sc=G.mode==="journey"?G.diff:1,tm=1+G.t/100;
 const D=DF();Object.assign(z,{type,x,y,r:T.r,hp:T.hp*tm*sc*D.hp*(boss?1+G.bossN*.6:1),spd:T.spd*rnd(.9,1.1)*(type==="boss"?1:Math.min(1.5,1+G.t/900))*D.spd,dmg:T.dmg*(1+G.t/400)*D.dmg,xp:T.xp,flash:0,kx:0,ky:0,slow:0,wob:Math.random()*6,dash:0,dashCd:3,name:boss||""});
 z.stageBoss=false;if(boss&&G.mode==="journey"&&!G.stageBossSpawned){z.stageBoss=true;G.stageBossSpawned=true;G.stageBossName=boss}z.max=z.hp;z.hit=z.hit||{};for(const k in z.hit)z.hit[k]=0;ent.z.push(z);return z}
function edgePt(m=30){const p=G.p,hw=W/2+m,hh=H/2+m,per=2*(hw+hh),r=Math.random()*per;let x,y;if(r<2*hw){x=r-hw;y=Math.random()<.5?-hh:hh}else{y=r-2*hw-hh;x=Math.random()<.5?-hw:hw}return[p.x+x,p.y+y]}
function waves(){const t=G.t,p=G.p;G.waveI=G.waveI||0;
 if(G.waveI===0&&t>1.2){G.waveI=1;const n=30;for(let i=0;i<n;i++){const a=i/n*Math.PI*2;spawnZ(i%5===0?"runner":"shamb",p.x+Math.cos(a)*(W/2+25),p.y+Math.sin(a)*(H/2+25))}G.banner="🧟 THEY'RE EVERYWHERE!";G.bannerT=2;sfx("boss");G.shake=6}
 if(G.waveI===1&&t>14){G.waveI=2;const[hx,hy]=edgePt();for(let i=0;i<14;i++)spawnZ("runner",hx+rnd(-40,40),hy+rnd(-40,40));G.banner="🏃 Runner pack!";G.bannerT=1.5}
 if(G.waveI===2&&t>32){G.waveI=3;const n=36;for(let i=0;i<n;i++){const a=i/n*Math.PI*2;spawnZ(i%6===0?"dog":"shamb",p.x+Math.cos(a)*(W/2+25),p.y+Math.sin(a)*(H/2+25))}G.banner="🧟 Surrounded!";G.bannerT=1.5}}
function spawnTick(dt){if(G.won)return;const t=G.t;waves();if(G.bossAlive&&ent.z.length>120)return;
 const rate=(2.0+t/45)*(G.mode==="journey"?(G.stage<2?.62:.75)+G.stage*.09:1.1);G.spawnAcc+=dt*Math.min(rate*DF().sp,36);
 while(G.spawnAcc>=1&&ent.z.length<Math.min(330,90+t*.6)){G.spawnAcc--;
  const pool=Object.keys(ZT).filter(k=>ZT[k].t<=t+(G.mode==="journey"?G.stage*11:0));
  let type="shamb";const r=Math.random();if(r<.45)type="shamb";else type=pick(pool);
  if(Math.random()<.004*Math.min(1,t/60)){const[hx,hy]=edgePt();for(let i=0;i<10;i++)spawnZ(t>80?"dog":"runner",hx+rnd(-30,30),hy+rnd(-30,30))} // horde!
  const[ex,ey]=edgePt();spawnZ(type,ex,ey)}
 if(t>=G.nextBoss&&!G.bossAlive){const nm=G.mode==="journey"?STAGES[G.stage].boss:pick(["Big Gulp Gary","Principal Brains","Mega Mall Santa","Sir Moans-a-Lot","Grill Master Ghoul"]);
  const a=Math.random()*7;G.bossAlive=spawnZ("boss",G.p.x+Math.cos(a)*380,G.p.y+Math.sin(a)*380,nm);G.bossN++;G.banner=(G.mode==="journey"?"⚠️ STAGE BOSS: ":"⚠️ BOSS: ")+nm;G.bannerT=3;sfx("boss");G.shake=12;
  G.nextBoss=G.mode==="journey"?1e9:G.t+150}}

// ===== Damage =====
function txt(x,y,s,c){if(ent.txt.length>70)return;const o=obtain("txt");Object.assign(o,{x,y,s,c,l:.7});ent.txt.push(o)}
function parts(x,y,n,c,sp=120){for(let i=0;i<n&&ent.part.length<450;i++){const o=obtain("part"),a=Math.random()*7,v=rnd(20,sp);Object.assign(o,{x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,l:rnd(.3,.7),c,r:rnd(2,5)});ent.part.push(o)}}
function hurt(z,dmg,key,kb,ox,oy,cdT){if(z.hp<=0)return false;if(key&&cdT){if(G.t-(z.hit[key]||-9)<cdT)return false;z.hit[key]=G.t}
 const S=stat();let d=dmg*S.dmg,cr=Math.random()<S.crit;if(cr)d*=2;z.hp-=d;z.flash=.1;
 if(kb&&z.type!=="boss"){const dx=z.x-ox,dy=z.y-oy,l=Math.hypot(dx,dy)||1,m=z.type==="tank"?.3:1;z.kx+=dx/l*kb*m;z.ky+=dy/l*kb*m}
 txt(z.x,z.y-z.r,Math.round(d)+(cr?"!":""),cr?"#facc15":"#fff");if(z.hp<=0)killZ(z);return true}
function aoe(x,y,r,dmg,key,kb,cdT){for(let i=ent.z.length-1;i>=0;i--){const z=ent.z[i];if(z.hp>0&&(z.x-x)**2+(z.y-y)**2<(r+z.r)**2)hurt(z,dmg,key,kb,x,y,cdT)}}
function killZ(z){G.kills++;const col=z.type==="clown"?"#f472b6":z.type==="bloat"?"#a78bfa":"#84cc16";parts(z.x,z.y,z.type==="boss"?40:7,col);sfx("pop");
 dropGem(z.x,z.y,z.xp);const S=stat();if(Math.random()<.035*S.coin)item(z.x+8,z.y,"coin");if(Math.random()<.004)item(z.x,z.y,"pizza");if(Math.random()<.0015)item(z.x,z.y,"magnet");
 if(z.type==="clown"){sfx("honk");parts(z.x,z.y,10,pick(["#ef4444","#3b82f6","#facc15"]),200)}
 if(z.type==="bloat"){sfx("splat");parts(z.x,z.y,18,"#a78bfa",220);const zn=zone(z.x,z.y,55,1.2,0,"goo");G.shake=Math.max(G.shake,4);
  if(Math.hypot(G.p.x-z.x,G.p.y-z.y)<60)hitPlayer(8);setTimeout(()=>{if(G)aoe(z.x,z.y,60,25,"burst",60)},0)}
 if(z.type==="boss"){G.bossAlive=null;G.shake=20;sfx("boom");for(let i=0;i<12;i++)item(z.x+rnd(-50,50),z.y+rnd(-50,50),"coin");item(z.x,z.y,"chest");ent.item[ent.item.length-1].pull=true;ent.gem.forEach(g=>g.pull=true);txt(z.x,z.y-50,"BOSS DEFEATED!","#facc15");
  if(z.stageBoss)stageClear()}
 z.hp=0}
function stageClear(){if(!G||G.mode!=="journey"||G.won)return;G.won=true;G.wonT=2.2;G.p.inv=1e9;G.p.hp=Math.max(G.p.hp,1);G.banner="🎉 "+STAGES[G.stage].n+" CLEARED!";G.bannerT=3;sfx("win");
 for(const z of ent.z){if(z.hp>0&&!z.stageBoss){parts(z.x,z.y,4,"#84cc16");z.hp=0}}}
function dropGem(x,y,v){if(ent.gem.length>400){const g=ent.gem[Math.floor(Math.random()*ent.gem.length)];g.v+=v;return}const g=obtain("gem");Object.assign(g,{x,y,v,pull:false});ent.gem.push(g)}
function item(x,y,k){const o=obtain("item");Object.assign(o,{x,y,k,l:30,pull:false});ent.item.push(o)}
function zone(x,y,r,l,dmg,k,slow=0){const o=obtain("zone");Object.assign(o,{x,y,r,l,ml:l,dmg,k,slow});ent.zone.push(o);return o}
function hitPlayer(d){const p=G.p;if(p.inv>0||G.won)return;d=Math.max(1,d-p.armor);p.hp-=d;p.inv=.5;for(const z of ent.z){if(z.hp>0&&z.type!=="boss"){const dx=z.x-p.x,dy=z.y-p.y,dd=dx*dx+dy*dy;if(dd<70*70){const l=Math.sqrt(dd)||1;z.kx+=dx/l*90;z.ky+=dy/l*90}}}G.shake=Math.max(G.shake,6);sfx("hurt");txt(p.x,p.y-20,"-"+Math.round(d),"#f87171");
 if(p.hp<=0){if(G.revive){G.revive=false;p.hp=p.maxHp*.5;p.inv=2;G.banner="🧃 Juice box revive!";G.bannerT=2;aoe(p.x,p.y,250,999,"rev",200)}else endRun(false)}}
function nearestN(x,y,n,maxD=900){const out=[];for(const z of ent.z){if(z.hp<=0)continue;const d=(z.x-x)**2+(z.y-y)**2;if(d>maxD*maxD)continue;out.push([d,z])}out.sort((a,b)=>a[0]-b[0]);return out.slice(0,n).map(o=>o[1])}
function nearest(x,y,maxD=1e9){let b=null,bd=maxD*maxD;for(const z of ent.z){if(z.hp<=0)continue;const d=(z.x-x)**2+(z.y-y)**2;if(d<bd){bd=d;b=z}}return b}
function bullet(o){const b=obtain("b");b.hits=b.hits||[];b.hits.length=0;Object.assign(b,{spin:0,ret:0,pierce:1,l:2,kb:30,gx:0,gy:0,t:0,slow:0},o);ent.b.push(b);return b}

// ===== Weapons =====
function wUpdate(dt){const p=G.p,S=stat();for(const k of G.order){const w=G.w[k],L=w.lv,E=w.evo;w.cd-=dt;w.a+=dt;
 switch(k){
 case"chicken":if(w.cd<=0){w.cd=(E?.25:.4-L*.02)*S.cd;const n=(L>=3?2:1)+(L>=5?1:0)+(E?1:0);G.shots=(G.shots||0)+n;const ts=nearestN(p.x,p.y,n,Math.max(W,H)/2+20);for(let i=0;i<n;i++){const t=ts[i%Math.max(1,ts.length)];if(!t&&i>0)break;const a=t?Math.atan2(t.y-p.y,t.x-p.x)+(ts.length<n&&i?(i%2?.15:-.15):0):Math.atan2(p.dy,p.dx);
   bullet({k:"chicken",x:p.x,y:p.y,vx:Math.cos(a)*460,vy:Math.sin(a)*460,r:9,dmg:8+L*3+(E?10:0),pierce:1+Math.floor(L/3),spr:E?"🍗":"🐔",ex:E?55*S.area:0,kb:45})}sfx("squeak")}break;
 case"banana":if(w.cd<=0){w.cd=(E?1.1:1.8-L*.1)*S.cd;const n=(E?6:1+Math.floor((L-1)/2));const bt=nearest(p.x,p.y,600),base=bt?Math.atan2(bt.y-p.y,bt.x-p.x):Math.atan2(p.dy,p.dx);for(let i=0;i<n;i++){const a=base+i*Math.PI*2/n*(E?1:.35)-(E?0:(n-1)*.17);
   bullet({k:"banana",x:p.x,y:p.y,vx:Math.cos(a)*360,vy:Math.sin(a)*360,ax:-Math.cos(a)*360,ay:-Math.sin(a)*360,r:12*S.area,dmg:8+L*3+(E?12:0),pierce:999,l:2,spr:E?"🍨":"🍌",spin:1})}sfx("boing")}break;
 case"whoopee":if(w.cd<=0){w.cd=(E?.9:1.6-L*.1)*S.cd;const R=(65+L*10+(E?50:0))*S.area;aoe(p.x,p.y,R,6+L*3+(E?10:0),null,E?110:70);zone(p.x,p.y,R,.35,0,"toot");sfx("toot");if(E)G.shake=Math.max(G.shake,3)}break;
 case"plunger":{const n=Math.min(6,1+L+(E?2:0)),R=(70+L*4+(E?20:0))*S.area,sp=(2.6+L*.2+(E?1.5:0));w.n=n;w.R=R;w.ang=(w.ang||0)+sp*dt;
   for(let i=0;i<n;i++){const a=w.ang+i*Math.PI*2/n,x=p.x+Math.cos(a)*R,y=p.y+Math.sin(a)*R;for(const z of ent.z){if(z.hp>0&&(z.x-x)**2+(z.y-y)**2<(z.r+12)**2&&hurt(z,7+L*3+(E?12:0),"pl",40,p.x,p.y,.45))sfx("boing")}}}break;
 case"gnome":if(w.cd<=0){w.cd=(E?3:6.5-L*.5)*S.cd;const n=E?3:1;for(let i=0;i<n;i++){const o=obtain("tur");Object.assign(o,{x:p.x+rnd(-40,40),y:p.y+rnd(-40,40),l:8+L,cd:0,rate:E?.22:.6-L*.05,dmg:5+L*2+(E?5:0)});ent.tur.push(o)}}break;
 case"duck":if(w.cd<=0){w.cd=(E?.5:1.6-L*.15)*S.cd;const n=E?3:1;for(let i=0;i<n;i++)bullet({k:"duck",x:p.x+rnd(-20,20)-p.dx*20,y:p.y+rnd(-20,20)-p.dy*20,vx:0,vy:0,r:12,dmg:22+L*9+(E?20:0),l:12,spr:"🦆",ex:(55+L*5)*S.area*(E?1.4:1)})}break;
 case"pie":if(w.cd<=0){w.cd=(E?.8:2-L*.15)*S.cd;const n=1+Math.floor(L/3)+(E?2:0);for(let i=0;i<n;i++){const t=pick(ent.z.filter(z=>z.hp>0&&Math.abs(z.x-p.x)<W/2&&Math.abs(z.y-p.y)<H/2).slice(0,40))||{x:p.x+rnd(-150,150),y:p.y+rnd(-150,150)};
   bullet({k:"pie",x:p.x,y:p.y,sx:p.x,sy:p.y,gx:t.x,gy:t.y,vx:0,vy:0,r:0,l:.65,ml:.65,dmg:14+L*6+(E?15:0),spr:"🥧",ex:(50+L*5)*S.area*(E?1.3:1),heal:E})}}break;
 case"bubble":if(w.cd<=0){w.cd=(E?.25:1-L*.08)*S.cd;const n=E?2:1;for(let i=0;i<n;i++){const a=Math.random()*7;bullet({k:"bubble",x:p.x,y:p.y,vx:Math.cos(a)*90,vy:Math.sin(a)*90,r:(10+L*2)*S.area,dmg:6+L*2.5+(E?6:0),pierce:3+L,l:4,slow:1.5})}sfx("bubble")}break;
 case"kitty":if(w.cd<=0){w.cd=(E?1:2.6-L*.2)*S.cd;const n=E?4:1+Math.floor(L/3);for(let i=0;i<n;i++){const t=nearest(p.x,p.y,900);const a=t&&i===0?Math.atan2(t.y-p.y,t.x-p.x):Math.random()*7,len=420,wd=(10+L*2)*S.area*(E?1.6:1);
   const bm=obtain("beam");Object.assign(bm,{x:p.x,y:p.y-26,a,len,wd,l:.3});ent.beam.push(bm);const ca=Math.cos(a),sa=Math.sin(a);
   for(const z of ent.z){if(z.hp<=0)continue;const rx=z.x-bm.x,ry=z.y-bm.y,along=rx*ca+ry*sa,perp=Math.abs(-rx*sa+ry*ca);if(along>0&&along<len&&perp<wd+z.r)hurt(z,16+L*7+(E?20:0),null,20,bm.x,bm.y)}}sfx("laser")}break;
 case"flip":if(w.cd<=0){w.cd=(E?.7:1.5-L*.1)*S.cd;const n=1+Math.floor(L/2)+(E?2:0);const ft=nearestN(p.x,p.y,n,700);for(let i=0;i<n;i++){const t=ft[i];const a=t?Math.atan2(t.y-p.y,t.x-p.x)+rnd(-.2,.2):Math.random()*7;bullet({k:"flip",x:p.x,y:p.y,vx:Math.cos(a)*300,vy:Math.sin(a)*300,r:11,dmg:10+L*3+(E?8:0),pierce:2,l:.8,spr:"🩴",spin:1,fire:(30+L*4)*S.area*(E?1.4:1),fd:3+L+(E?6:0)})}sfx("fire")}break;}}}
function bUpdate(dt){const S=stat();
 for(let i=ent.b.length-1;i>=0;i--){const b=ent.b[i];b.l-=dt;b.t+=dt;
  if(b.k==="banana"){b.vx+=b.ax*dt;b.vy+=b.ay*dt}
  if(b.k==="pie"){const f=1-b.l/b.ml;b.x=b.sx+(b.gx-b.sx)*f;b.y=b.sy+(b.gy-b.sy)*f;b.h=Math.sin(f*Math.PI)*80;if(b.l<=0){sfx("splat");parts(b.gx,b.gy,10,"#fff8e7",160);aoe(b.gx,b.gy,b.ex,b.dmg,null,30);zone(b.gx,b.gy,b.ex*.8,2.5,0,"cream",1);release("b",ent.b,i)}continue}
  if(b.k==="bubble"){b.vx*=.995;b.vy*=.995;b.x+=Math.sin(b.t*4)*.6}
  b.x+=b.vx*dt;b.y+=b.vy*dt;let dead=b.l<=0;
  if(!dead)for(const z of ent.z){if(z.hp<=0||b.hits.includes(z))continue;if((z.x-b.x)**2+(z.y-b.y)**2<(z.r+b.r)**2){
   if(b.k==="duck"){dead=true;break}
   if(b.k==="banana"){if(hurt(z,b.dmg,"ba"+(i%6),35,b.x,b.y,.4)){}continue}
   b.hits.push(z);hurt(z,b.dmg,null,b.kb,b.x,b.y);if(b.slow)z.slow=b.slow;if(b.k==="chicken"&&b.ex){dead=true;break}if(b.hits.length>=b.pierce){dead=true;break}}}
  if(dead){if(b.k==="duck"){sfx("quack");sfx("boom");parts(b.x,b.y,14,"#facc15",200);aoe(b.x,b.y,b.ex,b.dmg,null,80);zone(b.x,b.y,b.ex,.3,0,"boom");G.shake=Math.max(G.shake,3)}
   if(b.k==="chicken"&&b.ex){sfx("boom");aoe(b.x,b.y,b.ex,b.dmg*.8,null,60);zone(b.x,b.y,b.ex,.3,0,"boom");parts(b.x,b.y,10,"#fb923c",200)}
   if(b.k==="bubble"){parts(b.x,b.y,5,"#a5f3fc",80)}
   if(b.k==="flip")zone(b.x,b.y,b.fire,2.5,b.fd,"fire");
   release("b",ent.b,i)}}
 for(let i=ent.tur.length-1;i>=0;i--){const t=ent.tur[i];t.l-=dt;t.cd-=dt;if(t.cd<=0){const z=nearest(t.x,t.y,320);if(z){t.cd=t.rate;const a=Math.atan2(z.y-t.y,z.x-t.x);bullet({k:"pebble",x:t.x,y:t.y-8,vx:Math.cos(a)*420,vy:Math.sin(a)*420,r:5,dmg:t.dmg,l:1,kb:10})}}if(t.l<=0)release("tur",ent.tur,i)}
 for(let i=ent.zone.length-1;i>=0;i--){const o=ent.zone[i];o.l-=dt;if(o.dmg||o.slow){for(const z of ent.z){if(z.hp>0&&(z.x-o.x)**2+(z.y-o.y)**2<(o.r+z.r)**2){if(o.slow)z.slow=.5;if(o.dmg)hurt(z,o.dmg,"zn",0,0,0,.4)}}}if(o.l<=0)release("zone",ent.zone,i)}
 for(let i=ent.beam.length-1;i>=0;i--){ent.beam[i].l-=dt;if(ent.beam[i].l<=0)release("beam",ent.beam,i)}}

// ===== Zombie update with spatial grid separation =====
const grid=new Map();
function zUpdate(dt){const p=G.p;grid.clear();
 for(let i=ent.z.length-1;i>=0;i--){const z=ent.z[i];if(z.hp<=0){release("z",ent.z,i);continue}
  let dx=p.x-z.x,dy=p.y-z.y;const d=Math.hypot(dx,dy)||1;
  if(d>Math.max(W,H)*1.3&&z.type!=="boss"){const a=Math.random()*7,r=Math.max(W,H)*.6;z.x=p.x+Math.cos(a)*r;z.y=p.y+Math.sin(a)*r;continue}
  let sp=z.spd*(z.slow>0?.5:1);z.slow-=dt;z.wob+=dt*6;z.flash-=dt;
  if(z.type==="clown"){const px=-dy/d,py=dx/d,s=Math.sin(z.wob*.7)*.9;dx+=px*s*d;dy+=py*s*d}
  if(z.type==="dog"&&d<160&&d>60)sp*=1.4;
  if(z.type==="boss"){z.dashCd-=dt;if(z.dashCd<=0&&z.dash<=0){z.dash=.7;z.dashCd=4.5;z.dvx=dx/d;z.dvy=dy/d;txt(z.x,z.y-z.r-10,pick(["BRAAAINS!","HERE'S JOHNNY-BRAIN!","CHARGE!!","NOM TIME"]),"#f87171")}
   if(z.dash>0){z.dash-=dt;z.x+=z.dvx*330*dt;z.y+=z.dvy*330*dt}if(Math.random()<dt*(G.stage>=0&&G.stage<2?.2:.4)&&ent.z.length<300)spawnZ("shamb",z.x+rnd(-40,40),z.y+rnd(-40,40))}
  const l=Math.hypot(dx,dy)||1;z.x+=dx/l*sp*dt+z.kx*dt*8;z.y+=dy/l*sp*dt+z.ky*dt*8;z.kx*=.82;z.ky*=.82;
  if(d<z.r+p.r)hitPlayer(z.dmg);
  const key=((z.x/40)|0)*73856093^((z.y/40)|0)*19349663;let c=grid.get(key);if(!c){c=[];grid.set(key,c)}if(c.length<8)c.push(z)}
 for(const c of grid.values()){for(let a=0;a<c.length;a++)for(let b=a+1;b<c.length;b++){const A=c[a],B=c[b];let dx=B.x-A.x,dy=B.y-A.y;const d=Math.hypot(dx,dy)||.1,m=A.r+B.r;if(d<m){const push=(m-d)*.5/d;dx*=push;dy*=push;if(A.type!=="boss"){A.x-=dx;A.y-=dy}if(B.type!=="boss"){B.x+=dx;B.y+=dy}}}}}

// ===== Pickups & leveling =====
function pickups(dt){const p=G.p,S=stat(),M=S.mag;
 for(let i=ent.gem.length-1;i>=0;i--){const g=ent.gem[i];const dx=p.x-g.x,dy=p.y-g.y,d=Math.hypot(dx,dy);if(d<M||g.pull){g.pull=true;const v=Math.max(300,700-d);g.x+=dx/d*v*dt;g.y+=dy/d*v*dt}
  if(d<p.r+8){G.xp+=g.v;sfx("gem");release("gem",ent.gem,i)}}
 for(let i=ent.item.length-1;i>=0;i--){const o=ent.item[i];o.l-=dt;const dx=p.x-o.x,dy=p.y-o.y,d=Math.hypot(dx,dy);if(d<M*.8||o.pull){o.pull=true;o.x+=dx/d*400*dt;o.y+=dy/d*400*dt}
  if(d<p.r+12){if(o.k==="coin"){G.coins+=Math.ceil(1*S.coin);sfx("coin")}if(o.k==="pizza"){p.hp=Math.min(p.maxHp,p.hp+30);txt(p.x,p.y-24,"+30 🍕","#4ade80")}
   if(o.k==="magnet"){ent.gem.forEach(g=>g.pull=true);txt(p.x,p.y-24,"MAGNET!","#60a5fa")}if(o.k==="chest"){sfx("lvl");openCards(true)}release("item",ent.item,i);continue}
  if(o.l<=0&&o.k!=="chest")release("item",ent.item,i)}
 if(G.xp>=G.xpN&&state==="play"){G.xp-=G.xpN;G.lvl++;G.xpN=Math.floor(3+G.lvl*3+Math.pow(G.lvl,1.55));sfx("lvl");parts(p.x,p.y,20,"#facc15",200);openCards(false)}}
function options(){const o=[];
 for(const k of G.order){const w=G.w[k];if(!w.evo&&w.lv>=5&&G.ps[W8[k].evo])o.push({t:"evo",k,pri:1})}
 for(const k of G.order)if(G.w[k].lv<5)o.push({t:"w",k});
 if(G.order.length<6)for(const k of WK)if(!G.w[k])o.push({t:"w",k,nw:1});
 const np=Object.keys(G.ps).length;for(const k of PK){const l=G.ps[k]||0;if(l<5&&(l>0||np<6))o.push({t:"p",k,nw:!l})}
 const ev=o.filter(x=>x.pri),rest=o.filter(x=>!x.pri).sort(()=>Math.random()-.5);const r=[...ev,...rest].slice(0,3);
 while(r.length<3)r.push(r.length%2?{t:"heal"}:{t:"gold"});return r}
let chestMode=false;
function openCards(chest){chestMode=chest;state="lvl";hudBtns(false);joy.on=false;
 $("lvlT").textContent=chest?"🎁 BOSS LOOT!":"LEVEL "+G.lvl+"! 🎉";$("lvlSub").textContent=chest?"The boss dropped a goodie bag. Pick a prize!":pick(["Pick one. Choose wisely. Or don't.","The zombies will politely wait.","Your power grows. So does your weirdness.","Mom would want you to pick the healthy one."]);
 const box=$("cards");box.innerHTML="";for(const op of options()){const b=document.createElement("button");b.className="up"+(op.t==="evo"?" evo":"");let ic,nm,ds,fl,tg="";
  if(op.t==="evo"){const W=W8[op.k];ic=W.ei;nm=W.en;ds="EVOLVE "+W.n+" + "+PS[W.evo].n;fl=W.ef;tg="EVOLVE!"}
  else if(op.t==="w"){const W=W8[op.k],l=G.w[op.k]?G.w[op.k].lv:0;ic=W.i;nm=W.n;ds=l?"Level "+(l+1)+": more damage, more chaos.":W.d;fl=W.f;tg=l?"Lv "+(l+1):"NEW!";if(l===4)ds+=" (Max! Evolves with "+PS[W.evo].i+" "+PS[W.evo].n+")"}
  else if(op.t==="p"){const P=PS[op.k],l=G.ps[op.k]||0;ic=P.i;nm=P.n;ds=P.d;fl=P.f;tg=l?"Lv "+(l+1):"NEW!"}
  else if(op.t==="heal"){ic="🍕";nm="Gas Station Pizza";ds="Heal 40 HP";fl="It's been under the heat lamp since 2019."}else{ic="🪙";nm="Couch Cushion Coins";ds="+15 coins";fl="Also found: a remote and three Cheerios."}
  b.innerHTML=`<div class="ic">${ic}</div><div><b>${nm}</b><span class="tag">${tg||"BONUS"}</span><br>${ds}<i>${fl}</i></div>`;b.dataset.k=op.k||op.t;b.dataset.t=op.t;
  b.onclick=()=>choose(op);box.appendChild(b)}
 show("lvl")}
function choose(op){if(op.t==="evo"){G.w[op.k].evo=true;G.banner="✨ "+W8[op.k].en+"!";G.bannerT=2.5;sfx("win")}
 else if(op.t==="w"){if(G.w[op.k])G.w[op.k].lv++;else addWeapon(op.k)}else if(op.t==="p"){G.ps[op.k]=(G.ps[op.k]||0)+1;if(op.k==="wrap"){G.p.armor++;G.p.maxHp+=15;G.p.hp+=15}}
 else if(op.t==="heal")G.p.hp=Math.min(G.p.maxHp,G.p.hp+40);else G.coins+=15;
 hideAll();state="play";hudBtns(true);last=performance.now()}

// ===== Main loop =====
let last=performance.now(),fps=60;
function step(dt){const p=G.p,S=stat();G.t+=dt;
 const[dx,dy]=inputDir();const sp=p.spd*S.spd;p.x+=dx*sp*dt;p.y+=dy*sp*dt;if(dx||dy){p.dx=dx;p.dy=dy;p.walk+=dt*10;if(dx)p.face=dx>0?1:-1}
 p.inv-=dt;if(S.regen)p.hp=Math.min(p.maxHp,p.hp+S.regen*dt);
 spawnTick(dt);wUpdate(dt);bUpdate(dt);zUpdate(dt);pickups(dt);
 for(let i=ent.part.length-1;i>=0;i--){const o=ent.part[i];o.l-=dt;o.x+=o.vx*dt;o.y+=o.vy*dt;o.vx*=.9;o.vy*=.9;if(o.l<=0)release("part",ent.part,i)}
 for(let i=ent.txt.length-1;i>=0;i--){const o=ent.txt[i];o.l-=dt;o.y-=40*dt;if(o.l<=0)release("txt",ent.txt,i)}
 G.shake*=.88;G.bannerT-=dt;
 if(G.mode==="journey"&&G.stageBossSpawned&&!G.won&&!ent.z.some(z=>z.stageBoss&&z.hp>0))stageClear();
 if(G.won&&state==="play"){G.wonT-=dt;if(G.wonT<=0&&!ent.item.some(o=>o.k==="chest"))endRun(true)}}
function loop(now){let dt=Math.max(0,Math.min(.05,(now-last)/1000));last=now;fps=fps*.95+(1/Math.max(dt,.001))*.05;
 if(state==="play"&&G){const n=window.__speed||1;for(let i=0;i<n;i++)step(dt)}if(G&&(state!=="title"))draw();requestAnimationFrame(loop)}

// ===== Render =====
function spr(k,x,y,s=1,rot=0){const c=SPR[k];if(!c)return;const w=c.width/2*s;if(rot){cx.save();cx.translate(x,y);cx.rotate(rot);cx.drawImage(c,-w/2,-w/2,w,w);cx.restore()}else cx.drawImage(c,x-w/2,y-w/2,w,w)}
function draw(){const p=G.p;cx.setTransform(DPR,0,0,DPR,0,0);const sh=G.shake>.5?G.shake:0;const ox=Math.round(W/2-p.x+rnd(-sh,sh)),oy=Math.round(H/2-p.y+rnd(-sh,sh));
 const gi=G.mode==="journey"?G.stage:Math.max(0,Math.floor(G.t/150))%STAGES.length,gt=SPR["g"+gi];const pat=cx.createPattern(gt,"repeat");cx.save();cx.translate(ox%160,oy%160);cx.fillStyle=pat;cx.fillRect(-160,-160,W+320,H+320);cx.restore();
 cx.save();cx.translate(ox,oy);const vx0=p.x-W/2-60,vx1=p.x+W/2+60,vy0=p.y-H/2-60,vy1=p.y+H/2+60,vis=(x,y)=>x>vx0&&x<vx1&&y>vy0&&y<vy1;
 for(const o of ent.zone){if(!vis(o.x,o.y))continue;const f=o.l/o.ml;cx.globalAlpha=Math.min(1,f*1.5)*.55;cx.fillStyle=o.k==="fire"?"#f97316":o.k==="cream"?"#fffbeb":o.k==="goo"?"#a78bfa":o.k==="toot"?"#bef264":"#fde047";
  cx.beginPath();cx.arc(o.x,o.y,o.k==="toot"||o.k==="boom"?o.r*(1.2-f*.4):o.r,0,7);if(o.k==="toot"){cx.lineWidth=8;cx.strokeStyle="#bef264";cx.stroke()}else cx.fill()}cx.globalAlpha=1;
 for(const g of ent.gem){if(!vis(g.x,g.y))continue;cx.fillStyle=g.v>=10?"#f43f5e":g.v>=3?"#22d3ee":"#4ade80";cx.beginPath();cx.moveTo(g.x,g.y-6);cx.lineTo(g.x+5,g.y);cx.lineTo(g.x,g.y+6);cx.lineTo(g.x-5,g.y);cx.fill()}
 for(const o of ent.item)spr("e_"+({coin:"🪙",pizza:"🍕",magnet:"🧲",chest:"🎁"})[o.k],o.x,o.y+Math.sin(G.t*5)*3,o.k==="chest"?1.3:.8);
 for(const t of ent.tur)spr("gnome",t.x,t.y,1);
 for(const z of ent.z){if(!vis(z.x,z.y))continue;const s=1+Math.sin(z.wob)*.05;spr("z_"+z.type,z.x,z.y,s,Math.sin(z.wob*.5)*.12);if(z.flash>0){cx.globalAlpha=.6;cx.fillStyle="#fff";cx.beginPath();cx.arc(z.x,z.y,z.r,0,7);cx.fill();cx.globalAlpha=1}
  if(z.slow>0){cx.strokeStyle="#a5f3fc";cx.lineWidth=2;cx.beginPath();cx.arc(z.x,z.y,z.r+3,0,7);cx.stroke()}}
 // player
 const flick=p.inv>0&&Math.floor(G.t*20)%2;if(!flick){cx.fillStyle="#0004";cx.beginPath();cx.ellipse(p.x,p.y+14,12,5,0,0,7);cx.fill();spr("h_"+G.hero,p.x,p.y+Math.abs(Math.sin(p.walk))*-3,1)}
 if(G.w.whoopee){const R=(65+G.w.whoopee.lv*10+(G.w.whoopee.evo?50:0))*stat().area;cx.strokeStyle="#bef26444";cx.lineWidth=2;cx.beginPath();cx.arc(p.x,p.y,R,0,7);cx.stroke()}
 if(G.w.plunger&&G.w.plunger.n){const w=G.w.plunger;for(let i=0;i<w.n;i++){const a=w.ang+i*Math.PI*2/w.n;cx.font="24px serif";cx.textAlign="center";cx.textBaseline="middle";cx.save();cx.translate(p.x+Math.cos(a)*w.R,p.y+Math.sin(a)*w.R);cx.rotate(a*3);cx.fillText(w.evo?"🚽":"🪠",0,0);cx.restore()}}
 if(G.w.kitty){spr(G.w.kitty.evo?"e_😼":"e_🐱",p.x+18*p.face,p.y-26,.8)}
 for(const b of ent.b){if(!vis(b.x,b.y))continue;
  if(b.k==="bubble"){cx.strokeStyle="#a5f3fc";cx.fillStyle="#a5f3fc33";cx.lineWidth=2;cx.beginPath();cx.arc(b.x,b.y,b.r,0,7);cx.fill();cx.stroke();cx.fillStyle="#fff";cx.beginPath();cx.arc(b.x-b.r*.4,b.y-b.r*.4,2.5,0,7);cx.fill()}
  else if(b.k==="pebble"){cx.fillStyle="#78716c";cx.beginPath();cx.arc(b.x,b.y,4,0,7);cx.fill()}
  else if(b.k==="pie"){cx.fillStyle="#0003";cx.beginPath();cx.ellipse(b.x,b.y,8,4,0,0,7);cx.fill();spr("e_🥧",b.x,b.y-b.h,.8,b.t*8)}
  else if(b.k==="flip"){spr("e_🩴",b.x,b.y,.8,b.t*14);cx.fillStyle="#f9731688";cx.beginPath();cx.arc(b.x,b.y,8,0,7);cx.fill()}
  else spr("e_"+b.spr,b.x,b.y,b.k==="banana"&&G.w.banana&&G.w.banana.evo?1:.8,b.spin?b.t*12:Math.atan2(b.vy,b.vx)*(b.k==="duck"?0:.2))}
 for(const bm of ent.beam){cx.save();cx.translate(bm.x,bm.y);cx.rotate(bm.a);cx.globalAlpha=bm.l/.3;cx.fillStyle="#f43f5e";cx.fillRect(0,-bm.wd/2,bm.len,bm.wd);cx.fillStyle="#fff";cx.fillRect(0,-bm.wd/6,bm.len,bm.wd/3);cx.restore()}cx.globalAlpha=1;
 for(const o of ent.part){cx.globalAlpha=Math.min(1,o.l*2);cx.fillStyle=o.c;cx.fillRect(o.x-o.r/2,o.y-o.r/2,o.r,o.r)}cx.globalAlpha=1;
 cx.font="bold 14px system-ui";cx.textAlign="center";cx.lineWidth=3;cx.strokeStyle="#000";for(const o of ent.txt){cx.globalAlpha=Math.min(1,o.l*2);cx.strokeText(o.s,o.x,o.y);cx.fillStyle=o.c;cx.fillText(o.s,o.x,o.y)}cx.globalAlpha=1;
 if(G.bossAlive){const b=G.bossAlive;cx.font="bold 13px system-ui";cx.fillStyle="#fff";cx.strokeText(b.name,b.x,b.y-b.r-14);cx.fillText(b.name,b.x,b.y-b.r-14)}
 cx.restore();
 // joystick
 if(joy.on&&state==="play"){cx.globalAlpha=.35;cx.fillStyle="#fff";cx.beginPath();cx.arc(joy.bx,joy.by,50,0,7);cx.fill();cx.globalAlpha=.7;const[ddx,ddy]=inputDir();cx.beginPath();cx.arc(joy.bx+ddx*50,joy.by+ddy*50,22,0,7);cx.fill();cx.globalAlpha=1}
 // offscreen boss arrow
 if(G.bossAlive){const b=G.bossAlive,dx=b.x-p.x,dy=b.y-p.y;if(Math.abs(dx)>W/2||Math.abs(dy)>H/2){const a=Math.atan2(dy,dx);cx.save();cx.translate(W/2+Math.cos(a)*(W/2-30),H/2+Math.sin(a)*(H/2-60));cx.rotate(a);cx.fillStyle="#ef4444";cx.beginPath();cx.moveTo(14,0);cx.lineTo(-8,-10);cx.lineTo(-8,10);cx.fill();cx.restore()}}
 hud()}
function hud(){const p=G.p,top=0;cx.fillStyle="#0009";cx.fillRect(0,top,W,28);cx.fillStyle="#22d3ee";cx.fillRect(0,top+22,W*Math.min(1,G.xp/G.xpN),6);
 cx.font="bold 15px system-ui";cx.textAlign="left";cx.textBaseline="middle";cx.fillStyle="#fff";const mm=Math.floor(G.t/60),ss=String(Math.floor(G.t%60)).padStart(2,"0");
 cx.fillText("Lv "+G.lvl,8,top+11);cx.textAlign="center";cx.fillText("⏱ "+mm+":"+ss,W/2,top+11);cx.textAlign="right";cx.fillText("💀 "+G.kills+"  🪙 "+G.coins,W-8,top+11);
 cx.fillStyle="#0009";cx.fillRect(8,36,150,14);cx.fillStyle=p.hp/p.maxHp<.3?"#ef4444":"#4ade80";cx.fillRect(10,38,146*Math.max(0,p.hp/p.maxHp),10);cx.font="bold 11px system-ui";cx.textAlign="left";cx.fillStyle="#fff";cx.fillText("❤ "+Math.ceil(Math.max(0,p.hp))+"/"+p.maxHp,14,43);
 let x=8;cx.font="16px serif";for(const k of G.order){cx.fillText(G.w[k].evo?W8[k].ei:W8[k].i,x,64);x+=22}x=8;cx.font="13px serif";for(const k in G.ps){cx.fillText(PS[k].i,x,84);x+=18}
 if(G.mode==="journey"&&!G.bossAlive&&!G.won){const left=Math.max(0,G.nextBoss-G.t);cx.textAlign="center";cx.font="bold 13px system-ui";cx.fillStyle="#fde68a";cx.font="bold 15px system-ui";cx.lineWidth=4;cx.lineJoin="round";cx.strokeStyle="#000";const bl="📍 "+STAGES[G.stage].n+" — STAGE BOSS in "+Math.floor(left/60)+":"+String(Math.floor(left%60)).padStart(2,"0");cx.strokeText(bl,W/2,H-22);cx.fillText("📍 "+STAGES[G.stage].n+" — STAGE BOSS in "+Math.floor(left/60)+":"+String(Math.floor(left%60)).padStart(2,"0"),W/2,H-22)}
 if(G.mode==="endless"){const left=Math.max(0,G.nextBoss-G.t);cx.textAlign="center";cx.font="900 15px system-ui";cx.lineWidth=4;cx.lineJoin="round";cx.strokeStyle="#000";const el="♾️ ENDLESS MODE — "+(G.bossAlive?"boss fight!":"next boss in "+Math.floor(left/60)+":"+String(Math.floor(left%60)).padStart(2,"0"));cx.strokeText(el,W/2,H-22);cx.fillStyle="#c4b5fd";cx.fillText(el,W/2,H-22)}
 if(G.mode==="journey"&&G.bossAlive&&G.bossAlive.stageBoss&&!G.won){cx.textAlign="center";cx.font="bold 14px system-ui";cx.lineWidth=4;cx.strokeStyle="#000";const tl="👑 Beat the STAGE BOSS to clear "+STAGES[G.stage].n.split(",")[0]+"!";cx.strokeText(tl,W/2,H-22);cx.fillStyle="#fca5a5";cx.fillText(tl,W/2,H-22)}
 if(G.bossAlive){const b=G.bossAlive;cx.fillStyle="#000a";cx.fillRect(W*.15,96,W*.7,14);cx.fillStyle="#dc2626";cx.fillRect(W*.15+2,98,(W*.7-4)*Math.max(0,b.hp/b.max),10);cx.font="bold 11px system-ui";cx.textAlign="center";cx.fillStyle="#fff";cx.fillText((b.stageBoss?"👑 STAGE BOSS: ":"👑 BOSS: ")+b.name,W/2,103)}
 if(G.bannerT>0){cx.globalAlpha=Math.min(1,G.bannerT);cx.font="900 24px system-ui";cx.textAlign="center";cx.lineWidth=5;cx.lineJoin="round";cx.strokeStyle="#000";cx.strokeText(G.banner,W/2,H*.3);cx.fillStyle="#facc15";cx.fillText(G.banner,W/2,H*.3);cx.globalAlpha=1}}

// ===== Screens =====
const SCR=["title","comic","map","heroes","shop","lvl","paused","over","board"];
function hideAll(){SCR.forEach(s=>$(s).classList.add("hidden"))}
function show(s){hideAll();$(s).classList.remove("hidden")}
function goTitle(){state="title";G=null;hudBtns(false);$("coinS").textContent="🪙 "+save.coins+" coins  •  Hero: "+HEROES[save.hero].i+" "+HEROES[save.hero].n;renderDiff();setMute(save.mute);
 cx.setTransform(DPR,0,0,DPR,0,0);cx.fillStyle="#1b2a1a";cx.fillRect(0,0,W,H);show("title")}
function startRun(mode){ac();newRun(mode);hideAll();state="play";hudBtns(true);last=performance.now()}
function pause(){if(state!=="play")return;state="paused";joy.on=false;hudBtns(false);
 $("pauseInfo").innerHTML="<b>Weapons:</b><br>"+G.order.map(k=>(G.w[k].evo?W8[k].ei+" "+W8[k].en:W8[k].i+" "+W8[k].n+" Lv "+G.w[k].lv)).join("<br>")+"<br><b>Gear:</b><br>"+(Object.keys(G.ps).map(k=>PS[k].i+" "+PS[k].n+" Lv "+G.ps[k]).join("<br>")||"none yet");show("paused")}
$("pauseB").onclick=pause;$("resumeB").onclick=()=>{hideAll();state="play";hudBtns(true);last=performance.now()};$("quitB").onclick=()=>endRun(false,true);
document.addEventListener("visibilitychange",()=>{if(document.hidden)pause()});

// comic
const INTRO=[
 {cap:"NICEVILLE, FL — Saturday",art:"👦📱🏡👴",t:"Remy lives with Grandpa Gus in Niceville. He's on the phone with Dad, complaining that Grandpa only owns ONE TV channel.",b:"Remy: \"Dad, he watches the weather channel. For FUN.\""},
 {cap:"MEANWHILE, IN PAMPLICO, SC",art:"👨📞🧟🧟",t:"Dad's voice gets weird. Something is moaning in the background, and it isn't the dog.",b:"Dad: \"Remy, listen. Zombies are showing up in Pamplico! Mom, Leo and I are locking down the house. COME HOME—\" *bzzzt*"},
 {cap:"CALL DROPPED",art:"📵😱",t:"No bars. No Dad. Outside, Mrs. Henderson from next door is chewing on a mailbox.",b:"Remy: \"Dad? DAD?! ...Leo better not be eating my snacks.\""},
 {cap:"GRANDPA'S GARAGE",art:"👴🐔➡️👦",t:"Grandpa pulls a dusty box from the shelf and hands Remy... a rubber chicken launcher.",b:"Grandpa: \"I built this in '83 for exactly this day. Go get your family, kiddo. Text me when you're there. ...I don't know how to read texts.\""},
 {cap:"THE ROAD HOME",art:"🗺️🚶‍♂️🧟‍♀️🧟",t:"Niceville to Pamplico: about 450 miles of zombies, traffic, and questionable gas station snacks.",b:"Remy: \"Hang on, Mom, Dad, Leo. I'm coming home!\""}];
const ENDING=[
 {cap:"PAMPLICO, SC — HOME",art:"🏠🧟‍♂️💥👦",t:"The Mayor of Zombietown goes down in a cloud of goo. The front door creaks open...",b:"Remy: \"Mom? Dad? It's me!\""},
 {cap:"FAMILY REUNION",art:"👩👨👦🧒❤️",t:"Mom squeezes him so hard he squeaks like a rubber chicken. Dad does the embarrassing happy dance. Leo, 6, runs in wearing a pot on his head.",b:"Leo: \"I KNEW you'd come! Also I ate your snacks.\""},
 {cap:"SAFE AT LAST",art:"🛋️🍕📞👴",t:"The whole family piles on the couch. The phone rings. It's Grandpa.",b:"Grandpa: \"Did the chicken work?\"  Remy: \"Grandpa... the chicken SAVED THE WORLD.\"   THE END 🎉"}];
let comicSet=INTRO,comicI=0,comicDone=null;
function comic(set,done){comicSet=set;comicI=0;comicDone=done;renderComic();show("comic");state="comic"}
function renderComic(){const c=comicSet[comicI];$("comicP").innerHTML=`<div class="panel"><div class="cap">${c.cap}</div><div class="art">${c.art}</div><p style="color:#222;margin-top:6px">${c.t}</p><div class="bub">${c.b}</div></div><p style="opacity:.7;margin-top:8px">${comicI+1} / ${comicSet.length}</p>`;$("comicN").textContent=comicI===comicSet.length-1?"Let's go! ▶":"Next ▶"}
$("comicN").onclick=()=>{ac();sfx("boing");if(++comicI>=comicSet.length){comicDone&&comicDone()}else renderComic()};$("comicS").onclick=()=>comicDone&&comicDone();

// map
function drawMap(){const c=$("mapC"),g=c.getContext("2d"),w=c.width,h=c.height;g.fillStyle="#e7d8a8";g.fillRect(0,0,w,h);
 g.fillStyle="#7dd3fc";g.beginPath();g.moveTo(0,h);g.lineTo(w*.55,h);g.lineTo(w*.6,h*.82);g.lineTo(w*.75,h*.6);g.lineTo(w*.92,h*.4);g.lineTo(w,h*.3);g.lineTo(w,h);g.fill();
 g.font="bold 26px system-ui";g.fillStyle="#0369a1";g.fillText("Gulf of Mexico",30,h-30);g.fillText("Atlantic",w-140,h*.7);g.fillStyle="#a8a29e";g.font="bold 30px system-ui";g.fillText("FL",80,h*.7);g.fillText("GA",w*.38,h*.38);g.fillText("SC",w*.5,h*.12);
 g.setLineDash([14,10]);g.lineWidth=6;g.strokeStyle="#7c2d12";g.beginPath();STAGES.forEach((s,i)=>{const x=s.x*w,y=s.y*h;i?g.lineTo(x,y):g.moveTo(x,y)});g.stroke();g.setLineDash([]);
 const cur=prog().stage;STAGES.forEach((s,i)=>{const x=s.x*w,y=s.y*h,done=prog().cleared.includes(i),open=i<=Math.min(LAST,maxOpen());g.fillStyle=done?"#22c55e":open?"#facc15":"#9ca3af";g.strokeStyle="#000";g.lineWidth=4;g.beginPath();g.arc(x,y,i===cur?26:19,0,7);g.fill();g.stroke();
  g.fillStyle="#000";g.font="bold 20px system-ui";g.textAlign="center";g.fillText(done?"✓":open?(i+1):"🔒",x,y+7);g.font="bold 19px system-ui";g.fillStyle="#1c1917";g.textAlign=s.lab[2];g.fillText(s.n,x+s.lab[0],y+s.lab[1])});
 g.textAlign="left";g.font="40px serif";const s=STAGES[cur];g.fillText(i7(),s.x*w+14,s.y*h-14)}
const i7=()=>HEROES[save.hero].i;
function maxOpen(){return prog().cleared.length?Math.max(...prog().cleared)+1:0}
function openMap(){prog().stage=Math.min(prog().stage,maxOpen(),LAST);show("map");state="map";drawMap();const s=STAGES[prog().stage];
 $("mapInfo").innerHTML=`<b>Stage ${prog().stage+1}: ${s.n}</b><br>${s.s}<br>Survive ${Math.floor(s.tm/60)}:${String(s.tm%60).padStart(2,"0")} then beat <b>${s.boss}</b>!<br><small>Tap a town to choose. ${prog().cleared.length}/${STAGES.length} cleared.</small>`}
$("mapC").onclick=e=>{const r=e.target.getBoundingClientRect(),x=(e.clientX-r.left)/r.width,y=(e.clientY-r.top)/r.height;let b=-1,bd=.01;STAGES.forEach((s,i)=>{const d=(s.x-x)**2+(s.y-y)**2;if(d<bd){bd=d;b=i}});if(b>=0&&b<=maxOpen()){prog().stage=b;persist();sfx("boing");openMap()}};
$("journeyB").onclick=()=>{ac();if(!save.seenIntro){comic(INTRO,()=>{save.seenIntro=true;persist();openMap()})}else openMap()};
$("storyB").onclick=()=>{ac();comic(INTRO,()=>{save.seenIntro=true;persist();goTitle()})};
$("mapGo").onclick=()=>startRun("journey");$("mapBack").onclick=goTitle;$("endlessB").onclick=()=>startRun("endless");
$("muteB").onclick=()=>{ac();setMute(!save.mute)};$("muteHud").onclick=e=>{e.stopPropagation();ac();setMute(!save.mute)};

function renderDiff(){const r=$("diffRow");r.innerHTML="";for(const k in DIFF){const b=document.createElement("button");b.className="btn sm"+(save.diff===k?"":" dim");b.dataset.d=k;b.textContent=DIFF[k].n;b.onclick=()=>{save.diff=k;persist();sfx("boing");goTitle()};r.appendChild(b)}
 $("diffInfo").textContent="Coins x"+DIFF[save.diff].coin+" • Journey: "+prog().cleared.length+"/"+STAGES.length+" towns cleared"}
// heroes & shop
function renderHeroes(){const l=$("heroList");l.innerHTML="";for(const k in HEROES){const h=HEROES[k],own=save.heroes.includes(k);const d=document.createElement("div");d.className="hero"+(save.hero===k?" sel":"");
 d.innerHTML=`<div style="font-size:38px">${h.i}</div><div style="flex:1"><b style="color:#facc15">${h.n}</b><br><small>${h.d}<br>❤ ${h.hp} • 👟 ${h.spd} • starts with ${W8[h.w].i}</small></div>`;const b=document.createElement("button");b.className="btn sm"+(own?"":" alt");
 b.textContent=save.hero===k?"✔":own?"Pick":"🪙 "+h.cost;b.disabled=!own&&save.coins<h.cost;b.dataset.h=k;b.onclick=()=>{if(!own){save.coins-=h.cost;save.heroes.push(k);sfx("coin")}save.hero=k;persist();renderHeroes()};d.appendChild(b);l.appendChild(d)}}
function renderShop(){$("shopCoins").textContent="🪙 "+save.coins+" coins";const l=$("shopList");l.innerHTML="";for(const k in SHOP){const s=SHOP[k],lv=shopLv(k),cost=s.c*(lv+1);const d=document.createElement("div");d.className="shopit";
 d.innerHTML=`<div style="font-size:30px">${s.i}</div><div style="flex:1"><b>${s.n}</b> <small>(${lv}/${s.m})</small><br><small>${s.d}</small></div>`;const b=document.createElement("button");b.className="btn sm";b.dataset.s=k;
 b.textContent=lv>=s.m?"MAX":"🪙 "+cost;b.disabled=lv>=s.m||save.coins<cost;b.onclick=()=>{save.coins-=cost;save.shop[k]=lv+1;persist();sfx("coin");renderShop()};d.appendChild(b);l.appendChild(d)}}
$("heroB").onclick=()=>{renderHeroes();show("heroes")};$("heroBack").onclick=goTitle;$("shopB").onclick=()=>{renderShop();show("shop")};$("shopBack").onclick=goTitle;

function nextDadNote(){return bagPick(window.DAD_NOTES,"dad")}
function bagPick(N,key){N=N||[];if(!N.length)return null;let bag=LS.get(key+"bag",[]).filter(i=>i<N.length);if(!bag.length){bag=N.map((_,i)=>i);for(let i=bag.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[bag[i],bag[j]]=[bag[j],bag[i]]}const lastN=LS.get(key+"last",-1);if(bag.length>1&&bag[bag.length-1]===lastN)[bag[0],bag[bag.length-1]]=[bag[bag.length-1],bag[0]]}
 const i=bag.pop();LS.set(key+"bag",bag);LS.set(key+"last",i);return N[i]}
// end of run & board
let pendingScore=null;
function score(){return Math.floor(G.t)*10+G.kills*2+G.lvl*50}
function endRun(won,quit){if(state==="over")return;state="over";hudBtns(false);const earned=Math.round((G.coins+Math.floor(G.kills/15*stat().coin)+(won?50+G.stage*20:0))*DF().coin);save.coins+=earned;
 let finale=false;if(won&&G.mode==="journey"){if(!prog().cleared.includes(G.stage))prog().cleared.push(G.stage);if(G.stage===LAST)finale=true;else prog().stage=Math.max(prog().stage,G.stage+1)}persist();
 const mm=Math.floor(G.t/60),ss=String(Math.floor(G.t%60)).padStart(2,"0");const sc=score();
 const dn=$("dadNote");if(!won&&!quit){const n=nextDadNote();if(n){dn.innerHTML='<div class="dadT">💌 A note from Dad</div><div class="dadB"></div><div class="dadS">— Dad</div>';dn.querySelector(".dadB").textContent=n;dn.classList.remove("hidden")}else dn.classList.add("hidden")}else dn.classList.add("hidden");
 const vc=$("verseCard");vc.classList.add("hidden");if(!won&&!quit){const dc=LS.get("deaths",0)+1;LS.set("deaths",dc);if(dc%10===0){const v=bagPick(window.GENEVA_VERSES,"verse");if(v){vc.innerHTML='<div class="vT">📜 A word for the road</div><div class="vB"></div><div class="vR"></div>';vc.querySelector(".vB").textContent=v.text;vc.querySelector(".vR").textContent="— "+v.ref;vc.classList.remove("hidden")}}}
 $("overT").textContent=won?"STAGE CLEARED! 🎉":quit?"Run abandoned 🏳️":pick(["GOO'D GAME 💀","YOU GOT NOMMED 🧟","BRAAAINS... yours. 🧠"]);
 $("overSub").textContent=won?(finale?"You made it HOME!":"Next stop: "+STAGES[G.stage+1].n):pick(["The zombies say thanks for the snack.","Grandpa believes in you. Try again!","Leo is still waiting! Get back out there."]);
 $("res").innerHTML=`⏱ Survived <b>${mm}:${ss}</b><br>💀 Zombies gooed: <b>${G.kills}</b><br>⭐ Level: <b>${G.lvl}</b><br>🏆 Score: <b>${sc}</b><br>🪙 Coins earned: <b>+${earned}</b>`;
 const top=LS.get("top_"+save.diff,[]);pendingScore={s:sc,t:Math.floor(G.t),k:G.kills,l:G.lvl,h:HEROES[G.hero].i,m:G.mode==="journey"?STAGES[G.stage].n.split(",")[0]:"Endless"};
 const qualifies=sc>0&&(top.length<10||sc>top[top.length-1].s);$("overBoard").innerHTML="";
 if(qualifies){ini=["R","E","M"];renderIni();$("ini").classList.remove("hidden");$("overBtns").classList.add("hidden")}else{$("ini").classList.add("hidden");$("overBtns").classList.remove("hidden");$("overBoard").innerHTML=boardHTML(top,-1)}
 $("againB").textContent=G.mode==="journey"?(won?"▶ Next stage":"🔁 Retry stage"):"🔁 Again";
 $("againB").onclick=()=>{if(G&&G.mode==="journey")openMap();else startRun("endless")};
 show("over");if(finale){setTimeout(()=>comic(ENDING,()=>{show("over");state="over"}),900)}}
let ini=["A","A","A"];
function renderIni(){const c=$("iniCols");c.innerHTML="";ini.forEach((L,i)=>{const d=document.createElement("div");d.className="col";d.innerHTML=`<button class="u">▲</button><div class="L">${L}</div><button class="d">▼</button>`;
 d.querySelector(".u").onclick=()=>{ini[i]=String.fromCharCode((L.charCodeAt(0)-65+1)%26+65);renderIni()};d.querySelector(".d").onclick=()=>{ini[i]=String.fromCharCode((L.charCodeAt(0)-65+25)%26+65);renderIni()};c.appendChild(d)})}
$("iniSave").onclick=()=>{const top=LS.get("top_"+save.diff,[]);const e=Object.assign({n:ini.join(""),id:Date.now()},pendingScore);top.push(e);top.sort((a,b)=>b.s-a.s);top.length=Math.min(10,top.length);LS.set("top_"+save.diff,top);
 $("ini").classList.add("hidden");$("overBtns").classList.remove("hidden");$("overBoard").innerHTML=boardHTML(top,e.id)};
function boardHTML(top,id){if(!top.length)return"<p>No scores yet. Go goo some zombies!</p>";return"<table><tr><th>#</th><th>Name</th><th>Score</th><th>Time</th><th>💀</th><th>Lv</th><th>Where</th></tr>"+top.map((e,i)=>`<tr class="${e.id===id?"new":""}"><td>${i+1}</td><td>${e.h} ${e.n}</td><td>${e.s}</td><td>${Math.floor(e.t/60)}:${String(e.t%60).padStart(2,"0")}</td><td>${e.k}</td><td>${e.l}</td><td>${e.m}</td></tr>`).join("")+"</table>"}
$("topB").onclick=()=>{$("boardTitle").textContent="🏆 Top 10 — "+DIFF[save.diff].n;$("boardList").innerHTML=boardHTML(LS.get("top_"+save.diff,[]),-1);show("board")};$("boardBack").onclick=goTitle;$("homeB").onclick=goTitle;

buildSprites();goTitle();requestAnimationFrame(loop);
// test hooks
window.__rs={stageClear,hurt,aoe,killZ,zone,setMute,get AC(){return AC},bagPick,nearest,prog,get G(){return G},get state(){return state},ent,save:()=>save,options,choose,spawnZ,openCards,endRun,stat,fps:()=>fps};
