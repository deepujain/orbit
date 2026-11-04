// The timeline cat's physics: one body under gravity on one-way platforms (the timeline's bars) above a floor. 1 m is
// 168 px and gravity is 9.8 m/s² in those units, so the cat is a big kitten about 30 cm tall. A real cat
// clears four to five times its height from a crouch, but it picks easy hops; the planner keeps every hop under three
// body heights up and reaches higher bars by climbing through lower ones, the way a cat climbs shelves.

export const CAT_W=70,CAT_H=52.5,PX_PER_M=168,G=9.8*PX_PER_M;
export const MAX_UP=CAT_H*3,MAX_GAP=170,MAX_VX=460,MAX_THROW=1500;
export const WALK=62,TROT=120,RUN=230,ACCEL=700,BRAKE=1300,FRICTION=1900,AIR_DRAG=.08;
export const STEP=1/120;

// The launch for a hop from one point to another: an arc whose top clears the higher end by a little more for a longer
// hop, as a cat's does. Null when it is too high or too far to be a hop a cat would take.
export function launch(from,to,{g=G,maxUp=MAX_UP,maxVx=MAX_VX}={}){
 const rise=from.y-to.y,dx=to.x-from.x;
 if(rise>maxUp)return null;
 const apex=Math.max(rise,0)+8+Math.min(36,Math.abs(dx)*.14),vy=-Math.sqrt(2*g*apex),t=-vy/g+Math.sqrt(2*(apex-rise)/g),vx=dx/t;
 return Math.abs(vx)>maxVx?null:{vx,vy,t,apex};
}
// How long the crouch before a hop lasts: longer for a higher or longer one, as the cat gauges it.
export const crouchFor=(from,to)=>Math.round(140+Math.max(0,from.y-to.y)*2.2+Math.abs(to.x-from.x)*.6);

// What the cat can stand on: the floor and every bar, as {l,r,y}. Surfaces are matched between frames by position.
// A surface that can move under the cat (a station it shoves) brings its own key.
export function surfaces(plats,floor,left,right){return [{l:left,r:right,y:floor,floor:true,key:'floor'},...plats.map(p=>({...p,key:p.key??`${Math.round(p.l)}:${Math.round(p.y)}`}))];}
export const gapBetween=(a,b)=>Math.max(0,b.l-a.r,a.l-b.r);
// One hop from a to b: close enough sideways, not too high, and not a step along the same level.
// Up to the stations above the timeline it takes a bigger leap, four body heights, as a cat does for a high shelf.
export const BIG_UP=CAT_H*4,PICK_UP=CAT_H*5.4;
// Off a floor far below the boxes, as the bottom of a tall window, it takes a big leap up to them.
export const LEAP_UP=CAT_H*10;
export const upFrom=(a,b)=>a?.leap?LEAP_UP:a?.perch==='pick'?PICK_UP:b?.perch?BIG_UP:MAX_UP;
// Not down onto a bar that lies under its own with no end to step off past: it would only land back where it stood.
// Off a perch (the timeline's key, a station) it drops down between the pills, and the PR chips below the timeline
// are the other exception: it drops through the timeline to them (see the hop's through), and
// leaps back up from them into the timeline, a little higher than it does to the stations.
export const covered=(a,b)=>!a.floor&&b.y>a.y+6&&b.r-a.r<24&&a.l-b.l<24&&b.l<a.r&&b.r>a.l;
export function canHop(a,b){if(a===b)return false;const rise=a.y-b.y,gap=gapBetween(a,b);return rise<=upFrom(a,b)-6&&gap<=MAX_GAP&&!(Math.abs(rise)<6&&gap<8)&&((b.perch==='pick'&&a.perch!=='pick')||(a.perch&&a.perch!=='pick')||b.inner||!covered(a,b));}
// The fewest hops from one surface to another, as the list of surfaces after the start; null when it cannot get there.
export function route(all,from,to){
 if(from===to)return [];
 const prev=new Map([[from,null]]),queue=[from];
 while(queue.length){const a=queue.shift();for(const b of all){if(prev.has(b)||!canHop(a,b))continue;prev.set(b,a);if(b===to){const path=[];for(let n=b;n!==from;n=prev.get(n))path.unshift(n);return path;}queue.push(b);}}
 return null;
}
// Where it takes off on a and lands on b. Over or under b it hops straight up or down; beside it, it goes from the near
// edge to just inside b's near end.
export function hopPoints(a,b,x){
 const lo=Math.max(a.l,b.l)+10,hi=Math.min(a.r,b.r)-10,inB=v=>Math.max(b.l+12,Math.min(b.r-12,v));
 // Down onto a lower surface it overlaps, it steps off whichever end of its own has the lower one beyond it, nearer first;
 // jumping in the middle would only land it back where it stood.
 if(lo<=hi&&b.y>a.y+6){const R=b.r-a.r>=24,L=a.l-b.l>=24;if(R||L){const right=R&&(!L||a.r-x<=x-a.l);return right?{from:a.r-8,to:inB(a.r+22)}:{from:a.l+8,to:inB(a.l-22)};}}
 if(lo<=hi){const from=Math.max(lo,Math.min(hi,x));return {from,to:inB(from+(b.l+b.r>2*from?14:-14))};}
 return b.l>=a.r?{from:a.r-8,to:inB(b.l+18)}:{from:a.l+8,to:inB(b.r-18)};
}
/* The ends of a walkway [l,r] at height y it can go over, clear of the view's edges (where a bar runs on out of sight).
   Hanging from an end, its paws are on the bar and its feet HANG below it; letting go it drops with a push outward, so
   hang lists the ends with a lower bar that drop reaches, as {side,x,to,vx}. slip lists the ends with no bar straight
   below, where a slip drops it out of the timeline. */
