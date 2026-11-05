// The timeline cat's voice. Its meows are one recording (below); the rest is synthesized with Web Audio, made the way
// a cat makes it: a buzzy
// throat (a source rich in harmonics, with a little jitter in its pitch and some breath) through three resonances that
// move like a mouth saying "m-ee-ow", the mouth itself opening from the closed "m" and rounding shut on the "w". Nothing
// above 4.5 kHz, so nothing is shrill. Browsers keep audio silent until the page has had a click or key press, so sounds
// before that are dropped.

const LOUD=.12;
// Pitch (Hz), the three resonances (Hz), and how open the mouth is (a cutoff, Hz) at points through the sound, as
// fractions of its length. breath is how much air is in the voice.
export const CALLS={
 meow:{ms:720,f0:[[0,540],[.32,780],[.7,700],[1,470]],f1:[[0,380],[.3,980],[.75,760],[1,460]],f2:[[0,1750],[.3,2150],[.7,1400],[1,950]],f3:[[0,2900],[.35,3300],[1,2600]],open:[[0,650],[.22,4200],[.75,3200],[1,900]],vol:.9,breath:.12},
 mew:{ms:320,f0:[[0,700],[.4,860],[1,640]],f1:[[0,450],[.35,900],[1,620]],f2:[[0,1900],[.4,2300],[1,1600]],f3:[[0,3000],[1,3200]],open:[[0,800],[.3,4000],[1,1500]],vol:.7,breath:.1},
 sad:{ms:1000,f0:[[0,620],[.25,660],[1,380]],f1:[[0,420],[.3,850],[1,480]],f2:[[0,1800],[.35,1900],[1,1000]],f3:[[0,2800],[1,2500]],open:[[0,700],[.3,3200],[1,800]],vol:.6,vib:9,breath:.18},
 trill:{ms:440,f0:[[0,480],[1,660]],f1:[[0,500],[1,800]],f2:[[0,1500],[1,1900]],f3:[[0,2700],[1,2900]],open:[[0,1200],[.4,2600],[1,2200]],vol:.55,trill:26,breath:.08},
 chirp:{ms:170,f0:[[0,700],[1,980]],f1:[[0,600],[1,950]],f2:[[0,2000],[1,2500]],f3:[[0,3000],[1,3300]],open:[[0,1500],[.5,3800],[1,3000]],vol:.5,breath:.06},
 mrrp:{ms:320,f0:[[0,360],[.5,480],[1,430]],f1:[[0,420],[1,760]],f2:[[0,1300],[1,1800]],f3:[[0,2500],[1,2800]],open:[[0,700],[.5,2400],[1,1800]],vol:.6,trill:22,breath:.1},
 grumble:{ms:680,f0:[[0,230],[1,195]],f1:[[0,450],[1,400]],f2:[[0,1100],[1,1000]],f3:[[0,2400],[1,2300]],open:[[0,900],[.3,1600],[1,900]],vol:.5,trill:17,breath:.16},
 protest:{ms:800,f0:[[0,520],[.3,760],[.7,700],[1,450]],f1:[[0,420],[.3,1050],[1,600]],f2:[[0,1800],[.3,2200],[1,1200]],f3:[[0,2900],[1,2600]],open:[[0,700],[.25,4200],[.8,3000],[1,900]],vol:.8,vib:7,breath:.16},
 yawn:{ms:1000,f0:[[0,440],[.3,540],[1,270]],f1:[[0,500],[.35,1000],[1,420]],f2:[[0,1500],[.4,1300],[1,800]],f3:[[0,2600],[1,2300]],open:[[0,800],[.35,3000],[1,600]],vol:.45,breath:.3}
};
/* The kitten sounds the cat makes on the page: high, round and short, a pure little voice (its pitch, a soft octave
   above and a trace of the next) gliding up and back down, with a mouth that opens on the "m" and closes on the "w".
   hup is the push-off of a jump, pat a soft landing, nom a nibble. */
