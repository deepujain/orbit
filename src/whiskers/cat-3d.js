// The timeline cat in 3D. A WebGL shader ray-marches a chibi kitten built from rounded shapes that blend into each
// other, so legs, neck and tail grow out of the body, and lights it like a soft plush toy with a fuzzy edge. It follows
// the pose values the SVG cat is animated with (the CSS custom properties on its parts), so every pose, act and mood
// carries over, and turning around is a real rotation. Its lowest point always rests on the surface it stands on.
// Without WebGL it returns null and the SVG cat is shown instead.
import {CAT_W} from './cat-physics.js';

// The model, in the SVG's units (y down, z toward the viewer). Shared by the shader and by the contact and paw maths.
export const M={
 pivot:[22,38],body:[30,32.2],bodyR:[11.4,8.6,9],haunch:[22,32.4],haunchR:8.9,chest:[38.4,31.2],chestR:8.3,
 front:[38.4,33.4],frontL:10.6,hind:[22.4,32.6],hindL:11.6,legZ:4.5,pawR:[3.7,2.3,3.5],
 head:[45,20.4],headR:[12.6,11.3,11.2],tail:[14.4,32.4,-1],ground:47.8
};
const f=n=>Number(n).toFixed(2);
const V2=a=>`vec2(${f(a[0])},${f(a[1])})`,V3=a=>`vec3(${f(a[0])},${f(a[1])},${f(a[2]??0)})`;

