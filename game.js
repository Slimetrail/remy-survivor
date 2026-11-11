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
function setMute(v){save.mute=v;persist();if(v&&typeof cStop==='function')cStop();if(AC){v?AC.suspend():AC.resume()}const t=v?"🔇":"🔊";$("muteHud").textContent=t;$("muteHud").setAttribute("aria-label",v?"Sound off":"Sound on");$("muteB").textContent=v?"🔇 Sound off":"🔊 Sound on"}
function tone(f1,f2,dur,type,vol,delay=0){const a=AC;if(!a)return;const t=a.currentTime+delay,o=a.createOscillator(),g=a.createGain();o.type=type;o.frequency.setValueAtTime(f1,t);o.frequency.exponentialRampToValueAtTime(Math.max(20,f2),t+dur);g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.001,t+dur);o.connect(g).connect(a.destination);o.start(t);o.stop(t+dur+.02)}
function noise(dur,vol,f=800){const a=AC;if(!a)return;const b=a.createBuffer(1,a.sampleRate*dur,a.sampleRate),d=b.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*(1-i/d.length);const s=a.createBufferSource(),fl=a.createBiquadFilter(),g=a.createGain();fl.type="lowpass";fl.frequency.value=f;g.gain.value=vol;s.buffer=b;s.connect(fl).connect(g).connect(a.destination);s.start()}
function sfx(n){if(save.mute||!AC)return;const now=performance.now();if(lastS[n]&&now-lastS[n]<60)return;lastS[n]=now;
 switch(n){case"squeak":tone(900,1500,.08,"square",.04);break;case"pop":tone(500,120,.1,"triangle",.07);break;case"gem":tone(1200,1800,.05,"sine",.04);break;
 case"toot":tone(110,60,.35,"sawtooth",.08);noise(.3,.05,300);break;case"boing":tone(300,700,.15,"sine",.06);break;case"quack":tone(600,350,.12,"square",.06);tone(500,300,.1,"square",.05,.12);break;
 case"splat":noise(.18,.12,1200);break;case"boom":noise(.4,.2,500);tone(120,40,.4,"sine",.12);break;case"laser":tone(1500,300,.2,"sawtooth",.04);break;
 case"hurt":tone(220,90,.2,"square",.08);break;case"lvl":[523,659,784,1046].forEach((f,i)=>tone(f,f,.12,"triangle",.08,i*.08));break;
 case"boss":tone(80,80,.6,"sawtooth",.1);tone(60,60,.6,"sawtooth",.1,.6);break;case"coin":tone(1300,1300,.05,"square",.03);tone(1750,1750,.08,"square",.03,.05);break;
 case"puS":tone(700,1400,.12,"sine",.05);tone(1000,1600,.1,"sine",.04,.1);break;case"puG":[660,880,1320].forEach((f,i)=>tone(f,f*1.05,.08,"triangle",.07,i*.06));break;case"honk":tone(350,330,.15,"square",.06);break;case"win":[392,523,659,784,659,784,1046].forEach((f,i)=>tone(f,f,.15,"triangle",.09,i*.12));break;
 case"fire":noise(.15,.06,2000);break;case"bubble":tone(400,900,.07,"sine",.04);break;case"whump":tone(180,80,.12,"sine",.07);noise(.08,.05,400);break;case"fizz":tone(900,1400,.08,"square",.03);noise(.1,.04,2500);break;}}

// ===== Data =====
const STAGES=[
 {n:"Niceville, FL",s:"Granddad's cul-de-sac. Watch out for Bill.",g:"#3f6b35",d:"#35602d",x:.08,y:.88,boss:"Coach Chompers",tm:150,deco:"grave"},
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
 chicken:{n:"Rubber Chicken Launcher",i:"🐔",d:"Fires squeaky chickens at the closest zombie.",f:"\"BAWK!\" — Granddad's secret weapon.",evo:"spicy",en:"Rotisserie Rocket Rooster",ei:"🍗",ef:"Chickens now EXPLODE. Granddad would be so proud."},
 banana:{n:"Banana Boomerang",i:"🍌",d:"Bananas swing out, smack everything, and come back.",f:"Potassium-powered justice.",evo:"sneakers",en:"Banana Split-nado",ei:"🍨",ef:"Six bananas. Zero chill."},
 whoopee:{n:"Whoopee Cushion Shockwave",i:"💨",d:"A toot blast knocks back nearby zombies.",f:"Excuse you. EXCUSE YOU.",evo:"disco",en:"Thunder Toot 3000",ei:"🌪️",ef:"Registered as a natural disaster in 3 states."},
 plunger:{n:"Spinning Toilet Plungers",i:"🪠",d:"Plungers orbit you, bonking zombies.",f:"Freshly used? Don't ask.",evo:"wrap",en:"Plunger-nado of Porcelain Doom",ei:"🚽",ef:"Brings a whole new meaning to 'flush them out'."},
 gnome:{n:"Garden Gnome Turret",i:"🍄",d:"Drops a grumpy gnome that pelts zombies with pebbles.",f:"He hates zombies. He hates you a little too.",evo:"coffee",en:"Gnome Depot Grand Opening",ei:"🏪",ef:"Gnomes on espresso. Heaven help us all."},
 duck:{n:"Rubber Duck Mines",i:"🦆",d:"Leaves ducks behind that go KA-QUACK.",f:"Bath time is OVER.",evo:"sock",en:"Quackpocalypse Armada",ei:"🛁",ef:"Lucky ducks. Unlucky zombies."},
 pie:{n:"Pie Launcher",i:"🥧",d:"Lobs cream pies that splat an area and slow zombies.",f:"Comedy's oldest weapon.",evo:"catfood",en:"Grandma's Thanksgiving Pie-pocalypse",ei:"🎂",ef:"Every pie is a family recipe. The family is angry."},
 bubble:{n:"Bubble Wand",i:"🫧",d:"Floaty bubbles pop zombies and slow them down.",f:"So pretty. So deadly.",evo:"disco",en:"Bubble Trouble Foam Party",ei:"🪩",ef:"Zombies now have to dance AND get gooed."},
 kitty:{n:"Laser Kitty",i:"🐱",d:"A cat shoots eye lasers at zombies. Obviously.",f:"Pew pew, meow meow.",evo:"tinfoil",en:"Cosmic Meowtrix Prime",ei:"😼",ef:"The cat has contacted the mothership."},
 flip:{n:"Flaming Crocs",i:"🔥",d:"Spinning flaming Crocs that leave fire puddles.",f:"Granddad's Crocs. Sport mode. On fire.",evo:"spicy",en:"The Croc of Destiny",ei:"🔥",ef:"Strap locked in sport mode. Zombies fear the holes."},
 sack:{n:"Pillowcase of Apples",i:"🍎",d:"A swung sack that only hits zombies right around you.",f:"Granddad packed it for a picnic. The picnic had other plans.",evo:"disco",en:"Bushel Bash",ei:"🍏",ef:"A full-circle apple whirl. Lunch is cancelled."},
 rocket:{n:"Bottle Rocket Fireworks",i:"🎆",d:"Slow bottle rockets that explode in a big colorful blast.",f:"Fourth of July, every shot.",evo:"spicy",en:"Grand Finale",ei:"🎇",ef:"The whole neighborhood can see this one."}};
const WK=Object.keys(W8);
const CLASS_W={sack:1,rocket:1};
// Class weapon numbers. Ranged chicken L1 interval stays 0.40s, unchanged.
const SACK_CD0=.32,SACK_REACH0=56,SACK_REACH_LV=8,SACK_ARC0=120*Math.PI/180,SACK_ARC_LV=15*Math.PI/180,SACK_DMG=12,SACK_SWING=.22,SACK_KB=55;
const ROCKET_CD0=1.1,ROCKET_SPD=320,ROCKET_BLAST0=70,ROCKET_BLAST_LV=10,ROCKET_DMG=16,ROCKET_LIFE=1.2;
const PS={ // passives
 spicy:{n:"Extra Spicy Hot Sauce",i:"🌶️",d:"+12% damage",f:"Your sweat is now a weapon."},
 sneakers:{n:"Granddad's New Balances",i:"👟",d:"+10% move speed",f:"Gray dad sneakers. Built for mowing lawns and outrunning zombies."},
 tinfoil:{n:"Tinfoil Hat",i:"🛸",d:"+35% gem magnet range",f:"The gems can't hide their thoughts from you."},
 catfood:{n:"Cat Food Diet",i:"🥫",d:"+0.5 HP regen per second",f:"Tastes like tuna. Heals like magic."},
 disco:{n:"Disco Fever",i:"🕺",d:"+12% weapon area",f:"Your aura is now groovy and hostile."},
 coffee:{n:"Too Much Coffee",i:"☕",d:"-8% weapon cooldowns",f:"You can hear colors now."},
 sock:{n:"Lucky Sock",i:"🧦",d:"+6% crit chance, +15% coins",f:"Never washed. Never lost."},
 wrap:{n:"Bubble Wrap Onesie",i:"🎽",d:"+1 armor, +15 max HP",f:"Pop pop pop pop pop."}};
const PK=Object.keys(PS);
const HEROES={
 remy:{n:"Remy",i:"🧢",c:"#3b82f6",hp:100,spd:150,w:"chicken",cost:0,d:"Teen on a mission: get home to Mom, Dad & Leo."},
 gus:{n:"Granddad Paul",i:"👴",c:"#a3a3a3",hp:150,spd:128,w:"plunger",cost:250,armor:1,d:"Slow, tough, and VERY opinionated. Starts with plungers."},
 tina:{n:"Turbo Tina",i:"🛹",c:"#ec4899",hp:80,spd:190,w:"banana",cost:500,d:"Remy's skater cousin. Fast, fragile, bananas."},
 dee:{n:"DJ Dee",i:"🎧",c:"#a855f7",hp:100,spd:150,w:"whoopee",cost:800,area:.2,d:"Drops beats AND toots. +20% area."}};
const SHOP={hp:{n:"Thicc Skin",i:"❤️",d:"+10 max HP",m:5,c:60},dmg:{n:"Angry Eyebrows",i:"😠",d:"+6% damage",m:5,c:80},spd:{n:"Zoomies",i:"💨",d:"+4% speed",m:5,c:60},
 mag:{n:"Pocket Magnet",i:"🧲",d:"+15% pickup range",m:5,c:50},greed:{n:"Piggy Bank",i:"🐷",d:"+10% coins",m:5,c:70},rev:{n:"Extra Life Juice Box",i:"🧃",d:"Revive once per run",m:1,c:400}};
const ZT={ // ONE table for all zombie stats. tier 1 = basic horde (gaunt, many, low HP); tier 2 = mutated (bulky, tougher, a bit faster, stagger-resist kb<1, tank lunges); tier 3 = boss (huge, telegraphed charge + ground slam)
 shamb:{tier:1,r:13,hp:10,spd:38,dmg:8,xp:1,kb:1,c:"#7c8668",t:0},
 runner:{tier:1,r:11,hp:9,spd:85,dmg:7,xp:1,kb:1,c:"#9a936a",t:35},
 dog:{tier:1,r:10,hp:10,spd:120,dmg:6,xp:1,kb:1,c:"#5f4d3c",t:80},
 spit:{tier:1,r:13,hp:16,spd:52,dmg:6,xp:2,kb:1,c:"#6e7a58",t:9e9},
 clown:{tier:1,r:13,hp:22,spd:60,dmg:9,xp:2,kb:1,c:"#b3ae9f",t:110},
 bloat:{tier:2,r:20,hp:40,spd:44,dmg:12,xp:3,kb:.45,c:"#7f7a72",t:90},
 charger:{tier:2,r:15,hp:45,spd:70,dmg:12,xp:3,kb:.6,ar:.1,c:"#727a62",t:120,sp:"telegraphed straight rush (0.45s wind-up, 380px/s for 0.5s)"},
 spewer:{tier:2,r:16,hp:30,spd:46,dmg:5,xp:3,kb:.7,ar:0,c:"#7a7a5a",t:170,sp:"keeps 120-160px, backs off <60px; telegraphed slow vomit (0.4s rear-back). Hit = INFESTED 10s: 2x horde spawn from left/right edges (cap respected) + horde 1.25x speed (refresh, no stack). Killed = green glob decoy 6s pulls tier-1 horde within 300px (elites/boss ignore)"},
 grabber:{tier:2,r:17,hp:140,spd:34,dmg:5,xp:5,kb:.15,ar:.3,c:"#666e5e",t:210,sp:"contact grab: stuns player 0.7s, then 2s grab cooldown"},
 tank:{tier:2,r:18,hp:110,spd:48,dmg:15,xp:5,kb:.25,lunge:1,c:"#6a7360",t:150},
 boss:{tier:3,r:42,hp:800,spd:58,dmg:18,xp:40,kb:0,c:"#6b705e",t:9e9}};
const INF={dur:10,spd:1.25,burst:16,burstT:.8,globL:6,globR:300};
const BOSSA={wind:.75,rush:.55,rushSpd:340,recover:.9,slamWind:.85,slamR:150,slamSpd:260,slamDmg:16,cd:3.2};// boss attack timings (telegraph first, then dodgeable)

// ===== State =====
let G=null,state="title";
const ent={eb:[],z:[],b:[],gem:[],part:[],txt:[],zone:[],tur:[],beam:[],item:[]};
function shopLv(k){return save.shop[k]||0}
function newRun(mode,cls){const h=HEROES[save.hero];const st=mode==="journey"?prog().stage:-1;
 G={mode,stage:st,t:0,kills:0,lvl:1,xp:0,xpN:22,lastPop:0,pu:{board:null,act:null,due:0,dx:0,dy:0,next:PU_KILLS,last:-99,pizzaCd:-99,drops:0,got:0,miss:0},coins:0,shake:0,spawnAcc:0,bossN:0,bossAlive:null,infT:0,cueT:0,burstN:0,burstAcc:0,edgeSide:1,infAcc:0,globs:[],nextBoss:st>=0?STAGES[st].tm:180,won:false,revive:shopLv("rev")>0,
  p:{x:0,y:0,r:14,hp:0,maxHp:h.hp+shopLv("hp")*10,spd:h.spd*(1+shopLv("spd")*.04),armor:h.armor||0,inv:0,face:1,dx:1,dy:0,walk:0},
  w:{},ps:{},order:[],banner:null,bannerT:0,dmgMul:1+shopLv("dmg")*.06,magBase:1+shopLv("mag")*.15,hero:save.hero,diff:st>=0?1+st*.17:1,df:save.diff,cls:cls||"ranged"};
 G.p.hp=G.p.maxHp;for(const k in ent)ent[k].length=0;const startW=G.cls==="melee"?"sack":G.cls==="mage"?"rocket":h.w;addWeapon(startW);
 G.banner=st>=0?"📍 "+STAGES[st].n:"♾️ Endless Mode";G.bannerT=3}
function stat(){const p=G.ps,h=HEROES[G.hero];return{dmg:G.dmgMul*(1+.12*(p.spicy||0)),spd:Math.min(SPD_CAP,(1+.1*(p.sneakers||0))*(puOn("drink")?1.2:1)),mag:puOn("sock")?Math.max(450,90*G.magBase*(1+.35*(p.tinfoil||0))):90*G.magBase*(1+.35*(p.tinfoil||0)),regen:.5*(p.catfood||0),
 area:(1+(h.area||0))*(1+.12*(p.disco||0)),cd:Math.max(CD_FLOOR,Math.pow(.92,p.coffee||0)/(puOn("tape")?1.2:1)),crit:.05+.06*(p.sock||0),coin:(1+.15*(p.sock||0))*(1+shopLv("greed")*.1)}}
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
// Full-body figures, 3/4 top-down, facing right; baked shading; 4 walk frames each. Drawn once at load.
const ZS={},HS={};// type -> [4 canvases]
const ZL={ // look per type: skin, shirt, pants, build
 shamb:{sk:"#7c8668",sh:"#4f5246",pa:"#383c44",w:.72,gaunt:1,lean:.25},
 runner:{sk:"#9a936a",sh:"#5e4a3a",pa:"#3d3a36",w:.62,gaunt:1,lean:.5,torn:1},
 bloat:{sk:"#7f7a72",sh:"#5b5560",pa:"#3a3640",w:1.15,lean:.15,belly:1},
 spit:{sk:"#6e7a58",sh:"#3f4a3c",pa:"#33363a",w:.78,gaunt:1,lean:.35,throat:1},
 clown:{sk:"#b3ae9f",sh:"#6e3a35",pa:"#3d4a5e",w:.8,gaunt:1,lean:.25,clown:1},
 charger:{sk:"#727a62",sh:"#4a463c",pa:"#34322e",w:1.05,lean:.55,bigArm:1,lumps:1},
 spewer:{sk:"#7a7a5a",sh:"#4c4a3e",pa:"#36352f",w:1.1,lean:.2,belly:1,throat:1,glow:1},
 grabber:{sk:"#666e5e",sh:"#3b3d36",pa:"#2c2d2a",w:1.9,lean:.35,longArm:1,lumps:1},
 tank:{sk:"#6a7360",sh:"#32372f",pa:"#2b2e2c",w:1.35,lean:.2,armor:1},
 boss:{sk:"#6b705e",sh:"#3c3a34",pa:"#2a2826",w:1.5,lean:.6,bigArm:1,lumps:1,torn:1,scars:1,brute:1}};
function shade(g,x0,y0,x1,y1,top,bot){const gr=g.createLinearGradient(x0,y0,x1,y1);gr.addColorStop(0,top);gr.addColorStop(1,bot);return gr}
function mix(h,a){const n=parseInt(h.slice(1),16),f=a<0?0:255,t=Math.abs(a);const r=n>>16,gg=n>>8&255,b=n&255;return"rgb("+Math.round(r+(f-r)*t)+","+Math.round(gg+(f-gg)*t)+","+Math.round(b+(f-b)*t)+")"}
function limb(g,x1,y1,xm,ym,x2,y2,w,col){g.lineCap="round";g.lineJoin="round";
 g.strokeStyle="rgba(15,14,12,.55)";g.lineWidth=w+1.6;g.beginPath();g.moveTo(x1,y1);g.quadraticCurveTo(xm,ym,x2,y2);g.stroke();
 g.strokeStyle=col;g.lineWidth=w;g.stroke();g.strokeStyle="rgba(255,250,230,.13)";g.lineWidth=w*.35;g.beginPath();g.moveTo(x1-w*.15,y1-w*.25);g.quadraticCurveTo(xm-w*.15,ym-w*.25,x2-w*.15,y2-w*.25);g.stroke()}
