import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {STEP} from '../src/whiskers/cat-physics.js';
import {TOYS,TOY_SVG,YARN,YARN_COLORS,toyOn,toyStep,batToy,threadPath} from '../src/whiskers/cat-physics.js';

const card=(l,y,key)=>({l,r:l+264,y,key});
const walls={left:0,right:1400,bottom:900};
const run=(t,plats,secs)=>{let out;for(let i=0;i<secs/STEP;i++){out=toyStep(t,plats,STEP,walls);if(out==='lost')return out;}return out;};

test('every toy has a drawing',()=>{
  assert.deepEqual(TOYS.map(t=>t.kind),['yarn','mouse','bell']);
  for(const t of TOYS)assert.match(TOY_SVG[t.kind],/^<svg /);
});

test('a toy at rest stays on its card',()=>{
  const p=card(100,300,'a'),t=toyOn(TOYS[0],p);
  run(t,[p],2);
  assert.equal(t.on,'a');assert.equal(t.y,300);assert.equal(t.x,232);
});

test('a batted toy flies, rolls to a stop, and the yarn turns as it rolls',()=>{
  const p=card(100,300,'a'),t=toyOn(TOYS[0],p,.2);
  batToy(t,1,.5);assert.equal(t.on,null);assert.ok(t.vx>0&&t.vy<0);
  const x0=t.x;run(t,[p],4);
  assert.ok(t.x>x0,'it went the way it was batted');
  assert.equal(Math.abs(t.vx)<1,true,'and stopped');
  assert.notEqual(t.rot,0);
});

test('off the end of a card it falls onto the row below',()=>{
  const top=card(100,300,'top'),below=card(380,528,'below'),t={...toyOn(TOYS[2],top),x:top.r+2,vx:60};
  t.on=null;run(t,[top,below],3);
  assert.equal(t.on,'below');assert.equal(t.y,528);
});

test('the mouse slides without rolling',()=>{
  const p=card(100,300,'a'),t=toyOn(TOYS[1],p,.3);t.vx=200;
  run(t,[p],1);
  assert.equal(t.rot,0);assert.ok(t.x>p.l+264*.3);
});

test('with nothing under it a toy is lost past the bottom',()=>{
  const t={...toyOn(TOYS[0],card(0,300,'gone')),on:null};
  assert.equal(run(t,[],5),'lost');
});

test('the walls bounce it back',()=>{
  const p={l:0,r:1400,y:300,key:'wide'},t={...toyOn(TOYS[2],p),x:1380,y:200,vx:400,vy:0,on:null};
  run(t,[p],.5);
  assert.ok(t.x<=1400-TOYS[2].w/2);assert.ok(t.vx<=0);
});

test('batted, the yarn unwinds: its thread follows it and the ball gets smaller',()=>{
  const top=card(100,300,'top'),below=card(380,528,'below'),t=toyOn(TOYS[0],top,.8);
  run(t,[top,below],1);assert.equal(t.thread.length,0,'wound up until it is batted');
  batToy(t,1,1);run(t,[top,below],3);
  assert.ok(t.thread.length>10);assert.ok(t.w<TOYS[0].w&&t.w>=YARN.small);
  assert.ok(t.thread.some(p=>p.y<310)&&t.thread.some(p=>p.y>500),'strewn from one row down to the next');
  assert.match(threadPath(t.thread),/^M[\d.]+ [\d.]+Q/);
});

test('every swat visibly unwinds it, down to the bare core and no further',()=>{
  const floor={l:0,r:1400,y:600,key:'floor'},t=toyOn(TOYS[0],floor,.05),sizes=[t.w];
  for(let i=0;i<200&&t.left>0;i++){batToy(t,t.x<700?1:-1,1);run(t,[floor],3);sizes.push(t.w);}
  assert.ok(sizes[1]<TOYS[0].w,'the first swat already shows');
  assert.ok(sizes.length>25,`it takes many hits to strip it, not ${sizes.length-1}`);
  for(let i=1;i<sizes.length;i++)assert.ok(sizes[i]<=sizes[i-1]);
  assert.equal(t.w,YARN.small);assert.equal(t.left,0);
  const n=t.thread.length;batToy(t,1,1);run(t,[floor],3);assert.equal(t.thread.length,n,'no cord left to pay out');
});