const VERT='attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}';
export const FRAG=`precision highp float;
uniform vec2 uRes;uniform vec4 uView;
uniform float uYaw,uTilt,uSq,uFy,uPitch,uTuck,uTail,uGlass;
uniform vec3 uHC,uS1,uP1,uS2,uP2;uniform vec2 uHA;uniform vec4 uLegs;uniform vec2 uEar;uniform vec4 uEye;uniform vec4 uMisc;uniform vec2 uBob;
vec2 rot(vec2 v,float a){float c=cos(a),s=sin(a);return vec2(c*v.x-s*v.y,s*v.x+c*v.y);}
float smin(float a,float b,float k){float h=clamp(.5+.5*(b-a)/k,0.,1.);return mix(b,a,h)-k*h*(1.-h);}
float sdEll(vec3 p,vec3 r){float k0=length(p/r),k1=length(p/(r*r));return k0*(k0-1.)/max(k1,1e-4);}
float sdSph(vec3 p,float r){return length(p)-r;}
float sdRC(vec3 p,vec3 a,vec3 b,float r1,float r2){vec3 ba=b-a;float l2=dot(ba,ba),rr=r1-r2,a2=l2-rr*rr,il2=1./l2;vec3 pa=p-a;float y=dot(pa,ba),z=y-l2;
 vec3 xv=pa*l2-ba*y;float x2=dot(xv,xv),y2=y*y*l2,z2=z*z*l2,k=sign(rr)*rr*rr*x2;
 if(sign(z)*a2*z2>k)return sqrt(x2+z2)*il2-r2;if(sign(y)*a2*y2<k)return sqrt(x2+y2)*il2-r1;return (sqrt(x2*a2*il2)+y*rr)*il2-r1;}
float hash(vec3 p){p=fract(p*.3183099+.1);p*=17.;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}
float noise(vec3 x){vec3 i=floor(x),f=fract(x);f=f*f*(3.-2.*f);
 return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),
  mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);}
vec3 toUp(vec3 p){p.y-=uFy;p.xy=rot(p.xy-vec2(32.,36.),-uTilt)+vec2(32.,36.);p.y=36.+(p.y-36.)/uSq;return p;}
vec3 toCat(vec3 q){float c=cos(uYaw),s=sin(uYaw),x=q.x-32.;return vec3(32.+x*c+q.z*s,q.y,-x*s+q.z*c);}
vec3 toBody(vec3 c){c.xy=rot(c.xy-${V2(M.pivot)},-uPitch)+${V2(M.pivot)}-uBob;return c;}
vec3 toHead(vec3 q){vec3 h=q-uHC;h.xy=rot(h.xy,-uHA.x);float c=cos(uHA.y),s=sin(uHA.y);return vec3(h.x*c-h.z*s,h.y,h.x*s+h.z*c);}
vec2 U(vec2 a,vec2 b){return a.x<b.x?a:b;}
// Short, plump legs: hind legs with a round thigh, front legs straight; each ends in a soft round paw.
vec2 leg(vec3 p,vec3 j,float a,float tuck,float hind,float len){vec3 v=p-j;v.xy=rot(v.xy,-a);v.y/=tuck;
 float d=hind>.5?smin(sdRC(v,vec3(0.),vec3(-1.,len*.55,0.),5.6,3.2),sdRC(v,vec3(-1.,len*.55,0.),vec3(.6,len,0.),3.2,2.9),1.8):sdRC(v,vec3(0.),vec3(.4,len,0.),3.5,3.);
 float paw=sdEll(v-vec3(1.,len,0.),${V3(M.pawR)});float k=min(tuck,1.);return vec2(smin(d,paw,1.3)*k,paw<d?2.:10.);}
vec2 head(vec3 h){
 vec3 ah=vec3(abs(h.x),h.y,h.z);
 float sk=sdEll(h-vec3(0.,-.6,0.),${V3(M.headR)});sk=smin(sk,sdEll(ah-vec3(5.6,4.4,3.2),vec3(7.,5.6,6.2)),3.6);vec2 r=vec2(sk,8.);
 float mz=min(sdEll(ah-vec3(2.,5.7,9.5),vec3(3.,2.3,2.2)),sdEll(h-vec3(0.,7.6,8.2),vec3(3.,1.8,2.)));
 if(mz<r.x+.5)r=vec2(smin(r.x,mz,1.3),2.);else r.x=smin(r.x,mz,1.3);
 float ang=h.x>0.?uEar.y:uEar.x;vec3 e=ah-vec3(6.6,-7.,-1.);e.xy=rot(e.xy,-ang);e.z*=1.8;
 float ear=sdRC(e,vec3(0.),vec3(3.,-7.6,0.),4.5,.9)/1.8;
 if(ear<r.x){vec2 ax=vec2(3.,-7.6);float t=clamp(dot(e.xy,ax)/dot(ax,ax),0.,1.),rt=mix(4.5,.9,t);r=vec2(smin(r.x,ear,1.2),e.z>.45*rt&&length(e.xy-ax*t)<.55*rt&&t>.12?3.:8.);}
 else r.x=smin(r.x,ear,1.2);
 float open=max(uEye.x,.07);r=U(r,vec2(sdEll(ah-vec3(4.9,.3,9.3),vec3(2.9,3.4*open,1.8)),4.));
 r=U(r,vec2(sdEll(h-vec3(0.,3.5,11.3),vec3(1.5,1.05,1.)),3.));
 if(uEye.z>.05)r=U(r,vec2(sdEll(h-vec3(0.,7.,10.),vec3(1.6,1.4*uEye.z,1.)),5.));
 if(uEye.w>.05)r=U(r,vec2(sdSph(h-vec3(-4.9,4.,10.),1.*uEye.w),6.));
 return r;}
// Paws pressed flat on the glass, toe beans showing.
vec2 armPaw(vec3 p,vec3 s,vec3 w){vec2 r=vec2(sdRC(p,s,w-vec3(0.,0.,1.4),3.5,3.1),10.);vec3 q=p-w;float pd=max(sdEll(q,vec3(4.8,4.3,2.8)),q.z-.2);
 if(pd<r.x){vec2 b=q.xy;float bean=min(min(length(b-vec2(-2.3,-1.9)),length(b-vec2(-.8,-2.8))),min(min(length(b-vec2(.8,-2.8)),length(b-vec2(2.3,-1.9))),length((b-vec2(0.,1.))*vec2(.55,.8))*.95));
  r=vec2(smin(r.x,pd,.8),q.z>-.5&&bean<1.?3.:2.);}else r.x=smin(r.x,pd,.8);return r;}
vec2 map(vec3 p){
 vec3 q=toUp(p),c=toCat(q),b=toBody(c);
 float body=sdEll(b-${V3(M.body)},${V3(M.bodyR)});body=smin(body,sdSph(b-${V3(M.haunch)},${f(M.haunchR)}),4.);body=smin(body,sdSph(b-${V3(M.chest)},${f(M.chestR)}),4.);
 vec2 r=vec2(body,1.);
 if(uMisc.x>.5){
  vec2 l=U(leg(c,vec3(${f(M.hind[0])},${f(M.hind[1])},-${f(M.legZ)}),uLegs.x,uTuck,1.,${f(M.hindL)}),leg(c,vec3(${f(M.hind[0])},${f(M.hind[1])},${f(M.legZ)}),uLegs.y,uTuck,1.,${f(M.hindL)}));
  if(uMisc.y<.5)l=U(l,U(leg(b,vec3(${f(M.front[0])},${f(M.front[1])},-${f(M.legZ)}),uLegs.z,1.,0.,${f(M.frontL)}),leg(b,vec3(${f(M.front[0])},${f(M.front[1])},${f(M.legZ)}),uLegs.w,1.,0.,${f(M.frontL)})));
  r=vec2(smin(r.x,l.x,2.4),l.x<r.x-.4?l.y:r.y);}
 vec3 t=c-${V3(M.tail)};t.xy=rot(t.xy,-uTail);
 float tl=smin(smin(sdRC(t,vec3(0.),vec3(-6.,-3.,0.),4.3,4.2),sdRC(t,vec3(-6.,-3.,0.),vec3(-8.6,-10.6,0.),4.2,4.1),1.3),sdRC(t,vec3(-8.6,-10.6,0.),vec3(-7.,-17.2,0.),4.1,3.9),1.3);
 r=vec2(smin(r.x,tl,1.8),tl<r.x-.3?(t.y<-15.4?2.:9.):r.y);
 vec2 hd=head(toHead(q));float nk=smin(r.x,hd.x,3.4);r=vec2(nk,hd.x<r.x?hd.y:r.y);
 if(uMisc.y>.5){vec2 a1=armPaw(p,uS1,uP1),a2=armPaw(p,uS2,uP2);vec2 a=U(a1,a2);r=vec2(smin(r.x,a.x,1.6),a.x<r.x?a.y:r.y);}
 return r;}
vec3 nrm(vec3 p){vec2 e=vec2(.05,-.05);return normalize(e.xyy*map(p+e.xyy).x+e.yyx*map(p+e.yyx).x+e.yxy*map(p+e.yxy).x+e.xxx*map(p+e.xxx).x);}
vec3 albedo(vec3 p,float m){
 vec3 fur=vec3(1.,.79,.55),dark=vec3(.94,.6,.35),cream=vec3(1.,.97,.92);
 if(m>1.5&&m<2.5)return cream;if(m>2.5&&m<3.5)return vec3(1.,.66,.72);if(m>4.5&&m<5.5)return vec3(.62,.2,.27);if(m>5.5&&m<6.5)return vec3(.6,.84,1.);
 vec3 q=toUp(p);
 if(m>3.5&&m<4.5){vec3 h=toHead(q);vec2 e=vec2(abs(h.x)-4.9,h.y-.3);if(h.x<0.)e.x=-e.x;
  float hi=step(length(e-vec2(-.9,-1.3)),1.05)+step(length(e-vec2(.95,1.2)),.5);return mix(vec3(.11,.07,.09),vec3(1.),clamp(hi,0.,1.)*step(.5,uEye.x));}
 if(m>7.5&&m<8.5){vec3 h=toHead(q);float band=smoothstep(.4,.7,sin(h.x*1.9+1.57))*smoothstep(-5.,-8.5,h.y)*step(abs(h.x),4.6)*step(3.,h.z);
  vec3 col=mix(fur,dark,band);float blush=smoothstep(2.6,.6,length(vec2(abs(h.x)-6.6,h.y-4.8)))*step(6.,h.z);return mix(col,vec3(1.,.62,.64),blush*.5);}
 if(m>9.5)return mix(fur,dark,.12);
 vec3 c=toCat(q);
 if(m>8.5){vec3 t=c-${V3(M.tail)};t.xy=rot(t.xy,-uTail);return mix(fur,dark,smoothstep(.5,.8,sin(length(t.xy)*1.2)));}
 vec3 b=toBody(c);float st=smoothstep(.35,.7,sin(b.x*.95+.6*sin(b.z*.45)))*smoothstep(31.,26.,b.y);
 vec3 col=mix(fur,dark,st);col=mix(col,cream,smoothstep(34.,37.,b.y));col=mix(col,cream,smoothstep(40.,44.,b.x)*smoothstep(27.,31.,b.y));return col;}
void main(){
 vec2 uv=gl_FragCoord.xy/uRes;vec3 p=vec3(uView.x+uv.x*uView.z,uView.y+(1.-uv.y)*uView.w,40.);
 float dmin=99.,hit=0.;vec2 r;vec3 near=p;
 for(int i=0;i<96;i++){r=map(p);if(r.x<dmin){dmin=r.x;near=p;}if(r.x<.03){hit=1.;break;}p.z-=max(r.x*.8,.04);if(p.z<-36.)break;}
 if(hit<.5){float fz=.95;if(dmin>fz){gl_FragColor=vec4(0.);return;}
  float hair=.35+.65*noise(vec3(near.xy*3.4,near.z*.6));float a=pow(1.-dmin/fz,1.8)*hair*.9;vec3 col=albedo(near,map(near).y)*1.04;gl_FragColor=vec4(col*a,a);return;}
 vec3 n=nrm(p),v=vec3(0.,0.,1.),L=normalize(vec3(-.4,-.8,.6));
 float m=r.y;vec3 al=albedo(p,m);
 bool furry=m<1.5||m>7.5;if(furry){n=normalize(n+.08*(vec3(noise(p*3.),noise(p*3.+7.1),noise(p*3.+13.7))-.5));al*=.96+.08*noise(p*2.2);}
 float w=dot(n,L)*.5+.5;vec3 light=mix(vec3(.82,.64,.64),vec3(1.04),smoothstep(.15,.85,w));
 float ao=0.;for(int i=1;i<4;i++){float hh=.9*float(i);ao+=(hh-map(p+n*hh).x)*(.5/float(i));}ao=clamp(1.-ao*.3,.55,1.);
 float rim=pow(1.-max(dot(n,v),0.),2.6);
 vec3 col=al*light*(.8+.2*ao)+al*.06*max(n.y,0.)+rim*vec3(1.,.95,.9)*(furry?.22:.04);
 if(m>2.5&&m<3.5)col+=pow(max(dot(n,normalize(L+v)),0.),28.)*.25;
 gl_FragColor=vec4(min(col,vec3(1.)),1.);}`;