export const HANG=CAT_H-8,HANG_VX=240;
export function edgeSpots(w,y,all,{left=-Infinity,right=Infinity,g=G}={}){
 const hang=[],slip=[];
 for(const side of [-1,1]){const x=side<0?w.l-10:w.r+10;if(x<left||x>right)continue;
  const below=(half)=>all.filter(p=>!p.floor&&p.y>y+4&&p.l<x+half&&p.r>x-half).sort((a,b)=>a.y-b.y)[0];
  if(!below(CAT_W/2))slip.push({side,x});
  // A bar close under the end shortens the dangle: its feet stay just above that bar.
  const col=below(CAT_W/3),depth=Math.min(HANG,col?col.y-y-2:HANG);if(depth<14)continue;
  const drops=all.filter(p=>!p.floor&&p.y>=y+depth+2&&p.y-y<CAT_H*6).map(p=>{const to=Math.max(p.l+12,Math.min(p.r-12,x)),t=Math.max(.04,Math.sqrt(2*(p.y-y-depth)/g));return {p,vx:(to-x)/t};})
   .filter(d=>Math.abs(d.vx)<=HANG_VX&&(Math.abs(d.vx)<1||Math.sign(d.vx)===side)).sort((a,b)=>a.p.y-b.p.y);
  if(drops[0])hang.push({side,x,depth,to:drops[0].p,vx:drops[0].vx});}
 return {hang,slip};
}
export const standingOn=(all,x,y,tol=5)=>all.find(p=>x>=p.l-2&&x<=p.r+2&&Math.abs(p.y-y)<=tol)||null;
// The first surface whose top a fall from y0 to y1 passes through at x.
export function landingOn(all,x,y0,y1){return all.filter(p=>x>=p.l&&x<=p.r&&p.y>=y0-.5&&p.y<=y1).sort((a,b)=>a.y-b.y)[0]||null;}
// The bars it can stand on, in the timeline box's coordinates: wide enough for a cat and inside the scrolled view.
export function platformsIn(bars,view,box){
 return bars.filter(b=>b.width>=28&&b.right>view.left+10&&b.left<view.right-10&&b.top>view.top&&b.top<view.bottom-8)
  .map(b=>({l:Math.max(b.left,view.left)-box.left,r:Math.min(b.right,view.right)-box.left,y:b.top-box.top,open:Boolean(b.open),...(b.info&&{info:b.info}),...(b.el&&{el:b.el,key:b.key})}));
}

