// Whiskers: a fluffy cat that lives in the whole window of a web page. Every card on screen is a box it walks on,
// hops between under real physics (cat-physics.js), shoves along and naps on; page headings are shelves; the bottom
// of the window is its floor. A ball of yarn, a toy mouse and a bell ball lie about for it to chase and swat. Tap it
// for a trick, double-tap it for the trick panel, grab it by the scruff to carry it, and double-click an empty spot to
// drop a fish there. You give it a name, and it gets hungry and asks to be fed.
// Its timeline, journey and game scenes stay inert unless a page has their elements.
// A host app can swap its own scenes in for the room, give it a game to run on the timeline, and turn its pet side off.
import {CAT_W,CAT_H,G,STEP,MAX_UP,BIG_UP,WALK,TROT,RUN,launch,crouchFor,surfaces,route,canHop,hopPoints,standingOn,platformsIn,walkStep,frictionStep,flyStep,carryStep,capSpeed,shakeMeter,edgeSpots,HANG,upFrom,CHIP,chipSpring,chipAtRest,bump,RELAID,TOYS,TOY_SVG,toyOn,toyStep,batToy,threadPath,cordStep,cordTip,pawCord,cordStrain,payOut} from './cat-physics.js'
import {catVoice,MEOWS} from './cat-voice.js'
import {cat3d} from './cat-3d.js';
import {chartFx} from './cat-charts.js';

// What real cats do: a burst of zoomies, a long stretch, a wash, claws on the scratching spot, a swat, and the one
// trick people teach them, a high five.
export const REACTIONS=[['run','Run',2600],['stretch','Stretch',1800],['groom','Groom',2000],['scratch','Scratch',2200],['swat','Swat',900],['highfive','High five',1900]];
export const MOODS=[['nap','Nap'],['thinking','Thinking'],['hype','Hype'],['sulk','Sulk'],['focus','Focus'],['sad','Sad']];
export const TOUCH=[['poke','Poke'],['drag','Drag'],['shake','Shake'],['say','Say a line']];
const TRICK_ICON={run:'\u{1F4A8}',groom:'\u{1F445}',scratch:'\u{1FAB5}',swat:'\u{1F43E}',beg:'\u{1F97A}',hello:'\u{1F44B}',highfive:'\u{1F64C}',headscratch:'\u{1F914}',stretch:'\u{1F646}',tickle:'\u{1F92D}',facepalm:'\u{1F926}',shrug:'\u{1F937}',thumbsup:'\u{1F44D}',dance:'\u{1F483}',bellydrum:'\u{1F941}',slowclap:'\u{1F44F}',peekaboo:'\u{1F648}',selfhug:'\u{1F917}',flex:'\u{1F4AA}',laugh:'\u{1F639}',sneeze:'\u{1F927}',
 nap:'\u{1F634}',thinking:'\u{1F4AD}',hype:'\u{1F389}',sulk:'\u{1F63E}',focus:'\u{1F3AF}',sad:'\u{1F63F}',poke:'\u{1F449}',drag:'\u270B',shake:'\u{1F300}',say:'\u{1F4AC}',line:'\u{1F4E3}'};
/* A small panel just beside the cat, opened by double-clicking it: its name, which you can change, how hungry it is
   with a fish to feed it, a few real-cat tricks that play once, the moods a cat holds until picked again, and play: a
   run, every touch, and the PR's line read aloud. */
const PANEL_MOODS=['nap','focus','sulk'];
export const HUNGER_SAY=['Full','Peckish','Hungry','Starving'];
export function trickPanelMarkup({mood=null,name='',hunger=0,pet=true}={}){
 const item=(kind,id,label,on=false)=>`<button type="button" class="tl-cat-trick${on?' on':''}" data-cat-kind="${kind}" data-cat-id="${id}"${kind==='mood'?` aria-pressed="${on}"`:''}><span aria-hidden="true">${TRICK_ICON[id]||'\u2728'}</span>${esc(label)}</button>`;
 const group=(title,items)=>`<section>${title?`<h3>${esc(title)}</h3>`:''}<div class="tl-cat-tricks">${items.join('')}</div></section>`;
 const level=Math.max(0,Math.min(3,Math.floor(hunger*2)));
 const head=pet?`<header><input class="tl-cat-name" type="text" maxlength="16" value="${esc(name)}" aria-label="Your cat's name" title="Type a name for your cat" spellcheck="false" autocomplete="off"><button type="button" class="tl-cat-panel-close" data-cat-kind="close" aria-label="Close">\u00D7</button></header>`:`<header><strong>Tricks</strong><button type="button" class="tl-cat-panel-close" data-cat-kind="close" aria-label="Close">\u00D7</button></header>`;
 const bowl=pet?`<div class="tl-cat-hunger" data-level="${level}"><span class="tl-cat-bowl" aria-hidden="true">${'\u25CF'.repeat(3-Math.min(3,level))}${'\u25CB'.repeat(Math.min(3,level))}</span><span>${HUNGER_SAY[level]}</span><button type="button" class="tl-cat-trick" data-cat-kind="feed" data-cat-id="feed"><span aria-hidden="true">\u{1F41F}</span>Feed</button></div>`:'';
 return `${head}${bowl}
${group('',REACTIONS.filter(([id])=>id!=='run').map(([id,label])=>item('trick',id,label)))}
${group('Moods',MOODS.filter(([id])=>PANEL_MOODS.includes(id)).map(([id,label])=>item('mood',id,label,mood===id)))}
${group('Play',[item('trick','run','Run'),...TOUCH.map(([id,label])=>item('touch',id,id==='say'?'Talk':label)),item('line','line','Read PR')])}`;
}
// The pose each act is done from; the stylesheet moves the paws, head, ears and tail on top of it.
export const BASE={hello:'sit',highfive:'upright',headscratch:'sit',stretch:'stretch',tickle:'back',facepalm:'sit',shrug:'upright',thumbsup:'upright',dance:'upright',bellydrum:'upright',slowclap:'upright',peekaboo:'sit',
 run:'run',selfhug:'upright',flex:'upright',laugh:'sit',sneeze:'sit',nap:'sleep',thinking:'sit',hype:'upright',sulk:'sit',focus:'crouch',sad:'sit',poke:'stand',dizzy:'stand',groom:'sit',scratch:'stand',swat:'stand',look:'sit',say:'sit',beg:'sit',eat:'crouch'};
// What an act shows besides the pose, at its moment: a speech bubble, a glyph that floats up from the head, a burst at
// the paw, or a nudge to the body.
const FX={hello:[[250,'say','Hi!']],highfive:[[650,'paw','\u2726']],headscratch:[[300,'head','~'],[1100,'head','~']],tickle:[[200,'say','hehe'],[1200,'say','hehehe!']],facepalm:[[500,'say','\u2026']],
 shrug:[[300,'say','meh']],thumbsup:[[500,'paw','\u2726'],[700,'say','nice']],dance:[[0,'head','\u266A'],[600,'head','\u266B'],[1200,'head','\u266A'],[1800,'head','\u266B'],[2400,'head','\u266A']],
 bellydrum:[[300,'paw','dum'],[900,'paw','dum'],[1500,'paw','dum!']],slowclap:[[700,'paw','clap'],[1400,'paw','clap'],[2100,'paw','clap']],peekaboo:[[1350,'say','boo!']],selfhug:[[400,'head','\u2665'],[900,'head','\u2665'],[1400,'head','\u2665']],
 flex:[[500,'paw','\u2727'],[900,'paw','\u2727'],[1300,'say','strong']],laugh:[[150,'say','ha ha'],[1100,'say','ha ha ha']],sneeze:[[1150,'say','achoo!'],[1150,'push',0]],poke:[[0,'head','!']],
 dizzy:[[0,'stars',0]],eat:[[350,'say','nom'],[900,'say','nom nom'],[1450,'head','\u2665']],drag:[[0,'say','Grab me and drag me']],groom:[],swat:[],look:[],beg:[[200,'say','prrrt?']]};
// What it says out loud during each act or mood, and when. A purr lasts until the act or mood ends.
export const VOICE={hello:[[200,'meow']],highfive:[[600,'chirp']],headscratch:[[300,'mrrp']],stretch:[[250,'yawn']],tickle:[[150,'trill'],[1150,'trill']],facepalm:[[450,'grumble']],
 shrug:[[250,'mew']],thumbsup:[[500,'chirp']],dance:[[0,'trill'],[1200,'trill']],peekaboo:[[1350,'meow']],selfhug:[[300,'purr']],flex:[[450,'mrrp']],laugh:[[100,'trill'],[1050,'trill']],
 sneeze:[[1100,'sneeze']],poke:[[0,'mew']],dizzy:[[150,'protest']],beg:[[150,'trill']],swat:[[100,'chirp']],eat:[],groom:[[500,'purr']],nap:[[700,'purr']],sad:[[300,'sad']],sulk:[[350,'grumble']],hype:[[0,'chirp']],say:[]};
// What it does with nothing to do, and how often.
export const IDLE=[['wander',20],['explore',26],['pounce',10],['rope',22],['mischief',7],['scout',6],['sit',8],['groom',7],['headscratch',5],['stretch',5],['scratch',5],['nap',5],['look',5],['react',4]];
export const NINE_LIVES=['Cats have nine lives.','Cats have nine lives. I have eight left.','I meant to do that. Cats have nine lives.'];
export function pickWeighted(r,list=IDLE){const total=list.reduce((n,[,w])=>n+w,0);let at=r*total;for(const [name,w] of list){if(at<w)return name;at-=w;}return list.at(-1)[0];}

const BODY='M13 30C12.6 24 17.6 20.8 24 21C30 21.2 35.4 20.4 40.6 21.8C46.4 23.4 49 28.4 47.4 32.8C46 36.4 41.8 37.6 35.6 37.6L23 37.6C16.8 37.6 13.4 35.4 13 30Z';
const HEAD='<circle cx="48" cy="20" r="10.6"/><circle cx="40.6" cy="24" r="4.2"/><circle cx="55.4" cy="24" r="4.2"/>';
const twice=s=>`<g class="ct-edge">${s}</g><g class="ct-fur">${s}</g>`;
// Hind legs taper from the haunch to the hock; front legs are straight and slim. Each ends in a round paw.
const LEG=n=>{const x={1:17,2:23,3:39,4:45}[n],hind=n<3;
 const d=hind?`M${x-1.6} 33C${x-2.8} 37.6 ${x-2} 41.6 ${x-1} 44.6L${x+3.6} 44.6C${x+3.4} 40.6 ${x+4.2} 37 ${x+4.8} 33Z`:`M${x} 32.4L${x+5.4} 32.4L${x+4.8} 44.6L${x+.6} 44.6Z`;
 return `<g class="ct-part ct-leg ct-l${n}"><path class="ct-limb" d="${d}"/><ellipse class="ct-paw" cx="${x+(hind?1.3:2.7)}" cy="44.8" rx="3.5" ry="1.9"/></g>`;};
export const CAT_SVG=`<svg class="tl-cat-svg" viewBox="0 0 64 48" aria-hidden="true" focusable="false"><defs><clipPath id="tl-cat-body"><path d="${BODY}"/></clipPath></defs><g class="ct-part ct-flip">
<g class="ct-part ct-tail"><path class="ct-tail-edge" d="M16 31C8 30 4.6 21 8 11.6"/><path class="ct-tail-fur" d="M16 31C8 30 4.6 21 8 11.6"/><path class="ct-tail-band" d="M9.4 26.4l2.6-1.6M7.2 21l2.8-.6M6.8 16.4l2.8.2"/><path class="ct-tail-tip" d="M8.6 14.6 8 11.6"/></g>
<g class="ct-far">${LEG(1)}</g>${LEG(2)}
<g class="ct-part ct-torso"><g class="ct-far">${LEG(3)}</g><path class="ct-body" d="${BODY}"/><g clip-path="url(#tl-cat-body)"><ellipse class="ct-belly" cx="32" cy="37.6" rx="13" ry="4"/><ellipse class="ct-belly" cx="46" cy="31" rx="4.6" ry="6.4"/>
<path class="ct-stripe" d="M19.4 20q1.6 4.4-.4 8.6M25.4 19.6q1.6 4.8-.2 9M31.4 19.6q1.4 4.6-.2 8.4M37.2 20.2q1.2 3.8-.4 7.2"/><path class="ct-crease" d="M15.6 33.4q2.6-6 9.4-5.4"/></g>${LEG(4)}
<g class="ct-part ct-head"><g class="ct-arms"><g class="ct-arm ct-a1"><path class="ct-limb" d="M37.8 31L38.4 9.6h4L42.2 31Z"/><ellipse class="ct-paw" cx="40.4" cy="9" rx="3.1" ry="2.7"/><g class="ct-bean"><circle cx="38.9" cy="7.7" r=".72"/><circle cx="40.4" cy="7.2" r=".72"/><circle cx="41.9" cy="7.7" r=".72"/><ellipse cx="40.4" cy="9.8" rx="1.5" ry="1.05"/></g></g><g class="ct-arm ct-a2"><path class="ct-limb" d="M53.8 31L53.6 9.6h4L58.2 31Z"/><ellipse class="ct-paw" cx="55.6" cy="9" rx="3.1" ry="2.7"/><g class="ct-bean"><circle cx="54.1" cy="7.7" r=".72"/><circle cx="55.6" cy="7.2" r=".72"/><circle cx="57.1" cy="7.7" r=".72"/><ellipse cx="55.6" cy="9.8" rx="1.5" ry="1.05"/></g></g></g><g class="ct-front"><path class="ct-limb" d="M42.6 36h4.2l-.2 8.6h-3.8zM49.2 36h4.2l-.2 8.6h-3.8z"/><ellipse class="ct-chest" cx="48" cy="34.4" rx="8.6" ry="7.6"/><ellipse class="ct-belly" cx="48" cy="35.6" rx="4.6" ry="5.4"/><ellipse class="ct-paw" cx="44.6" cy="44.8" rx="3" ry="1.8"/><ellipse class="ct-paw" cx="51.4" cy="44.8" rx="3" ry="1.8"/></g><g class="ct-part ct-ear1">${twice('<path d="M39.6 15.4 41 3.8l6.6 7.6z"/>')}<path class="ct-ear-in" d="M41.8 12.6 42.6 7l3.2 3.6z"/></g>
<g class="ct-part ct-ear2">${twice('<path d="M49.4 11.4 56 3.8l1.4 11.6z"/>')}<path class="ct-ear-in" d="M51.4 10.6 54.6 7l.8 5.6z"/></g>${twice(HEAD)}<path class="ct-brow" d="M46.4 10.2l.4 3M48.2 9.8v3.2M50 10.2l-.4 3"/>
<ellipse class="ct-blush" cx="42.4" cy="24" rx="2.2" ry="1.3"/><ellipse class="ct-blush" cx="53.8" cy="24" rx="2.2" ry="1.3"/>
<g class="ct-eyes"><ellipse class="ct-pupil" cx="44.4" cy="19.4" rx="1.8" ry="2.4"/><ellipse class="ct-pupil" cx="52" cy="19.4" rx="1.8" ry="2.4"/><circle class="ct-shine" cx="45" cy="18.5" r=".6"/><circle class="ct-shine" cx="52.6" cy="18.5" r=".6"/></g>
<path class="ct-shut" d="M42.6 19.8q1.8-1.7 3.6 0M50.2 19.8q1.8-1.7 3.6 0"/><g class="ct-dizzy"><circle cx="44.4" cy="19.4" r="2.2"/><circle cx="44.4" cy="19.4" r=".9"/><circle cx="52" cy="19.4" r="2.2"/><circle cx="52" cy="19.4" r=".9"/></g>
<path class="ct-tear" d="M43.6 22.6c.9 1.3 1.4 2.2 1.4 2.9a1.4 1.4 0 0 1-2.8 0c0-.7.5-1.6 1.4-2.9z"/>
<path class="ct-nose" d="M47 22.8h2.4l-1.2 1.4z"/><path class="ct-mouth" d="M48.2 24.2v.8M46.6 25.4q1.6 1 1.6-.4q0 1.4 1.6.4"/><ellipse class="ct-open" cx="48.2" cy="26.4" rx="1.9" ry="1.5"/>
<path class="ct-whisk" d="M41 24.4l-6.4-1.2M41 26l-6.4 1M55.4 24.4l6.4-1.2M55.4 26l6.4 1"/></g></g></g></svg>`;
// Four claw lines a little uneven in spacing, length and curve, each a bright scratch with a faint shadow beside it.
function scratchSvg(){let d='';for(let i=0;i<4;i++){const x=1.6+i*3.4+(Math.random()-.5)*.8,l=10+Math.random()*4,bend=(Math.random()-.5)*1.6;d+=`M${x.toFixed(2)} ${(Math.random()*1.2).toFixed(2)}q${bend.toFixed(2)} ${(l/2).toFixed(2)} ${(bend*.4).toFixed(2)} ${l.toFixed(2)}`;}
 return `<svg viewBox="0 0 14 16" preserveAspectRatio="none" aria-hidden="true" focusable="false"><path class="sh" d="${d}"/><path class="hi" d="${d}"/></svg>`;}
const CLAW_SVG='<svg viewBox="0 0 12 16" aria-hidden="true" focusable="false"><path d="M2 1.4l.5 12.6M4.8 .6l.3 14.6M7.6 .8 7.5 15M10.2 1.8l-.4 11.4"/></svg>';
// Acts done facing the viewer.
const FRONT=new Set(['scratch']);
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[c]);
// Nothing pops up beside the cat: a tap plays its next trick and a double-click reads the line. Nap and sound live in
// the menu under the timeline's Play game button.
export const MENU=[['nap','Nap','\u{1F634}']];
/* A line drawn in pieces is one rope: the Rounds view's line from a push up to its checks, stacked row by row, and a
   station's fork in the Clock view, one piece from the station to each bar above and below it, all at the same x.
   Each rope keeps its top piece as el, with every piece on el.__rope. */
const JOINED=['jl-rg-thru','jl-tl-link'];
export function joinRopes(lines,{dx=1.5,gap=4}={}){
 const out=[];
 for(const l of [...lines].sort((a,c)=>a.top-c.top||a.x-c.x)){
  const kind=JOINED.find(k=>l.el.classList?.contains(k));
  const r=kind&&out.find(o=>o.join===kind&&Math.abs(o.x-l.x)<=dx&&l.top<=o.bot+gap&&l.bot>=o.top-gap);
  if(r){r.top=Math.min(r.top,l.top);r.bot=Math.max(r.bot,l.bot);r.parts.push(l);if(l.top<r.el.__top){r.el=l.el;r.el.__top=l.top;}continue;}
  const o={...l,join:kind||null,parts:[l]};l.el.__top=l.top;out.push(o);}
 return out.map(({join,parts,...o})=>{if(join)o.el.__rope=parts.sort((a,c)=>a.top-c.top).map(p=>p.el);return o;});
}
export function menuMarkup({nap=false}={}){
 const item=(id,icon,label,on)=>`<button type="button" class="jl-cat-mi" role="menuitemcheckbox" aria-checked="${on}" data-do="catMenuDo" data-cat-do="${id}"><span aria-hidden="true">${icon}</span>${esc(label)}</button>`;
 return item('nap','\u{1F634}',nap?'Wake up':'Nap',nap);
}

/* What it says, in the role of the work it sits in: on the PR journey and its timeline it is the PR's author, writing
   the change and running its checks; on the PR Review Journey it is the reviewer reading someone else's change. It tells
   a joke, says how the round is going, or talks about the bar or station under it. */
const KIND={agent:'Repair',ci:'CI',images:'Images',e2e:'E2E',rabbit:'CodeRabbit',advisor:'PR Advisor'};
export const JOKES=['I counted the stock. Twice. Then I sat on it.','Every order is better with a box to sit in.','I approve this invoice. Paws down.',
 'Payments are in. Time for a nap.','I knocked a number off the report. It was a typo anyway.','Cash register? I thought it said cat register.',
 'I do not take breaks. I take naps between orders.','Delivery is late. I blame the dog.','I checked the ledger. It balances on my head.',
 'Is it payday? Asking for a cat.','Low stock alert: the tuna is gone.','I would file the expense myself, if I had thumbs.'];
export const REVIEW_JOKES=['Reading the diff. Every line, twice.','I left one comment: needs more tuna.','This function is longer than my tail. Requesting changes.',
 'Looks good to meow.','Do these tests test anything, or are they just sitting there like me?','I review code the way I sit on keyboards: thoroughly.',
 'I found an edge case. I knocked it off the table.','I only approve what I can reproduce.','Is the head still the commit I read? Cats notice when things move.',
 'I would approve this PR, but I only approve tuna.','Why do I sit on keyboards? To keep an eye on the mouse.','Checking the callers too. Curiosity is my job.'];
// What it says on each station's diamond, by the station's name, in each role.
export const STATION_LINES={
 author:{Issue:'I found an issue worth fixing.',Repair:'Writing the fix. Paws on the keyboard.',Commit:'Committed and signed with a paw print.',Push:'Pushed. The hooks are sniffing it.',
  CI:'CI is running my checks.',Images:'Building the images. Big boxes, my favorite.','PR Advisor':'The PR Advisor is reading my work.','Exit draft':'Out of draft. Everyone can see it now.',
  CodeRabbit:'CodeRabbit is reviewing my PR. A rabbit judging a cat.',E2E:'E2E is taking my PR for a real run.',Approval:'Waiting for a person to approve my PR.',Land:'Landed. Time for a nap.'},
 review:{Requested:'Someone asked me to review. I will be fair. Mostly.',Checkout:'Checked out the head in my own box, not yours.',
  'PR gates':'Before I read a line: CI, Images, the Advisor, CodeRabbit and E2E, on the head I am reviewing.','Code review':'Reading every changed file and who calls it.',
  'Reproduce & verify':'Reproducing it on base, then checking the fix on head.','Agent Decision':'Approve or request changes. Thinking with my whiskers.',
  'Human in Loop':'I drafted the review. You read it and post it.',Outcome:'It is on GitHub now.'}};