// Plain 2D and 3D maths for the forward transforms (the shader holds their inverses).
const rot=([x,y],a)=>{const c=Math.cos(a),s=Math.sin(a);return [c*x-s*y,s*x+c*y];};
export function frames(v){
 const P=M.pivot;
 const bodyToCat=([x,y,z=0])=>{const r=rot([x+v.uBob[0]-P[0],y+v.uBob[1]-P[1]],v.uPitch);return [r[0]+P[0],r[1]+P[1],z];};
 const catToUp=([x,y,z=0])=>{const c=Math.cos(v.uYaw),s=Math.sin(v.uYaw);return [32+(x-32)*c-z*s,y,(x-32)*s+z*c];};
 const upToPage=([x,y,z=0])=>{const yy=36+(y-36)*v.uSq,r=rot([x-32,yy-36],v.uTilt);return [r[0]+32,r[1]+36+v.uFy,z];};
 return {bodyToCat,catToUp,upToPage};
}
// Where the paw of a leg rests, in its joint's frame: the leg swings about the joint and the paw ends the leg.
const pawPoints=(j,a,len,tuck)=>[-3.4,0,3.4].map(dx=>{const r=rot([1+dx,(len+M.pawR[1])*tuck],a);return [j[0]+r[0],j[1]+r[1]];});
// How far the cat must move down (or up) so its lowest point rests on the ground line.
export function contactOffset(v,{sleep=false,arms=false}={}){
 const {bodyToCat,catToUp,upToPage}=frames({...v,uFy:0}),pts=[];
 const ring=(c,rx,ry,n)=>{for(let i=0;i<n;i++){const t=i/n*Math.PI*2;pts.push(upToPage(catToUp(bodyToCat([c[0]+rx*Math.cos(t),c[1]+ry*Math.sin(t)]))));}};
 ring(M.body,M.bodyR[0],M.bodyR[1],16);ring(M.haunch,M.haunchR,M.haunchR,10);ring(M.chest,M.chestR,M.chestR,10);
 if(!sleep){for(const [k,z] of [[0,-1],[1,1]])for(const p of pawPoints(M.hind,v.uLegs[k],M.hindL,v.uTuck))pts.push(upToPage(catToUp([p[0],p[1],z*M.legZ])));
  if(!arms)for(const [k,z] of [[2,-1],[3,1]])for(const p of pawPoints(M.front,v.uLegs[k],M.frontL,1))pts.push(upToPage(catToUp(bodyToCat([p[0],p[1],z*M.legZ]))));}
 for(let i=0;i<12;i++){const t=i/12*Math.PI*2;pts.push(upToPage([v.uHC[0]+M.headR[0]*Math.cos(t),v.uHC[1]-.6+M.headR[1]*Math.sin(t),v.uHC[2]]));}
 const low=Math.max(...pts.map(p=>p[1]));return M.ground-low;
}

