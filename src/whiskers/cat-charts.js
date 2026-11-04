// The insights charts, as things a cat plays with. Each chart is marked with what it is, data-cat-chart, or is a
// Recharts chart read by what it draws, and each kind answers the cat in its own way:
//   bars   columns are posts: it hops from top to top, and each one squashes under its weight and springs back.
//   hbars  bars lying flat are springboards: landing or swatting one stretches it out, and it boings back.
//   ring   a donut, pie or ring is a wheel: it rolls under the cat's paws (the cat's log rolling).
//   gauge  a half circle is a seesaw: it tips toward whichever side the cat stands on.
//   cells  hexagons, heat cells and dots are a rug of buttons: a landing sends a ripple out from its paws and a walk
//          lights a trail under them.
//   line   a line or area is a string: landing plucks it, and a red dot runs along it for the cat to chase.
// Everything moves through the standalone scale and rotate properties and the Web Animations API, so the charts' own
// entrance animations, which use transform and classes, are left alone.
const ROOTS='[data-cat-chart],.recharts-wrapper';
const BAR_PIECES='[data-cat-bar],.chart-grow-y,.recharts-bar-rectangle';
const HBAR_PIECES='[data-cat-bar],.chart-grow-x';
const CELL_PIECES='[data-cat-cell],polygon,.chart-pop,.chart-hover-pop,.chart-grow-y';
const SPRING={k:260,c:9};

function kindOf(root){
 const k=root.dataset?.catChart;if(k)return k;
 if(root.querySelector('.recharts-bar-rectangle'))return 'bars';
 if(root.querySelector('.recharts-pie,.recharts-radial-bar-sectors'))return 'ring';
 if(root.querySelector('.recharts-area,.recharts-line'))return 'line';
 return null;
}

// What a chart draws, as opposed to its axes, grid, hover shading and gradients, which are nothing to stand on.
const NOT_DRAWN='defs,clipPath,mask,title,.recharts-cartesian-grid,.recharts-cartesian-axis,.recharts-polar-grid,.recharts-reference-line,.recharts-tooltip-cursor,.recharts-brush';
const DRAWN='path,circle,ellipse,rect,polygon,polyline';
const BIN=4,FLAT=4,MIN_RUN=26;