test('as it unwinds the outer bundles peel off and the tail goes with the cord',()=>{
  assert.match(TOY_SVG.yarn,/class="knot-caps"/);assert.match(TOY_SVG.yarn,/class="knot-sides"/);assert.match(TOY_SVG.yarn,/class="knot-tail"/);
  const css=readFileSync(new URL('../themes/whiskers.css',import.meta.url),'utf8');
  assert.match(css,/\.tl-cat-toy\.loose \.knot-tail/);assert.match(css,/data-peel="1"\] \.knot-caps/);assert.match(css,/data-peel="2"\] :is\(\.knot-caps,\.knot-sides\)/);
  const src=readFileSync(new URL('../src/whiskers/cat.js',import.meta.url),'utf8');
  assert.match(src,/dataset\.peel=t\.left<1\/3\?'2':t\.left<2\/3\?'1':'0'/);
  assert.match(src,/\[\.\.\.t\.thread,t\.cordTip\|\|cordTip\(t\)\]/,'the cord runs on into the ball');
});

test('the mouse and bell leave no thread',()=>{
  const p=card(100,300,'a');for(const spec of TOYS.slice(1)){const t=toyOn(spec,p);batToy(t,1);run(t,[p],2);assert.equal(t.thread,null);}
});

test('resting toys stay dead still: no creep and no spin',()=>{
  const p=card(100,300,'a');
  for(const spec of TOYS){const t=toyOn(spec,p);run(t,[p],5);assert.equal(t.vx,0);assert.equal(t.spin,0);assert.equal(t.rot,0);assert.equal(t.x,232);}
});

test('a ball on a card rolls without slipping, then stops dead, speed and spin both',()=>{
  const p={l:0,r:1400,y:300,key:'long'},t=toyOn(TOYS[0],p,.1);t.vx=300;
  run(t,[p],.25);
  assert.ok(Math.abs(t.vx-t.spin*t.w/2)<3,'its spin matches its speed');
  assert.ok(t.vx<300,'friction took a share of the speed into the spin');
  run(t,[p],5);assert.equal(t.vx,0);assert.equal(t.spin,0);
  const rot=t.rot;run(t,[p],2);assert.equal(t.rot,rot,'and it does not turn once stopped');
});

test('in the air a ball keeps its spin, fading a little, and a landing turns spin into speed',()=>{
  const t={...toyOn(TOYS[0],card(0,300,'a')),on:null,y:100,vx:0,vy:0,spin:20};
  for(let i=0;i<Math.round(.1/STEP);i++)toyStep(t,[],STEP,walls);
  assert.ok(t.spin<20&&t.spin>18,'spin held in the air');
  const p=card(0,300,'floor');t.x=130;run(t,[p],1);
  assert.ok(t.vx>0,'landing spinning forward sets it rolling forward');
});

test('a toy rides along with a card shoved under it',()=>{
  const p=card(100,300,'a'),t=toyOn(TOYS[0],p);toyStep(t,[p],STEP,walls);
  const shoved={...p,l:p.l+30,r:p.r+30};toyStep(t,[shoved],STEP,walls);
  assert.equal(t.x,262);assert.equal(t.spin,0);
});

test('the bell ball is heavier: the same bat sends it slower than the yarn',()=>{
  let seed=.5;const rnd=Math.random;Math.random=()=>seed;
  try{const p=card(0,300,'a'),y=toyOn(TOYS[0],p),bell=toyOn(TOYS[2],p);batToy(y,1);batToy(bell,1);assert.ok(Math.abs(bell.vx)<Math.abs(y.vx));}
  finally{Math.random=rnd;}
});

