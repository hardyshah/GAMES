// =====================================================================
// TEXTILE TYCOON 3D — game shell: title menu, new-game wizard (scenarios,
// layouts, sheet upload, staff, utilities, rules), compressed save slots with
// a linked saves folder, dock + panels, status bar, motion effects.
// The 3D plant, machines, trolleys and simulation live in engine.js.
// =====================================================================
(function(){
'use strict';
const ico=(n,cls)=>`<svg viewBox="0 0 64 64"${cls?` class="${cls}"`:''}><use href="#${n}"/></svg>`;
const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const money=n=>(n<0?'-$':'$')+Math.abs(Math.round(n)).toLocaleString('en-US');
const short=n=>{const a=Math.abs(n),s=n<0?'-':'';return a>=1e6?s+'$'+(a/1e6).toFixed(1)+'M':a>=1e4?s+'$'+Math.round(a/1e3)+'K':s+'$'+Math.round(a).toLocaleString('en-US')};
const UIS={panel:null,inGame:false,cashShown:0,thumbs:{},cat:'all',slot:null,lastPop:{},popCount:0,ended:false};
window.menuOrbit=false;

// ---------------------------------------------------------------------
// SCENARIOS
// ---------------------------------------------------------------------
const SCENARIOS=[
 {id:'sandbox',name:'Free play',icon:'s-sandbox',stars:0,desc:'A big budget and no deadline. Build the mill you have always wanted.',cash:250000,layout:'starter',months:0,goals:[]},
 {id:'season',name:'First season',icon:'s-season',stars:1,desc:'Your new starter mill has one year to prove the business works.',cash:40000,layout:'starter',months:12,goals:[{k:'revenue',n:150000,label:'Earn $150,000 in revenue'}]},
 {id:'dye',name:'Dye house masters',icon:'s-dye',stars:2,desc:'A dyeing-only plant. Keep the jets full and the buyers happy.',cash:60000,layout:'dyehouse',months:24,printBias:0,goals:[{k:'fd',n:250,label:'Deliver 250 lots of finished dyed fabric'},{k:'rep',n:70,label:'Reach reputation 70'}]},
 {id:'print',name:'Print boom',icon:'s-print',stars:2,desc:'Printed fabric is the trend. Scale up printing before it fades.',cash:70000,layout:'printhouse',months:24,printBias:.85,goals:[{k:'fp',n:200,label:'Deliver 200 lots of finished printed fabric'}]},
 {id:'export',name:'Export champion',icon:'s-export',stars:3,desc:'Win overseas buyers: build an ETP, research export marketing and ship.',cash:80000,layout:'integrated',months:30,goals:[{k:'exports',n:8,label:'Deliver 8 export orders'}]},
 {id:'rescue',name:'Rescue the mill',icon:'s-rescue',stars:3,desc:'Debts, broken machines and a bad name. Turn this mill around.',cash:-20000,loan:60000,rep:20,broken:2,layout:'starter',months:18,loseCash:-150000,goals:[{k:'cash',n:50000,label:'Hold $50,000 cash'},{k:'rep',n:60,label:'Reach reputation 60'}]}];
const scn=id=>SCENARIOS.find(s=>s.id===id)||SCENARIOS[0];
function goalValue(k){const st=G.stats||{};return k==='revenue'?st.revenue||0:k==='fd'?st.fd||0:k==='fp'?st.fp||0:k==='exports'?st.exports||0:k==='rep'?G.rep:k==='cash'?G.money:0}

// ---------------------------------------------------------------------
// PRESET LAYOUTS  (type, x, z, rotation in quarter turns)
// ---------------------------------------------------------------------
const PREP=[['desize',42,-8,0],['bleach',61,5,0]];
const LAYOUTS={
 starter:{name:'Starter mill',desc:'Small integrated mill: preparatory, one jet, a baby rotary and a stenter.',ms:STARTER.map(a=>a.slice())},
 dyehouse:{name:'Dye house',desc:'Three dispensing systems, two jets, a jigger and two stenters.',ms:[...PREP,['station',-55,-39,0],['station',-48,-39,0],['station',-41,-39,0],['chem',-47,-24,0],['jet',-20,-39,0],['jet',-20,-29,0],['jigger',-7.5,-38,0],['stenter',27,-32,0],['stenter',27,-23,0],['bay',-52,12,0],['boiler',72,-26,0]]},
 printhouse:{name:'Print house',desc:'Two colour kitchens, screen making, two baby rotaries and an Infinium rotary.',research:['rotary'],ms:[...PREP,['kitchen',-42,-10,0],['kitchen',-30,-10,0],['coater',-33,24,0],['coater',-27,24,0],['baby',-2,-6,0],['baby',-2,4,0],['rotary',5,18,0],['stenter',27,-32,0],['bay',-52,12,0],['boiler',72,-26,0]]},
 integrated:{name:'Integrated mill',desc:'Dyeing and printing together, with flatbed printing and fabric inspection.',research:['rotary','flatbed'],ms:[...PREP,['station',-55,-39,0],['station',-48,-39,0],['chem',-47,-24,0],['jet',-20,-39,0],['jet',-20,-29,0],['jigger',-7.5,-38,0],['kitchen',-42,-10,0],['coater',-33,24,0],['baby',-2,-6,0],['rotary',5,18,0],['flatbed',60,32,0],['stenter',27,-32,0],['stenter',27,-23,0],['bay',-52,12,0],['boiler',72,-26,0],['qc',-8,32,0]]},
 empty:{name:'Empty plot',desc:'Nothing but the slab and the trolley lanes. Start from scratch.',ms:[]}};

// ---------------------------------------------------------------------
// TOAST, BANNER, FX
// ---------------------------------------------------------------------
window.toast=function(t){const box=$('toasts');const m=String(t).match(/^(\p{Extended_Pictographic}️?)\s*(.*)$/u);const el=document.createElement('div');el.className='toast';
 el.innerHTML=`<span class="ti">${m?m[1]:'💬'}</span><span>${esc(m?m[2]:t)}</span>`;box.appendChild(el);while(box.children.length>4)box.firstChild.remove();setTimeout(()=>el.remove(),4800)};
function banner(t,sub){const b=$('banner');b.innerHTML=`<div>${esc(t)}${sub?`<small>${esc(sub)}</small>`:''}</div>`}
function project(v){const p=v.clone().project(C);if(p.z>1)return null;const r=R.domElement.getBoundingClientRect();return{x:(p.x+1)/2*r.width+r.left,y:(1-p.y)/2*r.height+r.top}}
function popAt(x,y,txt,cls){const el=document.createElement('div');el.className=cls||'pop';el.style.left=x+'px';el.style.top=y+'px';el.textContent=txt;$('fxl').appendChild(el);setTimeout(()=>el.remove(),2500)}
function coinBurst(x0,y0){const t=$('sCash').getBoundingClientRect(),tx=t.left+20,ty=t.top+10;
 for(let i=0;i<14;i++){const c=document.createElement('div');c.className='coin';$('fxl').appendChild(c);const a=Math.random()*Math.PI*2,r=40+Math.random()*70,mx=x0+Math.cos(a)*r,my=y0+Math.sin(a)*r-30;
  c.animate([{transform:`translate(${x0-13}px,${y0-13}px) scale(.3)`,opacity:0},{transform:`translate(${mx-13}px,${my-13}px) scale(1.1)`,opacity:1,offset:.35},{transform:`translate(${tx-13}px,${ty-13}px) scale(.5)`,opacity:.9}],
   {duration:900+i*45,easing:'cubic-bezier(.5,0,.3,1)',fill:'forwards'}).onfinish=()=>c.remove()}
 setTimeout(()=>{const s=$('sCash').parentElement.parentElement;s.animate([{transform:'scale(1)'},{transform:'scale(1.12)'},{transform:'scale(1)'}],{duration:420,easing:'cubic-bezier(.34,1.56,.64,1)'})},900)}
function confetti(on){const cv=$('confetti');if(!on){cv.classList.add('hidden');return}cv.classList.remove('hidden');cv.width=innerWidth;cv.height=innerHeight;const g=cv.getContext('2d');
 const P=Array.from({length:180},()=>({x:Math.random()*cv.width,y:-Math.random()*cv.height,vx:(Math.random()-.5)*3,vy:2+Math.random()*4,r:Math.random()*6.28,vr:(Math.random()-.5)*.3,c:['#f6b93b','#ef476f','#14b8a6','#7b5cff','#4cc9f0','#2ec27e'][Math.random()*6|0],w:6+Math.random()*8}));
 let n=0;(function f(){g.clearRect(0,0,cv.width,cv.height);P.forEach(p=>{p.x+=p.vx;p.y+=p.vy;p.r+=p.vr;if(p.y>cv.height+20){p.y=-20;p.x=Math.random()*cv.width}g.save();g.translate(p.x,p.y);g.rotate(p.r);g.fillStyle=p.c;g.fillRect(-p.w/2,-3,p.w,6);g.restore()});if(++n<420&&!cv.classList.contains('hidden'))requestAnimationFrame(f);else cv.classList.add('hidden')})()}

// production pops above machines, coins on delivery, month banner
window.onProduce=function(m){if(!UIS.inGame||m.def.util)return;const now=performance.now();if(now-(UIS.lastPop[m.id]||0)<1800||UIS.popCount>6)return;UIS.lastPop[m.id]=now;
 const v=new THREE.Vector3(m.x,(m.def.h||4)+2.2,m.z),p=project(v);if(!p||p.x<0||p.y<0||p.x>innerWidth||p.y>innerHeight-170)return;
 const out=m.def.stenter?(m.lot==='printed'?'Finished printed':'Finished dyed'):MAT[Object.keys(m.def.out)[0]]||'';UIS.popCount++;setTimeout(()=>UIS.popCount--,1900);popAt(p.x,p.y,'+1 '+out)};
window.onDeliver=function(o){const st=G.stats=G.stats||{};st.revenue=(st.revenue||0)+o.reward;st[o.type]=(st[o.type]||0)+o.qty;if(o.exp)st.exports=(st.exports||0)+1;st.monthRev=(st.monthRev||0)+o.reward;
 const x=innerWidth/2,y=innerHeight/2-40;coinBurst(x,y);popAt(x,y-20,'+'+money(o.reward),'bigpop');checkGoals()};
window.onMonth=function(cost){if(G.nightShift){const x=G.workers*(G.wage||600)*.4;G.money-=x;cost+=x}const st=G.stats=G.stats||{};st.lastRev=st.monthRev||0;st.monthRev=0;banner(monthName(G.month),'running costs −'+money(cost));checkGoals();renderDock()};

// ---------------------------------------------------------------------
// STATUS BAR + DOCK
// ---------------------------------------------------------------------
window.refreshStats=function(){if(!G)return;const target=G.money;UIS.cashShown+= (target-UIS.cashShown)*.25;if(Math.abs(target-UIS.cashShown)<1)UIS.cashShown=target;
 $('sCash').textContent=short(UIS.cashShown);$('sCash').className='sv '+(G.money<0?'down':'');
 const rev=(G.stats&&G.stats.monthRev)||0,last=(G.stats&&G.stats.lastRev)||0;$('sRev').innerHTML=short(rev)+(last?` <small class="${rev>=last?'up':'down'}" style="font-size:12px">${rev>=last?'▲':'▼'}</small>`:'');
 const need=machines.filter(m=>!m.def.util).length;$('sWk').textContent=G.workers+' / '+need;$('sWk').className='sv '+(G.workers<need?'down':'');
 $('sRep').textContent=Math.round(G.rep);const mr=$('mRep');mr.className='meter '+(G.rep>=60?'good':G.rep<30?'bad':'');mr.firstChild.style.width=Math.max(3,G.rep)+'%';
 const fin=Math.floor(G.inv.fd+G.inv.fp);$('sStk').textContent=fin;$('mStk').firstChild.style.width=Math.min(100,fin/1.2)+'%';
 $('sMon').textContent=monthName(G.month);
 const sp=G.paused?0:G.speed;document.querySelectorAll('.speed button').forEach(b=>b.classList.toggle('on',+b.dataset.s===sp));
 $('plantName').textContent=G.plantName||'My Plant';$('scnName').textContent=scn(G.scenario).name+(G.scenarioDone?' · complete':'');
 if(performance.now()-(UIS.lastDock||0)>1500){UIS.lastDock=performance.now();renderDock()}};
document.querySelectorAll('.speed button').forEach(b=>b.onclick=()=>{const s=+b.dataset.s;if(s===0)G.paused=true;else{G.paused=false;G.speed=s}$('pp').textContent=G.paused?'▶':'❚❚';refreshStats()});
const DOCK=[['build','i-build','Build'],['orders','i-orders','Orders'],['research','i-research','Research'],['finance','i-finance','Finance'],['staff','i-staff','Staff'],['rules','i-rules','Rules'],['goals','i-goals','Goals'],['views','i-views','Views'],['save','i-save','Save'],['menu','i-menu','Menu']];
function dockMenu(btn,items){closeDockMenu();const r=btn.getBoundingClientRect();const m=document.createElement('div');m.className='dkm';m.id='dkm';
 m.innerHTML=items.map(([k,i,t,d],n)=>`<button data-k="${n}">${ico(i)}<span>${t}${d?`<small>${d}</small>`:''}</span></button>`).join('');document.body.appendChild(m);
 m.style.left=Math.min(innerWidth-m.offsetWidth-8,Math.max(8,r.left+r.width/2-m.offsetWidth/2))+'px';m.style.top=(r.top-m.offsetHeight-10)+'px';
 m.onclick=e=>{const b=e.target.closest('button');if(!b)return;closeDockMenu();items[+b.dataset.k][0]()};setTimeout(()=>addEventListener('mousedown',closeDockOut,true),0)}
function closeDockOut(e){if(!e.target.closest('#dkm'))closeDockMenu()}
function closeDockMenu(){const m=$('dkm');if(m)m.remove();removeEventListener('mousedown',closeDockOut,true)}
const quickSave=()=>{if(UIS.slot&&UIS.slot!=='auto'){const en=index().find(s=>s.id===UIS.slot);saveSlot(UIS.slot,en?en.name:'Save')}else openSaves('save')};
const DOCKSUB={save:()=>[[quickSave,'i-save','Quick save','Ctrl+S'],[()=>openSaves('save'),'i-save','Save as…','New compressed slot'],[()=>openSaves('load'),'i-load','Load game',index().length+' saves'],[linkFolder,'i-folder','Saves folder','Write every save to a folder']],
 menu:()=>[[()=>openGameMenu(),'i-menu','Game menu','Pause & options'],[()=>openWizard(),'i-new','New game','Scenario, layout, sheet'],[()=>openHelp(),'i-help','How to play',''],[()=>{saveSlot('auto','Autosave',true);showMenu()},'i-logo','Main menu','Autosaves first']],
 views:()=>VIEWS.slice(0,8).map((v,i)=>[()=>go(i),'i-views',v[0],'']).concat([[()=>{UIS.sub.views='dsp';togglePanel('views')},'i-views','Time of day…','Morning, noon, sunset, night']]),
 staff:()=>[[()=>{UIS.sub.staff='op';togglePanel('staff')},'i-staff','Operators','Hire and dismiss'],[()=>{UIS.sub.staff='sh';togglePanel('staff')},'i-staff','Shifts','Day, night, skip to morning'],[()=>setNight(!G.nightShift),'i-staff',G.nightShift?'Stop night shift':'Start night shift','+40% wages']],
 finance:()=>[['ov','Overview'],['mk','Market'],['ln','Loans']].map(([k,t])=>[()=>{UIS.sub.finance=k;UIS.panel=null;togglePanel('finance')},'i-finance',t,''])};
function renderDock(){const d=$('dock');if(!d.children.length){d.innerHTML=DOCK.map(([k,i,l])=>`<button class="dk" data-p="${k}" title="${l}">${ico(i)}<span>${l}</span></button>`).join('');
  d.querySelectorAll('.dk').forEach(b=>{const k=b.dataset.p;if(DOCKSUB[k]){const a=document.createElement('i');a.className='more';a.textContent='▴';a.title='More';b.appendChild(a);
   a.onclick=e=>{e.stopPropagation();dockMenu(b,DOCKSUB[k]())};b.oncontextmenu=e=>{e.preventDefault();dockMenu(b,DOCKSUB[k]())}}
   b.onclick=()=>{if(k==='save'||k==='menu')return dockMenu(b,DOCKSUB[k]());togglePanel(k)}})}
 d.querySelectorAll('.dk').forEach(b=>{b.classList.toggle('on',b.dataset.p===UIS.panel);let n=0;const k=b.dataset.p;
  if(k==='orders')n=G.orders.filter(o=>G.inv[o.type]>=o.qty).length;if(k==='research')n=RESEARCH.filter(r=>!G.research[r.id]&&(!r.req||G.research[r.req])&&G.money>=r.cost).length;
  if(k==='staff')n=Math.max(0,machines.filter(m=>!m.def.util).length-G.workers);
  let bd=b.querySelector('.badge');if(n){if(!bd){bd=document.createElement('i');bd.className='badge';b.appendChild(bd)}if(bd.textContent!=String(n))bd.textContent=n}else if(bd)bd.remove()})}

// ---------------------------------------------------------------------
// PANELS
// ---------------------------------------------------------------------
const PANEL_META={build:['i-build','Build machines'],orders:['i-orders','Orders'],research:['i-research','Research lab'],finance:['i-finance','Finance'],staff:['i-staff','Staff & handlers'],rules:['i-rules','Plant rules'],goals:['i-goals','Scenario goals'],views:['i-views','Camera views']};
function togglePanel(k){if(UIS.panel===k)return closePanel();UIS.panel=k;tab=k;const p=$('panel');p.classList.remove('hidden');p.style.animation='none';void p.offsetWidth;p.style.animation='';$('pIco').innerHTML=`<use href="#${PANEL_META[k][0]}"/>`;$('pTitle').textContent=PANEL_META[k][1];renderTab();renderDock()}
function closePanel(){UIS.panel=null;$('panel').classList.add('hidden');renderDock()}
$('pClose').onclick=closePanel;
function stockRow(keys){return '<div class="stockrow">'+keys.map(k=>`<span class="stk">${MAT[k]} <b>${+G.inv[k].toFixed(1)}</b></span>`).join('')+'</div>'}
function recipe(d){if(d.stenter)return 'Dyed or printed → finished';if(d.util)return d.desc.split('.')[0];const i=Object.keys(d.need).map(k=>MAT[k]).join(' + ');return (i?i+' → ':'Makes ')+Object.keys(d.out).map(k=>MAT[k]).join('')}
const SUBS={finance:[['ov','Overview'],['mk','Market'],['ln','Loans']],staff:[['op','Operators'],['sh','Shifts'],['un','Uniforms']],rules:[['pr','Plant rules'],['st','Settings']],views:[['cam','Cameras'],['dsp','Display & time']]};
UIS.sub={};const subOf=k=>UIS.sub[k]||(SUBS[k]?SUBS[k][0][0]:'');
function subBar(k){return SUBS[k]?'<div class="sub">'+SUBS[k].map(([i,t])=>`<button data-u="sub" data-k="${i}" class="${subOf(k)===i?'on':''}">${t}</button>`).join('')+'</div>':''}
window.renderTab=function(){const k=UIS.panel;if(!k||!G)return;const tc=$('tc');let h=subBar(k);const sb=subOf(k);
 if(k==='build'){const cats=[['all','All'],...DEPTS.map(([z])=>[z,ZONES[z]?ZONES[z].name:'Utilities'])];
  h+='<div class="chips">'+cats.map(([z,n])=>`<button class="chipb${UIS.cat===z?' on':''}" data-u="cat" data-k="${z}">${n}</button>`).join('')+'</div><div class="grid">';
  let i=0;for(const[z,list]of DEPTS){if(UIS.cat!=='all'&&UIS.cat!==z)continue;for(const key of list){const d=DEF[key],ok=unlocked(key);
   h+=`<button class="mc${tool===key?' on':''}" data-a="tool" data-k="${key}" ${ok?'':'disabled'} style="animation-delay:${i++*30}ms">${UIS.thumbs[key]?`<img src="${UIS.thumbs[key]}" alt="">`:`<span class="ph">${d.icon}</span>`}
    <b>${esc(d.name)}</b><span class="cost">${ico('i-coin')} ${short(d.cost)} · ${short(d.up)}/mo</span><span class="rec">${esc(recipe(d))}</span>${ok?'':`<span class="lock">${ico('i-lock')}Research “${esc((RESEARCH.find(r=>r.id===d.research)||{}).name)}” first</span>`}</button>`}}
  h+='</div>'}
 else if(k==='orders'){h+=stockRow(['fd','fp','dyed','printed']);if(!G.orders.length)h+='<div class="card"><h4>No open orders</h4><div class="mut">New buyers write in at the start of each month. A good reputation brings more.</div></div>';
  G.orders.forEach((o,i)=>{const have=Math.floor(G.inv[o.type]),ok=have>=o.qty,left=o.due-G.month;h+=`<div class="card" style="animation-delay:${i*50}ms"><div class="row" style="margin:0;justify-content:space-between"><h4>${o.exp?'🌍 Export':'📦 Domestic'} #${o.id} · ${o.qty} lots ${MAT[o.type].toLowerCase()}</h4><b style="font:800 18px var(--head);color:#15803d">${money(o.reward)}</b></div>
   <div class="mut">Due ${monthName(o.due)} · <b style="color:${left<=1?'#be123c':'inherit'}">${left<=0?'this month':left+' month'+(left>1?'s':'')+' left'}</b> · you have ${have}/${o.qty}</div><div class="bar2${ok?' done':''}"><i style="width:${Math.min(100,have/o.qty*100)}%"></i></div>
   <div class="row"><button class="btn green sm" data-a="deliver" data-k="${o.id}" ${ok?'':'disabled'}>Deliver order</button></div></div>`})}
 else if(k==='research'){RESEARCH.forEach((r,i)=>{const done=G.research[r.id],can=!r.req||G.research[r.req];h+=`<div class="card" style="animation-delay:${i*40}ms;${done?'border-color:#7ee8a6':''}"><div class="row" style="margin:0;gap:12px"><span style="font-size:28px">${r.icon}</span><div style="flex:1"><h4>${r.name}${done?' ✅':''}</h4><div class="mut">${r.desc}${!can?' · needs <b>'+RESEARCH.find(x=>x.id===r.req).name+'</b>':''}</div></div>
   ${done?'':`<button class="btn sm" data-a="res" data-k="${r.id}" ${can&&G.money>=r.cost?'':'disabled'}>${short(r.cost)}</button>`}</div></div>`})}
 else if(k==='finance'){let up=0;machines.forEach(m=>up+=m.def.up);if(G.research.lean)up*=.85;const wages=G.workers*(G.wage||600);
  if(sb==='ov')h+=`<div class="kpis"><div class="kpi"><span>Cash</span><b class="${G.money<0?'down':''}">${money(G.money)}</b></div><div class="kpi"><span>Revenue to date</span><b class="up">${short((G.stats&&G.stats.revenue)||G.revenue)}</b></div><div class="kpi"><span>Upkeep / month</span><b>${short(up)}</b></div><div class="kpi"><span>Wages / month</span><b>${short(wages)}</b></div><div class="kpi"><span>Loan</span><b>${short(G.loan)}</b></div><div class="kpi"><span>Greige / lot</span><b>${money(G.greige)}</b></div></div>`;
  const hist=G.hist.slice(-12),mx=Math.max(1,...hist.map(x=>x.cost));if(sb==='ov')h+=`<div class="card"><h4>Monthly running costs</h4>${hist.length?`<svg viewBox="0 0 360 90" style="width:100%;height:90px">${hist.map((x,i)=>`<rect x="${i*30+4}" y="${84-x.cost/mx*74}" width="22" height="${x.cost/mx*74}" rx="5" fill="url(#gO)"><animate attributeName="height" from="0" to="${x.cost/mx*74}" dur=".6s"/><animate attributeName="y" from="84" to="${84-x.cost/mx*74}" dur=".6s"/></rect>`).join('')}</svg>`:'<div class="mut">Shows after the first month.</div>'}</div>`;
  if(sb==='mk')h+=stockRow(['greige','fd','fp'])+`<div class="card"><h4>Greige market</h4><div class="row"><button class="btn gold sm" data-a="buy" data-k="10" ${G.money<G.greige*10?'disabled':''}>Buy 10 lots · ${short(G.greige*10)}</button><button class="btn gold sm" data-a="buy" data-k="30" ${G.money<G.greige*30?'disabled':''}>Buy 30 lots · ${short(G.greige*30)}</button></div></div>
   <div class="card"><h4>Spot market</h4><div class="mut">Pays less than orders, but turns stock into cash now.</div><div class="row"><button class="btn sm" data-a="spot" data-k="fd" ${G.inv.fd<1?'disabled':''}>Sell finished dyed · $550/lot</button><button class="btn sm" data-a="spot" data-k="fp" ${G.inv.fp<1?'disabled':''}>Sell finished printed · $800/lot</button></div></div>`;if(sb==='ln')h+=`<div class="card"><h4>Bank loan · 1% a month</h4><div class="bar2 gold"><i style="width:${G.loan/1000}%"></i></div><div class="row"><button class="btn ghost sm" data-a="borrow" ${G.loan>=100000?'disabled':''}>Borrow $10,000</button><button class="btn ghost sm" data-a="repay" ${G.loan<10000||G.money<10000?'disabled':''}>Repay $10,000</button></div></div>`}
 else if(k==='staff'){const prod=machines.filter(m=>!m.def.util),need=prod.length,handlers=movers.reduce((a,v)=>a+v.np,0);
  if(sb==='op')h+=`<div class="kpis"><div class="kpi"><span>Operators</span><b>${G.workers}</b></div><div class="kpi"><span>Machines needing one</span><b class="${G.workers<need?'down':''}">${need}</b></div><div class="kpi"><span>Wage</span><b>${money(G.wage||600)}/mo</b></div><div class="kpi"><span>Trolley handlers</span><b>${handlers}</b></div></div>
   <div class="card"><h4>Hire operators</h4><div class="mut">Each production machine needs one operator. Hiring costs $1,500 plus the monthly wage.</div><div class="row"><button class="btn green sm" data-a="hire" ${G.money<1500?'disabled':''}>👷 Hire operator</button><button class="btn ghost sm" data-a="fire" ${G.workers<1?'disabled':''}>Dismiss one</button></div></div>
   <div class="card"><h4>Who is working</h4>${prod.map(m=>`<div class="row" style="margin:3px 0"><span class="dot" style="background:${m.broken?'#ef476f':m.worker?(m.running?'#2ec27e':'#f6b93b'):'#9aa3b5'}"></span><span style="flex:1">${esc(m.name)}</span><span class="mut">${m.broken?'broken':m.worker?(m.running?'running':'waiting'):'no operator'}</span></div>`).join('')||'<div class="mut">No production machines yet.</div>'}</div>`;if(sb==='sh')h+=shiftHTML();if(sb==='un')h+=`<div class="card"><h4>Uniforms</h4><div class="row">${Object.values(UNI).map(u=>`<span class="stk"><span class="dot" style="background:#${u[1].toString(16).padStart(6,'0')}"></span>${u[0]}</span>`).join('')}</div></div>`}
 else if(k==='rules'&&sb==='st'){h+=settingsHTML()}
 else if(k==='rules'){const c=G.cfg||{};h+=`<div class="kpis"><div class="kpi"><span>Trolley speed</span><b>${RULES.speed} m/s</b></div><div class="kpi"><span>Max trolley load</span><b>${RULES.maxLoad} kg</b></div><div class="kpi"><span>Month length</span><b>${MONTH} s</b></div><div class="kpi"><span>Breakdowns</span><b>${((G.brk!=null?G.brk:.025)*100).toFixed(1)}%/mo</b></div></div>`;
  RULES.text.forEach((r,i)=>h+=`<div class="card" style="animation-delay:${i*35}ms"><h4>${esc(r[0])}</h4>${esc(r[1])}<div class="mut">Where: ${esc(r[2])}</div></div>`);
  (c.rules||[]).forEach(r=>h+=`<div class="card" style="border-color:#c5a8ff"><h4>${esc(r[0])} <span class="mut">· from your sheet</span></h4>${esc(r[1])}${r[2]?`<div class="mut">${esc(r[2])}</div>`:''}</div>`)}
 else if(k==='goals'){const s=scn(G.scenario);h+=`<div class="card"><div class="row" style="margin:0;gap:12px"><svg viewBox="0 0 64 64" style="width:56px;height:56px;flex:none"><use href="#${s.icon}"/></svg><div><h4 style="font-size:20px">${s.name}</h4><div class="mut">${s.desc}</div></div></div></div>`;
  if(!s.goals.length)h+='<div class="card"><h4>No goals in free play</h4><div class="mut">Build, expand and enjoy. Every scenario is available from New game.</div></div>';
  else{const left=s.months?s.months-G.month:null;h+=`<div class="kpis"><div class="kpi"><span>Time left</span><b>${left==null?'∞':Math.max(0,left)+' months'}</b></div>${s.loseCash!=null?`<div class="kpi"><span>Bankrupt below</span><b class="down">${short(s.loseCash)}</b></div>`:''}<div class="kpi"><span>Status</span><b>${G.scenarioDone?'🏆 Won':'In progress'}</b></div></div>`;
   s.goals.forEach(g=>{const v=goalValue(g.k),pct=Math.max(0,Math.min(100,v/g.n*100));h+=`<div class="card"><h4>${pct>=100?'✅ ':''}${g.label}</h4><div class="mut">${g.k==='cash'||g.k==='revenue'?money(v):Math.round(v)} of ${g.k==='cash'||g.k==='revenue'?money(g.n):g.n}</div><div class="bar2${pct>=100?' done':''}"><i style="width:${pct}%"></i></div></div>`})}}
 else if(k==='views'&&sb==='dsp'){h+=displayHTML()}
 else if(k==='views'){h+='<div class="grid">'+VIEWS.map((v,i)=>`<button class="mc" data-u="view" data-k="${i}" style="animation-delay:${i*30}ms"><b>${v[0]}</b><span class="rec">${esc(v[5].slice(0,110))}${v[5].length>110?'…':''}</span></button>`).join('')+'</div>'}
 tc.innerHTML=h};
$('tc').addEventListener('input',e=>{const r=e.target;if(!r.dataset||!r.dataset.set)return;const v=+r.value,k=r.dataset.set;const c=G.cfg=G.cfg||{};
 if(k==='speed'){c.speed=v;RULES.speed=v;for(const L in LOOPS)LOOPS[L].sp=v}if(k==='maxLoad'){c.maxLoad=v;RULES.maxLoad=v}if(k==='month'){c.month=v;MONTH=v}if(k==='brk'){c.brk=v;G.brk=v/100}if(k==='wage'){c.wage=v;G.wage=v}if(k==='day'){c.day=v;DN.len=v}
 const o=r.parentElement.querySelector('b');if(o)o.textContent=SETF[k](v)});
$('tc').addEventListener('click',e=>{const b=e.target.closest('button');if(!b||b.disabled)return;
 if(b.dataset.u==='cat'){UIS.cat=b.dataset.k;renderTab()}
 if(b.dataset.u==='sub'){UIS.sub[UIS.panel]=b.dataset.k;renderTab()}
 if(b.dataset.u==='tod'){const v=b.dataset.k;if(v==='auto')DN.lock=null;else DN.lock=+v;renderTab()}
 if(b.dataset.u==='ns'){setNight(!G.nightShift);renderTab()}
 if(b.dataset.u==='skip'){skipNight()}
 if(b.dataset.u==='view'){go(+b.dataset.k);closePanel()}
 if(b.dataset.a==='tool'&&tool)setTimeout(closePanel,60);
 if(b.dataset.a==='res')setTimeout(()=>{banner('Research complete','new machines unlocked');confettiSmall(b)},50)});
function confettiSmall(el){const r=el.getBoundingClientRect();for(let i=0;i<12;i++)popAt(r.left+r.width/2+(Math.random()-.5)*80,r.top+(Math.random()-.5)*30,['✨','🎉','⭐'][i%3],'pop')}
window.refreshInfo=function(){const box=$('info'),h=box.querySelector('h2'),p=box.querySelector('p');
 if(tool){const d=DEF[tool];h.textContent='Placing: '+d.name;p.textContent='Click a green spot in '+(ZONES[d.zone]?ZONES[d.zone].name:'any department')+'. R rotates · Esc cancels · right-click stops placing.';box.classList.remove('quiet')}
 else if(sel){h.textContent=sel.def.icon+' '+sel.name;p.textContent=sel.def.desc;box.classList.remove('quiet')}
 else box.classList.add('quiet')};

// ---------------------------------------------------------------------
// COMPRESSED SAVES  (localStorage slots + optional linked folder)
// ---------------------------------------------------------------------
const IDX='tt3d_index',SLOT='tt3d_slot_';
async function gz(str){return new Uint8Array(await new Response(new Blob([str]).stream().pipeThrough(new CompressionStream('gzip'))).arrayBuffer())}
async function gunz(u8){return await new Response(new Blob([u8]).stream().pipeThrough(new DecompressionStream('gzip'))).text()}
function b64(u8){let s='';for(let i=0;i<u8.length;i+=0x8000)s+=String.fromCharCode.apply(null,u8.subarray(i,i+0x8000));return btoa(s)}
function unb64(s){const b=atob(s),u=new Uint8Array(b.length);for(let i=0;i<b.length;i++)u[i]=b.charCodeAt(i);return u}
const index=()=>{try{return JSON.parse(localStorage.getItem(IDX)||'[]')}catch(e){return[]}};
const setIndex=a=>localStorage.setItem(IDX,JSON.stringify(a));
function thumbShot(){try{if(useFX&&composer)composer.render();else R.render(S,C);const c=document.createElement('canvas');c.width=320;c.height=180;const g=c.getContext('2d');const s=R.domElement;const sc=Math.max(320/s.width,180/s.height);g.drawImage(s,(320-s.width*sc)/2,(180-s.height*sc)/2,s.width*sc,s.height*sc);return c.toDataURL('image/jpeg',.62)}catch(e){return ''}}
function snapshot(){return{v:1,G,ms:machines.map(m=>({t:m.type,x:m.x,z:m.z,r:m.rot,n:m.name,l:m.level,p:m.produced,b:m.broken,c:m.col}))}}
async function saveSlot(id,name,quiet){if(!UIS.inGame)return;const data=snapshot();const bytes=await gz(JSON.stringify(data));
 const entry={id,name,plant:G.plantName,scenario:G.scenario,month:G.month,cash:Math.round(G.money),savedAt:Date.now(),thumb:thumbShot(),kb:Math.round(bytes.length/1024*10)/10};
 try{localStorage.setItem(SLOT+id,b64(bytes))}catch(e){toast('⚠️ Browser storage is full — export your saves to a file');return}
 const ix=index().filter(s=>s.id!==id);ix.unshift(entry);setIndex(ix);UIS.slot=id;
 await writeFolder(entry,bytes);if(!quiet)toast('💾 Saved “'+name+'” ('+entry.kb+' KB compressed)')}
async function readSlot(id){const s=localStorage.getItem(SLOT+id);if(!s)return null;return JSON.parse(await gunz(unb64(s)))}
async function loadSlot(id){const d=await readSlot(id);if(!d){toast('⚠️ That save could not be read');return}applySave(d);UIS.slot=id;const e=index().find(s=>s.id===id);toast('📂 Loaded “'+(e?e.name:'save')+'” — '+monthName(G.month))}
function applySave(d){clearPlant();G=Object.assign(freshState(),d.G);G.paused=false;applyCfg(G.cfg||{});d.ms.forEach(q=>{if(DEF[q.t])addMachine(q.t,q.x,q.z,q.r,{name:q.n,level:q.l,produced:q.p,broken:q.b,col:q.c})});
 syncTrolleys();UIS.cashShown=G.money;UIS.ended=!!G.scenarioDone;enterGame()}
function delSlot(id){localStorage.removeItem(SLOT+id);setIndex(index().filter(s=>s.id!==id))}
// engine hooks: autosave each month, Save/Load/New from anywhere
window.save=function(quiet){if(quiet){if(UIS.inGame)saveSlot('auto','Autosave',true)}else openSaves('save')};
window.load=function(){openSaves('load');return true};
window.newGame=function(){openWizard()};
// linked saves folder (File System Access API)
let dirH=null;
function idb(){return new Promise((res,rej)=>{const r=indexedDB.open('tt3d',1);r.onupgradeneeded=()=>r.result.createObjectStore('kv');r.onsuccess=()=>res(r.result);r.onerror=rej})}
async function idbGet(k){const db=await idb();return new Promise(res=>{const q=db.transaction('kv').objectStore('kv').get(k);q.onsuccess=()=>res(q.result);q.onerror=()=>res(null)})}
async function idbSet(k,v){const db=await idb();return new Promise(res=>{const t=db.transaction('kv','readwrite');t.objectStore('kv').put(v,k);t.oncomplete=res;t.onerror=res})}
const safeName=s=>String(s||'save').replace(/[^\w\- ]+/g,'').trim().slice(0,60)||'save';
async function folderOK(ask){if(!dirH)return false;try{let p=await dirH.queryPermission({mode:'readwrite'});if(p!=='granted'&&ask)p=await dirH.requestPermission({mode:'readwrite'});return p==='granted'}catch(e){return false}}
async function writeFile(name,bytes){const fh=await dirH.getFileHandle(name,{create:true});const w=await fh.createWritable();await w.write(bytes);await w.close()}
async function archiveBytes(){const saves=[];for(const e of index()){const s=localStorage.getItem(SLOT+e.id);if(s)saves.push({entry:e,data:s})}return gz(JSON.stringify({v:1,kind:'textile-tycoon-archive',made:Date.now(),saves}))}
async function writeFolder(entry,bytes){if(!(await folderOK(false)))return;try{await writeFile(safeName(entry.name)+'.ttsave',bytes);await writeFile('Textile-Tycoon-all-saves.ttarchive',await archiveBytes())}catch(e){console.warn('folder',e)}}
async function linkFolder(){if(!window.showDirectoryPicker){toast('⚠️ This browser cannot link a folder — use Export all instead');return}
 try{dirH=await window.showDirectoryPicker({id:'tt3d',mode:'readwrite'});await idbSet('dir',dirH);let n=0;for(const e of index()){const s=localStorage.getItem(SLOT+e.id);if(s){await writeFile(safeName(e.name)+'.ttsave',unb64(s));n++}}
  await writeFile('Textile-Tycoon-all-saves.ttarchive',await archiveBytes());toast('📁 Saves folder linked — '+n+' saves written');openSaves(UIS.savesMode)}catch(e){if(e.name!=='AbortError')toast('⚠️ Could not link the folder')}}
function download(name,bytes){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([bytes],{type:'application/gzip'}));a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),4000)}
async function importFiles(files){let n=0;for(const f of files){try{const txt=await gunz(new Uint8Array(await f.arrayBuffer()));const d=JSON.parse(txt);
  if(d.kind==='textile-tycoon-archive'){for(const s of d.saves){const id='s'+Date.now().toString(36)+Math.random().toString(36).slice(2,6);localStorage.setItem(SLOT+id,s.data);const ix=index();ix.push(Object.assign({},s.entry,{id}));setIndex(ix);n++}}
  else if(d.G){const id='s'+Date.now().toString(36)+Math.random().toString(36).slice(2,6);localStorage.setItem(SLOT+id,b64(await gz(txt)));const ix=index();ix.push({id,name:f.name.replace(/\.ttsave$/,''),plant:d.G.plantName,scenario:d.G.scenario,month:d.G.month,cash:Math.round(d.G.money),savedAt:Date.now(),thumb:''});setIndex(ix);n++}}catch(e){toast('⚠️ '+f.name+' is not a Textile Tycoon save')}}
 if(n)toast('📥 Imported '+n+' save'+(n>1?'s':''));openSaves(UIS.savesMode)}

