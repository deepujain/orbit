import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {G,CAT_H,MAX_UP,BIG_UP,STEP,launch,crouchFor,surfaces,canHop,route,hopPoints,platformsIn,shelves,standingOn,landingOn,walkStep,frictionStep,flyStep,carryStep,shakeMeter,edgeSpots,HANG,covered,PICK_UP,CHIP,chipSpring,chipAtRest,bump} from '../src/whiskers/cat-physics.js';
import {pickWeighted,IDLE,REACTIONS,MOODS,TOUCH,BASE,VOICE,CAT_SVG,menuMarkup,MENU,JOKES,REVIEW_JOKES,STATION_LINES,catLine,barInfo,spoken,NINE_LIVES,joinRopes} from '../src/whiskers/cat.js';
import {CUTE,CALLS,along,catVoice} from '../src/whiskers/cat-voice.js';
import {M,FRAG,contactOffset,poseUniforms,armPoints} from '../src/whiskers/cat-3d.js';
import {EventEmitter} from 'node:events';
import {mkdtempSync,writeFileSync,mkdirSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';

test('a hop is a real arc: it peaks a little above the higher end and comes down onto the target', () => {
  for(const [from,to] of [[{x:100,y:300},{x:200,y:200}],[{x:300,y:120},{x:180,y:300}],[{x:50,y:300},{x:60,y:290}]]){
    const L=launch(from,to),b={x:from.x,y:from.y,vx:L.vx,vy:L.vy};
    let hit=null,top=from.y;for(let t=0;t<3&&!hit;t+=STEP){hit=flyStep(b,STEP,[{l:to.x-20,r:to.x+20,y:to.y}],-1e4,1e4);top=Math.min(top,b.y);}
    assert.ok(hit,'it lands on the target surface');
    assert.ok(Math.abs(b.x-to.x)<6,`it lands where it aimed (${b.x.toFixed(1)} for ${to.x})`);
    assert.ok(Math.min(from.y,to.y)-top<=46,'the arc clears the higher end by a cat-sized margin, not a leap into the air');
  }
});

test('no hop is higher than three body heights, or faster than a cat runs', () => {
  assert.equal(launch({x:0,y:400},{x:40,y:400-MAX_UP-1}),null,'too high: it has to climb');
  assert.ok(launch({x:0,y:400},{x:40,y:400-MAX_UP+4}));
  assert.equal(launch({x:0,y:300},{x:900,y:300}),null,'too far for one hop');
  assert.equal(MAX_UP,CAT_H*3);
  assert.ok(G>1600&&G<1700,'gravity is 9.8 m/s² at the cat\'s scale');
  assert.ok(crouchFor({x:0,y:300},{x:100,y:200})>crouchFor({x:0,y:300},{x:20,y:300}),'it gauges a bigger hop for longer');
});

test('a bar out of reach is climbed to through lower ones, and an unreachable one is not tried', () => {
  const all=surfaces([{l:100,r:200,y:300},{l:220,r:320,y:190},{l:340,r:440,y:80},{l:900,r:1000,y:300}],400,0,1000);
  const [floor,low,mid,high]=all;
  assert.equal(canHop(floor,high),false);
  assert.deepEqual(route(all,floor,high),[low,mid,high],'shelf by shelf');
  assert.equal(route(all,floor,{l:500,r:600,y:-300,key:'sky'}),null);
  assert.deepEqual(hopPoints(floor,low,50),{from:110,to:124},'under a bar it hops straight up onto it');
  assert.deepEqual(hopPoints(low,mid,150),{from:192,to:238},'beside one it goes edge to near end');
  assert.deepEqual(hopPoints({l:100,r:140,y:50},{l:0,r:400,y:200},110),{from:108,to:78},'down onto a wider bar below it steps off its nearer end');
  assert.deepEqual(hopPoints({l:100,r:140,y:50},{l:120,r:400,y:200},110),{from:132,to:162},'or the end the lower bar runs on past');
});

test('walking speeds up, brakes in time and stops on the spot; friction stops a slide', () => {
  let x=0,v=0,steps=0,top=0;for(;steps<2000;steps++){const r=walkStep(x,v,200,120,STEP);x=r.x;v=r.v;top=Math.max(top,v);if(r.done)break;}
  assert.equal(x,200);assert.ok(top<=120.001,'never faster than its pace');assert.ok(steps<400);
  let s=300;for(let i=0;i<200&&s;i++)s=frictionStep(s,STEP);assert.equal(s,0);
});

test('a carried cat swings and settles under the pointer; letting go it falls onto the first bar below', () => {
  const b={x:0,y:0,vx:0,vy:0};for(let i=0;i<1200;i++)carryStep(b,STEP,{x:100,y:50});
  assert.ok(Math.abs(b.x+6-100)<3&&Math.abs(b.y-CAT_H+6-50)<12&&Math.hypot(b.vx,b.vy)<5,'it hangs just under the hand');
  const plats=[{l:0,r:300,y:200},{l:0,r:300,y:260}],f={x:100,y:100,vx:0,vy:0};let hit=null;for(let i=0;i<300&&!hit;i++)hit=flyStep(f,STEP,plats,-1e4,1e4);
  assert.equal(hit,plats[0]);
  const shake=shakeMeter();let n=0;for(let i=0;i<6;i++)n=shake(i%2?-900:900,i*120);
  assert.ok(n>=4,'a hard back-and-forth is a shake');assert.equal(shakeMeter()(200,0),0);
});

test('bars, and the edges between rows, are the surfaces it can stand on', () => {
  const view={left:100,right:600,top:50,bottom:300},box={left:80,top:40};
  const bars=platformsIn([{left:120,right:220,top:80,width:100},{left:300,right:310,top:90,width:10},{left:550,right:900,top:120,width:350,open:true}],view,box);
  assert.deepEqual(bars,[{l:40,r:140,y:40,open:false},{l:470,r:520,y:80,open:true}]);
  const rows=shelves([{left:100,right:350,top:150,width:250},{left:350,right:600,top:150,width:250},{left:100,right:600,top:220,width:500}],view,box,bars);
  assert.deepEqual(rows.map(r=>[r.l,r.r,r.y]),[[20,520,110],[20,520,180]],'cells side by side make one shelf');
  assert.equal(standingOn(rows,30,111),rows[0]);
  assert.equal(landingOn(rows,30,100,115),rows[0]);
  assert.equal(landingOn(rows,30,115,150),null,'only from above');
});

test('the cat has every reaction, mood and touch, each from a pose, and a one-item menu: nap', () => {
  assert.deepEqual(REACTIONS.map(r=>r[0]),['run','stretch','groom','scratch','swat','highfive'],'real-cat tricks, a run first');assert.equal(MOODS.length,6);assert.deepEqual(TOUCH.map(t=>t[1]),['Poke','Drag','Shake','Say a line']);
  for(const [id] of [...REACTIONS,...MOODS])assert.ok(BASE[id],`${id} has a pose`);
  const m=menuMarkup();
  assert.deepEqual(MENU.map(x=>x[1]),['Nap'],'sound is the page music switch, not the cat\'s');for(const [id] of MENU)assert.match(m,new RegExp(`data-do="catMenuDo" data-cat-do="${id}"`));
  assert.match(menuMarkup({nap:true}),/aria-checked="true"[^>]*data-cat-do="nap"[\s\S]*Wake up/);assert.doesNotMatch(menuMarkup(),/Sound/);
  assert.equal(pickWeighted(0),IDLE[0][0]);assert.equal(pickWeighted(.99999),IDLE.at(-1)[0]);
  const css=readFileSync(new URL('../themes/whiskers.css',import.meta.url),'utf8');
  for(const [id] of [...REACTIONS,...MOODS])assert.match(css,new RegExp(`data-(?:act|mood|pose)=${id}\\]`),`${id} is drawn`);
});

test('the cat has a voice: each sound it makes is defined, and on the page it sounds through the theme music', () => {
  for(const [name,cues] of Object.entries(VOICE))for(const [,what] of cues)assert.ok(CALLS[what]||['purr','sneeze'].includes(what),`${name}: ${what}`);
  const m=CALLS.meow.f0;assert.ok(along(m,.35)>along(m,0)&&along(m,1)<along(m,.35));
  assert.equal(along([[0,100],[1,200]],.5),150);
  for(const [name,c] of Object.entries(CALLS))for(const k of ['f0','f1','f2','f3','open'])assert.ok(Array.isArray(c[k]),`${name} has ${k}`);
  assert.ok(along(CALLS.meow.open,0)<1000&&along(CALLS.meow.open,.3)>3000&&along(CALLS.meow.open,1)<1000,'a meow opens from the m and closes on the w');
  const kept={},store={getItem:k=>kept[k]??null,setItem:(k,v)=>{kept[k]=v;}},doc={addEventListener(){}};
  const v=catVoice({win:{},doc,store});assert.equal(v.on,true);v.setOn(false);assert.equal(kept['playskin.cat.voice'],'off');
  assert.equal(catVoice({win:{},doc,store}).on,false);v.call('meow');v.purrOn();v.speak('hi');
  const js=readFileSync(new URL('../src/whiskers/cat.js',import.meta.url),'utf8');
  assert.match(js,/const voice=\{cue:\(n,o\)=>Boolean\(music\?\.cue\?\.\(n,o\)\)/);assert.match(js,/purrOn\(\)\{\},purrOff\(\)\{\}/,'no heavy purr');
  assert.match(js,/speak:t=>aloud&&music\?\.on\?speech\.speak\(t\):Promise\.resolve\(false\)/,'its line is read only when the host asks for it and the music is on');
  assert.match(js,/sfx:\(n,o\)=>Boolean\(music\?\.on&&speech\.cute\(n,o\)\)/,'its own kitten sounds, only with the music on');
  assert.match(js,/voice\.sfx\('pat',\{gain:hard\?1:\.75\}\)/,'a soft pat as it lands');assert.match(js,/voice\.sfx\('hup',/,'a hup as it jumps');
  assert.match(js,/caption\('Fish!',1100\);voice\.call\('meow'\);/,'a meow for the fish');
  for(const n of ['mew','meow','trill','chirp','sad','hup','pat','nom'])assert.ok(CUTE[n],`${n} is a kitten sound`);
  assert.ok(along(CUTE.mew.f0,.35)>along(CUTE.mew.f0,0)&&along(CUTE.mew.f0,1)<along(CUTE.mew.f0,.35)&&along(CUTE.mew.f0,0)>=700,'a high mew that rises and falls');
  const kv=catVoice({win:{},doc:{addEventListener(){}},store:{getItem:()=>'on',setItem(){}}});assert.equal(kv.cute('mew'),false,'silent until the page has had a click');
  assert.match(js,/if\(TRICKS\.has\(name\)\)voice\.cue\('trick'\);else sound\(name\);/,'a flourish for a trick');
  assert.match(js,/fish\.style\.scale=String\(k\);voice\.sfx\('nom',/,'a nom for each bite');
  assert.match(js,/function readLine\(\)\{if\(s\.mood\)mood\(null\);voice\.cue\('line'\);/);
});

test('the cat turns through a front view instead of mirroring, and is drawn as one smooth body on real legs', () => {
  const js=readFileSync(new URL('../src/whiskers/cat.js',import.meta.url),'utf8');
  assert.match(js,/s\.vis\+=Math\.max\(-dt\*TURN/);assert.match(js,/'--hk'/);assert.match(js,/'--fo'/);
  assert.match(CAT_SVG,/class="ct-front"/);assert.match(CAT_SVG,/clip-path="url\(#tl-cat-body\)"/);
  assert.equal((CAT_SVG.match(/class="ct-limb"/g)||[]).length,7);
});

test('it stands only on bars, explores bars, and scratches the glass facing you with its paws close together', () => {
  const js=readFileSync(new URL('../src/whiskers/cat.js',import.meta.url),'utf8');
  assert.doesNotMatch(js,/shelves\(/);assert.match(js,/all\.filter\(p=>p!==s\.surf&&!p\.floor&&!p\.perch\)/,'it explores bars, not the stations it climbs to for mischief');
  assert.match(js,/\.filter\(p=>!p\.floor\)/,'the floor is never a surface');assert.match(js,/function fellOut\(\)/);
  assert.doesNotMatch(js,/land\(all\[0\]/);assert.match(js,/const FRONT=new Set\(\['scratch'\]\)/);
  const paws=[...CAT_SVG.matchAll(/class="ct-arm ct-a\d"><path[^>]*\/><ellipse class="ct-paw" cx="([\d.]+)"/g)].map(m=>Number(m[1]));
  assert.equal(paws.length,2);assert.ok(paws[1]-paws[0]<=16,'paws about shoulder width apart');
  assert.equal((CAT_SVG.match(/class="ct-bean"/g)||[]).length,2);
});

test('a host scene comes before the room, and what it says reads in the dark theme', () => {
  const js=readFileSync(new URL('../src/whiskers/cat.js',import.meta.url),'utf8'),css=readFileSync(new URL('../themes/whiskers.css',import.meta.url),'utf8');
  assert.match(js,/journeyScene\(\)\|\|hostScene\(\)\|\|\(room\?homeScene\(\):null\)/,'a host scene, as a dashboard page, comes before the room');
  assert.doesNotMatch(css,/var\(--panel\b/,'no undefined surface variable');
  assert.match(css,/\.tl-cat-say\{[^}]*background:var\(--kc-panel,#fff\)/);assert.match(css,/:is\(\.dark,\[data-theme="dark"\]\) \.tl-cat-say\{background:var\(--kc-surface-3\)/,'dark by a class or a data-theme attribute');
});

test('nothing pops up beside the cat: a tap plays a trick, a double tap opens a small trick panel beside it, and nap is its own button beside the game', () => {
  const js=readFileSync(new URL('../src/whiskers/cat.js',import.meta.url),'utf8'),css=readFileSync(new URL('../themes/whiskers.css',import.meta.url),'utf8');
  assert.doesNotMatch(js,/tl-cat-ring|tl-cat-menu|openMenu|contextmenu/);
  assert.match(js,/if\(tapTimer\)\{win\.clearTimeout\(tapTimer\);tapTimer=0;openPanel\(\);return;\}/);
  assert.match(js,/tapTimer=win\.setTimeout\(\(\)=>\{tapTimer=0;trick\(\);\},TAP_GAP\)/);
  assert.match(js,/menuItems:\(\)=>menuMarkup\(\{nap:s\.mood==='nap'\}\),napping:\(\)=>s\.mood==='nap',menuDo,readLine,openPanel,closePanel/);
  assert.match(css,/\.tl-cat-panel\{position:fixed;left:0;top:0;z-index:60;width:212px/,'a small panel');assert.match(js,/let x=r\.right\+10;if\(x\+w>W-8\)x=r\.left-10-w;/,'just right of the cat, or left where the window ends');
});

test('the trick panel lists the real-cat tricks, three moods, and play: run, every touch and the line; it marks the mood that is on', async () => {
  const {trickPanelMarkup,REACTIONS,MOODS,TOUCH}=await import('../src/whiskers/cat.js');
  const html=trickPanelMarkup({mood:'focus'});
  for(const [id] of REACTIONS)assert.equal((html.match(new RegExp(`data-cat-kind="trick" data-cat-id="${id}"`,'g'))||[]).length,1,`${id} once`);
  const play=html.slice(html.indexOf('<h3>Play</h3>'));
  for(const id of ['run',...TOUCH.map(t=>t[0]),'line'])assert.match(play,new RegExp(`data-cat-id="${id}"`),`${id} is under Play`);
  for(const id of ['nap','focus','sulk'])assert.match(html,new RegExp(`data-cat-kind="mood" data-cat-id="${id}"`));
  assert.match(html,/class="tl-cat-trick on" data-cat-kind="mood" data-cat-id="focus" aria-pressed="true"/);
  assert.match(html,/data-cat-kind="line" data-cat-id="line"/);
  assert.equal((html.match(/data-cat-kind="mood"/g)||[]).length,3,'three moods');
  assert.doesNotMatch(html,/data-cat-id="beg"/,'sit pretty looked just like a swat');
  const js=readFileSync(new URL('../src/whiskers/cat.js',import.meta.url),'utf8');
  assert.match(js,/closePanel\(\);if\(k==='close'\|\|el\.hidden\|\|!sc\)return;\n\s+if\(k==='trick'\)playTrick\(id\)/,'a pick closes the panel, then the cat does it');
});

test('it talks about the bar it is on, how the round is going, or tells a joke', () => {
  assert.equal(spoken('2h 25m'),'2 hours 25 minutes');assert.equal(spoken('1m'),'1 minute');assert.equal(spoken('45s'),'45 seconds');
  assert.deepEqual(barInfo({text:'CI 20m',cls:'jl-tl-seg tone-run open k-ci'}),{name:'CI',dur:'20m',tone:'run',open:true});
  assert.deepEqual(barInfo({text:'Hooks 10m',cls:'jl-tl-seg tone-hooks k-agent'}),{name:'Repair',dur:'10m',tone:'hooks',open:false});
  const hi=()=>.99;
  assert.equal(catLine({bar:{name:'CI',dur:'20m',tone:'run',open:true},r:()=>.5}),'CI is still going on my push. I will sit right here until it is done.');
  assert.match(catLine({bar:{name:'CI',dur:'20m',tone:'run',open:true},r:(n=>()=>[.5,0][n++%2])(0)}),/My CI bar is still running, 20 minutes so far/);
  assert.match(catLine({bar:{name:'E2E',tone:'fail'},r:hi}),/E2E bar went red/);
  assert.equal(catLine({status:{phase:'Waiting for 18 checks on 8ec6a5f',round:14,max:20},r:(n=>()=>[.5,0][n++%2])(0)}),'Round 14 of 20. Waiting for 18 checks. I am on it.','no commit hashes read aloud');
  assert.ok(JOKES.includes(catLine({r:()=>0})),'with nothing to talk about it tells a joke');
  const js=readFileSync(new URL('../src/whiskers/cat.js',import.meta.url),'utf8');
  assert.match(js,/catLine\(\{bar:s\.surf\?\.info,status:line\(sc\?\.id\),station:s\.surf\?\.li\?\.querySelector\('\.jl-label strong'\)\?\.textContent\?\.trim\(\),work:workOf\(sc\?\.id\),jokes\}\)/);
  assert.match(js,/const workOf=id=>String\(id\|\|''\)\.startsWith\('rj:'\)\?'review':'author';/,'on the PR Review Journey it is the reviewer');assert.match(js,/later\(2500,show\)/);
});

const pose=(css={},part={})=>{const cs=o=>({getPropertyValue:k=>o[k]??'',opacity:o.opacity??'0'});
  return poseUniforms({vis:1,root:{},parts:{cs:e=>e==='root'||!e.k?cs(css):cs(part[e.k]||{}),el:k=>({k}),blink:()=>1}}).v;};
test('the 3D cat rests on the ground in every pose instead of hovering', () => {
  assert.ok(FRAG.includes('void main')&&FRAG.length>2000);
  for(const css of [{},{'--pitch':'-50','--tuck':'1'},{'--pitch':'-28','--l3':'-30','--l4':'-30'},{'--roll':'178'}]){
    const d=contactOffset(pose(css));assert.ok(Number.isFinite(d)&&Math.abs(d)<30,JSON.stringify(css));
    assert.equal(contactOffset(pose({...css,'--fy':'-12'})),d,'a pose that lifts the cat does not lift it off the bar');}
  assert.ok(Math.abs(contactOffset(pose())-(M.ground-46.8))<1,'standing, its paws are on the bar');
  assert.match(readFileSync(new URL('../src/whiskers/cat-3d.js',import.meta.url),'utf8'),/v\.uFy=v\.uFy\*\(1-held\)\+settle/);
  const v=pose({'--pitch':'-50'}),a=armPoints(v,[0,1]);
  assert.ok(Math.abs(a.uP2[0]-a.uP1[0])<20,'paws pressed close together on the glass');assert.ok(a.uP2[1]>a.uP1[1],'one paw pulls down while the other reaches');
  assert.ok((a.uS1[0]-a.uS2[0])*(a.uP1[0]-a.uP2[0])>=0,'each paw is on its own shoulder\'s side, so the arms never cross');
  assert.match(readFileSync(new URL('../src/whiskers/cat-3d.js',import.meta.url),'utf8'),/side=Math\.sign\(s\[0\]-v\.uHC\[0\]\)\|\|z/);
  assert.equal(M.ground,47.8,"paws press a little into the bar, as fur does");
  const js=readFileSync(new URL('../src/whiskers/cat.js',import.meta.url),'utf8');
  assert.match(js,/r3d=cat3d\(el,/);
});

test('on a rope the cat hangs by both raised paws with its back to you, in play and on its own', () => {
  const cs=o=>({getPropertyValue:k=>o[k]??'',opacity:o.opacity??'0'}),css={'--pitch':'-62'};
  const rope=back=>poseUniforms({vis:0,back,root:{},parts:{cs:e=>e==='root'||!e.k?cs(css):cs(e.k==='arms'?{opacity:'1'}:{}),el:k=>({k}),blink:()=>1}}).v;
  const face=rope(false),hang=rope(true);
  assert.ok(Math.abs(face.uYaw+hang.uYaw)<1e-9,'turned the other way round');assert.equal(hang.uHA[1],Math.PI,'its head turns away with it');assert.equal(hang.uMisc[2],1,'paws close round the rope');
  const g=armPoints(hang,[0,0],{grip:true});
  assert.ok(g.uP1[1]<hang.uHC[1]-15&&g.uP2[1]<hang.uHC[1]-15,'both paws reach above its head');assert.ok(g.uP1[1]<g.uP2[1],'one paw above the other');
  const js=readFileSync(new URL('../src/whiskers/cat.js',import.meta.url),'utf8');
  assert.match(js,/s\.mode='climb';s\.front=true;s\.back=true;/);assert.match(js,/s\.back=Boolean\(p\.rope\)/);assert.match(js,/pose\(p\.rope\?'rope'/);
  assert.match(readFileSync(new URL('../themes/whiskers.css',import.meta.url),'utf8'),/\.tl-cat:is\(\[data-act=climb\],\[data-pose=rope\]\) \.ct-arms\{opacity:1\}/);
});

test('it shares its time evenly between the stations, the timeline and the PR chips, and the page follows', () => {
  const js=readFileSync(new URL('../src/whiskers/cat.js',import.meta.url),'utf8');
  assert.match(js,/const ZONE=\{stay:\[25000,40000\],first:\[6000,12000\],order:\['timeline','top','chips'\],/,'the same stay in each of the three');
  assert.match(js,/const zoneOf=p=>p\?\.li\?'top':p\?\.perch==='pick'\?'chips':'timeline';/);
  assert.match(js,/if\(t>=s\.zoneUntil\)\{s\.zone=order\[\(order\.indexOf\(s\.zone\)\+1\)%order\.length\];s\.zoneUntil=t\+rand\(\.\.\.ZONE\.stay\);/,'then on to the next');
  assert.match(js,/if\(here!==s\.zone\)\{if\(goZone\(s\.zone\)\)return true;if\(\+\+s\.zoneMiss>ZONE\.miss\)s\.zoneUntil=t;\}/,'a place it cannot get to is skipped, not waited on');
  assert.match(js,/else if\(here==='top'\)return topPlay\(\);\s*else if\(here==='chips'\)return chipPlay\(\);\s*else if\(Math\.random\(\)<\.3&&scout\(\)\)return true;/,'on the timeline it often scrolls the rounds left or right');
  assert.match(js,/return Boolean\(edge&&goTo\(edge,\{scout:side\}\)\);/,'heading for a bar that reaches the edge');
  assert.match(js,/const PICKS='\.jl-pick\[data-do="jlLivePick"\]',RJ_PICKS='\.jl-pick\[data-do="rjPick"\]',HOME_PICKS='\[data-card\]';/,'the PR chips are a play area');
  assert.match(js,/perch:'pick',chip:e,key:`perch:pick:\$\{e\.dataset\.id\?\?i\}`/,'loose chips like the others, each known by its PR');
  assert.match(js,/through:next\.y>s\.surf\.y\+6&&\(\(next\.perch==='pick'&&s\.surf\.perch!=='pick'\)\|\|\(s\.surf\.perch&&s\.surf\.perch!=='pick'\)\|\|next\.inner\)\?next\.y-2:null/,'it drops through the bottom of the timeline to them, and down between the key pills');
  assert.match(js,/if\(!hit&&b\.vy>0&&b\.y>sc\.bottom\+6\)\{fellOut\(\);return;\}/,'and only falls out below them');
  assert.match(js,/if\(hit\.li\)kick\(hit\.li,vy,b\.vx\);/,'every station it lands on bounces, whatever sent it there');
  assert.match(js,/if\(hit\.el\)jiggle\(hit\.el,vy,b\.x\);/,'and so does every bar');
  assert.match(js,/if\(s\.mode==='walk'&&s\.surf\?\.el&&t>=\(s\.stepAt\|\|0\)\)/,'each step jiggles the bar');
  assert.match(js,/jiggle\(s\.surf\.el,s\.walk\.pace>=RUN\?80:s\.walk\.pace>=TROT\?60:45,b\.x,true\);/);
  assert.match(js,/w\.a=Math\.min\(step\?Math\.max\(w\.a,WOB\.stepWave\):1,w\.a\+hit\)/,'but steps only stir a faint ripple, however long it walks');
  assert.match(js,/el\.style\.clipPath=`polygon\(\$\{top\.concat\(bot\)\.join\(','\)\}\)`/,'a wave runs along the bar');
  assert.match(js,/else if\(s\.surf\?\.el\)\{const p=all\.find\(q=>q\.key===s\.surf\.key\);if\(p\)b\.y\+=p\.y-s\.surf\.y;\}/,'and the cat rides the bounce');
  assert.match(js,/clearTimers\(\);ropeReset\(\);unwobAll\(\);/);
  assert.match(js,/w\.v\+=J;w\.om\+=J\*\(x-w\.cx\)\*6\/\(w\.W\*w\.W\)\*WOB\.spin;/,'a landing shoves the bar down and tips it toward the end it landed nearer');
  assert.match(js,/w\.v\+=\(-WOB\.k\*\(w\.y-yEq\)-WOB\.c\*w\.v\)\*h;/,'it springs back past level and the swings die away');
  assert.match(js,/const yEq=on\?WOB\.sag:0/,'and it sags a little under the cat while it stands there');
  assert.match(js,/el\.style\.rotate=`\$\{w\.th\.toFixed\(4\)\}rad`/);
  assert.match(js,/dip=plank\?tiltAt\(plank,b\.x\):0/,'the cat sits on the tilted top and leans with it');
  assert.match(js,/if\(s\.surf\?\.li\)kick\(s\.surf\.li,-L\.vy\*\.35,-L\.vx\);/,'and pushing off one kicks it back');
  assert.match(js,/if\(gem&&gem\.top<80&&Date\.now\(\)-userScrollAt>FOLLOW_USER\)\{pageScrollAt=Date\.now\(\)\+1400;win\.scrollBy/,'the page scrolls the journey into view to climb up');
  assert.match(js,/function keepInView\(\)\{[^\n]*t-userScrollAt<FOLLOW_USER\)return;/,'and follows the cat, but never fights the user scrolling');
  assert.match(js,/placeMark\(\);keepInView\(\);/);
});

test('a double-click off the cat drops a fish there; it goes the long way round, eats it, does a trick and says its line', () => {
  const js=readFileSync(new URL('../src/whiskers/cat.js',import.meta.url),'utf8'),css=readFileSync(new URL('../themes/whiskers.css',import.meta.url),'utf8');
  assert.match(js,/doc\.addEventListener\('dblclick',e=>\{if\(busy\(\)\|\|el\.contains\(e\.target\)\|\|e\.target\.closest\?\.\('button,a,input,textarea,select,label,table,\[role="grid"\],\[role="dialog"\],\[contenteditable\],\[data-do\],\.jl-cat-menu,\.tl-cat-panel'\)\)return;/,'not on the cat, a control or its trick panel');
  assert.match(js,/t=nearest\(x,y\);if\(!t\)return;/);
  assert.match(js,/detours:goof\?0:/,'hungry, it heads straight for the fish');
  assert.match(js,/if\(goof\)\{mark\(s\.quest,at\);hungry\(at\);\}/,'it smells the fish and says it is hungry');
  assert.match(js,/function hungry\(at\)\{voice\.call\('meow'\);say\(HUNGRY\[/);
  assert.match(css,/\.tl-cat-fx\.fx-smell\{[^}]*animation:ct-smell/,'wisps drift from the fish to its nose');
  assert.match(js,/say\(pet&&fed\(\)\?`Thank you! \$\{catName\} is full`:YUM\[Math\.floor\(Math\.random\(\)\*YUM\.length\)\],1500\);voice\.call\('meow',\{pitch:1\.08\}\);[^\n]*glyph\('heart'/,'after eating: yummy, a happy meow and hearts');
  assert.match(js,/if\(q\.goof&&r<\.3\)\{const \[name,label,ms\]=REACTIONS\[/,'a trick or two on the way');
  assert.match(js,/if\(q\.goof\)return feast\(q\);/,'getting there, it has the fish');
  assert.match(js,/const to=q\.goof\?q\.x-\(q\.x>=b\.x\?1:-1\)\*CAT_W\*\.42:q\.x;/,'stopping just short of it, facing it');
  assert.match(js,/if\(!act\('eat',1800\)\)/);assert.equal(BASE.eat,'crouch');
  assert.match(js,/\[\[420,\.72\],\[900,\.45\],\[1380,\.2\]\]/,'eaten in bites');
  assert.match(js,/const \[name,label,ms\]=REACTIONS\[Math\.floor\(Math\.random\(\)\*REACTIONS\.length\)\];if\(act\(name,ms\)\)caption\(label,ms\);\n\s+later\(ms-40,\(\)=>\{if\(s\.act\?\.name===name&&s\.mode==='idle'\)readLine\(\);\}\);/,'then a trick, then its line');
  assert.match(js,/const q=s\.quest\?\.goof\?s\.quest:s\.feast;if\(!q\|\|!sc\)\{goalEl\.hidden=true;return;\}/,'the fish goes once eaten or the trip is given up');
  assert.match(js,/sendTo\(t,x,true,\{x:e\.clientX,y:e\.clientY\}\)/,'it drops from the pointer');
  assert.match(css,/\.tl-cat-goal\{position:fixed;[^}]*pointer-events:none/);
});

test('tapping cycles its tricks, and a clicked bar sends it there after a wrong turn or two', () => {
  const js=readFileSync(new URL('../src/whiskers/cat.js',import.meta.url),'utf8');
  assert.match(js,/REACTIONS\[cycle%REACTIONS\.length\];cycle\+\+/);
  assert.match(js,/s\.quest=\{key:t\.key,y:t\.y,x:/);assert.match(js,/detours:/);
  assert.match(js,/function span\(f\)/,'bars side by side at one height are one walkway');
  assert.match(js,/voice\.scritch\?\.\(\)/);
  assert.equal(typeof catVoice({win:{},doc:{addEventListener(){}},store:{getItem:()=>null,setItem(){}}}).scritch,'function');
});

test('the ends of bars: where a drop lands, and a fall below the timeline never costs a life', () => {
  // A staircase of rows as the timeline draws them: lower rows sit beside and below a bar's ends, not straight under them.
  const all=[{l:490,r:618,y:151},{l:626,r:712,y:119},{l:626,r:712,y:167},{l:392,r:421,y:275},{l:312,r:384,y:243},{l:411,r:482,y:243}];
  const from151=edgeSpots({l:490,r:618},151,all,{left:317,right:1109});
  const left=from151.hang.find(h=>h.side<0);
  assert.deepEqual(left.to,{l:411,r:482,y:243},'it drops two rows down onto the bar below its end');
  assert.equal(left.depth,HANG);assert.ok(left.vx<0&&Math.abs(left.vx)<240,'letting go it pushes off outward, not sideways at speed');
  const close=from151.hang.find(h=>h.side>0);assert.ok(close.depth<HANG,'a bar close below its end shortens the dangle so its feet stay above it');
  assert.deepEqual(edgeSpots({l:626,r:712},119,all,{left:317,right:1109}).slip,[],'a row within its width below is not a drop out of the timeline');
  assert.deepEqual(edgeSpots({l:392,r:421},275,all,{left:317,right:1109}).slip.map(x=>x.side),[-1,1],'the ends of the lowest bar have nothing below');
  assert.deepEqual(edgeSpots({l:392,r:421},275,all,{left:390,right:1109}).slip.map(x=>x.side),[1],'an end at the edge of the view runs on out of sight, so it is not an edge');
  const js=readFileSync(new URL('../src/whiskers/cat.js',import.meta.url),'utf8');
  assert.ok(!IDLE.some(([a])=>a==='slip'),'it never slips off on purpose');
  assert.match(js,/L=launch\(b,to,\{maxUp:Infinity,maxVx:Infinity\}\);[\s\S]{0,80}s\.mode='air';s\.surf=null;b\.vx=L\.vx;b\.vy=L\.vy;/,'a fall out of the timeline springs it back up onto the nearest bar, in sight');
  assert.doesNotMatch(js,/b\.y=t\.y-CAT_H\*1\.4/,'it is never moved there out of sight');
  assert.match(js,/s\.falling\?all\.filter\(p=>p\.y>s\.fallFrom\+8\)/,'a slip lands on a bar below');
  assert.match(js,/if\(!t\)\{if\(!late\)return act\('look',600\);s\.quest=null;return false;\}/,'a fish target missing for a moment keeps the fish');
  assert.match(js,/else if\(el\.hidden\|\|\(lostAt\|\|=now\(\)\)\+LOST_MS<now\(\)\)sc=null;/,'a timeline missing for a moment only pauses the cat');
  assert.doesNotMatch(js,/lives=true/,'and it loses no life');
  assert.ok(IDLE.some(([a])=>a==='rope')&&IDLE.some(([a])=>a==='scout'));
});

test('a trick is named over its head, and the timeline scrolls when it heads for rounds out of sight', () => {
  const js=readFileSync(new URL('../src/whiskers/cat.js',import.meta.url),'utf8'),css=readFileSync(new URL('../themes/whiskers.css',import.meta.url),'utf8');
  assert.match(js,/const \[name,label,ms\]=REACTIONS\[cycle%REACTIONS\.length\];cycle\+\+;s\.quest=null;s\.feast=false;if\(act\(name,ms\)\)caption\(label,ms\)/);
  assert.match(js,/bubble\.offsetHeight-12-over/,'a speech bubble sits above the caption');assert.match(css,/\.tl-cat-cap\{position:fixed/);
  assert.match(js,/v\.scrollBy\?\.\(\{left:heading\*Math\.min\(room,v\.clientWidth\*\.45\),behavior:'smooth'\}\)/);
  assert.match(js,/b\.x-=d;if\(s\.walk\)s\.walk\.x-=d;/,'the bars carry it along as the timeline scrolls');
  assert.match(js,/'Checking the earlier rounds'/);
});

test('its toys come out only in a scene called home, and are put out of sight while the cat is away',()=>{
  const js=readFileSync(new URL('../src/whiskers/cat.js',import.meta.url),'utf8');
  assert.match(js,/if\(sc\?\.id!=='home'\)\{if\(toys\.length\)toysOff\(\);return;\}/,'toys only on a home scene');
  assert.match(js,/const out=!want\(\)\|\|reducedMotion\(\);for\(const e of toyEls\.values\(\)\)e\.hidden=out;/,'out of sight while the cat is away, keeping the cord the yarn has lost');
  assert.match(js,/if\(!view\)return journeyScene\(\)\|\|hostScene\(\)\|\|\(room\?homeScene\(\):null\);/,'a host scene comes before the room, and room:false keeps it to those');
  assert.match(js,/const v=f\(\{doc,win,chipY:e=>chips\.get\(e\)\?\.y\|\|0,onScreen,CAT_W,CAT_H\}\)/,'a host scene is told how far each box is pushed down');
});

test('with no Agent Timeline it lives on the PR Review Journey, never the guide demo',()=>{
  const js=readFileSync(new URL('../src/whiskers/cat.js',import.meta.url),'utf8');
  assert.match(js,/view=tl\?\.querySelector\('\.jl-rg-scroll,\.jl-tl-view'\);if\(!view\)return journeyScene\(\)\|\|hostScene\(\)\|\|\(room\?homeScene\(\):null\);/,'a timeline stays its first home');
  assert.match(js,/const host=\[\.\.\.doc\.querySelectorAll\('\.rj\[data-rj\]'\)\]\.find\(e=>!\/\^guide-\/\.test\(e\.dataset\.rj\)&&e\.getClientRects\(\)\.length\),view=host\?\.querySelector\('\.jl-track'\);/);
  assert.match(js,/plats:\[\.\.\.perches\(box,v,left,right,host\),\.\.\.low\]/,'its perches are that journey\'s stations and ticket');
  assert.match(js,/low=picks\(box,floor,left,right,host,RJ_PICKS\)/,'and the review chips under it');
  assert.match(js,/for\(const li of scope\.querySelectorAll\('\.jl-station:not\(\[hidden\]\)'\)\)/);
  assert.match(js,/const row=\[\.\.\.doc\.querySelectorAll\(`\$\{PICKS\},\$\{RJ_PICKS\},\$\{HOME_PICKS\}`\)\]/,'review chips shove each other too');
  assert.match(js,/g=at!=null\?doc\.querySelector\(`\.jl-station\[data-station="\$\{at\}"\]:not\(\[hidden\]\) \.jl-gem`\):null;/,'with no home station it peeks from nowhere instead of throwing');
});

test('it climbs from the bars onto the key boxes, then up to the stations, and drags them about on their rope', () => {
  const js=readFileSync(new URL('../src/whiskers/cat.js',import.meta.url),'utf8'),css=readFileSync(new URL('../themes/whiskers.css',import.meta.url),'utf8');
  assert.ok(IDLE.some(([a])=>a==='mischief'),'mischief is one of the things it does');
  assert.match(js,/scope\.querySelectorAll\(CHIP_ROW\)\.forEach/,'the boxes of the timeline key are the first step up');
  assert.match(js,/perch:'box',key:`perch:box:\$\{i\}`/);assert.doesNotMatch(js,/perch:'card'/,'not the top edge of the timeline card');
  assert.match(js,/perch:'gem',li,station:at,key:`perch:gem:\$\{at\}`/);assert.match(js,/perch:'chip',li,chip:li\.querySelector\('\.jl-label small'\),station:at,key:`perch:chip:\$\{at\}`/,'then a station subtitle, then its diamond');
  assert.match(js,/if\(s\.goal\?\.mischief&&s\.surf\?\.perch==='gem'\)\{s\.goal=null;mess\(\);return;\}/,'on the diamond it messes with the station');
  assert.match(js,/if\(len>z\.rest\)\{const f=ROPE\.rope\*\(len-z\.rest\)\/len;/,'a taut rope drags the next station along');
  assert.match(js,/sag=Math\.max\(0,z\.base-len\)\*\.7/,'a slack rope sags');
  assert.match(js,/const d=ropePath\(rope\);for\(const p of rope\.paths\)p\.setAttribute\('d',d\);/,'the journey line is redrawn through the moved stations');
  assert.match(js,/<2\)\)\{ropeReset\(\);return;\}/,'once home, the stations and line are put back exactly');
  assert.match(js,/clearTimers\(\);ropeReset\(\);/,'and at once when the cat goes');
  assert.match(js,/if\(s\.surf\?\.li\|\|s\.surf\?\.chip\|\|s\.surf\?\.perch==='pick'\|\|s\.surf\?\.ride\|\|s\.surf\?\.rides\)\{const p=all\.find\(q=>q\.key===s\.surf\.key\);if\(p\)\{const dx=\(p\.l\+p\.r-s\.surf\.l-s\.surf\.r\)\/2,dy=p\.y-s\.surf\.y;if\(!s\.surf\.rides&&\(Math\.abs\(dx\)>RELAID\|\|Math\.abs\(dy\)>CAT_H\)\)\{s\.surf=null;\}else\{b\.x\+=dx;if\(s\.walk\)s\.walk\.x\+=dx;b\.y\+=dy;/,'it rides a station or chip as it is dragged, its walk moving with it');
  assert.doesNotMatch(css,/\.jl-station\{transition:translate/,'the rope moves the stations, not a CSS transition');
  assert.match(js,/s\.peek=null;hush\(\);/);assert.doesNotMatch(js,/closeMenu/,'leaving never calls the retired menu');
});

test('a hop up to a perch above the timeline may rise four body heights; one between bars, three', () => {
  const bar={l:0,r:200,y:300},box={l:120,r:200,y:300-CAT_H*3.6,perch:'box'},high={l:120,r:200,y:300-CAT_H*3.6};
  assert.equal(BIG_UP,CAT_H*4);assert.ok(canHop(bar,box),'the key box to a station subtitle is in reach');assert.ok(!canHop(bar,high),'a bar that high is not');
});

test('the pills are loose chips: knocked along they slide back home without swinging, and shove their neighbours down the row',()=>{
  const c={x:0,y:0,vx:CHIP.shove,vy:-40};let far=0,crossed=false;
  for(let i=0;i<240;i++){chipSpring(c,1/60);far=Math.max(far,c.x);if(c.x<0)crossed=true;}
  assert.ok(far>15&&far<=CHIP.reach,`a shove slides it a visible way, ${far.toFixed(1)}px`);assert.ok(!crossed,'it eases home without swinging back and forth');
  for(let i=0;i<600;i++)chipSpring(c,1/60);assert.ok(chipAtRest(c),'and settles home');
  const on={x:0,y:0,vx:0,vy:200};for(let i=0;i<300;i++)chipSpring(on,1/60,CHIP.sag);assert.ok(chipAtRest(on,CHIP.sag),'it sags a little under the cat');
  const a={l:0,r:50,c:{x:8,y:0,vx:300,vy:0}},n={l:56,r:100,c:{x:0,y:0,vx:0,vy:0}};
  assert.equal(bump(a,n),true);assert.ok(a.r+a.c.x+CHIP.gap<=n.l+n.c.x+1e-9,'they do not pass through each other');
  assert.ok(n.c.vx>a.c.vx&&n.c.vx<300&&a.c.vx>0,'the knock passes on, losing some');
  assert.equal(bump({l:0,r:50,c:{x:0,vx:0}},{l:56,r:100,c:{x:0,vx:0}}),false,'chips at home do not touch');
  const js=readFileSync(new URL('../src/whiskers/cat.js',import.meta.url),'utf8');
  assert.match(js,/const CHIP_ROW='\.jl-tl\[data-tl-id\] \.jl-tl-key > span, \.jl-tl\[data-tl-id\] \.jl-tl-mode \.segmented, \.jl-tl\[data-tl-id\] \.jl-cat-pick, \.jl-tl\[data-tl-id\] \.jl-tl-span \.segmented'/,'the key boxes and the header controls');
  assert.match(js,/perch:'chip',li,chip:li\.querySelector\('\.jl-label small'\)/,'and each station pill');
  assert.match(js,/if\(hit\.chip\)nudge\(hit\.chip,/,'landing knocks it');assert.match(js,/if\(s\.surf\?\.chip\)nudge\(s\.surf\.chip,-L\.vx\*\.3,-L\.vy\*\.15\);/,'pushing off kicks it');
  assert.match(js,/if\(s\.mode==='walk'&&s\.surf\?\.chip&&t>=\(s\.stepAt\|\|0\)\)/,'each step nudges it');
  assert.match(js,/if\(s\.surf\?\.li\|\|s\.surf\?\.chip\|\|s\.surf\?\.perch==='pick'\|\|s\.surf\?\.ride\|\|s\.surf\?\.rides\)\{const p=all\.find/,'the cat rides the chip it stands on');
  assert.match(js,/function shove\(\)\{const here=s\.surf;if\(here\?\.perch!=='pick'\)return false;/,'it shoves PR chips, and leaves the timeline header still');
  assert.match(js,/const row=\[\.\.\.doc\.querySelectorAll\(`\$\{PICKS\},\$\{RJ_PICKS\},\$\{HOME_PICKS\}`\)\]\.map\(homeOf\)/);
  assert.match(js,/if\(Date\.now\(\)-userScrollAt<FOLLOW_USER\)\{const v=inView\(\);if\(!v\[s\.zone\]\)\{const z=v\[here\]\?here:/,'scrolled away, it makes for what is in view');
  assert.match(js,/unwobAll\(\);unchipAll\(\);/,'and every chip goes home when it leaves');
});

test('it does not hop down onto a bar its own bar covers, but drops through to the PR chips',()=>{
  const a={l:100,r:400,y:100},under={l:150,r:300,y:180},beyond={l:300,r:500,y:180},pick={l:150,r:300,y:260,perch:'pick'};
  assert.equal(covered(a,under),true);assert.equal(canHop(a,under),false,'it would only land back where it stood');
  assert.equal(canHop(a,beyond),true,'a bar running on past its end is fine');assert.equal(canHop(a,pick),true);
  assert.equal(canHop(under,a),true,'and up is always fine');
  assert.equal(canHop(pick,{...pick,y:300}),false,'from one row of PR chips to the row below it steps off an end');
  assert.equal(canHop(pick,{l:150,r:300,y:260-PICK_UP+10}),true,'and it leaps back up from them into the timeline');assert.equal(canHop(pick,{l:150,r:300,y:260-PICK_UP-10}),false);
});

test('the timeline\'s upright lines are ropes: it climbs down one and drops onto the bar below, or up onto the bar above', () => {
  const js=readFileSync(new URL('../src/whiskers/cat.js',import.meta.url),'utf8'),css=readFileSync(new URL('../themes/whiskers.css',import.meta.url),'utf8');
  assert.ok(IDLE.some(([a,w])=>a==='rope'&&w>=20),'often');
  assert.match(js,/const ROPES='\.jl-tl-link,\.jl-tl-push,\.jl-tl-stop,\.jl-tl-now,\.jl-tl-future-tick,\.jl-rg-thru'/);
  assert.match(js,/\.filter\(r=>r\.bot-r\.top>60&&/,'only lines long enough to climb');
  assert.match(js,/if\(a==='rope'\)return climb\(\)\|\|walkTo\(/,'no more hanging in the air off the end of a bar');
  assert.match(js,/if\(walkTo\(Math\.max\(w\.l\+6,Math\.min\(w\.r-6,o\.r\.x\)\),TROT\)\)s\.walk\.then='climb';else grabRope\(\);/,'it walks to the rope first, even one at the very end of its bar');
  assert.match(js,/if\(s\.mode==='climb'\)\{climbStep\(t,dt\);return;\}/);
  assert.match(js,/b\.x=ropeX\(c\)\+beat\*1\.5;s\.tilt=beat\*CLIMB\.sway;/,'hand over hand on the rope, which follows the timeline as it scrolls');
  assert.match(js,/if\(down\)\{s\.mode='air';s\.surf=null;s\.hop=null;b\.vx=0;b\.vy=0;/,'letting go it falls onto whatever is below');
  assert.match(js,/else\{b\.y=p\.y;land\(p,200\);/,'or it climbs onto the bar above');
  assert.match(js,/function hide\(\)\{charts\.reset\(\);fog\.hidden=true;cap\.hidden=true;dropRope\(\);/);
  assert.match(css,/\.tl-cat-rope\{filter:drop-shadow\(0 0 4px var\(--kc-amethyst\)\)\}/,'the rope it holds glows');
  assert.match(js,/w\.om\+=\(-SWAY\.k\*\(w\.th-to\)-SWAY\.c\*w\.om\)\*h;/,'and swing like a rope under the cat, settling once it lets go');
  assert.match(js,/swayStep\(dt\);/);
});

test('its meows are real recordings, played a little higher or lower each time; no whistling tones on hops and bites', () => {
  const v=readFileSync(new URL('../src/whiskers/cat-voice.js',import.meta.url),'utf8'),js=readFileSync(new URL('../src/whiskers/cat.js',import.meta.url),'utf8');
  assert.ok(existsSync(new URL('../src/whiskers/meow.m4a',import.meta.url)));
  for(let n=1;n<=4;n++)assert.ok(!existsSync(new URL(`../src/whiskers/meow-${n}.m4a`,import.meta.url)),'only the one clear meow is kept');
  assert.match(v,/MEOWS=\[new URL\('\.\/meow\.m4a',import\.meta\.url\)\.href\]/);
  assert.match(v,/mouth\.type='lowpass'/,'the mouth opens on the "m" and rounds shut on the "ow"');
  assert.match(v,/src\.playbackRate\.linearRampToValueAtTime\(rate\*k/,'its pitch rises and falls like a meow');
  assert.match(v,/public domain \(CC0\)/);
  assert.match(js,/call\(n,o\)\{if\(!music\?\.on\|\|now\(\)<voiceFree\)return false;const said=speech\.meow\(CUTE_OF\[n\]\|\|'mew',o\);/,'every meow, mew and chirp is a recorded one, one at a time');
  assert.match(v,/hup:\{[^}]*toneless:true\}/);assert.match(v,/nom:\{[^}]*toneless:true\}/);
  assert.match(v,/const voices=c\.toneless\?\[\]:/,'a hop is a breath of air and a bite a crunch');
});

test('a push line drawn row by row in Rounds is one rope the cat can climb, styled like the stations line',()=>{
  const el=c=>({classList:{contains:k=>k===c}});
  const a=el('jl-rg-thru'),b=el('jl-rg-thru'),c=el('jl-rg-thru'),other=el('jl-tl-push'),far=el('jl-rg-thru');
  const ropes=joinRopes([{el:b,x:100.5,top:40,bot:80},{el:a,x:100,top:0,bot:40},{el:c,x:100,top:82,bot:120},{el:other,x:100,top:130,bot:140},{el:far,x:300,top:0,bot:30}]);
  const thru=ropes.find(r=>r.el===a);
  assert.deepEqual([thru.top,thru.bot],[0,120],'stacked pieces join into one rope from its top');
  assert.deepEqual(a.__rope,[a,b,c],'every piece swings with it');
  assert.ok(ropes.some(r=>r.el===other)&&ropes.some(r=>r.el===far),'other lines stay their own');
  const ci=el('jl-tl-link'),img=el('jl-tl-link'),e2e=el('jl-tl-link'),thru2=el('jl-rg-thru');
  const fork=joinRopes([{el:img,x:200,top:159,bot:176},{el:ci,x:200,top:43,bot:176},{el:e2e,x:200,top:176,bot:320},{el:thru2,x:200,top:330,bot:400}]);
  assert.deepEqual(fork.map(r=>[r.top,r.bot]),[[43,320],[330,400]],'a station\'s fork, up to each bar and down to each bar, is one rope; a Rounds line is not joined to it');
  assert.deepEqual(ci.__rope,[ci,img,e2e]);
  const js=readFileSync(new URL('../src/whiskers/cat.js',import.meta.url),'utf8');
  assert.match(js,/const ROPES='[^']*\.jl-rg-thru'/);
});

test('its caption and bubble grow in over its head, never flying in from the corner of the page',()=>{
  const js=readFileSync(new URL('../src/whiskers/cat.js',import.meta.url),'utf8'),css=readFileSync(new URL('../themes/whiskers.css',import.meta.url),'utf8');
  assert.match(css,/@keyframes ct-pop\{from\{opacity:0;transform:var\(--t,none\) scale\(\.7\)\}\}/);
  assert.match(css,/\.tl-cat-say,\.tl-cat-cap\{transform:var\(--t,none\)\}/,'the pop starts from where it is placed');
  assert.doesNotMatch(js,/(cap|bubble)\.style\.transform/);
  assert.match(js,/function caption\([^)]*\)\{[^\n]*placeTalk\(\);\}/,'placed the moment it shows');
  assert.match(js,/function say\([^)]*\)\{[^\n]*placeTalk\(\);\}/);
});

test('a double-clicked station sends the ticket off and the cat rides it',()=>{
  const js=readFileSync(new URL('../src/whiskers/cat.js',import.meta.url),'utf8');
  assert.match(js,/perch:'ticket',ride:tk/,'the ticket over the orb is a perch');
  assert.match(js,/if\(s\.surf\?\.li\|\|s\.surf\?\.chip\|\|s\.surf\?\.perch==='pick'\|\|s\.surf\?\.ride\|\|s\.surf\?\.rides\)/,'the ticket carries it as it moves');
  assert.match(js,/flyStep\(b,dt,s\.ride\?all\.filter\(p=>p\.perch==='ticket'\)/,'mid-leap it lands only on the ticket');
  assert.match(js,/t-s\.ride\.moved>RIDE_REST/,'it gets off once the ticket has stopped');
});

test('the cat stays put when the card under it is laid out again rather than shoved',()=>{
  const js=readFileSync(new URL('../src/whiskers/cat.js',import.meta.url),'utf8');
  assert.match(js,/if\(!s\.surf\.rides&&\(Math\.abs\(dx\)>RELAID\|\|Math\.abs\(dy\)>CAT_H\)\)\{s\.surf=null;\}else\{b\.x\+=dx;/);
});