// "2h 25m" read aloud as "2 hours 25 minutes".
export const spoken=d=>String(d||'').replace(/(\d+)h\b/g,(_,n)=>`${n} hour${n==='1'?'':'s'}`).replace(/(\d+)m\b/g,(_,n)=>`${n} minute${n==='1'?'':'s'}`).replace(/(\d+)s\b/g,(_,n)=>`${n} second${n==='1'?'':'s'}`);
export function barInfo({text='',title='',cls=''}){
 const dur=(`${text} ${title}`.match(/\b\d+h(?: \d+m)?\b|\b\d+m\b|\b\d+s\b/)||[''])[0],kind=(cls.match(/\bk-([\w-]+)/)||[])[1],tone=(cls.match(/\btone-(\w+)/)||[])[1]||'';
 const own=text.replace(dur,'').replace(/[\u00D7\u2026]|\d+$/g,'').trim();
 return {name:KIND[kind]||own||'this',dur,tone,open:/\bopen\b/.test(cls)};
}
export function catLine({bar,status,station,work='author',r=Math.random,jokes=JOKES}={}){
 const pick=list=>list[Math.min(list.length-1,Math.floor(r()*list.length))],pool=[],review=work==='review';
 if(bar){const {name,tone,open}=bar,d=spoken(bar.dur);
  if(open)pool.push(`My ${name} bar is still running${d?`, ${d} so far`:''}. I am keeping it warm.`,`${name} is still going on my push. I will sit right here until it is done.`);
  else if(tone==='fail')pool.push(`My ${name} failed right here. I will fix it after a nap.`,`This ${name} bar went red. Not my fault. Probably.`);
  else if(tone==='hooks')pool.push(`My hooks took ${d||'a while'}. Long enough for a nap.`);
  else if(tone==='pass')pool.push(`My ${name} passed${d?` in ${d}`:''}. I knew it would.`,`Good ${name} bar. It held my weight.`);
  else pool.push(`I am sitting on ${name}${d?`. It took ${d}`:''}. Comfy.`);}
 const said=station&&STATION_LINES[review?'review':'author'][station];if(said)pool.push(said);
 const phase=String(status?.phase||'').replace(/ on [0-9a-f]{7,40}\b/g,'').replace(/ \(.*$/,'').replace(/\.$/,'');
 if(phase){const round=status.round?`Round ${status.round}${status.max?` of ${status.max}`:''}. `:'';
  pool.push(...review?[`${phase}. I am reviewing carefully.`,`${phase}. Nothing gets past these whiskers.`]:[`${round}${phase}. I am on it.`,`${phase}. I will mark it ready when it is green.`]);}
 return !pool.length||r()<.3?pick(review?REVIEW_JOKES:jokes):pick(pool);
}

/* Host options: game (a game module, as cat-game.js, played on the timeline) and boss (whether a PR's stage has a
   boss); scenes (functions that each return a scene for the page or null, tried before the room) and room (false keeps
   it to those scenes); pet (false drops its name, hunger and feeding); label (what it is called for screen readers);
   jokes (its own jokes); aloud (read its lines aloud while the music is on); slide (shoves push cards along their row
   too, not just down); follow (scroll the page to keep it in sight). */
export function startTimelineCat({doc=document,win=window,reducedMotion=()=>false,waiting=()=>false,line=()=>null,read=()=>'',home=()=>null,music=null,global='orbitCat',storage='orbit.cat',floor='[data-orbit-floor]',ignore='[data-orbit-ignore]',meow=MEOWS[0],
 game=null,boss=()=>null,scenes=[],room=true,pet=true,label='',jokes=JOKES,aloud=false,slide=false,follow=false}={}){
 if(win[global]?.voice)return win[global];
 const GAME=game;
 const {LIVES,CLEAR_BONUS,buildCourse,surfacesOf,placeFood,stepPlayer,player,collect,points,fellOut:outOfCourse,cleared,safeSpot,nextStage,recordBest,camera,placeFoes,stepFoes,touchFoes,stomp,bossLeft,placePickups,shoot,stepShots,SHOT_COOL,placeFlags,flagReached,keepFoes,HAZARD,FOOD,placeBoxes,keepBoxes,arenaPower,bumpBox,openBox,grabPower,powerAfter,hurtPower,chainPoints,kick:kickFoe,hitFoe,stageTime,STAR,COINS_LIFE}=GAME||{};
 const el=doc.createElement('div');
 el.className='tl-cat';el.hidden=true;el.innerHTML=`${CAT_SVG}<span class="tl-cat-z" aria-hidden="true">z<b>z</b><i>z</i></span>`;
 el.setAttribute('role','img');el.setAttribute('aria-label',label||'A cat playing on the page. Tap it for its next trick, double-tap it to pick one, drag to carry it.');
 const bubble=doc.createElement('div');bubble.className='tl-cat-say';bubble.hidden=true;bubble.setAttribute('aria-live','polite');
 const fog=doc.createElement('i');fog.className='tl-cat-fog';fog.hidden=true;
 // The caption over its head names the trick or move it is doing.
 const cap=doc.createElement('div');cap.className='tl-cat-cap';cap.hidden=true;cap.setAttribute('aria-live','polite');
 doc.body.append(el,bubble,fog,cap);
 /* Its sounds are the page's theme music: light cues on the style's own instruments, on the beat, heard only while the
    music is on. Its line is read out loud on the same switch. */
 const speech=catVoice({win,doc,store:{getItem:()=>'on',setItem(){}},meows:[meow]});
 /* Over the music's quiet bed it makes its own kitten sounds, up front: a mew or meow, a little hup as it jumps, a soft
    pat as it lands, a nom for each bite. */
 // One mouth: a call that starts while the last one is still sounding is dropped, so two never overlap.
 let voiceFree=0;
 const CUTE_OF={chirp:'chirp',trill:'trill',meow:'meow',mew:'mew',mrrp:'trill',protest:'meow',sad:'sad',grumble:'mew',yawn:'mew'};
 const voice={cue:(n,o)=>Boolean(music?.cue?.(n,o)),sfx:(n,o)=>Boolean(music?.on&&speech.cute(n,o)),call(n,o){if(!music?.on||now()<voiceFree)return false;const said=speech.meow(CUTE_OF[n]||'mew',o);if(said)voiceFree=now()+900;return Boolean(said);},purrOn(){},purrOff(){},sneeze(){voice.call('chirp');},scritch(){},
  speak:t=>aloud&&music?.on?speech.speak(t):Promise.resolve(false),warm(){if(aloud&&music?.on)speech.warm();},stopTalk:()=>speech.stopTalk(),get on(){return Boolean(music?.on);}};
 const TRICKS=new Set(REACTIONS.map(([n])=>n));
 let r3d=null;try{r3d=cat3d(el,{win,doc});}catch(e){win.console?.warn?.(e);}
 const charts=chartFx({doc,win,reducedMotion});
 const b={x:0,y:0,vx:0,vy:0};
 const s={mode:'idle',face:1,vis:1,tilt:0,surf:null,walk:null,hop:null,route:null,goal:null,prepUntil:0,landUntil:0,act:null,mood:null,leaving:false,carry:null,down:null,shakes:0,after:null,nextThink:0};
 let cycle=0,hinted=false,force=false,pointer=null,last=0,acc=0,sc=null,all=[],timers=[],bubbleUntil=0,taps=[],capUntil=0,awayUntil=0,lives=false,scrollAt=0,seen=null;
 const now=()=>win.performance.now(),rand=(a,c)=>a+Math.random()*(c-a),later=(ms,f)=>{const t=win.setTimeout(f,ms);timers.push(t);return t;};
 /* Its name, yours to give it, and its last meal are kept in the browser, so it is the same cat with the same appetite
    on every page and every visit. It gets hungry over HUNGER.full of not eating; a cat seen for the first time is
    nearly due, so it asks within a few minutes. */
 const store=(()=>{try{return win.localStorage;}catch{return null;}})(),keep=(k,v)=>{try{store?.setItem(k,v);}catch{}};
 const NAME_KEY=`${storage}.name`,FED_KEY=`${storage}.fed`,HUNGER={full:20*60e3,ask:[45000,75000]};
 let catName=String(store?.getItem(NAME_KEY)||'').trim().slice(0,16)||'Biscuit',fedAt=Number(store?.getItem(FED_KEY))||0,askAt=now()+rand(8000,15000),asked=0;
 if(pet&&!fedAt){fedAt=Date.now()-HUNGER.full*.85;keep(FED_KEY,String(fedAt));}
 const hunger=()=>Math.max(0,(Date.now()-fedAt)/HUNGER.full);
 const named=()=>pet&&!label&&el.setAttribute('aria-label',`${catName}, your cat, playing on the page. Tap for a trick, double-tap to name, feed or pick a trick, drag to carry.`);
 function setName(v){const n=String(v||'').replace(/\s+/g,' ').trim().slice(0,16);if(!n||n===catName)return false;catName=n;keep(NAME_KEY,n);named();return true;}
 function fed(){const was=hunger();fedAt=Date.now();keep(FED_KEY,String(fedAt));askAt=now()+rand(...HUNGER.ask);asked=0;return was>=1;}
 named();
 const set=(k,v)=>{if(v)el.dataset[k]=v;else delete el.dataset[k];};
 const pose=p=>set('pose',p);
 // A host's own scenes, each given what it needs to lay out boxes the cat shoves (chipY: how far one is pushed down).
 function hostScene(){for(const f of scenes){const v=f({doc,win,chipY:e=>chips.get(e)?.y||0,onScreen,CAT_W,CAT_H});if(v)return v;}return null;}
 function scene(){
  const tl=doc.querySelector('.jl-tl[data-tl-id]'),view=tl?.querySelector('.jl-rg-scroll,.jl-tl-view');if(!view)return journeyScene()||hostScene()||(room?homeScene():null);
  const box=tl.getBoundingClientRect(),v=view.getBoundingClientRect();if(!onScreen(v))return null;
  const bars=[...view.querySelectorAll('.jl-tl-seg')].map(e=>{const r=barRect(e);return {el:e,key:barKey(e),left:r.left,right:r.right,top:r.top,width:r.width,open:e.classList.contains('open'),info:barInfo({text:e.querySelector('span')?.textContent||'',title:e.title||'',cls:e.className})};});
  const plats=platformsIn(bars,v,box),left=v.left-box.left+CAT_W/2,right=v.right-box.left-CAT_W/2;
  const floor=v.bottom-box.top-4,low=picks(box,floor,left,right);
  return {id:tl.dataset.tlId,view,box,plats:[...plats,...perches(box,v,left,right),...low],floor,bottom:Math.max(floor,...low.map(p=>p.y)),left,right};
 }
 const onScreen=v=>v.width>=220&&v.bottom>=-CAT_H*4&&v.top<=win.innerHeight+CAT_H*6;
 /* With no Agent Timeline on the page, as on the reviews tab, it lives on the PR Review Journey instead: the bottom of
    the journey's track is its floor, its station diamonds, their pills and the ticket are perches, and the review chips
    below are its play area. The guide's demo journey is not a home. */
 function journeyScene(){
  const host=[...doc.querySelectorAll('.rj[data-rj]')].find(e=>!/^guide-/.test(e.dataset.rj)&&e.getClientRects().length),view=host?.querySelector('.jl-track');if(!view)return null;
  const box=host.getBoundingClientRect(),v=view.getBoundingClientRect();if(!onScreen(v))return null;
  const left=v.left-box.left+CAT_W/2,right=v.right-box.left-CAT_W/2,floor=v.bottom-box.top-4,low=picks(box,floor,left,right,host,RJ_PICKS);
  return {id:`rj:${host.dataset.rj}`,view,box,plats:[...perches(box,v,left,right,host),...low],floor,bottom:Math.max(floor,...low.map(p=>p.y)),left,right};
 }
 /* The whole window is its room. Every card on screen is a loose box: it hops from card to card, leaps up
    and drops down between the rows, and shoves them about. Page headings and tab bars are shelves. The bottom of the
    window is the floor, which rides along as the page scrolls, so the cat is always somewhere in sight. */
 const BOX='[data-card]',SHELF='main h1,main h2,[role="tablist"]',boxIds=new WeakMap();let boxN=0;
 /* Every shape on the page is a thing to land on: a card, a panel or stat tile, each row of a list or table (the
    day-by-day rows, open or folded), a bordered button, anything drawn with its own border, rule, fill or shadow.
    Looking at styles is slow, so which elements count is worked out every so often and remembered per element;
    their places are read each frame. Nothing fixed to the window counts: it does not scroll with the page. */
 const SHAPE='div,section,article,aside,li,tr,button,a,label,figure,header,footer,span,details,summary,form,fieldset',NOT_SHAPE='input,textarea,select,svg,img,video,canvas,[role="dialog"],[hidden],[inert],[aria-hidden="true"],'+[floor,ignore].filter(Boolean).join(',');
 const alpha=c=>{const m=String(c).match(/rgba?\(([^)]+)\)/);if(!m)return 0;const v=m[1].split(/[ ,\/]+/).filter(Boolean);return v.length>3?parseFloat(v[3]):1;};
 const drawn=new WeakMap(),pinned=new WeakMap();
 // Whether it sits in anything fixed or sticky to the window.
 function pinnedOf(e){if(!e||e===doc.body||e===doc.documentElement)return false;if(pinned.has(e))return pinned.get(e);
  const p=win.getComputedStyle(e).position,v=p==='fixed'||p==='sticky'||pinnedOf(e.parentElement);pinned.set(e,v);return v;}
 // The colour behind it: the nearest one up its parents that is painted.
 function behind(e){for(let a=e.parentElement;a&&a!==doc.documentElement;a=a.parentElement){const c=win.getComputedStyle(a).backgroundColor;if(alpha(c)>.08)return c;}return '';}
 function isShape(e){if(drawn.has(e))return drawn.get(e);const cs=win.getComputedStyle(e),w=(s)=>parseFloat(cs[`border${s}Width`])>=1&&alpha(cs[`border${s}Color`])>.05;
  // A row ruled off only by the line under it is stood on at that line; anything else at its top edge.
  const top=e.matches(BOX)||w('Top')||alpha(cs.backgroundColor)>.08&&cs.backgroundColor!==behind(e)||cs.boxShadow!=='none',v=top?'top':w('Bottom')?'bottom':false;
  drawn.set(e,v);return v;}
 // A circle or near one, as a numbered step, is a log to roll, however small.
 const roundish=new WeakMap();
 function isRound(e,r){if(roundish.has(e))return roundish.get(e);const cs=win.getComputedStyle(e),d=Math.min(r.width,r.height),rad=cs.borderTopLeftRadius,px=rad.endsWith('%')?parseFloat(rad)/100*d:parseFloat(rad);
  const v=d>=18&&Math.abs(r.width-r.height)<=Math.max(r.width,r.height)*.15&&px>=d/2-1;roundish.set(e,v);return v;}
 let shapes=[],shapesAt=-Infinity;
 function scanShapes(){shapesAt=now();shapes=[];const H=win.innerHeight,W=doc.documentElement.clientWidth||win.innerWidth,root=doc.querySelector('main')||doc.body,seen=[];
  for(const e of [...root.querySelectorAll(BOX),...root.querySelectorAll(SHAPE)]){if(shapes.length>=300)break;
   const r=e.getBoundingClientRect();if((r.width<56||r.height<24)&&!(r.width>=18&&r.height>=18&&isRound(e,r))||r.bottom<-H||r.top>2*H||r.width>W*.98||e.closest(NOT_SHAPE)||e.closest('.tl-cat,.tl-cat-toy,.tl-cat-yarn,[data-cat-chart] *'))continue;
   if(seen.some(q=>Math.abs(q.left-r.left)<3&&Math.abs(q.right-r.right)<3&&Math.abs(q.top-r.top)<3))continue;
   if(!isShape(e)||pinnedOf(e))continue;shapes.push(e);seen.push(r);}}
 const boxKey=e=>{let id=boxIds.get(e);if(!id){id=++boxN;boxIds.set(e,id);keyEl.set(`perch:home:${id}`,new WeakRef(e));}return id;};
 const keyEl=new Map();
 // The shapes a toy or the cord lies on, kept as things to rest on wherever the page has scrolled them.
 function held(){const out=new Set();for(const t of toys){if(t.on)out.add(t.on);for(const q of t.thread||[])if(q.on)out.add(q.on);}
  return [...out].map(k=>keyEl.get(k)?.deref()).filter(e=>e?.isConnected);}
 function homeScene(){
  const host=doc.body;if(!host)return null;if(now()-shapesAt>1500)scanShapes();
  const box=host.getBoundingClientRect(),W=doc.documentElement.clientWidth||win.innerWidth,H=win.innerHeight,top=CAT_H+56;
  /* The cat only goes where it can see, but the toys and the cord lie on the page itself: on every shape, on screen or
     not, and on the bottom of the page, so they scroll away with whatever they lie on. */
  const cards=[],rest=[],list=new Set([...shapes,...held()]);
  for(const e of list){if(!e.isConnected)continue;let r=e.getBoundingClientRect();
   // A log is measured unturned, about its middle, and stood on across the top of its curve.
   const log=roundish.get(e)===true;if(log){const cx=(r.left+r.right)/2,cy=(r.top+r.bottom)/2,w=e.offsetWidth,h=e.offsetHeight;r={left:cx-w*.35,right:cx+w*.35,top:cy-h/2,bottom:cy+h/2,width:w,height:h};}
   const at=drawn.get(e)==='bottom'?r.bottom:r.top,y=at-(chips.get(e)?.y||0);
   if(!log&&(r.width<56||r.height<24)||r.left<-8||r.right>W+8||e.closest('[role="dialog"],[hidden],[inert]'))continue;
   // Only cards and what is in them get shoved about; the rest of the page holds still under the cat.
   let nested=false;for(let a=e.parentElement;a&&!nested;a=a.parentElement)nested=list.has(a);const inCard=e.matches(BOX)||Boolean(e.closest(BOX));
   const p={l:r.left-box.left,r:r.right-box.left,y:at-box.top,home:y-box.top,perch:'pick',key:`perch:home:${boxKey(e)}`,...(log?{roll:e}:inCard&&{chip:e}),...(nested&&{inner:true})};
   rest.push(p);if(y>=top&&y<=H-CAT_H*.6)cards.push(p);}
  // The charts in the cards are toys of their own, each kind played with its own way (cat-charts.js).
  const toyCharts=[];
  for(const p of charts.plats(box,{W,H,id:boxKey})){rest.push(p);if(p.y+box.top>=top&&p.y+box.top<=H-CAT_H*.6)toyCharts.push(p);}
  const shelves=[];
  for(const e of doc.querySelectorAll(SHELF)){const r=e.getBoundingClientRect();if(r.width<60||r.height<16||e.closest(BOX))continue;
   const p={l:r.left-box.left,r:Math.min(r.right,r.left+Math.max(80,e.scrollWidth||r.width))-box.left,y:r.top-box.top,key:`home:shelf:${boxKey(e)}`};
   rest.push(p);if(r.top>=top&&r.top<=H-CAT_H)shelves.push(p);}
  // The floor is the bottom of the window, or the top of the bottom menu bar where one is showing.
  const nav=(floor&&doc.querySelector(floor))?.getBoundingClientRect(),low=nav&&nav.height&&nav.top<H&&nav.top>H/2?nav.top:H;
  const ground={l:-box.left,r:W-box.left,y:low-box.top-4,key:'home:ground',rides:true,leap:true};
  // The page's own floor meets the cat's when scrolled to the very bottom.
  const end=Math.max(H,doc.documentElement.scrollHeight-win.scrollY)-(H-low);
  rest.push({l:-box.left,r:W-box.left,y:end-box.top-4,key:'home:page'});
  return {id:'home',view:doc.documentElement,box,plats:[...shelves,...toyCharts,...cards,ground],rest,floor:ground.y+CAT_H,bottom:ground.y+CAT_H*2,left:-box.left+CAT_W/2,right:W-box.left-CAT_W/2};
 }
 /* Above the bars it climbs to the PR journey: up onto the boxes of the timeline's key, from there to each station's
    subtitle pill, then the top of the station's diamond, one hop at a time. Only stations over the timeline's view. */
 /* Below the timeline are the PR chips, one per PR. They are a play area of their own: it drops down onto them, walks
    and hops along the rows, and shoves them about. Moving a chip changes nothing it stands for. */
 const PICKS='.jl-pick[data-do="jlLivePick"]',RJ_PICKS='.jl-pick[data-do="rjPick"]',HOME_PICKS='[data-card]';
 function picks(box,floor,left,right,scope=doc,sel=PICKS){const out=[];
  scope.querySelectorAll(sel).forEach((e,i)=>{const r=e.getBoundingClientRect(),cx=r.left+r.width/2-box.left,y=r.top-box.top,home=y-(chips.get(e)?.y||0);
   if(r.width>=40&&r.height>=12&&home>floor+8&&home<floor+CAT_H*6&&cx>=left&&cx<=right)out.push({l:r.left-box.left,r:r.right-box.left,y,home,perch:'pick',chip:e,key:`perch:pick:${e.dataset.id??i}`});});
  // Only the first row, by where each chip rests: the rows below sit too close under it to hop between.
  const top=Math.min(...out.map(p=>p.home));return out.filter(p=>p.home<top+8);}
 function perches(box,v,left,right,scope=doc){
  if(box.top<CAT_H)return [];
  const out=[];
  scope.querySelectorAll(CHIP_ROW).forEach((e,i)=>{const r=e.getBoundingClientRect(),cx=r.left+r.width/2-box.left;
   if(r.width>=28&&r.height>=8&&cx>=left&&cx<=right)out.push({l:r.left-box.left,r:r.right-box.left,y:r.top-box.top,perch:'box',key:`perch:box:${i}`});});
  for(const li of scope.querySelectorAll('.jl-station:not([hidden])')){const g=li.querySelector('.jl-gem')?.getBoundingClientRect(),sub=li.querySelector('.jl-label small')?.getBoundingClientRect(),at=li.dataset.station;
   if(!g||g.width<12||g.top<4)continue;const cx=g.left+g.width/2-box.left;if(cx<left||cx>right)continue;
   out.push({l:cx-20,r:cx+20,y:g.top+g.height*.32-box.top,perch:'gem',li,station:at,key:`perch:gem:${at}`});
   if(sub?.width>=28)out.push({l:sub.left-box.left,r:sub.right-box.left,y:sub.top-box.top,perch:'chip',li,chip:li.querySelector('.jl-label small'),station:at,key:`perch:chip:${at}`});}
  // The ticket over the orb is a perch too, one that rides from station to station.
  const tk=scope.querySelector('.jl-rider .jl-ticket'),t=tk?.getBoundingClientRect();
  if(t&&t.width>=40&&t.top>4){const l=Math.max(t.left-box.left+8,left),r=Math.min(t.right-box.left-8,right);if(r-l>=30)out.push({l,r,y:t.top-box.top,perch:'ticket',ride:tk,key:'perch:ticket'});}
  return out;
 }
 // Effects, placed against the cat's head or paw on the page.
 const headAt=()=>({x:sc.box.left+b.x+s.face*14,y:sc.box.top+b.y-CAT_H+(['upright','back'].includes(el.dataset.pose)?-10:4)});
 const pawAt=()=>({x:sc.box.left+b.x+s.face*(CAT_W/2-2),y:sc.box.top+b.y-CAT_H*.75});
 function glyph(kind,text,at){if(!sc)return;const g=doc.createElement('i');g.className=`tl-cat-fx fx-${kind}`;g.textContent=text;const p=at||headAt();g.style.left=`${p.x+rand(-6,6)}px`;g.style.top=`${p.y}px`;doc.body.append(g);win.setTimeout(()=>g.remove(),2200);}
 function say(text,ms=2200,think=false){bubble.textContent=text;bubble.classList.toggle('think',think);bubble.hidden=false;bubbleUntil=think?Infinity:now()+ms;placeTalk();}
 const hush=()=>{bubble.hidden=true;bubbleUntil=0;};
 function caption(text,ms=2000){cap.textContent=text;cap.hidden=false;capUntil=now()+ms;placeTalk();}
 /* The caption sits just over its head; a speech bubble goes above the caption while both show. Each is placed the moment
    it shows, through --t, which its pop animation starts from, so it grows in over the cat rather than flying in from
    the corner of the page. */
 function placeTalk(){if(!sc)return;let over=0;const p=headAt();
  if(!cap.hidden){if(now()>capUntil)cap.hidden=true;else{over=cap.offsetHeight+4;cap.style.setProperty('--t',`translate(${(p.x-cap.offsetWidth/2).toFixed(1)}px,${(p.y-cap.offsetHeight-8).toFixed(1)}px)`);}}
  if(!bubble.hidden){if(now()>bubbleUntil)hush();else bubble.style.setProperty('--t',`translate(${(p.x-bubble.offsetWidth/2).toFixed(1)}px,${(p.y-bubble.offsetHeight-12-over).toFixed(1)}px)`);}}
 // A line said out loud and shown in its bubble, the bubble kept up while the voice reads it.
 async function speakLine(text){const ms=Math.max(2600,text.length*70);say(text,ms);await voice.speak?.(text);}
 // Each pull drags one paw down the glass; its four claws leave fine scratches that catch the light, then fade.
 function claws(){let n=0;const pull=()=>{if(s.act?.name!=='scratch'||!sc)return;const k=n%2;n++;let x,y;
   const p=r3d?.paws();if(p){const o=el.getBoundingClientRect();x=o.left+p.paws[k].x;y=o.top+p.paws[k].y;}
   else{const r=el.querySelector(`.ct-a${1+k} .ct-paw`)?.getBoundingClientRect();if(!r?.width){later(275,pull);return;}x=r.left+r.width/2;y=r.top+r.height/2;}
   const m=doc.createElement('i');m.className='tl-cat-claw';m.innerHTML=scratchSvg();m.style.left=`${(x-5.5).toFixed(1)}px`;m.style.top=`${(y+1).toFixed(1)}px`;doc.body.append(m);
   voice.scritch?.();win.setTimeout(()=>m.remove(),7200);later(275,pull);};later(430,pull);}
 function stars(){if(!sc)return;const g=doc.createElement('i');g.className='tl-cat-stars';g.innerHTML='<b>\u2605</b><b>\u2605</b><b>\u2605</b>';doc.body.append(g);
  const follow=()=>{if(!g.isConnected||!sc)return;const p=headAt();g.style.left=`${p.x-16}px`;g.style.top=`${p.y-6}px`;win.requestAnimationFrame(follow);};follow();win.setTimeout(()=>g.remove(),2600);}
 function fx(name){for(const [ms,kind,text] of FX[name]||[])later(ms,()=>{if(s.act?.name!==name&&s.mood!==name)return;
  if(kind==='say')say(text,1300);else if(kind==='head')glyph('head',text);else if(kind==='paw')glyph('paw',text,pawAt());else if(kind==='stars')stars();else if(kind==='push'&&s.mode==='idle')b.vx=-s.face*110;});}
 function sound(name){for(const [ms,what] of VOICE[name]||[])later(ms,()=>{if(s.act?.name!==name&&s.mood!==name)return;
  if(what==='purr')voice.purrOn();else if(what==='sneeze')voice.sneeze();else voice.call(what);});}
 function clearTimers(){for(const t of timers)win.clearTimeout(t);timers=[];}
 // An act holds the cat still for its length; a mood holds until it is tapped off.
 function act(name,ms){if(['air','carry','peek'].includes(s.mode))return false;if(name==='run')return zoomies();
  clearTimers();voice.purrOff();s.route=null;s.goal=null;s.walk=null;s.mode='idle';s.front=FRONT.has(name);s.act={name,until:now()+ms};set('act',name);pose(BASE[name]||'stand');fx(name);if(TRICKS.has(name))voice.cue('trick');else sound(name);if(name==='scratch')claws();return true;}
 function endAct(){if(s.act)voice.purrOff();s.front=false;s.act=null;set('act',null);if(!s.mood)pose('stand');}
 function mood(name){
  const off=s.mood===name||!name;clearTimers();hush();voice.purrOff();s.mood=off?null:name;set('mood',s.mood);s.act=null;set('act',null);s.route=null;s.walk=null;s.hop=null;if(s.mode==='walk'||s.mode==='prep')s.mode='idle';
  pose(s.mood?BASE[s.mood]:'stand');
  if(s.mood==='thinking')say('\u00B7 \u00B7 \u00B7',0,true);
  if(s.mood==='sulk'){s.face=pointer&&pointer.x>b.x?-1:1;later(400,()=>s.mood==='sulk'&&say('hmph',1400));}
  if(s.mood==='hype')hype();if(s.mood==='sad')tears();if(s.mood)sound(s.mood);
 }
 function hype(){if(s.mood!=='hype')return;if(s.mode==='idle'&&s.surf){b.vy=-Math.sqrt(2*G*rand(10,22));s.mode='air';}if(Math.random()<.6)glyph('head','\u2726');if(Math.random()<.35)voice.call('chirp');later(rand(520,760),hype);}
 function tears(){if(s.mood!=='sad')return;el.classList.remove('crying');void el.offsetWidth;el.classList.add('crying');if(Math.random()<.3)voice.call('sad');later(1800,tears);}
 function poke(){
  if(s.mood){mood(null);return;}
  if(el.dataset.pose==='sleep'){endAct();act('stretch',1500);return;}
  if(s.mode==='idle'||s.mode==='walk'){endAct();s.route=null;s.walk=null;act('poke',650);later(10,()=>{if(s.surf){b.vy=-Math.sqrt(2*G*14);b.vx=-s.face*40;s.mode='air';pose('jump');}});}
 }
 // Walking somewhere on the surface it is on, at a pace that suits the distance.
 // Bars that touch at one height are one walkway.
 function span(f){let l=f.l,r=f.r,grew=true;while(grew){grew=false;for(const p of all)if(!p.floor&&Math.abs(p.y-f.y)<2&&p.l<=r+8&&p.r>=l-8&&(p.l<l||p.r>r)){l=Math.min(l,p.l);r=Math.max(r,p.r);grew=true;}}return {l,r};}
 // Zoomies: a dash at full run to the far end of the bar it stands on, and straight back; a span of bars has gaps to fall through.
 function zoomies(){if(!s.surf||s.mood)return false;const w=s.surf,back=b.x,far=b.x-w.l>w.r-b.x?w.l+10:w.r-10;if(!walkTo(far,RUN))return false;s.walk.then='zoomback';s.zoomBack=back;voice.call('chirp');return true;}
 function walkTo(x,pace){const w=span(s.surf),t=Math.max(w.l+6,Math.min(w.r-6,x));if(Math.abs(t-b.x)<3)return false;s.walk={x:t,pace:pace||(Math.abs(t-b.x)>220?RUN:Math.abs(t-b.x)>90?TROT:WALK)};s.mode='walk';endAct();pose(s.walk.pace>=RUN?'run':'walk');return true;}
 const match=k=>all.find(p=>p.key===k);
 // The surface a spot on the page means: the one under it, else the nearest, a surface above the spot counting farther.
 function nearest(x,y){let best=null,d=Infinity;for(const p of all){if(p.floor)continue;const dx=Math.max(0,p.l-x,x-p.r),dy=p.y>=y-6?p.y-y:(y-p.y)*2.5,k=Math.hypot(dx,dy);if(k<d){d=k;best=p;}}return best;}
 /* A double-click drops a fish there: it falls from the pointer onto the surface below and waits. Getting there, the
    cat eats it in a few bites, does a trick, and says its line. A trip that is given up or cut short takes the fish away. */
 let goalEl=null,fish=null;const QUEST_WAIT=12000;
 function mark(q,at){if(!goalEl){goalEl=doc.createElement('i');goalEl.className='tl-cat-goal';goalEl.setAttribute('aria-hidden','true');fish=doc.createElement('i');fish.className='tl-food tl-cat-fish';goalEl.append(fish);doc.body.append(goalEl);}
  goalEl.hidden=false;fish.style.scale='';fish.classList.remove('got');s.feast=false;goalEl.style.transition='none';
  if(at)goalEl.style.transform=`translate(${at.x.toFixed(1)}px,${at.y.toFixed(1)}px)`;void goalEl.offsetWidth;
  goalEl.style.transition='transform .6s cubic-bezier(.3,1.55,.55,1)';later(650,()=>{if(goalEl)goalEl.style.transition='';});placeMark();}
 function placeMark(){if(!goalEl||goalEl.hidden)return;const q=s.quest?.goof?s.quest:s.feast;if(!q||!sc){goalEl.hidden=true;return;}const t=match(q.key);
  goalEl.style.transform=`translate(${(sc.box.left+q.x).toFixed(1)}px,${(sc.box.top+(t?t.y:q.y)).toFixed(1)}px)`;}
 // At the fish: a few bites, a trick, then the PR's line. The next step starts just before the last one ends.
 function feast(trip){const q=s.feast={key:trip.key,x:trip.x,y:trip.y};s.face=q.x>=b.x?1:-1;caption('Fish!',1100);voice.call('meow');voice.cue('tada');
  if(!act('eat',1800)){s.feast=false;return false;}win.setTimeout(()=>{if(s.feast===q){s.feast=false;placeMark();}},9000);
  [[420,.72],[900,.45],[1380,.2]].forEach(([ms,k])=>later(ms,()=>{if(s.act?.name==='eat'&&fish){fish.style.scale=String(k);voice.sfx('nom',{pitch:rand(.9,1.15)});}}));
  later(1760,()=>{if(fish)fish.classList.add('got');win.setTimeout(()=>{if(s.feast===q){s.feast=false;placeMark();}},400);
   if(s.act?.name!=='eat')return;
   // Yummy: a happy meow, hearts, a lick of the lips, then a trick and the PR's line.
   say(pet&&fed()?`Thank you! ${catName} is full`:YUM[Math.floor(Math.random()*YUM.length)],1500);voice.call('meow',{pitch:1.08});for(let i=0;i<3;i++)later(i*180,()=>glyph('heart','\u2665'));
   act('groom',1100);later(1080,()=>{if(s.act?.name!=='groom')return;const [name,label,ms]=REACTIONS[Math.floor(Math.random()*REACTIONS.length)];if(act(name,ms))caption(label,ms);
    later(ms-40,()=>{if(s.act?.name===name&&s.mode==='idle')readLine();});});});
  return true;}
 // The next hop of a route: walk to the takeoff, crouch, then leap with the launch the arc needs.
 function nextHop(){
  const next=s.route?.[0]&&(match(s.route[0].key)||all.find(p=>Math.abs(p.y-s.route[0].y)<4&&p.r>s.route[0].l&&p.l<s.route[0].r));
  if(!next){s.route=null;return false;}
  const hp=hopPoints(s.surf,next,b.x);
  if(Math.abs(hp.from-b.x)>3&&walkTo(hp.from,TROT)){s.walk.then='hop';return true;}
  const to={x:s.goal?.pounce&&s.route.length===1?Math.max(next.l+10,next.r-14):hp.to,y:next.y};
  s.hop={to,key:next.key,up:upFrom(s.surf,next),through:next.y>s.surf.y+6&&((next.perch==='pick'&&s.surf.perch!=='pick')||(s.surf.perch&&s.surf.perch!=='pick')||next.inner)?next.y-2:null};s.mode='prep';s.prepUntil=now()+crouchFor(b,to)+(s.goal?.pounce&&s.route.length===1?900:0);s.face=to.x>=b.x?1:-1;pose('crouch');set('act',s.goal?.pounce&&s.route.length===1?'stalk':null);
  return true;
 }
 function goTo(target,goal={}){const r=route(all,s.surf,target);if(!r?.length)return false;s.route=r;s.goal=goal;return nextHop();}
 // While the page animates, such as the orb flying between stations, its target can be missing or out of reach for a
 // while: it keeps the fish and tries again until QUEST_WAIT runs out.
 function quest(){
  const q=s.quest;q.until??=now()+QUEST_WAIT;const late=now()>q.until;
  const t=match(q.key)||all.find(p=>!p.floor&&Math.abs(p.y-q.y)<4&&q.x>=p.l-4&&q.x<=p.r+4);if(!t){if(!late)return act('look',600);s.quest=null;return false;}
  if(s.surf&&!s.surf.floor&&Math.abs(s.surf.y-t.y)<2){const w=span(s.surf);if(q.x>=w.l-2&&q.x<=w.r+2&&(s.surf.key!==t.key||Math.abs(b.x-q.x)>10)&&!q.walked){q.walked=true;if(walkTo(q.goof?q.x-(q.x>=b.x?1:-1)*CAT_W*.42:q.x))return true;}}
  // To a fish it stops just short, facing it, rather than standing on it.
  const to=q.goof?q.x-(q.x>=b.x?1:-1)*CAT_W*.42:q.x;
  if(s.surf===t||s.surf?.key===t.key){if(Math.abs(b.x-to)>10&&!q.walked){q.walked=true;return walkTo(to);}s.quest=null;voice.call('trill');
   if(q.goof)return feast(q);return act('hello',1900);}
  if(q.detours>0){q.detours--;const r=Math.random(),away=((t.l+t.r)/2>b.x?-1:1)*rand(40,90);
   if(q.goof&&r<.3){const [name,label,ms]=REACTIONS[Math.floor(Math.random()*REACTIONS.length)];if(act(name,ms)){caption(label,ms);return true;}}
   if(r<.35&&walkTo(b.x+away))return true;
   if(r<.7){glyph('head','?');return act('look',rand(700,1100));}
   const nb=all.filter(p=>p!==s.surf&&!p.floor&&p.key!==t.key&&canHop(s.surf,p));if(nb.length&&goTo(nb[Math.floor(Math.random()*nb.length)]))return true;}
  if(goTo(t))return true;
  // Out of reach: it gets as close as it can underneath and looks up at it.
  if(!late){if(!q.under){q.under=true;if(walkTo((t.l+t.r)/2))return true;}return act('look',700);}
  s.quest=null;glyph('head','?');voice.call('mew');return walkTo((t.l+t.r)/2)||act('look',1400);
 }
 /* Over the end of its walkway: to hang there and drop onto the bar below, or, now and then, to slip off where nothing is
    below. Ends at the view's edge are left alone, since the bar runs on out of sight there. */
 function overEdge(kind){const w=span(s.surf),spots=edgeSpots(w,s.surf.y,all,{left:sc.left+CAT_W/2,right:sc.right-CAT_W/2})[kind];
  const at=spots[Math.floor(Math.random()*spots.length)];if(!at)return false;
  s.edge={kind,...at};if(walkTo(at.side<0?w.l+4:w.r-4,TROT))s.walk.then=kind;else if(kind==='hang')hang();else slip();return true;}
 function hang(){const e=s.edge;if(!e||!s.surf)return;s.mode='hang';s.face=e.side;s.front=true;b.x=e.x;b.y=s.surf.y+(e.depth??HANG);b.vx=0;b.vy=0;
  s.hang={t0:now(),until:now()+rand(1400,2800),top:s.surf.y,depth:e.depth??HANG};set('act','hang');pose('stand');voice.call('mrrp');caption('Hanging on',1800);}
 function letGo(){const vx=s.edge?.vx??s.face*24;s.front=false;set('act',null);s.hang=null;s.edge=null;s.mode='air';s.surf=null;b.vx=vx;b.vy=0;pose('jump');caption('Let go!',1100);}
 /* The timeline's upright lines, where each round starts, now and the stops, are ropes. It walks to one that runs past
    its bar, grabs it and climbs hand over hand: down, now and then up a little first, letting go to drop onto the bar
    below, or up and onto the bar above. */
 const ROPES='.jl-tl-link,.jl-tl-push,.jl-tl-stop,.jl-tl-now,.jl-tl-future-tick,.jl-rg-thru',CLIMB={speed:40,pull:2.4,sway:7,grip:CAT_H*1.3,clear:14};
 // A link between a push and its checks is drawn by its left border; the other lines by their middle.
 const lineX=(e,r)=>(e.classList.contains('jl-tl-link')?r.left:r.left+r.width/2);
 function ropeLines(){if(!sc)return [];return joinRopes([...sc.view.querySelectorAll(ROPES)].map(e=>{const r=e.getBoundingClientRect();return {el:e,x:lineX(e,r)-sc.box.left,top:r.top-sc.box.top,bot:r.bottom-sc.box.top};}))
  .filter(r=>r.bot-r.top>60&&r.x>sc.left+CAT_W&&r.x<sc.right-CAT_W);}
 // The pieces of one rope: its first element stands for it, the rest swing with it from its top.
 const pieces=e=>e.__rope||[e];
 const bars=x=>all.filter(p=>!p.perch&&p.l-4<x&&p.r+4>x);
 function climb(){if(!s.surf||s.surf.perch)return false;const w=span(s.surf),y=s.surf.y;
  const found=ropeLines().filter(r=>r.x>w.l-24&&r.x<w.r+24&&r.top<y+14).map(r=>({r,down:r.bot-y>CAT_H*.6,below:bars(r.x).filter(p=>p.y>y+CAT_H).sort((a,c)=>a.y-c.y)[0],above:bars(r.x).filter(p=>p.y<y-CAT_H&&p.y-CAT_H>r.top-4).sort((a,c)=>c.y-a.y)[0]}))
   .filter(o=>o.down||o.above);
  if(!found.length)return false;const o=found[Math.floor(Math.random()*found.length)],down=o.down&&(!o.above||Math.random()<.65);
  // Down, it lets go just over the bar below, or at the rope's end and drops the rest of the way.
  s.climb={el:o.r.el,to:down?{bar:o.below,foot:Math.min(o.r.bot+CAT_H*.35,o.below?o.below.y-CLIMB.clear:Infinity),down:true}:{bar:o.above,down:false}};
  if(walkTo(Math.max(w.l+6,Math.min(w.r-6,o.r.x)),TROT))s.walk.then='climb';else grabRope();return true;}
 function ropeX(c){const r=c.el.getBoundingClientRect();return lineX(c.el,r)-sc.box.left;}
 /* Like the stations' line, it is a rope: the cat's weight swings it as it climbs, and let go, it swings on and
    settles. */
 const SWAY={k:60,c:2.2,pull:1.2,kick:9,sub:1/240},sway=new Map();
 function swayStep(dt){if(!sway.size||!dt)return;
  for(const [e,w] of sway){if(!e.isConnected){sway.delete(e);continue;}const held=s.climb?.el===e&&s.mode==='climb',to=held?w.pull:0;
   for(let left=dt;left>1e-6;left-=SWAY.sub){const h=Math.min(SWAY.sub,left);w.om+=(-SWAY.k*(w.th-to)-SWAY.c*w.om)*h;w.th+=w.om*h;}
   if(!held&&Math.abs(w.th)<.01&&Math.abs(w.om)<.05){for(const p of pieces(e))p.style.rotate='';sway.delete(e);continue;}for(const p of pieces(e))p.style.rotate=`${w.th.toFixed(3)}deg`;}}
 const swing=(e,kick)=>{const w=sway.get(e)||{th:0,om:0,pull:0};w.om+=kick;sway.set(e,w);return w;};
 function grabRope(){const c=s.climb;if(!c||!s.surf||!c.el.isConnected){dropRope();return;}const y=s.surf.y,{bar,down,foot}=c.to,top=c.el.getBoundingClientRect().top-sc.box.top;
  // Legs: where its feet go, one after another. Going down it sometimes climbs a little way up first.
  c.legs=down?[...(Math.random()<.35&&y-top>CAT_H*1.6?[y-rand(14,Math.min(40,y-top-CAT_H))]:[]),Math.max(y+CLIMB.grip,foot)]:[bar.y];
  b.y=y+(down?CLIMB.grip:0);b.x=ropeX(c);b.vx=b.vy=0;s.surf=null;s.mode='climb';s.front=true;s.back=true;c.t0=now();for(const p of pieces(c.el)){p.classList.add('tl-cat-rope');if(p!==c.el)p.style.transformOrigin=`${p.classList.contains('jl-tl-link')?'0':'50%'} ${(top-(p.getBoundingClientRect().top-sc.box.top)).toFixed(1)}px`;}swing(c.el,(Math.random()<.5?-1:1)*SWAY.kick);set('act','climb');pose('stand');
  voice.call('mrrp');caption(down?'Down the rope':'Up the rope',1600);}
 function climbStep(t,dt){const c=s.climb;if(!c?.legs||!c.el.isConnected){dropRope();s.mode='air';pose('jump');return;}
  const k=(t-c.t0)/1000,beat=Math.sin(k*CLIMB.pull*Math.PI),goal=c.legs[0],d=goal-b.y;
  // Hand over hand: it pulls, eases, pulls again, swinging the rope a little each time.
  b.y+=Math.sign(d)*Math.min(Math.abs(d),CLIMB.speed*(.3+.7*Math.abs(beat))*dt);b.x=ropeX(c)+beat*1.5;s.tilt=beat*CLIMB.sway;s.face=beat>=0?1:-1;
  swing(c.el,0).pull=-beat*SWAY.pull;
  if(Math.abs(goal-b.y)>.5)return;c.legs.shift();if(c.legs.length)return;
  const {bar,down}=c.to,p=bar&&(all.find(q=>q.key===bar.key)||bar);dropRope();s.tilt=0;
  if(down){s.mode='air';s.surf=null;s.hop=null;b.vx=0;b.vy=0;pose('jump');caption('Wheee!',1100);voice.call('chirp');}
  else{b.y=p.y;land(p,200);caption('Made it!',1200);}}
 function dropRope(){const c=s.climb;s.climb=null;s.front=false;s.back=false;if(!s.act)set('act',null);if(c?.el){for(const p of pieces(c.el))p.classList.remove('tl-cat-rope');if(c.el.isConnected)swing(c.el,(Math.random()<.5?-1:1)*SWAY.kick);}}
 // A slip is a real fall: nothing catches it on the way down, and it drops out of the timeline.
 function slip(){const e=s.edge;s.edge=null;if(!e)return;s.face=e.side;b.x=e.x;b.vx=e.side*60;b.vy=-120;s.mode='air';s.surf=null;s.falling=true;s.fallFrom=b.y;pose('jump');glyph('head','!');voice.call('protest');caption('Whoops!',1400);}
 // To the end of the bar that runs out of view, where the timeline scrolls to show the rounds beyond it.
 // To look at rounds out of view it heads for the timeline's edge on that side, hopping over to a bar that reaches it.
 function scout(){if(s.surf?.perch)return false;const v=sc.view,sides=[v.scrollLeft>4?-1:0,v.scrollLeft<v.scrollWidth-v.clientWidth-4?1:0].filter(Boolean);if(!sides.length)return false;
  const side=sides[Math.floor(Math.random()*sides.length)],w=span(s.surf),x=side<0?w.l+6:w.r-6;
  caption(side<0?'Checking the earlier rounds':'Checking what is next',1800);
  if(side<0?x<=sc.left+60:x>=sc.right-60)return walkTo(x,TROT);
  const edge=all.filter(p=>!p.floor&&!p.perch&&(side<0?p.l<=sc.left+40:p.r>=sc.right-40)).sort((a,c)=>Math.abs(a.y-s.surf.y)-Math.abs(c.y-s.surf.y))[0];
  return Boolean(edge&&goTo(edge,{scout:side}));}
 /* Mischief: it climbs up to a station and messes with it, swatting and yanking the station about while it rides it.
    The stations hang on the journey's line like beads on a rope: pulled taut, the rope drags the next stations along,
    and where it goes slack it sags. Let go, the stations drift back loosely a few seconds, then spring home. */
 const MESS=['Rearranging your stations','This one goes over here','Fixing the pipeline myself','Who put this here?','Helping'];
 const TUG=['Tug of war!','Pulling the rope','Mine now'];
 const ROPE={home:42,loose:7,damp:9,slack:4,rope:70,give:1.03,grab:120,reach:56,sub:1/240,rest:4200};
 let rope=null;
 function ropeOf(li){
  if(rope?.nodes.some(n=>n.li===li)&&rope.nodes.every(n=>n.li.isConnected))return rope;ropeReset();
  const inner=li.closest('.jl-inner'),paths=inner?[...inner.querySelectorAll('svg.jl-sky:not(.jl-orbits):not(.jl-forks) path.jl-wave:not(.jl-wave-run)')]:[];
  const svg=paths[0]?.ownerSVGElement,sr=svg?.getBoundingClientRect(),vb=svg?.viewBox?.baseVal;if(!sr?.width||!sr.height||!vb?.width)return null;
  const nodes=[...inner.querySelectorAll('.jl-station:not([hidden])')].map(li=>{const r=li.getBoundingClientRect();return {li,hx:r.left-sr.left,hy:r.top-sr.top,x:0,y:0,vx:0,vy:0,tx:null,ty:null};}).sort((a,c)=>a.hx-c.hx);
  if(nodes.length<2)return null;
  for(let i=1;i<nodes.length;i++){const n=nodes[i];n.base=Math.hypot(n.hx-nodes[i-1].hx,n.hy-nodes[i-1].hy);n.rest=n.base*ROPE.give;}
  // The orb and pin that mark the station the PR is at move with that station.
  const riders=[...inner.querySelectorAll('.jl-orb,.jl-pin')].map(e=>{const r=e.getBoundingClientRect(),cx=r.left+r.width/2-sr.left;return {e,n:nodes.find(n=>Math.abs(n.hx-cx)<3)};}).filter(r=>r.n);
  rope={nodes,paths,d0:paths.map(p=>p.getAttribute('d')),riders,ux:vb.width/sr.width,uy:vb.height/sr.height,loose:now()};
  return rope;
 }
 function ropeReset(){if(!rope)return;for(const n of rope.nodes){n.li.style.translate='';n.li.classList.remove('tl-cat-shoved');}for(const r of rope.riders)r.e.style.translate='';
  rope.paths.forEach((p,i)=>rope.d0[i]==null?p.removeAttribute('d'):p.setAttribute('d',rope.d0[i]));rope=null;}
 function ropeStep(dt){
  if(!rope||!dt)return;if(!rope.nodes.every(n=>n.li.isConnected)){rope=null;return;}
  const {nodes}=rope,loose=now()<rope.loose,kh=loose?ROPE.loose:ROPE.home,c=loose?ROPE.slack:ROPE.damp;
  for(let left=dt;left>1e-6;left-=ROPE.sub){const h=Math.min(ROPE.sub,left);
   for(const n of nodes){n.ax=-kh*n.x-c*n.vx;n.ay=-kh*n.y-c*n.vy;if(n.tx!=null){n.ax+=ROPE.grab*(n.tx-n.x)-8*n.vx;n.ay+=ROPE.grab*(n.ty-n.y)-8*n.vy;}}
   for(let i=1;i<nodes.length;i++){const a=nodes[i-1],z=nodes[i],dx=z.hx+z.x-a.hx-a.x,dy=z.hy+z.y-a.hy-a.y,len=Math.hypot(dx,dy)||1;
    if(len>z.rest){const f=ROPE.rope*(len-z.rest)/len;a.ax+=f*dx;a.ay+=f*dy;z.ax-=f*dx;z.ay-=f*dy;}}
   for(const n of nodes){n.vx+=n.ax*h;n.vy+=n.ay*h;n.x=Math.max(-ROPE.reach,Math.min(ROPE.reach,n.x+n.vx*h));n.y=Math.max(-ROPE.reach*.6,Math.min(ROPE.reach,n.y+n.vy*h));}}
  if(!loose)for(const n of nodes)n.tx=n.ty=null;
  if(!loose&&nodes.every(n=>n.tx==null&&Math.abs(n.x)+Math.abs(n.y)<.4&&Math.abs(n.vx)+Math.abs(n.vy)<2)){ropeReset();return;}
  for(const n of nodes)n.li.style.translate=`${n.x.toFixed(1)}px ${n.y.toFixed(1)}px`;
  for(const r of rope.riders)r.e.style.translate=`${r.n.x.toFixed(1)}px ${r.n.y.toFixed(1)}px`;
  const d=ropePath(rope);for(const p of rope.paths)p.setAttribute('d',d);
 }
 // The line through the stations where they now hang, sagging between two that have come closer than its length.
 function ropePath({nodes,ux,uy}){const X=n=>((n.hx+n.x)*ux).toFixed(1),Y=n=>((n.hy+n.y)*uy).toFixed(1),y0=(nodes[0].hy*uy).toFixed(1);
  let d=`M0 ${y0} L${X(nodes[0])} ${Y(nodes[0])}`;
  for(let i=1;i<nodes.length;i++){const a=nodes[i-1],z=nodes[i],len=Math.hypot(z.hx+z.x-a.hx-a.x,z.hy+z.y-a.hy-a.y),sag=Math.max(0,z.base-len)*.7;
   d+=` Q${(((a.hx+a.x+z.hx+z.x)/2)*ux).toFixed(1)} ${(((a.hy+a.y+z.hy+z.y)/2+sag*2)*uy).toFixed(1)} ${X(z)} ${Y(z)}`;}
  return `${d} L1000 ${y0}`;}
 /* The bars are planks on springs. Landing on one shoves it down and tips it toward the end the cat landed nearer; it
    rocks back past level, wobbles a few times smaller each time, and settles, sagging a little under the cat while it
    stands there. Pushing off kicks it, every step jiggles it, and a wave runs out along it from under the cat's feet.
    The cat rides it, tilting with it. */
 const WOB={k:170,c:3.4,tk:190,tc:3.2,sub:1/240,push:.22,most:170,spin:.42,sag:2.2,lean:.012,end:9,amp:2,len:150,wave:84,hz:3.2,fade:1.6,stepWave:.12};
 const wob=new Map(),barIds=new WeakMap();let barN=0;
 const barKey=e=>{let id=barIds.get(e);if(!id){id=++barN;barIds.set(e,id);}return `bar:${id}`;};
 // Where the bar is without its tilt: the box of a rotated bar grows, but its centre stays put.
 function barRect(e){const r=e.getBoundingClientRect();if(!wob.has(e))return r;const cx=(r.left+r.right)/2,cy=(r.top+r.bottom)/2,W=e.offsetWidth,H=e.offsetHeight;
  return {left:cx-W/2,right:cx+W/2,top:cy-H/2,width:W};}
 function jiggle(el,vy,x,step=false){if(!el?.isConnected||reducedMotion())return;const w=wob.get(el)||{y:0,v:0,th:0,om:0,a:0,x0:x,t0:now(),cx:x,W:el.offsetWidth||100};
  const r=barRect(el);w.cx=(r.left+r.right)/2-sc.box.left;w.W=el.offsetWidth||w.W;
  const J=Math.max(-WOB.most,Math.min(WOB.most,vy*WOB.push));w.v+=J;w.om+=J*(x-w.cx)*6/(w.W*w.W)*WOB.spin;
  // A step only stirs a faint ripple; a landing sends a real wave.
  const hit=Math.min(1,Math.abs(vy)/650)*(step?.25:1);if(!step&&hit>w.a*.5||w.a<.03){w.x0=x;w.t0=now();}w.a=Math.min(step?Math.max(w.a,WOB.stepWave):1,w.a+hit);wob.set(el,w);}
 // How far the bar's top under x sits below its middle, from its tilt.
 const tiltAt=(w,x)=>(x-w.cx)*Math.tan(w.th);
 function wobStep(dt){if(!wob.size||!dt)return;const t=now();
  for(const [el,w] of wob){if(!el.isConnected){wob.delete(el);continue;}
   const on=s.surf?.el===el&&!['air','carry','peek','hang','climb'].includes(s.mode),most=Math.min(.07,WOB.end/(w.W/2||1));
   const yEq=on?WOB.sag:0,thEq=on?Math.max(-most,Math.min(most,WOB.lean*2*(b.x-w.cx)/(w.W||1))):0;
   for(let left=dt;left>1e-6;left-=WOB.sub){const h=Math.min(WOB.sub,left);
    w.v+=(-WOB.k*(w.y-yEq)-WOB.c*w.v)*h;w.y+=w.v*h;w.om+=(-WOB.tk*(w.th-thEq)-WOB.tc*w.om)*h;w.th=Math.max(-most,Math.min(most,w.th+w.om*h));}
   w.a*=Math.exp(-dt*WOB.fade);
   if(!on&&Math.abs(w.y)<.15&&Math.abs(w.v)<2&&Math.abs(w.th)<.0005&&Math.abs(w.om)<.01&&w.a<.03){el.style.translate='';el.style.rotate='';el.style.clipPath='';wob.delete(el);continue;}
   el.style.translate=`0 ${w.y.toFixed(2)}px`;el.style.rotate=`${w.th.toFixed(4)}rad`;
   const W=el.offsetWidth,H=el.offsetHeight,A=WOB.amp*w.a;if(!W||A<.15){el.style.clipPath='';continue;}
   const x0=w.x0-(w.cx-W/2),ph=(t-w.t0)/1000*WOB.hz*Math.PI*2,top=[],bot=[];
   for(let x=0;x<=W+.1;x+=Math.max(8,W/48)){const d=Math.abs(x-x0),y=A*Math.exp(-d/WOB.len)*Math.sin(d/WOB.wave*Math.PI*2-ph);top.push(`${x.toFixed(1)}px ${(A+y).toFixed(2)}px`);bot.unshift(`${x.toFixed(1)}px ${(H-A+y).toFixed(2)}px`);}
   el.style.clipPath=`polygon(${top.concat(bot).join(',')})`;}}
 /* The PR chips below the timeline and each station's subtitle pill are loose chips: landing knocks one down and along,
    each step nudges it, and the cat shoves a PR chip along its row into the next. The key's boxes and the header's
    controls, in CHIP_ROW, are perches that stay put. */
 const CHIP_ROW='.jl-tl[data-tl-id] .jl-tl-key > span, .jl-tl[data-tl-id] .jl-tl-mode .segmented, .jl-tl[data-tl-id] .jl-cat-pick, .jl-tl[data-tl-id] .jl-tl-span .segmented';
 const chips=new Map();
 // Only up and down unless the host lets cards slide: a box pushed sideways in a free layout reads as the page breaking.
 function nudge(e,vx,vy){if(!e?.isConnected||reducedMotion())return;const c=chips.get(e)||{x:0,y:0,vx:0,vy:0},m=CHIP.most;
  if(slide){c.vx+=Math.max(-m,Math.min(m,vx));c.vy+=Math.max(-m,Math.min(m,vy));}else c.vy+=Math.max(-m,Math.min(m,vy+Math.abs(vx)*.15));chips.set(e,c);}
 const homeOf=e=>{const r=e.getBoundingClientRect(),c=chips.get(e)||{x:0,y:0,vx:0,vy:0};return {e,c,l:r.left-c.x,r:r.right-c.x,t:r.top-c.y,b:r.bottom-c.y};};
 function chipsStep(dt){if(!chips.size||!dt)return;
  for(const [e,c] of chips){if(!e.isConnected){chips.delete(e);continue;}chipSpring(c,dt,s.surf?.chip===e&&!['air','carry','peek','hang','climb'].includes(s.mode)?CHIP.sag:0);}
  // Sliding cards in a row knock into the next one along.
  if(slide){const row=[...doc.querySelectorAll(`${PICKS},${RJ_PICKS},${HOME_PICKS}`)].map(homeOf).sort((a,c)=>Math.round(a.t/12)-Math.round(c.t/12)||a.l-c.l);
   for(let i=0;i+1<row.length;i++){const a=row[i],n=row[i+1];if(a.b<=n.t||n.b<=a.t||!(chips.has(a.e)||chips.has(n.e)))continue;
    if(bump(a,n)){chips.set(a.e,a.c);chips.set(n.e,n.c);}}}
  for(const [e,c] of chips){const on=s.surf?.chip===e&&!['air','carry','peek','hang','climb'].includes(s.mode);
   if(!slide)c.x=c.vx=0;if(!on&&chipAtRest(c)){e.style.translate='';chips.delete(e);continue;}e.style.translate=`${c.x.toFixed(2)}px ${c.y.toFixed(2)}px`;}}
 function unchipAll(){for(const e of chips.keys())e.style.translate='';chips.clear();for(const e of rolls.keys()){e.style.rotate='';wheel(e,false);}rolls.clear();}
 /* Log rolling, as on a log in the water: a round shape it lands on spins with the landing, its paws turn it as it
    walks or jumps off, and its top carries the cat along, so the cat treads against the spin to stay up or tumbles
    off. Left alone it slows and turns back upright. Spin is in degrees a second; clockwise moves the top rightward. */
 const rolls=new Map(),ROLL={grip:.55,carry:.6,tread:.25,push:4,drag:.9,most:900};
 const radOf=e=>Math.max(12,(e.offsetHeight??e.getBoundingClientRect().height)/2),topSpeed=e=>(rolls.get(e)?.w||0)*Math.PI/180*radOf(e);
 // While a log turns it shows as a wheel, spokes and tread, so the spin can be seen on a plain circle.
 function wheel(e,on){if(on){if(win.getComputedStyle(e).position==='static'){e.style.position='relative';e.dataset.catWheelPos='';}e.classList.add('tl-cat-wheel');return;}
  e.classList.remove('tl-cat-wheel');if('catWheelPos' in e.dataset){e.style.position='';delete e.dataset.catWheelPos;}}
 function spin(e,v){if(!e?.isConnected||reducedMotion())return;let q=rolls.get(e);if(!q){q={a:0,w:0};wheel(e,true);}q.w=Math.max(-ROLL.most,Math.min(ROLL.most,q.w+v/radOf(e)*180/Math.PI));rolls.set(e,q);}
 function rollsStep(dt){if(!rolls.size||!dt)return;
  for(const [e,q] of rolls){if(!e.isConnected){wheel(e,false);rolls.delete(e);continue;}q.w*=Math.exp(-ROLL.drag*dt);q.a+=q.w*dt;
   if(Math.abs(q.w)<30){const up=Math.round(q.a/360)*360;q.a+=(up-q.a)*Math.min(1,dt*2.5);if(Math.abs(q.w)<2&&Math.abs(up-q.a)<.5&&s.surf?.roll!==e){e.style.rotate='';wheel(e,false);rolls.delete(e);continue;}}
   e.style.rotate=`${(q.a%360).toFixed(1)}deg`;}}
 // On a log: walking turns it under its paws; standing on a fast one it runs in place against the spin.
 function rollUnder(e,dt){const v=topSpeed(e);
  if(s.mode==='walk'){spin(e,-b.vx*dt*ROLL.push);b.x+=v*ROLL.carry*dt;return;}
  if(Math.abs(v)>45&&s.mode==='idle'&&!s.act&&!s.mood){if(!s.tread){s.tread=true;pose('run');}s.face=v>0?-1:1;spin(e,s.face*dt*20);b.x+=v*ROLL.carry*ROLL.tread*dt;return;}
  b.x+=v*ROLL.carry*dt;untread();}
 function untread(){if(!s.tread)return;s.tread=false;if(s.mode==='idle'&&!s.act)pose('stand');}
 // Up on a chip it walks to the end nearer the next one along and shoves it, and the row knocks on.
 function shove(){const here=s.surf;if(here?.perch!=='pick')return false;
  const next=all.filter(p=>p.chip&&p.perch===here.perch&&p!==here&&Math.abs(p.y-here.y)<8).sort((a,c)=>Math.abs(a.l-here.l)-Math.abs(c.l-here.l))[0];if(!next)return false;
  const dir=next.l>here.l?1:-1,x=dir>0?here.r-10:here.l+10;s.shoving={chip:next.chip,dir};
  if(Math.abs(x-b.x)<4){shoveNow();return true;}s.walk={x,pace:WALK,then:'shove'};s.mode='walk';endAct();pose('walk');return true;}
 function shoveNow(){const w=s.shoving;s.shoving=null;if(!w?.chip?.isConnected)return;s.face=w.dir;act('swat',800);
  later(260,()=>{if(s.act?.name!=='swat')return;nudge(w.chip,w.dir*CHIP.shove*rand(.8,1.25),-rand(20,60));voice.cue('swat');if(Math.random()<.4)caption(SHOVE[Math.floor(Math.random()*SHOVE.length)],1400);});}
 function unwobAll(){for(const el of wob.keys()){el.style.translate='';el.style.rotate='';el.style.clipPath='';}wob.clear();}
 function ropeAt(li){const R=ropeOf(li);return R?.nodes.find(n=>n.li===li)||null;}
 // Its weight on a station: landing bounces it down and sideways, pushing off kicks it back, and the rope passes it on.
 function kick(li,vy,vx){const n=li&&ropeAt(li);if(!n)return;n.vy+=Math.max(-160,Math.min(300,vy*.28));n.vx+=Math.max(-160,Math.min(160,vx*.22));
  rope.loose=Math.max(rope.loose,now()+1600);li.classList.remove('tl-cat-shoved');void li.offsetWidth;li.classList.add('tl-cat-shoved');}
 /* Up on the journey it stays a good while: it hops from station to station over the rope, bouncing each one it lands on,
    and stops at some to mess with them. Then it goes back down to the bars, and before long climbs back up. */
 const SHOVE=['Move it','Scoot','Mine now','Out of the way','Boop'];
 /* It shares its time evenly between three places: the journey's stations, the timeline's bars (scrolling the rounds
    left and right), and the PR chips below. It stays a good while in each, then makes its way to the next, the page
    scrolling to follow. */
 const ZONE={stay:[25000,40000],first:[6000,12000],order:['timeline','top','chips'],miss:15,say:{top:'Up to the journey',timeline:'Back to work',chips:'Off to the PRs'},home:{timeline:'Up the shelves',chips:'Box time'}};
 const zoneSay=z=>sc?.id==='home'&&ZONE.home[z]||ZONE.say[z];
 const zoneOf=p=>p?.li?'top':p?.perch==='pick'?'chips':'timeline';
 function goZone(z){if(z==='top')return climbUp();if(z==='timeline')return goDown();
  const low=all.filter(p=>p.perch==='pick').sort((a,c)=>Math.abs((a.l+a.r)/2-b.x)-Math.abs((c.l+c.r)/2-b.x));
  return Boolean(low.length&&goTo(low[Math.floor(Math.random()*Math.min(3,low.length))]));}
 /* Its toys on the Projects page. They stay out while the cat is wanted there, even when it is away for a while; it
    bats one as it walks or lands into it, goes after them, the yarn most, and plays with one it reaches: a few swats
    in a row that knock it about. The yarn unwinds as it goes, and its thread is left strewn over the cards. A click
    tosses a toy up and away from the side it was hit on. The thread stays out until the page changes. */
 /* Some of its hits catch the yarn's end and pull cord off as it rolls; most just send the ball rolling. A swat in play
    does so more than a bump in passing. A toss of yours always does. */
 const TOY_PAYS={swat:.3,bump:.15};
 // Where the toys are found: each on its own card in view where there are enough, anywhere along it, new every visit.
 // A host scene can ask for them on its first row of cards instead (firstRow).
 function scatterToys(cards){if(sc.firstRow){const top=Math.min(...cards.map(p=>p.home??p.y)),pool=cards.filter(p=>(p.home??p.y)<top+8);
   return TOYS.map(spec=>{const i=Math.floor(Math.random()*pool.length),p=pool[i];if(pool.length>1)pool.splice(i,1);return toyOn(spec,p,rand(.15,.85));});}
  const H=win.innerHeight,seen=cards.filter(p=>{const y=sc.box.top+p.y;return y>90&&y<H-40;}),pool=[...(seen.length?seen:cards)];
  return TOYS.map(spec=>{const i=Math.floor(Math.random()*pool.length),p=pool[i];if(pool.length>1)pool.splice(i,1);return toyOn(spec,p,rand(.15,.85));});}
 let toys=[],yarnEl=null,toysAfter=0;const toyEls=new Map(),TOY_SAY=['Mine!','Got it','Yarn!','Squeak','Again!'],MESS_SAY=['Oops','What mess?','Not me','Tangled'];
 function toyEl(t){let e=toyEls.get(t.kind);if(e)return e;e=doc.createElement('button');e.type='button';e.className=`tl-cat-toy toy-${t.kind}`;
  e.setAttribute('aria-label',t.kind==='yarn'?`${t.label}: click to toss`:`${t.label}: toss it`);e.innerHTML=TOY_SVG[t.kind];e.dataset.kind=t.kind;
  const mine=()=>toys.find(x=>x.kind===e.dataset.kind);
  e.addEventListener('click',ev=>{ev.preventDefault();ev.stopPropagation();const k=mine();if(k){const r=e.getBoundingClientRect();batToy(k,ev.clientX<r.left+r.width/2?1:-1,1.6);voice.cue?.('swat');jingle(k,1);}});
  // Quick clicks on a toy are just more tosses: they never wind the cord back up, nor reach the page's double-click.
  e.addEventListener('dblclick',ev=>{ev.preventDefault();ev.stopPropagation();});
  doc.body.append(e);toyEls.set(t.kind,e);return e;}
 // The bell ball rings when it is hit and when it lands hard; the others are quiet.
 function jingle(t,gain){if(t.kind!=='bell')return;if(music?.ring)music.ring('bell',{gain});else if(music?.on)speech.bell({gain});}
 function toysOff(){toys=[];for(const e of toyEls.values())e.remove();toyEls.clear();yarnEl?.remove();yarnEl=null;}
 function drawYarn(t){if(!yarnEl){yarnEl=doc.createElementNS('http://www.w3.org/2000/svg','svg');yarnEl.setAttribute('class','tl-cat-yarn');yarnEl.setAttribute('aria-hidden','true');
   yarnEl.innerHTML='<path class="yarn-shade"/><path class="yarn-line"/><path class="yarn-c1"/><path class="yarn-c2"/><path class="yarn-c3"/><path class="yarn-ply"/><circle class="yarn-pom" r="4.5"/>';doc.body.append(yarnEl);}
  // The cord runs on into the ball where it meets the card, a little behind it, and its pompom end lies where it began.
  const pts=t.thread.length?[...t.thread,t.cordTip||cordTip(t)]:[];
  const d=threadPath(pts,sc.box.left,sc.box.top);for(const p of yarnEl.querySelectorAll('path'))p.setAttribute('d',d);
  const pom=yarnEl.querySelector('.yarn-pom'),p0=t.thread[0];pom.style.display=p0?'':'none';
  if(p0){pom.setAttribute('cx',(sc.box.left+p0.x).toFixed(1));pom.setAttribute('cy',(sc.box.top+p0.y-2).toFixed(1));}}
 // Playing with a toy it has reached: three to five swats a beat apart, each knocking it a little way.
 function playToy(t){if(!t||s.mode!=='idle')return false;let beats=3+Math.floor(Math.random()*3);caption(t.kind==='yarn'?'Yarn!':TOY_SAY[Math.floor(Math.random()*TOY_SAY.length)],1200);
  const beat=()=>{if(!toys.includes(t)||!['idle','land'].includes(s.mode)||Math.abs(t.x-b.x)>CAT_W*1.4||Math.abs(t.y-b.y)>16)return;
   s.face=Math.sign(t.x-b.x)||s.face;act('swat',600);later(220,()=>{if(Math.abs(t.x-b.x)<CAT_W*1.4){batToy(t,Math.random()<.7?s.face:-s.face,rand(.35,.7),Math.random()<TOY_PAYS.swat);t.catBats=(t.catBats||0)+1;t.cool=now()+500;voice.cue?.('swat');jingle(t,.7);}});
   if(--beats>0)later(900,beat);else if(t.thread?.length>120&&Math.random()<.6)later(900,()=>caption(MESS_SAY[Math.floor(Math.random()*MESS_SAY.length)],1600));};
  beat();return true;}
 function toysStep(dt){
  if(!dt)return;
  if(sc?.id!=='home'){if(toys.length)toysOff();return;}
  // Away for a while, the toys are only put out of sight: the yarn keeps the cord it has lost.
  const out=!want()||reducedMotion();for(const e of toyEls.values())e.hidden=out;if(yarnEl)yarnEl.style.display=out?'none':'';if(out)return;
  const cards=all.filter(p=>p.perch==='pick');if(!toys.length&&(!cards.length||now()<toysAfter||!settled()))return;
  if(!toys.length)toys=scatterToys(cards);
  // Toys and their cord rest on the page, not on the floor that follows the window.
  const solid=sc.rest||all.filter(p=>!p.floor),page=solid.find(p=>p.key==='home:page');
  const walls={left:sc.left-CAT_W/2,right:sc.right+CAT_W/2,bottom:(page?.y??sc.bottom)+200};
  const near=!el.hidden&&s.surf&&['walk','land','idle'].includes(s.mode),H=win.innerHeight,ground=all.find(p=>p.key==='home:ground');
  /* What falls is caught at the bottom of the window, as the cat is, but once it comes to rest there that spot is a place
     on the page like any other and scrolls away with it. Each toy and the cord have their own. */
  const drop=(key,y)=>ground&&{l:ground.l,r:ground.r,y:y??ground.y,key};
  for(const t of toys){
   // Far off screen nothing moves them, and the boxes there are not tracked: they wait where they lie.
   const sy=sc.box.top+t.y;if(t.on&&(sy<-H||sy>2*H)){place(t);continue;}
   const dk=`home:drop:${t.kind}`;if(t.on!==dk)t.dropY=ground?.y;
   const mine=[...solid,drop(dk,t.dropY)].filter(Boolean);
   const fall=t.vy,step=toyStep(t,mine,dt,walls);if(step==='land'&&fall>260)jingle(t,Math.min(1,fall/900));
   if(t.thread?.length){
    // Its feet in the cord as it walks; at a trot or faster, a loop can catch on a back paw and come along for a stretch.
    const feet=near&&s.mode==='walk'&&pawCord(t,{x:b.x,y:b.y-2,w:CAT_W*.8,h:10,vx:b.vx},dt);
    if(feet!==false&&feet>=0)t.trod=(t.trod||0)+1;
    if(feet!==false&&feet>=0&&!t.snag&&Math.abs(b.vx)>=TROT&&Math.random()<dt*.4){t.snags=(t.snags||0)+1;t.snag={i:feet,until:now()+rand(900,1800)};caption('Tangled!',1200);voice.call?.('mrrp');}
    if(t.snag&&(now()>t.snag.until||s.mode==='air'||!s.surf||!t.thread[t.snag.i])){t.snag=null;if(s.mode==='idle'&&Math.random()<.5)act('groom',1400);}
    const hold=t.snag&&{i:t.snag.i,x:b.x-s.face*CAT_W*.32,y:b.y-5};
    if(!t.thread.some(q=>q.on==='home:cord'))t.cordY=ground?.y;
    cordStep(t,[...mine,drop('home:cord',t.cordY)].filter(Boolean),dt,{...walls,hold});if(!hold)payOut(t);
    // Pulled taut, the cord tows the ball after the cat.
    if(hold&&t.on){const k=cordStrain(t,hold.i);if(k>0)t.vx+=Math.sign(hold.x-t.x)*Math.min(900,k*40)*dt;}}
   if(step==='lost'){const p=mine.find(q=>q.key===dk)||page||cards[0];if(p)Object.assign(t,{x:Math.max(p.l+t.w,Math.min(p.r-t.w,t.x)),y:p.y,vx:0,vy:0,spin:0,on:p.key,onL:p.l});}
   if(near&&(s.mode!=='idle'||s.act?.name==='swat')&&(t.cool||0)<now()&&Math.abs(t.x-b.x)<CAT_W/2-6+t.w/2&&Math.abs(t.y-b.y)<12){
    batToy(t,Math.sign(t.x-b.x)||s.face,s.walk?.pace>=RUN?1.4:1,Math.random()<TOY_PAYS.bump);t.catBats=(t.catBats||0)+1;t.cool=now()+700;voice.cue?.('swat');jingle(t,1);
    if(Math.random()<.3)caption(TOY_SAY[Math.floor(Math.random()*TOY_SAY.length)],1100);}
   place(t);}
 }
 function place(t){const e=toyEl(t);e.style.width=`${t.w}px`;e.style.height=`${t.h}px`;e.style.transform=`translate(${(sc.box.left+t.x-t.w/2).toFixed(1)}px,${(sc.box.top+t.y-t.h+1).toFixed(1)}px)`;e.style.setProperty('--rot',`${t.rot.toFixed(2)}rad`);
  if(t.thread){e.classList.toggle('loose',t.loose);e.dataset.peel=t.left<1/3?'2':t.left<2/3?'1':'0';}
  if(t.thread)drawYarn(t);}
 /* A show, for a recording of the Projects page: the cat comes out and stays out, tells a cat joke every few seconds,
    and goes for its toys and its tricks far more than it naps. */
 const JOKES=['Why do I sit on the keyboard? To keep an eye on the mouse.','My code has nine lives. CI used eight.',"I don't push bugs. I push things off tables.",'What do cats open on GitHub? Purr requests.','Green checks? Purrfect.','Rebase? I prefer a nap base.','I reviewed your PR. I sat on it.','Merge conflict? I knock both off the desk.',"I'm not lazy. I'm in a CI wait.",'Ship it. Then push it off the shelf.','Yarn install. Yarn everywhere.','Tests pass when I am not looking.'];
 let showStill=false,showUntil=0,jokeAt=0,jokeN=0;
 // still: the page is laid out to be filmed whole, so the cat must not scroll it.
 function show(ms,{still=false}={}){showUntil=ms>0?now()+ms:0;showStill=ms>0&&still;awayUntil=0;jokeAt=now()+1500;jokeN=Math.floor(Math.random()*JOKES.length);return showUntil>0;}
 const showing=()=>showUntil>now();
 function showStep(){if(!showing()||el.hidden||g||now()<jokeAt)return;say(JOKES[jokeN++%JOKES.length],4200);voice.call(Math.random()<.5?'meow':'mrrp');jokeAt=now()+rand(6500,8500);}
 function showPlay(){if(!showing()||sc?.id!=='home')return false;const r=Math.random();
  if(r<.45&&startPlay())return true;
  if(r<.65){const [name,,ms]=REACTIONS[Math.floor(Math.random()*REACTIONS.length)];return act(name,ms);}
  return false;}
 /* Playing on its own, the way a cat does: it picks a toy (the yarn most) or, once the yarn is unwound, a stretch of
    its cord, and keeps at it for a few rounds. Each round it makes its way over, on the run if the toy is far, pouncing
    onto another card when it is there, waits and watches while the toy is still rolling, then swats it about; the next
    round goes after wherever that sent it. */
 function startPlay(){const rest=toys.filter(x=>x.on);if(!rest.length)return false;
  const yarn=toys.find(x=>x.kind==='yarn'),cord=yarn?.thread?.length>30&&Math.random()<.25;
  // Every toy gets its turn: the longer one has gone unplayed, the likelier it is next.
  const weight=x=>x.playedAt?1+Math.min(4,(now()-x.playedAt)/15000):5;
  let pick=Math.random()*rest.reduce((a,x)=>a+weight(x),0),t=rest[0];for(const x of rest){pick-=weight(x);if(pick<=0){t=x;break;}}
  if(cord)t=yarn;t.playedAt=now();
  s.play={t,cord,rounds:3+Math.floor(Math.random()*4),until:now()+45000,at:cord?pickStrand(t):null};
  caption(cord?'String!':{yarn:'Yarn time',mouse:'Hunting',bell:'Jingle!'}[t.kind]||'Mine!',1200);return playOn();}
 // A stretch of cord lying on something it can reach, nearest first.
 function pickStrand(t){const on=t.thread.filter(q=>q.on);if(!on.length)return null;const q=on.sort((a,c)=>Math.abs(a.x-b.x)-Math.abs(c.x-b.x))[Math.floor(Math.random()*Math.min(8,on.length))];return {x:q.x,on:q.on};}
 function playOn(){const P=s.play;if(!P||!toys.includes(P.t)||P.rounds<=0||now()>P.until){s.play=null;return false;}
  const t=P.t,aim=P.cord?P.at:t.on?{x:t.x,on:t.on}:null;
  if(!aim){if(P.cord){P.at=pickStrand(t);P.rounds--;return act('look',600);}s.face=Math.sign(t.x-b.x)||s.face;return act('look',700);}
  const on=/^home:(page|drop|cord)/.test(aim.on)?'home:ground':aim.on;
  if(on!==s.surf?.key){const p=all.find(q=>q.key===on);P.rounds--;return Boolean(p&&goTo(p,{pounce:true}))||act('look',800);}
  const gap=aim.x-b.x;
  if(Math.abs(gap)>CAT_W*.7)return walkTo(aim.x-Math.sign(gap)*CAT_W*.5,Math.abs(gap)>200?RUN:TROT)||act('look',600);
  P.rounds--;
  if(!P.cord)return playToy(t);
  // At the cord: two or three quick swats at the strands in front of its paws, flicking them up.
  s.face=Math.sign(gap)||s.face;let beats=2+Math.floor(Math.random()*2);
  const beat=()=>{if(s.mode!=='idle'&&s.mode!=='land')return;act('swat',560);later(200,()=>{if(pawCord(t,{x:b.x+s.face*CAT_W*.42,y:b.y-2,w:30,h:16,swat:true,dir:Math.random()<.75?s.face:-s.face},1/60)>=0){t.cordSwats=(t.cordSwats||0)+1;voice.cue?.('swat');}});
   if(--beats>0)later(760,beat);else{P.at=pickStrand(t);if(Math.random()<.4)later(800,()=>caption(MESS_SAY[Math.floor(Math.random()*MESS_SAY.length)],1400));}};
  beat();return true;}
 // After a toy, the yarn most: right beside it, it plays; on its card, it walks over; else it goes to that card.
 function chaseToy(){const rest=toys.filter(x=>x.on),yarn=rest.find(x=>x.kind==='yarn');
  const t=yarn&&Math.random()<.6?yarn:rest[Math.floor(Math.random()*rest.length)];if(!t)return false;
  if(t.on===s.surf?.key){if(Math.abs(t.x-b.x)<CAT_W)return playToy(t);return walkTo(t.x+(t.x>b.x?-CAT_W*.6:CAT_W*.6),TROT);}
  const p=all.find(q=>q.key===t.on);return Boolean(p&&goTo(p));}
 function chipPlay(){const r=Math.random();if(sc?.id==='home'&&toys.length&&Math.random()<.5&&chaseToy())return true;
  if(r<(sc?.id==='home'?.4:.15)&&shove())return true;
  if(r<.8){const near=all.filter(p=>p.perch==='pick'&&p!==s.surf&&canHop(s.surf,p));const t=near[Math.floor(Math.random()*near.length)];if(t&&goTo(t,{shove:Math.random()<.5}))return true;}
  if(r<.9)return walkTo(rand(s.surf.l,s.surf.r))||act('look',1200);
  return act(['look','groom','swat'][Math.floor(Math.random()*3)],rand(1200,2400));}
 /* Charts in view are toys, each kind its own game: it hops along columns, springs off flat bars, spins wheels,
    rocks the half-circle seesaw, pounces about a rug of cells, and chases a red dot along a line. */
 const CHART_SAY={bars:['Bar hop!','Up the columns','Hop, hop'],hbars:['Boing!','Springboard!'],ring:['Wheee!','Spin it!'],gauge:['Seesaw!','Tip, tip'],cells:['Pounce!','So many buttons'],line:['Red dot!','Got to catch it']};
 const chartSay=k=>{const l=CHART_SAY[k]||[];return l[Math.floor(Math.random()*l.length)]||'';};
 function chartPlay(){
  if(s.surf?.chart&&Math.random()<.6)return chartTrick();
  if(Math.random()>(s.surf?.chart?.18:.3))return false;
  const pool=all.filter(p=>p.chart&&p!==s.surf&&p.chart.root!==s.surf?.chart?.root);if(!pool.length)return false;
  // One chart each trip, a nearer one more often.
  const roots=[...new Set(pool.map(p=>p.chart.root))].map(root=>pool.filter(p=>p.chart.root===root)).sort((a,c)=>Math.abs(a[0].y-b.y)+Math.abs(a[0].l-b.x)-Math.abs(c[0].y-b.y)-Math.abs(c[0].l-b.x));
  const pick=roots[Math.min(roots.length-1,Math.floor(Math.random()*Math.random()*roots.length))],t=pick[Math.floor(Math.random()*pick.length)];
  if(!goTo(t,{chart:true}))return false;s.chartHops=0;return true;}
 function chartTrick(){const here=s.surf,c=here?.chart;if(!c||s.mood)return false;const k=c.kind;
  if(k==='bars'){const next=all.filter(p=>p.chart?.root===c.root&&p!==here&&canHop(here,p)).sort((a,q)=>Math.abs(a.l-here.l)-Math.abs(q.l-here.l)).slice(0,3);
   const t=next[Math.floor(Math.random()*next.length)];if(t&&(s.chartHops||0)<5&&goTo(t,{chart:true})){if(!s.chartHops)caption(chartSay(k),1300);s.chartHops=(s.chartHops||0)+1;return true;}
   s.chartHops=0;return act(Math.random()<.5?'look':'groom',1600);}
  if(k==='hbars'){const dir=Math.random()<.5?1:-1,x=dir>0?here.r-10:here.l+10;s.boing={p:here,dir};if(Math.abs(x-b.x)<4){boingNow();return true;}s.walk={x,pace:TROT,then:'boing'};s.mode='walk';endAct();pose('walk');return true;}
  if(k==='ring'&&here.roll){spin(here.roll,(Math.random()<.5?-1:1)*rand(380,560));caption(chartSay(k),1300);voice.call('chirp');return true;}
  if(k==='gauge'){caption(chartSay(k),1300);return walkTo(b.x-here.l>here.r-b.x?here.l+8:here.r-8,WALK);}
  if(k==='cells'){const tx=rand(here.l+12,here.r-12);s.face=tx>=b.x?1:-1;caption(chartSay(k),1100);b.vy=-Math.sqrt(2*G*rand(16,30));b.vx=Math.max(-260,Math.min(260,(tx-b.x)*2.2));s.mode='air';pose('jump');s.after=()=>Math.random()<.5&&s.surf?.chart&&chartTrick();return true;}
  if(k==='line'){const L=charts.redDot(c.el);if(!L)return false;caption(chartSay(k),1500);voice.call('mrrp');
   const chase=()=>{if(charts.laser!==L||s.surf?.chart?.root!==c.root||s.mood||!['idle','walk'].includes(s.mode))return;const x=L.x-sc.box.left;
    if(now()>=L.until-120){s.face=x>=b.x?1:-1;act('swat',800);later(250,()=>glyph('paw','\u2726',{x:L.x,y:sc.box.top+b.y-10}));return;}
    if(Math.abs(x-b.x)>12)walkTo(x,TROT);win.setTimeout(chase,140);};
   act('focus',500);win.setTimeout(chase,500);return true;}
  return false;}
 function boingNow(){const w=s.boing;s.boing=null;if(!w?.p?.chart?.el?.isConnected)return;s.face=w.dir;act('swat',800);
  later(240,()=>{if(s.act?.name!=='swat')return;charts.boing(w.p);voice.cue('swat');caption(chartSay('hbars'),1100);});}
 function topPlay(){
  const here=s.surf,gems=all.filter(p=>p.perch==='gem'&&p.station!==here.station).sort((a,c)=>Math.abs(a.l-here.l)-Math.abs(c.l-here.l)),r=Math.random();
  if(here.perch==='gem'&&r<.35&&mess())return true;
  if(r<.85&&gems.length){const t=gems[Math.min(gems.length-1,Math.floor(Math.random()*Math.random()*4))];if(goTo(t,{mischief:Math.random()<.45}))return true;}
  if(here.perch==='chip'){const g=all.find(p=>p.perch==='gem'&&p.station===here.station);if(g&&goTo(g,{mischief:true}))return true;}
  return act(['look','groom','swat'][Math.floor(Math.random()*3)],rand(900,1800));}
 function goDown(){const bars=all.filter(p=>!p.floor&&!p.perch);const t=bars[Math.floor(Math.random()*bars.length)];return Boolean(t&&goTo(t));}
 // Up to the journey, scrolling the page to bring it into view first when it is above the window.
 function climbUp(){if(showStill&&showing())return mischief();const gem=doc.querySelector('.jl-station:not([hidden]) .jl-gem')?.getBoundingClientRect();
  if(gem&&gem.top<80&&Date.now()-userScrollAt>FOLLOW_USER){pageScrollAt=Date.now()+1400;win.scrollBy?.({top:gem.top-170,behavior:'smooth'});return false;}
  return mischief();}
 // The page follows the cat up and down, unless the user has just scrolled it themselves.
 let userScrollAt=0,pageScrollAt=0;const FOLLOW_USER=12000;
 // Each place on screen, as how far its middle is from the window's (0 when it is off screen).
 function inView(){const H=win.innerHeight,ok=r=>r&&r.width&&r.bottom>60&&r.top<H-40?1+Math.abs((r.top+r.bottom)/2-H/2):0;
  return {top:ok(doc.querySelector('.jl-station:not([hidden]) .jl-gem')?.getBoundingClientRect()),timeline:ok(sc?.view?.getBoundingClientRect()),chips:all.some(p=>p.perch==='pick')?1:0};}
 for(const ev of ['wheel','touchmove','keydown'])win.addEventListener?.(ev,()=>{userScrollAt=Date.now();},{passive:true});
 win.addEventListener?.('scroll',()=>{if(Date.now()>pageScrollAt+300)userScrollAt=Date.now();},{passive:true});
 function keepInView(){if(!follow)return;if(showStill&&showing()||!sc||el.hidden||g||s.mode==='carry'||s.mode==='peek'||s.leaving)return;const t=Date.now();if(t<pageScrollAt||t-userScrollAt<FOLLOW_USER)return;
  const top=sc.box.top+b.y-CAT_H,bot=sc.box.top+b.y,H=win.innerHeight;let dy=0;
  if(top<60)dy=top-150;else if(bot>H-30)dy=bot-H+170;
  if(dy){pageScrollAt=t+1400;win.scrollBy?.({top:dy,behavior:'smooth'});}}
 function mischief(){const gems=all.filter(p=>p.perch==='gem'&&p!==s.surf);if(!gems.length)return false;
  const t=gems[Math.floor(Math.random()*gems.length)];return goTo(t,{mischief:true});}
 function mess(){const li=s.surf?.li,n=li&&ropeAt(li);if(!n)return false;rope.loose=now()+9000;
  voice.call('meow');let beats=3+Math.floor(Math.random()*3);caption(MESS[Math.floor(Math.random()*MESS.length)],2200);
  const done=()=>{n.tx=n.ty=null;if(rope)rope.loose=now()+ROPE.rest;};
  const beat=()=>{if(s.surf?.li!==li||!['idle','land'].includes(s.mode)||!rope){done();return;}const dir=Math.random()<.5?-1:1;s.face=dir;act('swat',720);
   n.tx=Math.max(-ROPE.reach,Math.min(ROPE.reach,(n.tx??n.x)+dir*rand(16,28)));n.ty=Math.max(-14,Math.min(ROPE.reach,(n.ty??n.y)+rand(-10,18)));
   li.classList.remove('tl-cat-shoved');void li.offsetWidth;li.classList.add('tl-cat-shoved');
   if(--beats>0){later(620,beat);return;}
   // Last, it digs in and hauls the rope down, and the stations either side come with it.
   later(700,()=>{if(s.surf?.li!==li||s.mode!=='idle'){done();return;}caption(TUG[Math.floor(Math.random()*TUG.length)],1800);act('stretch',1500);voice.call?.('protest');
    n.ty=ROPE.reach*.9;n.tx=-s.face*rand(20,34);later(1500,()=>{done();if(s.surf?.li===li&&s.mode==='idle')act('look',900);});});};
  beat();return true;}
 /* Hungry, it asks: every so often it sits up and begs, meows and says so with a fish over its head, more often and
    sadder the longer it goes without. Its first ask says how to feed it. */
 function askFood(){const h=hunger();if(!pet||h<1||now()<askAt||s.mood||s.feast||showing())return false;const starving=h>=1.5;
  if(!act(starving&&asked%2?'sad':'beg',2400))return false;askAt=now()+rand(...HUNGER.ask)/(starving?1.6:1);
  const lines=starving?['So hungry...','My bowl is empty',`Please feed ${catName}!`]:[`${catName} is hungry`,'Feed me?','Is it dinner time?','Fish, please?'],line=lines[Math.floor(Math.random()*lines.length)];
  voice.call('meow');glyph('head','\u{1F41F}');const first=!asked++;later(600,()=>say(first?`${line} Double-click near me to drop a fish.`:line,first?3600:2000));return true;}
 function think(){
  if(s.quest)return quest();
  if(askFood())return true;
  // A log in view is a game: now and then it hops onto one, and on one it sets it rolling.
  if(s.surf?.roll&&!s.tread&&Math.random()<.3){spin(s.surf.roll,(Math.random()<.5?-1:1)*rand(220,340));caption('Log roll!',1200);voice.call('chirp');return true;}
  if(!s.surf?.roll&&Math.random()<.05){const logs=all.filter(p=>p.roll);const to=logs[Math.floor(Math.random()*logs.length)];if(to&&goTo(to)){caption('Log roll!',1200);return true;}}
  if(s.play&&playOn())return true;
  if(sc?.id==='home'&&chartPlay())return true;
  if(showPlay())return true;
  if(sc?.id==='home'&&toys.length&&Math.random()<.55&&startPlay())return true;
  const t=now();
  if(!s.zone){s.zone='timeline';s.zoneUntil=t+rand(...ZONE.first);s.zoneMiss=0;}
  // A page with no journey stations, as the Projects page, has no top zone to go to.
  const order=all.some(p=>p.perch==='gem')?ZONE.order:ZONE.order.filter(z=>z!=='top');
  if(t>=s.zoneUntil){s.zone=order[(order.indexOf(s.zone)+1)%order.length];s.zoneUntil=t+rand(...ZONE.stay);s.zoneMiss=0;caption(zoneSay(s.zone),1400);voice.call(Math.random()<.5?'meow':'mew');}
  const here=zoneOf(s.surf);
  // Scrolled by the user, it makes for whichever place is now in view instead of pulling the page back.
  if(Date.now()-userScrollAt<FOLLOW_USER){const v=inView();if(!v[s.zone]){const z=v[here]?here:Object.keys(v).filter(k=>v[k]).sort((a,c)=>v[a]-v[c])[0];
   if(z){s.zone=z;s.zoneUntil=t+rand(...ZONE.stay);s.zoneMiss=0;if(z!==here)caption(zoneSay(z),1400);}}}
  if(here!==s.zone){if(goZone(s.zone))return true;if(++s.zoneMiss>ZONE.miss)s.zoneUntil=t;}
  else if(here==='top')return topPlay();
  else if(here==='chips')return chipPlay();
  else if(Math.random()<.3&&scout())return true;
  const a=pickWeighted(Math.random());
  if(a==='rope')return climb()||walkTo(rand(s.surf.l,s.surf.r));
  if(a==='scout')return scout()||walkTo(rand(s.surf.l,s.surf.r));
  if(a==='wander')return walkTo(rand(s.surf.l,s.surf.r))||act('look',1600);
  if(a==='mischief')return shove()||walkTo(rand(s.surf.l,s.surf.r));
  if(a==='explore'||a==='pounce'){const open=all.filter(p=>p.open&&p!==s.surf),pool=a==='pounce'&&open.length?open:all.filter(p=>p!==s.surf&&!p.floor&&!p.perch);
   const t=pool[Math.floor(Math.random()*pool.length)];if(t&&goTo(t,{pounce:a==='pounce'&&t.open}))return true;
   return walkTo(rand(s.surf.l,s.surf.r));}
  if(a==='sit'){if(Math.random()<.5)later(400,()=>s.act?.name==='look'&&voice.call(Math.random()<.5?'mew':'meow'));return act('look',rand(2200,4200));}
  if(a==='nap')return act('nap',rand(7000,12000));
  if(a==='react'){const [name,,ms]=REACTIONS[Math.floor(Math.random()*REACTIONS.length)];return act(name,ms);}
  return act(a,{groom:rand(2600,4000),headscratch:2100,stretch:1800,scratch:2200,look:2000}[a]);
 }
 function land(hit,vy){
  const vx=b.vx;s.surf=hit;s.mode='land';b.vx*=.4;b.vy=0;const hard=vy>1050;s.landUntil=now()+(hard?320:150);pose(hard?'land-hard':'land');set('act',null);
  voice.sfx('pat',{gain:hard?1:.75});if(hard)glyph('dust','\u2219\u2219\u2219',{x:sc.box.left+b.x,y:sc.box.top+b.y-6});
  if(!hinted){hinted=true;try{if(!win.sessionStorage?.getItem(`${storage}.hint`)){win.sessionStorage?.setItem(`${storage}.hint`,'1');later(500,()=>s.mode==='idle'&&say(pet?`Hi, I'm ${catName}. Tap me for a trick, double-click me for more.`:'Psst. Tap me for a trick. Double-click me to pick one.',3600));}}catch{}}
  if(hit.li)kick(hit.li,vy,b.vx);if(hit.el)jiggle(hit.el,vy,b.x);if(hit.chip)nudge(hit.chip,vx*.25+Math.sign(vx||1)*15,vy*.25);
  if(hit.roll){spin(hit.roll,vx*ROLL.grip+(Math.random()<.5?-1:1)*rand(70,130));if(Math.random()<.4)caption(hit.chart?'Wheee!':'Log roll!',1200);}
  if(hit.chart)charts.land(hit,vy,sc.box.left+b.x);
  if(s.hop){if(s.route?.[0]&&hit.key===s.hop.key)s.route.shift();else s.route=null;s.hop=null;}
  if(lives){lives=false;later(s.landUntil-now()+350,()=>{if(s.mode!=='idle'||s.mood)return;act('say',4200);pose('sit');speakLine(NINE_LIVES[Math.floor(Math.random()*NINE_LIVES.length)]);});}
 }
 function arrived(){const then=s.walk?.then;s.walk=null;s.mode='idle';pose('stand');if(then==='hop'&&s.route)nextHop();else if(then==='hang')hang();else if(then==='climb')grabRope();else if(then==='slip')slip();else if(then==='shove')shoveNow();else if(then==='boing')boingNow();else if(then==='zoomback'){const x=s.zoomBack;s.zoomBack=null;walkTo(x,RUN);}}
 // Turning around takes a moment: the body narrows to a front view with its head kept round, then widens facing the other way.
 function tick(dt){
  const aim=s.front?0:s.face;s.vis+=Math.max(-dt*TURN,Math.min(dt*TURN,aim-s.vis));
  const t=now(),edgeL=s.leaving?-Infinity:sc.left,edgeR=s.leaving?Infinity:sc.right;
  if(s.mode==='peek'){peekStep();return;}
  if(s.mode==='carry'){carryStep(b,dt,s.carry);b.y=Math.min(b.y,sc.floor);s.tilt=Math.max(-28,Math.min(28,b.vx*.035));return;}
  // Hanging by its front paws from the end of a bar, swinging a little less each time, until it lets go.
  if(s.climb&&s.mode!=='climb'&&s.walk?.then!=='climb')dropRope();
  if(s.mode==='climb'){climbStep(t,dt);return;}
  if(s.mode==='hang'){const h=s.hang,k=(t-h.t0)/1000;b.y=h.top+h.depth;s.tilt=Math.sin(k*5.2)*9*Math.exp(-k*.7);if(t>=h.until)letGo();return;}
  edgeScroll(t);
  if(s.mode==='air'&&s.ride){const tk=all.find(p=>p.perch==='ticket');if(tk){const x=Math.max(tk.l+18,Math.min(tk.r-18,b.x));b.x+=(x-b.x)*Math.min(1,dt*6);}}
  if(s.mode==='air'){const vy=b.vy,hit=flyStep(b,dt,s.ride?all.filter(p=>p.perch==='ticket'):s.falling?all.filter(p=>p.y>s.fallFrom+8):s.hop?.through!=null?all.filter(p=>p.y>=s.hop.through):all,edgeL,edgeR);s.tilt=Math.max(-22,Math.min(22,Math.atan2(b.vy,Math.abs(b.vx)+60)*20));
   if(!hit&&b.vy>0&&b.y>sc.bottom+6){fellOut();return;}
   if(Math.abs(b.vx)>20)s.face=b.vx>0?1:-1;if(hit){land(hit,vy);s.tilt=0;if(s.after){const f=s.after;s.after=null;later(s.landUntil-t+20,f);}}return;}
  // A station sliding under it carries it along.
  // A jump further than a shove moves it is the page laying the cards out again: the cat stays where it was. The floor
  // that rides along with the window is the one thing that may jump.
  if(s.surf?.li||s.surf?.chip||s.surf?.perch==='pick'||s.surf?.ride||s.surf?.rides){const p=all.find(q=>q.key===s.surf.key);if(p){const dx=(p.l+p.r-s.surf.l-s.surf.r)/2,dy=p.y-s.surf.y;if(!s.surf.rides&&(Math.abs(dx)>RELAID||Math.abs(dy)>CAT_H)){s.surf=null;}else{b.x+=dx;if(s.walk)s.walk.x+=dx;b.y+=dy;if(s.ride&&Math.abs(dx)+Math.abs(dy)>.3)s.ride.moved=t;}}}
  else if(s.surf?.el){const p=all.find(q=>q.key===s.surf.key);if(p)b.y+=p.y-s.surf.y;}
  s.tilt=0;const on=standingOn(all,b.x,b.y);
  if(!on){s.mode='air';s.surf=null;pose('jump');if(s.act&&s.act.name!=='poke')endAct();return;}
  s.surf=on;b.y=on.y;
  if(on.roll&&s.mode!=='land')rollUnder(on.roll,dt);else if(!on.roll)untread();
  // On the ticket it sits for the ride, and hops off on its own once the ticket has stopped for a while.
  if(s.ride){if(!s.ride.on&&on.perch==='ticket'){s.ride.on=true;s.ride.moved=t;}if(on.perch!=='ticket'||t-s.ride.moved>RIDE_REST){s.ride=null;if(on.perch==='ticket')caption('Thanks for the ride!',1400);}else{if(s.mode!=='land'){s.mode='idle';pose('sit');}if(s.mode==='idle')return;}}
  if(s.leaving&&s.mode!=='prep'){s.face=1;const r=walkStep(b.x,b.vx,b.x+400,RUN,dt);b.x=r.x;b.vx=r.v;pose('run');if(b.x>sc.right+CAT_W*1.5){const back=s.comeback;el.hidden=true;hide();if(back&&want())enter();}return;}
  if(s.mode==='walk'&&s.surf?.el&&t>=(s.stepAt||0)){s.stepAt=t+(s.walk.pace>=RUN?190:s.walk.pace>=TROT?240:300);jiggle(s.surf.el,s.walk.pace>=RUN?80:s.walk.pace>=TROT?60:45,b.x,true);}
  if(s.surf?.chart){if(s.mode==='walk'&&t>=(s.chartStepAt||0)){s.chartStepAt=t+(s.walk.pace>=TROT?200:280);charts.walk(s.surf,sc.box.left+b.x);}charts.lean(s.surf,sc.box.left+b.x);}
  if(s.leant&&s.leant!==s.surf){charts.unlean(s.leant);s.leant=null;}if(s.surf?.chart?.kind==='gauge')s.leant=s.surf;
  if(s.mode==='walk'&&s.surf?.chip&&t>=(s.stepAt||0)){s.stepAt=t+(s.walk.pace>=TROT?220:300);nudge(s.surf.chip,0,12);}
  if(s.mode==='walk'){const r=walkStep(b.x,b.vx,s.walk.x,s.walk.pace,dt);b.x=r.x;b.vx=r.v;if(Math.abs(r.v)>8)s.face=r.v>0?1:-1;if(r.done)arrived();return;}
  b.vx=frictionStep(b.vx,dt);b.x+=b.vx*dt;
  if(s.mode==='prep'){if(t<s.prepUntil)return;const L=launch(b,s.hop.to,{maxUp:s.hop.up});set('act',null);
   if(!L){s.route=null;s.hop=null;s.mode='idle';act('look',1400);return;}
   if(s.surf?.li)kick(s.surf.li,-L.vy*.35,-L.vx);if(s.surf?.el)jiggle(s.surf.el,-L.vy*.35,b.x);if(s.surf?.chip)nudge(s.surf.chip,-L.vx*.3,-L.vy*.15);if(s.surf?.roll)spin(s.surf.roll,-L.vx*ROLL.grip);untread();voice.sfx('hup',{pitch:L.apex>120?1.15:1});b.vx=L.vx;b.vy=L.vy;s.mode='air';s.surf=null;pose('jump');if(s.goal?.pounce&&s.route?.length===1)s.after=()=>act('swat',800);return;}
  if(s.mode==='land'){if(t<s.landUntil)return;s.mode='idle';pose(s.mood?BASE[s.mood]:'stand');if(s.route?.length){nextHop();return;}if(s.route&&!s.route.length){s.route=null;if(s.goal?.mischief&&s.surf?.perch==='gem'){s.goal=null;mess();return;}if(s.goal?.chart){s.goal=null;if(chartTrick())return;}if(s.goal?.shove){s.goal=null;if(shove())return;}if(s.goal?.scout){const side=s.goal.scout,w=span(s.surf);s.goal=null;if(walkTo(side<0?w.l+6:w.r-6,TROT))return;}if(!s.after&&Math.random()<.5)act('look',1500);}return;}
  if(s.act){if(t<s.act.until)return;endAct();}
  if(s.mood){if(s.mood==='focus'&&pointer)s.face=pointer.x>=b.x?1:-1;return;}
  if(reducedMotion()){if(el.dataset.pose!=='sleep'){set('act','nap');pose('sleep');}return;}
  // A pointer close by gets a look and now and then a swat.
  if(s.quest){if(t>=s.nextThink){s.nextThink=t+rand(150,350);think();}return;}
  if(pointer&&Math.hypot(pointer.x-b.x,pointer.y-(b.y-CAT_H/2))<110){s.face=pointer.x>=b.x?1:-1;if(Math.random()<dt*.8)act('swat',700);return;}
  if(t>=s.nextThink){s.nextThink=t+rand(200,900);think();}
 }
 /* Heading for the edge of a timeline that scrolls on that side, it scrolls the rounds beyond into view; the bars carry it
    along as they move (see follow). */
 function edgeScroll(t){const v=sc.view;if(!v||t<scrollAt||s.leaving||s.surf?.perch||!['walk','prep','air','idle'].includes(s.mode))return;
  const heading=s.mode==='air'?Math.sign(b.vx):s.mode==='walk'?Math.sign(s.walk.x-b.x):s.mode==='prep'?Math.sign(s.hop.to.x-b.x):s.face;
  const room=heading<0?v.scrollLeft:v.scrollWidth-v.clientWidth-v.scrollLeft;
  if(!heading||room<4||(heading<0?b.x>sc.left+40:b.x<sc.right-40))return;
  scrollAt=t+1800;v.scrollBy?.({left:heading*Math.min(room,v.clientWidth*.45),behavior:'smooth'});}
 // A timeline scrolled sideways moves the bars under the cat, so the cat moves with them.
 function follow(){const v=sc.view,x=v?.scrollLeft||0;if(seen?.view!==v){seen={view:v,x};return;}const d=x-seen.x;seen.x=x;if(!d||el.hidden||s.mode==='carry'||s.surf?.perch)return;
  b.x-=d;if(s.walk)s.walk.x-=d;if(s.hop)s.hop.to.x-=d;if(s.edge)s.edge.x-=d;if(s.quest)s.quest.x-=d;s.route=null;}
 function draw(){
  placeMark();keepInView();
  const plank=s.surf?.el&&!['air','carry','peek','hang','climb'].includes(s.mode)?wob.get(s.surf.el):null,dip=plank?tiltAt(plank,b.x):0;
  el.style.transform=`translate(${(sc.box.left+b.x-CAT_W/2).toFixed(1)}px,${(sc.box.top+b.y+dip-CAT_H+1).toFixed(1)}px)`;
  const k=Math.max(.3,Math.abs(s.vis));el.style.setProperty('--face',(s.vis<0?-k:k).toFixed(3));el.style.setProperty('--hk',(1/k).toFixed(3));el.style.setProperty('--fs',s.vis<0?-1:1);el.style.setProperty('--fo',Math.max(0,Math.min(1,(.8-Math.abs(s.vis))/.4)).toFixed(2));if(s.mode==='peek')clipToGem();el.style.setProperty('--tilt',`${(s.tilt+(plank?plank.th*180/Math.PI:0)).toFixed(1)}deg`);
  const grounded=Boolean(s.surf)&&!['air','carry','peek','hang','climb'].includes(s.mode)&&el.dataset.pose!=='jump';
  if(r3d)try{r3d.render({vis:s.vis,back:Boolean(s.back),tilt:s.tilt,fs:s.vis<0&&!s.back?-1:1,sleep:el.dataset.pose==='sleep',grounded});}catch(e){win.console?.warn?.(e);r3d.canvas.remove();el.classList.remove('is-3d');r3d=null;}
  const at=s.act?.name==='scratch'&&r3d?.paws();fog.hidden=!at;if(at){const o=el.getBoundingClientRect();fog.style.transform=`translate(${(o.left+at.nose.x-9).toFixed(1)}px,${(o.top+at.nose.y-7).toFixed(1)}px)`;}
  placeTalk();
 }
 /* It never falls for good and never vanishes: dropping past the lowest bar, it springs straight back up from where it is
    onto the bar nearest it, the same cat in plain sight. */
 function fellOut(){s.ride=null;if(s.leaving&&!s.comeback){el.hidden=true;hide();return;}
  const gap=p=>Math.max(0,p.l-b.x,b.x-p.r),t=all.filter(p=>!p.floor&&p.r-p.l>=24).sort((a,c)=>gap(a)-gap(c)||c.y-a.y)[0];
  if(!t){b.y=sc.bottom;b.vx=0;b.vy=0;return;}
  const inset=Math.min(30,(t.r-t.l)/2),to={x:Math.max(t.l+inset,Math.min(t.r-inset,b.x)),y:t.y},L=launch(b,to,{maxUp:Infinity,maxVx:Infinity});
  s.falling=false;s.hop=null;s.route=null;s.walk=null;s.mode='air';s.surf=null;b.vx=L.vx;b.vy=L.vy;s.face=to.x>=b.x?1:-1;pose('jump');caption('Phew!',1200);voice.call('mew');}
 function hide(){charts.reset();fog.hidden=true;cap.hidden=true;dropRope();for(const e of sway.keys())for(const p of pieces(e))p.style.rotate='';sway.clear();s.hang=null;s.edge=null;s.falling=false;el.style.clipPath='';s.peek=null;hush();clearTimers();ropeReset();unwobAll();unchipAll();s.shoving=null;s.feast=false;if(goalEl)goalEl.hidden=true;stopAll();voice.purrOff();s.mood=null;set('mood',null);s.act=null;set('act',null);s.leaving=false;s.comeback=false;s.front=false;s.quest=null;s.ride=null;s.route=null;s.walk=null;s.mode='idle';}
 /* A station double-clicked sends the orb and its ticket off from there; the cat leaps onto the ticket and rides along,
    steering in the air toward it as it moves. */
 const RIDE_REST=3000;
 function ride(){if(!sc||el.hidden||['carry','peek'].includes(s.mode)||s.leaving)return false;const tk=all.find(p=>p.perch==='ticket');if(!tk)return false;
  if(s.climb)dropRope();if(s.act)endAct();
  const to={x:Math.max(tk.l+18,Math.min(tk.r-18,(tk.l+tk.r)/2)),y:tk.y},L=launch(b,to,{maxUp:Infinity,maxVx:Infinity});
  s.ride={moved:now()};s.hang=null;s.edge=null;s.hop=null;s.route=null;s.walk=null;s.quest=null;s.goal=null;s.falling=false;s.mood=null;set('mood',null);
  s.mode='air';s.surf=null;b.vx=L.vx;b.vy=L.vy;s.face=to.x>=b.x?1:-1;pose('jump');caption('All aboard!',1400);voice.call('chirp');return true;}
 // It comes alive in the window of the station the PR waits at: its head rises inside the diamond, it looks one way and
// the other, crouches, and jumps out and down onto the timeline. With no such window on screen it walks in from the left.
 const gemRect=()=>{const at=sc&&home(sc.id),g=at!=null?doc.querySelector(`.jl-station[data-station="${at}"]:not([hidden]) .jl-gem`):null;const r=g?.getBoundingClientRect();return r&&r.width>12&&r.bottom>0&&r.top<win.innerHeight?r:null;};
 const TURN=2/.32;
 const PEEK={rise:600,look:1500,turn:2300,crouch:2900,jump:3300};
 function peekAt(r,lift){b.x=r.left+r.width/2-sc.box.left-s.face*14;b.y=r.top+r.height/2-sc.box.top-CAT_H*16.6/42+CAT_H-1+lift;}
 function peekStep(){
  const r=gemRect(),t=now()-s.peek.t0;if(!r){el.style.clipPath='';s.mode='air';s.peek=null;pose('jump');return;}
  if(t<PEEK.rise){peekAt(r,(1-Math.sin(t/PEEK.rise*Math.PI/2))*16);return;}
  if(t<PEEK.look){if(el.dataset.act!=='look')set('act','look');peekAt(r,0);return;}
  if(t<PEEK.turn){if(s.peek.turned!==1){s.peek.turned=1;s.face=-s.face;set('act',null);win.requestAnimationFrame(()=>set('act','look'));}peekAt(r,0);return;}
  if(t<PEEK.crouch){if(s.peek.turned!==2){s.peek.turned=2;s.face=-s.face;}set('act',null);pose('crouch');peekAt(r,2);return;}
  if(t<PEEK.jump){peekAt(r,3);return;}
  // Out it goes: toward the timeline, onto the first thing under it.
  const near=(list)=>list.sort((p,q)=>Math.abs((p.l+p.r)/2-b.x)-Math.abs((q.l+q.r)/2-b.x))[0],aim=near(all.filter(p=>p.y>b.y+20))||near([...all]);
  if(!aim){el.style.clipPath='';s.peek=null;s.mode='air';pose('jump');return;}
  const to={x:Math.max(aim.l+14,Math.min(aim.r-14,b.x+s.face*rand(30,110))),y:aim.y},L=launch(b,to,{maxVx:700});
  el.style.clipPath='';s.peek=null;s.face=to.x>=b.x?1:-1;b.vx=L?L.vx:s.face*120;b.vy=L?L.vy:-260;s.mode='air';s.surf=null;pose('jump');
 }
 function clipToGem(){const r=gemRect();if(!r)return;const L=sc.box.left+b.x-CAT_W/2,T=sc.box.top+b.y-CAT_H+1,cx=r.left+r.width/2-L,cy=r.top+r.height/2-T,hw=r.width/2-3,hh=r.height/2-3;
  el.style.clipPath=`polygon(${cx}px ${cy-hh}px,${cx+hw}px ${cy}px,${cx}px ${cy+hh}px,${cx-hw}px ${cy}px)`;}
 // It only ever stands on a bar: with no station window on screen it hops up from below onto a low bar, and with no bar
 // in reach it stays out of sight.
 function enter(){
  if(!all.length)return;voice.warm?.();
  if(reducedMotion()){const t=all[0];Object.assign(b,{x:(t.l+t.r)/2,y:t.y,vx:0,vy:0});Object.assign(s,{surf:t,mode:'idle',walk:null,face:1,vis:1,leaving:false});el.hidden=false;set('act','nap');pose('sleep');return;}
  const r=gemRect();
  if(r){Object.assign(b,{vx:0,vy:0});Object.assign(s,{mode:'peek',peek:{t0:now()},face:1,vis:1,leaving:false,surf:null,walk:null});peekAt(r,16);el.hidden=false;pose('stand');clipToGem();return;}
  const low=all.filter(p=>p.y>=sc.floor-MAX_UP&&p.r-p.l>=40).sort((p,q)=>q.y-p.y)[0];if(!low)return;
  const x=Math.max(low.l+16,Math.min(low.r-16,(low.l+low.r)/2+rand(-40,40))),from={x:x-rand(20,40),y:sc.floor+CAT_H*.6},L=launch(from,{x,y:low.y},{maxUp:MAX_UP+CAT_H});if(!L)return;
  Object.assign(b,{...from,vx:L.vx,vy:L.vy});Object.assign(s,{surf:null,mode:'air',face:1,vis:1,leaving:false,walk:null});el.hidden=false;pose('jump');}
 /* The cat and its toys wait for the page to finish loading: the document loaded, no skeleton or spinner on screen,
    and the cards holding still for a moment, so it never lands on a placeholder that is about to be replaced. Cards are
    watched rather than every change in the page, as a ticking clock or a counting number never stops changing it. A
    page that never settles still gets its cat after a while. */
 const LOADING='[aria-busy="true"],[data-loading="true"],.animate-pulse,.animate-spin,.skeleton',SETTLE={still:700,most:15000,every:200};
 let gate={from:now(),at:0,sig:'',since:0,done:false};
 const loaderShown=()=>[...doc.querySelectorAll(LOADING)].some(e=>{if(e.closest('.tl-cat,.tl-cat-toy,.tl-cat-yarn'))return false;const r=e.getBoundingClientRect();return r.width>=12&&r.height>=8&&r.bottom>0&&r.top<win.innerHeight;});
 function settled(){if(gate.done)return true;const t=now();if(t-gate.at<SETTLE.every)return false;gate.at=t;
  const busy=doc.readyState!=='complete'||loaderShown(),cards=[...doc.querySelectorAll('[data-card]')].slice(0,60);
  const sig=`${cards.length}|${doc.documentElement.scrollHeight}|${cards.map(e=>{const r=e.getBoundingClientRect();return `${r.left|0},${(r.top+win.scrollY)|0},${r.width|0},${r.height|0}`;}).join(';')}`;
  if(busy||sig!==gate.sig){gate.sig=sig;gate.since=t;}
  gate.done=!busy&&t-gate.since>=SETTLE.still||t-gate.from>=SETTLE.most;return gate.done;}
 const want=()=>Boolean(sc&&!doc.hidden&&(force||settled()&&(showing()||waiting(sc.id))));
 /* Game mode (cat-game.js): with the timeline's Game switch on, the player runs the cat over the Rounds view as a course,
    one PR per stage, collecting cat food on the way to the bowl at the newest round. */
 const layer=doc.createElement('div');layer.className='tl-game';layer.hidden=true;
 layer.innerHTML='<div class="tl-game-track"></div><div class="tl-game-hud" aria-live="polite"></div><div class="tl-game-card" role="status" hidden></div>';
 doc.body.append(layer);
 const [track,hud,card]=layer.children,keys={left:false,right:false,jump:false,down:false,pressed:false,fire:false};
 let g=null,landT=0;
 const loadBest=()=>{try{return JSON.parse(win.localStorage?.getItem(`${storage}.best`)||'null');}catch{return null;}};
 const saveBest=v=>{try{win.localStorage?.setItem(`${storage}.best`,JSON.stringify(v));}catch{}};
 const pills=()=>[...doc.querySelectorAll('.jl-picker [data-do="jlLivePick"][data-id]')];
 const workOf=id=>String(id||'').startsWith('rj:')?'review':'author';
 const prNum=id=>(pills().find(e=>e.dataset.id===id)?.textContent.match(/#\d+/)||[''])[0]||String(id).match(/#?\d+$/)?.[0]||'';
 const clock=ms=>{const t=Math.round(ms/1000);return t>=60?`${Math.floor(t/60)}m ${t%60}s`:`${t}s`;};
 function gameView(tl){const view=tl?.querySelector('.jl-rg-scroll');return view?{view,lw:tl.querySelector('.jl-rg-name')?.offsetWidth||0}:null;}
 function readCourse(tl){const gv=gameView(tl);if(!gv)return null;const {view,lw}=gv,vr=view.getBoundingClientRect(),sl=view.scrollLeft;
  const segs=[...view.querySelectorAll('.jl-tl-seg')].map(e=>{const r=e.getBoundingClientRect();return {l:r.left-vr.left+sl,r:r.right-vr.left+sl,y:r.top-vr.top,tone:(e.className.match(/\btone-(\w+)/)||[])[1]||'',kind:(e.className.match(/\bk-(\w+)/)||[])[1]||''};});
  return {sig:`${segs.length}:${view.scrollWidth}`,course:buildCourse(segs,{width:view.scrollWidth,height:view.clientHeight,inset:lw})};}
 function paintFood(){const c=g.course;
  track.style.width=`${c.width}px`;track.style.height=`${c.height}px`;
  track.innerHTML=c.ropes.map(r=>`<b class="tl-rope" data-rope="${esc(r.key)}" data-len="${r.len.toFixed(1)}" style="animation-delay:${(-(r.x%3.2)).toFixed(2)}s;left:${r.x.toFixed(1)}px;top:${r.top.toFixed(1)}px;height:${r.len.toFixed(1)}px"></b>`).join('')
   +g.food.map(f=>`<i class="tl-food ${f.kind}${g.got.has(f.id)?' got':''}" data-food="${esc(f.id)}" style="left:${f.x.toFixed(1)}px;top:${f.y.toFixed(1)}px"></i>`).join('')
   +(g.flags||[]).map(f=>`<b class="tl-flag${g.flagsSeen?.has(f.id)?' up':''}" data-flag="${esc(f.id)}" style="left:${f.x.toFixed(1)}px;top:${f.y.toFixed(1)}px" aria-hidden="true"></b>`).join('')
   +(g.boxes||[]).map(b=>`<b class="tl-box${b.used?' used':''}" data-box="${esc(b.id)}" style="left:${b.x.toFixed(1)}px;top:${b.top.toFixed(1)}px" aria-hidden="true"></b>`).join('')
   +(g.pows||[]).filter(i=>i.alive).map(powMarkup).join('')
   +`<span class="tl-bowl" style="left:${c.end.toFixed(1)}px;top:${c.goal.y.toFixed(1)}px" aria-hidden="true"></span>`
   +(g.foes||[]).map(foeMarkup).join('');}
 const POW_FACE={catnip:'\u{1F33F}',laser:'<i class="gc-laser"></i>',fish:'\u{1F420}'};
 const powMarkup=i=>`<i class="tl-pow ${i.kind}" data-pow="${esc(i.id)}" style="left:${i.x.toFixed(1)}px;top:${i.y.toFixed(1)}px" aria-hidden="true">${POW_FACE[i.kind]}</i>`;
 const POW_SAY={catnip:'Catnip! Big cat.',laser:'Laser pointer! X to shoot.',fish:'Golden fish!'};
 // A coin from a box or the cat food: every COINS_LIFE of them a life back.
 function addCoins(n){const was=g.coins||0;g.coins=was+n;if(Math.floor(g.coins/COINS_LIFE)>Math.floor(was/COINS_LIFE)){g.lives=Math.min(LIVES,g.lives+1);caption('Extra life!',1200);voice.call('trill');}}
 // A hit that is not a stomp: a big cat shrinks and blinks for a moment, a small one loses a life.
 function hurt(say){const next=hurtPower?hurtPower(g.power):null;if(!next){caption(say,1400);loseLife();return;}
  g.power=next;g.safeUntil=now()+1500;caption('Shrunk!',1000);voice.call('protest');}
 const foodOf=(c,foes)=>[...placeFood(c),...(placePickups?placePickups(c,foes):[])];
/* The cast, drawn facing right (a foe going left is flipped): a Glitch, a pixel block whose colours tear apart, walks
    the failed checks; a camera Drone on two rotors swoops over them; an Armadillo trots along and, stomped, rolls into
    a ball to kick; a spring-legged robot Bunny hops on CodeRabbit's; and the Merge Kraken, crowned, waits at the bowl. */
 const CAST={
  glitch:'<svg viewBox="0 0 24 20"><g class="gl-tear"><rect x="2" y="2" width="18" height="13" rx="2" fill="#22d3ee"/><rect x="4" y="3" width="18" height="13" rx="2" fill="#f472b6"/></g><rect x="3" y="2.5" width="18" height="13" rx="2" fill="#4338ca"/><rect x="5" y="4.5" width="5" height="2" fill="#818cf8"/><rect x="6.5" y="7.5" width="4" height="4" fill="#fff"/><rect x="13.5" y="7.5" width="4" height="4" fill="#fff"/><rect class="gl-eye" x="8.5" y="8.5" width="2" height="2.5" fill="#0f172a"/><rect class="gl-eye" x="15.5" y="8.5" width="2" height="2.5" fill="#0f172a"/><path d="M7 13.4h1.6v-1h1.6v1h1.6v-1h1.6v1h1.6v-1h1.6v1" stroke="#c7d2fe" fill="none" stroke-width=".9"/><rect class="ft-a" x="5.5" y="15.5" width="4" height="3.5" rx="1" fill="#1e1b4b"/><rect class="ft-b" x="14.5" y="15.5" width="4" height="3.5" rx="1" fill="#1e1b4b"/></svg>',
  drone:'<svg viewBox="0 0 30 20"><path d="M3 5h24" stroke="#64748b" stroke-width="1.6" stroke-linecap="round"/><ellipse class="dr-rotor" cx="4.5" cy="3" rx="4.5" ry="1.1" fill="#cbd5e1"/><ellipse class="dr-rotor" cx="25.5" cy="3" rx="4.5" ry="1.1" fill="#cbd5e1"/><rect x="8" y="5" width="14" height="10" rx="5" fill="#334155"/><rect x="9.5" y="6" width="6" height="2" rx="1" fill="#475569"/><circle cx="17" cy="10" r="3.8" fill="#0f172a"/><circle class="dr-eye" cx="17.6" cy="10" r="2.3" fill="#ef4444"/><circle cx="16.9" cy="9.2" r=".8" fill="#fff"/><path d="M11 15l-2 3.4M19 15l2 3.4" stroke="#64748b" stroke-width="1.4" stroke-linecap="round"/></svg>',
  dillo:'<svg class="dl-walk" viewBox="0 0 28 18"><path d="M4 9.5 1 12.5" stroke="#a16207" stroke-width="1.6" stroke-linecap="round"/><path d="M3 14C3 5.5 8.5 2 13.5 2S22.5 5.5 22.5 11v3Z" fill="#b45309"/><path d="M8 3.6V14M11.8 2.3V14M15.6 2.4V14M19.3 4.4V14" stroke="#78350f" stroke-width="1.3"/><path d="M5 12.5h17" stroke="#fbbf24" stroke-width="1" opacity=".5"/><path d="M21 8.5c3.4 0 6.2 2.2 6.4 4.4.1.8-.5 1.1-1.2 1.1H21Z" fill="#e7b47a"/><path d="M21.4 8.8 22.6 5.8 23.8 8.9Z" fill="#e7b47a"/><circle cx="23.4" cy="10.6" r="1" fill="#111"/><circle cx="27.2" cy="12.9" r=".7" fill="#7c2d12"/><rect class="ft-a" x="6" y="13.5" width="3.2" height="4" rx="1.2" fill="#78350f"/><rect class="ft-b" x="16" y="13.5" width="3.2" height="4" rx="1.2" fill="#78350f"/></svg><svg class="dl-ball" viewBox="0 0 18 18"><circle cx="9" cy="9" r="8.4" fill="#b45309"/><path d="M2.4 5.6Q9 3 15.6 5.6M1 9.4Q9 6.6 17 9.4M2.4 13Q9 10.4 15.6 13" stroke="#78350f" stroke-width="1.3" fill="none"/><circle cx="6" cy="5" r="1.6" fill="#fbbf24" opacity=".45"/></svg>',
  rabbit:'<svg viewBox="0 0 22 26"><g class="hp-ears"><rect x="5" y="0" width="3.4" height="10" rx="1.7" fill="#fb923c"/><rect x="11.5" y="-.5" width="3.4" height="10" rx="1.7" fill="#fb923c" transform="rotate(12 13 9)"/><rect x="6" y="1.5" width="1.4" height="6" rx=".7" fill="#fed7aa"/></g><rect x="2" y="7" width="17" height="12" rx="6" fill="#f8fafc" stroke="#94a3b8" stroke-width="1"/><rect x="6" y="10" width="11" height="4.4" rx="2.2" fill="#0f172a"/><circle class="hp-eye" cx="14" cy="12.2" r="1.4" fill="#22d3ee"/><circle cx="18.6" cy="15" r="1.1" fill="#f472b6"/><path class="hp-spring" d="M7 19l7 1.4-7 1.4 7 1.4-7 1.4" stroke="#64748b" stroke-width="1.2" fill="none"/></svg>',
 };
 const KRAKEN='<svg viewBox="0 -8 64 60"><defs><radialGradient id="kr-skin" cx="38%" cy="28%" r="75%"><stop offset="0" stop-color="#d8b4fe"/><stop offset=".55" stop-color="#9333ea"/><stop offset="1" stop-color="#581c87"/></radialGradient></defs>'
  +'<g class="kr-arms" fill="#7e22ce">'+[8,17,26,35,44,53].map((x,i)=>`<path class="kr-arm kr-a${i%3}" d="M${x} 32c-4 6-5 11-2 16 1.4 2.2 4 1.6 3.4-.8-1-3.6.4-8 3.6-12Z"/>`).join('')+'</g>'
  +'<path d="M7 34C2 14 15 3 32 3s30 11 25 31c-6 7-44 7-50 0Z" fill="url(#kr-skin)"/><circle cx="15" cy="15" r="2.6" fill="#c084fc"/><circle cx="21" cy="9" r="1.7" fill="#c084fc"/><circle cx="12" cy="24" r="1.5" fill="#c084fc"/>'
  +'<path d="M21 6 23 -4l5 6 4-8 4 8 5-6 2 10Z" fill="#facc15" stroke="#a16207" stroke-width="1"/><circle cx="32" cy="-1" r="1.6" fill="#ef4444"/>'
  +'<circle cx="36" cy="19" r="6.4" fill="#fff"/><circle cx="50" cy="19" r="6.4" fill="#fff"/><circle class="kr-eye" cx="38.4" cy="20" r="3.2" fill="#111"/><circle class="kr-eye" cx="52.4" cy="20" r="3.2" fill="#111"/><circle cx="37.2" cy="18.6" r="1" fill="#fff"/><circle cx="51.2" cy="18.6" r="1" fill="#fff"/>'
  +'<path class="kr-brow" d="M29.5 10.5 41 15M57 10.5 45.5 15" stroke="#3b0764" stroke-width="3.2" stroke-linecap="round"/>'
  +'<g class="kr-mouth"><ellipse cx="46" cy="31" rx="6.5" ry="3.6" fill="#1c1917"/><ellipse cx="46.5" cy="32" rx="3.6" ry="1.8" fill="#f97316"/><path d="M40.5 28.6l1.8 2.6 1.8-2.6M47.5 28.6l1.8 2.6 1.8-2.6" fill="#fff"/></g></svg>';
 const FOE_FACE={fire:'\u{1F525}'};
 function foeMarkup(f){
  if(f.kind==='jet')return `<i class="tl-foe jet" data-foe="${esc(f.id)}" style="left:${f.x.toFixed(1)}px;top:${f.y.toFixed(1)}px" title="PR Advisor finding" aria-hidden="true"></i>`;
  if(f.kind==='spike')return `<i class="tl-foe spike" data-foe="${esc(f.id)}" style="left:${f.x.toFixed(1)}px;top:${f.y.toFixed(1)}px" title="PR Advisor finding" aria-hidden="true"></i>`;
  if(f.goon)return `<i class="tl-foe roll goon g-${f.bar.kind}${f.alive?'':' gone'}" data-foe="${esc(f.id)}" style="left:${f.x.toFixed(1)}px;top:${f.y.toFixed(1)}px" aria-hidden="true"><span class="goon"><b></b></span></i>`;
  if(f.kind==='king')return `<i class="tl-foe king${f.alive?'':' gone'}" data-foe="${esc(f.id)}" style="left:${f.x.toFixed(1)}px;top:${f.y.toFixed(1)}px" aria-hidden="true"><b class="tl-boss-bar" aria-label="${f.hp} of ${f.max}"><i style="width:${(100*f.hp/f.max).toFixed(0)}%"></i></b><span class="kraken">${KRAKEN}</span></i>`;
  return `<i class="tl-foe ${f.kind}${f.icon?` i-${f.bar.kind||'ball'}`:''}${f.alive?'':' gone'}" data-foe="${esc(f.id)}" style="left:${f.x.toFixed(1)}px;top:${f.y.toFixed(1)}px" aria-hidden="true">${f.word?`<code>${esc(f.icon)}</code>`:`<span>${CAST[f.kind]||f.icon||FOE_FACE[f.kind]}</span>`}</i>`;}
 function paintFoes(){
  for(const f of g.foes){let e=track.querySelector(`[data-foe="${CSS.escape(f.id)}"]`);
   if(!e&&f.alive){track.insertAdjacentHTML('beforeend',foeMarkup(f));e=track.lastElementChild;}if(!e)continue;
   e.style.left=`${f.x.toFixed(1)}px`;e.style.top=`${f.y.toFixed(1)}px`;e.classList.toggle('gone',!f.alive);
   if(f.dir)e.classList.toggle('left',f.dir<0);if(f.shell){e.classList.add('shell');e.classList.toggle('rolling',Boolean(f.vx));}if(f.kind==='jet')e.classList.toggle('on',f.on);if(f.icon){e.classList.toggle('off',f.on===false&&!f.warn);e.classList.toggle('warn',Boolean(f.warn));if(f.warn)e.style.setProperty('--drop',`${(f.bar.y-f.y).toFixed(0)}px`);}
   if(f.kind==='king'){e.classList.toggle('hurt',f.hurt>0);e.classList.toggle('low',Boolean(f.low));e.classList.toggle('breath',f.breath>0);e.classList.toggle('angry',Boolean(f.angry));const hp=e.querySelector('.tl-boss-bar i');if(hp)hp.style.width=`${(100*Math.max(0,f.hp)/f.max).toFixed(0)}%`;}}
  for(const e of track.querySelectorAll('.tl-foe.fire'))if(!g.foes.some(f=>f.id===e.dataset.foe))e.remove();
  for(const y of g.balls){let e=track.querySelector(`[data-shot="${CSS.escape(y.id)}"]`);if(!e){track.insertAdjacentHTML('beforeend',`<i class="tl-shot${y.vx<0?' left':''}" data-shot="${esc(y.id)}" aria-hidden="true">\u2713</i>`);e=track.lastElementChild;}
   e.style.left=`${y.x.toFixed(1)}px`;e.style.top=`${y.y.toFixed(1)}px`;}
  for(const e of track.querySelectorAll('.tl-shot'))if(!g.balls.some(y=>y.id===e.dataset.shot))e.remove();}
 function showCard(kind,html,ms=0){g.card={kind,until:ms?now()+ms:Infinity};card.innerHTML=html;card.hidden=false;keys.pressed=false;}
 function startStage(tl){const rc=readCourse(tl);if(!rc||!rc.course.bars.length)return false;const ids=pills().map(e=>e.dataset.id);
  const foes=placeFoes?placeFoes(rc.course,{boss:boss(tl.dataset.tlId)}):[];
  Object.assign(g,{id:tl.dataset.tlId,sig:rc.sig,course:rc.course,food:foodOf(rc.course,foes),foes,flags:placeFlags?placeFlags(rc.course,foes):[],flagsSeen:new Set(),check:null,balls:[],thrown:0,coolUntil:0,got:new Set(),base:g.score,p:player(rc.course),t0:now(),pending:null,card:null,respawn:0,
   boxes:placeBoxes?placeBoxes(rc.course):[],pows:arenaPower?arenaPower(rc.course):[],chain:0,starUntil:0,clock:stageTime?stageTime(rc.course):0,
   n:Math.max(1,ids.indexOf(tl.dataset.tlId)+1),of:Math.max(1,ids.length)});
  g.timeLeft=g.clock;g.safe={...rc.course.start};card.hidden=true;hide();el.hidden=false;layer.hidden=false;pose('jump');paintFood();caption(`Stage ${g.n} · ${prNum(g.id)}`,1600);return true;}
 const cast=k=>`<i class="gc-cast">${CAST[k]}</i>`,FOE_ICON={glitch:cast('glitch'),drone:cast('drone'),dillo:cast('dillo'),rabbit:cast('rabbit'),spike:'<i class="gc-spike"></i>',jet:'\u{1F525}',king:`<i class="gc-cast gc-kraken">${KRAKEN}</i>`};
 function foeIcons(foes){const n=k=>foes.filter(f=>f.kind===k).length,d=foes.find(f=>f.kind==='king'),obs=new Map();
  for(const f of foes)if(f.icon||f.goon){const k=f.goon?'<i class="gc-goon"></i>':f.icon;obs.set(k,(obs.get(k)||0)+1);}
  const fails=Object.keys(FOE_ICON).filter(k=>k!=='king'&&n(k)).map(k=>`<span>${FOE_ICON[k]}<b>\u00D7${n(k)}</b></span>`);
  return [...fails,...[...obs].map(([i,c])=>`<span>${i}<b>\u00D7${c}</b></span>`),d?`<span>${FOE_ICON.king}<b>HP ${d.max}</b></span>`:''].join('');}
 const beatSay=f=>f.goon?'Squashed!':f.bar?.kind==='e2e'&&f.icon?'Caught the mouse!':f.kind==='rabbit'?'Got the rabbit!':'Squashed!';
 const kbd=(...k)=>k.map(x=>`<kbd>${x}</kbd>`).join('');
 function stageCard(){showCard('ready',`<em class="gc-tag">${esc(prNum(g.id))}</em><strong>Stage ${g.n}<small>/${g.of}</small></strong>${(g.foes||[]).length?`<div class="gc-foes">${foeIcons(g.foes)}</div>`:''}<div class="gc-keys"><span>${kbd('Space')}jump</span><span>${kbd('\u2190','\u2192')}run</span><span>${kbd('\u2193')}drop</span><span>${kbd('X')}shoot, with a laser</span></div><p class="gc-go">Press Space</p>`);}
 function newGame(tl){g={lives:LIVES,score:0,coins:0,power:'small'};doc.activeElement?.blur?.();if(tl&&startStage(tl))stageCard();}
 // Out of lives: all nine back, at the last flag reached on this stage, or its start, with the score it had there.
 function continueGame(){const at=g.check||{...g.course.start,score:g.base};
  Object.assign(g,{lives:LIVES,score:at.score,safe:{x:at.x,y:at.y,on:at.on},respawn:now()+300});el.hidden=true;}
 function advance(){const next=nextStage(pills().map(e=>e.dataset.id),g.id);
  if(!next){finish();return;}g.pending=next;g.waitUntil=now()+4000;card.hidden=true;g.card=null;pills().find(e=>e.dataset.id===next)?.click();}
 function finish(){const best=recordBest(loadBest(),{total:g.score});saveBest(best);
  showCard('done',`<strong>You win!</strong><dl><div><dt>Score</dt><dd>${g.score}</dd></div><div><dt>Lives</dt><dd>${g.lives}</dd></div><div><dt>Best</dt><dd>${best.total}</dd></div></dl><p class="gc-go">Space to play again</p>`);caption('All done!',2400);}
 function clearStage(){const bonus=CLEAR_BONUS+Math.ceil(g.timeLeft||0),stage=g.score-g.base+bonus;g.score+=bonus;saveBest(recordBest(loadBest(),{id:g.id,stage,total:g.score}));voice.call('trill');
  showCard('clear',`<em class="gc-tag">${esc(prNum(g.id))}</em><strong>Stage clear!</strong><dl><div><dt>Lives</dt><dd>${g.lives}</dd></div><div><dt>Time</dt><dd>${clock(now()-g.t0)}</dd></div><div><dt>Score</dt><dd>${g.score}</dd></div></dl><p class="gc-go">${nextStage(pills().map(e=>e.dataset.id),g.id)?'Next stage':'Space'}</p>`,2800);caption('Stage clear!',2400);}
 function loseLife(){g.lives--;g.power='small';g.starUntil=0;g.chain=0;g.timeLeft=g.clock;voice.call('protest');
  if(g.lives<=0){saveBest(recordBest(loadBest(),{total:g.score}));showCard('over',`<strong>Game over</strong><dl><div><dt>Score</dt><dd>${g.score}</dd></div><div><dt>Best</dt><dd>${loadBest()?.total||g.score}</dd></div></dl><p class="gc-go">Space: continue from ${g.check?'\u{1F6A9}':'stage start'}</p>`);return;}
  g.respawn=now()+900;el.hidden=true;}
 function endGame(){g=null;el.classList.remove('big','laser','star','blink');layer.hidden=true;card.hidden=true;for(const k in keys)keys[k]=false;el.hidden=true;hide();awayUntil=0;}
 // One frame of the game; false when the game has nothing to show yet.
 function gameFrame(dt,tl){
  if(!g){if(!tl)return false;newGame(tl);return true;}
  if(g.pending&&tl?.dataset.tlId!==g.pending){if(now()>g.waitUntil){g.id=g.pending;g.pending=null;advance();}return true;}
  if(!tl)return true;
  if(tl.dataset.tlId!==g.id||g.pending){if(!startStage(tl)){if(now()>(g.waitUntil||0)){g.id=tl.dataset.tlId;advance();}return true;}}
  const gv=gameView(tl);if(!gv)return true;const {view,lw}=gv;
  if(`${view.querySelectorAll('.jl-tl-seg').length}:${view.scrollWidth}`!==g.sig){const r=readCourse(tl);if(r?.course.bars.length){g.sig=r.sig;g.course=r.course;if(placeFoes&&keepFoes)g.foes=keepFoes(placeFoes(r.course,{boss:boss(g.id)}),g.foes);g.food=foodOf(r.course,g.foes);g.flags=placeFlags?placeFlags(r.course,g.foes):[];if(placeBoxes)g.boxes=keepBoxes(placeBoxes(r.course),g.boxes);paintFood();}}
  const c=g.course,t=now();
  if(g.card){if(keys.pressed||t>=g.card.until){keys.pressed=false;const k=g.card.kind;card.hidden=true;g.card=null;if(k==='ready')g.t0=t;else if(k==='clear')advance();else if(k==='over')continueGame();else newGame(tl);}}
  else if(g.respawn){if(t>=g.respawn){g.respawn=0;g.safeUntil=now()+1500;Object.assign(g.p,{x:g.safe.x,y:g.safe.y,vx:0,vy:0,ground:g.safe.on||null,rope:null});el.hidden=false;
   say(g.lives===8?'Cats have nine lives. I have eight left.':g.lives===1?'Last life. Careful now.':`${g.lives} lives left.`,2200);}}
  else{const live=(g.boxes||[]),surf=[...surfacesOf(c),...live.map(b=>b.surf)];acc+=dt;
   while(acc>=STEP){const y0=g.p.y,r=stepPlayer(g.p,keys,STEP,surf,{left:c.inset+CAT_W/2,right:c.width-CAT_W/2,ropes:c.ropes});keys.pressed=false;acc-=STEP;if(r.landed)landT=t;if(g.p.ground||g.p.rope)g.chain=0;
    const hitBox=bumpBox?.(g.p,live,y0);if(hitBox){const e=track.querySelector(`[data-box="${CSS.escape(hitBox.id)}"]`);e?.classList.remove('bump');void e?.offsetWidth;e?.classList.add('bump');
     const out=openBox(hitBox,g.power);if(out){e?.classList.add('used');voice.call('chirp');
      if(out.kind==='coin'){g.score+=FOOD.kibble;addCoins(1);e?.insertAdjacentHTML('beforeend','<i class="tl-coin-pop"></i>');}else{g.pows.push(out);track.insertAdjacentHTML('beforeend',powMarkup(out));}}}}
   if(!g.card&&!g.respawn&&g.clock){g.timeLeft-=dt;if(g.timeLeft<=0){caption('Time up!',1400);loseLife();}}
   const pow=grabPower?.(g.p,g.pows);if(pow){pow.alive=false;track.querySelector(`[data-pow="${CSS.escape(pow.id)}"]`)?.remove();g.score+=100;voice.call('trill');caption(POW_SAY[pow.kind],1400);
    if(pow.kind==='fish')g.starUntil=t+STAR*1000;else g.power=powerAfter(g.power,pow.kind);}
   const held=g.p.rope?.key||null,ropeEl=k=>track.querySelector(`[data-rope="${CSS.escape(k)}"]`);
   if(held!==g.held){const was=g.held&&ropeEl(g.held);if(was){was.classList.remove('held');was.style.removeProperty('transform');was.style.height=`${was.dataset.len}px`;}g.held=held;}
   if(held){const el=ropeEl(held);if(el){el.classList.add('held');el.style.height=`${g.p.ropeLen.toFixed(1)}px`;el.style.transform=`rotate(${(-g.p.th).toFixed(3)}rad)`;}}
   if(g.p.ground)g.safe={...safeSpot(g.p,g.p.ground),on:g.p.ground};
   const flag=flagReached?.(g.p,g.flags||[],g.flagsSeen);if(flag){g.flagsSeen.add(flag.id);g.check={x:flag.x+16,y:flag.y,on:g.p.ground,score:g.score};
    track.querySelector(`[data-flag="${CSS.escape(flag.id)}"]`)?.classList.add('up');caption('Checkpoint!',1200);voice.call('chirp');}
   const got=collect(g.p,g.food,g.got);if(got.length){g.score+=points(got);addCoins(got.filter(f=>f.kind==='kibble').length+5*got.filter(f=>f.kind==='gold').length);for(const f of got)track.querySelector(`[data-food="${CSS.escape(f.id)}"]`)?.classList.add('got');
    const heart=got.some(f=>f.kind==='heart');if(heart)g.lives=Math.min(LIVES,g.lives+1);
    if(heart){caption('Extra life!',1200);voice.call('trill');}
    else if(got.some(f=>f.kind==='gold')){caption('Gold!',900);voice.call('chirp');}else if(Math.random()<.18)caption(['Yum!','Crunch','Nom'][Math.floor(Math.random()*3)],700);}
   if(keys.fire&&shoot&&g.power==='laser'&&t>=g.coolUntil&&!g.p.rope){g.coolUntil=t+SHOT_COOL*1000;g.balls.push(shoot(g.p,++g.thrown));}
   if(g.balls.length&&stepShots)for(const h of stepShots(g.balls,dt,g.foes||[])){g.score+=h.points;const f=h.foe;
    if(f.kind==='king'){if(!f.alive){caption('Kraken defeated!',2400);voice.call('trill');}else if(f.angry&&!g.toldAngry){g.toldAngry=true;caption('It is angry!',1200);}}
    else caption(f.kind==='fire'?'Put it out!':beatSay(f),800);}
   if(g.foes?.length||g.balls.length){const knocked=[];stepFoes(g.foes,dt,g.p,{view:view.clientWidth-lw,knocked});for(const k of knocked){g.score+=20;caption('Bowled over!',700);}
    const star=t<g.starUntil,hit=!star&&t<(g.safeUntil||0)?null:touchFoes(g.p,g.foes);
    // With the golden fish, whatever the cat runs into is knocked out, all but the Merge Kraken, which it just passes.
    if(hit&&star){const f=hit.foe;if(f.kind!=='king'&&f.kind!=='spike'&&f.kind!=='jet'){g.score+=hitFoe(f);caption('Knocked out!',700);voice.call('chirp');}}
    else if(hit?.hit==='stomp'){const f=hit.foe,pts=stomp(g.p,f);voice.call('chirp');
     if(f.kind==='king'){g.score+=pts;caption(f.alive?'Ouch, Kraken!':'Kraken defeated!',f.alive?900:2400);}
     else{const ch=chainPoints?chainPoints(g.chain++):{points:pts,life:false};if(ch.life){g.lives=Math.min(LIVES,g.lives+1);caption('Extra life!',1200);}else{g.score+=ch.points;caption(f.shell?'Shell!':`${beatSay(f)} +${ch.points}`,800);}}}
    else if(hit?.hit==='kick'){g.score+=kickFoe(g.p,hit.foe);voice.call('chirp');caption('Kick!',600);}
    else if(hit){if(hit.foe.kind==='fire')hit.foe.alive=false;hurt(hit.foe.kind==='spike'?'Spikes!':hit.foe.kind==='jet'||hit.foe.kind==='fire'?'Too hot!':'Ouch!');}
    paintFoes();}
   if(g.respawn||g.card){}
   else if(outOfCourse(g.p,c))loseLife();else if(cleared(g.p,c)){if(bossLeft?.(g.foes||[])){if(!g.toldBoss||now()-g.toldBoss>3000){g.toldBoss=now();caption('Beat the Kraken first!',1600);}}else clearStage();}}
  const sl=camera(g.p.x,view.clientWidth,view.scrollWidth,lw);if(Math.abs(view.scrollLeft-sl)>.5)view.scrollLeft=sl;
  const vr=view.getBoundingClientRect(),box=tl.getBoundingClientRect();sc={id:g.id,view,box,plats:[],floor:vr.bottom-box.top,left:vr.left-box.left+lw,right:vr.right-box.left};
  layer.style.transform=`translate(${vr.left.toFixed(1)}px,${vr.top.toFixed(1)}px)`;layer.style.width=`${vr.width}px`;layer.style.height=`${vr.height}px`;layer.style.clipPath=`inset(0 0 0 ${lw}px)`;
  track.style.transform=`translateX(${(-view.scrollLeft).toFixed(1)}px)`;
  el.classList.toggle('big',g.power!=='small');el.classList.toggle('laser',g.power==='laser');el.classList.toggle('star',t<g.starUntil);el.classList.toggle('blink',t<(g.safeUntil||0));
  const left=Math.max(0,Math.ceil(g.timeLeft||0));
  hud.innerHTML=`<span class="food">${g.score}</span><span class="coins" title="Coins">${g.coins||0}</span><span class="lives" title="Lives">${'\u2665'.repeat(Math.max(0,g.lives))}</span>${g.clock?`<span class="clock${left<=30?' low':''}" title="Time left">${left}</span>`:''}<span>Stage ${g.n}/${g.of} · ${esc(prNum(g.id))}</span>`;
  if(el.hidden)return true;
  const p=g.p;b.x=vr.left-box.left+p.x-view.scrollLeft;b.y=vr.top-box.top+p.y;
  // On a rope it turns to face the rope, its back to the page; off it, the way it runs.
  if(Math.abs(p.vx)>12&&!p.rope)s.face=p.vx>0?1:-1;s.back=Boolean(p.rope);const aim=p.rope?0:s.face;s.vis+=Math.max(-dt*TURN,Math.min(dt*TURN,aim-s.vis));s.surf=p.ground;s.mode=p.ground?'idle':'air';
  s.tilt=p.ground?0:p.rope?-p.th*180/Math.PI:Math.max(-22,Math.min(22,Math.atan2(p.vy,Math.abs(p.vx)+60)*20));
  pose(p.rope?'rope':!p.ground?'jump':t-landT<120?'land':Math.abs(p.vx)>150?'run':Math.abs(p.vx)>10?'walk':'stand');
  draw();return true;
 }
 const typing=e=>e.target?.closest?.('input,textarea,select,[contenteditable=""],[contenteditable="true"]');
 const KEY={' ':'jump',ArrowUp:'jump',w:'jump',W:'jump',ArrowLeft:'left',a:'left',A:'left',ArrowRight:'right',d:'right',D:'right',ArrowDown:'down',s:'down',S:'down',x:'fire',X:'fire',f:'fire',F:'fire'};
 doc.addEventListener('keydown',e=>{if(!g||typing(e)||e.metaKey||e.ctrlKey||e.altKey)return;const k=KEY[e.key];
  if(e.key==='Escape'){doc.querySelector('[data-do="tlGame"][aria-pressed="true"]')?.click();return;}
  if(e.key==='Enter'&&g.card){e.preventDefault();keys.pressed=true;return;}
  if(!k)return;e.preventDefault();if(k==='fire'){if(!g.card)keys.fire=true;return;}if(k==='jump'&&!e.repeat)keys.pressed=true;keys[k]=true;});
 doc.addEventListener('keyup',e=>{if(!g)return;const k=KEY[e.key];if(!k)return;e.preventDefault();keys[k]=false;});
 win.addEventListener('blur',()=>{for(const k in keys)keys[k]=false;});
 let lostAt=0;const LOST_MS=1500;
 function frame(ts){
  const dt=Math.min(.05,last?(ts-last)/1000:0);last=ts;
  ropeStep(dt);wobStep(dt);chipsStep(dt);rollsStep(dt);swayStep(dt);charts.step(dt);
  const on=Boolean(GAME)&&doc.documentElement.hasAttribute('data-cat-game'),gtl=on&&doc.querySelector('.jl-tl[data-tl-id][data-game]');
  if(on&&(gtl||g)){let ok=false;try{ok=gameFrame(dt,gtl);}catch(e){acc=0;win.console?.error?.(e);ok=true;}if(ok){win.requestAnimationFrame(frame);return;}}
  else if(g&&!on)endGame();
  // A timeline missing for a moment, as while the page redraws it, only pauses the cat; it goes once it stays gone.
  const seenSc=scene();if(seenSc){sc=seenSc;lostAt=0;}else if(el.hidden||(lostAt||=now())+LOST_MS<now())sc=null;
  if(seenSc){all=surfaces(sc.plats,sc.floor,sc.left-CAT_W*2,sc.right+CAT_W*2).filter(p=>!p.floor);follow();}
  toysStep(dt);showStep();
  if(!sc){if(!el.hidden){el.hidden=true;hide();}}
  else if(!seenSc){win.requestAnimationFrame(frame);return;}
  else if(want()&&el.hidden){if(now()>=awayUntil)enter();}
  else if(want()&&s.leaving&&!s.comeback)s.leaving=false;
  else if(!want()&&!el.hidden&&!s.leaving){if(reducedMotion()){el.hidden=true;hide();}else{hide();s.leaving=true;}}
  // A step that throws resets the cat to standing rather than stopping the loop that animates it.
  if(sc&&!el.hidden){try{acc+=dt;while(acc>=STEP){tick(STEP);acc-=STEP;}if(!el.hidden)draw();}catch(e){acc=0;Object.assign(s,{mode:'air',walk:null,hop:null,route:null,carry:null});win.console?.error?.(e);}}
  if(el.hidden){last=0;acc=0;win.setTimeout(()=>win.requestAnimationFrame(frame),700);}else win.requestAnimationFrame(frame);
 }
 // The Play game menu's two items.
 function menuDo(d){if(d==='nap'){mood('nap');caption(s.mood==='nap'?'Nap time':'Awake',1600);}}
 function touch(name){
  if(name==='poke')return poke();
  if(name==='say')return talk();
  if(name==='shake'){act('dizzy',2600);return;}
  if(name==='drag'){act('beg',1400);say('Grab me and drag me',2000);}
 }
 function stopAll(){}
 // It thinks for a moment (the voice takes a second or two to make the line), then says it as it speaks, or after 2.5 s
 // without waiting longer for the voice.
 async function talk(given){if(!act('say',9000))return;const text=given||catLine({bar:s.surf?.info,status:line(sc?.id),station:s.surf?.li?.querySelector('.jl-label strong')?.textContent?.trim(),work:workOf(sc?.id),jokes});say('\u00B7 \u00B7 \u00B7',0,true);
  let shown=false;const show=()=>{if(shown||s.act?.name!=='say')return;shown=true;const ms=Math.max(2600,text.length*70);say(text,ms);s.act.until=now()+ms;};
  later(2500,show);await voice.speak(text);show();}
 // A double-click reads the PR's line out loud; without one it falls back to its usual chatter.
 function readLine(){if(s.mood)mood(null);voice.cue('line');const t=String(read(sc?.id)||'').trim();talk(t?`${prNum(sc?.id)}: ${t}.`.replace(/\.\.$/,'.'):'');}
 // Touch: a tap plays the next trick, a double tap opens the trick panel, and a drag carries it by the scruff. A single tap
 // waits out the double-tap window so a double-click does not also start a trick.
 const meter=shakeMeter(),TAP_GAP=260;let tapTimer=0;
 doc.addEventListener('pointermove',e=>{if(!sc||g)return;const prev=pointer;pointer={x:e.clientX-sc.box.left,y:e.clientY-sc.box.top};
  if(s.down&&s.mode!=='carry'&&Math.hypot(e.clientX-s.down.x,e.clientY-s.down.y)>5){s.down.moved=true;clearTimers();endAct();if(s.mood)mood(null);s.route=null;s.walk=null;s.falling=false;s.mode='carry';s.surf=null;s.carry=pointer;s.shakes=0;pose('dangle');voice.call('protest');}
  if(s.mode==='carry'){const t=now(),vx=prev?(pointer.x-prev.x)/Math.max(1,(t-(s.lastMove||t)))*1000:0;s.lastMove=t;s.shakes=Math.max(s.shakes,meter(vx,t));s.carry=pointer;}});
 el.addEventListener('pointerdown',e=>{if(e.button!==0||s.mode==='peek'||g)return;e.preventDefault();e.stopPropagation();s.down={x:e.clientX,y:e.clientY};el.setPointerCapture?.(e.pointerId);});
 el.addEventListener('pointerup',e=>{const d=s.down;s.down=null;e.stopPropagation();if(!d)return;
  if(s.mode==='carry'){capSpeed(b);s.mode='air';pose('jump');if(s.shakes>=4)s.after=()=>act('dizzy',2600);return;}
  if(tapTimer){win.clearTimeout(tapTimer);tapTimer=0;openPanel();return;}
  tapTimer=win.setTimeout(()=>{tapTimer=0;trick();},TAP_GAP);});
 const panel=doc.createElement('aside');panel.className='tl-cat-panel';panel.hidden=true;panel.setAttribute('role','dialog');panel.setAttribute('aria-label','Cat tricks');doc.body.append(panel);
 const paintPanel=()=>{if(!panel.hidden&&!panel.contains(doc.activeElement?.closest?.('.tl-cat-name')))panel.innerHTML=trickPanelMarkup({mood:s.mood,...pet&&{name:catName,hunger:hunger()},pet});};
 // A new name is kept once you press Enter or leave the field, and the cat answers to it.
 const rename=f=>{if(setName(f.value)&&sc&&!el.hidden){say(`I'm ${catName}!`,1800);voice.call('trill');}f.value=catName;};
 panel.addEventListener('keydown',e=>{if(!e.target.matches?.('.tl-cat-name'))return;e.stopPropagation();if(e.key==='Enter'){e.preventDefault();e.target.blur();}else if(e.key==='Escape'){e.target.value=catName;e.target.blur();closePanel();}});
 panel.addEventListener('focusout',e=>{if(e.target.matches?.('.tl-cat-name'))rename(e.target);});
 // Beside the cat on its right, or its left where the window ends, kept inside the window.
 function placePanel(){const r=el.getBoundingClientRect(),w=panel.offsetWidth,h=panel.offsetHeight,W=win.innerWidth,H=win.innerHeight;
  let x=r.right+10;if(x+w>W-8)x=r.left-10-w;x=Math.max(8,Math.min(W-w-8,x));const y=Math.max(8,Math.min(H-h-8,r.top+r.height/2-h/2));
  panel.style.left=`${x.toFixed(0)}px`;panel.style.top=`${y.toFixed(0)}px`;}
 function openPanel(){panel.hidden=false;paintPanel();placePanel();panel.querySelector('.tl-cat-trick')?.focus({preventScroll:true});}
 const closePanel=()=>{panel.hidden=true;};
 // A trick picked in the air or mid-hop plays once it lands.
 function playTrick(name){const r=REACTIONS.find(x=>x[0]===name);if(!r)return;if(s.mood)mood(null);if(el.dataset.pose==='sleep')endAct();
  const go=()=>{s.quest=null;s.feast=false;s.route=null;s.walk=null;if(s.mode==='walk')s.mode='idle';if(act(r[0],r[2]))caption(r[1],r[2]);};
  if(['idle','walk','land'].includes(s.mode))go();else if(!['carry','peek'].includes(s.mode))s.after=go;}
 panel.addEventListener('click',e=>{const t=e.target.closest?.('[data-cat-kind]');if(!t)return;e.stopPropagation();const {catKind:k,catId:id}=t.dataset;
  // A pick closes the panel first, so nothing stands between you and the cat doing it.
  closePanel();if(k==='close'||el.hidden||!sc)return;
  if(k==='trick')playTrick(id);else if(k==='mood'){mood(id);caption(s.mood?MOODS.find(m=>m[0]===id)[1]:'Back to normal',1400);}else if(k==='touch')touch(id);else if(k==='line')readLine();else if(k==='feed')feed();});
 doc.addEventListener('keydown',e=>{if(e.key==='Escape'&&!panel.hidden)closePanel();});
 doc.addEventListener('pointerdown',e=>{if(!panel.hidden&&!panel.contains(e.target)&&!el.contains(e.target))closePanel();});
 // A tap plays its next trick; it wakes up first if it is asleep, and a tap ends a mood.
 function trick(){if(s.mood){mood(null);return;}if(el.dataset.pose==='sleep'){endAct();act('stretch',1500);return;}
  if(!['idle','walk','land'].includes(s.mode))return;const [name,label,ms]=REACTIONS[cycle%REACTIONS.length];cycle++;s.quest=null;s.feast=false;if(act(name,ms))caption(label,ms);}
 // The cat hidden or gone, its panel goes too.
 const keepPanel=()=>{if(!panel.hidden&&(el.hidden||!sc))closePanel();win.setTimeout(keepPanel,800);};keepPanel();
 const busy=()=>g||el.hidden||!sc||['carry','peek'].includes(s.mode);
 function sendTo(t,x,goof=false,at=null){
  if(s.mood)mood(null);endAct();s.route=null;s.goal=null;if(s.mode==='walk')s.mode='idle';s.walk=null;
  s.quest={key:t.key,y:t.y,x:Math.max(t.l+10,Math.min(t.r-10,x)),goof,detours:goof?0:Math.random()<.8?1+(Math.random()<.45?1:0):0};
  if(goof){mark(s.quest,at);hungry(at);}else{glyph('head','!');voice.call('chirp');}s.face=x>=b.x?1:-1;s.nextThink=now()+(goof?900:380);}
 // A fish dropped: it smells it, wisps drifting from the fish to its nose, says it is hungry, and sets off.
 function hungry(at){voice.call('meow');say(HUNGRY[Math.floor(Math.random()*HUNGRY.length)],1500);
  const nose=headAt(),from=at||nose;for(let i=0;i<3;i++)later(i*220,()=>{const g=doc.createElement('i');g.className='tl-cat-fx fx-smell';g.textContent='\u223F';
   g.style.left=`${from.x+rand(-6,6)}px`;g.style.top=`${from.y-10+rand(-4,4)}px`;g.style.setProperty('--dx',`${(nose.x-from.x).toFixed(0)}px`);g.style.setProperty('--dy',`${(nose.y-from.y).toFixed(0)}px`);
   doc.body.append(g);win.setTimeout(()=>g.remove(),1500);});}
 // Fed from its panel: a fish lands a few steps along the surface it is on, or the nearest one.
 function feed(){if(busy())return;const t=s.surf||nearest(b.x,b.y);if(!t)return;
  const x=Math.max(t.l+10,Math.min(t.r-10,b.x+s.face*rand(60,110)));sendTo(t,x,true,{x:sc.box.left+x,y:sc.box.top+t.y-40});}
 const HUNGRY=['Hungry!','Is that fish?','Sniff sniff','Mine!','Food!'],YUM=['Yummy!','Yum yum!','Delicious!','Mmm, fish'];
 doc.addEventListener('click',e=>{const seg=e.target.closest?.('.jl-tl-seg');if(!seg||busy())return;
  const r=seg.getBoundingClientRect(),x=e.clientX-sc.box.left,y=r.top-sc.box.top,t=all.find(p=>!p.floor&&Math.abs(p.y-y)<4&&x>=p.l-4&&x<=p.r+4);if(!t)return;
  sendTo(t,x);});
 /* A double-click anywhere off the cat sends it there the long way round: to the surface under or nearest the spot,
    with a marker on it, goofing about on the way. Controls, text fields and anything with its own click action keep their double-click. */
 doc.addEventListener('dblclick',e=>{if(busy()||el.contains(e.target)||e.target.closest?.('button,a,input,textarea,select,label,table,[role="grid"],[role="dialog"],[contenteditable],[data-do],.jl-cat-menu,.tl-cat-panel'))return;
  const x=e.clientX-sc.box.left,y=e.clientY-sc.box.top,t=nearest(x,y);if(!t)return;
  const sel=win.getSelection?.();if(sel&&!sel.isCollapsed)sel.removeAllRanges();sendTo(t,x,true,{x:e.clientX,y:e.clientY});});
 el.addEventListener('click',e=>e.stopPropagation());
 win.requestAnimationFrame(frame);
 /* A new page: the cat and its toys go, and come back on the new page's boxes once it has drawn, somewhere new. */
 function reset(){toysOff();charts.reset();el.hidden=true;hide();unchipAll();awayUntil=toysAfter=now()+700;gate={from:now(),at:0,sig:'',since:0,done:false};}
 win[global]={reset,playable:Boolean(GAME),perform:(ms,o)=>show(ms,o),performing:()=>showing(),toys:()=>toys.map(({kind,x,y,vx,vy,rot,spin,on,thread,cordAwake,catBats,cordSwats,trod,snags})=>({kind,x,y,vx,vy,rot,spin,on,catBats:catBats||0,cordSwats:cordSwats||0,trod:trod||0,snags:snags||0,cord:thread?{points:thread.length,resting:thread.filter(q=>q.on).length,awake:Boolean(cordAwake)}:null})),climb:()=>Boolean(sc&&s.mode==='idle'&&climb()),climbNow:()=>{if(!sc||!s.surf||s.mode==='climb')return false;clearTimers();endAct();s.walk=null;s.route=null;s.mode='idle';return climb();},ropes:()=>ropeLines().length,ride:()=>ride(),riding:()=>Boolean(s.ride?.on&&s.surf?.perch==='ticket'),where:()=>({zone:s.zone,climb:s.climb&&{down:s.climb.to.down,legs:s.climb.legs?.map(v=>v|0)},y:b.y|0,here:zoneOf(s.surf),mode:s.mode,surf:s.surf?.key,act:s.act?.name,quest:s.quest&&{key:s.quest.key,x:s.quest.x|0,detours:s.quest.detours},feast:Boolean(s.feast),route:s.route?.map(p=>p.key)}),zone:z=>{s.zone=z;s.zoneUntil=now()+40000;s.zoneMiss=0;},voice,paws:()=>r3d?.paws(),turn:()=>{s.face=-s.face;},show:(on=true)=>{force=on;},replay:()=>{el.hidden=true;hide();},act:name=>{const r=REACTIONS.find(x=>x[0]===name);return r?act(r[0],r[2]):act(name,2400);},mood,touch,menuItems:()=>menuMarkup({nap:s.mood==='nap'}),napping:()=>s.mood==='nap',menuDo,readLine,openPanel,closePanel,feed,logs:()=>all.filter(p=>p.roll).map(p=>({key:p.key,spin:Math.round(rolls.get(p.roll)?.w||0),turn:Math.round(rolls.get(p.roll)?.a||0)})),toLog:i=>{const to=all.filter(p=>p.roll)[i||0];return Boolean(to&&s.mode==='idle'&&goTo(to));},charts:()=>all.filter(p=>p.chart).map(p=>({key:p.key,kind:p.chart.kind,l:p.l|0,r:p.r|0,y:p.y|0})),toChart:kind=>{const t=all.filter(p=>p.chart?.kind===kind).sort((a,c)=>Math.abs(a.y-b.y)-Math.abs(c.y-b.y))[0];return Boolean(t&&s.surf&&goTo(t,{chart:true}));},chartTrick:()=>chartTrick(),name:()=>catName,hunger:()=>hunger(),starve:(h=1.2)=>{fedAt=Date.now()-h*HUNGER.full;keep(FED_KEY,String(fedAt));askAt=0;},panelOpen:()=>!panel.hidden,mischief:()=>mischief(),edge:kind=>Boolean(s.surf&&sc&&overEdge(kind)),scout:()=>Boolean(s.surf&&sc&&s.mode==='idle'&&scout()),bars:()=>({all:all.map(({l,r,y})=>({l,r,y})),left:sc?.left,right:sc?.right,surf:s.surf&&{l:s.surf.l,r:s.surf.r,y:s.surf.y}}),
  goTo:i=>{const t=all[i];return t&&s.surf?goTo(t):false;},game:()=>g&&{id:g.id,n:g.n,of:g.of,score:g.score,lives:g.lives,card:g.card?.kind||null,pending:g.pending,x:g.p?.x,y:g.p?.y,ground:Boolean(g.p?.ground),end:g.course?.end,height:g.course?.height,ropes:g.course?.ropes?.length||0,shots:g.balls?.length||0,check:Boolean(g.check),flags:g.flags?.length||0,foes:(g.foes||[]).map(f=>f.kind),rope:g.p?.rope?.key||null,food:g.food?.length||0,got:g.got?.size||0},state:()=>({...s,...b,hidden:el.hidden,pose:el.dataset.pose,surfaces:all.length})};
 return win[global];
}

export {startTimelineCat as startWhiskers};