// The edges between the timeline's rows are shelves: rows side by side at one height make one shelf, and a shelf a bar
// already sits on is left to the bar.
export function shelves(rows,view,box,bars=[]){
 const out=[];
 for(const p of platformsIn(rows,view,box).sort((a,b)=>a.y-b.y||a.l-b.l)){const last=out.at(-1);
  if(last&&Math.abs(last.y-p.y)<=1.5&&p.l<=last.r+2)last.r=Math.max(last.r,p.r);else out.push({...p,open:false,shelf:true});}
 return out.filter(sh=>!bars.some(b=>Math.abs(b.y-sh.y)<=3&&b.l<=sh.l+4&&b.r>=sh.r-4));
}
// Walking: speed up toward the pace, and brake in time to stop on the spot rather than overshoot it.
export function walkStep(x,v,target,pace,dt){
 const d=target-x,dir=Math.sign(d)||1,want=dir*Math.min(pace,Math.sqrt(2*BRAKE*Math.abs(d)));
 const a=Math.sign(want-v)*(Math.sign(want)===Math.sign(v)&&Math.abs(want)<Math.abs(v)?BRAKE:ACCEL);
 let nv=v+a*dt;if((a>0&&nv>want)||(a<0&&nv<want))nv=want;
 const nx=x+nv*dt;return Math.abs(target-nx)<.6&&Math.abs(nv)<12?{x:target,v:0,done:true}:{x:nx,v:nv,done:false};
}
export function frictionStep(v,dt){const dv=FRICTION*dt;return Math.abs(v)<=dv?0:v-Math.sign(v)*dv;}

// Flight: gravity and a little air drag; walls bounce it back softly; a one-way platform or the floor catches it
// only when it comes down through the top.
export function flyStep(b,dt,all,left,right){
 const y0=b.y;b.vy+=G*dt;b.vx*=1-AIR_DRAG*dt;b.x+=b.vx*dt;b.y+=b.vy*dt;
 if(b.x<left){b.x=left;b.vx=Math.abs(b.vx)*.35;}else if(b.x>right){b.x=right;b.vx=-Math.abs(b.vx)*.35;}
 if(b.vy<=0)return null;
 const hit=landingOn(all,b.x,y0,b.y);if(hit){b.y=hit.y;}
 return hit;
}
// Carried by the scruff: a damped spring from the pointer to a point just behind the head, under gravity, so it swings
// and settles like a held cat.
export function carryStep(b,dt,p,{k=170,c=13}={}){
 const sx=b.x+6,sy=b.y-CAT_H+6;
 b.vx+=(k*(p.x-sx)-c*b.vx)*dt;b.vy+=(k*(p.y-sy)-c*b.vy+G*.35)*dt;
 b.x+=b.vx*dt;b.y+=b.vy*dt;
}
/* A loose chip: knocked along it slides and comes slowly back home on a soft spring, while up and down it is stiff and
   bouncy, sagging a little under the cat. bump keeps two chips in a row from passing through each other: they trade
   speeds, losing some of the knock, so a shoved chip pushes its neighbours on down the row. */
export const CHIP={kx:14,cx:8,ky:300,cy:34,sub:1/240,most:300,reach:40,lift:5,sag:1.5,shove:240,gap:1,give:.55};
export function chipSpring(c,dt,sag=0){
  for(let left=dt;left>1e-6;left-=CHIP.sub){const h=Math.min(CHIP.sub,left);c.vx+=(-CHIP.kx*c.x-CHIP.cx*c.vx)*h;c.x+=c.vx*h;c.vy+=(-CHIP.ky*(c.y-sag)-CHIP.cy*c.vy)*h;c.y+=c.vy*h;}
  c.x=Math.max(-CHIP.reach,Math.min(CHIP.reach,c.x));c.y=Math.max(-CHIP.lift,Math.min(CHIP.lift,c.y));return c;}
export const chipAtRest=(c,sag=0)=>Math.abs(c.x)<.2&&Math.abs(c.vx)<2&&Math.abs(c.y-sag)<.2&&Math.abs(c.vy)<2;
export function bump(a,b){const over=a.r+a.c.x+CHIP.gap-(b.l+b.c.x);if(over<=0)return false;a.c.x-=over/2;b.c.x+=over/2;
  if(a.c.vx>b.c.vx){const m=(a.c.vx+b.c.vx)/2,d=(a.c.vx-b.c.vx)/2*CHIP.give;a.c.vx=m-d;b.c.vx=m+d;}return true;}
export const capSpeed=(b,max=MAX_THROW)=>{const s=Math.hypot(b.vx,b.vy);if(s>max){b.vx*=max/s;b.vy*=max/s;}return b;};
// A shake is the pointer reversing hard several times within a second.
export function shakeMeter({speed=600,within=1000}={}){
 let dir=0,flips=[];
 return (vx,t)=>{const d=Math.sign(vx);if(Math.abs(vx)>speed&&d!==dir){if(dir)flips.push(t);dir=d;}flips=flips.filter(f=>t-f<within);return flips.length;};
}