function zHuman(g,c,r,L,f){const ph=f/4*Math.PI*2,sw=Math.sin(ph),bob=Math.abs(Math.cos(ph))*r*.04,W=L.w,lean=L.lean;
 const footY=c+r*1.3,hipY=c+r*.38-bob,shY=c-r*.55-bob,hx=c-r*.05,sx=c+r*lean*.35,headR=r*(L.brute?.3:L.belly?.34:.4),neckX=sx+r*(.2+lean*.35),hy=shY-headR*.95+r*lean*.12,hX=neckX+r*.12;
 const dk=mix(L.pa,-.35),skd=mix(L.sk,-.35);
 // shadow under feet
 g.fillStyle="rgba(0,0,0,.32)";g.beginPath();g.ellipse(c,footY+r*.04,r*.8*W,r*.2,0,0,7);g.fill();
 // cape (boss) behind
 // back leg + back arm (darker)
 const lw=r*.3*Math.min(W,1.2),aw=r*.19*Math.min(W,1.25);
 limb(g,hx-r*.08,hipY,hx-r*.1-sw*r*.25,hipY+r*.45,hx-sw*r*.45-r*.05,footY,lw,dk);
 g.fillStyle="#1b1a18";g.beginPath();g.ellipse(hx-sw*r*.45+r*.05,footY,r*.2,r*.09,0,0,7);g.fill();
 const reach=(L.lean>=.3&&!L.longArm)||L.brute;const bax=sx-r*.15,bay=shY+r*.1;
 if(L.longArm)limb(g,bax,bay,bax-r*.1,bay+r*.6,bax+r*.1+sw*r*.1,footY-r*.2,aw*1.2,skd);else if(reach)limb(g,bax,bay,bax+r*.45,bay+r*.05+sw*r*.06,bax+r*.95,bay+r*.12+sw*r*.08,aw,skd);else limb(g,bax,bay,bax-r*.05+sw*r*.15,bay+r*.45,bax+sw*r*.25,bay+r*.85,aw,skd);
 // torso
 const tw=r*.5*W,tg=shade(g,0,shY,0,hipY+r*.1,mix(L.sh,.12),mix(L.sh,-.4));g.fillStyle=tg;g.beginPath();
 if(L.belly){g.moveTo(sx-tw*.7,shY);g.quadraticCurveTo(sx+tw*.2,shY-r*.12,sx+tw*.75,shY+r*.05);g.bezierCurveTo(sx+tw*2.1,shY+r*.4,sx+tw*1.8,hipY+r*.25,hx+tw*.4,hipY+r*.12);g.lineTo(hx-tw*.75,hipY+r*.1);g.quadraticCurveTo(sx-tw*1.4,c,sx-tw*.7,shY)}
 else if(L.armor){g.moveTo(sx-tw*1.15,shY-r*.08);g.quadraticCurveTo(sx,shY-r*.32,sx+tw*1.2,shY-r*.05);g.lineTo(hx+tw*.85,hipY+r*.08);g.lineTo(hx-tw*.8,hipY+r*.08);g.closePath()}
 else{g.moveTo(sx-tw*.8,shY);g.quadraticCurveTo(sx,shY-r*.15,sx+tw*.8,shY);g.lineTo(hx+tw*.7,hipY+r*.1);
  if(L.torn){g.lineTo(hx+tw*.35,hipY+r*.02);g.lineTo(hx+tw*.15,hipY+r*.2);g.lineTo(hx-tw*.2,hipY+r*.05);g.lineTo(hx-tw*.45,hipY+r*.22)}g.lineTo(hx-tw*.75,hipY+r*.1);g.closePath()}
 g.fill();g.strokeStyle="rgba(15,14,12,.5)";g.lineWidth=1.2;g.stroke();
 // rim light on back edge + belly shade
 g.strokeStyle="rgba(220,230,200,.18)";g.lineWidth=r*.06;g.beginPath();g.moveTo(sx-tw*.75,shY+r*.06);g.lineTo(hx-tw*.7,hipY);g.stroke();
 if(L.torn||L.belly){g.fillStyle=mix(L.sk,-.15);g.beginPath();g.ellipse(sx+tw*.25,c-r*.05,tw*.28,r*.14,.4,0,7);g.fill()}// skin through rips
 g.strokeStyle="rgba(20,18,15,.35)";g.lineWidth=1;g.beginPath();g.moveTo(sx-tw*.2,shY+r*.25);g.lineTo(sx+tw*.1,shY+r*.45);g.moveTo(hx+tw*.3,hipY-r*.2);g.lineTo(hx+tw*.05,hipY-r*.05);g.stroke();// grime/tears
 if(L.armor){g.fillStyle="#454b44";g.strokeStyle="rgba(10,10,10,.55)";g.lineWidth=1;for(const[px,py,pw]of[[sx-tw*.9,shY+r*.02,tw*.85],[sx+tw*.1,shY+r*.02,tw*.85]]){g.beginPath();g.rect(px,py,pw,r*.3);g.fill();g.stroke()}
  g.fillStyle="#3a3f3a";g.beginPath();g.ellipse(sx+tw*.9,shY+r*.02,r*.32,r*.2,0,0,7);g.fill();g.stroke();g.fillStyle="rgba(200,190,150,.25)";g.fillRect(sx-tw*.6,shY+r*.42,tw*1.2,r*.06)}
 if(L.clown){g.fillStyle="#7a6a3e";g.beginPath();g.arc(sx-tw*.1,shY+r*.35,r*.07,0,7);g.arc(hx+tw*.2,hipY-r*.15,r*.07,0,7);g.fill();g.fillStyle="#3f4d63";g.fillRect(sx-tw*.7,shY+r*.18,tw*.5,r*.3)}
 if(L.gaunt){g.strokeStyle="rgba(25,22,18,.45)";g.lineWidth=.9;for(let i=0;i<3;i++){g.beginPath();g.moveTo(sx-tw*.35,shY+r*(.2+i*.12));g.quadraticCurveTo(sx+tw*.1,shY+r*(.26+i*.12),sx+tw*.45,shY+r*(.2+i*.12));g.stroke()}}
 if(L.scars){g.strokeStyle="rgba(120,60,55,.6)";g.lineWidth=1.3;g.beginPath();g.moveTo(sx-tw*.5,shY+r*.15);g.lineTo(sx+tw*.4,shY+r*.55);g.moveTo(sx-tw*.2,shY+r*.6);g.lineTo(sx+tw*.6,shY+r*.4);g.stroke();g.strokeStyle="rgba(200,180,160,.3)";g.lineWidth=.6;for(let i=0;i<5;i++){g.beginPath();g.moveTo(sx-tw*.4+i*tw*.2,shY+r*.2+i*r*.09);g.lineTo(sx-tw*.3+i*tw*.2,shY+r*.28+i*r*.09);g.stroke()}}
 if(L.glow){g.fillStyle="rgba(165,185,75,.55)";for(const[ox,oy,q]of[[.5,.3,.09],[.9,.5,.07],[.3,.65,.06]]){g.beginPath();g.ellipse(sx+tw*ox,shY+r*oy,r*q,r*q*.7,0,0,7);g.fill()}}
 if(L.lumps){for(const[ox,oy,q]of[[-.6,-.05,.22],[-.2,-.18,.17],[.5,.25,.13]]){const lx=sx+tw*ox,ly=shY+r*oy,lr=r*q,lg=g.createRadialGradient(lx-lr*.4,ly-lr*.4,lr*.1,lx,ly,lr);lg.addColorStop(0,mix(L.sk,.08));lg.addColorStop(1,mix(L.sk,-.4));g.fillStyle=lg;g.beginPath();g.arc(lx,ly,lr,0,7);g.fill()}}
 // front leg
 limb(g,hx+r*.08,hipY,hx+r*.1+sw*r*.25,hipY+r*.45,hx+sw*r*.45+r*.05,footY,lw,L.pa);
 g.fillStyle="#24221f";g.beginPath();g.ellipse(hx+sw*r*.45+r*.15,footY,r*.22,r*.1,0,0,7);g.fill();
 // neck + head
 limb(g,sx+r*.1,shY+r*.02,neckX,shY-r*.05,neckX+r*.05,hy+headR*.5,r*.2,skd);
 if(L.clown){g.fillStyle="#857c6a";g.strokeStyle="rgba(15,14,12,.5)";g.lineWidth=1;g.beginPath();for(let i=0;i<7;i++){const a=i/7*Math.PI*2;g.lineTo(neckX+Math.cos(a)*r*.38,shY-r*.02+Math.sin(a)*r*.14)}g.closePath();g.fill();g.stroke()}
 if(L.throat){g.fillStyle="#6f7a3c";g.beginPath();g.ellipse(neckX+r*.06,shY-r*.08,r*.16,r*.13,0,0,7);g.fill()}
 const hg=g.createRadialGradient(hX-headR*.3,hy-headR*.45,headR*.1,hX,hy,headR*1.1);hg.addColorStop(0,mix(L.sk,.15));hg.addColorStop(.7,L.sk);hg.addColorStop(1,mix(L.sk,-.45));
 g.fillStyle=hg;g.beginPath();g.ellipse(hX,hy,headR*.9,headR,0,0,7);g.fill();g.strokeStyle="rgba(15,14,12,.5)";g.lineWidth=1.1;g.stroke();
 // jaw hangs down, forward
 g.fillStyle=skd;g.beginPath();g.ellipse(hX+headR*.35,hy+headR*.75,headR*.42,headR*.32,.3,0,7);g.fill();
 g.fillStyle="#150f0d";g.beginPath();g.moveTo(hX+headR*.3,hy+headR*.42);g.lineTo(hX+headR*.72,hy+headR*.4);g.lineTo(hX+headR*.66,hy+headR*.62);g.lineTo(hX+headR*.54,hy+headR*.86);g.lineTo(hX+headR*.4,hy+headR*.7);g.closePath();g.fill();// slack, crooked hanging jaw gap (irregular, not an O, no smile)
 g.fillStyle="rgba(170,160,120,.55)";g.fillRect(hX+headR*.42,hy+headR*.42,headR*.08,headR*.08);g.fillRect(hX+headR*.58,hy+headR*.41,headR*.07,headR*.1);// a few broken teeth
 if(L.gaunt){g.fillStyle="rgba(20,16,12,.35)";g.beginPath();g.ellipse(hX+headR*.15,hy+headR*.3,headR*.18,headR*.25,0,0,7);g.fill()}// sunken cheek
 // hollow eye sockets
 g.fillStyle="rgba(12,10,9,.9)";g.beginPath();g.ellipse(hX+headR*.5,hy-headR*.12,headR*.2,headR*.24,0,0,7);g.ellipse(hX+headR*.02,hy-headR*.14,headR*.17,headR*.22,0,0,7);g.fill();
 g.fillStyle=L.throat?"rgba(170,180,90,.55)":"rgba(190,180,140,.45)";g.beginPath();g.arc(hX+headR*.52,hy-headR*.08,headR*.055,0,7);g.arc(hX+headR*.04,hy-headR*.1,headR*.05,0,7);g.fill();
 g.fillStyle="rgba(40,30,25,.35)";g.beginPath();g.ellipse(hX-headR*.35,hy+headR*.25,headR*.2,headR*.12,0,0,7);g.fill();// decay blotch
 // hair / helmet / crown / clown paint
 if(L.armor){g.fillStyle=shade(g,0,hy-headR,0,hy,"#4a504a","#232622");g.beginPath();g.arc(hX,hy-headR*.05,headR*1.02,Math.PI*1.02,Math.PI*2.05);g.closePath();g.fill();g.fillStyle="rgba(150,160,150,.25)";g.fillRect(hX-headR*.2,hy-headR*.95,headR*.5,headR*.12)}
 else if(false){g.fillStyle=shade(g,0,hy-headR*1.8,0,hy-headR*.6,"#9a8442","#5a4a20");g.beginPath();g.moveTo(hX-headR*.8,hy-headR*.62);for(let i=0;i<5;i++){g.lineTo(hX-headR*.8+(i+.5)*headR*.32,hy-headR*(i%2?1.25:1.6));g.lineTo(hX-headR*.8+(i+1)*headR*.32,hy-headR*.95)}g.lineTo(hX+headR*.8,hy-headR*.62);g.closePath();g.fill();g.strokeStyle="rgba(20,15,5,.6)";g.lineWidth=1;g.stroke();g.fillStyle="#5a1a1e";g.beginPath();g.arc(hX,hy-headR*.82,headR*.1,0,7);g.fill()}
 else if(L.clown){g.fillStyle="#5a3a33";g.beginPath();g.ellipse(hX-headR*.55,hy-headR*.55,headR*.42,headR*.32,0,0,7);g.ellipse(hX-headR*.1,hy-headR*.85,headR*.4,headR*.25,0,0,7);g.fill();
  g.strokeStyle="rgba(70,40,45,.7)";g.lineWidth=1;g.beginPath();g.moveTo(hX+headR*.5,hy+headR*.08);g.lineTo(hX+headR*.48,hy+headR*.4);g.moveTo(hX+headR*.02,hy+headR*.06);g.lineTo(hX,hy+headR*.38);g.stroke();// running sad paint
  g.fillStyle="#6b2f2b";g.beginPath();g.arc(hX+headR*.88,hy+headR*.12,headR*.15,0,7);g.fill()}
 else{g.fillStyle="rgba(35,30,25,.75)";g.beginPath();g.ellipse(hX-headR*.3,hy-headR*.62,headR*.62,headR*.38,-.3,0,7);g.fill()}
 // front arm
 const fax=sx+r*.12,fay=shY+r*.12;
 const ac=mix(L.sk,-.1);
 if(L.longArm){const ex=fax+r*.35-sw*r*.1,ey=footY-r*.15;limb(g,fax,fay,fax+r*.45,fay+r*.55,ex,ey,aw*1.3,ac);g.strokeStyle=mix(L.sk,-.35);g.lineWidth=aw*.45;g.lineCap="round";g.beginPath();g.moveTo(ex,ey);g.lineTo(ex+r*.3,ey+r*.05);g.moveTo(ex,ey);g.lineTo(ex+r*.22,ey+r*.2);g.moveTo(ex,ey);g.lineTo(ex+r*.05,ey+r*.26);g.stroke()}
 else if(L.bigArm){const ex=fax+r*.35,ey=fay+r*.45,hx2=fax+r*.95-sw*r*.08,hy2=fay+r*.55;limb(g,fax,fay,fax+r*.2,fay+r*.3,ex,ey,aw*1.3,ac);limb(g,ex,ey,(ex+hx2)/2,ey+r*.15,hx2,hy2,aw*2.3,ac);const fg=g.createRadialGradient(hx2-aw*.4,hy2-aw*.4,1,hx2,hy2,aw*1.5);fg.addColorStop(0,mix(L.sk,.05));fg.addColorStop(1,mix(L.sk,-.4));g.fillStyle=fg;g.beginPath();g.ellipse(hx2,hy2,aw*1.15,aw*.95,.4,0,7);g.fill()}
 else{if(L.belly)limb(g,fax,fay,sx+tw*2.1,c-r*.05,sx+tw*1.5+sw*r*.1,hipY+r*.25,aw,ac);else if(reach)limb(g,fax,fay,fax+r*.55,fay+r*.22-sw*r*.06,fax+r*1.0,fay+r*.1-sw*r*.08,aw,ac);else limb(g,fax,fay,fax+r*.3-sw*r*.15,fay+r*.4,fax+r*.18-sw*r*.25,fay+r*.88,aw,ac);
 g.fillStyle=mix(L.sk,-.25);g.beginPath();g.arc(L.belly?sx+tw*1.5+sw*r*.1:reach?fax+r*1.02:fax+r*.18-sw*r*.25,L.belly?hipY+r*.27:reach?fay+r*.1-sw*r*.08:fay+r*.9,aw*.55,0,7);g.fill()}
 if(L.armor){g.fillStyle="#3f453e";g.strokeStyle="rgba(10,10,10,.5)";g.lineWidth=1;g.beginPath();g.ellipse(fax,fay-r*.04,r*.28,r*.2,0,0,7);g.fill();g.stroke()}
 if(L.throat&&f%2===0){g.fillStyle="rgba(130,145,60,.7)";g.beginPath();g.ellipse(hX+headR*.55,hy+headR*1.05,headR*.07,headR*.14,0,0,7);g.fill()}}
function zDog(g,c,r,f){const ph=f/4*Math.PI*2,sw=Math.sin(ph),col="#5f4d3c",dk="#3a2e24";const by=c+r*.05,bx=c-r*.15;
 g.fillStyle="rgba(0,0,0,.32)";g.beginPath();g.ellipse(c,c+r*1.05,r*1.4,r*.25,0,0,7);g.fill();
 const leg=(x,ph2,cl)=>limb(g,x,by+r*.2,x+Math.sin(ph2)*r*.25,by+r*.6,x+Math.sin(ph2)*r*.45,c+r*1.0,r*.22,cl);
 leg(bx-r*.75,ph+Math.PI,dk);leg(bx+r*.6,ph,dk);
 g.strokeStyle=dk;g.lineWidth=r*.18;g.lineCap="round";g.beginPath();g.moveTo(bx-r*1.05,by-r*.1);g.quadraticCurveTo(bx-r*1.5,by-r*.3+sw*r*.1,bx-r*1.6,by+r*.2);g.stroke();// tail low
 g.fillStyle=shade(g,0,by-r*.5,0,by+r*.5,mix(col,.1),mix(col,-.4));g.beginPath();g.ellipse(bx,by,r*1.15,r*.5,-.05,0,7);g.fill();g.strokeStyle="rgba(15,12,10,.5)";g.lineWidth=1;g.stroke();
 g.strokeStyle="rgba(25,18,14,.5)";g.lineWidth=1;for(let i=0;i<3;i++){g.beginPath();g.moveTo(bx-r*.1+i*r*.25,by-r*.3);g.lineTo(bx-r*.2+i*r*.25,by+r*.25);g.stroke()}// ribs
 g.fillStyle="#6d5b4c";g.beginPath();g.ellipse(bx-r*.5,by-r*.05,r*.25,r*.15,0,0,7);g.fill();// mangy patch
 leg(bx-r*.5,ph,col);leg(bx+r*.85,ph+Math.PI,col);
 const hx=bx+r*1.25,hy=by-r*.35;limb(g,bx+r*.8,by-r*.1,hx-r*.2,hy,hx,hy,r*.35,col);
 g.fillStyle=shade(g,0,hy-r*.4,0,hy+r*.4,mix(col,.1),mix(col,-.35));g.beginPath();g.ellipse(hx,hy,r*.42,r*.34,0,0,7);g.fill();g.beginPath();g.ellipse(hx+r*.45,hy+r*.12,r*.32,r*.17,.15,0,7);g.fill();
 g.fillStyle="#1c1410";g.beginPath();g.ellipse(hx+r*.45,hy+r*.32,r*.26,r*.07,.15,0,7);g.fill();// open jaw gap
 g.fillStyle=dk;g.beginPath();g.moveTo(hx-r*.25,hy-r*.2);g.lineTo(hx-r*.38,hy-r*.62);g.lineTo(hx-r*.02,hy-r*.28);g.fill();
 g.fillStyle="rgba(12,10,9,.9)";g.beginPath();g.ellipse(hx+r*.15,hy-r*.08,r*.09,r*.07,0,0,7);g.fill();g.fillStyle="rgba(190,170,120,.5)";g.beginPath();g.arc(hx+r*.16,hy-r*.07,r*.03,0,7);g.fill()}
// Heroes: full-body human survivors (3/4 side view, facing right), 4 walk frames, same grounded shading as zombies.
const HL={ // per hero look: skin, top, pants, hair, build
 remy:{sk:"#c99a78",top:"#2f5f9e",pa:"#3a4656",hair:"#3a2618",w:.82,cap:"#2563a8",pack:"#4a4234"},
 gus:{sk:"#d8b49a",top:"#8c8c88",pa:"#4e4a44",hair:"#d9d6cf",w:.95,muffs:1,stoop:.25,glasses:1},
 tina:{sk:"#a8765a",top:"#b8457e",pa:"#2f3340",hair:"#1f1510",w:.72,pony:1,board:1},
 dee:{sk:"#7a5238",top:"#7d45b8",pa:"#2b2a33",hair:"#120d0a",w:.86,phones:1,hood:1}};