test('the yarn is a multicolour rope-knot ball: twisted cord in crossing bundles that turn as it rolls, with a tail and a pompom',()=>{
  assert.match(TOY_SVG.yarn,/<g class="toy-knot"><g clip-path="url\(#tl-yarn-clip\)"/);
  const cords=[...TOY_SVG.yarn.matchAll(/class="cord" d="[^"]+" stroke="(#[0-9a-f]{6})"/g)].map(m=>m[1]);
  assert.equal(cords.length,13,'twelve cords in the three bundles, and the tail');
  assert.ok(new Set(cords).size>=6,'in many colours');
  assert.ok(YARN_COLORS.length>=6);
  assert.match(TOY_SVG.yarn,/<circle cx="80" cy="62" r="7" fill="#ff2f8a"\/>/,'the pompom');
});

test('no toy turns on its own: its rolling layer uses no class the page animates',()=>{
  const css=readFileSync(new URL('../themes/whiskers.css',import.meta.url),'utf8');
  const animated=new Set([...css.matchAll(/(?:^|[}\s,])\.([\w-]+)\{[^}]*\banimation:/gm)].map(m=>m[1]));
  for(const [kind,svg] of Object.entries(TOY_SVG))for(const [,cls] of svg.matchAll(/class="([^"]+)"/g))for(const c of cls.split(/\s+/))
    assert.ok(!animated.has(c),`${kind} uses .${c}, which the page animates`);
});

test('the bell rings',()=>{
  const js=readFileSync(new URL('../src/whiskers/cat.js',import.meta.url),'utf8');
  assert.match(js,/function jingle\(t,gain\)\{if\(t\.kind!=='bell'\)return;if\(music\?\.ring\)music\.ring\('bell',\{gain\}\);else if\(music\?\.on\)speech\.bell\(\{gain\}\);\}/,'the page music rings it, or the cat voice when the page has no bell');
  assert.match(js,/if\(step==='land'&&fall>260\)jingle\(t,Math\.min\(1,fall\/900\)\)/,'a hard landing rings it');
});

test('the toys are styled',()=>{
  const css=readFileSync(new URL('../themes/whiskers.css',import.meta.url),'utf8');
  assert.match(css,/\.tl-cat-toy\{position:fixed;/);
});

import {cordStep,CORD} from '../src/whiskers/cat-physics.js';
const settle=(t,plats,secs)=>{for(let i=0;i<secs/STEP;i++){toyStep(t,plats,STEP,walls);cordStep(t,plats,STEP,walls);}};
const laidAt=(pts)=>pts.map(([x,y])=>({x,y,px:x,py:y,len:8}));
const lay=(t,pts)=>{t.thread=laidAt(pts);t.laid={x:t.x,y:t.y-CORD.lift};};

test('the cord never hangs in the air: thrown in an arc, it falls and lies on what is under it',()=>{
  const floor={l:0,r:1400,y:600,key:'floor'},t={...toyOn(TOYS[0],floor,.5),loose:true};
  lay(t,Array.from({length:60},(_,i)=>[t.x-472+i*8,600-CORD.lift-Math.sin(i/59*Math.PI)*200]));
  settle(t,[floor],4);const n=t.thread.length;settle(t,[floor],2);
  assert.equal(t.thread.length,n,'a ball at rest pays out no more cord');
  // Only the last few points, where the cord leaves the side of the ball, sit up off the floor.
  for(const q of t.thread.filter(q=>Math.abs(q.x-t.x)>3*YARN.step))assert.ok(Math.abs(q.y-(600-CORD.lift))<1.5,`a point at ${q.x.toFixed(0)},${q.y.toFixed(0)} is off the floor`);
  assert.equal(t.cordAwake,false,'and once it lies still it sleeps');
});

test('across a gap between two cards it sags; over an edge it hangs, held by what lies on the card',()=>{
  const a={l:100,r:364,y:300,key:'a'},b={l:400,r:664,y:300,key:'b'},t={...toyOn(TOYS[0],b,.5),loose:true};
  lay(t,Array.from({length:40},(_,i)=>[250+i*8,300-CORD.lift]));
  settle(t,[a,b],4);
  const gap=t.thread.filter(q=>q.x>366&&q.x<398);
  assert.ok(gap.length&&gap.every(q=>q.y>300-CORD.lift),'the stretch over the gap dips below the card tops');
  assert.ok(t.thread.filter(q=>q.x<364).every(q=>q.on==='a'),'the end on the first card stays on it');
});

test('cord lying on a card rides along when the card is shoved',()=>{
  const a={l:100,r:364,y:300,key:'a'},t={...toyOn(TOYS[0],a,.9),loose:true};
  lay(t,Array.from({length:10},(_,i)=>[t.x-80+i*8,300-CORD.lift]));
  settle(t,[a],1);const x0=t.thread[0].x;
  a.l+=30;a.r+=30;settle(t,[a],.2);
  assert.ok(Math.abs(t.thread[0].x-(x0+30))<1);
});

import {pawCord,cordStrain} from '../src/whiskers/cat-physics.js';
test('a cat walking through the cord drags the strands it treads on and kicks them up',()=>{
  const floor={l:0,r:1400,y:600,key:'floor'},t={...toyOn(TOYS[0],floor,.8),loose:true};
  lay(t,Array.from({length:40},(_,i)=>[t.x-312+i*8,600-CORD.lift]));settle(t,[floor],1);
  const before=t.thread.map(q=>q.x),at=t.thread[10].x;
  assert.equal(pawCord(t,{x:at,y:598,w:56,h:10,vx:300},1/60)>=0,true);
  assert.ok(t.thread.some((q,i)=>q.x>before[i]+1&&!q.on),'trodden strands move with the paw and come off the floor');
  assert.equal(pawCord(t,{x:at,y:598,w:56,h:10,vx:0},1/60)>=0,true,'standing on it finds it');
  settle(t,[floor],3);
  assert.ok(t.thread.filter(q=>Math.abs(q.x-t.x)>3*YARN.step).every(q=>Math.abs(q.y-598)<1.5),'and it falls back onto the floor');
  assert.equal(pawCord(t,{x:-500,y:598,w:56,h:10,vx:300},1/60),-1,'a paw elsewhere finds none');
});

test('a swat flicks the strands under the paw up into the air',()=>{
  const floor={l:0,r:1400,y:600,key:'floor'},t={...toyOn(TOYS[0],floor,.8),loose:true};
  lay(t,Array.from({length:40},(_,i)=>[t.x-312+i*8,600-CORD.lift]));settle(t,[floor],1);
  const at=t.thread[12].x;pawCord(t,{x:at,y:598,w:30,h:16,swat:true,dir:1},1/60);
  let top=598;for(let i=0;i<20;i++){cordStep(t,[floor],STEP,walls);top=Math.min(top,...t.thread.map(q=>q.y));}
  assert.ok(top<590,'up it goes');
});

test('a strand caught on the cat goes where the cat goes, and pulled taut the cord tows on the ball',()=>{
  const floor={l:0,r:1400,y:600,key:'floor'},t={...toyOn(TOYS[0],floor,.8),loose:true};
  lay(t,Array.from({length:20},(_,i)=>[t.x-152+i*8,600-CORD.lift]));settle(t,[floor],1);
  assert.equal(cordStrain(t,0),0,'lying loose it has slack');
  const hold={i:0,x:t.thread[0].x-120,y:593};
  for(let i=0;i<60;i++)cordStep(t,[floor],STEP,{...walls,hold});
  assert.ok(Math.abs(t.thread[0].x-hold.x)<.01&&Math.abs(t.thread[0].y-593)<.01);
  assert.ok(cordStrain(t,0)>0,'the cord is pulled past its length');

});

test('a hit that does not catch the end just rolls a wound ball; once the end is free, every roll lays cord, never towing it back',()=>{
  const floor={l:0,r:1400,y:600,key:'floor'},t=toyOn(TOYS[0],floor,.3);
  batToy(t,1,1,false);run(t,[floor],3);
  assert.equal(t.thread.length,0);assert.equal(t.loose,false);assert.equal(t.w,TOYS[0].w);
  batToy(t,1,1,true);run(t,[floor],3);const n=t.thread.length;assert.ok(n>5&&t.loose);
  batToy(t,-1,1,false);run(t,[floor],3);assert.ok(t.thread.length>n,'a later hit lays more cord as it rolls');
});

test('the cat plays with every toy, its hits only sometimes unwinding the yarn, and the toys turn up somewhere new',()=>{
  const js=readFileSync(new URL('../src/whiskers/cat.js',import.meta.url),'utf8');
  assert.match(js,/const TOY_PAYS=\{swat:\.3,bump:\.15\}/);
  assert.match(js,/rand\(\.35,\.7\),Math\.random\(\)<TOY_PAYS\.swat\)/);assert.match(js,/Math\.random\(\)<TOY_PAYS\.bump\)/);
  assert.match(js,/const weight=x=>x\.playedAt\?1\+Math\.min\(4,\(now\(\)-x\.playedAt\)\/15000\):5;/);
  assert.match(js,/toyOn\(spec,p,rand\(\.15,\.85\)\)/);assert.doesNotMatch(js,/\.3\+i\*\.2/);
});