// ---------------------------------------------------------------------
// MODALS
// ---------------------------------------------------------------------
function modal(html,cls){closeModal();const o=document.createElement('div');o.className='ov';o.id='ov';o.innerHTML=`<div class="modal ${cls||''}">${html}</div>`;document.body.appendChild(o);o.addEventListener('mousedown',e=>{if(e.target===o&&UIS.inGame)closeModal()});return o}
function closeModal(){const o=$('ov');if(o)o.remove()}
async function openSaves(mode){UIS.savesMode=mode;const ix=index();const fs=!!window.showDirectoryPicker,linked=await folderOK(false);
 const o=modal(`<header>${ico('i-save')}<h2>${mode==='save'?'Save game':'Load game'}</h2><button class="x" data-m="x">✕</button></header><div class="mb">
  <div class="foldr">${ico('i-folder')}<div style="flex:1"><b style="font:800 15px var(--head)">${linked?'Saves folder linked: '+esc(dirH.name):dirH?'Saves folder needs permission again':'Saves folder'}</b><div class="mut">${fs?'Every save is also written to this folder as a compressed .ttsave file, with one compressed archive of all your games.':'This browser cannot write to a folder. Use Export all to keep a compressed archive of all games.'}</div></div>
   ${fs?(dirH&&!linked?'<button class="btn sm" data-m="perm">Reconnect folder</button>':'')+`<button class="btn ${linked?'ghost':'gold'} sm" data-m="link">${linked?'Change folder':'Choose folder'}</button>`:''}<button class="btn ghost sm" data-m="exp">Export all</button><button class="btn ghost sm" data-m="imp">Import</button><input type="file" id="impf" accept=".ttsave,.ttarchive" multiple hidden></div>
  ${mode==='save'&&UIS.inGame?`<div class="card"><h4>New save</h4><div class="row"><input id="svName" type="text" value="${esc((G.plantName||'Plant')+' · '+monthName(G.month))}" style="flex:1;font:800 16px var(--head);border:2px solid var(--line);border-radius:12px;padding:8px 12px"><button class="btn green" data-m="new">💾 Save</button></div></div>`:''}
  <div class="slots">${ix.length?ix.map((s,i)=>`<div class="slot" style="animation-delay:${i*40}ms">${s.thumb?`<img src="${s.thumb}" alt="">`:'<img alt="">'}<div class="si"><h4>${esc(s.name)}</h4><div class="mut">${esc(s.plant||'')} · ${esc(scn(s.scenario).name)}<br>${monthName(s.month||0)} · ${money(s.cash||0)} · ${new Date(s.savedAt).toLocaleString()}</div>
   <div class="row">${mode==='load'||!UIS.inGame?`<button class="btn green sm" data-m="load" data-id="${s.id}">Load</button>`:`<button class="btn gold sm" data-m="over" data-id="${s.id}">Overwrite</button><button class="btn sm" data-m="load" data-id="${s.id}">Load</button>`}<button class="btn ghost sm" data-m="one" data-id="${s.id}">⬇</button><button class="btn ghost sm" data-m="del" data-id="${s.id}">🗑</button></div></div></div>`).join(''):'<div class="card"><h4>No saved games yet</h4><div class="mut">Start a new game, then save it here. The game also autosaves every month.</div></div>'}</div></div>`);
 o.querySelector('#impf').onchange=e=>importFiles([...e.target.files]);
 o.onclick=async e=>{const b=e.target.closest('[data-m]');if(!b)return;const m=b.dataset.m,id=b.dataset.id;
  if(m==='x')closeModal();if(m==='link')linkFolder();if(m==='perm'){if(await folderOK(true)){toast('📁 Folder reconnected');openSaves(mode)}}
  if(m==='exp'){if(!index().length)return toast('Nothing to export yet');download('Textile-Tycoon-all-saves.ttarchive',await archiveBytes());toast('⬇ Archive of all saves downloaded')}
  if(m==='imp')o.querySelector('#impf').click();
  if(m==='new'){const name=$('svName').value.trim()||'Save';await saveSlot('s'+Date.now().toString(36),name);openSaves('save')}
  if(m==='over'){const e2=index().find(s=>s.id===id);await saveSlot(id,e2?e2.name:'Save');openSaves('save')}
  if(m==='load'){closeModal();hideMenu();await loadSlot(id)}
  if(m==='one'){const s=localStorage.getItem(SLOT+id),e2=index().find(x=>x.id===id);if(s)download(safeName(e2&&e2.name)+'.ttsave',unb64(s))}
  if(m==='del'){const e2=index().find(x=>x.id===id);if(confirm('Delete “'+(e2?e2.name:'save')+'”?')){delSlot(id);openSaves(mode)}}}}