function hHuman(g,c,r,L,f){const ph=f/4*Math.PI*2,sw=Math.sin(ph),bob=Math.abs(Math.cos(ph))*r*.05,W=L.w,st=L.stoop||0;
 const footY=c+r*1.3,hipY=c+r*.3-bob,shY=c-r*.6-bob+st*r*.15,hx=c,sx=c+st*r*.25,headR=r*.36,hX=sx+r*.12+st*r*.25,hy=shY-headR*1.15;
 const dk=mix(L.pa,-.35),tdk=mix(L.top,-.35),skd=mix(L.sk,-.2),lw=r*.32*W,aw=r*.2*W;
 g.fillStyle="rgba(0,0,0,.32)";g.beginPath();g.ellipse(c,footY+r*.04,r*.7,r*.18,0,0,7);g.fill();
 if(L.board){g.save();g.translate(sx-r*.55,shY+r*.45);g.rotate(-1.25);g.fillStyle="#3a2c26";g.fillRect(-r*.75,-r*.12,r*1.5,r*.24);g.fillStyle="#222";g.beginPath();g.arc(-r*.5,r*.16,r*.07,0,7);g.arc(r*.5,r*.16,r*.07,0,7);g.fill();g.restore()}
 limb(g,hx-r*.06,hipY,hx-r*.08-sw*r*.25,hipY+r*.48,hx-sw*r*.42,footY,lw,dk);
 g.fillStyle="#1d1c1a";g.beginPath();g.ellipse(hx-sw*r*.42+r*.08,footY,r*.2,r*.09,0,0,7);g.fill();
 limb(g,sx-r*.12,shY+r*.12,sx-r*.1+sw*r*.2,shY+r*.5,sx+sw*r*.32,shY+r*.85,aw,tdk);// back arm swings opposite
 if(L.pack){g.fillStyle=shade(g,0,shY,0,hipY,mix(L.pack,.1),mix(L.pack,-.35));g.beginPath();g.ellipse(sx-r*.38,shY+r*.42,r*.26,r*.4,-.1,0,7);g.fill();g.strokeStyle="rgba(15,14,12,.5)";g.lineWidth=1;g.stroke()}
 const tw=r*.52*W;g.fillStyle=shade(g,0,shY,0,hipY+r*.1,mix(L.top,.12),mix(L.top,-.4));g.beginPath();g.moveTo(sx-tw*.85,shY+r*.02);g.quadraticCurveTo(sx,shY-r*.12,sx+tw*.85,shY+r*.02);g.lineTo(hx+tw*.75,hipY+r*.12);g.lineTo(hx-tw*.8,hipY+r*.12);g.closePath();g.fill();g.strokeStyle="rgba(15,14,12,.5)";g.lineWidth=1.2;g.stroke();
 g.strokeStyle="rgba(255,250,230,.16)";g.lineWidth=r*.05;g.beginPath();g.moveTo(sx+tw*.7,shY+r*.08);g.lineTo(hx+tw*.6,hipY);g.stroke();
 g.strokeStyle="rgba(20,18,15,.3)";g.lineWidth=1;g.beginPath();g.moveTo(sx+tw*.1,shY+r*.1);g.lineTo(hx+tw*.05,hipY+r*.08);g.stroke();// zipper / seam
 if(L.pack){g.strokeStyle="#2b261e";g.lineWidth=r*.07;g.beginPath();g.moveTo(sx-tw*.3,shY);g.lineTo(sx+tw*.1,hipY-r*.1);g.stroke()}
 if(L.hood){g.fillStyle=tdk;g.beginPath();g.ellipse(sx-tw*.3,shY+r*.02,r*.28,r*.13,0,0,7);g.fill()}
 g.fillStyle=mix(L.pa,-.5);g.fillRect(hx-tw*.8,hipY+r*.06,tw*1.55,r*.07);// belt line
 limb(g,hx+r*.06,hipY,hx+r*.08+sw*r*.25,hipY+r*.48,hx+sw*r*.42,footY,lw,L.pa);
 g.fillStyle="#26241f";g.beginPath();g.ellipse(hx+sw*r*.42+r*.12,footY,r*.22,r*.1,0,0,7);g.fill();
 limb(g,sx+r*.08,shY+r*.05,hX-r*.02,shY-r*.05,hX-r*.02,hy+headR*.6,r*.17,skd);// neck
 const hg=g.createRadialGradient(hX-headR*.2,hy-headR*.4,headR*.1,hX,hy,headR*1.1);hg.addColorStop(0,mix(L.sk,.15));hg.addColorStop(.7,L.sk);hg.addColorStop(1,mix(L.sk,-.35));
 g.fillStyle=hg;g.beginPath();g.ellipse(hX,hy,headR*.88,headR,0,0,7);g.fill();g.strokeStyle="rgba(15,14,12,.45)";g.lineWidth=1;g.stroke();
 g.fillStyle=L.sk;g.beginPath();g.ellipse(hX+headR*.8,hy+headR*.12,headR*.16,headR*.12,0,0,7);g.fill();// nose
 g.fillStyle=mix(L.sk,-.15);g.beginPath();g.ellipse(hX+headR*.35,hy+headR*.72,headR*.42,headR*.22,.25,0,7);g.fill();// jaw
 g.strokeStyle="rgba(60,30,25,.6)";g.lineWidth=1;g.beginPath();g.moveTo(hX+headR*.48,hy+headR*.52);g.lineTo(hX+headR*.72,hy+headR*.5);g.stroke();// neutral closed mouth
 g.fillStyle="#1a1412";g.beginPath();g.ellipse(hX+headR*.46,hy-headR*.1,headR*.08,headR*.1,0,0,7);g.fill();// eye
 g.strokeStyle=mix(L.hair,-.1);g.lineWidth=1.3;g.beginPath();g.moveTo(hX+headR*.3,hy-headR*.32);g.lineTo(hX+headR*.66,hy-headR*.28);g.stroke();// brow, level (determined, not grim)
 g.fillStyle=mix(L.sk,-.3);g.beginPath();g.ellipse(hX-headR*.25,hy+headR*.05,headR*.13,headR*.18,0,0,7);g.fill();// ear
 g.fillStyle=L.hair;g.beginPath();g.ellipse(hX-headR*.2,hy-headR*.48,headR*.78,headR*.5,-.25,0,7);g.fill();
 if(L.pony){g.strokeStyle=L.hair;g.lineCap="round";g.lineWidth=headR*.3;g.beginPath();g.moveTo(hX-headR*.7,hy-headR*.3);g.quadraticCurveTo(hX-headR*1.4,hy+headR*.1-sw*headR*.15,hX-headR*1.3,hy+headR*.7);g.stroke()}
 if(L.cap){g.fillStyle=shade(g,0,hy-headR*1.1,0,hy-headR*.3,mix(L.cap,.15),mix(L.cap,-.35));g.beginPath();g.ellipse(hX-headR*.05,hy-headR*.45,headR*.92,headR*.6,0,Math.PI,0);g.fill();g.fillStyle=mix(L.cap,-.45);g.beginPath();g.ellipse(hX+headR*.85,hy-headR*.45,headR*.55,headR*.13,.08,0,7);g.fill();g.fillStyle="rgba(255,255,255,.15)";g.fillRect(hX-headR*.4,hy-headR*.85,headR*.4,headR*.1)}
 if(L.muffs){g.strokeStyle="#5a5a58";g.lineWidth=headR*.14;g.beginPath();g.arc(hX-headR*.2,hy-headR*.1,headR*.95,Math.PI*1.1,Math.PI*1.9);g.stroke();g.fillStyle="#e9e7e1";g.beginPath();g.arc(hX-headR*.25,hy+headR*.05,headR*.3,0,7);g.fill();g.strokeStyle="rgba(15,14,12,.4)";g.lineWidth=1;g.stroke()}
 if(L.phones){g.strokeStyle="#151515";g.lineWidth=headR*.16;g.beginPath();g.arc(hX-headR*.15,hy-headR*.05,headR*1.0,Math.PI*1.05,Math.PI*1.95);g.stroke();g.fillStyle="#1d1d22";g.beginPath();g.ellipse(hX-headR*.25,hy+headR*.05,headR*.3,headR*.36,0,0,7);g.fill();g.fillStyle="#a855f7";g.beginPath();g.arc(hX-headR*.25,hy+headR*.05,headR*.12,0,7);g.fill()}
 if(L.glasses){g.strokeStyle="#3a3a3a";g.lineWidth=1;g.beginPath();g.arc(hX+headR*.48,hy-headR*.08,headR*.2,0,7);g.moveTo(hX+headR*.28,hy-headR*.1);g.lineTo(hX-headR*.15,hy-headR*.15);g.stroke()}
 const fax=sx+r*.14,fay=shY+r*.12;limb(g,fax,fay,fax+r*.12-sw*r*.2,fay+r*.4,fax+r*.18-sw*r*.32,fay+r*.75,aw,mix(L.top,-.08));
 g.fillStyle=skd;g.beginPath();g.arc(fax+r*.18-sw*r*.32,fay+r*.8,aw*.6,0,7);g.fill()}
function gnomeFig(g,c){const r=11;g.fillStyle="rgba(0,0,0,.32)";g.beginPath();g.ellipse(c,c+r*1.15,r*.75,r*.2,0,0,7);g.fill();
 limb(g,c-r*.2,c+r*.6,c-r*.25,c+r*.85,c-r*.3,c+r*1.1,r*.28,"#3b3a46");limb(g,c+r*.2,c+r*.6,c+r*.25,c+r*.85,c+r*.32,c+r*1.1,r*.28,"#3b3a46");
 g.fillStyle="#2a1e16";g.beginPath();g.ellipse(c-r*.3,c+r*1.12,r*.22,r*.1,0,0,7);g.ellipse(c+r*.4,c+r*1.12,r*.22,r*.1,0,0,7);g.fill();
 g.fillStyle=shade(g,0,c-r*.2,0,c+r*.8,"#3d5f8f","#1f3352");g.beginPath();g.moveTo(c-r*.55,c-r*.05);g.lineTo(c+r*.55,c-r*.05);g.lineTo(c+r*.7,c+r*.72);g.lineTo(c-r*.7,c+r*.72);g.closePath();g.fill();g.strokeStyle="rgba(15,14,12,.5)";g.lineWidth=1;g.stroke();
 g.fillStyle="#5a3f28";g.fillRect(c-r*.68,c+r*.42,r*1.36,r*.12);
 limb(g,c-r*.5,c+r*.05,c-r*.75,c+r*.3,c-r*.62,c+r*.55,r*.2,"#2f4b73");limb(g,c+r*.5,c+r*.05,c+r*.85,c+r*.1,c+r*1.05,c-r*.15,r*.2,"#2f4b73");
 g.fillStyle="#7a756c";g.beginPath();g.arc(c+r*1.1,c-r*.22,r*.16,0,7);g.fill();// pebble in hand
 g.fillStyle="#c9a184";g.beginPath();g.ellipse(c,c-r*.35,r*.36,r*.32,0,0,7);g.fill();
 g.fillStyle="#d9d4c8";g.beginPath();g.moveTo(c-r*.4,c-r*.35);g.quadraticCurveTo(c,c+r*.6,c+r*.42,c-r*.35);g.closePath();g.fill();// beard
 g.fillStyle="#b88a6c";g.beginPath();g.arc(c+r*.08,c-r*.3,r*.11,0,7);g.fill();// nose
 g.fillStyle=shade(g,0,c-r*1.6,0,c-r*.5,"#a23a2c","#5e1e16");g.beginPath();g.moveTo(c-r*.48,c-r*.5);g.quadraticCurveTo(c-r*.1,c-r*1.3,c+r*.3,c-r*1.6);g.quadraticCurveTo(c+r*.25,c-r*1.0,c+r*.5,c-r*.5);g.closePath();g.fill();g.strokeStyle="rgba(15,14,12,.5)";g.stroke()}
// Sprite atlas: every walk frame, cropped tight and pre-flipped, so drawing is one drawImage, no save/scale/rotate/restore
let ATL=null;const ZA={},HA={};
function bbox(c){const w=c.width,h=c.height,d=c.getContext("2d").getImageData(0,0,w,h).data;let x0=w,y0=h,x1=-1,y1=-1;for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(d[(y*w+x)*4+3]>6){if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y}return x1<0?[0,0,1,1]:[x0,y0,x1-x0+1,y1-y0+1]}
function buildAtlas(){const items=[];const flip=c=>{const o=document.createElement("canvas");o.width=c.width;o.height=c.height;const g=o.getContext("2d");g.translate(c.width,0);g.scale(-1,1);g.drawImage(c,0,0);return o};
 const add=(dst,key,frames)=>{dst[key]=[];frames.forEach(c=>{for(const cc of[c,flip(c)]){const b=bbox(cc),it={c:cc,b,full:c.width};items.push(it);dst[key].push(it)}})};
 for(const k in ZS)add(ZA,k,ZS[k]);for(const k in HS)add(HA,k,HS[k]);
 const AW=2048;let x=0,y=0,rh=0;items.sort((a,b)=>b.b[3]-a.b[3]);for(const it of items){if(x+it.b[2]>AW){x=0;y+=rh+1;rh=0}it.x=x;it.y=y;x+=it.b[2]+1;rh=Math.max(rh,it.b[3])}
 ATL=document.createElement("canvas");ATL.width=AW;ATL.height=y+rh+1;const g=ATL.getContext("2d");
 for(const it of items){g.drawImage(it.c,it.b[0],it.b[1],it.b[2],it.b[3],it.x,it.y,it.b[2],it.b[3])}
 for(const dst of[ZA,HA])for(const k in dst)dst[k]=dst[k].map(it=>[it.x,it.y,it.b[2],it.b[3],(it.b[0]-it.full/2)/2,(it.b[1]-it.full/2)/2,it.b[2]/2,it.b[3]/2])}
function blitA(a,x,y){cx.drawImage(ATL,a[0],a[1],a[2],a[3],x+a[4],y+a[5],a[6],a[7])}
function buildZombies(){for(const k in ZT){const z=ZT[k],r=z.r,s=Math.ceil(r*(k==="boss"?3.9:3.4)+10);ZS[k]=[];
 for(let f=0;f<4;f++){mkSpr("z_"+k+f,s,(g,c)=>{if(k==="dog")zDog(g,c,r,f);else zHuman(g,c,r,ZL[k],f)});ZS[k].push(SPR["z_"+k+f])}SPR["z_"+k]=ZS[k][0]}}