export const CUTE={
 mew:{ms:300,f0:[[0,820],[.35,1180],[1,900]],open:[[0,900],[.3,3600],[1,1400]],vol:.55,vib:14},
 meow:{ms:560,f0:[[0,700],[.28,1080],[.62,980],[1,640]],open:[[0,800],[.25,3800],[.7,2600],[1,900]],vol:.6,vib:18},
 trill:{ms:360,f0:[[0,760],[1,1040]],open:[[0,1400],[1,3000]],vol:.4,trill:24},
 chirp:{ms:150,f0:[[0,900],[1,1300]],open:[[0,1800],[1,3600]],vol:.38},
 sad:{ms:700,f0:[[0,880],[.3,920],[1,560]],open:[[0,1000],[.3,3000],[1,900]],vol:.42,vib:22},
 hup:{ms:110,f0:[[0,430],[1,880]],open:[[0,1200],[1,2600]],vol:.22,air:.25,toneless:true},
 pat:{ms:90,f0:[[0,210],[1,110]],open:[[0,900],[1,500]],vol:.5,air:.35,thud:true,toneless:true},
 nom:{ms:120,f0:[[0,520],[.5,600],[1,480]],open:[[0,700],[.5,1600],[1,700]],vol:.3,air:.6,crunch:true,toneless:true}
};
/* Its meows are a real one: a short public domain (CC0) recording of a cat asking for food, from the "Micro Pack -
   Cat Meows" sound pack, a clear, high meow (about 800 Hz) with no growl, its clicks removed and cut above 380 Hz so
   no rumble is left. As recorded it holds one pitch and one open mouth, an "eee" more than a meow, so each call
   shapes it the way a cat does: the mouth opens from the "m", stays open, and rounds shut on the "ow" while the pitch
   rises and falls. A mew is higher and shorter, a chirp just the start. Played slower than as recorded a meow turns
   to a growl, so none is. */
export const MEOWS=[new URL('./meow.m4a',import.meta.url).href];
// How open the mouth is (a cutoff, Hz) and the pitch (times the call's rate) at points through the meow.
const MOUTH=[[0,650],[.12,5200],[.5,4400],[.78,1700],[1,750]];
const BEND={meow:[[0,.95],[.3,1.06],[1,.93]],mew:[[0,.97],[.35,1.05],[1,.96]],sad:[[0,1.03],[.25,1.04],[1,.9]]};
export const MEOW={meow:{rate:[.97,1.07],gain:.5},mew:{rate:[1.14,1.26],gain:.4},sad:{rate:[.96,1],gain:.38},trill:{rate:[1.22,1.32],gain:.3,cut:.34},chirp:{rate:[1.3,1.42],gain:.26,cut:.2}};
// Where a value is at fraction u through a list of [fraction, value] points.
export function along(points,u){
 if(u<=points[0][0])return points[0][1];
 for(let i=1;i<points.length;i++){const [a,va]=points[i-1],[c,vc]=points[i];if(u<=c)return va+(vc-va)*((u-a)/(c-a||1));}
 return points.at(-1)[1];
}