function openGameMenu(){const was=G.paused;G.paused=true;refreshStats();const o=modal(`<header>${ico('i-menu')}<h2>Game menu</h2><button class="x" data-m="x">✕</button></header><div class="mb"><div class="scg">
  ${[['resume','i-play','Resume','Back to the plant'],['save','i-save','Save game','Compressed slots + folder'],['load','i-load','Load game','Pick up any saved plant'],['new','i-new','New game','Scenario, layout, rules'],['help','i-help','How to play','Controls and tips'],['title','i-logo','Main menu','Back to the title screen']].map(([k,i,t,d],n)=>`<button class="sc" data-m="${k}" style="min-height:0;animation-delay:${n*40}ms">${ico(i)}<h4>${t}</h4><p>${d}</p></button>`).join('')}
  </div><div class="row" style="margin-top:14px"><label class="tog" style="flex:1">High-quality rendering <input type="checkbox" id="optHQ" ${useFX?'checked':''}></label><label class="tog" style="flex:1">Machine labels <input type="checkbox" id="optLb" ${showLabels?'checked':''}></label></div></div>`);
 o.querySelector('#optHQ').onchange=()=>$('fx').click();o.querySelector('#optLb').onchange=()=>$('lbl').click();
 o.onclick=e=>{const b=e.target.closest('[data-m]');if(!b)return;const m=b.dataset.m;if(m==='x'||m==='resume'){closeModal();G.paused=was}if(m==='save')openSaves('save');if(m==='load')openSaves('load');if(m==='new')openWizard();if(m==='help')openHelp();if(m==='title'){closeModal();if(UIS.inGame)saveSlot('auto','Autosave',true);showMenu()}}}