function drawZ(z,face){blitA(ZA[z.type][(((z.wob*(z.type==="dog"||z.type==="runner"?1.5:1))&3)<<1)|(face<0?1:0)],z.x,z.y)}
function buildSprites(){
 buildZombies();
 for(const k in HEROES){HS[k]=[];for(let f=0;f<4;f++){mkSpr("h_"+k+f,62,(g,c)=>hHuman(g,c,15.5,HL[k],f));HS[k].push(SPR["h_"+k+f])}SPR["h_"+k]=HS[k][0]}
 buildAtlas();
 const em=["🐔","🍌","🪠","🦆","🥧","🍗","🪙","🍕","🧲","🎁","🐱","😼","🍨","🔥","🧀"];
 for(const e of em)mkSpr("e_"+e,36,(g,c)=>{g.font="26px serif";g.textAlign="center";g.textBaseline="middle";g.fillText(e,c,c+1)});
 const croc=(col,flame)=>(g,c)=>{g.save();g.translate(c,c);g.strokeStyle="#000";g.lineWidth=1.5;if(flame){g.fillStyle="#fb923c";g.beginPath();g.moveTo(-14,4);g.quadraticCurveTo(-10,-14,-4,-4);g.quadraticCurveTo(0,-16,4,-4);g.quadraticCurveTo(10,-14,14,4);g.fill()}
  g.fillStyle=col;g.beginPath();g.moveTo(-14,6);g.quadraticCurveTo(-15,-4,-6,-6);g.lineTo(8,-6);g.quadraticCurveTo(15,-6,15,3);g.lineTo(15,8);g.lineTo(-14,8);g.closePath();g.fill();g.stroke();
  g.fillStyle="#222";g.fillRect(-14,8,29,3);g.fillStyle="#0006";for(const[x,y]of[[-6,-2],[-1,-2],[4,-2],[9,-1],[-3,2],[2,2],[7,3]]){g.beginPath();g.arc(x,y,1.4,0,7);g.fill()}
  g.strokeStyle=col;g.lineWidth=3;g.beginPath();g.arc(-9,2,7,Math.PI*.9,Math.PI*1.6);g.stroke();g.fillStyle="#fff";g.beginPath();g.arc(-11,-2,1.6,0,7);g.fill();g.restore()};
 mkSpr("croc",36,croc("#22c55e",true));mkSpr("crocE",36,croc("#a855f7",true));
 mkSpr("gnome",36,(g,c)=>gnomeFig(g,c));
 // Pillowcase of Apples: knot at center, bag hangs down (heavy bottom)
 mkSpr("sack",44,(g,c)=>{g.save();g.translate(c,c);g.strokeStyle="#3b2f1e";g.lineWidth=1.4;g.lineJoin="round";g.lineCap="round";
  g.fillStyle="rgba(0,0,0,.25)";g.beginPath();g.ellipse(0,18,10,3.5,0,0,7);g.fill();
  const cloth=g.createLinearGradient(-12,-4,12,20);cloth.addColorStop(0,"#f7f0d8");cloth.addColorStop(.5,"#e8d9b0");cloth.addColorStop(1,"#c4b484");
  g.fillStyle=cloth;g.beginPath();g.moveTo(-3.5,-5);g.quadraticCurveTo(-14,-1,-13,9);g.quadraticCurveTo(-11,20,0,23);g.quadraticCurveTo(11,20,13,9);g.quadraticCurveTo(14,-1,3.5,-5);g.closePath();g.fill();g.stroke();
  // cinched neck + knot
  g.fillStyle="#d6c7a1";g.beginPath();g.moveTo(-4,-5);g.lineTo(-3,-11);g.quadraticCurveTo(0,-14,3,-11);g.lineTo(4,-5);g.closePath();g.fill();g.stroke();
  g.beginPath();g.arc(0,-13,3.1,0,7);g.fill();g.stroke();g.beginPath();g.arc(3.4,-12.2,2.2,0,7);g.fill();g.stroke();
  // apple lumps / peeking apples at the bulging bottom
  [[-5.5,13,3.5],[4.2,15,3.7],[0.2,10,2.7]].forEach(([x,y,r])=>{g.fillStyle="#dc2626";g.beginPath();g.arc(x,y,r,0,7);g.fill();g.strokeStyle="#3b2f1e";g.lineWidth=1;g.stroke();
   g.fillStyle="#f87171";g.beginPath();g.arc(x-1.1,y-1.1,r*.35,0,7);g.fill();g.fillStyle="#4d7c0f";g.beginPath();g.ellipse(x+.7,y-r-1,1.5,.8,-.5,0,7);g.fill()});
  g.strokeStyle="rgba(80,60,30,.35)";g.lineWidth=.8;g.beginPath();g.moveTo(-2,-4);g.quadraticCurveTo(-7,8,-2,19);g.stroke();g.restore()});
 mkSpr("rocket",40,(g,c)=>{g.save();g.translate(c,c);g.rotate(-Math.PI/2);g.strokeStyle="#1c1917";g.lineWidth=1.3;
  g.fillStyle="#a16207";g.fillRect(-1,-2,16,4);g.strokeRect(-1,-2,16,4);
  g.fillStyle="#ef4444";g.beginPath();g.moveTo(-14,-5.5);g.lineTo(3,-5.5);g.lineTo(8,0);g.lineTo(3,5.5);g.lineTo(-14,5.5);g.closePath();g.fill();g.stroke();
  g.fillStyle="#fff";g.fillRect(-9,-5.5,3.2,11);g.fillStyle="#fbbf24";g.beginPath();g.moveTo(-14,0);g.lineTo(-22,-4);g.lineTo(-18,0);g.lineTo(-22,4);g.closePath();g.fill();
  g.fillStyle="#fb923c";g.beginPath();g.moveTo(-14,0);g.lineTo(-19,-2);g.lineTo(-16,0);g.lineTo(-19,2);g.closePath();g.fill();g.restore()});
 mkSpr("rocketE",40,(g,c)=>{g.save();g.translate(c,c);g.rotate(-Math.PI/2);g.strokeStyle="#1c1917";g.lineWidth=1.3;
  g.fillStyle="#a16207";g.fillRect(-1,-2,16,4);g.strokeRect(-1,-2,16,4);
  g.fillStyle="#7c3aed";g.beginPath();g.moveTo(-14,-5.5);g.lineTo(3,-5.5);g.lineTo(8,0);g.lineTo(3,5.5);g.lineTo(-14,5.5);g.closePath();g.fill();g.stroke();
  g.fillStyle="#fde047";g.fillRect(-9,-5.5,3.2,11);g.fillStyle="#fb923c";g.beginPath();g.moveTo(-14,0);g.lineTo(-22,-4);g.lineTo(-18,0);g.lineTo(-22,4);g.closePath();g.fill();g.restore()});

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
function endlessPow(){if(G.mode!=="endless")return 1;let ev=0,wl=0;for(const k of G.order){wl+=G.w[k].lv;if(G.w[k].evo)ev++}const t=G.t;return(1+(G.lvl-1)*.05+wl*.02+ev*.2)*(1+Math.pow(t/480,1.6))}
function spawnZ(type,x,y,boss){const z=obtain("z"),T=ZT[type];const sc=G.mode==="journey"?G.diff:(type==="boss"?1:endlessPow()),tm=1+G.t/100;
 const D=DF();Object.assign(z,{type,x,y,r:T.r,hp:T.hp*tm*sc*D.hp*(boss?1+G.bossN*.6:1),spd:T.spd*rnd(.9,1.1)*(type==="boss"?1:(G.mode==="endless"?Math.min(2,1+G.t/700):Math.min(1.5,1+G.t/900)))*D.spd,dmg:T.dmg*(1+G.t/(G.mode==="endless"?250:400))*D.dmg,elite:false,spitCd:2,xp:T.xp,flash:0,kx:0,ky:0,slow:0,wob:Math.random()*6,dash:0,dashCd:3,name:boss||"",edge:0,lure:0,atk:0,at:0,rear:0,grabT:0,sr:0,hitDone:0});
 z.stageBoss=false;if(boss&&G.mode==="journey"&&!G.stageBossSpawned){z.stageBoss=true;G.stageBossSpawned=true;G.stageBossName=boss}z.max=z.hp;z.hit=z.hit||{};for(const k in z.hit)z.hit[k]=0;ent.z.push(z);return z}
function edgePt(m=30){const p=G.p,hw=W/2+m,hh=H/2+m,per=2*(hw+hh),r=Math.random()*per;let x,y;if(r<2*hw){x=r-hw;y=Math.random()<.5?-hh:hh}else{y=r-2*hw-hh;x=Math.random()<.5?-hw:hw}return[p.x+x,p.y+y]}
function waves(){const t=G.t,p=G.p;G.waveI=G.waveI||0;
 if(G.waveI===0&&t>1.2){G.waveI=1;const n=30;for(let i=0;i<n;i++){const a=i/n*Math.PI*2;spawnZ(i%5===0?"runner":"shamb",p.x+Math.cos(a)*(W/2+25),p.y+Math.sin(a)*(H/2+25))}G.banner="🧟 THEY'RE EVERYWHERE!";G.bannerT=2;sfx("boss");G.shake=6}
 if(G.waveI===1&&t>14){G.waveI=2;const[hx,hy]=edgePt();for(let i=0;i<14;i++)spawnZ("runner",hx+rnd(-40,40),hy+rnd(-40,40));G.banner="🏃 Runner pack!";G.bannerT=1.5}
 if(G.waveI===2&&t>32){G.waveI=3;const n=36;for(let i=0;i<n;i++){const a=i/n*Math.PI*2;spawnZ(i%6===0?"dog":"shamb",p.x+Math.cos(a)*(W/2+25),p.y+Math.sin(a)*(H/2+25))}G.banner="🧟 Surrounded!";G.bannerT=1.5}}
function eliteWaves(t){G.eliteN=G.eliteN||0;if(t>240+G.eliteN*75){G.eliteN++;const p=G.p,n=14+G.eliteN*4;for(let i=0;i<n;i++){const a=i/n*Math.PI*2,ty=pick(["tank","runner","dog","clown","spit"]);const z=spawnZ(ty,p.x+Math.cos(a)*(W/2+30),p.y+Math.sin(a)*(H/2+30));z.elite=true;z.hp*=3.5;z.max=z.hp;z.spd*=1.15;z.dmg*=1.5;z.xp*=4}
 G.banner="⭐ ELITE WAVE "+G.eliteN+"!";G.bannerT=2;sfx("boss");G.shake=8}}
function spawnTick(dt){if(G.won)return;const t=G.t;waves();if(G.bossAlive&&ent.z.length>120)return;
 const EN=G.mode==="endless";const rate=EN?(1.2+t/65)*(1+(G.lvl-1)*.03):(2.0+t/45)*((G.stage<2?.62:.75)+G.stage*.09);G.spawnAcc+=dt*Math.min(rate*DF().sp,EN?60:36);
 const cap=EN?Math.min(420,60+t*.7+G.lvl*3):Math.min(330,90+t*.6);
 if(EN)eliteWaves(t);
 if(G.infT>0){G.infAcc+=dt*Math.min(rate*DF().sp,EN?60:36);while(G.infAcc>=1){G.infAcc--;if(!edgeSpawn(cap))break}}else G.infAcc=0;
 if(G.burstN>0){G.burstAcc+=dt*INF.burst/INF.burstT;while(G.burstAcc>=1&&G.burstN>0){G.burstAcc--;G.burstN--;edgeSpawn(cap)}}
 while(G.spawnAcc>=1&&ent.z.length<cap){G.spawnAcc--;
  const pool=Object.keys(ZT).filter(k=>ZT[k].t<=t+(G.mode==="journey"?G.stage*11:0));
  let type="shamb";const r=Math.random();if(r<.45)type="shamb";else type=pick(pool);if(EN&&t>120&&Math.random()<Math.min(.22,.04+t/3000))type="spit";
  if(Math.random()<.004*Math.min(1,t/60)){const[hx,hy]=edgePt();for(let i=0;i<10;i++)spawnZ(t>80?"dog":"runner",hx+rnd(-30,30),hy+rnd(-30,30))} // horde!
  const[ex,ey]=edgePt();spawnZ(type,ex,ey)}
 if(t>=G.nextBoss&&!G.bossAlive){const nm=G.mode==="journey"?STAGES[G.stage].boss:pick(["Big Gulp Gary","Principal Brains","Mega Mall Santa","Sir Moans-a-Lot","Grill Master Ghoul"]);
  const a=Math.random()*7;G.bossAlive=spawnZ("boss",G.p.x+Math.cos(a)*380,G.p.y+Math.sin(a)*380,nm);G.bossN++;G.banner=(G.mode==="journey"?"⚠️ STAGE BOSS: ":"⚠️ BOSS: ")+nm;G.bannerT=3;sfx("boss");G.shake=12;
  G.nextBoss=G.mode==="journey"?1e9:G.t+170}}

// ===== Damage =====
function txt(x,y,s,c){if(ent.txt.length>70)return;const o=obtain("txt");Object.assign(o,{x,y,s,c,l:.7});ent.txt.push(o)}
function parts(x,y,n,c,sp=120){for(let i=0;i<n&&ent.part.length<450;i++){const o=obtain("part"),a=Math.random()*7,v=rnd(20,sp);Object.assign(o,{x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,l:rnd(.3,.7),c,r:rnd(2,5)});ent.part.push(o)}}
function hurt(z,dmg,key,kb,ox,oy,cdT){if(z.hp<=0)return false;if(key&&cdT){if(G.t-(z.hit[key]||-9)<cdT)return false;z.hit[key]=G.t}
 const S=stat();let d=dmg*S.dmg*(1-(ZT[z.type].ar||0)),cr=Math.random()<S.crit;if(cr)d*=2;z.hp-=d;z.flash=.1;
 if(kb&&z.type!=="boss"){const dx=z.x-ox,dy=z.y-oy,l=Math.hypot(dx,dy)||1,m=ZT[z.type].kb;z.kx+=dx/l*kb*m;z.ky+=dy/l*kb*m}
 txt(z.x,z.y-z.r,Math.round(d)+(cr?"!":""),cr?"#facc15":"#fff");if(z.hp<=0)killZ(z);return true}
function aoe(x,y,r,dmg,key,kb,cdT){for(let i=ent.z.length-1;i>=0;i--){const z=ent.z[i];if(z.hp>0&&(z.x-x)**2+(z.y-y)**2<(r+z.r)**2)hurt(z,dmg,key,kb,x,y,cdT)}}
function killZ(z){G.kills++;puKill(z);if(z.type==="spewer")spewerGlob(z.x,z.y);const col=z.type==="clown"?"#f472b6":z.type==="bloat"?"#a78bfa":"#84cc16";parts(z.x,z.y,z.type==="boss"?40:7,col);sfx("pop");
 dropGem(z.x,z.y,z.xp);const S=stat();if(Math.random()<.035*S.coin)item(z.x+8,z.y,"coin");if(Math.random()<.004)item(z.x,z.y,"pizza");if(Math.random()<.0015)item(z.x,z.y,"magnet");
 if(z.type==="clown"){sfx("honk");parts(z.x,z.y,10,pick(["#ef4444","#3b82f6","#facc15"]),200)}
 if(z.type==="bloat"){sfx("splat");parts(z.x,z.y,18,"#a78bfa",220);const zn=zone(z.x,z.y,55,1.2,0,"goo");G.shake=Math.max(G.shake,4);
  if(Math.hypot(G.p.x-z.x,G.p.y-z.y)<60)hitPlayer(8);setTimeout(()=>{if(G)aoe(z.x,z.y,60,25,"burst",60)},0)}
 if(z.type==="boss"){G.bossAlive=null;G.shake=20;sfx("boom");for(let i=0;i<12;i++)item(z.x+rnd(-50,50),z.y+rnd(-50,50),"coin");item(z.x,z.y,"chest");ent.item[ent.item.length-1].pull=true;ent.gem.forEach(g=>g.pull=true);txt(z.x,z.y-50,"BOSS DEFEATED!","#facc15");
  if(z.stageBoss)stageClear()}
 z.hp=0}
function stageClear(){if(!G||G.mode!=="journey"||G.won)return;G.won=true;G.wonT=2.2;G.p.inv=1e9;G.p.hp=Math.max(G.p.hp,1);G.banner="🎉 "+STAGES[G.stage].n+" CLEARED!";G.bannerT=3;sfx("win");const P=prog();if(!P.cleared.includes(G.stage))P.cleared.push(G.stage);if(G.stage<LAST)P.stage=Math.max(P.stage,G.stage+1);persist();
 for(const z of ent.z){if(z.hp>0&&!z.stageBoss){parts(z.x,z.y,4,"#84cc16");z.hp=0}}}
function dropGem(x,y,v){if(ent.gem.length>400){const g=ent.gem[Math.floor(Math.random()*ent.gem.length)];g.v+=v;return}const g=obtain("gem");Object.assign(g,{x,y,v,pull:false});ent.gem.push(g)}
function item(x,y,k){const o=obtain("item");Object.assign(o,{x,y,k,l:30,pull:false});ent.item.push(o)}
function zone(x,y,r,l,dmg,k,slow=0){const o=obtain("zone");Object.assign(o,{x,y,r,l,ml:l,dmg,k,slow});ent.zone.push(o);return o}
// boss: atk 1=charge wind-up (red lane shown), 2=rush, 3=recover/stagger; 4=slam wind-up (red ring), 5=shockwave expanding
function bossAI(z,dt,dx,dy,d){const A=BOSSA,p=G.p;z.at=(z.at||0)-dt;z.atk=z.atk||0;
 if(!z.atk){z.dashCd-=dt;if(z.dashCd<=0){z.dashCd=A.cd;if(d<190&&Math.random()<.6){z.atk=4;z.at=A.slamWind;z.sx=z.x;z.sy=z.y}else{z.atk=1;z.at=A.wind;z.dvx=dx/d;z.dvy=dy/d}
   txt(z.x,z.y-z.r-10,pick(["BRAAAINS!","SNACK ATTACK!","CHARGE!!","NOM TIME"]),"#f87171")}return}
 if(z.atk===2){z.x+=z.dvx*A.rushSpd*dt;z.y+=z.dvy*A.rushSpd*dt}
 if(z.atk===5){z.sr=(A.slamWind-z.at)*0+(z.sr||0)+A.slamSpd*dt;const pd=Math.hypot(p.x-z.sx,p.y-z.sy);if(!z.hitDone&&Math.abs(pd-z.sr)<16){z.hitDone=1;hitPlayer(A.slamDmg)}if(z.sr>=A.slamR){z.atk=3;z.at=.5}return}
 if(z.at<=0){if(z.atk===1){z.atk=2;z.at=A.rush;G.shake=Math.max(G.shake,4)}else if(z.atk===2){z.atk=3;z.at=A.recover}else if(z.atk===4){z.atk=5;z.sr=z.r;z.hitDone=0;G.shake=Math.max(G.shake,8);sfx("boom")}else z.atk=0}}
// Spewer infest: 2x horde spawn (extras enter from left/right screen edges, alternating), horde 1.25x speed; timer refreshes, never stacks
function infest(){if(!(G.infT>0)){G.burstN=INF.burst;G.burstAcc=0;G.cueT=1.2}G.infT=INF.dur;G.banner="🤢 INFESTED! Horde incoming!";G.bannerT=1.5}
function edgeSpawn(cap){if(ent.z.length>=cap)return null;G.edgeSide=-G.edgeSide;const p=G.p,z=spawnZ("shamb",p.x+G.edgeSide*(W/2+20+Math.random()*25),p.y+rnd(-H/2+20,H/2-20));z.edge=1;z.ex0=z.x-p.x;return z}
function spewerGlob(x,y){const o=(pools.glob&&pools.glob.pop())||{};o.x=x;o.y=y;o.l=INF.globL;G.globs.push(o)}
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
 case"flip":if(w.cd<=0){w.cd=(E?.7:1.5-L*.1)*S.cd;const n=1+Math.floor(L/2)+(E?2:0);const ft=nearestN(p.x,p.y,n,700);for(let i=0;i<n;i++){const t=ft[i];const a=t?Math.atan2(t.y-p.y,t.x-p.x)+rnd(-.2,.2):Math.random()*7;bullet({k:"flip",x:p.x,y:p.y,vx:Math.cos(a)*300,vy:Math.sin(a)*300,r:11,dmg:10+L*3+(E?8:0),pierce:2,l:.8,spr:"croc",spin:1,fire:(30+L*4)*S.area*(E?1.4:1),fd:3+L+(E?6:0)})}sfx("fire")}break;
 case"sack":{const reach=(SACK_REACH0+(L-1)*SACK_REACH_LV+(E?16:0))*S.area,half=(SACK_ARC0+(L-1)*SACK_ARC_LV+(E?40*Math.PI/180:0))/2,cd=(SACK_CD0-(L>=3?.06:0)-(E?.04:0))*S.cd;w.reach=reach;w.half=half;if(w.swing>0)w.swing-=dt;if(w.cd<=0){w.cd=cd;const t=nearest(p.x,p.y,reach+40);w.aim=t?Math.atan2(t.y-p.y,t.x-p.x):Math.atan2(p.dy,p.dx);w.swing=SACK_SWING;const dmg=SACK_DMG+L*3+(E?10:0);for(const z of ent.z){if(z.hp<=0)continue;const dx=z.x-p.x,dy=z.y-p.y,d=Math.hypot(dx,dy);if(d>reach+z.r)continue;let da=Math.atan2(dy,dx)-w.aim;while(da>Math.PI)da-=Math.PI*2;while(da<-Math.PI)da+=Math.PI*2;if(Math.abs(da)<=half)hurt(z,dmg,"sk",SACK_KB,p.x,p.y,.2)}sfx("whump")}}break;
 case"rocket":if(w.cd<=0){w.cd=(ROCKET_CD0-(L>=4?.25:0)-(E?.15:0))*S.cd;const n=(L>=5?3:L>=3?2:1)+(E?1:0),blast=(ROCKET_BLAST0+(L-1)*ROCKET_BLAST_LV+(E?25:0))*S.area,dmg=ROCKET_DMG+L*5+(E?12:0);const ts=nearestN(p.x,p.y,n,Math.max(W,H)/2+20);for(let i=0;i<n;i++){const t=ts[i%Math.max(1,ts.length)];const a=t?Math.atan2(t.y-p.y,t.x-p.x)+(n>1&&ts.length<n?(i-(n-1)/2)*.18:0):Math.atan2(p.dy,p.dx)+(i-(n-1)/2)*.18;
   bullet({k:"rocket",x:p.x,y:p.y,vx:Math.cos(a)*ROCKET_SPD,vy:Math.sin(a)*ROCKET_SPD,r:8,dmg,pierce:1,l:ROCKET_LIFE,ex:blast,kb:70,spr:E?"finale":"rocket"})}sfx("fizz")}break;}}}