/* Cat toys for the Projects page: a ball of yarn, a toy mouse and a bell ball resting on the project cards. Each is one
   small body under the same gravity. The balls roll: friction where a ball touches the card pulls its spin and its speed
   together until it rolls without slipping, rolling resistance slows it, and once it is all but still it stops dead,
   speed and spin both. In the air a ball keeps the spin it had, fading a little, and a landing or a wall turns spin into
   speed and back as friction does. The mouse slides. A toy rides along with a card that is shoved under it, falls off
   a card's end onto the row below, and comes back from the top when it is lost off the page. Once batted, the yarn
   unwinds: it leaves its cord behind wherever it rolls and flies. The bell ball is heavier, so a bat sends it slower. */
export const TOYS=[
 {kind:'yarn',label:'Ball of yarn',w:34,h:34,roll:true,bounce:.35,crr:.14,mass:1},
 {kind:'mouse',label:'Toy mouse',w:32,h:17,roll:false,bounce:.15,mu:.45,mass:.8},
 {kind:'bell',label:'Bell ball',w:20,h:20,roll:true,bounce:.5,crr:.09,mass:1.6},
];
// length: the cord wound on a full ball, in px; small: the bare core it is left as.
// bite: how much cord one hit that catches the end pulls off, at most, before the ball rolls on without paying out.
export const YARN={step:8,length:9000,small:12,bite:[120,360]};
export const ROLL={slip:18,sleep:4,airSpin:.6,impact:.6,wall:.6};
/* A rope-knot yarn ball, as cat toys are made: twisted cotton cord wound in three bundles crossing at right angles,
   one running up the front, one round the sides and one capping the top and bottom, with a tail of cord ending in a
   pompom. It is wound from many colours, each cord its own. Only the knot (.toy-knot) turns as it rolls; the light and
   the tail stay put. */
// Each colour as [edge, cord, highlight, twist].
export const YARN_COLORS=[
 ['#7d1426','#e63946','#ff9aa2','#a91f33'],['#8a3b06','#f77f00','#ffc078','#b85a0a'],['#8a6d00','#fcbf49','#fff0b3','#b8900a'],
 ['#1f5e1a','#43aa3b','#a8e6a0','#2e7d28'],['#0b4a6b','#1d8fd1','#9fd8ff','#126b9c'],['#3c1f6b','#7b4ccf','#c9b2ff','#58339c'],
 ['#7a1650','#e0479e','#ffa8d6','#a82476'],
];
// A cord along a curve from (x0,y0) to (x1,y1) bending through (cx,cy): a dark edge, the cord, a highlight down its
// middle that rounds it, and twist lines slanted across it every few units along the curve, as a twisted rope has.
const f1=n=>n.toFixed(1);
function cord([x0,y0,cx,cy,x1,y1],[edge,body,hi,tw],w=6,lay=2.6){
 const d=`M${x0} ${y0}Q${cx} ${cy} ${x1} ${y1}`,at=u=>{const v=1-u;return [v*v*x0+2*v*u*cx+u*u*x1,v*v*y0+2*v*u*cy+u*u*y1,2*v*(cx-x0)+2*u*(x1-cx),2*v*(cy-y0)+2*u*(y1-cy)];};
 const len=Math.hypot(cx-x0,cy-y0)+Math.hypot(x1-cx,y1-cy),n=Math.max(3,Math.round(len/lay));let twist='';
 for(let i=1;i<n;i++){const [x,y,dx,dy]=at(i/n),k=Math.hypot(dx,dy)||1,tx=dx/k,ty=dy/k,c=Math.cos(1.05),s=Math.sin(1.05),ax=tx*c-ty*s,ay=tx*s+ty*c,h=w*.5/s;
  twist+=`M${f1(x-ax*h)} ${f1(y-ay*h)}L${f1(x+ax*h)} ${f1(y+ay*h)}`;}
 return `<path d="${d}" stroke="${edge}" stroke-width="${w+1.6}"/><path class="cord" d="${d}" stroke="${body}" stroke-width="${w}"/><path d="${d}" stroke="${hi}" stroke-width="${w*.34}" opacity=".7"/><path d="${twist}" stroke="${tw}" stroke-width="1.1" stroke-linecap="butt" opacity=".85"/>`;}