function openHelp(){modal(`<header>${ico('i-help')}<h2>How to play</h2><button class="x" onclick="document.getElementById('ov').remove()">✕</button></header><div class="mb"><div class="scg">
 ${[['i-build','1 · Build','Open Build, pick a machine and click a green spot in its department. R rotates, Esc cancels.'],['i-staff','2 · Staff it','Every production machine needs an operator. Hire in Staff; machines without one stop.'],['i-finance','3 · Feed it','Buy greige in Finance. Fabric flows: singeing → bleaching → dyeing or printing → stenter.'],['i-orders','4 · Deliver','Orders arrive monthly. Deliver finished fabric before the due date to earn cash and reputation.'],['i-research','5 · Grow','Research unlocks the Infinium rotary, flatbed, digital, ETP and more.'],['i-goals','6 · Win','Scenarios set goals and deadlines. Track them in Goals.']].map(([i,t,d],n)=>`<div class="sc" style="min-height:0;animation-delay:${n*40}ms">${ico(i)}<h4>${t}</h4><p>${d}</p></div>`).join('')}
 </div><div class="card" style="margin-top:12px"><h4>Controls</h4><div class="mut">Drag to orbit · right-drag or shift-drag to pan · scroll to zoom · click a machine to move, rotate, paint, upgrade or sell it · Space pauses · Ctrl+S saves.</div></div></div>`)}