function bUpdate(dt){const S=stat();
 for(let i=ent.b.length-1;i>=0;i--){const b=ent.b[i];b.l-=dt;b.t+=dt;
  if(b.k==="banana"){b.vx+=b.ax*dt;b.vy+=b.ay*dt}
  if(b.k==="pie"){const f=1-b.l/b.ml;b.x=b.sx+(b.gx-b.sx)*f;b.y=b.sy+(b.gy-b.sy)*f;b.h=Math.sin(f*Math.PI)*80;if(b.l<=0){sfx("splat");parts(b.gx,b.gy,10,"#fff8e7",160);aoe(b.gx,b.gy,b.ex,b.dmg,null,30);zone(b.gx,b.gy,b.ex*.8,2.5,0,"cream",1);release("b",ent.b,i)}continue}
  if(b.k==="bubble"){b.vx*=.995;b.vy*=.995;b.x+=Math.sin(b.t*4)*.6}
  b.x+=b.vx*dt;b.y+=b.vy*dt;let dead=b.l<=0;
  if(!dead)for(const z of ent.z){if(z.hp<=0||b.hits.includes(z))continue;if((z.x-b.x)**2+(z.y-b.y)**2<(z.r+b.r)**2){
   if(b.k==="duck"){dead=true;break}
   if(b.k==="banana"){if(hurt(z,b.dmg,"ba"+(i%6),35,b.x,b.y,.4)){}continue}
   b.hits.push(z);if(b.k==="rocket"){dead=true;break}hurt(z,b.dmg,null,b.kb,b.x,b.y);if(b.slow)z.slow=b.slow;if(b.k==="chicken"&&b.ex){dead=true;break}if(b.hits.length>=b.pierce){dead=true;break}}}
  if(dead){if(b.k==="duck"){sfx("quack");sfx("boom");parts(b.x,b.y,14,"#facc15",200);aoe(b.x,b.y,b.ex,b.dmg,null,80);zone(b.x,b.y,b.ex,.3,0,"boom");G.shake=Math.max(G.shake,3)}
   if(b.k==="rocket"){sfx("boom");parts(b.x,b.y,16,"#fb923c",220);parts(b.x,b.y,10,"#fde047",180);aoe(b.x,b.y,b.ex,b.dmg,null,70);zone(b.x,b.y,b.ex,.35,0,"boom");G.shake=Math.max(G.shake,3)}
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
  let dx=p.x-z.x,dy=p.y-z.y;const T1=ZT[z.type].tier===1&&!z.elite;z.lure=0;if(T1&&G.globs.length){for(const o of G.globs){const gx=o.x-z.x,gy=o.y-z.y;if(gx*gx+gy*gy<INF.globR*INF.globR){dx=gx;dy=gy;z.lure=1;break}}}const d=Math.hypot(dx,dy)||1;
  if(d>Math.max(W,H)*1.3&&z.type!=="boss"){const a=Math.random()*7,r=Math.max(W,H)*.6;z.x=p.x+Math.cos(a)*r;z.y=p.y+Math.sin(a)*r;continue}
  let sp=z.spd*(z.slow>0?.5:1)*(T1&&G.infT>0?INF.spd:1);if(z.lure&&d<20)sp=0;z.slow-=dt;z.wob+=dt*6;z.flash-=dt;
  if(z.type==="clown"){const px=-dy/d,py=dx/d,s=Math.sin(z.wob*.7)*.9;dx+=px*s*d;dy+=py*s*d}
  if(z.type==="dog"&&d<160&&d>60)sp*=1.4;
  if(z.type==="spit"){z.spitCd-=dt;if(d<230)sp=d<170?-sp*.6:0;if(z.spitCd<=0&&d<420){z.spitCd=rnd(2,3);const o=obtain("eb");Object.assign(o,{x:z.x,y:z.y,vx:dx/d*190,vy:dy/d*190,l:3,dmg:z.dmg,slow:0,pud:0,inf:0});ent.eb.push(o);sfx("splat")}}
  if(z.type==="charger"){z.dashCd-=dt;if(z.dash<=0&&z.dashCd<=0&&d<260){z.dash=.95;z.dashCd=rnd(2.6,3.6);z.dvx=dx/d;z.dvy=dy/d}if(z.dash>0){z.dash-=dt;sp=0;if(z.dash<.5){z.x+=z.dvx*380*dt;z.y+=z.dvy*380*dt}}}
  if(z.type==="spewer"){z.spitCd-=dt;if(d<60)sp=-sp*1.1;else if(d<160)sp=d<120?-sp*.5:0;if(z.spitCd<=0&&d<300&&!z.rear){z.rear=.4;z.flash=.4}if(z.rear>0){z.rear-=dt;sp=0;if(z.rear<=0){z.rear=0;z.spitCd=rnd(2.6,3.4);const o=obtain("eb");Object.assign(o,{x:z.x,y:z.y,vx:dx/d*130,vy:dy/d*130,l:2.6,dmg:z.dmg,slow:0,pud:0,inf:1});ent.eb.push(o);sfx("splat")}}}
  if(z.type==="tank"){z.dashCd-=dt;if(z.dash<=0&&z.dashCd<=0&&d<150){z.dash=.6;z.dashCd=rnd(3,4.5);z.dvx=dx/d;z.dvy=dy/d}if(z.dash>0){z.dash-=dt;if(z.dash>.3)sp=0;else{sp=0;z.x+=z.dvx*210*dt;z.y+=z.dvy*210*dt}}}
  if(z.type==="boss")bossAI(z,dt,dx,dy,d),sp=z.atk?0:sp;
  if(z.type==="boss"&&!z.atk&&Math.random()<dt*(G.stage>=0&&G.stage<2?.2:.4)&&ent.z.length<300)spawnZ("shamb",z.x+rnd(-40,40),z.y+rnd(-40,40));
  const l=Math.hypot(dx,dy)||1;z.x+=dx/l*sp*dt+z.kx*dt*8;z.y+=dy/l*sp*dt+z.ky*dt*8;z.kx*=.82;z.ky*=.82;
  const pd2=Math.hypot(p.x-z.x,p.y-z.y);if(pd2<z.r+p.r){if(z.type==='grabber'){if(G.t>=(z.grabT||0)){z.grabT=G.t+2.7;p.stun=.7;txt(p.x,p.y-30,'GRABBED!','#fca5a5');hitPlayer(z.dmg)}}else hitPlayer(z.dmg)}
  const key=((z.x/40)|0)*73856093^((z.y/40)|0)*19349663;let c=grid.get(key);if(!c){c=[];grid.set(key,c)}if(c.length<8)c.push(z)}
 for(const c of grid.values()){for(let a=0;a<c.length;a++)for(let b=a+1;b<c.length;b++){const A=c[a],B=c[b];let dx=B.x-A.x,dy=B.y-A.y;const d=Math.hypot(dx,dy)||.1,m=A.r+B.r;if(d<m){const push=(m-d)*.5/d;dx*=push;dy*=push;if(A.type!=="boss"){A.x-=dx;A.y-=dy}if(B.type!=="boss"){B.x+=dx;B.y+=dy}}}}}

// ===== Walk-over power-ups (no pause, no menu; never stack; reset each run) =====
// kill drop: 25 kills counted only while the board is empty and the 20s gap has passed (no stacking, ~4-6 per 5 min)
const PU_KILLS=25,PU_GAP=35,PU_LIFE=12,PU_BLINK=3,PU_DUR=8,PIZZA_CD=30,SPD_CAP=1.6,CD_FLOOR=.6;
const PU={drink:{n:"Rocket Fizz Energy Drink",c:"#3b82f6",d:"move 20% faster"},tape:{n:"Granddad's Duct Tape",c:"#facc15",d:"weapons fire 20% faster"},
 sock:{n:"Stinky Magnet Sock",c:"#22c55e",d:"pulls gems + coins from far away"},pizza:{n:"Cold Pizza Slice",c:"#ef4444",d:"heals 10% once"}};
function puDue(z,n){const u=G.pu;u.due=Math.min(2,u.due+n);u.dx=z.x;u.dy=z.y}
function puKill(z){const u=G.pu;if(!u.board&&u.due===0&&G.t-u.last>=PU_GAP){u.cnt=(u.cnt||0)+1;if(u.cnt>=PU_KILLS){u.cnt=0;puDue(z,1)}}if(z.elite&&ZT[z.type]&&ZT[z.type].tier===2)puDue(z,1);if(z.type==="boss")puDue(z,2)}
function puTick(dt){const u=G.pu,p=G.p;if(u.act){u.act.t-=dt;if(u.act.t<=0)u.act=null}
 if(u.board){const b=u.board;b.l-=dt;if(Math.hypot(p.x-b.x,p.y-b.y)<p.r+20){puGet(b.k);u.board=null;u.got++}else if(b.l<=0){u.board=null;u.miss++}}
 if(!u.board&&u.due>0&&G.t-u.last>=PU_GAP&&!G.won){u.due--;u.last=G.t;u.drops++;
  const ks=["drink","tape","sock"];if(G.t-u.pizzaCd>=PIZZA_CD)ks.push("pizza");u.board={k:pick(ks),x:u.dx,y:u.dy,l:PU_LIFE+PU_BLINK};sfx("puS")}}
function puGet(k){const u=G.pu,p=G.p,P=PU[k];sfx("puG");parts(p.x,p.y,14,P.c,160);
 if(k==="pizza"){u.pizzaCd=G.t;const h=Math.round(p.maxHp*.1);p.hp=Math.min(p.maxHp,p.hp+h);G.banner=P.n+"! +"+h+" HP"}else{u.act={k,t:PU_DUR};G.banner=P.n+"! "+PU_DUR+"s"}G.bannerT=1.2}
const puOn=k=>G&&G.pu&&G.pu.act&&G.pu.act.k===k;
function puIcon(k,x,y,r,a){cx.save();cx.translate(x,y);cx.globalAlpha=a;const P=PU[k],gl=cx.createRadialGradient(0,0,r*.4,0,0,r*1.9);gl.addColorStop(0,P.c+"aa");gl.addColorStop(1,P.c+"00");cx.fillStyle=gl;cx.beginPath();cx.arc(0,0,r*1.9,0,7);cx.fill();
 cx.strokeStyle=P.c;cx.lineWidth=2;cx.globalAlpha=a*(.5+.3*Math.sin(G.t*6));cx.beginPath();cx.arc(0,0,r*1.35,0,7);cx.stroke();cx.globalAlpha=a;
 cx.fillStyle="#111a";cx.beginPath();cx.arc(0,0,r,0,7);cx.fill();cx.strokeStyle=P.c;cx.lineWidth=2.5;cx.stroke();const s=r/10;cx.lineWidth=1.5*s;cx.strokeStyle="#000";
 if(k==="drink"){cx.fillStyle="#60a5fa";cx.fillRect(-3.5*s,-6*s,7*s,12*s);cx.strokeRect(-3.5*s,-6*s,7*s,12*s);cx.fillStyle="#e5e7eb";cx.fillRect(-3.5*s,-6*s,7*s,2*s);cx.fillStyle="#fde047";cx.beginPath();cx.moveTo(1*s,-3*s);cx.lineTo(-2*s,1*s);cx.lineTo(0,1*s);cx.lineTo(-1*s,4*s);cx.lineTo(2*s,0);cx.lineTo(0,0);cx.fill()}
 else if(k==="tape"){cx.fillStyle="#d1d5db";cx.beginPath();cx.arc(0,0,6*s,0,7);cx.fill();cx.stroke();cx.fillStyle="#facc15";cx.beginPath();cx.arc(0,0,2.6*s,0,7);cx.fill();cx.stroke();cx.fillStyle="#d1d5db";cx.fillRect(3*s,3*s,5*s,2.5*s)}
 else if(k==="sock"){cx.fillStyle="#86efac";cx.beginPath();cx.moveTo(-3*s,-7*s);cx.lineTo(2*s,-7*s);cx.lineTo(2*s,2*s);cx.lineTo(6*s,4*s);cx.quadraticCurveTo(7*s,8*s,2*s,7*s);cx.lineTo(-3*s,5*s);cx.closePath();cx.fill();cx.stroke();cx.strokeStyle="#ef4444";cx.beginPath();cx.moveTo(-3*s,-4.5*s);cx.lineTo(2*s,-4.5*s);cx.stroke();
  cx.strokeStyle="#a3e635";cx.lineWidth=1*s;for(const o of[-1,1]){cx.beginPath();cx.arc(-6*s,o*2*s,2*s,-1,1);cx.stroke()}}
 else{cx.fillStyle="#fbbf24";cx.beginPath();cx.moveTo(0,7*s);cx.lineTo(-6*s,-5*s);cx.quadraticCurveTo(0,-8*s,6*s,-5*s);cx.closePath();cx.fill();cx.stroke();cx.fillStyle="#dc2626";for(const[q,w]of[[-2,-3],[2,-2],[0,2]]){cx.beginPath();cx.arc(q*s,w*s,1.4*s,0,7);cx.fill()}cx.fillStyle="#b45309";cx.fillRect(-6*s,-6.5*s,12*s,1.5*s)}
 cx.restore()}
function puDrawWorld(){const b=G.pu&&G.pu.board;if(!b)return;const a=b.l<PU_BLINK?(Math.sin(G.t*22)>0?1:.15):1;puIcon(b.k,b.x,b.y+Math.sin(G.t*4)*4,12,a)}
function puHud(){const u=G.pu,p=G.p;if(!u)return;
 if(u.act){const P=PU[u.act.k];puIcon(u.act.k,170,43,6,1);cx.fillStyle="#0009";cx.fillRect(180,38,80,10);cx.fillStyle=P.c;cx.fillRect(181,39,78*Math.max(0,u.act.t/PU_DUR),8)}
 const b=u.board;if(b){const sx=b.x-p.x+W/2,sy=b.y-p.y+H/2,m=24;if(sx<0||sx>W||sy<30||sy>H){const ex=Math.max(m,Math.min(W-m,sx)),ey=Math.max(30+m,Math.min(H-m-30,sy)),an=Math.atan2(sy-ey,sx-ex);
  cx.save();cx.translate(ex,ey);cx.globalAlpha=b.l<PU_BLINK?(Math.sin(G.t*22)>0?1:.3):1;puIcon(b.k,0,0,9,cx.globalAlpha);cx.rotate(an);cx.fillStyle=PU[b.k].c;cx.strokeStyle="#000";cx.lineWidth=2;cx.beginPath();cx.moveTo(24,0);cx.lineTo(14,-8);cx.lineTo(14,8);cx.closePath();cx.fill();cx.stroke();cx.restore()}}}
// ===== Pickups & leveling =====
const LVL_GAP=25,xpNeed=l=>Math.floor(12+l*3+Math.pow(l,1.5));
function pickups(dt){const p=G.p,S=stat(),M=S.mag;
 for(let i=ent.gem.length-1;i>=0;i--){const g=ent.gem[i];const dx=p.x-g.x,dy=p.y-g.y,d=Math.hypot(dx,dy);if(d<M||g.pull){g.pull=true;const v=Math.max(300,700-d);g.x+=dx/d*v*dt;g.y+=dy/d*v*dt}
  if(d<p.r+8){G.xp+=g.v;sfx("gem");release("gem",ent.gem,i)}}
 for(let i=ent.item.length-1;i>=0;i--){const o=ent.item[i];o.l-=dt;const dx=p.x-o.x,dy=p.y-o.y,d=Math.hypot(dx,dy);if(d<M*.8||o.pull){o.pull=true;o.x+=dx/d*400*dt;o.y+=dy/d*400*dt}
  if(d<p.r+12){if(o.k==="coin"){G.coins+=Math.ceil(1*S.coin);sfx("coin")}if(o.k==="pizza"){p.hp=Math.min(p.maxHp,p.hp+30);txt(p.x,p.y-24,"+30 🍕","#4ade80")}
   if(o.k==="magnet"){ent.gem.forEach(g=>g.pull=true);txt(p.x,p.y-24,"MAGNET!","#60a5fa")}if(o.k==="chest"){sfx("lvl");openCards(true)}release("item",ent.item,i);continue}
  if(o.l<=0&&o.k!=="chest")release("item",ent.item,i)}
 // level-up: gentler early curve + min LVL_GAP s between popups (extra xp waits, never lost)
 if(G.xp>=G.xpN&&state==="play"&&G.t-G.lastPop>=LVL_GAP){G.lastPop=G.t;G.xp-=G.xpN;G.lvl++;G.xpN=xpNeed(G.lvl);sfx("lvl");parts(p.x,p.y,20,"#facc15",200);openCards(false)}}
function options(){const o=[];
 for(const k of G.order){const w=G.w[k];if(!w.evo&&w.lv>=5&&G.ps[W8[k].evo])o.push({t:"evo",k,pri:1})}
 for(const k of G.order)if(G.w[k].lv<5)o.push({t:"w",k});
 if(G.order.length<6)for(const k of WK)if(!G.w[k]&&!CLASS_W[k])o.push({t:"w",k,nw:1});
 const np=Object.keys(G.ps).length;for(const k of PK){const l=G.ps[k]||0;if(l<5&&(l>0||np<6))o.push({t:"p",k,nw:!l})}
 const ev=o.filter(x=>x.pri),rest=o.filter(x=>!x.pri).sort(()=>Math.random()-.5);const r=[...ev,...rest].slice(0,3);
 while(r.length<3)r.push(r.length%2?{t:"heal"}:{t:"gold"});return r}
let chestMode=false;
const iconOf=(k,evo)=>{if(k==="flip")return `<img src="${SPR[evo?"crocE":"croc"].toDataURL()}" style="width:44px;height:44px">`;
 if(k==="sack")return `<img src="${SPR.sack.toDataURL()}" style="width:44px;height:44px">`;
 if(k==="rocket")return `<img src="${SPR[evo?"rocketE":"rocket"].toDataURL()}" style="width:44px;height:44px">`;
 return evo?W8[k].ei:W8[k].i};
function openCards(chest){chestMode=chest;state="lvl";hudBtns(false);joy.on=false;
 $("lvlT").textContent=chest?"🎁 BOSS LOOT!":"LEVEL "+G.lvl+"! 🎉";$("lvlSub").textContent=chest?"The boss dropped a goodie bag. Pick a prize!":pick(["Pick one. Choose wisely. Or don't.","The zombies will politely wait.","Your power grows. So does your weirdness.","Mom would want you to pick the healthy one."]);
 const box=$("cards");box.innerHTML="";for(const op of options()){const b=document.createElement("button");b.className="up"+(op.t==="evo"?" evo":"");let ic,nm,ds,fl,tg="";
  if(op.t==="evo"){const W=W8[op.k];ic=iconOf(op.k,true);nm=W.en;ds="EVOLVE "+W.n+" + "+PS[W.evo].n;fl=W.ef;tg="EVOLVE!"}
  else if(op.t==="w"){const W=W8[op.k],l=G.w[op.k]?G.w[op.k].lv:0;ic=iconOf(op.k,false);nm=W.n;ds=l?"Level "+(l+1)+": more damage, more chaos.":W.d;fl=W.f;tg=l?"Lv "+(l+1):"NEW!";
   if(op.k==="sack"&&l)ds={2:"Level 2: bigger sack, wider swing.",3:"Level 3: faster swings.",4:"Level 4: heavier thump (more damage).",5:"Level 5: biggest sack and widest arc."}[l+1]||ds;
   if(op.k==="rocket"&&l)ds={2:"Level 2: bigger firework blast.",3:"Level 3: fire 2 rockets at once.",4:"Level 4: faster fire rate.",5:"Level 5: 3 rockets and a bigger blast."}[l+1]||ds;
   if(l===4)ds+=" (Max! Evolves with "+PS[W.evo].i+" "+PS[W.evo].n+")"}
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
 p.stun=(p.stun||0)-dt;let[dx,dy]=inputDir();if(p.stun>0)dx=dy=0;const sp=p.spd*S.spd;p.x+=dx*sp*dt;p.y+=dy*sp*dt;if(dx||dy){p.dx=dx;p.dy=dy;p.walk+=dt*10;if(dx)p.face=dx>0?1:-1}
 p.inv-=dt;if(S.regen)p.hp=Math.min(p.maxHp,p.hp+S.regen*dt);
 spawnTick(dt);wUpdate(dt);bUpdate(dt);zUpdate(dt);pickups(dt);puTick(dt);
 for(let i=ent.part.length-1;i>=0;i--){const o=ent.part[i];o.l-=dt;o.x+=o.vx*dt;o.y+=o.vy*dt;o.vx*=.9;o.vy*=.9;if(o.l<=0)release("part",ent.part,i)}
 for(let i=ent.eb.length-1;i>=0;i--){const o=ent.eb[i];o.l-=dt;o.x+=o.vx*dt;o.y+=o.vy*dt;if((o.x-p.x)**2+(o.y-p.y)**2<(p.r+(o.inf?8:6))**2){hitPlayer(o.dmg);if(o.inf)infest();parts(o.x,o.y,5,"#84cc16");o.l=0}if(o.l<=0)release("eb",ent.eb,i)}
 G.infT=Math.max(0,(G.infT||0)-dt);G.cueT=Math.max(0,(G.cueT||0)-dt);for(let i=G.globs.length-1;i>=0;i--){const o=G.globs[i];o.l-=dt;if(o.l<=0){G.globs[i]=G.globs[G.globs.length-1];G.globs.pop();(pools.glob||(pools.glob=[])).push(o)}}
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
 puDrawWorld();for(const o of ent.item)spr("e_"+({coin:"🪙",pizza:"🍕",magnet:"🧲",chest:"🎁"})[o.k],o.x,o.y+Math.sin(G.t*5)*3,o.k==="chest"?1.3:.8);
 for(const t of ent.tur)spr("gnome",t.x,t.y,1);
 for(const o of G.globs){if(!vis(o.x,o.y))continue;const f=Math.min(1,o.l/1.2);cx.globalAlpha=.75*f;cx.fillStyle="#4d6b1f";cx.beginPath();cx.ellipse(o.x,o.y,18,11,0,0,7);cx.fill();cx.fillStyle="#8fae3a";cx.beginPath();cx.ellipse(o.x-4,o.y-3,7,4,0,0,7);cx.fill();cx.globalAlpha=.15*f;cx.beginPath();cx.arc(o.x,o.y,26+Math.sin(G.t*6)*4,0,7);cx.fill();cx.globalAlpha=1}
 const bz=G.bossAlive;if(bz&&bz.hp>0&&bz.atk){cx.lineWidth=3;if(bz.atk===1||bz.atk===2){cx.globalAlpha=bz.atk===1?.25+.25*Math.sin(G.t*30):.18;cx.strokeStyle=cx.fillStyle="#b91c1c";cx.save();cx.translate(bz.x,bz.y);cx.rotate(Math.atan2(bz.dvy,bz.dvx));cx.fillRect(0,-bz.r*.8,BOSSA.rushSpd*BOSSA.rush,bz.r*1.6);cx.restore()}
  else if(bz.atk===4){cx.globalAlpha=.2+.2*Math.sin(G.t*30);cx.strokeStyle="#b91c1c";cx.beginPath();cx.arc(bz.sx,bz.sy,BOSSA.slamR,0,7);cx.stroke();cx.fillStyle="#7f1d1d";cx.beginPath();cx.arc(bz.sx,bz.sy,BOSSA.slamR*(1-bz.at/BOSSA.slamWind),0,7);cx.fill()}
  else if(bz.atk===5){cx.globalAlpha=.7*(1-bz.sr/BOSSA.slamR)+.2;cx.strokeStyle="#d6c7a1";cx.lineWidth=10;cx.beginPath();cx.arc(bz.sx,bz.sy,bz.sr,0,7);cx.stroke()}cx.globalAlpha=1}
 for(const z of ent.z){if(!vis(z.x,z.y))continue;if(z.type==="charger"&&z.dash>.5){const a=.22+.22*Math.sin(G.t*30);cx.globalAlpha=a;cx.fillStyle="#b91c1c";cx.save();cx.translate(z.x,z.y);cx.rotate(Math.atan2(z.dvy,z.dvx));cx.fillRect(0,-z.r*.7,190,z.r*1.4);cx.restore();cx.globalAlpha=1}// rush lane telegraph
  drawZ(z,z.x>p.x?-1:1);if(z.flash>0){cx.globalAlpha=.6;cx.fillStyle="#fff";cx.beginPath();cx.arc(z.x,z.y,z.r,0,7);cx.fill();cx.globalAlpha=1}
  if(z.elite){cx.strokeStyle="#facc15";cx.lineWidth=3;cx.beginPath();cx.arc(z.x,z.y,z.r+4,0,7);cx.stroke()}
  if(z.slow>0){cx.strokeStyle="#a5f3fc";cx.lineWidth=2;cx.beginPath();cx.arc(z.x,z.y,z.r+3,0,7);cx.stroke()}}
 // player
 const flick=p.inv>0&&!(p.stun>0)&&Math.floor(G.t*20)%2;if(!flick){blitA(HA[G.hero][((Math.floor(p.walk*.6)&3)<<1)|((p.face||1)<0?1:0)],p.x,p.y-4)}
 if(G.w.whoopee){const R=(65+G.w.whoopee.lv*10+(G.w.whoopee.evo?50:0))*stat().area;cx.strokeStyle="#bef26444";cx.lineWidth=2;cx.beginPath();cx.arc(p.x,p.y,R,0,7);cx.stroke()}
 if(G.w.plunger&&G.w.plunger.n){const w=G.w.plunger;for(let i=0;i<w.n;i++){const a=w.ang+i*Math.PI*2/w.n;cx.font="24px serif";cx.textAlign="center";cx.textBaseline="middle";cx.save();cx.translate(p.x+Math.cos(a)*w.R,p.y+Math.sin(a)*w.R);cx.rotate(a*3);cx.fillText(w.evo?"🚽":"🪠",0,0);cx.restore()}}
 if(G.w.kitty){spr(G.w.kitty.evo?"e_😼":"e_🐱",p.x+18*p.face,p.y-26,.8)}
 if(G.w.sack){const w=G.w.sack,sw=w.swing||0,half=w.half||SACK_ARC0/2;let ang;
  if(sw>0){const u=1-sw/SACK_SWING,e=u*u*(3-2*u),start=(w.aim||0)-half,end=(w.aim||0)+half;ang=start+(end-start)*e}
  else ang=Math.PI/2+.18*(p.face||1)+Math.sin(G.t*3)*.08;
  w.vis=w.vis==null?ang:w.vis+(ang-w.vis)*.4;const arm=28+(w.reach?Math.min(10,(w.reach-56)*.15):0);
  const kx=p.x+Math.cos(w.vis)*arm,ky=p.y-4+Math.sin(w.vis)*arm;
  cx.strokeStyle="#d6c7a1";cx.lineWidth=3;cx.beginPath();cx.moveTo(p.x+8*(p.face||1),p.y-2);cx.lineTo(kx,ky);cx.stroke();
  spr("sack",kx,ky,1.15,w.vis-Math.PI/2)}
 for(const b of ent.b){if(!vis(b.x,b.y))continue;
  if(b.k==="bubble"){cx.strokeStyle="#a5f3fc";cx.fillStyle="#a5f3fc33";cx.lineWidth=2;cx.beginPath();cx.arc(b.x,b.y,b.r,0,7);cx.fill();cx.stroke();cx.fillStyle="#fff";cx.beginPath();cx.arc(b.x-b.r*.4,b.y-b.r*.4,2.5,0,7);cx.fill()}
  else if(b.k==="pebble"){cx.fillStyle="#78716c";cx.beginPath();cx.arc(b.x,b.y,4,0,7);cx.fill()}
  else if(b.k==="pie"){cx.fillStyle="#0003";cx.beginPath();cx.ellipse(b.x,b.y,8,4,0,0,7);cx.fill();spr("e_🥧",b.x,b.y-b.h,.8,b.t*8)}
  else if(b.k==="flip"){spr(G.w.flip&&G.w.flip.evo?"crocE":"croc",b.x,b.y,.9,b.t*14);cx.fillStyle="#f9731688";cx.beginPath();cx.arc(b.x,b.y,8,0,7);cx.fill()}
  else if(b.k==="rocket"){const rot=Math.atan2(b.vy,b.vx);spr(b.spr==="finale"?"rocketE":"rocket",b.x,b.y,1,rot);
   cx.fillStyle="#fbbf24";cx.globalAlpha=.7;cx.beginPath();cx.arc(b.x-Math.cos(rot)*12,b.y-Math.sin(rot)*12,3+Math.sin(b.t*30),0,7);cx.fill();cx.globalAlpha=1}
  else spr("e_"+b.spr,b.x,b.y,b.k==="banana"&&G.w.banana&&G.w.banana.evo?1:.8,b.spin?b.t*12:Math.atan2(b.vy,b.vx)*(b.k==="duck"?0:.2))}
 for(const o of ent.eb){cx.fillStyle=o.inf?"#7f9a2e":"#84cc16";cx.strokeStyle="#365314";cx.lineWidth=2;cx.beginPath();cx.arc(o.x,o.y,6,0,7);cx.fill();cx.stroke()}
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
 puHud();let x=8;cx.font="16px serif";for(const k of G.order){if(k==="flip")spr(G.w[k].evo?"crocE":"croc",x+9,64,.55);else if(k==="sack")spr("sack",x+9,64,.5);else if(k==="rocket")spr(G.w[k].evo?"rocketE":"rocket",x+9,64,.5);else cx.fillText(G.w[k].evo?W8[k].ei:W8[k].i,x,64);x+=22}x=8;cx.font="13px serif";for(const k in G.ps){cx.fillText(PS[k].i,x,84);x+=18}
 if(G.mode==="journey"&&!G.bossAlive&&!G.won){const left=Math.max(0,G.nextBoss-G.t);cx.textAlign="center";cx.font="bold 13px system-ui";cx.fillStyle="#fde68a";cx.font="bold 15px system-ui";cx.lineWidth=4;cx.lineJoin="round";cx.strokeStyle="#000";const bl="📍 "+STAGES[G.stage].n+" — STAGE BOSS in "+Math.floor(left/60)+":"+String(Math.floor(left%60)).padStart(2,"0");cx.strokeText(bl,W/2,H-22);cx.fillText("📍 "+STAGES[G.stage].n+" — STAGE BOSS in "+Math.floor(left/60)+":"+String(Math.floor(left%60)).padStart(2,"0"),W/2,H-22)}
 if(G.mode==="endless"){const left=Math.max(0,G.nextBoss-G.t);cx.textAlign="center";cx.font="900 15px system-ui";cx.lineWidth=4;cx.lineJoin="round";cx.strokeStyle="#000";const el="♾️ ENDLESS MODE — "+(G.bossAlive?"boss fight!":"next boss in "+Math.floor(left/60)+":"+String(Math.floor(left%60)).padStart(2,"0"));cx.strokeText(el,W/2,H-22);cx.fillStyle="#c4b5fd";cx.fillText(el,W/2,H-22)}
 if(G.mode==="journey"&&G.bossAlive&&G.bossAlive.stageBoss&&!G.won){cx.textAlign="center";cx.font="bold 14px system-ui";cx.lineWidth=4;cx.strokeStyle="#000";const tl="👑 Beat the STAGE BOSS to clear "+STAGES[G.stage].n.split(",")[0]+"!";cx.strokeText(tl,W/2,H-22);cx.fillStyle="#fca5a5";cx.fillText(tl,W/2,H-22)}
 if(G.bossAlive){const b=G.bossAlive;cx.fillStyle="#000a";cx.fillRect(W*.15,96,W*.7,14);cx.fillStyle="#dc2626";cx.fillRect(W*.15+2,98,(W*.7-4)*Math.max(0,b.hp/b.max),10);cx.font="bold 11px system-ui";cx.textAlign="center";cx.fillStyle="#fff";cx.fillText((b.stageBoss?"👑 STAGE BOSS: ":"👑 BOSS: ")+b.name,W/2,103)}
 if(G.infT>0){cx.fillStyle="rgba(90,120,30,.10)";cx.fillRect(0,0,W,H);cx.font="bold 13px system-ui";cx.textAlign="right";cx.lineWidth=4;cx.strokeStyle="#000";const it="🤢 INFESTED "+Math.ceil(G.infT)+"s";cx.strokeText(it,W-8,H-44);cx.fillStyle="#bef264";cx.fillText(it,W-8,H-44)}
 if(G.cueT>0){cx.globalAlpha=.5+.5*Math.sin(G.t*25);cx.fillStyle="#d9f99d";for(const sd of[-1,1]){const x0=sd<0?6:W-6;cx.beginPath();cx.moveTo(x0,H/2-22);cx.lineTo(x0+sd*-18,H/2);cx.lineTo(x0,H/2+22);cx.fill();cx.fillStyle="rgba(200,190,150,.25)";cx.fillRect(sd<0?0:W-14,0,14,H);cx.fillStyle="#d9f99d"}cx.globalAlpha=1}
 if(G.bannerT>0){cx.globalAlpha=Math.min(1,G.bannerT);cx.font="900 24px system-ui";cx.textAlign="center";cx.lineWidth=5;cx.lineJoin="round";cx.strokeStyle="#000";cx.strokeText(G.banner,W/2,H*.3);cx.fillStyle="#facc15";cx.fillText(G.banner,W/2,H*.3);cx.globalAlpha=1}}

// ===== Screens =====
const SCR=["title","comic","cut","map","heroes","shop","lvl","paused","over","board","class"];
function hideAll(){SCR.forEach(s=>$(s).classList.add("hidden"))}
function show(s){hideAll();$(s).classList.remove("hidden")}
function goTitle(){state="title";G=null;hudBtns(false);$("coinS").textContent="🪙 "+save.coins+" coins  •  Hero: "+HEROES[save.hero].i+" "+HEROES[save.hero].n;renderDiff();setMute(save.mute);
 cx.setTransform(DPR,0,0,DPR,0,0);cx.fillStyle="#1b2a1a";cx.fillRect(0,0,W,H);show("title")}
let pendingMode=null;
function beginRun(mode,cls){ac();newRun(mode,cls);hideAll();state="play";hudBtns(true);last=performance.now()}
function startRun(mode){ac();pendingMode=mode;state="class";hudBtns(false);show("class")}
function pickClass(cls){beginRun(pendingMode||"endless",cls)}
$("clsRanged").onclick=()=>pickClass("ranged");$("clsMelee").onclick=()=>pickClass("melee");$("clsMage").onclick=()=>pickClass("mage");
$("classBack").onclick=()=>{if(pendingMode==="journey")openMap();else goTitle()};
function pause(){cStop();if(state!=="play")return;state="paused";joy.on=false;hudBtns(false);
 $("pauseInfo").innerHTML="<b>Weapons:</b><br>"+G.order.map(k=>(G.w[k].evo?W8[k].ei+" "+W8[k].en:W8[k].i+" "+W8[k].n+" Lv "+G.w[k].lv)).join("<br>")+"<br><b>Gear:</b><br>"+(Object.keys(G.ps).map(k=>PS[k].i+" "+PS[k].n+" Lv "+G.ps[k]).join("<br>")||"none yet");show("paused")}
$("pauseB").onclick=pause;$("resumeB").onclick=()=>{hideAll();state="play";hudBtns(true);last=performance.now()};$("quitB").onclick=()=>endRun(false,true);
document.addEventListener("visibilitychange",()=>{if(document.hidden){pause();cStop()}});window.__townCut=(i)=>townCut(i,()=>startRun("journey"));

// comic
const INTRO=[
 {cap:"NICEVILLE, FL — Saturday",art:"👦📱🏡👴",t:"Remy lives with Granddad Paul in Niceville. Right now he's on the phone with Dad, complaining. Loudly. Granddad's TV gets exactly ONE channel.",b:"Remy: \"Dad, he watches the weather channel. For FUN. He takes NOTES.\""},
 {cap:"MEANWHILE, IN PAMPLICO, SC",art:"👨📞🧟🧟",t:"Then Dad's voice gets weird and quiet. Something is moaning in the background. And it's NOT the dog.",b:"Dad: \"Remy, listen to me. Zombies. In Pamplico. Real ones! Mom, Leo and I are locking down the house. We need you. COME HOME—\" *bzzzt*"},
 {cap:"CALL DROPPED",art:"📵😱",t:"No bars. No Dad. Outside, Bill from next door is chewing on his own mailbox. Bill has always been weird, but even Bill doesn't usually eat the mail.",b:"Remy: \"Dad? DAD?! ...Okay. Okay. Leo better not be eating my snacks.\""},
 {cap:"GRANDDAD'S GARAGE",art:"👴🐔➡️👦",t:"Granddad blows the dust off a mystery box, opens it very slowly, and hands Remy... a rubber chicken launcher.",b:"Granddad: \"I built this in '83 for exactly this day. Everybody laughed. Go get your family, kiddo. Text me when you get there. ...Actually, call. I can't read texts.\""},
 {cap:"THE ROAD HOME",art:"🗺️🚶‍♂️🧟‍♀️🧟",t:"Niceville to Pamplico: about 450 miles of zombies, traffic, and questionable gas station snacks.",b:"Remy: \"Hang on, Mom, Dad, Leo. I'm coming home!\""}];
const ENDING=[
 {cap:"PAMPLICO, SC — HOME",art:"🏠🧟‍♂️💥👦",t:"The Mayor of Zombietown goes down in a big green cloud of goo. Quiet. Then the front door creaks open...",b:"Remy: \"Mom? Dad? Leo? It's me! I brought a chicken!\""},
 {cap:"FAMILY REUNION",art:"👩👨👦🧒❤️",t:"Mom squeezes him so hard he squeaks like a rubber chicken. Dad does his embarrassing happy dance. Twice. Leo, 6, runs in wearing a pot on his head.",b:"Leo: \"I KNEW you'd come! The pot is my helmet. Also I ate your snacks.\""},
 {cap:"SAFE AT LAST",art:"🛋️🍕📞👴",t:"The whole family piles onto one couch. Nobody lets go. Then the phone rings. It's Granddad.",b:"Granddad: \"Did the chicken work?\"  Remy: \"Granddad... the chicken SAVED THE WORLD.\"   THE END 🎉"}];
// ===== Comic book intro (presentation only; words come unchanged from INTRO/ENDING) =====
const SCENE={INTRO:["home","call","dropped","garage","road"],ENDING:["door","family","couch"]};const PART={};
function cHum(g,x,y,s,col,o={}){// grounded figure: legs, torso, arms, head, baked shade
 g.save();g.translate(x,y);g.scale(o.f||1,1);g.lineCap="round";const sk=o.sk||"#b89a7e";
 const L=(x1,y1,x2,y2,w,c)=>{g.strokeStyle="rgba(10,10,10,.6)";g.lineWidth=w+2;g.beginPath();g.moveTo(x1,y1);g.lineTo(x2,y2);g.stroke();g.strokeStyle=c;g.lineWidth=w;g.stroke()};
 g.fillStyle="rgba(0,0,0,.35)";g.beginPath();g.ellipse(0,0,14*s,3.5*s,0,0,7);g.fill();
 L(-3*s,-26*s,-5*s,-1*s,6*s,o.pa||"#2f3440");L(3*s,-26*s,5*s,-1*s,6*s,o.pa||"#2f3440");
 const tg=g.createLinearGradient(0,-50*s,0,-24*s);tg.addColorStop(0,col);tg.addColorStop(1,"#1a1a1a");g.fillStyle=tg;g.beginPath();g.moveTo(-9*s,-50*s);g.lineTo(9*s,-50*s);g.lineTo(7*s,-24*s);g.lineTo(-7*s,-24*s);g.closePath();g.fill();
 L(-8*s,-48*s,-11*s,-30*s,4.5*s,sk);if(o.phone){L(8*s,-48*s,6*s,-58*s,4.5*s,sk);g.fillStyle="#111";g.fillRect(3*s,-64*s,5*s,9*s)}else if(o.reach)L(8*s,-48*s,22*s,-44*s,4.5*s,sk);else L(8*s,-48*s,11*s,-30*s,4.5*s,sk);
 const hg=g.createRadialGradient(-2*s,-63*s,1,0,-60*s,9*s);hg.addColorStop(0,sk);hg.addColorStop(1,"#3a2e26");g.fillStyle=hg;g.beginPath();g.ellipse(0,-60*s,6.5*s,7.5*s,0,0,7);g.fill();
 g.fillStyle=o.hair||"#2a2018";g.beginPath();g.ellipse(-1*s,-65*s,7*s,4*s,0,0,7);g.fill();if(o.cap){g.fillStyle=o.cap;g.beginPath();g.ellipse(0,-66*s,7.5*s,4*s,0,0,7);g.fill();g.fillRect(2*s,-66*s,9*s,2.5*s)}
 if(o.pot){g.fillStyle="#555";g.fillRect(-7*s,-72*s,14*s,7*s)}g.restore()}
function cZ(g,k,x,y,s,f){const c=ZS[k][1],w=c.width/2*s;g.save();g.translate(x,y-w*.35);if(f)g.scale(-1,1);g.drawImage(c,-w/2,-w/2,w,w);g.restore()}
function cArt(set,i,w,h){const key=set+i+"_"+w+"x"+h;if(PART[key])return PART[key];const cv2=document.createElement("canvas");cv2.width=w*2;cv2.height=h*2;const g=cv2.getContext("2d");g.scale(2,2);
 const sc=SCENE[set][i],gy=h*.86,u=Math.min(w,h)/220;const sky=(a,b)=>{const gr=g.createLinearGradient(0,0,0,h);gr.addColorStop(0,a);gr.addColorStop(1,b);g.fillStyle=gr;g.fillRect(0,0,w,h)};
 const ground=c=>{g.fillStyle=c;g.fillRect(0,gy,w,h-gy)};const house=(x,y,hw,col)=>{g.fillStyle=col;g.fillRect(x,y-hw*.6,hw,hw*.6);g.beginPath();g.moveTo(x-6,y-hw*.6);g.lineTo(x+hw/2,y-hw);g.lineTo(x+hw+6,y-hw*.6);g.fill();g.fillStyle="#c9a85a";g.fillRect(x+hw*.15,y-hw*.45,hw*.18,hw*.15);g.fillStyle="#1a1714";g.fillRect(x+hw*.6,y-hw*.35,hw*.18,hw*.35)};
 if(sc==="home"){sky("#6d7a86","#a9a087");ground("#4b5240");house(w*.55,gy,w*.38,"#5b544a");cHum(g,w*.25,gy,u*1.3,"#3c5a7a",{phone:1,cap:"#2f4a66"});cHum(g,w*.44,gy,u*1.25,"#6b6b6b",{hair:"#cfcfcf",f:-1})}
 if(sc==="call"){sky("#2c2a33","#4a3f3a");g.fillStyle="#1b1a1e";g.fillRect(w*.08,h*.12,w*.42,h*.5);g.fillStyle="#5d6470";g.fillRect(w*.1,h*.14,w*.38,h*.46);cZ(g,"shamb",w*.2,h*.62,u*1.2,0);cZ(g,"runner",w*.36,h*.62,u*1.1,1);g.fillStyle="#1b1a1e";g.fillRect(w*.285,h*.12,w*.02,h*.5);ground("#2d2925");cHum(g,w*.72,gy,u*1.35,"#4e5a4a",{phone:1,f:-1})}
 if(sc==="dropped"){sky("#7c838a","#8f8775");ground("#4b5240");g.fillStyle="#3a3530";g.fillRect(w*.68,gy-h*.28,4,h*.28);g.fillStyle="#565049";g.fillRect(w*.64,gy-h*.34,w*.12,h*.08);cZ(g,"shamb",w*.78,gy,u*1.4,1);cHum(g,w*.28,gy,u*1.35,"#3c5a7a",{phone:1,cap:"#2f4a66"})}
 if(sc==="garage"){sky("#3b3631","#5a5048");g.fillStyle="#2b2723";for(let j=0;j<3;j++)g.fillRect(0,h*(.2+j*.18),w,4);ground("#35312c");g.fillStyle="#7a6446";g.fillRect(w*.45,gy-h*.42,w*.1,h*.08);cHum(g,w*.34,gy,u*1.3,"#6b6b6b",{hair:"#cfcfcf",reach:1});cHum(g,w*.68,gy,u*1.3,"#3c5a7a",{cap:"#2f4a66",reach:1,f:-1})}
 if(sc==="road"){sky("#8a7f6c","#b3a17f");g.fillStyle="#3a3a38";g.beginPath();g.moveTo(w*.42,h*.45);g.lineTo(w*.58,h*.45);g.lineTo(w*.95,h);g.lineTo(w*.05,h);g.fill();g.fillStyle="#6b6448";g.fillRect(0,h*.45,w*.42,h*.02);cZ(g,"shamb",w*.55,h*.6,u*.6,1);cZ(g,"runner",w*.66,h*.68,u*.75,1);cZ(g,"shamb",w*.3,h*.7,u*.8,0);cHum(g,w*.48,h*.97,u*1.3,"#3c5a7a",{cap:"#2f4a66"})}
 if(sc==="door"){sky("#3a3632","#5c5348");ground("#3e4236");house(w*.3,gy,w*.5,"#5a524a");cZ(g,"boss",w*.2,gy,u*.7,0);g.fillStyle="rgba(120,150,60,.35)";g.beginPath();g.ellipse(w*.2,gy-h*.15,w*.16,h*.12,0,0,7);g.fill();cHum(g,w*.82,gy,u*1.3,"#3c5a7a",{cap:"#2f4a66",f:-1})}
 if(sc==="family"){sky("#5d5850","#857a68");ground("#4a4238");cHum(g,w*.2,gy,u*1.25,"#6e4f5a",{hair:"#4a3020"});cHum(g,w*.4,gy,u*1.35,"#4e5a4a",{});cHum(g,w*.6,gy,u*1.3,"#3c5a7a",{cap:"#2f4a66"});cHum(g,w*.8,gy,u*.85,"#7a6a3e",{pot:1,f:-1})}
 if(sc==="couch"){sky("#4a4440","#6a5e52");ground("#3a332c");g.fillStyle="#5a3e34";g.fillRect(w*.12,gy-h*.22,w*.76,h*.16);g.fillRect(w*.1,gy-h*.34,w*.8,h*.12);[.25,.42,.58,.74].forEach((x,j)=>cHum(g,w*x,gy-h*.12,u*(j===3?.7:1),["#6e4f5a","#4e5a4a","#3c5a7a","#7a6a3e"][j],{cap:j===2?"#2f4a66":0}));g.fillStyle="#111";g.fillRect(w*.86,gy-h*.42,6,10)}
 // ink texture: halftone dots + vignette + border
 g.fillStyle="rgba(0,0,0,.13)";for(let y=0;y<h;y+=6)for(let x=(y/6%2)*3;x<w;x+=6){const r=.4+1.4*(y/h);g.beginPath();g.arc(x,y,r,0,7);g.fill()}
 const vg=g.createRadialGradient(w/2,h/2,Math.min(w,h)*.3,w/2,h/2,Math.max(w,h)*.7);vg.addColorStop(0,"rgba(0,0,0,0)");vg.addColorStop(1,"rgba(0,0,0,.45)");g.fillStyle=vg;g.fillRect(0,0,w,h);
 g.strokeStyle="#0b0b0b";g.lineWidth=5;g.strokeRect(2.5,2.5,w-5,h-5);PART[key]=cv2;return cv2}
// voice: local Web Speech only; never blocks; mute = silent
let cVoice=null,cAuto=null;function pickVoice(){const S=window.speechSynthesis;if(!S)return null;const vs=S.getVoices().filter(v=>/^en/i.test(v.lang));
 return vs.find(v=>v.localService!==false&&/male|daniel|david|fred|alex|george|arthur|james|guy|mark/i.test(v.name)&&!/female/i.test(v.name))||vs.find(v=>v.localService!==false)||vs[0]||null}
function cSpeak(text){cStop();if(save.mute||!window.speechSynthesis||typeof SpeechSynthesisUtterance==="undefined")return false;try{const u=new SpeechSynthesisUtterance(text);cVoice=cVoice||pickVoice();if(cVoice)u.voice=cVoice;u.lang=(cVoice&&cVoice.lang)||"en-US";u.pitch=.7;u.rate=.85;
 const my=comicI,mySet=comicSet;u.onend=()=>{if(state==="comic"&&comicI===my&&comicSet===mySet)cAuto=setTimeout(()=>{if(state==="comic"&&comicI===my&&comicSet===mySet)$("comicN").click()},1100)};speechSynthesis.speak(u);return true}catch(e){return false}}
function cStop(){clearTimeout(cAuto);try{window.speechSynthesis&&speechSynthesis.cancel()}catch(e){}}
// ===== Between-town panel: one static comic panel (sign + burning skyline + back of Remy's head) =====
// Between-town lines: see cutscene-lines.js (CUT_LINES)
const CUTP=["#6b4a3a","#5a4a42","#6e4436","#7a4a32","#4e4a38","#5e4440","#5a4652","#6e5236","#6a4a3a","#7a3a2e"];// per-town sky tint
const CUTS={};let cutT=null;
function townName(i){return STAGES[i].n.split(/[,\/]/)[0].trim().toUpperCase()}
function cutSky(g,w,h,i,hyF,dark){let sd=i*977+13;const R=()=>(sd=(sd*16807)%2147483647)/2147483647;
 const sky=g.createLinearGradient(0,0,0,h);sky.addColorStop(0,"#16141a");sky.addColorStop(.55,dark?"#1c2230":CUTP[i]);sky.addColorStop(.75,dark?"#3a2a2a":"#c06a2e");sky.addColorStop(1,dark?"#0e0e12":"#2a1e18");g.fillStyle=sky;g.fillRect(0,0,w,h);
 g.fillStyle="rgba(40,34,32,.55)";for(let j=0;j<7;j++){g.beginPath();g.ellipse(R()*w,h*(.1+R()*.35),w*(.15+R()*.2),h*(.05+R()*.06),0,0,7);g.fill()}// smoke
 const T=tier(TOWNS[i].pop),hy=h*hyF;window.__cutTier=T;let nb=0,nt=0;
 if(T.farm){g.fillStyle="#2a2a1e";g.fillRect(0,hy-h*.02,w,h*.1);g.strokeStyle="rgba(60,55,35,.8)";g.lineWidth=1;for(let j=0;j<8;j++){g.beginPath();g.moveTo(0,hy+j*4);g.lineTo(w,hy+j*3);g.stroke()}}
 const tree=(x,y,s)=>{g.fillStyle="#141611";g.beginPath();g.moveTo(x,y-s*2.2);g.lineTo(x+s*.7,y);g.lineTo(x-s*.7,y);g.fill();g.fillRect(x-1,y,2,s*.3);nt++};
 for(let j=0;j<T.trees*.6;j++)tree(R()*w,hy-h*.01,h*(.03+R()*.03));
 for(let L=0;L<2;L++){const n=Math.round(T.bld*(L?.45:.55));for(let j=0;j<n;j++){const bw=w*(T.tower?.025+R()*.04:.04+R()*.06),bh=h*(.03+R()*T.hMax)*(L?.75:1),x=R()*w;g.fillStyle=L?"#141212":"#2b2321";
   if(R()<.3){g.beginPath();g.moveTo(x,hy+L*h*.03);g.lineTo(x,hy-bh+L*h*.03);g.lineTo(x+bw*.6,hy-bh*.75+L*h*.03);g.lineTo(x+bw,hy-bh*.9+L*h*.03);g.lineTo(x+bw,hy+L*h*.03);g.fill()}else g.fillRect(x,hy-bh+L*h*.03,bw,bh);// some collapsed
   if(R()<.4){g.fillStyle="rgba(230,140,50,.5)";g.fillRect(x+bw*.3,hy-bh*.6+L*h*.03,bw*.15,Math.max(2,bh*.06))}nb++}}
 if(T.water){const wx=w*.18;g.fillStyle="#1a1816";g.fillRect(wx-1,hy-h*.2,2,h*.2);g.fillRect(wx+14,hy-h*.2,2,h*.2);g.beginPath();g.ellipse(wx+7,hy-h*.22,14,9,0,0,7);g.fill()}
 for(let j=0;j<T.trees*.4;j++)tree(R()*w,hy+h*.05,h*(.04+R()*.04));
 for(let j=0;j<3+Math.round(T.bld/8);j++){const fx=R()*w,fy=hy-h*R()*T.hMax*.6,fh=h*(.05+R()*.07);const fg=g.createLinearGradient(0,fy-fh,0,fy);fg.addColorStop(0,"rgba(255,170,60,0)");fg.addColorStop(1,"rgba(255,140,40,.8)");g.fillStyle=fg;g.beginPath();g.moveTo(fx-fh*.3,fy);g.quadraticCurveTo(fx-fh*.1,fy-fh*.6,fx,fy-fh);g.quadraticCurveTo(fx+fh*.15,fy-fh*.5,fx+fh*.3,fy);g.fill()}
 window.__cutCounts={b:nb,t:nt};return R}
function cutArt(i,w,h){const key=i+"_"+w+"x"+h;if(CUTS[key])return CUTS[key];const c=document.createElement("canvas");c.width=w*2;c.height=h*2;const g=c.getContext("2d");g.scale(2,2);const R=cutSky(g,w,h,i,.74,0);

 g.fillStyle="#1f1c18";g.fillRect(0,h*.82,w,h*.18);const T2=tier(TOWNS[i].pop),rw=T2.road;g.fillStyle="#2c2924";g.beginPath();g.moveTo(w*(.43-rw*.3),h*.82);g.lineTo(w*(.43+rw*.3),h*.82);g.lineTo(w*(.4+rw*1.2),h);g.lineTo(w*(.4-rw*1.2),h);g.fill();
 for(let j=0;j<T2.wreck;j++){const x=w*(.1+R()*.8),y=h*(.84+R()*.1),cw=w*.06;g.fillStyle="#1b1918";g.save();g.translate(x,y);g.rotate((R()-.5)*.8);g.fillRect(-cw/2,-cw*.25,cw,cw*.3);g.fillRect(-cw*.3,-cw*.45,cw*.5,cw*.22);g.restore()}
 g.fillStyle="#3a3026";g.fillRect(w*.3,h*.9,8,6);g.fillStyle="#4a3a2a";g.beginPath();g.arc(w*.86,h*.9,4,0,7);g.arc(w*.86,h*.875,3,0,7);g.fill();// abandoned suitcase, teddy bear
 // road sign (foreground right)
 const sw=Math.min(w*.5,250),sh=sw*.36,sx=w*.62-sw/2+w*.1,sy=h*.42;g.fillStyle="#3a3a38";g.fillRect(sx+sw*.15,sy+sh,6,h);g.fillRect(sx+sw*.8,sy+sh,6,h);
 const sg=g.createLinearGradient(0,sy,0,sy+sh);sg.addColorStop(0,"#3d6b4a");sg.addColorStop(1,"#22402c");g.fillStyle=sg;g.fillRect(sx,sy,sw,sh);g.strokeStyle="#c9c4b0";g.lineWidth=2;g.strokeRect(sx+4,sy+4,sw-8,sh-8);
 const nm=townName(i);let fs=sh*.42;g.font="900 "+fs+"px system-ui";while(g.measureText(nm).width>sw-20&&fs>8){fs--;g.font="900 "+fs+"px system-ui"}g.fillStyle="#e8e4d4";g.textAlign="center";g.textBaseline="middle";g.fillText(nm,sx+sw/2,sy+sh*.5);
 g.fillStyle="rgba(0,0,0,.35)";g.fillRect(sx+sw*.7,sy+sh*.15,sw*.08,sh*.12);g.fillRect(sx+sw*.1,sy+sh*.7,sw*.06,sh*.1);g.fillStyle="rgba(200,110,40,.25)";g.fillRect(sx,sy,sw,sh*.3);// grime + fire glow
 // Remy: back of head at bottom-left edge (cap from behind, hair, ear, shoulder)
 const rx=w*.16,ry=h*1.02,rr=Math.min(w,h)*.2;g.fillStyle="#2a3a4c";g.beginPath();g.ellipse(rx,ry+rr*.6,rr*1.6,rr*.75,0,Math.PI,0);g.fill();
 const hg=g.createRadialGradient(rx+rr*.4,ry-rr*.9,rr*.1,rx,ry-rr*.6,rr*1.1);hg.addColorStop(0,"#6b4a33");hg.addColorStop(1,"#1e140e");g.fillStyle=hg;g.beginPath();g.ellipse(rx,ry-rr*.55,rr*.82,rr*.95,0,0,7);g.fill();
 g.fillStyle="#9a7058";g.beginPath();g.ellipse(rx+rr*.78,ry-rr*.5,rr*.13,rr*.22,0,0,7);g.fill();
 const cg=g.createLinearGradient(0,ry-rr*1.6,0,ry-rr*.9);cg.addColorStop(0,"#3e6b9a");cg.addColorStop(1,"#1e3550");g.fillStyle=cg;g.beginPath();g.ellipse(rx,ry-rr*1.05,rr*.88,rr*.6,0,Math.PI,0);g.fill();g.fillStyle="#1a2a3c";g.fillRect(rx-rr*.25,ry-rr*1.02,rr*.5,rr*.14);g.strokeStyle="rgba(255,170,90,.45)";g.lineWidth=3;g.beginPath();g.arc(rx,ry-rr*.6,rr*.9,-1.2,.2);g.stroke();// rim light from fire
 g.fillStyle="rgba(0,0,0,.13)";for(let y=0;y<h;y+=6)for(let x=(y/6%2)*3;x<w;x+=6){g.beginPath();g.arc(x,y,.4+1.2*(y/h),0,7);g.fill()}
 const vg=g.createRadialGradient(w/2,h/2,Math.min(w,h)*.3,w/2,h/2,Math.max(w,h)*.7);vg.addColorStop(0,"rgba(0,0,0,0)");vg.addColorStop(1,"rgba(0,0,0,.5)");g.fillStyle=vg;g.fillRect(0,0,w,h);g.strokeStyle="#0b0b0b";g.lineWidth=5;g.strokeRect(2.5,2.5,w-5,h-5);CUTS[key]=c;return c}
// ===== Between-town cutscenes: one unique scene per transition (id = next town). Beats = comic panels + short cinematic moves.
// Lines live in cutscene-lines.js (Jeremy writes them). Background scale comes from tier(population) via cutSky.
function cFin(g,w,h){g.fillStyle="rgba(0,0,0,.13)";for(let y=0;y<h;y+=6)for(let x=(y/6%2)*3;x<w;x+=6){g.beginPath();g.arc(x,y,.4+1.2*(y/h),0,7);g.fill()}
 const vg=g.createRadialGradient(w/2,h/2,Math.min(w,h)*.3,w/2,h/2,Math.max(w,h)*.7);vg.addColorStop(0,"rgba(0,0,0,0)");vg.addColorStop(1,"rgba(0,0,0,.55)");g.fillStyle=vg;g.fillRect(0,0,w,h);g.strokeStyle="#0b0b0b";g.lineWidth=5;g.strokeRect(2.5,2.5,w-5,h-5)}
function cFig(g,cv,x,y,ht,flip){const s=ht*1.55;g.save();g.translate(x,y-s*.5+ht*.27);if(flip)g.scale(-1,1);g.drawImage(cv,-s/2,-s/2,s,s);g.restore()}// x,y = feet
const SURV={sk:"#b98a6a",top:"#6d5a3c",pa:"#41454c",hair:"#5a3b22",w:.9};let SURVS=null;
function survFr(){if(!SURVS){SURVS=[0,1,2,3].map(f=>{const c=document.createElement("canvas");c.width=c.height=124;const g=c.getContext("2d");g.scale(2,2);hHuman(g,31,15.5,SURV,f);return c})}return SURVS}
function ground(g,w,h,y,col){g.fillStyle=col||"#1f1c18";g.fillRect(0,y,w,h-y)}
function road(g,w,h,y,cw,col){g.fillStyle=col||"#2c2924";g.beginPath();g.moveTo(w*.5-cw*.08,y);g.lineTo(w*.5+cw*.08,y);g.lineTo(w*.5+cw*.6,h);g.lineTo(w*.5-cw*.6,h);g.fill();g.fillStyle="rgba(210,200,150,.35)";for(let k=0;k<6;k++){const t=k/6,t2=t+.07;g.beginPath();g.moveTo(w*.5-1-t*3,y+(h-y)*t*t);g.lineTo(w*.5+1+t*3,y+(h-y)*t*t);g.lineTo(w*.5+1+t2*3,y+(h-y)*t2*t2);g.lineTo(w*.5-1-t2*3,y+(h-y)*t2*t2);g.fill()}}
function car(g,x,y,s,rot,col){g.save();g.translate(x,y);g.rotate(rot||0);g.fillStyle=col||"#2a2826";g.beginPath();g.moveTo(-s,0);g.lineTo(-s,-s*.35);g.lineTo(-s*.55,-s*.4);g.lineTo(-s*.3,-s*.72);g.lineTo(s*.4,-s*.72);g.lineTo(s*.65,-s*.4);g.lineTo(s,-s*.33);g.lineTo(s,0);g.closePath();g.fill();g.fillStyle="rgba(120,130,140,.25)";g.fillRect(-s*.25,-s*.66,s*.55,s*.24);g.fillStyle="#111";g.beginPath();g.arc(-s*.6,0,s*.2,0,7);g.arc(s*.6,0,s*.2,0,7);g.fill();g.restore()}
function strayDog(g,x,y,s,f,look){const ph=f/4*Math.PI*2,c="#7a5a3a",d="#4e3a26";g.fillStyle="rgba(0,0,0,.3)";g.beginPath();g.ellipse(x,y+s*.05,s*1.1,s*.15,0,0,7);g.fill();
 const leg=(lx,p2,cl)=>limb(g,lx,y-s*.55,lx+Math.sin(p2)*s*.15,y-s*.25,lx+Math.sin(p2)*s*.25,y,s*.15,cl);leg(x-s*.55,ph+Math.PI,d);leg(x+s*.45,ph,d);
 g.strokeStyle=c;g.lineCap="round";g.lineWidth=s*.13;g.beginPath();g.moveTo(x-s*.75,y-s*.72);g.quadraticCurveTo(x-s*1.05,y-s*1.0,x-s*1.0,y-s*1.15);g.stroke();// tail up, a living dog
 g.fillStyle=shade(g,0,y-s,0,y-s*.4,mix(c,.12),mix(c,-.3));g.beginPath();g.ellipse(x,y-s*.68,s*.82,s*.3,0,0,7);g.fill();leg(x-s*.4,ph,c);leg(x+s*.6,ph+Math.PI,c);
 const hx=look?x+s*.85:x+s*.95,hy=y-s*1.0;limb(g,x+s*.55,y-s*.75,hx-s*.1,hy+s*.1,hx,hy,s*.26,c);g.fillStyle=c;g.beginPath();g.ellipse(hx,hy,s*.27,s*.23,0,0,7);g.fill();
 if(look){g.fillStyle="#1a1410";g.beginPath();g.arc(hx-s*.09,hy-s*.03,s*.04,0,7);g.arc(hx+s*.09,hy-s*.03,s*.04,0,7);g.fill();g.fillStyle=mix(c,.1);g.beginPath();g.ellipse(hx,hy+s*.1,s*.13,s*.1,0,0,7);g.fill();g.fillStyle="#1a1410";g.beginPath();g.arc(hx,hy+s*.06,s*.045,0,7);g.fill()}
 else{g.beginPath();g.ellipse(hx+s*.25,hy+s*.06,s*.2,s*.11,0,0,7);g.fill();g.fillStyle="#1a1410";g.beginPath();g.arc(hx+s*.07,hy-s*.05,s*.035,0,7);g.arc(hx+s*.44,hy+s*.03,s*.04,0,7);g.fill()}
 g.fillStyle=d;g.beginPath();g.moveTo(hx-s*.2,hy-s*.12);g.lineTo(hx-s*.14,hy-s*.42);g.lineTo(hx-s*.02,hy-s*.16);g.fill();g.beginPath();g.moveTo(hx+s*.04,hy-s*.16);g.lineTo(hx+s*.14,hy-s*.42);g.lineTo(hx+s*.2,hy-s*.1);g.fill()}
// window light, used by several scenes
function lit(g,x,y,ww,hh,a){g.fillStyle="rgba(255,190,90,"+(a||.85)+")";g.fillRect(x,y,ww,hh);const lg=g.createRadialGradient(x+ww/2,y+hh/2,1,x+ww/2,y+hh/2,ww*3);lg.addColorStop(0,"rgba(255,170,70,.25)");lg.addColorStop(1,"rgba(255,170,70,0)");g.fillStyle=lg;g.fillRect(x-ww*3,y-hh*3,ww*7,hh*7)}
const CSC={ // id -> beats. fx: zoom | pan | shadow | flick | none. d = ms. Total per scene 10-15 s.
 crestview:[ // Niceville -> Crestview: gas station at dusk, flickering vending machine
  {d:4200,fx:"zoom",art:(g,w,h,i)=>{cutSky(g,w,h,i,.62,0);ground(g,w,h,h*.66);road(g,w,h,h*.66,w*.7);
   g.fillStyle="#2a2724";g.fillRect(w*.08,h*.36,w*.5,h*.05);g.fillStyle="#1d1b19";g.fillRect(w*.12,h*.41,w*.02,h*.27);g.fillRect(w*.52,h*.41,w*.02,h*.27);g.fillStyle="#3a1e1a";g.fillRect(w*.08,h*.36,w*.5,h*.015);
   for(const px of[.24,.38]){g.fillStyle="#3b3632";g.fillRect(w*px,h*.55,w*.04,h*.13);g.fillStyle="#6a2a22";g.fillRect(w*px,h*.55,w*.04,h*.03)}
   g.fillStyle="#24211f";g.fillRect(w*.6,h*.42,w*.3,h*.26);g.fillStyle="rgba(90,90,80,.4)";g.fillRect(w*.63,h*.47,w*.12,h*.1);
   g.fillStyle="#4a3a8a";g.fillRect(w*.78,h*.47,w*.07,h*.2);lit(g,w*.785,h*.48,w*.06,h*.12,.55);
   cFig(g,HS.remy[1],w*.3,h*.86,h*.2,0)}},
  {d:4200,fx:"flick",art:(g,w,h,i)=>{g.fillStyle="#141318";g.fillRect(0,0,w,h);g.fillStyle="#1e1c1a";g.fillRect(0,h*.8,w,h*.2);
   g.fillStyle="#2f2a5a";g.fillRect(w*.3,h*.08,w*.4,h*.78);g.fillStyle="#d8d0b0";g.fillRect(w*.34,h*.13,w*.26,h*.52);
   for(let r=0;r<4;r++)for(let c=0;c<4;c++){g.fillStyle=["#8a3a2a","#2a5a8a","#7a7a3a","#3a6a3a"][(r+c)%4];g.fillRect(w*(.355+c*.062),h*(.15+r*.12),w*.045,h*.08)}
   g.fillStyle="rgba(0,0,0,.5)";g.fillRect(w*.34,h*.13,w*.26,h*.52);g.fillStyle="#111";g.fillRect(w*.62,h*.25,w*.05,h*.25);g.fillStyle="#7a2a20";g.fillRect(w*.63,h*.3,w*.02,h*.03);
   g.strokeStyle="rgba(200,200,200,.35)";g.lineWidth=1;g.beginPath();g.moveTo(w*.4,h*.2);g.lineTo(w*.48,h*.34);g.lineTo(w*.44,h*.5);g.stroke();// cracked glass
   cFig(g,HS.remy[0],w*.12,h*1.15,h*.75,0)}},
  {d:4200,fx:"shadow",art:(g,w,h,i)=>{cutSky(g,w,h,i,.62,0);ground(g,w,h,h*.66);road(g,w,h,h*.66,w*.7);g.fillStyle="#24211f";g.fillRect(w*.05,h*.42,w*.3,h*.26);g.fillStyle="#4a3a8a";g.fillRect(w*.23,h*.47,w*.06,h*.2);lit(g,w*.235,h*.48,w*.05,h*.1,.35);
   cFig(g,HS.remy[2],w*.62,h*.86,h*.2,0)}}],
 tallahassee:[ // Crestview -> Tallahassee: the road sign, burning city, Remy's head (kept)
  {d:6000,fx:"none",art:null},{d:6000,fx:"zoom",art:null}],
 valdosta:[ // Tallahassee -> Valdosta: Remy helps a survivor over a car-roof barricade, survivor runs off
  {d:3800,fx:"none",art:(g,w,h,i)=>{cutSky(g,w,h,i,.55,0);ground(g,w,h,h*.62);car(g,w*.5,h*.8,w*.22,-.05,"#2e2b28");car(g,w*.15,h*.82,w*.14,.1);car(g,w*.86,h*.8,w*.14,-.12);g.fillStyle="#2a2420";g.fillRect(0,h*.78,w,h*.05);
   cFig(g,HS.remy[0],w*.5,h*.8-w*.22*.72,h*.24,1);cFig(g,survFr()[1],w*.36,h*.97,h*.24,0);g.strokeStyle=mix(SURV.sk,-.2);g.lineWidth=4;g.lineCap="round";g.beginPath();g.moveTo(w*.38,h*.7);g.lineTo(w*.46,h*.6);g.stroke()}},
  {d:3800,fx:"zoom",art:(g,w,h,i)=>{cutSky(g,w,h,i,.55,0);ground(g,w,h,h*.62);car(g,w*.5,h*.86,w*.3,0,"#2e2b28");
   const roof=h*.86-w*.3*.72;cFig(g,HS.remy[1],w*.62,roof,h*.32,1);cFig(g,survFr()[2],w*.42,roof+h*.06,h*.3,0);g.strokeStyle="#2f5f9e";g.lineWidth=6;g.lineCap="round";g.beginPath();g.moveTo(w*.58,roof-h*.2);g.lineTo(w*.49,roof-h*.17);g.stroke()}},
  {d:4200,fx:"none",art:(g,w,h,i)=>{cutSky(g,w,h,i,.55,0);ground(g,w,h,h*.62);road(g,w,h,h*.62,w*.5);car(g,w*.25,h*.9,w*.24,0,"#2e2b28");
   cFig(g,HS.remy[0],w*.25,h*.9-w*.24*.72,h*.26,0);cFig(g,survFr()[3],w*.7,h*.72,h*.12,0);g.fillStyle="rgba(230,220,200,.5)";g.font="900 "+Math.round(h*.04)+"px system-ui";g.fillText("→",w*.78,h*.65)}}],
 waycross:[ // Valdosta -> Waycross: a stray dog on the road looks at Remy, trots away (does not follow)
  {d:4000,fx:"none",art:(g,w,h,i)=>{cutSky(g,w,h,i,.58,0);ground(g,w,h,h*.6);road(g,w,h,h*.6,w*.8);strayDog(g,w*.5,h*.8,h*.12,0,1);g.fillStyle="#2a3a4c";g.beginPath();g.ellipse(w*.12,h*1.03,w*.16,h*.12,0,Math.PI,0);g.fill()}},
  {d:3800,fx:"zoom",art:(g,w,h,i)=>{g.fillStyle="#3a2c24";g.fillRect(0,0,w,h);const gr=g.createLinearGradient(0,0,0,h);gr.addColorStop(0,"#6b4a3a");gr.addColorStop(1,"#1e1a16");g.fillStyle=gr;g.fillRect(0,0,w,h);strayDog(g,w*.45,h*1.05,h*.5,0,1)}},
  {d:4200,fx:"none",art:(g,w,h,i)=>{cutSky(g,w,h,i,.58,0);ground(g,w,h,h*.6);road(g,w,h,h*.6,w*.8);strayDog(g,w*.82,h*.66,h*.05,2,0);cFig(g,HS.remy[0],w*.3,h*.95,h*.3,0)}}],
 savannah:[ // Waycross -> Savannah: night bridge pan, distant fires, a lone helicopter
  {d:6500,fx:"pan",wide:1.7,art:(g,w,h,i)=>{cutSky(g,w,h,i,.62,1);g.fillStyle="#0c1018";g.fillRect(0,h*.62,w,h*.38);for(let k=0;k<30;k++){g.fillStyle="rgba(255,140,50,"+(.1+k%3*.05)+")";g.fillRect((k*97)%w,h*.64+(k*13)%40,30+(k*7)%40,2)}// fire reflections on water
   g.strokeStyle="#1c1c22";g.lineWidth=6;g.beginPath();g.moveTo(0,h*.72);g.quadraticCurveTo(w*.5,h*.66,w,h*.72);g.stroke();g.lineWidth=3;for(const tx of[.3,.7]){g.beginPath();g.moveTo(w*tx,h*.72);g.lineTo(w*tx,h*.25);g.stroke();g.beginPath();g.moveTo(w*tx,h*.27);g.quadraticCurveTo(w*(tx+(tx<.5?-.15:.15)),h*.55,w*(tx<.5?0:1),h*.7);g.moveTo(w*tx,h*.27);g.quadraticCurveTo(w*.5,h*.52,w*(1-tx),h*.27);g.stroke()}
   g.lineWidth=1;for(let k=0;k<40;k++){const x=w*k/40;g.beginPath();g.moveTo(x,h*.69);g.lineTo(x,h*.71);g.stroke()}
   g.fillStyle="#0b0b0e";g.beginPath();g.ellipse(w*.8,h*.18,14,6,0,0,7);g.fill();g.fillRect(w*.8-28,h*.18-1,18,2);g.fillRect(w*.8-30,h*.18-10,60,1.5);g.fillStyle="rgba(255,60,50,.9)";g.fillRect(w*.8+12,h*.18,2,2);
   const sp=g.createLinearGradient(w*.8,h*.2,w*.76,h*.62);sp.addColorStop(0,"rgba(230,230,200,.35)");sp.addColorStop(1,"rgba(230,230,200,0)");g.fillStyle=sp;g.beginPath();g.moveTo(w*.8-3,h*.2);g.lineTo(w*.8+3,h*.2);g.lineTo(w*.8+20,h*.62);g.lineTo(w*.8-40,h*.62);g.fill();
   cFig(g,HS.remy[1],w*.12,h*.71,h*.12,0)}},
  {d:5500,fx:"shadow",art:(g,w,h,i)=>{const gr=g.createLinearGradient(0,0,0,h);gr.addColorStop(0,"#0c0f18");gr.addColorStop(1,"#2a1e1e");g.fillStyle=gr;g.fillRect(0,0,w,h);g.fillStyle="#141418";g.fillRect(0,h*.82,w,h*.18);g.fillStyle="#1c1c22";for(let x=0;x<w;x+=w/12)g.fillRect(x,h*.7,4,h*.12);g.fillRect(0,h*.7,w,4);
   g.fillStyle="#2a3a4c";g.beginPath();g.ellipse(w*.5,h*1.02,w*.2,h*.16,0,Math.PI,0);g.fill();g.fillStyle="#2b1d14";g.beginPath();g.ellipse(w*.5,h*.8,w*.09,h*.11,0,0,7);g.fill();g.fillStyle="#1e3a5e";g.beginPath();g.ellipse(w*.5,h*.73,w*.095,h*.06,0,Math.PI,0);g.fill()}}],
 charleston:[ // Savannah -> Charleston: roadside shop, crackling radio, Remy leans in
  {d:4000,fx:"none",art:(g,w,h,i)=>{cutSky(g,w,h,i,.6,0);ground(g,w,h,h*.64);g.fillStyle="#2a2522";g.fillRect(w*.3,h*.38,w*.42,h*.28);g.fillStyle="#3c2a22";g.beginPath();g.moveTo(w*.27,h*.4);g.lineTo(w*.5,h*.28);g.lineTo(w*.75,h*.4);g.fill();
   g.fillStyle="#7a6a4a";g.fillRect(w*.38,h*.33,w*.24,h*.05);g.fillStyle="#1b1816";g.font="900 "+Math.round(h*.035)+"px system-ui";g.textAlign="center";g.fillText("BAIT  ·  TACKLE  ·  RADIO",w*.5,h*.365);lit(g,w*.36,h*.46,w*.1,h*.08,.6);g.fillStyle="#120f0e";g.fillRect(w*.53,h*.47,w*.08,h*.19);
   cFig(g,HS.remy[2],w*.2,h*.86,h*.2,0)}},
  {d:4200,fx:"flick",art:(g,w,h,i)=>{g.fillStyle="#1c1714";g.fillRect(0,0,w,h);lit(g,w*.7,h*.08,w*.12,h*.1,.35);g.fillStyle="#3a2a20";g.fillRect(0,h*.6,w,h*.4);g.fillStyle="#2a1e16";g.fillRect(0,h*.6,w,h*.03);
   g.fillStyle="#4a3b2a";g.fillRect(w*.52,h*.38,w*.3,h*.22);g.fillStyle="#2a2018";for(let k=0;k<7;k++)g.fillRect(w*.55,h*(.42+k*.022),w*.12,h*.01);g.fillStyle="#d0b070";g.fillRect(w*.7,h*.43,w*.09,h*.05);g.fillStyle="#1a1410";g.beginPath();g.arc(w*.74,h*.54,h*.03,0,7);g.fill();
   g.strokeStyle="#222";g.lineWidth=2;g.beginPath();g.moveTo(w*.79,h*.38);g.lineTo(w*.86,h*.18);g.stroke();
   g.strokeStyle="rgba(230,220,180,.6)";g.lineWidth=1.5;for(let k=1;k<4;k++){g.beginPath();g.arc(w*.86,h*.18,k*h*.04,-1.2,.2);g.stroke()}
   cFig(g,HS.remy[0],w*.3,h*1.08,h*.7,0)}},
  {d:4000,fx:"zoom",art:(g,w,h,i)=>{g.fillStyle="#1c1714";g.fillRect(0,0,w,h);g.fillStyle="#4a3b2a";g.fillRect(w*.15,h*.2,w*.7,h*.6);g.fillStyle="#2a2018";for(let k=0;k<9;k++)g.fillRect(w*.2,h*(.28+k*.045),w*.3,h*.02);g.fillStyle="#d0b070";g.fillRect(w*.55,h*.28,w*.24,h*.12);g.fillStyle="#3a2010";for(let k=0;k<9;k++)g.fillRect(w*(.57+k*.024),h*.3,1,h*.08);g.fillStyle="#b02a1a";g.fillRect(w*.64,h*.29,2,h*.1);
   g.fillStyle="#1a1410";g.beginPath();g.arc(w*.67,h*.6,h*.09,0,7);g.fill();g.strokeStyle="#5a4a3a";g.lineWidth=2;g.stroke()}}],
 kingstree:[ // Charleston -> Kingstree: quiet small-object moment, an old cap on a fence post
  {d:4500,fx:"none",art:(g,w,h,i)=>{cutSky(g,w,h,i,.6,0);ground(g,w,h,h*.62,"#24261c");g.strokeStyle="#3a2e22";g.lineWidth=3;for(let k=0;k<9;k++){const x=w*(.05+k*.11),y=h*(.7+k*.02);g.beginPath();g.moveTo(x,y);g.lineTo(x,y-h*.12);g.stroke()}g.lineWidth=1.2;g.beginPath();g.moveTo(w*.05,h*.62);g.lineTo(w*.95,h*.78);g.moveTo(w*.05,h*.66);g.lineTo(w*.95,h*.82);g.stroke();
   g.fillStyle="#5a5a3a";g.beginPath();g.ellipse(w*.38,h*.65,w*.022,h*.014,0,Math.PI,0);g.fill();cFig(g,HS.remy[1],w*.8,h*.95,h*.22,1)}},
  {d:7500,fx:"zoom",art:(g,w,h,i)=>{const gr=g.createLinearGradient(0,0,0,h);gr.addColorStop(0,"#3a3a40");gr.addColorStop(1,"#6e5236");g.fillStyle=gr;g.fillRect(0,0,w,h);g.fillStyle="#2a2018";g.fillRect(w*.47,h*.47,w*.06,h*.53);g.strokeStyle="#2a2018";g.lineWidth=2;g.beginPath();g.moveTo(0,h*.6);g.lineTo(w,h*.56);g.moveTo(0,h*.72);g.lineTo(w,h*.69);g.stroke();
   g.fillStyle="#2a2018";g.fillRect(w*.47,h*.42,w*.06,h*.05);const cy=h*.43,cxx=w*.5;g.fillStyle="#3a3a26";g.beginPath();g.ellipse(cxx+w*.07,cy+h*.005,w*.075,h*.022,.12,0,7);g.fill();// brim
   g.fillStyle=shade(g,0,cy-h*.12,0,cy,"#6a6a48","#3c3c28");g.beginPath();g.moveTo(cxx-w*.07,cy);g.quadraticCurveTo(cxx-w*.07,cy-h*.13,cxx,cy-h*.13);g.quadraticCurveTo(cxx+w*.07,cy-h*.13,cxx+w*.075,cy);g.closePath();g.fill();g.strokeStyle="rgba(20,18,12,.6)";g.lineWidth=1;g.stroke();g.beginPath();g.moveTo(cxx,cy-h*.13);g.lineTo(cxx+w*.01,cy);g.stroke();g.fillStyle="#3c3c28";g.beginPath();g.arc(cxx,cy-h*.13,w*.008,0,7);g.fill();g.fillStyle="rgba(230,220,190,.18)";g.fillRect(cxx-w*.05,cy-h*.035,w*.1,h*.012);// faded old ball cap, seam + button
   g.fillStyle="rgba(240,230,210,.08)";for(let k=0;k<20;k++){g.beginPath();g.arc((k*53)%w,(k*31)%h,1.5,0,7);g.fill()}}}],
 florence:[ // Kingstree -> Florence: abandoned military roadblock, tilted tank and tires, Remy peeks over
  {d:4200,fx:"none",art:(g,w,h,i)=>{cutSky(g,w,h,i,.58,0);ground(g,w,h,h*.62);road(g,w,h,h*.62,w*.7);
   g.save();g.translate(w*.6,h*.7);g.rotate(-.12);g.fillStyle="#2c3026";g.fillRect(-w*.16,-h*.08,w*.32,h*.08);g.fillRect(-w*.09,-h*.15,w*.15,h*.08);g.fillRect(w*.04,-h*.13,w*.2,h*.02);g.fillStyle="#1a1c16";g.fillRect(-w*.17,-h*.01,w*.34,h*.04);g.restore();
   g.fillStyle="#15140f";for(const[x,y]of[[.2,.78],[.26,.8],[.23,.75],[.8,.82]]){g.beginPath();g.ellipse(w*x,h*y,w*.03,h*.02,0,0,7);g.fill()}
   g.fillStyle="#5a5030";for(let k=0;k<10;k++){g.beginPath();g.ellipse(w*(.05+k*.09),h*.9,w*.05,h*.03,0,0,7);g.fill()}g.strokeStyle="#7a2a1a";g.lineWidth=2;g.beginPath();g.moveTo(w*.3,h*.68);g.lineTo(w*.45,h*.68);g.stroke()}},
  {d:4200,fx:"zoom",art:(g,w,h,i)=>{cutSky(g,w,h,i,.55,0);ground(g,w,h,h*.6);g.save();g.translate(w*.55,h*.66);g.rotate(-.12);g.fillStyle="#2c3026";g.fillRect(-w*.12,-h*.06,w*.24,h*.06);g.fillRect(-w*.07,-h*.11,w*.11,h*.05);g.fillRect(w*.03,-h*.1,w*.15,h*.015);g.restore();
   g.fillStyle="#5a5030";for(let k=0;k<8;k++){g.beginPath();g.ellipse(w*(k*.15),h*.92,w*.1,h*.07,0,0,7);g.fill()}g.fillStyle="#4a4228";for(let k=0;k<8;k++){g.beginPath();g.ellipse(w*(.07+k*.15),h*.84,w*.09,h*.06,0,0,7);g.fill()}
   g.fillStyle="#2b1d14";g.beginPath();g.ellipse(w*.35,h*.8,w*.07,h*.08,0,0,7);g.fill();g.fillStyle="#1e3a5e";g.beginPath();g.ellipse(w*.35,h*.76,w*.075,h*.05,0,Math.PI,0);g.fill();g.fillRect(w*.33,h*.755,w*.07,h*.012);g.fillStyle="#c99a78";g.beginPath();g.arc(w*.3,h*.83,h*.02,0,7);g.arc(w*.41,h*.83,h*.02,0,7);g.fill()}},
  {d:4600,fx:"pan",wide:1.5,art:(g,w,h,i)=>{cutSky(g,w,h,i,.6,0);ground(g,w,h,h*.62);road(g,w,h,h*.62,w*.4);g.fillStyle="#1b1a16";for(let k=0;k<6;k++){g.save();g.translate(w*(.1+k*.16),h*(.75+(k%2)*.05));g.rotate((k%3-1)*.3);g.fillRect(-w*.03,-h*.03,w*.06,h*.05);g.restore()}
   g.strokeStyle="#6a5a3a";g.lineWidth=1.5;g.beginPath();for(let x=0;x<w;x+=12){g.moveTo(x,h*.66);g.lineTo(x+6,h*.62);g.lineTo(x+12,h*.66)}g.stroke();cFig(g,HS.remy[2],w*.15,h*.92,h*.2,0)}}],
 pamplico:[ // Florence -> Pamplico: dark road, the hometown sign, a far lit window. Heavier.
  {d:5000,fx:"none",art:(g,w,h,i)=>{cutSky(g,w,h,i,.6,1);g.fillStyle="rgba(0,0,0,.45)";g.fillRect(0,0,w,h);ground(g,w,h,h*.62,"#0e0e10");road(g,w,h,h*.62,w*.6,"#18171a");lit(g,w*.72,h*.585,w*.012,h*.012,.95);
   const sx=w*.18,sy=h*.42,sw=w*.3,sh=sw*.36;g.fillStyle="#2a2a28";g.fillRect(sx+sw*.2,sy+sh,4,h*.3);g.fillRect(sx+sw*.75,sy+sh,4,h*.3);g.fillStyle="#1f3a28";g.fillRect(sx,sy,sw,sh);g.strokeStyle="#9a968a";g.lineWidth=1.5;g.strokeRect(sx+3,sy+3,sw-6,sh-6);
   let fs=sh*.4;g.font="900 "+fs+"px system-ui";while(g.measureText("PAMPLICO").width>sw-14&&fs>8){fs--;g.font="900 "+fs+"px system-ui"}g.fillStyle="#bdb8a8";g.textAlign="center";g.textBaseline="middle";g.fillText(townName(i),sx+sw/2,sy+sh*.5);
   cFig(g,HS.remy[0],w*.5,h*.97,h*.26,0)}},
  {d:7500,fx:"zoom",art:(g,w,h,i)=>{g.fillStyle="#08080b";g.fillRect(0,0,w,h);g.fillStyle="#111016";g.beginPath();g.moveTo(w*.3,h*.65);g.lineTo(w*.5,h*.45);g.lineTo(w*.7,h*.65);g.fill();g.fillRect(w*.33,h*.65,w*.34,h*.2);lit(g,w*.46,h*.68,w*.05,h*.06,.9);g.fillStyle="#08080b";g.fillRect(w*.483,h*.68,2,h*.06);g.fillRect(w*.46,h*.708,w*.05,2);
   for(let k=0;k<14;k++){g.fillStyle="#0c0d0a";g.beginPath();g.moveTo(w*(k/14),h*.66);g.lineTo(w*(k/14+.03),h*(.45+(k*7%5)*.03));g.lineTo(w*(k/14+.06),h*.66);g.fill()}g.fillStyle="#0e0e10";g.fillRect(0,h*.85,w,h*.15)}}]};
function cutLine(i){const L=window.CUT_LINES||[],id=townName(i).toLowerCase(),e=L.find(x=>x.id===id);const t=e&&e.line||"";const ph=!t.trim()||/^\s*\[.*\]\s*$/.test(t);return{id,ph,text:ph?"...":t,who:(e&&e.who)||"Remy"}}
function townCut(i,done){cStop();clearTimeout(cutT);state="cut";show("cut");const land=innerWidth>innerHeight,aw=Math.round(land?Math.min(innerWidth-40,760):innerWidth-24),ah=Math.round(land?innerHeight-110:Math.min(innerHeight*.62,560));
 const id=townName(i).toLowerCase(),beats=CSC[id]||CSC.tallahassee,ln=cutLine(i);window.__cutId=id;window.__cutBeats=beats.length;window.__cutLine=ln;
 const P=$("cutP");P.innerHTML=`<div class="cart cpanel tr-cut cscene" style="width:${aw}px;height:${ah}px"><div class="cutHead"><div class="cap">${STAGES[i].n}</div><div class="bub cbub"></div></div></div>`;const box=P.firstChild;box.querySelector(".cbub").textContent=ln.ph?"...":ln.who+': "'+ln.text+'"';
 const els=beats.map((b,k)=>{const ww=Math.round(aw*(b.wide||1));let cv;if(!b.art){const src=cutArt(i,aw,ah);cv=document.createElement("canvas");cv.width=src.width;cv.height=src.height;cv.getContext("2d").drawImage(src,0,0)}else{cv=document.createElement("canvas");cv.width=ww*2;cv.height=ah*2;const g=cv.getContext("2d");g.scale(2,2);b.art(g,ww,ah,i);cFin(g,ww,ah)}
  const d=document.createElement("div");d.className="beat fx-"+b.fx;d.style.setProperty("--d",b.d+"ms");d.style.setProperty("--vw",aw+"px");cv.style.width=ww+"px";cv.style.height=ah+"px";d.appendChild(cv);if(b.fx==="shadow"||b.fx==="flick"){const o=document.createElement("div");o.className="ov";d.appendChild(o)}box.insertBefore(d,box.querySelector(".cutHead"));return d});
 let k=0,t0=0;const step=()=>{els.forEach((e,j)=>e.classList.toggle("on",j===k));window.__cutBeat=k;if(k<els.length-1){cutT=setTimeout(()=>{k++;step()},beats[k].d)}};step();
 const total=Math.max(10000,Math.min(15000,beats.reduce((a,b)=>a+b.d,0)+500));window.__cutTotal=total;
 const fin=()=>{clearTimeout(cutT);clearTimeout(cutE);cStop();if(state==="cut")done()};$("cutS").onclick=fin;window.__cutSpeak=ln.ph?false:cSpeak('"'+ln.text+'"');cutE=setTimeout(fin,total);window.__cutTown=townName(i)}
let cutE=null;
let comicSet=INTRO,comicI=0,comicDone=null;
function comic(set,done){comicSet=set;comicI=0;comicDone=done;renderComic();show("comic");state="comic"}
function renderComic(){const c=comicSet[comicI],nm=comicSet===INTRO?"INTRO":"ENDING",P=$("comicP");const land=innerWidth>innerHeight;
 const aw=Math.round(land?Math.min(innerWidth*.55,520):Math.min(innerWidth-24,480)),ah=Math.round(land?Math.min(innerHeight-90,330):Math.min(innerHeight*.42,340));
 P.innerHTML=`<div class="cpanel ${["tr-slide","tr-wipe","tr-cut"][comicI%3]}${land?" land":""}"><div class="cart"><div class="cap">${c.cap}</div></div><div class="ctext"><div class="narr">${c.t}</div><div class="bub">${c.b}</div></div></div><p class="cnum">${comicI+1} / ${comicSet.length}</p>`;
 const art=cArt(nm,comicI,aw,ah);art.style.width=aw+"px";art.style.height=ah+"px";P.querySelector(".cart").prepend(art);
 $("comicN").textContent=comicI===comicSet.length-1?"Let's go! ▶":"Next ▶";window.__lastSpeak=cSpeak(c.cap+". "+c.t+" "+c.b)}
$("comicN").onclick=()=>{ac();cStop();sfx("boing");if(++comicI>=comicSet.length){comicDone&&comicDone()}else renderComic()};$("comicS").onclick=()=>{cStop();comicDone&&comicDone()};

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
 $("overSub").textContent=won?(finale?"You made it HOME!":"Next stop: "+STAGES[G.stage+1].n):pick(["The zombies say thanks for the snack.","Granddad believes in you. So does the chicken.","Leo is still waiting! And probably eating your snacks."]);
 $("res").innerHTML=`⏱ Survived <b>${mm}:${ss}</b><br>💀 Zombies gooed: <b>${G.kills}</b><br>⭐ Level: <b>${G.lvl}</b><br>🏆 Score: <b>${sc}</b><br>🪙 Coins earned: <b>+${earned}</b>`;
 const top=LS.get("top_"+save.diff,[]);pendingScore={s:sc,t:Math.floor(G.t),k:G.kills,l:G.lvl,h:HEROES[G.hero].i,m:G.mode==="journey"?STAGES[G.stage].n.split(",")[0]:"Endless"};
 const qualifies=sc>0&&(top.length<10||sc>top[top.length-1].s);$("overBoard").innerHTML="";
 if(qualifies){ini=["R","E","M"];renderIni();$("ini").classList.remove("hidden");$("overBtns").classList.add("hidden")}else{$("ini").classList.add("hidden");$("overBtns").classList.remove("hidden");$("overBoard").innerHTML=boardHTML(top,-1)}
 $("againB").textContent=G.mode==="journey"?(won?"▶ Next stage":"🔁 Retry stage"):"🔁 Again";
 $("againB").onclick=()=>{if(G&&G.mode==="journey"){if(won&&G.stage<LAST){const nx=G.stage+1;persist();townCut(nx,()=>startRun("journey"))}else openMap()}else startRun("endless")};
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
window.__ZS=ZS;window.__GN=SPR.gnome;window.__HS=HS;window.__ATL=()=>ATL;window.__rs={PU,puGet,PU_GAP,ZT,LVL_GAP,xpNeed,INF,BOSSA,infest,get W(){return W},get H(){return H},endlessPow,stageClear,hurt,aoe,killZ,zone,setMute,get AC(){return AC},bagPick,nearest,prog,get G(){return G},get state(){return state},ent,save:()=>save,options,choose,spawnZ,openCards,endRun,stat,fps:()=>fps,startRun,beginRun,pickClass,CLASS_W,SACK_CD0,SACK_REACH0,SACK_ARC0,ROCKET_CD0,ROCKET_BLAST0,ROCKET_SPD};