export function chartFx({doc=document,win=window,reducedMotion=()=>false}={}){
 const springs=new Map(),tops=new WeakMap(),floors=new WeakMap();
 const sized=e=>{const r=e.getBoundingClientRect();return r.width>0&&r.height>0?r:null;};
 const svgOf=(root,minH=30)=>[...root.querySelectorAll('svg')].map(e=>({e,r:sized(e)})).filter(x=>x.r&&x.r.width>=40&&x.r.height>=minH).sort((a,b)=>b.r.width*b.r.height-a.r.width*a.r.height);

 /* The flat stretches along the top of what an svg draws, as [{l,r,y}] relative to the svg's parent, which a spin or a
    tilt of the svg does not move. The cat only stands where something is drawn right under its paws, so an arc gives
    the short stretch at its crown and a line the stretches where it runs level. Read again now and then, as the
    chart animates or turns. */
 function flats(svg){const a=svg.parentElement?.getBoundingClientRect();if(!a?.width)return [];
  const shapes=[...svg.querySelectorAll(DRAWN)].filter(e=>!e.closest(NOT_DRAWN)&&e.getTotalLength);
  const key=`${a.width|0}x${a.height|0}:${shapes.length}`,t=win.performance.now(),c=tops.get(svg);
  if(c&&(c.key===key?t-c.at<1500:t-c.at<400))return c.runs;
  const N=Math.ceil(a.width/BIN)+1,top=new Array(N).fill(Infinity);
  for(const e of shapes){const cs=win.getComputedStyle(e);if(cs.display==='none'||cs.visibility==='hidden'||+cs.opacity<.1)continue;
   const stroked=cs.stroke&&cs.stroke!=='none'&&parseFloat(cs.strokeWidth)>0,filled=cs.fill&&cs.fill!=='none'&&+cs.fillOpacity>=.1;if(!stroked&&!filled)continue;
   let len=0;try{len=e.getTotalLength();}catch{continue;}const m=e.getScreenCTM?.();if(!len||!m)continue;
   const half=stroked?parseFloat(cs.strokeWidth)*Math.hypot(m.a,m.b)/2:0,n=Math.min(400,Math.max(40,Math.ceil(len*Math.hypot(m.a,m.b)/2)));
   for(let i=0;i<=n;i++){const q=e.getPointAtLength(len*i/n),x=m.a*q.x+m.c*q.y+m.e,y=m.b*q.x+m.d*q.y+m.f-half,k=Math.floor((x-a.left)/BIN);if(k>=0&&k<N&&y<top[k])top[k]=y;}}
  const runs=[];let from=-1,lo=0,hi=0;
  const close=k=>{if(from>=0&&(k-from)*BIN>=MIN_RUN)runs.push({l:from*BIN,r:k*BIN,y:lo-a.top});from=-1;};
  for(let k=0;k<=N;k++){const y=k<N?top[k]:Infinity;
   if(!Number.isFinite(y)){close(k);continue;}
   if(from<0){from=k;lo=hi=y;continue;}
   if(Math.max(hi,y)-Math.min(lo,y)>FLAT){close(k);from=k;lo=hi=y;continue;}
   lo=Math.min(lo,y);hi=Math.max(hi,y);}
  tops.set(svg,{key,at:t,runs});return runs;}

 /* Every chart on screen as surfaces in the scene's coordinates. Each surface carries chart:{kind,root,el} and, for
    a wheel, roll: the element that turns. id gives each element a stable key. */
 function plats(box,{W,H,id}){
  const out=[],seen=new Set();
  for(const root of doc.querySelectorAll(ROOTS)){
   if(root.matches('.recharts-wrapper')&&root.parentElement?.closest('[data-cat-chart]'))continue;
   if(seen.has(root))continue;seen.add(root);
   const kind=kindOf(root),rr=kind&&sized(root);if(!rr||rr.bottom<-H||rr.top>2*H||rr.width>W*.98)continue;
   const add=(e,r,extra={},n=0)=>{if(r.left<-8||r.right>W+8)return;const w=Math.max(r.width,12),cx=(r.left+r.right)/2;
    out.push({l:cx-w/2-box.left,r:cx+w/2-box.left,y:r.top-box.top,home:r.top-box.top,perch:'pick',inner:true,key:`chart:${id(e)}${n?`:${n}`:''}`,chart:{kind,root,el:e},...extra});};
   // The level stretches along the top of an svg's drawing, each its own surface.
   const addFlats=(svg,e,extra)=>{const a=svg.parentElement.getBoundingClientRect();
    flats(svg).forEach((f,n)=>add(e,{left:a.left+f.l,right:a.left+f.r,top:a.top+f.y,width:f.r-f.l,height:1},extra,n));};
   if(kind==='bars'){
    const sel=root.dataset.catPieces||BAR_PIECES;
    for(const e of root.querySelectorAll(sel)){const r=sized(e);if(r&&r.height>=10&&r.width>=8)add(e,r);}
   }else if(kind==='hbars'){
    const sel=root.dataset.catPieces||HBAR_PIECES;
    for(const e of root.querySelectorAll(sel)){const r=sized(e);if(r&&r.height>=6&&r.width>=24)add(e,r);}
   }else if(kind==='ring'||kind==='gauge'){
    for(const {e} of svgOf(root)){const turn=e.parentElement?.matches('.recharts-wrapper')?e.parentElement:e;
     addFlats(e,turn,kind==='ring'?{roll:turn}:{});if(kind==='gauge')break;}
   }else if(kind==='cells'){
    const els=[...root.querySelectorAll(root.dataset.catPieces||CELL_PIECES)];
    // A ripple swells the cells for a moment; the floor is where they rest, so it stays put under the cat until they
    // settle, kept relative to the rug so a scroll still carries it.
    const rippling=els.some(e=>e.getAnimations?.().some(a=>a.playState==='running'&&!('animationName' in a)&&!('transitionProperty' in a)));
    const kept=floors.get(root);
    if(rippling&&kept){add(root,{left:rr.left+kept.l,right:rr.left+kept.r,top:rr.top+kept.top,width:kept.r-kept.l,height:1},{cells:kept.cells});continue;}
    const cells=els.map(e=>({e,r:sized(e)})).filter(x=>x.r&&x.r.width<=80&&x.r.height<=80);
    if(!cells.length)continue;
    // The rug's top row is the floor it walks on: from its first cell to its last, and no further.
    const top=Math.min(...cells.map(x=>x.r.top)),row=cells.filter(x=>x.r.top<=top+FLAT),l=Math.min(...row.map(x=>x.r.left)),r=Math.max(...row.map(x=>x.r.right));
    floors.set(root,{l:l-rr.left,r:r-rr.left,top:top-rr.top,cells:cells.map(x=>x.e)});
    add(root,{left:l,right:r,top,width:r-l,height:1},{cells:cells.map(x=>x.e)});
   }else if(kind==='line'){
    for(const {e} of svgOf(root,16))addFlats(e,e);
   }
  }
  return out;
 }

 /* A damped spring per element and property, from a knock to rest. What the element had inline before is kept and put
    back when it settles, and an element whose own scale or rotate is set inline, as by its hover, is left alone. */
 const PROP={sy:'scale',sx:'scale',rot:'rotate'};
 function restore(e,m,all=false){const o=m.orig;
  if(all||!m.sy&&!m.sx)e.style.scale=o.scale;if(all||!m.rot)e.style.rotate=o.rotate;
  if(all||!m.sy&&!m.sx&&!m.rot){e.style.transformOrigin=o.transformOrigin;e.style.transformBox=o.transformBox;}}
 function knock(e,prop,v,{origin,box='fill-box',most=1}={}){if(!e?.isConnected||reducedMotion())return;
  let m=springs.get(e);
  if(!m){if(e.style[PROP[prop]])return;m={orig:{scale:e.style.scale,rotate:e.style.rotate,transformOrigin:e.style.transformOrigin,transformBox:e.style.transformBox}};springs.set(e,m);}
  else if(!m[prop]&&m.orig[PROP[prop]])return;
  const q=m[prop]||{x:0,v:0};q.v=Math.max(-most*30,Math.min(most*30,q.v+v));q.hold=q.hold??0;m[prop]=q;
  if(origin)e.style.transformOrigin=origin;if(e instanceof win.SVGElement)e.style.transformBox=box;}
 function hold(e,prop,x){const m=springs.get(e);if(m?.[prop])m[prop].hold=x;}
 function step(dt){if(!springs.size||!dt)return;
  for(const [e,m] of springs){if(!e.isConnected){springs.delete(e);continue;}
   for(const prop of ['sy','sx','rot']){const q=m[prop];if(!q)continue;const eq=q.hold||0;
    for(let left=dt;left>1e-6;left-=1/240){const h=Math.min(1/240,left);q.v+=(-SPRING.k*(q.x-eq)-SPRING.c*q.v)*h;q.x+=q.v*h;}
    if(!eq&&Math.abs(q.x)<.002&&Math.abs(q.v)<.02)delete m[prop];}
   if(m.sy||m.sx){const sy=m.sy?1+m.sy.x:1,sx=m.sx?1+m.sx.x:1;e.style.scale=`${sx.toFixed(4)} ${sy.toFixed(4)}`;}
   if(m.rot)e.style.rotate=`${m.rot.x.toFixed(3)}deg`;
   restore(e,m);if(!m.sy&&!m.sx&&!m.rot)springs.delete(e);}}

 // A ripple out from x across a rug of cells, nearer cells first.
 function ripple(cells,x,y,{reach=260,trail=false}={}){if(reducedMotion())return;
  for(const e of cells){const r=e.getBoundingClientRect();if(!r.width)continue;const d=Math.hypot((r.left+r.right)/2-x,(r.top+r.bottom)/2-y);if(d>reach)continue;
   const lift=trail?1.18:1.32-d/reach*.22,at=e instanceof win.SVGElement?{transformBox:'fill-box',transformOrigin:'center'}:{};
   e.animate?.([{scale:'1',filter:'brightness(1)',...at},{scale:`${lift}`,filter:'brightness(1.45) saturate(1.3)',...at},{scale:'1',filter:'brightness(1)',...at}],{duration:trail?380:520,delay:trail?0:d*1.6,easing:'cubic-bezier(.3,1.4,.5,1)'});}}

 // A pluck: the line's paths wave up and down a few times, smaller each time.
 function pluck(svg,amp=5){if(reducedMotion())return;for(const p of svg.querySelectorAll('.recharts-area,.recharts-line,path')){if(p.closest('defs'))continue;
  p.animate?.([0,1,-.7,.45,-.25,.1,0].map(k=>({translate:`0 ${(k*amp).toFixed(2)}px`})),{duration:900,easing:'ease-out'});}}

 /* The track a red dot runs along: the top edge of everything the chart draws, so over a line it is the line and over
    a filled area or a stream it is the area's top, left to right, in window coordinates. */
 function trackOf(svg){const paths=[...svg.querySelectorAll('path')].filter(p=>!p.closest('defs')&&p.getTotalLength?.()>40);if(!paths.length)return null;
  const sr=svg.getBoundingClientRect(),N=40,top=new Array(N+1).fill(Infinity);
  for(const p of paths){const len=p.getTotalLength(),m=p.getScreenCTM?.();if(!len||!m)continue;
   for(let i=0;i<=160;i++){const q=p.getPointAtLength(len*i/160),x=m.a*q.x+m.c*q.y+m.e,y=m.b*q.x+m.d*q.y+m.f,k=Math.round((x-sr.left)/(sr.width||1)*N);if(k>=0&&k<=N&&y<top[k])top[k]=y;}}
  const pts=top.map((y,k)=>({x:sr.left+k/N*sr.width,y})).filter(q=>Number.isFinite(q.y));return pts.length>4?pts:null;}
 let laser=null;
 function redDot(svg,ms=3200){if(reducedMotion())return null;const pts=trackOf(svg);if(!pts)return null;laser?.el.remove();
  const el=doc.createElement('i');el.className='tl-cat-laser';el.setAttribute('aria-hidden','true');doc.body.append(el);
  const t0=win.performance.now(),dir=Math.random()<.5?1:-1,L={el,pts,until:t0+ms,x:pts[dir>0?0:pts.length-1].x};laser=L;
  const move=()=>{if(laser!==L)return;const k=Math.min(1,(win.performance.now()-t0)/ms),e=.5-.5*Math.cos(Math.PI*k),i=(dir>0?e:1-e)*(pts.length-1),a=pts[Math.floor(i)],b=pts[Math.min(pts.length-1,Math.ceil(i))],f=i-Math.floor(i);
   L.x=a.x+(b.x-a.x)*f;const y=a.y+(b.y-a.y)*f;el.style.transform=`translate(${(L.x-5).toFixed(1)}px,${(y-5).toFixed(1)}px)`;
   if(k<1)win.requestAnimationFrame(move);else{el.classList.add('gone');win.setTimeout(()=>{el.remove();if(laser===L)laser=null;},400);}};
  move();return L;}

 // Landing on a piece: what it does under the cat, by kind. x and vy are the cat's page x and falling speed.
 function land(p,vy,x){const {kind,el}=p.chart,hit=Math.min(1,Math.abs(vy)/900);
  if(kind==='bars')knock(el,'sy',-(.9+hit*2.2),{origin:'center bottom'});
  else if(kind==='hbars')knock(el,'sx',.8+hit*2,{origin:'left center'});
  else if(kind==='gauge')knock(el,'rot',(x-(el.getBoundingClientRect().left+el.getBoundingClientRect().width/2))/12*(.6+hit),{origin:'center bottom',box:'view-box',most:3});
  else if(kind==='cells'){const r=el.getBoundingClientRect();ripple(p.cells||[],x,r.top+12);}
  else if(kind==='line')pluck(el,3+hit*6);}
 // A step while walking on one: a soft squash, a trail of lit cells, a tilt of the seesaw.
 function walk(p,x){const {kind,el}=p.chart;
  if(kind==='bars')knock(el,'sy',-.35,{origin:'center bottom'});
  else if(kind==='hbars')knock(el,'sx',.25,{origin:'left center'});
  else if(kind==='cells'){const r=el.getBoundingClientRect();ripple((p.cells||[]).filter(e=>{const c=e.getBoundingClientRect();return Math.abs((c.left+c.right)/2-x)<14&&c.top<r.top+40;}),x,r.top,{trail:true});}}
 // Standing on a seesaw holds it tipped toward the cat's side.
 function lean(p,x){if(p?.chart?.kind!=='gauge')return;const el=p.chart.el,r=el.getBoundingClientRect(),off=(x-(r.left+r.width/2))/(r.width/2||1);
  if(!springs.get(el)?.rot)knock(el,'rot',0,{origin:'center bottom',box:'view-box'});hold(el,'rot',Math.max(-1,Math.min(1,off))*7);}
 function unlean(p){if(p?.chart?.kind==='gauge')hold(p.chart.el,'rot',0);}
 function boing(p){knock(p.chart.el,'sx',2.6,{origin:'left center'});}
 // Everything back as it was, at once: the cat has gone, or the page is changing.
 function reset(){for(const [e,m] of springs)if(e.isConnected)restore(e,m,true);springs.clear();laser?.el.remove();laser=null;}
 return {plats,step,land,walk,lean,unlean,boing,ripple,redDot,get laser(){return laser;},reset};
}