// ---------------------------------------------------------------------
// NEW GAME WIZARD
// ---------------------------------------------------------------------
const WZ={};
function wizDefaults(sid){const s=scn(sid);const lay=LAYOUTS[s.layout];const prod=lay.ms.filter(q=>DEF[q[0]]&&!DEF[q[0]].util).length;
 return{scenario:s.id,layout:s.layout,custom:null,cash:s.cash,operators:prod,wage:600,month:60,day:48,night:false,speed:1.2,maxLoad:300,brk:2.5,boiler:true,qc:false,etp:false,name:'My Textile Mill',rules:[]}}
function openWizard(sid){Object.assign(WZ,{step:1},wizDefaults(sid||'season'));renderWizard()}
function layoutMS(){return WZ.custom?WZ.custom.ms:LAYOUTS[WZ.layout].ms}
function miniMap(ms){const sx=x=>(x-X0)/(X1-X0)*300,sz=z=>(z-Z0)/(Z1-Z0)*168;let s=`<svg viewBox="0 0 300 168" style="width:100%;height:110px;border-radius:14px;background:#dfe7ef">`;
 for(const k in ZONES){const r=ZONES[k].r,c='#'+ZONES[k].c.toString(16).padStart(6,'0');s+=`<rect x="${sx(r[0])}" y="${sz(r[2])}" width="${sx(r[1])-sx(r[0])}" height="${sz(r[3])-sz(r[2])}" fill="${c}" opacity=".85"/>`}
 for(const l of LANES)s+=`<rect x="${sx(l[0])}" y="${sz(l[2])}" width="${sx(l[1])-sx(l[0])}" height="${sz(l[3])-sz(l[2])}" fill="none" stroke="#e8b400" stroke-width="1" stroke-dasharray="3 2"/>`;
 for(const q of ms){const d=DEF[q[0]];if(!d)continue;const[w,dd]=dims(d,q[3]||0);s+=`<rect x="${sx(q[1]-w/2)}" y="${sz(q[2]-dd/2)}" width="${Math.max(2,w/(X1-X0)*300)}" height="${Math.max(2,dd/(Z1-Z0)*168)}" rx="1.5" fill="#16213e"/>`}
 return s+'</svg>'}
function renderWizard(){const st=WZ.step,s=scn(WZ.scenario);
 const steps=['Scenario','Plant layout','Staff & rules'].map((t,i)=>`<span class="step${st===i+1?' on':st>i+1?' done':''}"><i>${st>i+1?'✓':i+1}</i>${t}</span>`).join('<span style="color:#d9c19a">—</span>');
 let body='';
 if(st===1)body=`<div class="scg">${SCENARIOS.map((x,i)=>`<button class="sc${WZ.scenario===x.id?' on':''}" data-w="scn" data-k="${x.id}" style="animation-delay:${i*50}ms">${ico(x.icon)}<span class="stars">${x.stars?'★'.repeat(x.stars)+'<span style="color:#e3cfac">'+'★'.repeat(3-x.stars)+'</span>':'Relaxed'}</span><h4>${x.name}</h4><p>${x.desc}</p>${x.goals.map(g=>`<span class="goal">🎯 ${g.label}</span>`).join('')}${x.months?`<span class="goal" style="background:#fff3d6;color:#9a5b00">⏱ ${x.months} months</span>`:''}</button>`).join('')}</div>`;
 if(st===2)body=`<div class="drop" id="drop">${ico('i-sheet')}<h4 style="margin:6px 0 2px;font:800 18px var(--head)">Upload your plant sheet</h4><div class="mut">Excel (.xlsx) or CSV with a <b>Machines</b> sheet (Type, X, Z, Rotation) and optional <b>Settings</b>, <b>Rules</b>, <b>Loops</b> and <b>Trolleys &amp; crews</b> sheets. Rows without X/Z are placed automatically.</div>
   <div class="row" style="justify-content:center"><button class="btn green" data-w="upl">Choose file</button><button class="btn ghost" data-w="tpl">⬇ Download template</button></div><input type="file" id="upf" accept=".xlsx,.xls,.csv" hidden></div><div class="scg" style="margin-top:14px">${Object.entries(LAYOUTS).map(([k,l],i)=>`<button class="sc${!WZ.custom&&WZ.layout===k?' on':''}" data-w="lay" data-k="${k}" style="animation-delay:${i*50}ms">${miniMap(l.ms)}<h4>${l.name}</h4><p>${l.desc}</p><span class="goal">${l.ms.length} machines</span>${k===s.layout?'<span class="goal" style="background:#fff3d6;color:#9a5b00">Scenario default</span>':''}</button>`).join('')}
   ${WZ.custom?`<button class="sc on" data-w="lay" data-k="custom">${miniMap(WZ.custom.ms)}<h4>${esc(WZ.custom.name)}</h4><p>From your sheet${WZ.custom.skipped?' · '+WZ.custom.skipped+' rows not recognised':''}</p><span class="goal">${WZ.custom.ms.length} machines</span>${WZ.custom.rules.length?`<span class="goal">${WZ.custom.rules.length} rules</span>`:''}</button>`:''}</div>
`;
 if(st===3){const prod=layoutMS().filter(q=>DEF[q[0]]&&!DEF[q[0]].util).length;
  body=`<div class="form">
   <div class="fld"><label>Plant name</label><input type="text" id="wName" value="${esc(WZ.name)}"></div>
   ${rng('cash','Starting cash',-50000,400000,5000,v=>money(v))}
   ${rng('operators','Operators (labour)',0,60,1,v=>v+' <span class="mut">· '+prod+' machines need one</span>')}
   ${rng('wage','Wage per operator',300,1500,50,v=>money(v)+'/mo')}
   ${rng('month','Month length',20,180,10,v=>v+' s')}
   ${rng('day','Plant day length',16,180,4,v=>v+' s · night 22:00–06:00')}
   ${rng('speed','Trolley speed',.6,2,.1,v=>(+v).toFixed(1)+' m/s')}
   ${rng('maxLoad','Max trolley load (1 pusher)',150,300,10,v=>v+' kg')}
   ${rng('brk','Breakdown chance',0,10,.5,v=>(+v).toFixed(1)+'% a month')}
   <div class="fld"><label>Utilities</label><div class="tog">Steam boiler (+15% speed) <input type="checkbox" data-t="boiler" ${WZ.boiler?'checked':''}></div><div class="tog">Fabric inspection / QC <input type="checkbox" data-t="qc" ${WZ.qc?'checked':''}></div><div class="tog">ETP researched &amp; built <input type="checkbox" data-t="etp" ${WZ.etp?'checked':''}></div><div class="tog">Night shift from day 1 <input type="checkbox" data-t="night" ${WZ.night?'checked':''}></div></div>
  </div><div class="card" style="margin-top:12px"><h4>Working rules</h4><div class="mut">One-way trolley loops at ${(+WZ.speed).toFixed(1)} m/s · one pusher per trolley, total load within ${WZ.maxLoad} kg · lanes kept clear · each production machine needs an operator${WZ.rules.length?' · plus '+WZ.rules.length+' rules from your sheet':''}.</div></div>`}
 const o=modal(`<header>${ico('i-new')}<h2>New game</h2><div class="steps">${steps}</div>${UIS.inGame?'<button class="x" data-w="x">✕</button>':''}</header><div class="mb">${body}</div>
  <footer>${st>1?'<button class="btn ghost" data-w="back">← Back</button>':(UIS.inGame?'':'<button class="btn ghost" data-w="menu">← Menu</button>')}<span class="spacer" style="flex:1"></span><span class="mut">${esc(s.name)} · ${esc(WZ.custom?WZ.custom.name:LAYOUTS[WZ.layout].name)}</span>${st<3?'<button class="btn gold" data-w="next">Next →</button>':'<button class="btn green" data-w="go">▶ Start game</button>'}</footer>`,'wiz');
 o.querySelectorAll('input[type=range]').forEach(r=>r.oninput=()=>{WZ[r.dataset.r]=+r.value;r.parentElement.querySelector('b').innerHTML=r._fmt(r.value)});
 o.querySelectorAll('input[type=range]').forEach(r=>{const f=RF[r.dataset.r];r._fmt=f});
 o.querySelectorAll('[data-t]').forEach(c=>c.onchange=()=>WZ[c.dataset.t]=c.checked);
 const nm=o.querySelector('#wName');if(nm)nm.oninput=()=>WZ.name=nm.value;
 const up=o.querySelector('#upf');if(up)up.onchange=e=>readSheet(e.target.files[0]);
 const dr=o.querySelector('#drop');if(dr){dr.ondragover=e=>{e.preventDefault();dr.classList.add('hot')};dr.ondragleave=()=>dr.classList.remove('hot');dr.ondrop=e=>{e.preventDefault();dr.classList.remove('hot');if(e.dataTransfer.files[0])readSheet(e.dataTransfer.files[0])}}
 o.onclick=e=>{const b=e.target.closest('[data-w]');if(!b)return;const w=b.dataset.w,k=b.dataset.k;
  if(w==='x')closeModal();if(w==='menu')showMenu();
  if(w==='scn'){const keepName=WZ.name;Object.assign(WZ,wizDefaults(k),{step:1,name:keepName,custom:WZ.custom,rules:WZ.rules});renderWizard()}
  if(w==='lay'){if(k!=='custom'){WZ.custom=null;WZ.layout=k}WZ.operators=layoutMS().filter(q=>DEF[q[0]]&&!DEF[q[0]].util).length;renderWizard()}
  if(w==='upl')o.querySelector('#upf').click();if(w==='tpl')downloadTemplate();
  if(w==='next'){WZ.step++;renderWizard()}if(w==='back'){WZ.step--;renderWizard()}
  if(w==='go')startGame(Object.assign({},WZ))}}