test('off the last row a toy lands on the ground under the cards and stays, never on the cat’s own fallback floor',()=>{
  const last=card(100,900,'last'),ground={l:0,r:1400,y:1120,key:'home:ground'},t={...toyOn(TOYS[1],last),x:last.r+4,vx:80,on:null};
  let out;for(let i=0;i<4/STEP;i++)out=toyStep(t,[last,ground],STEP,{left:0,right:1400,bottom:1300});assert.notEqual(out,'lost');assert.equal(t.on,'home:ground');assert.equal(t.y,1120);
  const js=readFileSync(new URL('../src/whiskers/cat.js',import.meta.url),'utf8');
  assert.match(js,/const solid=sc\.rest\|\|all\.filter\(p=>!p\.floor\)/);assert.match(js,/toyStep\(t,mine,dt,walls\)/);assert.match(js,/cordStep\(t,\[\.\.\.mine,drop\('home:cord',t\.cordY\)\]/);
  assert.doesNotMatch(js,/y:p\.y-320/,'a toy is never dropped back in from above');
});

test('cord off the yarn never goes back on, and a click sends a toy away from the side it was hit on',()=>{
  const top=card(100,300,'top'),below=card(380,528,'below'),t=toyOn(TOYS[0],top,.5);
  let left=1,points=0;
  for(const dir of [1,-1,1,-1,-1,1]){batToy(t,dir,1);for(let i=0;i<1/STEP;i++){toyStep(t,[top,below],STEP,{left:0,right:1400,bottom:1300});
    assert.ok(t.left<=left+1e-9,'the ball never grows back');assert.ok(t.thread.length>=points,'and the cord never shrinks');left=t.left;points=t.thread.length;}}
  assert.ok(left<1);
  const js=readFileSync(new URL('../src/whiskers/cat.js',import.meta.url),'utf8');
  assert.doesNotMatch(js,/rewind|wind up|wound up/i);
  assert.match(js,/batToy\(k,ev\.clientX<r\.left\+r\.width\/2\?1:-1,1\.6\)/,'hit on its left, it goes right');
  assert.doesNotMatch(js,/batToy\(k,Math\.random\(\)/);
});

test('a toy rides a shoved card, but stays where it was when the page lays the cards out again',()=>{
  const t=toyOn(TOYS[1],card(100,300,'c'),.5),x=t.x;
  toyStep(t,[card(130,300,'c')],STEP,walls);
  assert.equal(Math.round(t.x-x),30,'a shove carries it along');
  const at=t.x;toyStep(t,[card(700,300,'c')],STEP,walls);
  assert.ok(Math.abs(t.x-at)<5,'a relayout does not carry it across the page');
  assert.equal(t.on,null,'it falls from where it was');
});

test('cord laid by a fast ball stays as long as the ground it covered once the ball has stopped',()=>{
  const floor={l:0,r:1400,y:300,key:'f'},t=toyOn(TOYS[0],floor,.05),from=t.x,len=pts=>pts.reduce((n,q,i)=>i?n+Math.hypot(q.x-pts[i-1].x,q.y-pts[i-1].y):0,0);
  batToy(t,1,1.6,true);
  for(let i=0;i<240;i++){toyStep(t,[floor],STEP,walls);cordStep(t,[floor],STEP,walls);}
  const laid=t.x-from;assert.ok(laid>300,`it rolled ${laid}px`);
  for(let i=0;i<600;i++){toyStep(t,[floor],STEP,walls);cordStep(t,[floor],STEP,walls);}
  assert.ok(len(t.thread)>laid*.85,`cord ${Math.round(len(t.thread))}px of ${Math.round(laid)}px laid`);
  assert.ok(t.thread.every((q,i)=>!i||Math.hypot(q.x-t.thread[i-1].x,q.y-t.thread[i-1].y)<=YARN.step+1),'no link longer than a step');
});

test('cord lying on a card is not dragged off it by the part hanging over its edge',()=>{
  const a={l:0,r:500,y:300,key:'a'},t=toyOn(TOYS[0],a,.1);
  t.thread=[];for(let x=580;x>=t.x+10;x-=YARN.step){const on=x<=a.r?'a':null;t.thread.push({x,y:298,px:x,py:298,len:YARN.step,on,onL:on?a.l:undefined});}
  t.loose=true;t.cordAwake=true;const mid=t.thread.findIndex(q=>q.x<=300),at=t.thread[mid].x;
  for(let i=0;i<1800;i++)cordStep(t,[a],STEP,walls);
  assert.ok(Math.abs(t.thread[mid].x-at)<6,`cord on the card crept ${Math.round(t.thread[mid].x-at)}px`);
});

test('the toys start on the first row of cards when the host scene asks for it',()=>{
  const js=readFileSync(new URL('../src/whiskers/cat.js',import.meta.url),'utf8');
  assert.match(js,/function scatterToys\(cards\)\{if\(sc\.firstRow\)\{const top=Math\.min\(\.\.\.cards\.map\(p=>p\.home\?\?p\.y\)\),pool=cards\.filter\(p=>\(p\.home\?\?p\.y\)<top\+8\);/,'a host scene can ask for them on its first row');
});