export function catVoice({win=window,doc=document,store=win.localStorage,key='orbit.cat.voice',meows=MEOWS}={}){const KEY=key;
 let ctx=null,purr=null,on=(()=>{try{return store?.getItem(KEY)!=='off';}catch{return true;}})();
 const AC=win.AudioContext||win.webkitAudioContext;
 const wake=()=>{if(!AC)return;if(!ctx)try{ctx=new AC();}catch{return;}if(ctx.state==='suspended')ctx.resume().catch(()=>{});load();};
 let clips=null;
 function load(){if(clips||!win.fetch)return;clips=[];for(const u of meows)win.fetch(u).then(r=>r.ok?r.arrayBuffer():Promise.reject()).then(a=>ctx.decodeAudioData(a)).then(b=>clips.push(b)).catch(()=>{});}
 function meow(name,{pitch=1,gain=1}={}){
  const m=MEOW[name];if(!m||!ready()||!clips?.length)return false;
  const buf=clips[Math.floor(Math.random()*clips.length)],src=ctx.createBufferSource(),g=ctx.createGain(),hp=ctx.createBiquadFilter(),mouth=ctx.createBiquadFilter(),t=ctx.currentTime+.01;hp.type='highpass';hp.frequency.value=380;hp.Q.value=.6;
  const rate=pitch*(m.rate[0]+Math.random()*(m.rate[1]-m.rate[0])),bend=!m.cut&&BEND[name];src.buffer=buf;
  const len=Math.min(buf.duration,m.cut||buf.duration),dur=len/rate,end=t+dur,v=m.gain*gain;
  src.playbackRate.setValueAtTime(rate*(bend?bend[0][1]:1),t);if(bend)for(const [p,k] of bend.slice(1))src.playbackRate.linearRampToValueAtTime(rate*k,t+p*dur);
  mouth.type='lowpass';mouth.Q.value=1.1;const shape=m.cut?MOUTH.slice(0,3):MOUTH;mouth.frequency.setValueAtTime(shape[0][1],t);
  for(const [p,f] of shape.slice(1))mouth.frequency.exponentialRampToValueAtTime(f,t+p*dur);
  g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v,t+Math.min(.035,dur/4));g.gain.setValueAtTime(v,Math.max(t+.04,end-(m.cut?.06:dur*.28)));g.gain.linearRampToValueAtTime(0,end);
  src.connect(hp).connect(mouth).connect(g).connect(ctx.destination);src.start(t,0,len+.01);return true;}
 for(const e of ['pointerdown','keydown'])doc.addEventListener(e,wake,{capture:true,passive:true});
 const ready=()=>on&&ctx&&ctx.state==='running';
 function noise(sec){const n=ctx.createBuffer(1,Math.ceil(ctx.sampleRate*sec),ctx.sampleRate),d=n.getChannelData(0);let last=0;for(let i=0;i<d.length;i++){last=(last+.04*(Math.random()*2-1))/1.04;d[i]=last*3.5;}const src=ctx.createBufferSource();src.buffer=n;return src;}
 function master(){const out=ctx.createGain(),soft=ctx.createBiquadFilter();soft.type='lowpass';soft.frequency.value=4500;soft.Q.value=.5;out.gain.value=LOUD;out.connect(soft).connect(ctx.destination);return out;}
 function envelope(g,t,ms,vol){const end=t+ms/1000;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(vol,t+Math.min(.07,ms/3500));g.gain.setValueAtTime(vol,Math.max(t+.07,end-.16));g.gain.linearRampToValueAtTime(0,end);return end;}
 // The throat: every harmonic, falling off as a voice's do, so it buzzes softly rather than whistling.
 let throat=null;
 const glottal=()=>throat||(throat=(()=>{const n=32,re=new Float32Array(n),im=new Float32Array(n);for(let h=1;h<n;h++)im[h]=1/Math.pow(h,1.25);return ctx.createPeriodicWave(re,im);})());

 function call(name,{pitch=1}={}){
  const c=CALLS[name];if(!c||!ready())return;
  const t=ctx.currentTime+.01,ms=c.ms*(0.9+Math.random()*.2),p=pitch*(0.94+Math.random()*.12),steps=32,end=t+ms/1000;
  const src=ctx.createOscillator(),sum=ctx.createGain(),mouth=ctx.createBiquadFilter(),env=ctx.createGain(),out=master();
  src.setPeriodicWave(glottal());mouth.type='lowpass';mouth.Q.value=.9;
  // Three resonances side by side, the first loudest, plus a little of the bare throat.
  const res=[[c.f1,9,1.6],[c.f2,11,.9],[c.f3,13,.35]].map(([line,q,gain])=>{const f=ctx.createBiquadFilter(),g=ctx.createGain();f.type='bandpass';f.Q.value=q;g.gain.value=gain;src.connect(f).connect(g).connect(sum);return {f,line};});
  const dry=ctx.createGain();dry.gain.value=.06;src.connect(dry).connect(sum);
  for(let i=0;i<=steps;i++){const u=i/steps,at=t+u*ms/1000;src.frequency.linearRampToValueAtTime(along(c.f0,u)*p,at);
   // Jitter: a real voice never holds its pitch perfectly still.
   src.detune.linearRampToValueAtTime((Math.random()-.5)*22,at);
   for(const r of res)r.f.frequency.linearRampToValueAtTime(along(r.line,u),at);mouth.frequency.linearRampToValueAtTime(along(c.open,u),at);}
  if(c.vib){const lfo=ctx.createOscillator(),d=ctx.createGain();lfo.frequency.value=5.5;d.gain.value=c.vib;lfo.connect(d).connect(src.detune);lfo.start(t);lfo.stop(end);}
  // Breath: air through the same mouth, mostly at the start and as it closes.
  if(c.breath){const air=noise(ms/1000+.05),hp=ctx.createBiquadFilter(),ag=ctx.createGain();hp.type='highpass';hp.frequency.value=900;
   ag.gain.setValueAtTime(c.breath*1.6,t);ag.gain.linearRampToValueAtTime(c.breath*.6,t+ms/2000);ag.gain.linearRampToValueAtTime(c.breath*1.2,end);
   air.connect(hp).connect(ag);for(const r of res)ag.connect(r.f);air.start(t);air.stop(end+.02);}
  sum.connect(mouth).connect(env);env.connect(out);
  envelope(env,t,ms,c.vol);
  if(c.trill){const lfo=ctx.createOscillator(),d=ctx.createGain(),am=ctx.createGain();am.gain.value=.6;lfo.frequency.value=c.trill;d.gain.value=.4;lfo.connect(d).connect(am.gain);env.disconnect();env.connect(am).connect(out);lfo.start(t);lfo.stop(end);}
  src.start(t);src.stop(end+.02);
 }
 function cute(name,{pitch=1,gain=1}={}){
  const c=CUTE[name];if(!c||!ready())return false;
  const t=ctx.currentTime+.01,ms=c.ms*(0.92+Math.random()*.16),p=pitch*(0.95+Math.random()*.1),end=t+ms/1000,steps=24;
  const env=ctx.createGain(),mouth=ctx.createBiquadFilter(),out=master();mouth.type='lowpass';mouth.Q.value=.7;mouth.connect(env).connect(out);
  const voices=c.toneless?[]:c.thud?[[1,'sine',1]]:[[1,'sine',1],[2,'sine',.28],[3,'triangle',.06]],oscs=voices.map(([h,type,g])=>{const o=ctx.createOscillator(),og=ctx.createGain();o.type=type;og.gain.value=g;o.connect(og).connect(mouth);return [o,h];});
  for(let i=0;i<=steps;i++){const u=i/steps,at=t+u*ms/1000,f=along(c.f0,u)*p;for(const [o,h] of oscs)o.frequency.linearRampToValueAtTime(f*h,at);mouth.frequency.linearRampToValueAtTime(along(c.open,u),at);}
  if(c.vib){const lfo=ctx.createOscillator(),d=ctx.createGain();lfo.frequency.value=6;d.gain.value=c.vib;for(const [o] of oscs)d.connect(o.detune);lfo.connect(d);lfo.start(t);lfo.stop(end);}
  const g=env.gain,v=c.vol*gain,att=c.thud||c.crunch?.004:.03;g.setValueAtTime(0,t);g.linearRampToValueAtTime(v,t+att);g.setTargetAtTime(0,end-ms/1000*(c.thud?.8:.35),ms/1000*(c.thud?.25:.12));
  if(c.trill){const lfo=ctx.createOscillator(),d=ctx.createGain(),am=ctx.createGain();am.gain.value=.65;lfo.frequency.value=c.trill;d.gain.value=.35;lfo.connect(d).connect(am.gain);env.disconnect();env.connect(am).connect(out);lfo.start(t);lfo.stop(end);}
  if(c.air){const air=noise(ms/1000+.05),f=ctx.createBiquadFilter(),ag=ctx.createGain();f.type=c.thud?'lowpass':'bandpass';f.frequency.value=c.thud?700:c.crunch?2400:1800;f.Q.value=c.crunch?3:.8;
   ag.gain.setValueAtTime(c.air*gain,t);ag.gain.setTargetAtTime(0,t+.01,c.crunch?.018:.03);air.connect(f).connect(ag).connect(out);air.start(t);air.stop(end+.05);}
  for(const [o] of oscs){o.start(t);o.stop(end+.15);}
  return true;}
 function hiss(){}
 /* The bell ball: a small jingle bell, a few bright inharmonic partials that ring out fast, struck two or three times
    as the clapper rattles. Harder hits ring louder and rattle more. */
 let rungAt=-1;
 function bell({gain=1}={}){
  if(!ready())return false;const t0=ctx.currentTime+.005;if(t0-rungAt<.12)return false;rungAt=t0;
  const out=ctx.createGain();out.gain.value=.26*Math.max(.25,Math.min(1,gain));out.connect(ctx.destination);
  const base=2150*(0.97+Math.random()*.06),hits=gain>.75?3:2;
  for(let h=0;h<hits;h++){const t=t0+h*(.05+Math.random()*.025),v=h?.5/h:1;
   for(const [ratio,amp,decay] of [[1,1,.6],[1.5,.55,.42],[2.4,.3,.28],[3.3,.16,.18]]){
    const o=ctx.createOscillator(),g=ctx.createGain();o.type='sine';o.frequency.value=base*ratio*(1+(Math.random()-.5)*.004);
    g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(amp*v,t+.003);g.gain.exponentialRampToValueAtTime(0.0001,t+decay);
    o.connect(g).connect(out);o.start(t);o.stop(t+decay+.02);}
   const tick=noise(.03),f=ctx.createBiquadFilter(),tg=ctx.createGain();f.type='highpass';f.frequency.value=5000;
   tg.gain.setValueAtTime(.25*v,t);tg.gain.exponentialRampToValueAtTime(0.0001,t+.025);tick.connect(f).connect(tg).connect(out);tick.start(t);tick.stop(t+.03);}
  return true;}
 function sneeze(){if(!ready())return;call('chirp',{pitch:1.1});const t=ctx.currentTime+.2,src=noise(.2),f=ctx.createBiquadFilter(),g=ctx.createGain();f.type='bandpass';f.frequency.value=1800;f.Q.value=.7;
  const end=envelope(g,t,170,.5);src.connect(f).connect(g).connect(master());src.start(t);src.stop(end);}
 // Claws on glass: a tiny dry squeak, very quiet.
 function scritch(){if(!ready())return;const t=ctx.currentTime+.01,src=noise(.14),f=ctx.createBiquadFilter(),g=ctx.createGain();f.type='bandpass';f.frequency.setValueAtTime(2600,t);f.frequency.linearRampToValueAtTime(1900,t+.12);f.Q.value=6;
  const end=envelope(g,t,120,.18);src.connect(f).connect(g).connect(master());src.start(t);src.stop(end);}
 // A purr: a low rumble pulsing about 25 times a second, swelling as it breathes in and out.
 function purrOn(){if(purr||!ready())return;const t=ctx.currentTime,src=noise(2),f=ctx.createBiquadFilter(),pulse=ctx.createOscillator(),depth=ctx.createGain(),g=ctx.createGain(),breath=ctx.createOscillator(),bd=ctx.createGain(),out=master();
  src.loop=true;f.type='lowpass';f.frequency.value=220;f.Q.value=.8;pulse.frequency.value=25;depth.gain.value=.45;g.gain.value=.5;breath.frequency.value=.4;bd.gain.value=.25;
  pulse.connect(depth).connect(g.gain);breath.connect(bd).connect(g.gain);const fade=ctx.createGain();fade.gain.setValueAtTime(0,t);fade.gain.linearRampToValueAtTime(1.4,t+.8);
  src.connect(f).connect(g).connect(fade).connect(out);src.start(t);pulse.start(t);breath.start(t);purr={src,pulse,breath,out:fade};}
 function purrOff(){if(!purr)return;const {src,pulse,breath,out}=purr;purr=null;if(!ctx)return;const t=ctx.currentTime;out.gain.cancelScheduledValues(t);out.gain.setValueAtTime(out.gain.value,t);out.gain.linearRampToValueAtTime(0,t+.5);for(const n of [src,pulse,breath])n.stop(t+.55);}
 // Lines are read by the server's neural voice (Kokoro af_bella) when it has one, else by the browser's best English
 // voice at its natural pitch. Resolves once the line starts, so the bubble shows with the voice.
 let clip=null;
 function stopTalk(){if(clip){clip.pause();clip=null;}win.speechSynthesis?.cancel();}
 async function neural(text){if(!win.fetch||!win.Audio||!win.URL?.createObjectURL)return null;return Promise.race([new Promise(r=>win.setTimeout(()=>r(null),9000)),fetchVoice(text)]);}
 async function fetchVoice(text){if(!win.fetch||!win.Audio||!win.URL?.createObjectURL)return null;
  try{const r=await win.fetch('/api/cat/say',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text})});if(!r.ok||!/^audio\//.test(r.headers.get('content-type')||''))return null;
   const url=win.URL.createObjectURL(await r.blob()),a=new win.Audio(url);a.volume=.85;a.onended=()=>win.URL.revokeObjectURL(url);return a;}catch{return null;}}
 const PREFER=[/samantha/i,/ava|allison|susan|zoe|serena/i,/google us english/i,/natural|premium|enhanced/i,/female|karen|moira|tessa|zira/i];
 function system(text){const sy=win.speechSynthesis;if(!sy||!win.SpeechSynthesisUtterance)return false;sy.cancel();
  const u=new win.SpeechSynthesisUtterance(text);u.pitch=1.1;u.rate=1;u.volume=.8;const en=sy.getVoices().filter(x=>/^en/i.test(x.lang));
  for(const re of PREFER){const v=en.find(x=>re.test(x.name));if(v){u.voice=v;break;}}sy.speak(u);return true;}
 async function speak(text){if(!on)return false;stopTalk();const a=await neural(text);if(!on)return false;
  if(a){clip=a;try{await Promise.race([a.play(),new Promise((_,no)=>win.setTimeout(no,2500))]);return true;}catch{a.pause();clip=null;}}return system(text);}
 // Loads the neural voice ahead of the first line, so that line is not slow.
 function warm(){if(on&&win.fetch)win.fetch('/api/cat/say',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text:'Meow.'})}).catch(()=>{});}
 function setOn(v){on=Boolean(v);try{store?.setItem(KEY,on?'on':'off');}catch{}if(!on){purrOff();stopTalk();}else wake();return on;}
 return {call,cute,meow,bell,hiss,sneeze,scritch,purrOn,purrOff,speak,warm,stopTalk,get on(){return on;},setOn,get ready(){return ready();}};
}