const RF={};
function rng(k,label,mn,mx,stp,f){RF[k]=f;return `<div class="fld"><label>${label} <b>${f(WZ[k])}</b></label><input type="range" data-r="${k}" min="${mn}" max="${mx}" step="${stp}" value="${WZ[k]}"></div>`}

// ---------------------------------------------------------------------
// SHEET UPLOAD + TEMPLATE  (SheetJS)
// ---------------------------------------------------------------------
const SYN=[['singe','desize'],['desiz','bleach'],['bleach','bleach'],['scour','bleach'],['dispens','station'],['dissolv','chem'],['powder','chem'],['jigger','jigger'],['jet','jet'],['soft','jet'],['auto','autokit'],['weigh','kitchen'],['kitchen','kitchen'],['lacquer','coater'],['coat','coater'],['laser','laser'],['engrav','laser'],['baby','baby'],['sampl','baby'],['infinium','rotary'],['rotary','rotary'],['flatbed','flatbed'],['flat bed','flatbed'],['digital','digital'],['inkjet','digital'],['stenter','stenter'],['trolley','bay'],['bay','bay'],['boiler','boiler'],['etp','etp'],['effluent','etp'],['inspect','qc'],['qc','qc']];
function typeOf(v){const s=String(v||'').toLowerCase().trim();if(!s)return null;if(DEF[s])return s;for(const k in DEF)if(DEF[k].name.toLowerCase()===s)return k;for(const[a,b]of SYN)if(s.includes(a))return b;return null}
const col=(row,...names)=>{for(const k of Object.keys(row)){const l=k.toLowerCase().trim();if(names.some(n=>l===n||l.startsWith(n)))return row[k]}return null};
function autoSpot(type,ms){const d=DEF[type];const r=d.zone==='any'?[X0,X1,Z0,Z1]:ZONES[d.zone].r;const[w,dd]=dims(d,0);
 for(let z=r[2]+dd/2+1;z<=r[3]-dd/2-1;z+=2)for(let x=r[0]+w/2+1;x<=r[1]-w/2-1;x+=2){const ghost={def:d,x,z,rot:0};const err=checkSpot(d,x,z,0,ms);if(!err)return[x,z]}return null}
function checkSpot(d,x,z,rot,ms){const[w,dd]=dims(d,rot),a=[x-w/2,x+w/2,z-dd/2,z+dd/2];const r=d.zone==='any'?[X0,X1,Z0,Z1]:ZONES[d.zone].r;if(a[0]<r[0]||a[1]>r[1]||a[2]<r[2]||a[3]>r[3])return'zone';
 for(const l of LANES)if(a[0]<l[1]&&a[1]>l[0]&&a[2]<l[3]&&a[3]>l[2])return'lane';
 for(const q of ms){const d2=DEF[q[0]];const[w2,d2d]=dims(d2,q[3]||0);if(Math.abs(q[1]-x)*2<w+w2+1&&Math.abs(q[2]-z)*2<dd+d2d+1)return'overlap'}return''}
async function readSheet(file){if(!file)return;if(!window.XLSX){toast('⚠️ The sheet reader did not load — check your connection');return}
 try{const wb=XLSX.read(await file.arrayBuffer(),{type:'array'});const out={name:file.name.replace(/\.(xlsx|xls|csv)$/i,''),ms:[],rules:[],settings:{},loops:{},skipped:0};
  for(const sn of wb.SheetNames){const rows=XLSX.utils.sheet_to_json(wb.Sheets[sn],{defval:null});if(!rows.length)continue;const n=sn.toLowerCase(),keys=Object.keys(rows[0]).map(k=>k.toLowerCase());
   if(keys.some(k=>k==='type'||k.startsWith('machine'))&&!n.includes('rule')&&!n.includes('loop')&&!n.includes('trolleys &')){for(const r of rows){const t=typeOf(col(r,'type','machine'));if(!t){out.skipped++;continue}
     const x=+col(r,'x'),z=+col(r,'z'),rot=(+col(r,'rotation','rot')||0)%4,nm=col(r,'name');out.ms.push({t,x:isFinite(x)&&col(r,'x')!=null?x:null,z:isFinite(z)&&col(r,'z')!=null?z:null,rot,nm})}}
   else if(n.includes('setting')){for(const r of rows){const k=String(col(r,'setting','key','name')||'').toLowerCase(),v=col(r,'value');if(k)out.settings[k]=v}}
   else if(n.includes('rule')&&keys.includes('rule')){for(const r of rows)if(col(r,'rule'))out.rules.push([col(r,'area')||'Rule',col(r,'rule'),col(r,'where')||''])}
   else if(n.includes('loop')){for(const r of rows){const L=String(col(r,'loop')||'').toLowerCase();const k=L.includes('wet')?'A':L.includes('print')?'B':L.includes('colour')||L.includes('color')?'C':null;if(!k)continue;out.loops[k]=out.loops[k]||{};const sp=+col(r,'speed'),mx=+col(r,'max'),s0=+col(r,'starting');if(sp)out.speed=sp;if(mx)out.loops[k].max=mx;if(s0)out.loops[k].start=s0}}
   else if(n.includes('trolley')){for(const r of rows){const L=String(col(r,'loop')||'').toLowerCase();const k=L.includes('wet')?'A':L.includes('print')?'B':L.includes('colour')||L.includes('color')?'C':null;const ld=+col(r,'fabric','load'),tr=+col(r,'trolley tare','tare');if(!k||!ld)continue;out.loops[k]=out.loops[k]||{};(out.loops[k].loads=out.loops[k].loads||[]).push(ld);if(tr)out.loops[k].tare=tr}}}
  // positions: keep valid ones, auto-place the rest
  const placed=[];for(const q of out.ms){let x=q.x,z=q.z;if(x==null||z==null||checkSpot(DEF[q.t],x,z,q.rot,placed)){const sp=autoSpot(q.t,placed);if(!sp){out.skipped++;continue}[x,z]=sp;q.rot=0}placed.push([q.t,x,z,q.rot,q.nm])}
  const S2=out.settings,num=(...ks)=>{for(const k of ks)for(const s in S2)if(s.includes(k)&&isFinite(+S2[s])&&S2[s]!==null&&S2[s]!=='')return +S2[s];return null};
  WZ.custom={name:out.name,ms:placed,rules:out.rules,skipped:out.skipped,loops:out.loops};WZ.rules=out.rules;
  const c=num('cash'),op=num('operator','worker','labour','labor'),wg=num('wage'),mo=num('month'),sp=num('speed')||out.speed,ml=num('load'),bk=num('breakdown');
  if(c!=null)WZ.cash=c;WZ.operators=op!=null?op:placed.filter(q=>!DEF[q[0]].util).length;if(wg)WZ.wage=wg;if(mo)WZ.month=mo;if(sp)WZ.speed=sp;if(ml)WZ.maxLoad=Math.min(300,ml);if(bk!=null)WZ.brk=bk;
  for(const s in S2){const v=String(S2[s]).toLowerCase();if(s.includes('boiler'))WZ.boiler=v==='yes'||v==='true'||v==='1';if(s.includes('qc')||s.includes('inspection'))WZ.qc=v==='yes'||v==='true'||v==='1';if(s.includes('etp'))WZ.etp=v==='yes'||v==='true'||v==='1';if(s==='plant name'||s==='name')WZ.name=S2[s]}
  toast('📊 Read '+placed.length+' machines'+(out.rules.length?', '+out.rules.length+' rules':'')+' from “'+file.name+'”');renderWizard()}
 catch(e){console.error(e);toast('⚠️ Could not read that file — use the template for the expected columns')}}
function downloadTemplate(){if(!window.XLSX){toast('⚠️ The sheet writer did not load');return}const wb=XLSX.utils.book_new();
 const ms=layoutMS().map(q=>({Type:q[0],Machine:DEF[q[0]].name,X:q[1],Z:q[2],Rotation:q[3]||0,Name:q[4]||''}));
 XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(ms),'Machines');
 XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet([{Setting:'Plant name',Value:WZ.name},{Setting:'Cash',Value:WZ.cash},{Setting:'Operators',Value:WZ.operators},{Setting:'Wage',Value:WZ.wage},{Setting:'Month seconds',Value:WZ.month},{Setting:'Trolley speed',Value:WZ.speed},{Setting:'Max trolley load',Value:WZ.maxLoad},{Setting:'Breakdown %',Value:WZ.brk},{Setting:'Boiler',Value:WZ.boiler?'Yes':'No'},{Setting:'QC',Value:WZ.qc?'Yes':'No'},{Setting:'ETP',Value:WZ.etp?'Yes':'No'}]),'Settings');
 XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(RULES.text.map(r=>({Area:r[0],Rule:r[1],Where:r[2]}))),'Rules');
 XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(Object.entries(DEF).map(([k,d])=>({Type:k,Machine:d.name,Department:ZONES[d.zone]?ZONES[d.zone].name:'Any',Width_m:dims(d,0)[0],Depth_m:dims(d,0)[1],Cost:d.cost}))),'Machine types');
 XLSX.writeFile(wb,'textile-tycoon-plant-template.xlsx');toast('⬇ Template downloaded')}

// ---------------------------------------------------------------------
// START A GAME
// ---------------------------------------------------------------------
function applyCfg(c){MONTH=c.month||60;RULES.speed=c.speed||1.2;RULES.maxLoad=Math.min(300,c.maxLoad||300);for(const k in LOOPS)LOOPS[k].sp=RULES.speed;
 if(c.custom&&c.custom.loops)for(const k in c.custom.loops){const L=c.custom.loops[k];if(!RULES.loops[k])continue;if(L.loads)RULES.loops[k].loads=L.loads;if(L.tare)RULES.loops[k].tare=L.tare;if(L.max)RULES.loops[k].max=L.max;if(L.start)RULES.loops[k].start=L.start;LOOPS[k].loads=RULES.loops[k].loads;LOOPS[k].tare=RULES.loops[k].tare}
 DN.len=c.day||48;G.wage=c.wage||600;G.brk=c.brk!=null?c.brk/100:.025}