const C=YARN_COLORS;
const SIDES=[19,26,33,40].map((y,i)=>cord([4,y,32,y+5,60,y],C[[4,5,4,5][i]])).join('');
const FRONT=[21,27.5,34,40.5].map((x,i)=>cord([x,6,+(32+(x-32)*1.5).toFixed(1),32,x,58],C[i])).join('');
const CAPS=[[17,11,32,4,47,11],[14,16,32,9,50,16],[14,48,32,55,50,48],[17,53,32,60,47,53]].map((c,i)=>cord(c,C[[6,3,3,6][i]])).join('');
const POM=Array.from({length:21},(_,i)=>{const a=i/21*Math.PI*2,c=Math.cos(a),s=Math.sin(a);return `<path d="M${(80+c*3.4).toFixed(1)} ${(62+s*3.4).toFixed(1)}L${(80+c*8.6).toFixed(1)} ${(62+s*8.6).toFixed(1)}" stroke="${C[i%C.length][2]}"/>`;}).join('');
const YARN_SVG=`<svg viewBox="0 0 64 64" aria-hidden="true"><defs>
<radialGradient id="tl-yarn-shade" cx=".38" cy=".32" r=".75"><stop offset=".35" stop-color="#120818" stop-opacity="0"/><stop offset="1" stop-color="#120818" stop-opacity=".5"/></radialGradient>
<clipPath id="tl-yarn-clip"><circle cx="32" cy="32" r="27"/></clipPath></defs>
<g class="knot-tail"><g fill="none" stroke-linecap="round">${cord([50,50,62,66,74,63],C[3],4.4,2.2)}</g>
<circle cx="80" cy="62" r="7" fill="#ff2f8a"/><g stroke-width="1.8" stroke-linecap="round">${POM}</g><circle cx="78" cy="60" r="3" fill="#fff" opacity=".35"/></g>
<circle cx="32" cy="32" r="27" fill="#3b2340"/>
<g class="toy-knot"><g clip-path="url(#tl-yarn-clip)" fill="none" stroke-linecap="round" transform="rotate(-18 32 32)"><g class="knot-sides">${SIDES}</g>${FRONT}<g class="knot-caps">${CAPS}</g></g></g>
<circle cx="32" cy="32" r="27" fill="url(#tl-yarn-shade)"/>
<ellipse cx="23" cy="19" rx="9" ry="5" fill="#fff" opacity=".16" transform="rotate(-32 23 19)"/></svg>`;
export const TOY_SVG={
 yarn:YARN_SVG,
 mouse:'<svg viewBox="0 0 30 16" aria-hidden="true"><path d="M2 13c-2-1-2-4 1-4" fill="none" stroke="#8a8f9c" stroke-width="1.4" stroke-linecap="round"/><path d="M4 14c0-6 5-10 12-10 5 0 9 3 12 9l-1 1H4z" fill="#b6bbc6"/><circle cx="17" cy="4.6" r="3.4" fill="#f4b6c2"/><circle cx="23.2" cy="9.6" r="1.1" fill="#2b2d34"/><circle cx="28.4" cy="13" r="1.2" fill="#f0567a"/></svg>',
 bell:'<svg viewBox="0 0 18 18" aria-hidden="true"><defs><radialGradient id="tl-bell-ball" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#fff3b0"/><stop offset=".45" stop-color="#f5c542"/><stop offset="1" stop-color="#a87a12"/></radialGradient></defs><circle cx="9" cy="9" r="8.4" fill="url(#tl-bell-ball)"/><g class="toy-knot"><path d="M.8 8.6h16.4" stroke="#9a6f10" stroke-width="1.1"/><path d="M9 11.2v5.4" stroke="#5c4209" stroke-width="1.2"/><circle cx="9" cy="12" r="1.7" fill="#3d2c06"/></g><circle cx="6" cy="5" r="1.8" fill="#fffbe6" opacity=".8"/></svg>',
};

// A toy at rest on a surface, along it by at.
export function toyOn(spec,p,at=.5){return {...spec,x:p.l+(p.r-p.l)*at,y:p.y,vx:0,vy:0,spin:0,rot:0,on:p.key,onL:p.l,thread:spec.kind==='yarn'?[]:null,loose:false,spent:0,left:1};}