const num=(cs,k)=>parseFloat(cs.getPropertyValue(k))||0;
const rad=d=>d*Math.PI/180;
// The pose, read from the SVG cat's parts every frame, as the shader's uniforms.
export function poseUniforms({vis=1,tilt=0,fs=1,sleep=false,root,parts}){
 const cs=parts.cs(root),own=k=>{const e=parts.el(k);return e?parts.cs(e):null;};
 const a=k=>{const c=own(k);return c?num(c,'--a'):0;},dx=k=>{const c=own(k);return c?num(c,'--dx'):0;},dy=k=>{const c=own(k);return c?num(c,'--dy'):0;};
 const opa=k=>{const c=own(k);return c?parseFloat(c.opacity)||0:0;};
 const yaw=Math.acos(Math.max(-1,Math.min(1,vis))),pitch=rad(num(cs,'--pitch')+a('torso')),bob=[dx('torso'),dy('torso')];
 const v={uYaw:yaw,uTilt:rad((tilt+num(cs,'--roll')+a('flip'))*fs),uSq:num(cs,'--sq')||1,uFy:num(cs,'--fy')+dy('flip'),uPitch:pitch,uTuck:Math.max(.3,num(cs,'--tuck')||1),
  uTail:rad(num(cs,'--tail')+a('tail')),uLegs:[rad(num(cs,'--l1')+a('l1')),rad(num(cs,'--l2')+a('l2')),rad(num(cs,'--l3')+a('l3')),rad(num(cs,'--l4')+a('l4'))],uBob:bob};
 const {bodyToCat,catToUp}=frames(v),hc=bodyToCat(M.head);
 v.uHC=catToUp([hc[0]+num(cs,'--hx')+dx('head'),hc[1]+num(cs,'--hy')+dy('head'),0]);
 v.uHA=[rad((num(cs,'--hr')+a('head'))*fs),(Math.PI/2-yaw)*.4];
 const ear=num(cs,'--ear');v.uEar=[rad(ear-a('ear1')),rad(ear+a('ear2'))];
 const shut=opa('shut')>.5;v.uEye=[(num(cs,'--eye')||1)*parts.blink()*(shut?0:1),shut?1:0,opa('open'),opa('tear')];
 const arms=opa('arms')>.5;v.uMisc=[sleep?0:1,arms?1:0,0,0];
 return {v,arms,sleep};
}
// The arms reaching to the glass: from the shoulders to paws pressed flat in front of the face, pulled down in turn.
export function armPoints(v,pulls){
 const {bodyToCat,catToUp,upToPage}=frames(v),glass=v.uHC[2]+13.5,out={};
 // Each paw goes on its own shoulder's side of the face, which side that is depending on how the body is turned.
 for(const [i,z] of [[1,-1],[2,1]]){const s=catToUp(bodyToCat([M.front[0],M.front[1]-2.4,z*M.legZ])),side=Math.sign(s[0]-v.uHC[0])||z;out[`uS${i}`]=upToPage(s);
  out[`uP${i}`]=upToPage([v.uHC[0]+side*7.8,v.uHC[1]-16+pulls[i-1]*4.6,glass]);}
 out.uGlass=glass;out.nose=upToPage([v.uHC[0],v.uHC[1]+3.5,glass]);return out;
}