function startGame(c){closeModal();hideMenu();const s=scn(c.scenario);clearPlant();G=freshState();G.cfg=c;G.plantName=c.name||'My Textile Mill';G.scenario=s.id;G.stats={revenue:0,fd:0,fp:0,exports:0,monthRev:0};G.scenarioDone=false;UIS.ended=false;
 applyCfg(c);G.money=c.cash;if(s.loan)G.loan=s.loan;if(s.rep!=null)G.rep=s.rep;if(s.printBias!=null)G.printBias=s.printBias;
 const lay=c.custom?{ms:c.custom.ms,research:[]}:LAYOUTS[c.layout];(lay.research||[]).forEach(r=>G.research[r]=1);
 let skipped=0;const ms=lay.ms.filter(q=>!(q[0]==='boiler'&&!c.boiler)&&!(q[0]==='qc'&&!c.qc));
 for(const q of ms){if(!DEF[q[0]]){skipped++;continue}if(rectOK(DEF[q[0]],q[1],q[2],q[3]||0,null)){skipped++;continue}addMachine(q[0],q[1],q[2],q[3]||0,q[4]?{name:q[4]}:undefined)}
 const util=[['boiler',c.boiler,[72,-26]],['qc',c.qc,[-8,32]],['etp',c.etp,[80,26]]];
 for(const[t,on,p]of util){if(!on||machines.some(m=>m.type===t))continue;if(t==='etp')G.research.etp=1;let at=p;if(rectOK(DEF[t],p[0],p[1],0,null)){const sp=autoSpot(t,machines.map(m=>[m.type,m.x,m.z,m.rot]));if(!sp){toast('⚠️ No room for the '+DEF[t].name);continue}at=sp}addMachine(t,at[0],at[1],0)}
 G.workers=c.operators;G.nightShift=!!c.night;G.tod=0;if(s.broken){machines.filter(m=>!m.def.util).slice(0,s.broken).forEach(m=>m.broken=true)}
 syncTrolleys();newOrder();newOrder();UIS.cashShown=G.money;UIS.slot=null;enterGame();go(0);
 banner('Welcome to '+G.plantName,s.name);if(skipped)toast('⚠️ '+skipped+' machines did not fit and were left out');
 if(s.goals.length)setTimeout(()=>togglePanel('goals'),900)}
function enterGame(){UIS.inGame=true;window.menuOrbit=false;G.paused=false;if(!G.speed)G.speed=1;['chip','bar','z','info','dock','status','clock'].forEach(id=>$(id).classList.remove('hidden'));closeModal();renderDock();refreshStats();renderTab();if(UIS.panel)renderTab()}
function exitGame(){UIS.inGame=false;closePanel();select(null);if(tool)setTool(null);['chip','bar','z','info','dock','status','clock'].forEach(id=>$(id).classList.add('hidden'))}

// ---------------------------------------------------------------------
// GOALS, WIN / LOSE
// ---------------------------------------------------------------------
function checkGoals(){if(!UIS.inGame||UIS.ended)return;const s=scn(G.scenario);if(!s.goals.length)return;
 if(s.goals.every(g=>goalValue(g.k)>=g.n)){UIS.ended=true;G.scenarioDone=true;endScreen(true);return}
 if(s.loseCash!=null&&G.money<s.loseCash){UIS.ended=true;endScreen(false,'The bank called in the loans: cash fell below '+money(s.loseCash)+'.');return}
 if(s.months&&G.month>=s.months){UIS.ended=true;endScreen(false,'Time is up: '+s.months+' months have passed.')}}
function endScreen(win,why){G.paused=true;if(win)confetti(true);const s=scn(G.scenario);
 const o=modal(`<header>${ico(win?'i-goals':s.icon)}<h2>${win?'Scenario complete!':'Scenario failed'}</h2></header><div class="mb" style="text-align:center">
  <div style="font:800 64px var(--head);animation:pop .7s var(--spring)">${win?'🏆':'📉'}</div><h3 style="font:800 26px var(--head);margin:4px 0">${s.name}</h3><p class="mut" style="font-size:15px">${win?'You met every goal in '+G.month+' months.':esc(why)}</p>
  <div class="kpis" style="max-width:560px;margin:14px auto"><div class="kpi"><span>Revenue</span><b>${short(G.stats.revenue||0)}</b></div><div class="kpi"><span>Cash</span><b>${short(G.money)}</b></div><div class="kpi"><span>Reputation</span><b>${Math.round(G.rep)}</b></div><div class="kpi"><span>Machines</span><b>${machines.length}</b></div></div></div>
  <footer><button class="btn ghost" data-e="menu">Main menu</button><span style="flex:1"></span><button class="btn gold" data-e="new">New game</button><button class="btn green" data-e="keep">Keep playing</button></footer>`);
 o.onclick=e=>{const b=e.target.closest('[data-e]');if(!b)return;confetti(false);if(b.dataset.e==='keep'){closeModal();G.paused=false}if(b.dataset.e==='new')openWizard();if(b.dataset.e==='menu')showMenu()}}

// ---------------------------------------------------------------------
// TITLE MENU
// ---------------------------------------------------------------------
function showMenu(){closeModal();exitGame();window.menuOrbit=true;go(0);goal.r=150;goal.ph=.85;let m=$('menu');if(m)m.remove();const latest=index().sort((a,b)=>b.savedAt-a.savedAt)[0];
 m=document.createElement('div');m.id='menu';m.innerHTML=`<div class="title">${ico('i-logo')}<h1>Textile Tycoon</h1><div class="tag">Processing · Dyeing · Printing · Finishing</div></div>
  <div class="mbtns">${latest?`<button class="mbtn" data-t="cont" style="animation-delay:.1s">${ico('i-play')}<span>Continue<small>${esc(latest.name)} · ${monthName(latest.month||0)}</small></span></button>`:''}
  <button class="mbtn" data-t="new" style="animation-delay:.18s">${ico('i-new')}<span>New game<small>Scenario, layout, your own sheet</small></span></button>
  <button class="mbtn" data-t="load" style="animation-delay:.26s">${ico('i-load')}<span>Load game<small>${index().length} saved game${index().length===1?'':'s'}</small></span></button>
  <button class="mbtn" data-t="scn" style="animation-delay:.34s">${ico('i-goals')}<span>Scenarios<small>${SCENARIOS.length} challenges</small></span></button>
  <button class="mbtn" data-t="help" style="animation-delay:.42s">${ico('i-help')}<span>How to play</span></button></div>
  <div class="foot">Machines from the Fable Machine Models library and the Machine Spares Explorer · plant rules from Kibrom Plant 3D</div>`;
 document.body.appendChild(m);m.onclick=e=>{const b=e.target.closest('[data-t]');if(!b)return;const t=b.dataset.t;if(t==='cont'&&latest){hideMenu();loadSlot(latest.id)}if(t==='new')openWizard();if(t==='scn'){openWizard();}if(t==='load')openSaves('load');if(t==='help')openHelp()}}
function hideMenu(){const m=$('menu');if(m)m.remove();window.menuOrbit=false}

// ---------------------------------------------------------------------
// MACHINE THUMBNAILS (rendered from the real models)
// ---------------------------------------------------------------------
function makeThumbs(){let tr;try{tr=new THREE.WebGLRenderer({antialias:true,alpha:true,preserveDrawingBuffer:true})}catch(e){return}tr.setSize(260,170);tr.outputEncoding=THREE.sRGBEncoding;tr.toneMapping=THREE.ACESFilmicToneMapping;
 const sc=new THREE.Scene();sc.add(new THREE.HemisphereLight(0xffffff,0xb0a090,.9));const dl=new THREE.DirectionalLight(0xffffff,1.1);dl.position.set(-3,6,4);sc.add(dl);if(S.environment)sc.environment=S.environment;
 const cam=new THREE.PerspectiveCamera(30,260/170,.1,500);const keys=Object.keys(DEF);let i=0;
 (function next(){if(i>=keys.length){tr.dispose();if(UIS.panel==='build')renderTab();return}const k=keys[i++];try{const{outer}=buildModel(DEF[k]);sc.add(outer);outer.updateMatrixWorld(true);const bb=new THREE.Box3().setFromObject(outer),c=bb.getCenter(new THREE.Vector3()),s=bb.getSize(new THREE.Vector3());
   const d=Math.max(s.x,s.y*1.4,s.z)*1.55+1;cam.position.set(c.x+d*.75,c.y+d*.55,c.z+d*.8);cam.lookAt(c);tr.render(sc,cam);UIS.thumbs[k]=tr.domElement.toDataURL('image/png');sc.remove(outer)}catch(e){}setTimeout(next,16)})()}


// ---------------------------------------------------------------------
// DAY & NIGHT, TIME OF DAY, SHIFTS
// ---------------------------------------------------------------------
// One plant day lasts DN.len game seconds (default 48). Day shift runs 06:00–22:00.
// At night only a skeleton crew works (35% output) unless a paid night shift
// is running (90% output, +40% wages). Light, sky, fog and lamps follow the clock.
const DN={len:48,lock:null,lamps:[],glow:null};
const SKY=[[0,0x0d1530],[4.5,0x1b2550],[6,0xf2a679],[7.5,0xdfe5ea],[17,0xdfe5ea],[18.6,0xf08a6c],[20,0x2b2f63],[21.5,0x0d1530],[24,0x0d1530]];
function lerpCol(a,b,t){const A=new THREE.Color(a),B=new THREE.Color(b);return A.lerp(B,t)}
function skyAt(h){for(let i=0;i<SKY.length-1;i++){const[a,ca]=SKY[i],[b,cb]=SKY[i+1];if(h>=a&&h<=b)return lerpCol(ca,cb,(h-a)/(b-a||1))}return new THREE.Color(SKY[0][1])}
const hourNow=()=>DN.lock!=null?DN.lock:((G.tod||0)/DN.len*24+6)%24;
const isNight=h=>h<6||h>=22;
const daylight=h=>Math.max(0,Math.sin((h-6)/12*Math.PI));
function setNight(on){G.nightShift=!!on;toast(on?'🌙 Night shift on — 90% output after 22:00, wages +40%':'☀️ Night shift off — skeleton crew only at night');refreshClock()}
function skipNight(){const h=hourNow();if(DN.lock!=null){DN.lock=null}const add=((30-h)%24)/24*DN.len;G.tod=(G.tod||0)+add;banner('Good morning','06:00 · day shift starts')}
function buildLamps(){if(DN.glow)return;const g=new THREE.Group();const tex=(()=>{const c=document.createElement('canvas');c.width=c.height=64;const x=c.getContext('2d');const r=x.createRadialGradient(32,32,0,32,32,32);r.addColorStop(0,'rgba(255,240,200,1)');r.addColorStop(.25,'rgba(255,214,140,.65)');r.addColorStop(1,'rgba(255,200,120,0)');x.fillStyle=r;x.fillRect(0,0,64,64);return new THREE.CanvasTexture(c)})();
 const mat=new THREE.SpriteMaterial({map:tex,blending:THREE.AdditiveBlending,depthWrite:false,transparent:true,opacity:0});
 const pool=new THREE.MeshBasicMaterial({map:tex,blending:THREE.AdditiveBlending,depthWrite:false,transparent:true,opacity:0});
 for(let x=X0+8;x<X1;x+=16)for(let z=Z0+6;z<Z1;z+=14){const sp=new THREE.Sprite(mat);sp.position.set(x,11,z);sp.scale.set(3.2,3.2,1);g.add(sp);const pl=new THREE.Mesh(new THREE.PlaneGeometry(13,13),pool);pl.rotation.x=-Math.PI/2;pl.position.set(x,.06,z);g.add(pl)}
 DN.mat=mat;DN.pool=pool;DN.glow=g;S.add(g);
}
let sunL=null,fillL=null,hemiL=null;
function grabLights(){S.traverse(o=>{if(o.isDirectionalLight&&o.castShadow)sunL=o;else if(o.isDirectionalLight)fillL=o;if(o.isHemisphereLight)hemiL=o});sunL&&(sunL.userData.i=sunL.intensity);fillL&&(fillL.userData.i=fillL.intensity);hemiL&&(hemiL.userData.i=hemiL.intensity)}
function dimSet(){if(DN.basic)return DN.basic;DN.basic=[];S.traverse(o=>{const m=o.material;if(o.isMesh&&m&&m.isMeshBasicMaterial&&!m.map&&m!==DN.pool&&!m.userData.dn){m.userData.dn=m.color.clone();DN.basic.push(m)}});return DN.basic}
function applyLight(h){if(!sunL)grabLights();buildLamps();if(!DN.basicT||performance.now()-DN.basicT>5000){DN.basicT=performance.now();DN.basic=null}const d=daylight(h),night=1-Math.min(1,d*2.2);
 const ang=(h-6)/24*Math.PI*2;if(sunL){sunL.position.set(Math.cos(ang)*-110,Math.max(14,Math.sin(ang)*95+10),60);sunL.intensity=sunL.userData.i*(.12+.88*Math.min(1,d*1.6));sunL.color.copy(lerpCol(0xffb07a,0xfff4e6,Math.min(1,d*2)));if(d<.05)sunL.color.set(0x9fb4ff)}
 if(fillL)fillL.intensity=fillL.userData.i*(.4+.6*d);if(hemiL){hemiL.intensity=hemiL.userData.i*(.45+.55*d)+night*.08;hemiL.color.copy(lerpCol(0x8fa6ff,0xf4f8ff,Math.min(1,d*2)))}
 R.toneMappingExposure=.62+.48*Math.min(1,d*2);
 const sky=skyAt(h);window.skyCol=sky.getHex();if(useFX&&composer){S.background.copy(sky).convertSRGBToLinear();S.fog.color.copy(S.background)}else{S.background.copy(sky);S.fog.color.copy(sky)}
 const k=.3+.7*Math.min(1,d*1.8);for(const m of dimSet())m.color.copy(m.userData.dn).multiplyScalar(k);DN.mat.opacity=night*.95;DN.pool.opacity=night*.38;DN.glow.visible=UIS.inGame&&night>.02;document.body.classList.toggle('night',night>.6)}