// The yarn's cord grows behind it once it is loose, and the ball shrinks to match.
/* The yarn pays out its cord once it is loose, as much cord as the ground it covers, until none is left. What is left
   on it, left, runs from 1 down to 0, and the ball shrinks with it, its cross-section going as the cord does, down to
   the bare core. */
// Measured from where the ball was when it laid the last point, not from that point: the rope moves its points.
// A loose ball dropping off a card spools cord down after it, its end lying up above, whether or not the hit paid.
function unwind(t){if(!t.thread||!t.loose||t.left<=0||!t.paying&&!(t.thread.length&&!t.on&&t.vy>0&&t.y>(t.fromY??Infinity)+4))return;const at={x:t.x,y:t.y-CORD.lift},last=t.thread.length?t.laid:null;
 const d=last?Math.hypot(at.x-last.x,at.y-last.y):0;if(last&&d<YARN.step)return;
 if(last){t.spent=Math.min(YARN.length,(t.spent||0)+d);t.bite=(t.bite||0)-d;if(t.bite<=0)t.paying=false;}t.laid=at;
 t.thread.push({...at,px:at.x,py:at.y,len:Math.min(d,YARN.step*1.5)});t.cordAwake=true;t.left=1-(t.spent||0)/YARN.length;
 t.w=t.h=YARN.small+(TOYS[0].w-YARN.small)*Math.sqrt(t.left);}
/* Pulled tight between where it last lies on something and the ball, the cord does not hang there strung through the
   air: the ball gives, unrolling more of it, so it goes slack and comes down onto whatever is below. */
export function payOut(t){const pts=t.thread;if(!pts?.length||t.left<=0)return false;
 let i=pts.length-1;while(i>0&&!pts[i].on)i--;
 const tip=t.cordTip||cordTip(t);let len=YARN.step;for(let k=i+1;k<pts.length;k++)len+=pts[k].len||YARN.step;
 const d=Math.hypot(tip.x-pts[i].x,tip.y-pts[i].y);if(d<len*.92)return false;
 const n=Math.min(6,Math.ceil((d*1.2-len)/YARN.step));
 for(let k=0;k<n;k++)pts.push({x:tip.x,y:tip.y,px:tip.x,py:tip.y,len:YARN.step});
 t.spent=Math.min(YARN.length,(t.spent||0)+n*YARN.step);t.left=1-t.spent/YARN.length;t.laid={x:tip.x,y:tip.y};t.cordAwake=true;
 t.w=t.h=YARN.small+(TOYS[0].w-YARN.small)*Math.sqrt(t.left);return true;}
// Friction at the contact point taking a share k of the slip: for a solid ball 2/7 of it comes off the speed and 5/7
// goes into the spin, which leaves it rolling without slipping.
function grip(t,k){const r=t.w/2,slip=t.vx-t.spin*r;t.vx-=slip*2/7*k;t.spin+=slip*5/7*k/r;}

/* One step for one toy. plats are the surfaces it can rest on (their y is the top, in the same box as the toy), and
   bounds are the walls either side and the depth it is lost past. Returns 'rest', 'air', 'land' or 'lost'. */
export function toyStep(t,plats,dt,{left,right,bottom}){
 const r=t.w/2;
 if(t.on){const p=plats.find(q=>q.key===t.on);
  if(p){
   if(t.onL!=null)t.x+=p.l-t.onL;t.onL=p.l;t.y=p.y;
   if(t.roll){grip(t,Math.min(1,ROLL.slip*dt));
    const dv=Math.min(Math.abs(t.vx),t.crr*G*dt);t.vx-=Math.sign(t.vx)*dv;t.spin-=Math.sign(t.spin)*Math.min(Math.abs(t.spin),dv/r);}
   else{t.vx-=Math.sign(t.vx)*Math.min(Math.abs(t.vx),t.mu*G*dt);t.spin=0;}
   if(Math.abs(t.vx)<ROLL.sleep&&Math.abs(t.spin*r)<ROLL.sleep){t.vx=0;t.spin=0;}
   t.x+=t.vx*dt;t.rot+=t.spin*dt;unwind(t);
   if(t.x<p.l-r*.4||t.x>p.r+r*.4){t.on=null;t.onL=null;t.fromY=t.y;}
   return t.on?'rest':'air';}
  t.on=null;t.onL=null;}
 const y0=t.y;t.vy+=G*dt;t.x+=t.vx*dt;t.y+=t.vy*dt;t.spin*=Math.exp(-ROLL.airSpin*dt);t.rot+=t.spin*dt;
 if(t.x<left+r||t.x>right-r){const side=t.x<left+r?1:-1;t.x=side>0?left+r:right-r;t.vx=side*Math.abs(t.vx)*ROLL.wall;t.spin*=-ROLL.wall;}
 unwind(t);
 if(t.vy>0){const p=plats.filter(q=>t.x>=q.l&&t.x<=q.r&&y0<=q.y+1&&t.y>=q.y).sort((a,c)=>a.y-c.y)[0];
  if(p){t.y=p.y;if(t.roll)grip(t,ROLL.impact);else t.vx*=.7;
   if(t.vy>240)t.vy=-t.vy*t.bounce;else{t.vy=0;t.on=p.key;t.onL=p.l;}
   return 'land';}}
 return t.y>bottom?'lost':'air';
}