export function cat3d(root,{win=window,doc=document}={}){
 const canvas=doc.createElement('canvas');canvas.className='tl-cat-3d';canvas.setAttribute('aria-hidden','true');
 const gl=canvas.getContext('webgl',{premultipliedAlpha:true,alpha:true,antialias:false})||null;if(!gl)return null;
 const sh=(type,src)=>{const s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)){win.console?.warn?.(gl.getShaderInfoLog(s));return null;}return s;};
 const vs=sh(gl.VERTEX_SHADER,VERT),fs=sh(gl.FRAGMENT_SHADER,FRAG);if(!vs||!fs)return null;
 const prog=gl.createProgram();gl.attachShader(prog,vs);gl.attachShader(prog,fs);gl.linkProgram(prog);if(!gl.getProgramParameter(prog,gl.LINK_STATUS))return null;
 gl.useProgram(prog);const buf=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buf);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);
 const loc=gl.getAttribLocation(prog,'a');gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,2,gl.FLOAT,false,0,0);
 const U={};const u=n=>U[n]??=gl.getUniformLocation(prog,n);
 // The canvas covers the SVG's units from (-26,-44) to (90,56), so raised paws, a raised tail and a jump fit.
 const VIEW=[-26,-44,116,100],PX=CAT_W/64;
 Object.assign(canvas.style,{left:`${VIEW[0]*PX}px`,top:`${VIEW[1]*PX}px`,width:`${VIEW[2]*PX}px`,height:`${VIEW[3]*PX}px`});
 const dpr=Math.min(2,win.devicePixelRatio||1);canvas.width=Math.round(VIEW[2]*PX*dpr);canvas.height=Math.round(VIEW[3]*PX*dpr);
 root.prepend(canvas);root.classList.add('is-3d');
 const q=sel=>root.querySelector(sel),sel={flip:'.ct-flip',torso:'.ct-torso',head:'.ct-head',l1:'.ct-l1',l2:'.ct-l2',l3:'.ct-l3',l4:'.ct-l4',tail:'.ct-tail',ear1:'.ct-ear1',ear2:'.ct-ear2',
  shut:'.ct-shut',open:'.ct-open',tear:'.ct-tear',arms:'.ct-arms',a1:'.ct-a1',a2:'.ct-a2',pupil:'.ct-pupil'};
 const els={};for(const [k,s] of Object.entries(sel))els[k]=q(s);
 const ty=k=>{const t=els[k]&&win.getComputedStyle(els[k]).transform;if(!t||t==='none')return 0;try{return new win.DOMMatrix(t).f;}catch{return 0;}};
 const parts={cs:e=>win.getComputedStyle(e),el:k=>els[k],
  blink:()=>{const t=els.pupil&&win.getComputedStyle(els.pupil).transform;if(!t||t==='none')return 1;try{const m=new win.DOMMatrix(t);return Math.max(.05,Math.abs(m.d)/Math.max(.05,Math.abs(m.a)));}catch{return 1;}}};
 let settle=0,held=0,paws=null;
 // grounded: on a surface (not flying, carried or peeking), so the lowest point is kept on it, eased so poses don't pop.
 function render(state){
  const {v,arms,sleep}=poseUniforms({...state,root,parts});
  // On a surface the pose's own lift is dropped, so the cat rests on the bar in every trick; in the air it is kept.
  const want=state.grounded?contactOffset(v,{sleep,arms}):0,k=state.grounded?.45:.2;settle+=(want-settle)*k;held+=((state.grounded?1:0)-held)*k;v.uFy=v.uFy*(1-held)+settle;
  const ap=arms?armPoints(v,[ty('a1'),ty('a2')]):{uS1:[0,0,0],uP1:[0,0,-99],uS2:[0,0,0],uP2:[0,0,-99],uGlass:0};
  paws=arms?{paws:[ap.uP1,ap.uP2].map(p=>({x:p[0]*PX,y:p[1]*PX})),nose:{x:ap.nose[0]*PX,y:ap.nose[1]*PX}}:null;
  gl.viewport(0,0,canvas.width,canvas.height);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);
  gl.uniform2f(u('uRes'),canvas.width,canvas.height);gl.uniform4f(u('uView'),...VIEW);
  for(const k of ['uYaw','uTilt','uSq','uFy','uPitch','uTuck','uTail'])gl.uniform1f(u(k),v[k]);gl.uniform1f(u('uGlass'),ap.uGlass);
  for(const k of ['uHC','uS1','uP1','uS2','uP2'])gl.uniform3f(u(k),...(v[k]||ap[k]));
  gl.uniform2f(u('uHA'),...v.uHA);gl.uniform4f(u('uLegs'),...v.uLegs);gl.uniform2f(u('uEar'),...v.uEar);
  gl.uniform4f(u('uEye'),...v.uEye);gl.uniform4f(u('uMisc'),...v.uMisc);gl.uniform2f(u('uBob'),...v.uBob);
  gl.drawArrays(gl.TRIANGLE_STRIP,0,4);
  return settle;
 }
 // Paws on the glass, in px from the cat element's top left, while it scratches.
 return {render,canvas,paws:()=>paws};
}