function refreshClock(){if(!G)return;const h=hourNow(),hh=Math.floor(h),mm=Math.floor((h-hh)*60/15)*15;$('cTime').textContent=String(hh).padStart(2,'0')+':'+String(mm).padStart(2,'0');
 const n=isNight(h);$('cShift').textContent=DN.lock!=null?'Time locked':n?(G.nightShift?'Night shift · 90%':'Skeleton crew · 35%'):h<8?'Morning':h<12?'Day shift':h<17?'Afternoon':'Evening';
 $('dialHand').setAttribute('transform',`rotate(${(h-12)/24*360} 32 32)`);$('dialMoon').setAttribute('transform',`rotate(${(h-12)/24*360} 32 32)`);$('cNight').classList.toggle('on',!!G.nightShift)}
function shiftHTML(){const h=hourNow(),n=isNight(h);return `<div class="kpis"><div class="kpi"><span>Plant time</span><b>${$('cTime').textContent}</b></div><div class="kpi"><span>Now</span><b>${n?'Night':'Day'}</b></div><div class="kpi"><span>Output now</span><b class="${n&&!G.nightShift?'down':'up'}">${Math.round((window.shiftRate||1)*100)}%</b></div><div class="kpi"><span>Night shift cost</span><b>${G.nightShift?short(G.workers*(G.wage||600)*.4)+'/mo':'—'}</b></div></div>
 <div class="card"><h4>Shift pattern</h4><svg viewBox="0 0 360 46" style="width:100%;height:46px"><rect x="0" y="12" width="360" height="22" rx="11" fill="#1b2550"/><rect x="90" y="12" width="240" height="22" fill="#ffd34d"/><rect x="${h/24*360-2}" y="6" width="4" height="34" rx="2" fill="#ef476f"/><text x="4" y="44" font-size="9" fill="#7a6a55">00</text><text x="84" y="44" font-size="9" fill="#7a6a55">06</text><text x="322" y="44" font-size="9" fill="#7a6a55">22</text></svg>
 <div class="mut">Day shift 06:00–22:00 runs at full output. At night a skeleton crew keeps the plant at 35%; a paid night shift lifts that to 90% for 40% extra wages.</div>
 <div class="row"><button class="btn ${G.nightShift?'ghost':'gold'} sm" data-u="ns">${G.nightShift?'Stop night shift':'🌙 Start night shift'}</button><button class="btn ghost sm" data-u="skip">⏭ Skip to morning</button></div></div>`}
const SETF={speed:v=>(+v).toFixed(1)+' m/s',maxLoad:v=>v+' kg',month:v=>v+' s',brk:v=>(+v).toFixed(1)+'%/mo',wage:v=>money(v)+'/mo',day:v=>v+' s'};
function sl(k,label,v,mn,mx,st){return `<div class="fld"><label>${label} <b>${SETF[k](v)}</b></label><input type="range" data-set="${k}" min="${mn}" max="${mx}" step="${st}" value="${v}"></div>`}
function settingsHTML(){return `<div class="card"><h4>Live working rules</h4><div class="mut">Changes apply at once and are kept in your save.</div><div class="form" style="grid-template-columns:1fr">
 ${sl('speed','Trolley speed',RULES.speed,.6,2,.1)}${sl('maxLoad','Max trolley load (1 pusher)',RULES.maxLoad,150,300,10)}${sl('wage','Wage per operator',G.wage||600,300,1500,50)}${sl('month','Month length',MONTH,20,180,10)}${sl('day','Plant day length',DN.len,16,180,4)}${sl('brk','Breakdown chance',((G.brk!=null?G.brk:.025)*100),0,10,.5)}</div></div>`}
function displayHTML(){const t=[['auto','Live clock'],[7,'Morning'],[13,'Noon'],[18.7,'Sunset'],[23,'Night']];
 return `<div class="card"><h4>Time of day</h4><div class="mut">Lock the light for a screenshot or presentation. The plant keeps running on its own clock.</div><div class="chips">${t.map(([v,n])=>`<button class="chipb${(DN.lock==null&&v==='auto')||DN.lock===v?' on':''}" data-u="tod" data-k="${v}">${n}</button>`).join('')}</div></div>
 <div class="card"><h4>Display</h4><div class="row"><button class="btn ghost sm" onclick="document.getElementById('lbl').click()">Machine labels: ${showLabels?'on':'off'}</button><button class="btn ghost sm" onclick="document.getElementById('fx').click()">High quality: ${useFX?'on':'off'}</button></div></div>`}
window.onFrame=function(rdt,gdt){if(!G)return;G.tod=(G.tod||0)+gdt;const h=hourNow();
 window.shiftRate=isNight(((G.tod||0)/DN.len*24+6)%24)?(G.nightShift?.9:.35):1;applyLight(UIS.inGame?h:15);
 if(UIS.inGame&&performance.now()-(DN.lastC||0)>250){DN.lastC=performance.now();refreshClock();const wasN=DN.wasN,nowN=isNight(((G.tod||0)/DN.len*24+6)%24);if(wasN!=null&&wasN!==nowN&&DN.lock==null)banner(nowN?'Night falls':'Sunrise',nowN?(G.nightShift?'night shift takes over':'skeleton crew · 35% output'):'day shift starts');DN.wasN=nowN}};
$('cNight').onclick=()=>setNight(!G.nightShift);$('cSkip').onclick=skipNight;

// ---------------------------------------------------------------------
// BOOT
// ---------------------------------------------------------------------
// detailed models stream in after the game is already playable: show a small, calm progress badge, never a blocking screen
function loadBadge(){if($('mload'))return;const el=document.createElement('div');el.id='mload';el.title='The game is fully playable now. Machines switch to their detailed 3D models as each one arrives.';
 el.innerHTML='<svg viewBox="0 0 36 36"><circle cx="18" cy="18" r="15" fill="none" stroke="rgba(255,255,255,.18)" stroke-width="4"/><circle id="mlR" cx="18" cy="18" r="15" fill="none" stroke="#f6b93b" stroke-width="4" stroke-linecap="round" stroke-dasharray="94.2" stroke-dashoffset="94.2" style="transition:stroke-dashoffset .4s"/></svg><span><b>Adding machine detail</b><span id="mlT">0 of '+((window.modelProgress||{}).total||19)+' models</span></span>';
 document.body.appendChild(el);const p=window.modelProgress;if(p)onModelLoaded(null,p.n,p.total)}
window.onModelLoaded=function(f,n,total){const r=$('mlR'),t=$('mlT');if(!r)return;r.style.strokeDashoffset=94.2*(1-n/total);t.textContent=n+' of '+total+' models';
 if(f&&UIS.inGame){const k=Object.keys(DEF).find(k=>{const g=DEF[k].glb;return g===f||(Array.isArray(g)&&g.some(p=>p.f===f))});const m=k&&machines.find(m=>m.type===k);if(m&&performance.now()-(UIS.lastUp||0)>900){UIS.lastUp=performance.now();const p=project(new THREE.Vector3(m.x,(m.def.h||4)+2,m.z));if(p)popAt(p.x,p.y,'✨ '+DEF[k].name,'pop')}}};
window.onAllModels=function(){const el=$('mload');if(el){$('mlT').textContent='All machines in full detail';setTimeout(()=>el.classList.add('done'),1800);setTimeout(()=>el.remove(),2600)}setTimeout(makeThumbs,300)};
window.onModelsReady=function(){if(UIS.booted)return;UIS.booted=true;
 // a demo plant turns slowly behind the title menu
 clearPlant();G=freshState();G.plantName='Demo plant';G.scenario='sandbox';G.stats={};applyCfg({});LAYOUTS.integrated.research.forEach(r=>G.research[r]=1);
 for(const q of LAYOUTS.integrated.ms)if(!rectOK(DEF[q[0]],q[1],q[2],q[3],null))addMachine(q[0],q[1],q[2],q[3]);G.workers=99;syncTrolleys();G.speed=1;
 showMenu();loadBadge();
 (async()=>{try{dirH=await idbGet('dir')}catch(e){}})()};
addEventListener('keydown',e=>{if(e.target.tagName==='INPUT')return;
 if(e.key==='Escape'){if($('ov')&&UIS.inGame){closeModal();return}if(UIS.panel&&!tool&&!sel){closePanel();return}}
 if(!UIS.inGame||$('ov'))return;
 if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='s'){e.preventDefault();e.stopImmediatePropagation();quickSave();return}
 if(e.key.toLowerCase()==='n'&&!e.ctrlKey){setNight(!G.nightShift);return}const map={b:'build',o:'orders',f:'finance',g:'goals'};if(map[e.key.toLowerCase()]&&!e.ctrlKey&&!e.metaKey)togglePanel(map[e.key.toLowerCase()])},true);
// keep the cash counter animating and the dock fresh between engine UI refreshes
setInterval(()=>{if(UIS.inGame)refreshStats()},120);
// the engine status line only matters while placing or with a machine selected
setInterval(()=>{if(UIS.inGame)refreshInfo()},400);
if(window.engineReady)onModelsReady();
})();