// A bat from the cat: away the way it faces and up off the card, slower for a heavier toy, the paw putting a little
// topspin on a ball. pays: whether this hit pulls cord off the yarn as it rolls; one that does frees the end for good,
// and a later hit that does not just sends the ball rolling with its cord trailing.
export function batToy(t,dir,power=1,pays=true){const m=t.mass||1;t.on=null;t.onL=null;t.fromY=t.y;if(t.thread){t.paying=pays;if(pays){t.loose=true;t.bite=YARN.bite[0]+Math.random()*(YARN.bite[1]-YARN.bite[0]);}}
 t.vx=dir*(220+Math.random()*180)*power/m;t.vy=-(180+Math.random()*200)*power/Math.sqrt(m);
 t.spin=t.roll?t.vx/(t.w/2)*(.2+Math.random()*.4):0;}
/* The cord off the yarn is a rope: a chain of points a link apart, each falling under gravity, the links holding them
   no further apart than they were laid but letting them bunch up, so it goes slack, sags across a gap and drapes over
   an edge. It lies on whatever a toy can rest on (cards, the toolbar, the filters) and never on air: a point coming
   down onto a surface stops on it and holds there by friction, riding along when the card is shoved. One end is tied to
   the ball where it meets the ground; the other, with the pompom, is free. Once nothing moves it sleeps. */
export const CORD={lift:2,damp:.985,grip:.08,hold:.08,passes:8,still:.04};
export function cordTip(t){const back=t.vx>4?-1:t.vx<-4?1:(t.back||-1);t.back=back;return {x:t.x+back*t.w*.28,y:t.y-Math.max(CORD.lift,t.h*.18)};}
/* The cat's paws in the cord. Walking through it, the feet push the strands they tread on along with them and lift
   them a little, so the cord gets dragged and scattered and falls back where it lands. A swat flicks the strands under
   the paw up and away. Returns the strand nearest the paw, or -1 when the paw found none. */
export function pawCord(t,paw,dt){
 const pts=t.thread;if(!pts?.length||!paw)return -1;const h=Math.min(dt,1/30);let near=-1,best=Infinity;
 // A swat frees the cord for a paw's width either side as well, the flick fading out across it, so a loop can rise.
 const reach=paw.swat?paw.w*1.5:paw.w/2;
 for(let i=0;i<pts.length;i++){const q=pts[i],dx=q.x-paw.x,dy=q.y-paw.y;if(Math.abs(dx)>reach||dy<-paw.h||dy>6)continue;
  if(Math.abs(dx)<=paw.w/2&&Math.abs(dx)<best){best=Math.abs(dx);near=i;}
  if(paw.swat){const k=1-Math.abs(dx)/reach;q.on=null;q.px=q.x-paw.dir*(160+Math.random()*160)*h*k;q.py=q.y+(220+Math.random()*200)*h*k;}
  else if(Math.abs(dx)>paw.w/2)continue;
  else if(Math.abs(paw.vx)>20){q.on=null;q.x+=paw.vx*h*.55;q.y-=Math.min(3,Math.abs(paw.vx)*h*.25);}}
 if(near>=0)t.cordAwake=true;return near;}
// hold: a strand caught on the cat, {i,x,y}, kept where the paw has it while the rest of the cord follows.
export function cordStep(t,plats,dt,{bottom=Infinity,hold=null}={}){
 const pts=t.thread;if(!pts?.length)return;
 const tip=cordTip(t),moved=!t.cordTip||Math.abs(tip.x-t.cordTip.x)>.05||Math.abs(tip.y-t.cordTip.y)>.05;t.cordTip=tip;
 const sig=plats.map(p=>`${p.key}:${p.l.toFixed(1)}:${p.y.toFixed(1)}`).join();
 if(!t.cordAwake&&!moved&&!hold&&sig===t.cordSig)return;t.cordSig=sig;
 const held=hold&&pts[hold.i];if(held){held.on=null;}
 const by=new Map(plats.map(p=>[p.key,p]));
 // Points on a card go where the card went.
 for(const q of pts)if(q.on){const p=by.get(q.on);if(!p||q.x<p.l||q.x>p.r){q.on=null;continue;}const dx=p.l-q.onL,y=p.y-CORD.lift;q.x+=dx;q.px+=dx;q.y=q.py=y;q.onL=p.l;}
 const h=Math.min(dt,1/30),g=G*h*h,start=pts.map(q=>q.y);
 for(const q of pts){const vx=(q.x-q.px)*CORD.damp,vy=(q.y-q.py)*CORD.damp;q.px=q.x;q.py=q.y;
  if(q.on){q.x+=vx*CORD.grip;continue;}q.x+=vx;q.y+=vy+g;}
 const land=(q,i)=>{if(q.on){const p=by.get(q.on),s=p.y-CORD.lift;if(q.y<s-1)q.on=null;else{q.y=s;return;}}
  for(const p of plats){const s=p.y-CORD.lift;if(q.x>=p.l&&q.x<=p.r&&start[i]<=s+.5&&q.y>=s){q.y=s;q.on=p.key;q.onL=p.l;q.px=q.x-(q.x-q.px)*CORD.grip;q.py=s;break;}}
  if(q.y>bottom){q.y=bottom;q.py=bottom;}};
 // A point lying on a surface gives way to a pull far less than one in the air: friction holds the cord there.
 const give=q=>q.on?CORD.hold:1;
 const pull=(a,b,len,fixA)=>{const dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy);if(d<=len||!d)return;
  const wa=fixA?0:give(a),wb=give(b),k=(d-len)/d/(wa+wb);a.x+=dx*k*wa;a.y+=dy*k*wa;b.x-=dx*k*wb;b.y-=dy*k*wb;};
 for(let n=0;n<CORD.passes;n++){
  const last=pts.at(-1);if(held){held.x=hold.x;held.y=hold.y;}pull(tip,last,YARN.step,true);
  for(let i=pts.length-1;i>0;i--)pull(pts[i],pts[i-1],pts[i].len||YARN.step,false);
  pts.forEach(land);if(held){held.x=hold.x;held.y=hold.y;}
  for(const q of pts)if(q.on){const p=by.get(q.on);if(q.x<p.l||q.x>p.r)q.on=null;}
 }
 let most=0;for(let i=0;i<pts.length;i++){const q=pts[i];most=Math.max(most,Math.abs(q.x-q.px),Math.abs(q.y-q.py));}
 t.cordAwake=most>CORD.still||Boolean(held);
}
// How far the cord between strand i and the ball is pulled past its length (0 while it has slack).
export function cordStrain(t,i){const pts=t.thread;if(!pts?.[i])return 0;let len=0;for(let k=i+1;k<pts.length;k++)len+=pts[k].len||YARN.step;
 const tip=t.cordTip||cordTip(t);len+=YARN.step;return Math.max(0,Math.hypot(tip.x-pts[i].x,tip.y-pts[i].y)-len);}
// Wound back up: the thread gone and the ball full size again.
export function rewind(t){if(!t.thread)return;t.thread=[];t.laid=null;t.loose=false;t.paying=false;t.spent=0;t.left=1;t.w=t.h=TOYS[0].w;}

// The thread as one path, its points moved by (dx,dy), each segment a soft curve through the midpoints.
export function threadPath(pts,dx=0,dy=0){if(pts.length<2)return '';const f=n=>n.toFixed(1);
 let d=`M${f(pts[0].x+dx)} ${f(pts[0].y+dy)}`;
 for(let i=1;i<pts.length-1;i++){const a=pts[i],n=pts[i+1];d+=`Q${f(a.x+dx)} ${f(a.y+dy)} ${f((a.x+n.x)/2+dx)} ${f((a.y+n.y)/2+dy)}`;}
 const z=pts.at(-1);return `${d}L${f(z.x+dx)} ${f(z.y+dy)}`;}
