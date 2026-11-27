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
const curNow=()=>{const e=(typeof G!=='undefined'&&G)?G.econ:null;if(!e||e.cur!=='local'||typeof COUNTRIES==='undefined')return{sym:'$',fx:1};const C=COUNTRIES[e.country];return{sym:C.sym||C.cur+' ',fx:C.fx}};
const money=n=>{const c=curNow(),v=n*c.fx;return (v<0?'-':'')+c.sym+Math.abs(Math.round(v)).toLocaleString('en-US')};
const short=n=>{const c=curNow(),v=n*c.fx,a=Math.abs(v),s=v<0?'-':'';return a>=1e9?s+c.sym+(a/1e9).toFixed(1)+'B':a>=1e6?s+c.sym+(a/1e6).toFixed(1)+'M':a>=1e4?s+c.sym+Math.round(a/1e3)+'K':s+c.sym+Math.round(a).toLocaleString('en-US')};
window.fmtMoney=money;
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
window.onProduce=function(m){if(G&&UIS.inGame&&maybeReject(m))return;if(G&&G.fin&&!m.def.util)G.fin.today.lots++;if(!UIS.inGame||m.def.util)return;const now=performance.now();if(now-(UIS.lastPop[m.id]||0)<1800||UIS.popCount>6)return;UIS.lastPop[m.id]=now;
 const v=new THREE.Vector3(m.x,(m.def.h||4)+2.2,m.z),p=project(v);if(!p||p.x<0||p.y<0||p.x>innerWidth||p.y>innerHeight-170)return;
 const out=m.def.stenter?(m.lot==='printed'?'Finished printed':'Finished dyed'):MAT[Object.keys(m.def.out)[0]]||'';UIS.popCount++;setTimeout(()=>UIS.popCount--,1900);popAt(p.x,p.y,'+1 '+out)};
window.onDeliver=function(o){book('orders',o.reward);{const pf=fabric().price;if(pf!==1){const d=Math.round(o.reward*(pf-1));G.money+=d;book('orders',d)}}econDeliver(o);finState().today.del++;const st=G.stats=G.stats||{};st.revenue=(st.revenue||0)+o.reward;st[o.type]=(st[o.type]||0)+o.qty;if(o.exp)st.exports=(st.exports||0)+1;st.monthRev=(st.monthRev||0)+o.reward;
 const x=innerWidth/2,y=innerHeight/2-40;coinBurst(x,y);popAt(x,y-20,'+'+money(o.reward),'bigpop');checkGoals()};
window.onMonth=function(cost){if(G.nightShift){const x=G.workers*(G.wage||600)*.4;G.money-=x;cost+=x}recordMonth(cost);finMonth(cost);riskMonth();econMonth();machines.forEach(m=>m.age=(m.age||0)+1);const st=G.stats=G.stats||{};st.lastRev=st.monthRev||0;st.monthRev=0;banner(monthName(G.month),'running costs −'+money(cost));checkGoals();renderDock()};

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
const DOCK=[['build','i-build','Build'],['prod','i-trend','Capacity'],['orders','i-orders','Orders'],['research','i-research','Research'],['finance','i-finance','Finance'],['staff','i-staff','Staff'],['rules','i-rules','Rules'],['goals','i-goals','Goals'],['views','i-views','Views'],['save','i-save','Save'],['menu','i-menu','Menu']];
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
 staff:()=>[[()=>{UIS.sub.staff='op';togglePanel('staff')},'i-staff','Operators','Hire and dismiss'],[()=>openOrg(),'i-staff','Organisation chart','Names & salaries by country'],[()=>{UIS.sub.staff='sh';togglePanel('staff')},'i-staff','Shifts','Day, night, skip to morning'],[()=>setNight(!G.nightShift),'i-staff',G.nightShift?'Stop night shift':'Start night shift','+40% wages']],
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
const PANEL_META={build:['i-build','Build machines'],prod:['i-trend','Capacity, trolleys & skills'],orders:['i-orders','Orders'],research:['i-research','Research lab'],finance:['i-finance','Finance'],staff:['i-staff','Staff & handlers'],rules:['i-rules','Plant rules'],goals:['i-goals','Scenario goals'],views:['i-views','Camera views']};
function togglePanel(k){if(UIS.panel===k)return closePanel();UIS.panel=k;tab=k;const p=$('panel');p.classList.remove('hidden');p.style.animation='none';void p.offsetWidth;p.style.animation='';$('pIco').innerHTML=`<use href="#${PANEL_META[k][0]}"/>`;$('pTitle').textContent=PANEL_META[k][1];renderTab();renderDock()}
function closePanel(){UIS.panel=null;$('panel').classList.add('hidden');renderDock()}
$('pClose').onclick=closePanel;
function stockRow(keys){return '<div class="stockrow">'+keys.map(k=>`<span class="stk">${MAT[k]} <b>${+G.inv[k].toFixed(1)}</b></span>`).join('')+'</div>'}
function recipe(d){if(d.stenter)return 'Dyed or printed → finished';if(d.util)return d.desc.split('.')[0];const i=Object.keys(d.need).map(k=>MAT[k]).join(' + ');return (i?i+' → ':'Makes ')+Object.keys(d.out).map(k=>MAT[k]).join('')}
const SUBS={prod:[['cap','Capacity'],['trl','Trolleys'],['skl','Skills'],['fab','Fabric']],finance:[['ov','Overview'],['st','Statements'],['mk','Market'],['ln','Loans'],['cs','Consultant']],staff:[['op','Operators'],['org','Organisation'],['rk','Quality & security'],['sh','Shifts'],['un','Uniforms']],rules:[['pr','Plant rules'],['st','Country, costs & rules']],views:[['cam','Cameras'],['dsp','Display & time']]};
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
   <div class="card"><h4>Spot market</h4><div class="mut">Pays less than orders, but turns stock into cash now.</div><div class="row"><button class="btn sm" data-a="spot" data-k="fd" ${G.inv.fd<1?'disabled':''}>Sell finished dyed · $550/lot</button><button class="btn sm" data-a="spot" data-k="fp" ${G.inv.fp<1?'disabled':''}>Sell finished printed · $800/lot</button></div></div>`;if(sb==='st'){const f=finState(),P=plOf(f.months[G.month],G.month),last=Object.keys(f.months).map(Number).filter(m=>m<G.month).pop(),PL=last!=null?plOf(f.months[last],last):null,B=bsNow();h+=`<div class="kpis"><div class="kpi"><span>Revenue this month</span><b class="up">${short(P.rev)}</b></div><div class="kpi"><span>Net profit this month</span><b class="${P.net<0?'down':'up'}">${short(P.net)}</b></div><div class="kpi"><span>Last month net</span><b class="${PL&&PL.net<0?'down':'up'}">${PL?short(PL.net):'—'}</b></div><div class="kpi"><span>Owner’s equity</span><b>${short(B.equity)}</b></div></div><div class="card"><h4>Statements</h4><div class="mut">Profit &amp; loss, cash flow and balance sheet month by month, plus a daily log.</div><div class="row">${[['pl','Profit & loss'],['cf','Cash flow'],['bs','Balance sheet'],['day','Daily log']].map(([k,t])=>`<button class="btn sm ${k==='pl'?'green':'ghost'}" data-u="stm" data-k="${k}">${t}</button>`).join('')}</div></div>`}if(sb==='cs')h+=consultHTML()+`<div class="row"><button class="btn ghost sm" data-u="rev">📈 Revenue graph</button></div>`;if(sb==='ln')h+=`<div class="card"><h4>Bank loan · 1% a month</h4><div class="bar2 gold"><i style="width:${G.loan/1000}%"></i></div><div class="row"><button class="btn ghost sm" data-a="borrow" ${G.loan>=100000?'disabled':''}>Borrow $10,000</button><button class="btn ghost sm" data-a="repay" ${G.loan<10000||G.money<10000?'disabled':''}>Repay $10,000</button></div></div>`}
 else if(k==='staff'){const prod=machines.filter(m=>!m.def.util),need=prod.length,handlers=movers.reduce((a,v)=>a+v.np,0);
  if(sb==='op')h+=`<div class="kpis"><div class="kpi"><span>Operators</span><b>${G.workers}</b></div><div class="kpi"><span>Machines needing one</span><b class="${G.workers<need?'down':''}">${need}</b></div><div class="kpi"><span>Wage</span><b>${money(G.wage||600)}/mo</b></div><div class="kpi"><span>Trolley handlers</span><b>${handlers}</b></div></div>
   <div class="card"><h4>Hire operators</h4><div class="mut">Each production machine needs one operator. Hiring costs $1,500 plus the monthly wage.</div><div class="row"><button class="btn green sm" data-a="hire" ${G.money<1500?'disabled':''}>👷 Hire operator</button><button class="btn ghost sm" data-a="fire" ${G.workers<1?'disabled':''}>Dismiss one</button></div></div>
   <div class="card"><h4>Who is working</h4>${prod.map(m=>`<div class="row" style="margin:3px 0"><span class="dot" style="background:${m.broken?'#ef476f':m.worker?(m.running?'#2ec27e':'#f6b93b'):'#9aa3b5'}"></span><span style="flex:1">${esc(m.name)}</span><span class="mut">${m.broken?'broken':m.worker?(m.running?'running':'waiting'):'no operator'}</span></div>`).join('')||'<div class="mut">No production machines yet.</div>'}</div>`;if(sb==='org'){const pp=orgBuild(),t=orgTotals(pp),C=COUNTRIES[orgState().country];h+=`<div class="card"><h4>Organisation chart</h4><div class="mut">${pp.length} staff and managers above ${G.workers} operators · names and pay typical for ${C.n}.</div><div class="kpis" style="margin-top:8px"><div class="kpi"><span>Staff payroll</span><b>${orgMoney(t.staff)}/mo</b></div><div class="kpi"><span>All payroll</span><b>${orgMoney(t.all)}/mo</b></div></div><div class="row"><button class="btn green sm" data-u="org">🏢 Open organisation chart</button></div></div>`+pp.slice(0,6).map(p=>`<div class="row" style="margin:4px 0"><span class="dot" style="background:${ORGC[p.grp]}"></span><span style="flex:1"><b>${esc(p.name)}</b> · ${esc(p.title)}</span><span class="mut">${orgMoney(p.usd)}</span></div>`).join('')}if(sb==='rk')h+=riskHTML();if(sb==='sh')h+=shiftHTML();if(sb==='un')h+=`<div class="card"><h4>Uniforms</h4><div class="row">${Object.values(UNI).map(u=>`<span class="stk"><span class="dot" style="background:#${u[1].toString(16).padStart(6,'0')}"></span>${u[0]}</span>`).join('')}</div></div>`}
 else if(k==='rules'&&sb==='st'){h+=econHTML()+settingsHTML()}
 else if(k==='rules'){const c=G.cfg||{};h+=`<div class="kpis"><div class="kpi"><span>Trolley speed</span><b>${RULES.speed} m/s</b></div><div class="kpi"><span>Max trolley load</span><b>${RULES.maxLoad} kg</b></div><div class="kpi"><span>Month length</span><b>${MONTH} s</b></div><div class="kpi"><span>Breakdowns</span><b>${((G.brk!=null?G.brk:.025)*100).toFixed(1)}%/mo</b></div></div>`;
  RULES.text.forEach((r,i)=>h+=`<div class="card" style="animation-delay:${i*35}ms"><h4>${esc(r[0])}</h4>${esc(r[1])}<div class="mut">Where: ${esc(r[2])}</div></div>`);
  (c.rules||[]).forEach(r=>h+=`<div class="card" style="border-color:#c5a8ff"><h4>${esc(r[0])} <span class="mut">· from your sheet</span></h4>${esc(r[1])}${r[2]?`<div class="mut">${esc(r[2])}</div>`:''}</div>`)}
 else if(k==='goals'){const s=scn(G.scenario);h+=`<div class="card"><div class="row" style="margin:0;gap:12px"><svg viewBox="0 0 64 64" style="width:56px;height:56px;flex:none"><use href="#${s.icon}"/></svg><div><h4 style="font-size:20px">${s.name}</h4><div class="mut">${s.desc}</div></div></div></div>`;
  if(!s.goals.length)h+='<div class="card"><h4>No goals in free play</h4><div class="mut">Build, expand and enjoy. Every scenario is available from New game.</div></div>';
  else{const left=s.months?s.months-G.month:null;h+=`<div class="kpis"><div class="kpi"><span>Time left</span><b>${left==null?'∞':Math.max(0,left)+' months'}</b></div>${s.loseCash!=null?`<div class="kpi"><span>Bankrupt below</span><b class="down">${short(s.loseCash)}</b></div>`:''}<div class="kpi"><span>Status</span><b>${G.scenarioDone?'🏆 Won':'In progress'}</b></div></div>`;
   s.goals.forEach(g=>{const v=goalValue(g.k),pct=Math.max(0,Math.min(100,v/g.n*100));h+=`<div class="card"><h4>${pct>=100?'✅ ':''}${g.label}</h4><div class="mut">${g.k==='cash'||g.k==='revenue'?money(v):Math.round(v)} of ${g.k==='cash'||g.k==='revenue'?money(g.n):g.n}</div><div class="bar2${pct>=100?' done':''}"><i style="width:${pct}%"></i></div></div>`})}}
 else if(k==='prod'){h+=sb==='trl'?troHTML():sb==='skl'?sklHTML():sb==='fab'?fabHTML():capHTML()}
 else if(k==='views'&&sb==='dsp'){h+=displayHTML()}
 else if(k==='views'){h+='<div class="grid">'+VIEWS.map((v,i)=>`<button class="mc" data-u="view" data-k="${i}" style="animation-delay:${i*30}ms"><b>${v[0]}</b><span class="rec">${esc(v[5].slice(0,110))}${v[5].length>110?'…':''}</span></button>`).join('')+'</div>'}
 if(tc._h===h)return;const fresh=tc._k!==k+'|'+sb;tc._h=h;tc._k=k+'|'+sb;const st=tc.scrollTop;tc.innerHTML=h;tc.scrollTop=fresh?0:st;
 if(fresh){tc.classList.add('fresh');clearTimeout(tc._ft);tc._ft=setTimeout(()=>tc.classList.remove('fresh'),900)}};
$('tc').addEventListener('input',e=>{const r=e.target;if(!r.dataset||!r.dataset.set)return;const v=+r.value,k=r.dataset.set;const c=G.cfg=G.cfg||{};
 if(k==='speed'){c.speed=v;RULES.speed=v;for(const L in LOOPS)LOOPS[L].sp=v}if(k==='maxLoad'){c.maxLoad=v;RULES.maxLoad=v}if(k==='month'){c.month=v;MONTH=v}if(k==='brk'){c.brk=v;G.brk=v/100}if(k==='wage'){c.wage=v;G.wage=v}if(k==='day'){c.day=v;DN.len=v}
 const o=r.parentElement.querySelector('b');if(o)o.textContent=SETF[k](v)});
$('tc').addEventListener('click',e=>{const b=e.target.closest('button');if(!b||b.disabled)return;
 if(b.dataset.u==='cat'){UIS.cat=b.dataset.k;renderTab()}
 if(b.dataset.u==='sub'){UIS.sub[UIS.panel]=b.dataset.k;renderTab()}
 if(b.dataset.u==='tod'){const v=b.dataset.k;if(v==='auto')DN.lock=null;else DN.lock=+v;renderTab()}
 if(b.dataset.rk){const r=riskS();r[b.dataset.rk]=+b.dataset.rv;const L=b.dataset.rk==='maint'?MAINT:SEC;toast((b.dataset.rk==='maint'?'🛠 ':'🛡 ')+L[+b.dataset.rv][0]+(L[+b.dataset.rv][2]?' — '+money(L[+b.dataset.rv][2])+'/mo':''));renderTab()}
 if(b.dataset.tr){const m=machines.find(q=>q.id===+b.dataset.tr);if(m)train(m)}
 if(b.dataset.up){const m=machines.find(q=>q.id===+b.dataset.up);if(m&&m.level<3){const c=upCost(m);if(G.money>=c){G.money-=c;book('upgrade',-c);m.level++;toast('⬆ '+m.name+' upgraded to level '+m.level);renderTab()}}}
 if(b.dataset.tb){const k=b.dataset.tb,c=TRO[k].cost;if(G.money>=c){G.money-=c;book('capex',-c);fleet()[k]++;syncTrolleys(true);toast('🛒 '+TRO[k].n+' bought ('+fleet()[k]+')');renderTab()}}
 if(b.dataset.ts){const k=b.dataset.ts,v=TRO[k].cost*.4;fleet()[k]--;G.money+=v;book('msale',v);syncTrolleys(true);renderTab()}
 if(b.dataset.to){const o=TOPT.find(x=>x[0]===b.dataset.to);if(G.money>=o[3]){G.money-=o[3];book('upgrade',-o[3]);fleet().opt[o[0]]=1;toast('⚙ '+o[1]+' installed');renderTab()}}
 if(b.dataset.fab){G.fab=b.dataset.fab;toast('🧵 Now running '+fabric().n+' ('+fabric().gsm+' gsm)');renderTab()}
 if(b.dataset.u==='org'){openOrg()}
 if(b.dataset.u==='rev'){openRevenue()}
 if(b.dataset.c){runConsult(b.dataset.c,$('tc'))}
 if(b.dataset.ap){applyRec(+b.dataset.ap)}
 if(b.dataset.u==='stm'){openStatements(b.dataset.k)}
 if(b.dataset.u==='ns'){setNight(!G.nightShift);renderTab()}
 if(b.dataset.u==='skip'){skipNight()}
 if(b.dataset.u==='view'){go(+b.dataset.k);closePanel()}
 if(b.dataset.a==='tool'&&tool)setTimeout(closePanel,60);
 if(b.dataset.a==='res')setTimeout(()=>{banner('Research complete','new machines unlocked');confettiSmall(b)},50)});
function confettiSmall(el){const r=el.getBoundingClientRect();for(let i=0;i<12;i++)popAt(r.left+r.width/2+(Math.random()-.5)*80,r.top+(Math.random()-.5)*30,['✨','🎉','⭐'][i%3],'pop')}
window.refreshInfo=function(){const box=$('info'),h=box.querySelector('h2'),p=box.querySelector('p');
 if(tool){const d=DEF[tool];h.textContent='Placing: '+d.name;p.textContent='Click a green spot in '+(ZONES[d.zone]?ZONES[d.zone].name:'any department')+'. R rotates · Esc cancels · right-click stops placing.';box.classList.remove('quiet')}
 else if(sel){h.textContent=sel.def.icon+' '+sel.name;const r=ratedNow(sel);p.textContent=(r?r[0].toFixed(r[0]<20?1:0)+' '+r[1]+' · ':'')+(sel.def.time?capDay(sel).toFixed(1)+' lots/day · ':'')+(sel.def.util?'':'operator '+SKL[skillOf(sel)]+' ★'+skillOf(sel)+' · ')+sel.def.desc;box.classList.remove('quiet')}
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
  </div><div class="row" style="margin-top:14px"><label class="tog" style="flex:1">High-quality rendering <input type="checkbox" id="optHQ" ${useFX?'checked':''}></label><label class="tog" style="flex:1">🎓 Tutorial <input type="checkbox" ${CO.on?'checked':''} onchange="window.setTutorial(this.checked)"></label><label class="tog" style="flex:1">Machine labels <input type="checkbox" id="optLb" ${showLabels?'checked':''}></label></div></div>`);
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
   <div class="fld"><label>Country (staff names &amp; salaries)</label><select id="wCountry" style="font:700 15px var(--body);border:2px solid var(--line);border-radius:12px;padding:8px">${Object.entries(COUNTRIES).map(([k,c])=>`<option value="${k}" ${k===(WZ.country||'IN')?'selected':''}>${c.n}</option>`).join('')}</select></div>
   <div class="fld"><label>Show money in</label><select id="wCur" style="font:700 15px var(--body);border:2px solid var(--line);border-radius:12px;padding:8px"><option value="local" ${WZ.cur!=='usd'?'selected':''}>${COUNTRIES[WZ.country||'IN'].cur} (local)</option><option value="usd" ${WZ.cur==='usd'?'selected':''}>US dollars</option></select><button class="btn ghost sm" id="wTypW" style="margin-top:6px">Typical operator wage in ${COUNTRIES[WZ.country||'IN'].n}: $${COUNTRIES[WZ.country||'IN'].op}/mo</button></div>
   <div class="fld"><label>Fabric programme</label><select id="wFab" style="font:700 15px var(--body);border:2px solid var(--line);border-radius:12px;padding:8px">${Object.entries(FABRICS).map(([k,f])=>`<option value="${k}" ${k===(WZ.fab||'medium')?'selected':''}>${f.n} · ${f.gsm} gsm</option>`).join('')}</select></div>
   ${rng('cash','Starting cash',-50000,400000,5000,v=>money(v))}
   ${rng('operators','Operators (labour)',0,60,1,v=>v+' <span class="mut">· '+prod+' machines need one</span>')}
   ${rng('wage','Wage per operator',300,1500,50,v=>money(v)+'/mo')}
   ${rng('month','Month length',20,180,10,v=>v+' s')}
   ${rng('day','Plant day length',16,180,4,v=>v+' s · night 22:00–06:00')}
   ${rng('speed','Trolley speed',.6,2,.1,v=>(+v).toFixed(1)+' m/s')}
   ${rng('maxLoad','Max trolley load (1 pusher)',150,300,10,v=>v+' kg')}
   ${rng('brk','Breakdown chance',0,10,.5,v=>(+v).toFixed(1)+'% a month')}
   <div class="fld"><label>Utilities</label><div class="tog">Steam boiler (+15% speed) <input type="checkbox" data-t="boiler" ${WZ.boiler?'checked':''}></div><div class="tog">Fabric inspection / QC <input type="checkbox" data-t="qc" ${WZ.qc?'checked':''}></div><div class="tog">ETP researched &amp; built <input type="checkbox" data-t="etp" ${WZ.etp?'checked':''}></div><div class="tog">Night shift from day 1 <input type="checkbox" data-t="night" ${WZ.night?'checked':''}></div><div class="tog">🎓 Tutorial arrows when stuck <input type="checkbox" id="wTut" ${CO.on?'checked':''} onchange="window.setTutorial(this.checked)"></div></div>
  </div><div class="card" style="margin-top:12px"><h4>Working rules</h4><div class="mut">One-way trolley loops at ${(+WZ.speed).toFixed(1)} m/s · one pusher per trolley, total load within ${WZ.maxLoad} kg · lanes kept clear · each production machine needs an operator${WZ.rules.length?' · plus '+WZ.rules.length+' rules from your sheet':''}.</div></div>`}
 const o=modal(`<header>${ico('i-new')}<h2>New game</h2><div class="steps">${steps}</div>${UIS.inGame?'<button class="x" data-w="x">✕</button>':''}</header><div class="mb">${body}</div>
  <footer>${st>1?'<button class="btn ghost" data-w="back">← Back</button>':(UIS.inGame?'':'<button class="btn ghost" data-w="menu">← Menu</button>')}<span class="spacer" style="flex:1"></span><span class="mut">${esc(s.name)} · ${esc(WZ.custom?WZ.custom.name:LAYOUTS[WZ.layout].name)}</span>${st<3?'<button class="btn gold" data-w="next">Next →</button>':'<button class="btn green" data-w="go">▶ Start game</button>'}</footer>`,'wiz');
 o.querySelectorAll('input[type=range]').forEach(r=>r.oninput=()=>{WZ[r.dataset.r]=+r.value;r.parentElement.querySelector('b').innerHTML=r._fmt(r.value)});
 o.querySelectorAll('input[type=range]').forEach(r=>{const f=RF[r.dataset.r];r._fmt=f});
 o.querySelectorAll('[data-t]').forEach(c=>c.onchange=()=>WZ[c.dataset.t]=c.checked);
 const wf=o.querySelector('#wFab');if(wf)wf.onchange=()=>WZ.fab=wf.value;
 const wc=o.querySelector('#wCountry');if(wc)wc.onchange=()=>{WZ.country=wc.value;renderWizard()};const wcu=o.querySelector('#wCur');if(wcu)wcu.onchange=()=>WZ.cur=wcu.value;const wtw=o.querySelector('#wTypW');if(wtw)wtw.onclick=()=>{WZ.wage=COUNTRIES[WZ.country||'IN'].op;renderWizard()};
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
  for(const s in S2){const v=String(S2[s]).toLowerCase();if(s.includes('boiler'))WZ.boiler=v==='yes'||v==='true'||v==='1';if(s.includes('qc')||s.includes('inspection'))WZ.qc=v==='yes'||v==='true'||v==='1';if(s.includes('etp'))WZ.etp=v==='yes'||v==='true'||v==='1';if(s==='plant name'||s==='name')WZ.name=S2[s];if(s.includes('country')){const v=String(S2[s]).toLowerCase();const k=Object.keys(COUNTRIES).find(k=>k.toLowerCase()===v||COUNTRIES[k].n.toLowerCase()===v);if(k)WZ.country=k}}
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
 G.workers=c.operators;G.nightShift=!!c.night;G.fab=c.fab||'medium';G.tro={batch:12,drum:4,opt:{},hist:[]};G.org={country:c.country||'IN'};G.econ=econDefaults(c.country||'IN');G.econ.cur=c.cur==='usd'?'usd':'local';G.tod=0;if(s.broken){machines.filter(m=>!m.def.util).slice(0,s.broken).forEach(m=>m.broken=true)}
 syncTrolleys();newOrder();newOrder();G.fin=null;finState();UIS.rep=null;UIS.cashShown=G.money;UIS.slot=null;enterGame();go(0);
 banner('Welcome to '+G.plantName,s.name);if(skipped)toast('⚠️ '+skipped+' machines did not fit and were left out');
 if(s.goals.length)setTimeout(()=>togglePanel('goals'),900)}
function enterGame(){UIS.inGame=true;window.menuOrbit=false;G.paused=false;if(!G.speed)G.speed=1;['chip','bar','z','info','dock','status','clock','tutBtn','ncB'].forEach(id=>$(id)&&$(id).classList.remove('hidden'));closeModal();renderDock();refreshStats();renderTab();if(UIS.panel)renderTab()}
function exitGame(){UIS.inGame=false;closePanel();select(null);if(tool)setTool(null);['chip','bar','z','info','dock','status','clock','tutBtn','ncB','ncP'].forEach(id=>$(id)&&$(id).classList.add('hidden'))}

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
window.onFrame=function(rdt,gdt){if(!G)return;G.tod=(G.tod||0)+gdt;if(UIS.inGame){const dn=Math.floor((G.tod+DN.len*.25)/DN.len);if(G.dayIdx==null)G.dayIdx=dn;else if(dn>G.dayIdx){G.dayIdx=dn;finDay()}}const h=hourNow();
 window.shiftRate=isNight(((G.tod||0)/DN.len*24+6)%24)?(G.nightShift?.9:.35):1;applyLight(UIS.inGame?h:15);
 if(UIS.inGame&&performance.now()-(DN.lastC||0)>250){DN.lastC=performance.now();refreshClock();const wasN=DN.wasN,nowN=isNight(((G.tod||0)/DN.len*24+6)%24);if(wasN!=null&&wasN!==nowN&&DN.lock==null)banner(nowN?'Night falls':'Sunrise',nowN?(G.nightShift?'night shift takes over':'skeleton crew · 35% output'):'day shift starts');DN.wasN=nowN}};
$('cNight').onclick=()=>setNight(!G.nightShift);$('cSkip').onclick=skipNight;


// ---------------------------------------------------------------------
// TUTORIAL COACH — when switched on, watches the plant and, whenever it is
// stuck, points with an arrow at the exact button (or machine) to press next.
// It traces a waiting machine back through the process chain to the root cause.
// ---------------------------------------------------------------------
const CO={on:(()=>{try{const v=localStorage.getItem('tt3d_tutorial');return v==null?true:v==='1'}catch(e){return true}})(),snooze:{},key:''};
window.setTutorial=on=>setTutorial(on);function setTutorial(on){CO.on=on;try{localStorage.setItem('tt3d_tutorial',on?'1':'0')}catch(e){}const b=$('tutBtn');if(b){b.classList.toggle('on',on);b.querySelector('span').textContent=on?'Tutorial on':'Tutorial off'}
 if(!on)hideCoach();toast(on?'🎓 Tutorial on — follow the arrow whenever the plant gets stuck':'🎓 Tutorial off')}
function needOf(m){for(const k in m.def.need)if(G.inv[k]<m.def.need[k])return k;return null}
const producers=k=>machines.filter(m=>m.def.out&&m.def.out[k]);
const typesMaking=k=>Object.keys(DEF).filter(t=>DEF[t].out&&DEF[t].out[k]).sort((a,b)=>(unlocked(b)-unlocked(a))||DEF[a].cost-DEF[b].cost);
const isProd=m=>!m.def.util&&m.def.need;
// find what is really holding a material back
function rootCause(k,seen){seen=seen||{};if(seen[k])return null;seen[k]=1;
 if(k==='greige')return{kind:'buy'};
 const ps=producers(k);if(!ps.length){const t=typesMaking(k)[0];return t?{kind:'build',type:t,mat:k}:null}
 if(ps.some(m=>m.running))return null;                       // being made, just wait
 const br=ps.find(m=>m.broken);if(br)return{kind:'repair',m:br};
 const idle=ps.find(m=>!m.worker);if(idle)return{kind:'hire',m:idle};
 for(const m of ps){const n=needOf(m);if(n){const r=rootCause(n,seen);if(r)return r}}return null}
// route a target through dock → submenu → button
function via(panel,sub,sel,title,text){if(UIS.panel!==panel)return{el:document.querySelector('.dk[data-p='+panel+']'),title,text:'Open '+PANEL_META[panel][1]+'. '+text};
 if(sub&&subOf(panel)!==sub){const b=document.querySelector('.sub button[data-k='+sub+']');return{el:b,title,text:'Open the “'+(b?b.textContent:sub)+'” tab. '+text}}
 const el=document.querySelector('#tc '+sel);return el?{el,title,text}:null}
function atMachine(m,title,text,then){if(sel===m&&then){const el=document.querySelector(then);if(el)return{el,title,text:'Press this button.'}}return{pt:new THREE.Vector3(m.x,(m.def.h||4)+.5,m.z),title,text:'Click the '+m.name+'. '+text}}
function money4(cost,step){if(G.money>=cost)return step();if(G.loan<100000)return via('finance','ln','[data-a=borrow]','Not enough cash','Borrow from the bank to pay for it.');return via('finance','mk','[data-a=spot]:not([disabled])','Raise cash','Sell finished fabric on the spot market.')}
function diagnose(){
 const br=machines.find(m=>m.broken);if(br)return money4(repCost(br),()=>atMachine(br,'A machine has broken down',br.name+' is stopped. Repair it in its panel.','#peRp'));
 const ok=G.orders.find(o=>G.inv[o.type]>=o.qty);if(ok)return via('orders',null,'[data-a=deliver][data-k="'+ok.id+'"]','An order is ready','You have enough fabric for order #'+ok.id+' — deliver it for '+money(ok.reward)+'.');
 const need=machines.filter(m=>!m.def.util).length;if(G.workers<need)return money4(1500,()=>via('staff','op','[data-a=hire]','Machines without operators',(need-G.workers)+' machine'+(need-G.workers>1?'s have':' has')+' nobody to run '+(need-G.workers>1?'them':'it')+'. Hire an operator.'));
 // a machine waiting for input
 {const st=machines.find(m=>m.status==='Waiting for a free trolley');if(st)return money4(TRO.batch.cost,()=>via('prod','trl','[data-tb=batch]','No free trolleys',st.name+' cannot unload: every trolley is holding fabric. Buy more batch trolleys.'))}
 const waiting=machines.filter(m=>isProd(m)&&!m.running&&m.worker&&!m.broken&&needOf(m));
 const stent=machines.find(m=>m.def.stenter&&!m.running&&G.inv.dyed<1&&G.inv.printed<1);
 const tries=waiting.map(m=>[m,needOf(m)]);if(stent)tries.push([stent,'dyed']);
 for(const[m,k]of tries){const r=rootCause(k);if(!r)continue;const why=m.name+' is waiting for '+MAT[k].toLowerCase()+'. ';
  if(r.kind==='buy')return money4(G.greige*10,()=>via('finance','mk','[data-a=buy][data-k="10"]','The plant has run out of greige',why+'Everything starts from greige (raw fabric). Buy 10 lots.'));
  if(r.kind==='repair')return money4(repCost(r.m),()=>atMachine(r.m,'Broken machine in the chain',why+'It is held up because '+r.m.name+' is broken.','#peRp'));
  if(r.kind==='hire')return money4(1500,()=>via('staff','op','[data-a=hire]','Operator needed',why+r.m.name+' has nobody to run it.'));
  if(r.kind==='build'){const t=r.type,d=DEF[t];if(!unlocked(t)){const rs=RESEARCH.find(x=>x.id===d.research);return money4(rs.cost,()=>via('research',null,'[data-a=res][data-k="'+rs.id+'"]','Research needed',why+'No machine makes '+MAT[r.mat].toLowerCase()+' yet. Research '+rs.name+' first.'))}
   if(tool===t){const sp=autoSpot(t,machines.map(q=>[q.type,q.x,q.z,q.rot]));if(sp)return{pt:new THREE.Vector3(sp[0],.3,sp[1]),title:'Place the '+d.name,text:'Click this green spot to build it.'}}
   return money4(d.cost,()=>{if(UIS.panel==='build'&&UIS.cat!=='all'&&UIS.cat!==d.zone){const c=document.querySelector('#tc [data-u=cat][data-k="'+d.zone+'"]');if(c)return{el:c,title:'Build a '+d.name,text:'Show this department.'}}
    return via('build',null,'[data-a=tool][data-k="'+t+'"]','Missing machine',why+'Nothing in the plant makes '+MAT[r.mat].toLowerCase()+'. Build a '+d.name+'.')})}}
 if(G.money<0&&G.loan<100000)return via('finance','ln','[data-a=borrow]','Cash is below zero','Borrow to keep paying wages while orders come in.');
 const fin=Math.floor(G.inv.fd+G.inv.fp);if(fin>=15&&!G.orders.some(o=>G.inv[o.type]>=1))return via('finance','mk','[data-a=spot]:not([disabled])','Stock is piling up','No order needs this fabric right now — sell some on the spot market.');
 return null}
function hideCoach(){const c=$('coach');if(c)c.classList.add('hidden');const r=$('coachRing');if(r)r.classList.add('hidden')}
function coachTick(){if(!CO.on||!UIS.inGame||$('ov')||$('menu')||!G){hideCoach();return}
 let h=null;try{h=diagnose()}catch(e){console.warn(e)}if(!h||(!h.el&&!h.pt)||CO.snooze[h.title]>performance.now()){hideCoach();return}
 let x,y,w,hh;if(h.el){const r=h.el.getBoundingClientRect();if(!r.width){hideCoach();return}if(h.el.closest('#tc')){const tc=$('tc'),tr=tc.getBoundingClientRect();if(r.top<tr.top||r.bottom>tr.bottom)h.el.scrollIntoView({block:'nearest',behavior:'smooth'})}x=r.left;y=r.top;w=r.width;hh=r.height}
 else{const p=project(h.pt);if(!p){hideCoach();return}x=p.x-30;y=p.y-30;w=60;hh=60}
 const ring=$('coachRing'),c=$('coach');ring.classList.remove('hidden');Object.assign(ring.style,{left:x-6+'px',top:y-6+'px',width:w+12+'px',height:hh+12+'px',borderRadius:h.pt?'50%':'18px'});
 c.classList.remove('hidden');c.querySelector('h5').textContent=h.title;c.querySelector('p').textContent=h.text;CO.cur=h.title;
 const below=y<190,cx=x+w/2;const arrow=c.querySelector('.ca');arrow.style.transform=below?'rotate(180deg)':'';
 const cw=c.offsetWidth,ch=c.offsetHeight;let left=Math.min(innerWidth-cw-10,Math.max(10,cx-cw/2));c.style.left=left+'px';c.style.top=(below?y+hh+12:y-ch-12)+'px';c.classList.toggle('below',below);
 arrow.style.left=(cx-left-17)+'px'}
function coachInit(){const b=document.createElement('button');b.id='tutBtn';b.className=(CO.on?'on ':'')+'hidden';b.title='Tutorial: arrows show what to do when the plant is stuck (T)';b.innerHTML='🎓 <span>'+(CO.on?'Tutorial on':'Tutorial off')+'</span>';b.onclick=()=>setTutorial(!CO.on);$('chip').after(b);
 const r=document.createElement('div');r.id='coachRing';r.className='hidden';document.body.appendChild(r);
 const c=document.createElement('div');c.id='coach';c.className='hidden';c.innerHTML='<div class="cb"><span class="cico">🎓</span><div><h5></h5><p></p></div></div><div class="cbt"><button data-c="later">Not now</button><button data-c="off">Turn tutorial off</button></div><svg class="ca" viewBox="0 0 34 40"><path d="M17 40 L2 20 H11 V0 H23 V20 H32 Z" fill="#f6b93b" stroke="#fff" stroke-width="2.5" stroke-linejoin="round"/></svg>';document.body.appendChild(c);
 c.onclick=e=>{const k=e.target.dataset&&e.target.dataset.c;if(k==='later'){CO.snooze[CO.cur]=performance.now()+45000;hideCoach()}if(k==='off')setTutorial(false)};
 setInterval(coachTick,350);addEventListener('resize',coachTick)}


// ---------------------------------------------------------------------
// ORGANISATION CHART — plant hierarchy with country-typical names and
// estimated salaries. Settings: country, currency, pay scale. Every person
// can be renamed, retitled or given a different salary; kept in the save.
// Salary figures are rough market estimates for a textile processing plant.
// ---------------------------------------------------------------------
const COUNTRIES={
 IN:{n:'India',cur:'INR',fx:84,op:180,f:1,m:['Rajesh','Amit','Suresh','Vikram','Arjun','Manoj','Ravi','Sanjay','Kiran','Deepak','Anil','Harish'],w:['Priya','Anjali','Neha','Kavita','Pooja','Sunita','Meera','Ritu','Asha','Divya'],l:['Patel','Shah','Sharma','Mehta','Desai','Iyer','Reddy','Joshi','Nair','Gupta','Verma','Kulkarni']},
 BD:{n:'Bangladesh',cur:'BDT',fx:120,op:125,f:1,m:['Rahim','Karim','Hasan','Rafiq','Tanvir','Imran','Sohel','Arif','Nazmul','Faruk'],w:['Nasrin','Shirin','Fatema','Rumana','Taslima','Sabina','Nusrat','Farzana'],l:['Hossain','Rahman','Islam','Ahmed','Chowdhury','Khan','Uddin','Sarker','Akter','Mia']},
 ET:{n:'Ethiopia',cur:'ETB',fx:125,op:70,f:1,m:['Abebe','Kebede','Tesfaye','Dawit','Yonas','Kibrom','Bekele','Getachew','Solomon','Henok'],w:['Almaz','Tigist','Selam','Hirut','Meron','Bethlehem','Mekdes','Liya'],l:['Gebreselassie','Tadesse','Haile','Alemu','Mengistu','Desta','Wolde','Bekele','Girma','Assefa']},
 PK:{n:'Pakistan',cur:'PKR',fx:280,op:135,f:1,m:['Ahmed','Bilal','Usman','Hamza','Faisal','Zeeshan','Kamran','Asif','Tariq','Imran'],w:['Ayesha','Sana','Hina','Mehwish','Fatima','Saba','Nida','Rabia'],l:['Khan','Malik','Qureshi','Butt','Sheikh','Chaudhry','Raza','Siddiqui','Mirza','Javed']},
 VN:{n:'Vietnam',cur:'VND',fx:25400,op:320,f:1,m:['Minh','Tuan','Hung','Duc','Quang','Thanh','Long','Hai','Nam','Phuc'],w:['Lan','Huong','Mai','Linh','Thu','Ngoc','Trang','Hoa'],l:['Nguyen','Tran','Le','Pham','Hoang','Vu','Dang','Bui','Do','Ngo']},
 ID:{n:'Indonesia',cur:'IDR',fx:16200,op:230,f:1,m:['Budi','Agus','Joko','Hendra','Rudi','Dedi','Eko','Bambang','Wahyu','Andi'],w:['Siti','Dewi','Sri','Ratna','Wulan','Indah','Putri','Lestari'],l:['Santoso','Wijaya','Susanto','Pratama','Hidayat','Saputra','Nugroho','Setiawan','Kurniawan','Halim']},
 CN:{n:'China',cur:'CNY',fx:7.2,op:700,f:.85,m:['Wei','Jun','Lei','Hao','Ming','Qiang','Yong','Jian','Tao','Bo'],w:['Fang','Li','Mei','Xiu','Yan','Jing','Hui','Ling'],l:['Wang','Li','Zhang','Liu','Chen','Yang','Huang','Zhao','Wu','Zhou']},
 TR:{n:'Türkiye',cur:'TRY',fx:41,op:650,f:.85,m:['Mehmet','Mustafa','Ahmet','Ali','Hüseyin','Emre','Murat','Burak','Kemal','Serkan'],w:['Ayşe','Fatma','Elif','Zeynep','Emine','Merve','Esra','Selin'],l:['Yılmaz','Kaya','Demir','Şahin','Çelik','Yıldız','Aydın','Öztürk','Arslan','Doğan']},
 EG:{n:'Egypt',cur:'EGP',fx:49,op:160,f:1,m:['Mohamed','Ahmed','Mahmoud','Mostafa','Omar','Karim','Tarek','Hassan','Youssef','Amr'],w:['Mona','Nour','Heba','Dina','Rania','Salma','Yasmin','Mariam'],l:['Hassan','Ibrahim','Mahmoud','Abdelrahman','Saleh','Fawzy','Mansour','Nasser','Gamal','Hamdy']},
 MX:{n:'Mexico',cur:'MXN',fx:18,op:480,f:.9,m:['José','Juan','Luis','Carlos','Miguel','Jorge','Alejandro','Fernando','Ricardo','Javier'],w:['María','Guadalupe','Lucía','Sofía','Ana','Verónica','Gabriela','Rosa'],l:['Hernández','García','Martínez','López','González','Pérez','Rodríguez','Sánchez','Ramírez','Torres']},
 BR:{n:'Brazil',cur:'BRL',fx:5.6,op:420,f:.9,m:['João','Pedro','Lucas','Gabriel','Rafael','Felipe','Bruno','Thiago','Rodrigo','Marcelo'],w:['Ana','Juliana','Fernanda','Camila','Mariana','Patrícia','Aline','Beatriz'],l:['Silva','Santos','Oliveira','Souza','Lima','Pereira','Costa','Ferreira','Almeida','Carvalho']},
 IT:{n:'Italy',cur:'EUR',fx:.93,op:2200,f:.5,m:['Marco','Luca','Giuseppe','Alessandro','Andrea','Matteo','Francesco','Stefano','Paolo','Davide'],w:['Giulia','Francesca','Chiara','Sara','Elena','Valentina','Martina','Laura'],l:['Rossi','Russo','Ferrari','Esposito','Bianchi','Romano','Colombo','Ricci','Marino','Greco']},
 DE:{n:'Germany',cur:'EUR',fx:.93,op:3000,f:.45,m:['Thomas','Michael','Andreas','Stefan','Markus','Jan','Tobias','Florian','Matthias','Klaus'],w:['Anna','Julia','Katrin','Sabine','Claudia','Lena','Laura','Nicole'],l:['Müller','Schmidt','Schneider','Fischer','Weber','Meyer','Wagner','Becker','Schulz','Hoffmann']},
 UK:{n:'United Kingdom',cur:'GBP',fx:.78,op:2500,f:.5,m:['James','Oliver','Harry','George','Jack','William','Thomas','Daniel','Samuel','Matthew'],w:['Emma','Olivia','Sophie','Charlotte','Emily','Hannah','Grace','Lucy'],l:['Smith','Jones','Taylor','Brown','Williams','Wilson','Johnson','Davies','Evans','Walker']},
 US:{n:'United States',cur:'USD',fx:1,op:3300,f:.5,m:['Michael','David','John','Robert','Chris','Daniel','Kevin','Brian','Jason','Ryan'],w:['Jennifer','Jessica','Sarah','Ashley','Emily','Megan','Lauren','Amanda'],l:['Smith','Johnson','Williams','Brown','Jones','Miller','Davis','Garcia','Wilson','Moore']}};
const ORGC={exec:'#7b5cff',prod:'#14b8a6',prep:'#f59e0b',dye:'#3b82f6',print:'#ec4899',fin:'#10b981',maint:'#64748b',sup:'#f97316'};
// role: [id,title,multiple of operator pay,colour group,parent]
function orgRoles(){const has=t=>machines.some(m=>m.type===t),any=ts=>ts.some(has);const R=[
 ['gm','Plant Director',18,'exec',null],
 ['pm','Production Manager',9,'prod','gm'],
 ['mm','Maintenance Manager',7,'maint','gm'],
 ['sm','Sales & Merchandising Manager',8,'sup','gm'],
 ['hr','HR & Admin Manager',6,'sup','gm'],
 ['fm','Finance & Accounts Manager',7,'sup','gm']];
 if(any(['desize','bleach']))R.push(['prepH','Preparatory In-charge',4,'prep','pm']);
 if(any(['jet','jigger','station','chem'])){R.push(['dyeM','Dyeing Manager',6,'dye','pm'],['dyeMaster','Dyeing Master',3.5,'dye','dyeM'],['lab','Lab & Colour-matching Chemist',3.2,'dye','dyeM'])}
 if(any(['baby','rotary','flatbed','digital','kitchen','autokit','coater','laser'])){R.push(['prM','Printing Manager',6,'print','pm']);if(any(['kitchen','autokit']))R.push(['ck','Colour Kitchen In-charge',3,'print','prM']);if(any(['coater','laser']))R.push(['eng','Screen Engraving In-charge',3,'print','prM']);R.push(['prMaster','Printing Master',3.5,'print','prM'])}
 if(any(['stenter','qc'])){R.push(['finH','Finishing In-charge',4,'fin','pm']);if(has('qc'))R.push(['qcH','Quality & Inspection Head',3.5,'fin','finH'])}
 R.push(['mech','Mechanical Engineer',3.2,'maint','mm'],['elec','Electrical Engineer',3.2,'maint','mm']);if(any(['boiler','etp']))R.push(['util','Utilities In-charge (boiler, ETP)',2.8,'maint','mm']);
 R.push(['exp','Export Merchandiser',3,'sup','sm']);return R}
// operators by department, from the real plant
function orgCrews(){const D={prepH:['desize','bleach'],dyeMaster:['jet','jigger'],lab:['station','chem'],ck:['kitchen','autokit'],eng:['coater','laser'],prMaster:['baby','rotary','flatbed','digital'],finH:['stenter'],qcH:['qc']};const out={};
 for(const k in D){const n=machines.filter(m=>D[k].includes(m.type)).length;if(n)out[k]=n}return out}
function seedRng(seed){let x=seed>>>0||1;return()=>{x^=x<<13;x^=x>>>17;x^=x<<5;return(x>>>0)/4294967296}}
function orgState(){const o=G.org=G.org||{};if(G.econ)o.country=G.econ.country;if(!o.country)o.country=(G.cfg&&G.cfg.country)||'IN';if(o.scale==null)o.scale=100;if(!o.cur)o.cur='local';if(!o.seed)o.seed=(Math.random()*1e9)|0;o.edits=o.edits||{};return o}
function orgBuild(){const o=orgState(),C=COUNTRIES[o.country],r=seedRng(o.seed+o.country.charCodeAt(0)*31),used=new Set();
 const name=()=>{for(let i=0;i<30;i++){const fem=r()<.32,f=(fem?C.w:C.m)[r()*(fem?C.w:C.m).length|0],l=C.l[r()*C.l.length|0],n=f+' '+l;if(!used.has(n)){used.add(n);return n}}return 'New hire'};
 const people=orgRoles().map(([id,t,mult,grp,par])=>{const eff=1+(mult-1)*C.f;const base=C.op*eff*o.scale/100,e=o.edits[id]||{};return{id,title:e.title||t,name:e.name||name(),usd:e.usd!=null?e.usd:Math.round(base*(0.92+r()*.16)),grp,par,edited:!!(e.name||e.title||e.usd!=null)}});
 const crews=orgCrews();for(const k in crews){const p=people.find(x=>x.id===k);if(p)p.crew=crews[k]}return people}
function orgMoney(usd){const o=orgState(),C=COUNTRIES[o.country];if(o.cur==='usd')return '$'+Math.round(usd).toLocaleString('en-US');const v=usd*C.fx;
 const s=v>=1e7?(v/1e6).toFixed(1)+'M':v>=1e5&&C.fx>1000?(v/1e6).toFixed(2)+'M':Math.round(v).toLocaleString('en-US');return C.cur+' '+s}
function orgTotals(people){const o=orgState(),C=COUNTRIES[o.country];const staff=people.reduce((a,p)=>a+p.usd,0);const ops=G.workers*C.op*o.scale/100;return{staff,ops,all:staff+ops}}
function openOrg(){const o=orgState(),people=orgBuild(),tot=orgTotals(people),C=COUNTRIES[o.country];
 const kids=id=>people.filter(p=>p.par===id);
 const card=p=>{const ini=p.name.split(' ').map(x=>x[0]).slice(0,2).join('');return `<div class="oc${p.edited?' ed':''}" data-o="${p.id}" style="--c:${ORGC[p.grp]}"><i class="av">${esc(ini)}</i><b>${esc(p.name)}</b><span>${esc(p.title)}</span><em>${orgMoney(p.usd)}<small>/mo</small></em>${p.crew?`<u>👷 ${p.crew} machine${p.crew>1?'s':''} · ${p.crew} operator${p.crew>1?'s':''}</u>`:''}</div>`};
 const tree=p=>{const k=kids(p.id);return `<li>${card(p)}${k.length?'<ul>'+k.map(tree).join('')+'</ul>':''}</li>`};
 const md=modal(`<header>${ico('i-staff')}<h2>Organisation chart</h2><div class="steps" style="gap:6px"><span class="goal" style="margin:0">${esc(G.plantName||'Plant')} · ${C.n}</span></div><button class="x" data-g="x">✕</button></header>
  <div class="mb"><div class="orgset">
   <label>Country <select id="oCountry">${Object.entries(COUNTRIES).map(([k,c])=>`<option value="${k}" ${k===o.country?'selected':''}>${c.n}</option>`).join('')}</select></label>
   <label>Show salaries in <select id="oCur"><option value="local" ${o.cur==='local'?'selected':''}>${C.cur} (local)</option><option value="usd" ${o.cur==='usd'?'selected':''}>US dollars</option></select></label>
   <label>Pay level <input type="range" id="oScale" min="60" max="160" step="5" value="${o.scale}"><b>${o.scale}%</b></label>
   <button class="btn ghost sm" data-g="names">🎲 New names</button><button class="btn ghost sm" data-g="reset">↺ Reset my edits</button><button class="btn ghost sm" data-g="csv">⬇ Export CSV</button></div>
   <div class="kpis"><div class="kpi"><span>Staff & managers</span><b>${people.length}</b></div><div class="kpi"><span>Operators</span><b>${G.workers}</b></div><div class="kpi"><span>Staff payroll / month</span><b>${orgMoney(tot.staff)}</b></div><div class="kpi"><span>Operator payroll / month</span><b>${orgMoney(tot.ops)}</b></div><div class="kpi"><span>Total / year</span><b>${orgMoney(tot.all*12)}</b></div></div>
   <div class="orgwrap"><ul class="org">${tree(people.find(p=>p.id==='gm'))}</ul></div>
   <div class="mut" style="margin-top:8px">Click anyone to change their name, title or salary. Names are typical for ${C.n}; salaries are rough monthly estimates for a textile processing plant there (operator ≈ ${orgMoney(C.op*o.scale/100)}), not quotes. The departments follow the machines in your plant.</div></div>`,'wiz');
 {const ow=md.querySelector('.orgwrap');requestAnimationFrame(()=>{ow.scrollLeft=(ow.scrollWidth-ow.clientWidth)/2})}
 md.querySelector('#oCountry').onchange=e=>{setCountry(e.target.value);openOrg()};md.querySelector('#oCur').onchange=e=>{o.cur=e.target.value;econ().cur=e.target.value==='usd'?'usd':'local';refreshStats();openOrg()};
 const sc=md.querySelector('#oScale');sc.oninput=()=>sc.nextElementSibling.textContent=sc.value+'%';sc.onchange=()=>{o.scale=+sc.value;openOrg()};
 md.onclick=e=>{const g=e.target.closest('[data-g]');if(g){const k=g.dataset.g;if(k==='x')closeModal();if(k==='names'){o.seed=(Math.random()*1e9)|0;openOrg()}if(k==='reset'){o.edits={};openOrg()}
   if(k==='csv'){const rows=[['Name','Title','Reports to','Monthly salary (USD)','Monthly salary ('+C.cur+')','Operators']].concat(people.map(p=>[p.name,p.title,(people.find(q=>q.id===p.par)||{}).name||'',p.usd,Math.round(p.usd*C.fx),p.crew||'']));
    const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([rows.map(r=>r.map(v=>'"'+String(v).replace(/"/g,'""')+'"').join(',')).join('\n')],{type:'text/csv'}));a.download='organisation-chart.csv';a.click()}return}
  const c=e.target.closest('[data-o]');if(c)editPerson(people.find(p=>p.id===c.dataset.o))}}
function editPerson(p){const o=orgState(),C=COUNTRIES[o.country],loc=o.cur!=='usd';
 const md=modal(`<header>${ico('i-staff')}<h2>Edit ${esc(p.title)}</h2><button class="x" data-g="back">✕</button></header><div class="mb"><div class="form" style="grid-template-columns:1fr">
  <div class="fld"><label>Name</label><input type="text" id="pN" value="${esc(p.name)}"></div><div class="fld"><label>Title</label><input type="text" id="pT" value="${esc(p.title)}"></div>
  <div class="fld"><label>Monthly salary (${loc?C.cur:'USD'})</label><input type="text" id="pS" value="${Math.round(loc?p.usd*C.fx:p.usd)}"></div></div></div>
  <footer><button class="btn ghost" data-g="back">← Back</button><span style="flex:1"></span><button class="btn ghost" data-g="undo">Use generated values</button><button class="btn green" data-g="ok">Save</button></footer>`);
 md.onclick=e=>{const g=e.target.closest('[data-g]');if(!g)return;const k=g.dataset.g;
  if(k==='ok'){const v=parseFloat(String($('pS').value).replace(/[^\d.]/g,''));o.edits[p.id]={name:$('pN').value.trim()||p.name,title:$('pT').value.trim()||p.title,usd:isFinite(v)?Math.round(loc?v/C.fx:v):p.usd};toast('👤 '+o.edits[p.id].name+' updated')}
  if(k==='undo')delete o.edits[p.id];openOrg()}}


// ---------------------------------------------------------------------
// MACHINE STATUS ICONS + ALWAYS-ON ALERTS PANEL
// 🔧 broken · 💤 idle (waiting for input) · 👷 no operator · 📦 goods ready to deliver
// ---------------------------------------------------------------------
const ST={els:{},open:true};
function mState(m){if(m.broken)return['brk','🔧','Breakdown','Needs repair'];if(m.def.util)return null;
 if(!m.worker)return['ops','👷','No operator','Hire an operator'];
 if(m.def.stenter||m.type==='qc'){const o=G.orders.find(o=>G.inv[o.type]>=o.qty);if(o)return['rdy','📦','Goods ready','Order #'+o.id+' can be delivered']}
 if(!m.running){const k=typeof needOf==='function'?needOf(m):null;return['idle','💤','Idle',k?'Waiting for '+MAT[k].toLowerCase():(m.status||'Waiting')]}return null}
function statusTick(){const lay=$('mstat');if(!UIS.inGame){lay.innerHTML='';ST.els={};$('alerts').classList.add('hidden');return}
 const seen={},list=[];for(const m of machines){const s=mState(m);if(!s)continue;seen[m.id]=1;list.push([m,s]);let el=ST.els[m.id];
  if(!el){el=document.createElement('div');el.onclick=()=>{select(m);goal.t.set(m.x,1.5,m.z)};lay.appendChild(el);ST.els[m.id]=el}
  if(el._k!==s[0]){el._k=s[0];el.className='mi '+s[0];el.innerHTML=s[1];el.title=m.name+' — '+s[2]+': '+s[3]}
  const p=project(new THREE.Vector3(m.x,(m.def.h||4)+3.2,m.z));if(!p||p.x<-40||p.y<-40||p.x>innerWidth+40||p.y>innerHeight){el.style.display='none'}else{el.style.display='';el.style.transform=`translate(${p.x-17}px,${p.y-17}px)`}}
 for(const id in ST.els)if(!seen[id]){ST.els[id].remove();delete ST.els[id]}
 // side panel
 const al=$('alerts');al.classList.remove('hidden');const cnt={brk:0,idle:0,ops:0,rdy:0};list.forEach(([m,s])=>cnt[s[0]]++);
 const order={brk:0,rdy:1,ops:2,idle:3};list.sort((a,b)=>order[a[1][0]]-order[b[1][0]]);
 const run=machines.filter(m=>m.running).length,tot=machines.filter(m=>!m.def.util).length;
 const html=`<header data-a="tog"><b>Plant status</b><span class="pill run">▶ ${run}/${tot}</span>${cnt.brk?`<span class="pill brk">🔧 ${cnt.brk}</span>`:''}${cnt.rdy?`<span class="pill rdy">📦 ${cnt.rdy}</span>`:''}${cnt.ops?`<span class="pill ops">👷 ${cnt.ops}</span>`:''}${cnt.idle?`<span class="pill idle">💤 ${cnt.idle}</span>`:''}<i>${ST.open?'▾':'▸'}</i></header>`+
  (ST.open?`<div class="al">${list.length?list.slice(0,12).map(([m,s])=>`<div class="ai ${s[0]}" data-m="${m.id}"><span>${s[1]}</span><div><b>${esc(m.name)}</b><small>${s[2]} · ${esc(s[3])}</small></div></div>`).join('')+(list.length>12?`<div class="mut" style="padding:4px 8px">+${list.length-12} more</div>`:''):'<div class="ai ok"><span>✅</span><div><b>All machines running</b><small>Nothing needs you right now</small></div></div>'}</div>`:'');
 if(al._h!==html){al._h=html;al.innerHTML=html}}
function statusInit(){const l=document.createElement('div');l.id='mstat';document.body.appendChild(l);const a=document.createElement('div');a.id='alerts';a.className='hidden';document.body.appendChild(a);
 a.onclick=e=>{if(e.target.closest('[data-a=tog]')){ST.open=!ST.open;a._h='';statusTick();return}const it=e.target.closest('[data-m]');if(it){const m=machines.find(q=>q.id===+it.dataset.m);if(m){select(m);goal.t.set(m.x,1.5,m.z);goal.r=Math.max(30,Math.min(goal.r,70))}}};
 (function f(){statusTick();setTimeout(()=>requestAnimationFrame(f),80)})()}

// ---------------------------------------------------------------------
// REVENUE GRAPH — click Revenue in the status bar
// ---------------------------------------------------------------------
function recordMonth(cost){const st=G.stats=G.stats||{};(st.hist=st.hist||[]).push({m:G.month,rev:st.monthRev||0,cost:Math.round(cost),cash:Math.round(G.money)});if(st.hist.length>120)st.hist.shift()}
function openRevenue(){const st=G.stats||{},H=(st.hist||[]).slice();H.push({m:G.month,rev:st.monthRev||0,cost:0,cash:Math.round(G.money),live:true});
 const W=760,Hh=300,P={l:64,r:16,t:16,b:34},n=H.length,xs=i=>P.l+(n<2?0:i*(W-P.l-P.r)/(n-1)),bw=Math.max(4,Math.min(26,(W-P.l-P.r)/Math.max(1,n)*.38));
 const vals=H.flatMap(h=>[h.rev,h.cost,h.cash,h.rev-h.cost]);let mx=Math.max(1000,...vals),mn=Math.min(0,...vals);const pad=(mx-mn)*.08;mx+=pad;mn-=mn<0?pad:0;
 const ys=v=>P.t+(mx-v)/(mx-mn)*(Hh-P.t-P.b);const path=k=>H.map((h,i)=>(i?'L':'M')+xs(i).toFixed(1)+' '+ys(h[k]).toFixed(1)).join(' ');
 const ticks=[0,1,2,3,4].map(i=>mn+(mx-mn)*i/4);const done=H.filter(h=>!h.live),totRev=done.reduce((a,h)=>a+h.rev,0),totCost=done.reduce((a,h)=>a+h.cost,0);
 const last=done[done.length-1],prev=done[done.length-2],trend=last&&prev?(last.rev-last.cost)-(prev.rev-prev.cost):0;
 const svg=`<svg viewBox="0 0 ${W} ${Hh}" class="revg">${ticks.map(v=>`<line x1="${P.l}" x2="${W-P.r}" y1="${ys(v)}" y2="${ys(v)}" stroke="#eadcc2" stroke-dasharray="${v===0?'':'3 4'}" stroke-width="${Math.abs(v)<1?2:1}"/><text x="${P.l-8}" y="${ys(v)+4}" text-anchor="end">${short(v)}</text>`).join('')}
  ${H.map((h,i)=>{const pr=h.rev-h.cost;return h.live?'':`<rect x="${xs(i)-bw/2}" y="${Math.min(ys(pr),ys(0))}" width="${bw}" height="${Math.abs(ys(pr)-ys(0))}" rx="3" fill="${pr>=0?'#2ec27e':'#ef476f'}" opacity=".35"><title>${monthName(h.m)} profit ${money(pr)}</title></rect>`}).join('')}
  <path d="${path('cost')}" fill="none" stroke="#f59e0b" stroke-width="2.5" stroke-dasharray="6 4"/><path d="${path('rev')}" fill="none" stroke="#14b8a6" stroke-width="3.5" stroke-linejoin="round" class="draw"/><path d="${path('cash')}" fill="none" stroke="#7b5cff" stroke-width="2.5"/>
  ${H.map((h,i)=>`<circle cx="${xs(i)}" cy="${ys(h.rev)}" r="${h.live?6:4}" fill="${h.live?'#fff':'#14b8a6'}" stroke="#14b8a6" stroke-width="2.5"><title>${monthName(h.m)}${h.live?' (so far)':''}: revenue ${money(h.rev)}${h.live?'':', costs '+money(h.cost)}, cash ${money(h.cash)}</title></circle>`).join('')}
  ${H.map((h,i)=>n<=14||i%Math.ceil(n/12)===0||h.live?`<text x="${xs(i)}" y="${Hh-12}" text-anchor="middle">${h.live?'now':monthName(h.m).replace(' Y',"·")}</text>`:'').join('')}</svg>`;
 const md=modal(`<header>${ico('i-trend')}<h2>Revenue & growth</h2><button class="x" data-r="x">✕</button></header><div class="mb">
  <div class="kpis"><div class="kpi"><span>Revenue to date</span><b class="up">${short(totRev+(st.monthRev||0))}</b></div><div class="kpi"><span>Costs to date</span><b>${short(totCost)}</b></div><div class="kpi"><span>Profit to date</span><b class="${totRev-totCost>=0?'up':'down'}">${short(totRev-totCost)}</b></div><div class="kpi"><span>This month so far</span><b>${short(st.monthRev||0)}</b></div><div class="kpi"><span>Trend vs last month</span><b class="${trend>=0?'up':'down'}">${done.length>1?(trend>=0?'▲ ':'▼ ')+short(Math.abs(trend)):'—'}</b></div></div>
  <div class="card" style="padding:10px">${n<2?'<div class="mut" style="padding:30px;text-align:center">The graph fills in month by month. Come back after the first month ends.</div>':svg}
  <div class="row" style="gap:14px;font-size:12px;color:#6b5a44"><span><i class="lg" style="background:#14b8a6"></i>Revenue</span><span><i class="lg" style="background:#f59e0b"></i>Running costs</span><span><i class="lg" style="background:#7b5cff"></i>Cash</span><span><i class="lg" style="background:#2ec27e;opacity:.5"></i>Profit</span><span><i class="lg" style="background:#ef476f;opacity:.5"></i>Loss</span></div></div><div class="row"><button class="btn ghost sm" data-st="1">📑 Financial statements</button></div>${consultHTML()}</div>`,'wiz');
 md.onclick=e=>{if(e.target.closest('[data-r=x]'))closeModal();if(e.target.closest('[data-st]'))openStatements();const c=e.target.closest('[data-c]');if(c&&!c.disabled)runConsult(c.dataset.c,md);const ap=e.target.closest('[data-ap]');if(ap&&!ap.disabled)applyRec(+ap.dataset.ap)}}


// ---------------------------------------------------------------------
// CONSULTANCY — pay a consultant to study the plant and recommend the
// actions that add the most profit; each recommendation can be applied.
// ---------------------------------------------------------------------
function upkeepOf(m){return m.def.up*(G.research.lean?.85:1)}
function consultRecs(){const R=[],wage=G.wage||600,prod=machines.filter(m=>!m.def.util);
 const brk=machines.filter(m=>m.broken);if(brk.length)R.push({v:brk.reduce((a,m)=>a+m.def.cost*.08,0),t:'Repair broken machines now',w:brk.map(m=>m.name).join(', ')+' '+(brk.length>1?'are':'is')+' stopped and holding up the line.',a:'Repair all · '+money(brk.reduce((a,m)=>a+repCost(m),0)),f:()=>{for(const m of brk){const c=repCost(m);if(G.money>=c){G.money-=c;m.broken=false}}}});
 const need=prod.length;if(G.workers<need)R.push({v:(need-G.workers)*1800,t:'Hire '+(need-G.workers)+' operator'+(need-G.workers>1?'s':''),w:'Machines without operators earn nothing but still cost upkeep.',a:'Hire · '+money((need-G.workers)*1500),f:()=>{for(let i=G.workers;i<need&&G.money>=1500;i++){G.money-=1500;book('hiring',-1500);G.workers++}}});
 if(G.workers>need+1)R.push({v:(G.workers-need)*wage,t:'Release '+(G.workers-need)+' surplus operator'+(G.workers-need>1?'s':''),w:'You pay '+money(wage)+' a month each for people with no machine to run.',a:'Release',f:()=>{G.workers=need}});
 if(G.inv.greige<6&&G.orders.length)R.push({v:3500,t:'Keep a greige buffer',w:'Greige is down to '+Math.floor(G.inv.greige)+' lots; the whole plant stops when it runs out.',a:'Buy 30 lots · '+money(G.greige*30),f:()=>{const c=G.greige*30;if(G.money>=c){G.money-=c;G.inv.greige+=30}}});
 const idle=prod.filter(m=>!m.running&&m.worker&&!m.broken&&m.produced<3&&machines.filter(q=>q.type===m.type).length>1);if(idle.length){const m=idle[0];R.push({v:upkeepOf(m)+wage,t:'Sell the idle '+m.name,w:'A second '+m.def.name.toLowerCase()+' has barely run. It costs '+money(upkeepOf(m))+'/mo upkeep plus an operator.',a:'Sell for '+money(Math.round(m.def.cost*.4*m.level)),f:()=>{if(typeof sellMachine==='function')sellMachine(m)}})}
 const fin=Math.floor(G.inv.fd)+Math.floor(G.inv.fp);if(fin>=12&&!G.orders.some(o=>G.inv[o.type]>=1))R.push({v:fin*500,t:'Turn idle stock into cash',w:fin+' lots of finished fabric are sitting in the warehouse with no order to fill.',a:'Sell half on the spot market',f:()=>{const d=Math.floor(G.inv.fd/2),p=Math.floor(G.inv.fp/2);G.inv.fd-=d;G.inv.fp-=p;G.money+=d*550+p*800}});
 const pr=machines.filter(m=>m.def.out&&m.def.out.printed).length,dy=machines.filter(m=>m.def.out&&m.def.out.dyed).length;if(pr<=dy&&unlocked('baby'))R.push({v:4000,t:'Grow printing capacity',w:'Printed fabric sells for about 45% more than dyed, and you have '+pr+' printer'+(pr===1?'':'s')+' to '+dy+' dyeing machine'+(dy===1?'':'s')+'.',a:'Open Build → Rotary printing',f:()=>{closeModal();UIS.cat='rotary';togglePanel('build')}});
 const up=machines.reduce((a,m)=>a+upkeepOf(m),0);const lean=RESEARCH.find(r=>r.id==='lean');if(lean&&!G.research.lean&&up>4000)R.push({v:up*.15,t:'Research '+lean.name,w:'It cuts '+money(up*.15)+' a month off your '+money(up)+' upkeep and halves breakdowns.',a:'Research · '+money(lean.cost),f:()=>{if(G.money>=lean.cost){G.money-=lean.cost;G.research.lean=1}}});
 if(G.loan>=10000&&G.money>G.loan+30000)R.push({v:G.loan*.01,t:'Pay off the bank loan',w:'Interest costs '+money(G.loan*.01)+' a month and you have the cash.',a:'Repay '+money(G.loan),f:()=>{G.money-=G.loan;G.loan=0}});
 const late=G.orders.filter(o=>o.due-G.month<=1&&G.inv[o.type]<o.qty).length;if(!G.nightShift&&late)R.push({v:late*2500,t:'Run a night shift',w:late+' order'+(late>1?'s are':' is')+' due within a month and short of fabric. Night output rises from 35% to 90%.',a:'Start night shift',f:()=>setNight(true)});
 if(G.nightShift&&!G.orders.length)R.push({v:G.workers*wage*.4,t:'Stop the night shift',w:'No orders are waiting, so the extra 40% wages buy nothing.',a:'Stop night shift',f:()=>setNight(false)});
 const busy=prod.filter(m=>m.running&&m.level<3).sort((a,b)=>b.produced-a.produced)[0];if(busy)R.push({v:upCost(busy)*.12,t:'Upgrade the '+busy.name,w:'It is your busiest machine ('+busy.produced+' lots). A level up makes it faster.',a:'Upgrade · '+money(upCost(busy)),f:()=>{const c=upCost(busy);if(G.money>=c){G.money-=c;busy.level++}}});
 {const r=riskS(),prodN=machines.filter(m=>!m.def.util&&m.def.out).length,avg=prodN?machines.filter(m=>!m.def.util&&m.def.out).reduce((a,m)=>a+rejectRate(m),0)/prodN:0;
  if(r.maint<2&&avg>.035){const nx=r.maint+1,save=Math.round(r.rejV/Math.max(1,G.month)*(1-MAINT[nx][3]/MAINT[r.maint][3]))||Math.round(avg*prodN*60*400*(1-MAINT[nx][3]/MAINT[r.maint][3]));R.push({v:Math.max(0,save-MAINT[nx][2]+MAINT[r.maint][2])+800,t:'Move to '+MAINT[nx][0].toLowerCase(),w:'About '+(avg*100).toFixed(1)+'% of lots are rejected ('+short(r.rejV)+' lost so far). '+MAINT[nx][1]+' cuts rejections to ×'+MAINT[nx][3]+'.',a:'Switch · '+money(MAINT[nx][2])+'/mo',f:()=>{r.maint=nx}})}
  if(r.sec<2&&r.theft>0){const nx=r.sec+1;R.push({v:Math.max(500,Math.round(r.theftV/Math.max(1,G.month)*(1-SEC[nx][3]/SEC[r.sec][3]))-SEC[nx][2]+SEC[r.sec][2]),t:'Improve security: '+SEC[nx][0].toLowerCase(),w:r.theft+' theft'+(r.theft>1?'s':'')+' so far cost '+short(r.theftV)+'. '+SEC[nx][1]+' cuts the risk to ×'+SEC[nx][3]+'.',a:'Switch · '+money(SEC[nx][2])+'/mo',f:()=>{r.sec=nx}})}}
 return R.sort((a,b)=>b.v-a.v)}
const CONSULT=[['quick','Quick advice','One top recommendation',2000],['review','Full plant review','Up to five recommendations, ranked',6000]];
function consultHTML(){return `<div class="card"><h4>🧑‍💼 Hire a textile consultant</h4><div class="mut">An expert studies your plant, orders and costs, and tells you what would add the most profit. You can act on each recommendation with one click.</div>
 <div class="row">${CONSULT.map(([k,t,d,c])=>`<button class="btn ${k==='quick'?'gold':'green'}" data-c="${k}" ${G.money<c?'disabled':''}><span style="display:block">${t} · ${money(c)}</span><small style="font:600 11px var(--body);opacity:.85">${d}</small></button>`).join('')}</div></div><div id="crep">${repHTML()}</div>`}
function repHTML(){const r=UIS.rep;if(!r)return '';return `<div class="card" style="border-color:#7ee8a6"><h4>📋 ${r.title} · report for ${esc(G.plantName||'your plant')}</h4>${r.recs.length?r.recs.map((x,i)=>`<div class="rec"><b>${i+1}. ${esc(x.t)}</b><span class="gain">≈ +${short(x.v)}/mo</span><div class="mut">${esc(x.w)}</div><button class="btn sm" data-ap="${i}" ${r.done[i]?'disabled':''}>${r.done[i]?'✓ Done':esc(x.a)}</button></div>`).join(''):'<div class="mut">Your plant is in good shape. Keep delivering on time and reinvest in printing capacity.</div>'}</div>`}
function applyRec(i){const r=UIS.rep;if(!r||r.done[i])return;const pre=G.money;r.recs[i].f();r.done[i]=1;bookDelta(G.money-pre,'consultAct');refreshStats();renderTab();const box=document.querySelector('#ov #crep');if(box)box.innerHTML=repHTML()}
function runConsult(k,root){const c=CONSULT.find(x=>x[0]===k);if(G.money<c[3])return;G.money-=c[3];book('consult',-c[3]);UIS.rep={title:c[1],recs:consultRecs().slice(0,k==='quick'?1:5),done:{}};
 const box=root.querySelector('#crep');if(box)box.innerHTML=repHTML();renderTab();toast('🧑‍💼 Consultant report ready — '+UIS.rep.recs.length+' recommendation'+(UIS.rep.recs.length===1?'':'s'))}


// ---------------------------------------------------------------------
// BOOKS — every cash movement is classified; monthly P&L, cash flow and
// balance sheet, plus a daily log. Kept in G.fin and saved with the game.
// ---------------------------------------------------------------------
const CAT={orders:['Sales — orders','inc'],spot:['Sales — spot market','inc'],msale:['Machine sales','inv'],greige:['Greige (raw material)','op'],wages:['Wages','op'],night:['Night-shift premium','op'],upkeep:['Machine upkeep & utilities','op'],repairs:['Repairs','op'],hiring:['Hiring fees','op'],research:['Research','op'],consult:['Consultancy','op'],interest:['Loan interest','fin_i'],capex:['New machines','inv'],upgrade:['Machine upgrades','inv'],loanIn:['Loans taken','fin'],loanOut:['Loans repaid','fin'],maint:['Maintenance plan','op'],subsidy:['Government support','inc'],security:['Security','op'],other:['Other','op']};
function finState(){const f=G.fin=G.fin||{};if(!f.months){f.months={};f.days=[];f.snaps={};f.cash0=G.money;f.last=G.money;f.today={in:0,out:0,lots:0,del:0}}return f}
function book(cat,amt){if(!G||!amt)return;const f=finState(),mo=f.months[G.month]=f.months[G.month]||{};mo[cat]=(mo[cat]||0)+amt;f.last+=amt;if(amt>0)f.today.in+=amt;else f.today.out-=amt}
function bookDelta(d,hint){if(!d)return;book(hint==='consultAct'?(d>0?'msale':'other'):hint,d)}
const ACT={buy:'greige',spot:'spot',borrow:'loanIn',repay:'loanOut',hire:'hiring',res:'research'};
function finInit(){
 // engine buttons in panels
 $('tc').addEventListener('click',e=>{const b=e.target.closest('[data-a]');if(!b||!G)return;const c=ACT[b.dataset.a];if(!c)return;const pre=G.money;setTimeout(()=>book(c,G.money-pre),0)},true);
 // machine editor: repair, upgrade, clone, sell
 const map={peRp:'repairs',peUp:'upgrade',peCl:'capex',peSl:'msale'};
 document.addEventListener('click',e=>{const b=e.target.closest('#pe button');if(!b||!G||!map[b.id])return;const pre=G.money;setTimeout(()=>{const d=G.money-pre;book(map[b.id],d);if(b.id==='peCl')econCapex(d)},0)},true);
 addEventListener('keydown',e=>{if(e.key==='Delete'&&G&&sel){const pre=G.money;setTimeout(()=>book('msale',G.money-pre),0)}},true);
 // placing a machine on the floor
 R.domElement.addEventListener('pointerup',()=>{if(!G||!tool)return;const pre=G.money;setTimeout(()=>{const d=G.money-pre;book('capex',d);econCapex(d)},0)},true);
 // anything else that moved cash
 setInterval(()=>{if(!G||!UIS.inGame)return;const f=finState(),d=Math.round(G.money-f.last);if(Math.abs(d)>=1)book('other',d)},1000)}
function finMonth(cost){const f=finState();let up=0;machines.forEach(m=>up+=m.def.up);if(G.research.lean)up*=.85;const wages=G.workers*(G.wage||600),int=Math.round(G.loan*.01),night=G.nightShift?G.workers*(G.wage||600)*.4:0;
 // engine already took the money: re-book it in its parts
 const mo=f.months[G.month-1]=f.months[G.month-1]||{};const parts={upkeep:-Math.round(up),wages:-wages,interest:-int,night:-night};for(const k in parts){mo[k]=(mo[k]||0)+parts[k];f.last+=parts[k]}
 f.snaps[G.month-1]=bsNow()}
function invValue(){const i=G.inv;return Math.round(i.greige*G.greige+(i.scoured+i.rfd)*G.greige*1.25+(i.dyed+i.printed)*G.greige*1.6+i.fd*385+i.fp*560)}
function fixedValue(){return Math.round(machines.reduce((a,m)=>a+m.def.cost*(1+.5*(m.level-1))*Math.max(.3,1-(m.age||0)*.01),0))}
function bsNow(){const cash=Math.round(G.money),inv=invValue(),fa=fixedValue(),loan=Math.round(G.loan),od=cash<0?-cash:0;const assets=Math.max(0,cash)+inv+fa,liab=loan+od;return{cash:Math.max(0,cash),inv,fa,assets,loan,od,liab,equity:assets-liab}}
function plOf(mo,mi){const LS=(G.fin&&G.fin.loss&&G.fin.loss[mi])||{};mo=mo||{};const g=k=>mo[k]||0;const sub=g('subsidy'),rev=g('orders')+g('spot'),rejL=Math.round(LS.rej||0),thL=Math.round(LS.theft||0),mat=-g('greige'),gross=rev-mat-rejL-thL,opex=-(g('wages')+g('night')+g('upkeep')+g('repairs')+g('hiring')+g('research')+g('consult')+g('other'));
 const dep=Math.round(fixedValue()*.01),ebit=gross-opex-dep+sub,int=-g('interest');return{rev,orders:g('orders'),spot:g('spot'),mat,gross,wages:-(g('wages')+g('night')),upkeep:-g('upkeep'),repairs:-g('repairs'),hiring:-g('hiring'),research:-g('research'),consult:-g('consult'),other:-g('other'),maint:-g('maint'),security:-g('security'),sub,rejL,thL,opex,dep,ebit,int,net:ebit-int}}
function cfOf(mo){mo=mo||{};const g=k=>mo[k]||0;let op=0,inv=0,fin=0;for(const k in mo){const t=CAT[k]?CAT[k][1]:'op';if(t==='inv')inv+=mo[k];else if(t==='fin')fin+=mo[k];else op+=mo[k]}return{op,inv,fin,net:op+inv+fin}}
// daily log: one plant day = DN.len game seconds
function finDay(){const f=finState();maybeTheft();f.days.push({m:G.month,d:f.dayN=(f.dayN||0)+1,cash:Math.round(G.money),in:Math.round(f.today.in),out:Math.round(f.today.out),lots:f.today.lots,del:f.today.del});if(f.days.length>90)f.days.shift();
 const t=f.today;if(UIS.inGame&&(t.in||t.out||t.lots))toast('📅 Day '+f.dayN+' report: +'+short(t.in)+' in · −'+short(t.out)+' out · '+t.lots+' lots made'+(t.del?' · '+t.del+' delivered':''));f.today={in:0,out:0,lots:0,del:0}}
function openStatements(tab){tab=tab||UIS.stTab||'pl';UIS.stTab=tab;const f=finState();const ms=Object.keys(f.months).map(Number).filter(m=>m<G.month).sort((a,b)=>a-b).slice(-6);const cols=ms.concat([G.month]);
 const head=`<tr><th></th>${cols.map(m=>`<th>${monthName(m)}${m===G.month?'<small>so far</small>':''}</th>`).join('')}</tr>`;const FX=curNow().fx,cell=v=>{v=Math.round((v||0)*FX);return `<td class="${v<0?'neg':''}">${v<0?'('+Math.abs(v).toLocaleString('en-US')+')':v===0?'–':v.toLocaleString('en-US')}</td>`};
 const row=(lbl,fn,cls)=>`<tr class="${cls||''}"><td>${lbl}</td>${cols.map(m=>cell(fn(m))).join('')}</tr>`;let body='';
 if(tab==='pl'){const P=m=>plOf(f.months[m],m);body=row('Sales — orders',m=>P(m).orders)+row('Sales — spot market',m=>P(m).spot)+row('Revenue',m=>P(m).rev,'tot')+row('Greige (materials)',m=>-P(m).mat)+row('Rejected lots (at cost)',m=>-P(m).rejL)+row('Theft losses (at cost)',m=>-P(m).thL)+row('Gross profit',m=>P(m).gross,'tot')+row('Wages (incl. night shift)',m=>-P(m).wages)+row('Upkeep & utilities',m=>-P(m).upkeep)+row('Repairs',m=>-P(m).repairs)+row('Maintenance plan',m=>-P(m).maint)+row('Security',m=>-P(m).security)+row('Hiring',m=>-P(m).hiring)+row('Research',m=>-P(m).research)+row('Consultancy',m=>-P(m).consult)+row('Other',m=>-P(m).other)+row('Depreciation (1%/mo)',m=>-P(m).dep)+row('Government support',m=>P(m).sub)+row('Operating profit (EBIT)',m=>P(m).ebit,'tot')+row('Loan interest',m=>-P(m).int)+row('Net profit / loss',m=>P(m).net,'grand')}
 if(tab==='cf'){let open=f.cash0;const op={};for(const m of Object.keys(f.months).map(Number).sort((a,b)=>a-b)){op[m]=open;open+=cfOf(f.months[m]).net}const C=m=>cfOf(f.months[m]),g=(m,k)=>(f.months[m]||{})[k]||0;
  body=row('Opening cash',m=>op[m]!=null?op[m]:G.money,'sub')+row('Cash from sales',m=>g(m,'orders')+g(m,'spot'))+row('Paid for greige',m=>g(m,'greige'))+row('Paid wages',m=>g(m,'wages')+g(m,'night'))+row('Paid upkeep, repairs, maintenance',m=>g(m,'upkeep')+g(m,'repairs')+g(m,'maint'))+row('Paid security',m=>g(m,'security'))+row('Paid hiring, research, consultancy',m=>g(m,'hiring')+g(m,'research')+g(m,'consult')+g(m,'other'))+row('Interest paid',m=>g(m,'interest'))+row('Government support received',m=>g(m,'subsidy'))+row('Operating cash flow',m=>C(m).op,'tot')+row('New machines & upgrades',m=>g(m,'capex')+g(m,'upgrade'))+row('Machine sales',m=>g(m,'msale'))+row('Investing cash flow',m=>C(m).inv,'tot')+row('Loans taken',m=>g(m,'loanIn'))+row('Loans repaid',m=>g(m,'loanOut'))+row('Financing cash flow',m=>C(m).fin,'tot')+row('Net change in cash',m=>C(m).net,'grand')+row('Closing cash',m=>(op[m]!=null?op[m]:G.money)+C(m).net,'sub')}
 if(tab==='bs'){const B=m=>m===G.month?bsNow():(f.snaps[m]||bsNow());body=`<tr class="sec"><td colspan="${cols.length+1}">Assets</td></tr>`+row('Cash at bank',m=>B(m).cash)+row('Inventory (greige, WIP, finished)',m=>B(m).inv)+row('Machines (net of depreciation)',m=>B(m).fa)+row('Total assets',m=>B(m).assets,'tot')+`<tr class="sec"><td colspan="${cols.length+1}">Liabilities</td></tr>`+row('Bank loan',m=>B(m).loan)+row('Overdraft (negative cash)',m=>B(m).od)+row('Total liabilities',m=>B(m).liab,'tot')+row('Owner’s equity',m=>B(m).equity,'grand')}
 let table=`<table class="fs">${head}${body}</table>`;
 if(tab==='day'){const D=f.days.slice(-30).reverse();const mx=Math.max(1,...D.map(d=>Math.max(d.in,d.out)));const fx2=curNow().fx;table=D.length?`<table class="fs"><tr><th>Day</th><th>Month</th><th>Money in</th><th>Money out</th><th></th><th>Lots made</th><th>Delivered</th><th>Cash at close</th></tr>${D.map(d=>`<tr><td>Day ${d.d}</td><td>${monthName(d.m)}</td><td>${Math.round(d.in*fx2).toLocaleString('en-US')}</td><td class="neg">(${Math.round(d.out*fx2).toLocaleString('en-US')})</td><td style="width:120px"><i class="db in" style="width:${d.in/mx*55}px"></i><i class="db out" style="width:${d.out/mx*55}px"></i></td><td>${d.lots}</td><td>${d.del}</td><td class="${d.cash<0?'neg':''}">${Math.round(d.cash*fx2).toLocaleString('en-US')}</td></tr>`).join('')}</table>`:'<div class="mut" style="padding:24px;text-align:center">The first daily report appears at the end of the first plant day.</div>'}
 const tabs=[['pl','Profit & loss'],['cf','Cash flow'],['bs','Balance sheet'],['day','Daily log']];
 const md=modal(`<header>${ico('i-finance')}<h2>Financial statements</h2><button class="x" data-f="x">✕</button></header><div class="mb"><div class="sub">${tabs.map(([k,t])=>`<button data-f="${k}" class="${tab===k?'on':''}">${t}</button>`).join('')}</div>
  <div class="fswrap">${table}</div><div class="mut" style="margin-top:8px">Amounts in ${econ().cur==='local'?COUNTRIES[econ().country].cur:'US dollars'}; brackets are outflows or losses. The current month is shown so far. Inventory is valued at cost, machines at purchase price less 1% a month.</div>
  <div class="row"><button class="btn ghost sm" data-f="csv">⬇ Export CSV</button><button class="btn ghost sm" data-f="rev">📈 Revenue graph & consultant</button></div></div>`,'wiz');
 md.onclick=e=>{const b=e.target.closest('[data-f]');if(!b)return;const k=b.dataset.f;if(k==='x')closeModal();else if(k==='rev')openRevenue();else if(k==='csv'){const t=md.querySelector('table');const csv=[...t.rows].map(r=>[...r.cells].map(c=>'"'+c.innerText.replace(/\n/g,' ').replace(/"/g,'""')+'"').join(',')).join('\n');const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv'}));a.download='textile-tycoon-'+tab+'.csv';a.click()}else openStatements(k)}}


// ---------------------------------------------------------------------
// RISKS — rejected lots (quality) and theft (security)
// ---------------------------------------------------------------------
const MAINT=[['Breakdown only','Fix machines when they fail',0,1],['Preventive maintenance','Weekly checks, cleaning, calibration',1200,.55],['Total productive maintenance','Daily operator care + planned overhauls',3000,.3]];
const SEC=[['No security','Open gates, no guards',0,1],['Guards at the gate','Two guards per shift, gate passes',900,.4],['Guards + CCTV + stock audits','Cameras, locked stores, weekly counts',2200,.1]];
const riskS=()=>{G.risk=G.risk||{maint:0,sec:0,rej:0,rejV:0,theft:0,theftV:0,log:[]};return G.risk};
function rejectRate(m){const r=riskS();let p=.07*MAINT[r.maint][3]*(1-.3*(m.level-1))*(1.3-.15*skillOf(m));if(G.research.lean)p*=.7;if(m.age>24)p*=1.3;return Math.max(.004,p)}
function lotValue(k){return k==='fp'?560:k==='fd'?385:k==='printed'||k==='dyed'?G.greige*1.6:G.greige*1.25}
function lossBook(kind,v){const f=finState(),L=f.loss=f.loss||{},mo=L[G.month]=L[G.month]||{};mo[kind]=(mo[kind]||0)+v}
function maybeReject(m){if(m.def.util||!m.def.out)return false;if(Math.random()>=rejectRate(m))return false;const k=m.def.stenter?(m.lot==='printed'?'fp':'fd'):Object.keys(m.def.out)[0];if(!k||G.inv[k]<1)return false;
 G.inv[k]-=1;const r=riskS(),v=lotValue(k);r.rej++;r.rejV+=v;m.rejects=(m.rejects||0)+1;lossBook('rej',v);r.log.unshift({t:'reject',m:m.name,v,mo:G.month});r.log.length=Math.min(r.log.length,40);
 const p=project(new THREE.Vector3(m.x,(m.def.h||4)+2.6,m.z));if(p&&UIS.inGame)popAt(p.x,p.y,'❌ Lot rejected','pop rej');return true}
function maybeTheft(){const r=riskS(),p=.14*SEC[r.sec][3];if(Math.random()>=p)return;const items=['greige','fd','fp'].filter(k=>G.inv[k]>=2);if(!items.length)return;const k=items[Math.random()*items.length|0],n=Math.max(1,Math.round(G.inv[k]*(.06+Math.random()*.1)));
 G.inv[k]-=n;const v=n*lotValue(k==='greige'?'gr':k)*(k==='greige'?G.greige/(G.greige*1.25):1);r.theft++;r.theftV+=v;lossBook('theft',v);r.log.unshift({t:'theft',m:n+' lots of '+MAT[k].toLowerCase(),v,mo:G.month});r.log.length=Math.min(r.log.length,40);
 toast('🚨 Theft overnight: '+n+' lot'+(n>1?'s':'')+' of '+MAT[k].toLowerCase()+' missing (≈'+money(v)+'). Better security cuts this.');banner('Stock stolen','≈ '+money(v)+' lost')}
function riskMonth(){const r=riskS(),c=MAINT[r.maint][2]+SEC[r.sec][2];if(!c)return;G.money-=c;const f=finState(),mo=f.months[G.month-1]=f.months[G.month-1]||{};if(MAINT[r.maint][2]){mo.maint=(mo.maint||0)-MAINT[r.maint][2]}if(SEC[r.sec][2]){mo.security=(mo.security||0)-SEC[r.sec][2]}f.last-=c}
function riskHTML(){const r=riskS(),prod=machines.filter(m=>!m.def.util&&m.def.out),avg=prod.length?prod.reduce((a,m)=>a+rejectRate(m),0)/prod.length:0;
 const opt=(arr,cur,key)=>arr.map(([t,d,c,f],i)=>`<button class="mc${cur===i?' on':''}" data-rk="${key}" data-rv="${i}" style="min-height:0"><b>${t}</b><span class="rec">${d}</span><span class="cost">${c?money(c)+'/mo':'Free'} · ${key==='maint'?'rejects ×'+f:'theft risk ×'+f}</span></button>`).join('');
 return `<div class="kpis"><div class="kpi"><span>Average reject rate</span><b class="${avg>.05?'down':''}">${(avg*100).toFixed(1)}%</b></div><div class="kpi"><span>Lots rejected</span><b>${r.rej}</b></div><div class="kpi"><span>Rejection loss</span><b class="down">${short(r.rejV)}</b></div><div class="kpi"><span>Thefts</span><b>${r.theft}</b></div><div class="kpi"><span>Theft loss</span><b class="down">${short(r.theftV)}</b></div></div>
 <div class="card"><h4>🛠 Maintenance plan</h4><div class="mut">Worn, poorly kept machines spoil lots. Better maintenance and upgrading machines (each level −30%) cut rejections; machines over 2 years old reject more.</div><div class="grid" style="grid-template-columns:repeat(3,1fr)">${opt(MAINT,r.maint,'maint')}</div></div>
 <div class="card"><h4>🛡 Security</h4><div class="mut">Greige and finished fabric can go missing overnight. Guards, cameras and stock audits deter it.</div><div class="grid" style="grid-template-columns:repeat(3,1fr)">${opt(SEC,r.sec,'sec')}</div></div>
 <div class="card"><h4>Highest reject rates</h4>${prod.slice().sort((a,b)=>rejectRate(b)-rejectRate(a)).slice(0,5).map(m=>`<div class="row" style="margin:3px 0"><span style="flex:1">${esc(m.name)} <span class="mut">L${m.level}${m.rejects?' · '+m.rejects+' rejected':''}</span></span><b class="${rejectRate(m)>.05?'down':''}">${(rejectRate(m)*100).toFixed(1)}%</b></div>`).join('')||'<div class="mut">No production machines yet.</div>'}</div>
 ${r.log.length?`<div class="card"><h4>Recent losses</h4>${r.log.slice(0,8).map(x=>`<div class="row" style="margin:3px 0"><span>${x.t==='theft'?'🚨':'❌'}</span><span style="flex:1">${x.t==='theft'?'Theft: '+esc(x.m):'Rejected at '+esc(x.m)}</span><span class="mut">${monthName(x.mo)} · ${money(x.v)}</span></div>`).join('')}</div>`:''}`}


// ---------------------------------------------------------------------
// COUNTRY, CURRENCY, COSTS & GOVERNMENT SUPPORT
// Defaults reflect schemes in force in late 2026 (simplified for the game);
// every value can be changed by the player.
// ---------------------------------------------------------------------
const SYM={INR:'₹',BDT:'৳',ETB:'Br ',PKR:'Rs ',VND:'₫',IDR:'Rp ',CNY:'¥',TRY:'₺',EGP:'E£',MXN:'MX$',BRL:'R$',EUR:'€',GBP:'£',USD:'$'};
for(const k in COUNTRIES)COUNTRIES[k].sym=SYM[COUNTRIES[k].cur];
// utilK: power & steam cost vs. game baseline; schemes: [name, note, kind, %]
const ECON={IN:{utilK:1,s:[['RoDTEP export remission','Remission of duties & taxes on exported fabric (extended to 30 Sep 2026 — check current status)','export',1.5],['State textile policy capital subsidy','Many states pay a share of new machinery cost; PM MITRA parks add infrastructure support','capex',10],['State interest subvention','Interest support on term loans for textile units under state policies','interest',50]]},
 BD:{utilK:.85,s:[['Alternative cash support','1.5% cash assistance on textile exports in lieu of bond/duty drawback (FY2026-27)','export',1.5],['Eurozone special incentive','Extra 0.5% on shipments to Eurozone countries','export',.5]]},
 ET:{utilK:.5,s:[['Duty-free capital goods','100% customs-duty exemption on imported machinery and spares','capex',15],['Industrial park power tariff','Electricity at about 3 US cents/kWh in industrial parks','info',0],['Income-tax holiday','Multi-year profit-tax exemption for new investments (no profit tax in this game)','info',0]]},
 PK:{utilK:1.35,s:[]},VN:{utilK:.8,s:[]},ID:{utilK:.9,s:[]},CN:{utilK:.9,s:[]},TR:{utilK:1.25,s:[]},EG:{utilK:.7,s:[]},MX:{utilK:1,s:[]},BR:{utilK:1.1,s:[]},IT:{utilK:1.8,s:[]},DE:{utilK:1.9,s:[]},UK:{utilK:1.7,s:[]},US:{utilK:1,s:[]}};
function econDefaults(c){const E=ECON[c]||{utilK:1,s:[]};return{country:c,cur:'local',utilK:E.utilK,schemes:E.s.map(x=>({n:x[0],d:x[1],k:x[2],p:x[3],on:true})),custom:{capex:0,export:0,interest:0}}}
function econ(){if(!G.econ)G.econ=econDefaults((G.org&&G.org.country)||'IN');return G.econ}
function subPct(kind){const e=econ();let p=(e.custom&&e.custom[kind])||0;for(const x of e.schemes)if(x.on&&x.k===kind)p+=x.p;return p}
function setCountry(c,keepCosts){const e=econ(),cur=e.cur;if(keepCosts){e.country=c}else{G.econ=econDefaults(c);G.econ.cur=cur}const o=orgState();o.country=c;toast('🌍 Plant country: '+COUNTRIES[c].n+' — costs and government support updated');refreshStats();renderTab()}
// effects
function econCapex(d){if(d>=0)return;const p=subPct('capex');if(!p)return;const r=Math.round(-d*p/100);G.money+=r;book('subsidy',r);toast('🏛 Capital subsidy received: '+money(r))}
function econDeliver(o){const p=o.exp?subPct('export'):0;if(!p)return;const r=Math.round(o.reward*p/100);G.money+=r;book('subsidy',r)}
function econMonth(){const e=econ(),f=finState(),mo=f.months[G.month-1]=f.months[G.month-1]||{};let up=0;machines.forEach(m=>up+=m.def.up);if(G.research.lean)up*=.85;
 const du=Math.round(up*(e.utilK-1));if(du){G.money-=du;mo.upkeep=(mo.upkeep||0)-du;f.last-=du}
 const ip=subPct('interest');const int=Math.round(G.loan*.01);if(ip&&int){const r=Math.round(int*Math.min(100,ip)/100);G.money+=r;mo.subsidy=(mo.subsidy||0)+r;f.last+=r}}
function econHTML(){const e=econ(),C=COUNTRIES[e.country],wageTyp=C.op;
 return `<div class="card"><h4>🌍 Country, currency & costs</h4><div class="form" style="grid-template-columns:1fr 1fr">
  <div class="fld"><label>Country</label><select data-ec="country">${Object.entries(COUNTRIES).map(([k,c])=>`<option value="${k}" ${k===e.country?'selected':''}>${c.n}</option>`).join('')}</select></div>
  <div class="fld"><label>Show money in</label><select data-ec="cur"><option value="local" ${e.cur==='local'?'selected':''}>${C.cur} (${C.sym.trim()})</option><option value="usd" ${e.cur!=='local'?'selected':''}>US dollars ($)</option></select></div>
  <div class="fld"><label>Operator wage <b>${money(G.wage||600)}/mo</b></label><input type="range" data-set="wage" min="50" max="4000" step="10" value="${G.wage||600}"><button class="btn ghost sm" data-ec="wageTyp">Use typical for ${C.n}: ${money(wageTyp)}</button></div>
  <div class="fld"><label>Utilities (power, steam, water) <b id="ukv">${Math.round(e.utilK*100)}% of base</b></label><input type="range" data-ec="utilK" min="30" max="250" step="5" value="${Math.round(e.utilK*100)}"><button class="btn ghost sm" data-ec="utilTyp">Use typical for ${C.n}: ${Math.round(((ECON[e.country]||{}).utilK||1)*100)}%</button></div></div>
  <div class="mut">Money is kept in US dollars inside the game and shown at about ${C.fx.toLocaleString('en-US')} ${C.cur} per dollar.</div></div>
  <div class="card"><h4>🏛 Government support in ${C.n}</h4>${e.schemes.length?e.schemes.map((x,i)=>`<div class="rec"><label class="tog" style="margin:0">${esc(x.n)} ${x.k!=='info'?`<input type="checkbox" data-sc="${i}" ${x.on?'checked':''}>`:''}</label><div class="mut">${esc(x.d)}</div>${x.k!=='info'?`<div class="row" style="margin:4px 0"><span class="mut">${x.k==='capex'?'Rebate on new machines':x.k==='export'?'Extra on export orders':'Share of loan interest paid'}</span><input type="number" data-sp="${i}" value="${x.p}" step="0.5" min="0" max="100" style="width:70px;border:2px solid var(--line);border-radius:8px;padding:3px 6px">%</div>`:''}</div>`).join(''):`<div class="mut">No textile-specific support is set for ${C.n}. Add your own below if your plant qualifies for any scheme.</div>`}
  <div class="rec"><b>Your own support</b><div class="row" style="flex-wrap:wrap">${[['capex','Machine rebate'],['export','Export bonus'],['interest','Interest support']].map(([k,t])=>`<span class="mut">${t}</span><input type="number" data-cu="${k}" value="${e.custom[k]||0}" step="0.5" min="0" max="100" style="width:64px;border:2px solid var(--line);border-radius:8px;padding:3px 6px">%`).join(' ')}</div></div>
  <div class="kpis" style="margin-top:8px"><div class="kpi"><span>Machine rebate</span><b>${subPct('capex')}%</b></div><div class="kpi"><span>Export bonus</span><b>${subPct('export')}%</b></div><div class="kpi"><span>Interest support</span><b>${Math.min(100,subPct('interest'))}%</b></div><div class="kpi"><span>Received so far</span><b class="up">${short(Object.values(finState().months).reduce((a,m)=>a+(m.subsidy||0),0))}</b></div></div>
  <div class="mut" style="margin-top:6px">Simplified from schemes in force in late 2026. Rates and eligibility change, so check official sources for a real plant.</div></div>`}
function econInit(){const tc=$('tc');tc.addEventListener('change',e=>{const t=e.target,e2=G&&econ();if(!e2)return;
 if(t.dataset.ec==='country')setCountry(t.value);else if(t.dataset.ec==='cur'){e2.cur=t.value;refreshStats();renderTab()}
 else if(t.dataset.ec==='utilK'){e2.utilK=+t.value/100;renderTab()}else if(t.dataset.sc!=null){e2.schemes[+t.dataset.sc].on=t.checked;renderTab()}else if(t.dataset.sp!=null){e2.schemes[+t.dataset.sp].p=Math.max(0,+t.value||0);renderTab()}else if(t.dataset.cu){e2.custom[t.dataset.cu]=Math.max(0,+t.value||0);renderTab()}});
 tc.addEventListener('input',e=>{const t=e.target;if(t.dataset.ec==='utilK'){const b=$('ukv');if(b)b.textContent=t.value+'% of base'}});
 tc.addEventListener('click',e=>{const b=e.target.closest('[data-ec]');if(!b||b.tagName==='SELECT'||b.tagName==='INPUT')return;const e2=econ(),C=COUNTRIES[e2.country];if(b.dataset.ec==='wageTyp'){G.wage=C.op;(G.cfg=G.cfg||{}).wage=C.op}if(b.dataset.ec==='utilTyp')e2.utilK=(ECON[e2.country]||{}).utilK||1;renderTab()})}


// =====================================================================
// PRODUCTION REALISM — fabric programme, rated machine speeds, operator
// skills, trolley fleet (fixed payload, WIP sits on trolleys), capacity
// planner with bottlenecks, trolley optimisations, notification centre.
// =====================================================================
const LOT_M=1000, WIDTH_M=1.6;                       // one lot = 1,000 m of 1.6 m wide fabric
const FABRICS={
 light:{n:'Cotton voile',gsm:90,d:'Light, fast to run, lower price',f:{prep:1.2,dye:1.15,print:1.1,fin:1.25},price:.9},
 medium:{n:'Cotton poplin',gsm:140,d:'The standard shirting quality',f:{prep:1,dye:1,print:1,fin:1},price:1},
 blend:{n:'Poly-cotton blend',gsm:160,d:'Needs HT dyeing; good prices',f:{prep:1,dye:.85,print:.95,fin:.95},price:1.08},
 heavy:{n:'Cotton twill / drill',gsm:280,d:'Heavy and slow, best prices',f:{prep:.75,dye:.7,print:.8,fin:.7},price:1.22}};
// rated speed at level 1 with a standard operator on cotton poplin
const RATED={desize:[100,'m/min','prep'],bleach:[60,'m/min','prep'],jet:[9,'m/min eq. (batch)','dye'],jigger:[35,'m/min (batch)','dye'],baby:[12,'m/min','print'],rotary:[45,'m/min','print'],flatbed:[22,'m/min','print'],digital:[16,'m/min','print'],stenter:[45,'m/min','fin'],
 station:[40,'recipes/h','sup'],kitchen:[180,'kg paste/h','sup'],autokit:[400,'kg paste/h','sup'],coater:[6,'screens/h','sup'],laser:[14,'screens/h','sup'],qc:[60,'m/min','fin']};
const fabric=()=>FABRICS[(G&&G.fab)||'medium'];
const lotKg=()=>Math.round(fabric().gsm*WIDTH_M*LOT_M/1000);
const skillOf=m=>m.skill||2;
const skillF=m=>.7+.15*skillOf(m);                    // skill 1 ×0.85 … 5 ×1.45
window.speedMul=m=>{if(m.def.util||!G)return 1;const r=RATED[m.type];let f=skillF(m);if(r&&r[2]!=='sup')f*=fabric().f[r[2]]||1;return f};
function capDay(m){if(m.def.util||!m.def.time)return 0;const night=G.nightShift?.9:.35,shift=(16+8*night)/24;return DN.len*speedOf(m)/m.def.time*shift*(m.broken?0:1)}
function ratedNow(m){const r=RATED[m.type];if(!r)return null;return[r[0]*speedOf(m),r[1]]}
// ---- trolleys
const TRO={batch:{n:'Fabric batch trolley',cost:1500,tare:140},drum:{n:'Colour drum trolley',cost:900,tare:60}};
const TOPT=[['alu','Aluminium trolleys','Tare 140 → 95 kg, so each trolley carries more fabric',4000],['rfid','RFID tracking & dispatch board','Find empty trolleys fast: +20% usable fleet',6000],['fifo','FIFO lanes & batch-to-full-load rule','Fewer half-empty trolleys: +15% usable fleet',3000],['racks','Fabric racks at each machine','Buffer 2 lots off-trolley per stage',5000]];
function fleet(){const t=G.tro=G.tro||{batch:12,drum:4,opt:{},hist:[]};t.opt=t.opt||{};t.hist=t.hist||[];return t}
const payload=()=>RULES.maxLoad-(fleet().opt.alu?95:TRO.batch.tare);
const trolleysPerLot=()=>Math.ceil(lotKg()/payload());
const usableK=()=>1+(fleet().opt.rfid?.2:0)+(fleet().opt.fifo?.15:0);
function wipLots(){const i=G.inv;return i.scoured+i.rfd+i.dyed+i.printed}
function troCapLots(){return Math.floor(fleet().batch*usableK()/trolleysPerLot())+(fleet().opt.racks?8:0)}
function troUse(){const cap=troCapLots(),w=Math.ceil(wipLots());return{cap,w,used:Math.min(fleet().batch,Math.ceil(Math.max(0,w-(fleet().opt.racks?8:0))*trolleysPerLot()/usableK())),pct:cap?Math.min(1,w/cap):1}}
const WK=['scoured','rfd','dyed','printed'];const WIPOUT=m=>m.def.out&&WK.some(k=>m.def.out[k])&&!WK.some(k=>m.def.need&&m.def.need[k]);
window.blockOf=m=>{if(!G||!UIS.inGame||!WIPOUT(m))return '';return wipLots()+1>troCapLots()?'Waiting for a free trolley':''};
window.trolleyFor=k=>{if(!G||!G.tro)return null;const t=fleet(),b=t.batch;if(k==='C')return Math.min(12,t.drum);return Math.min(18,k==='A'?Math.ceil(b*.6):Math.floor(b*.4))};
function troSample(){const t=fleet(),u=troUse();t.hist.push(u.pct);if(t.hist.length>200)t.hist.shift();t.blocked=(t.blocked||0)+machines.filter(m=>m.status==='Waiting for a free trolley').length}
const troIdle=()=>{const h=fleet().hist;return h.length?1-h.reduce((a,b)=>a+b,0)/h.length:1};
// ---- capacity planner
const STAGES=[['prep1','Singeing',['desize'],'greige→scoured'],['prep2','Desize, scour & bleach',['bleach'],'scoured→ready'],['dye','Dyeing',['jet','jigger'],'ready→dyed'],['print','Printing',['baby','rotary','flatbed','digital'],'ready→printed'],['fin','Stentering & finishing',['stenter'],'dyed/printed→finished']];
function capacity(){const st={};for(const[k,n,ts]of STAGES){const ms=machines.filter(m=>ts.includes(m.type));st[k]={n,ms,cap:ms.reduce((a,m)=>a+capDay(m),0)}}
 const sup=t=>machines.filter(m=>t.includes(m.type)).reduce((a,m)=>a+capDay(m),0);st.recipes={n:'Dye recipes (dispensing)',cap:sup(['station']),need:st.dye.cap};st.paste={n:'Print paste (colour kitchen)',cap:sup(['kitchen','autokit']),need:st.print.cap};st.screens={n:'Screens (engraving)',cap:sup(['coater','laser'])*6,need:st.print.cap};
 const pending=G.orders.reduce((a,o)=>a+Math.max(0,o.qty-G.inv[o.type]),0),days=Math.max(1,G.orders.reduce((a,o)=>a+Math.max(1,o.due-G.month)*30,0)/Math.max(1,G.orders.length));
 const flow=Math.min(st.prep1.cap,st.prep2.cap,st.dye.cap+st.print.cap,st.fin.cap);const order=['prep1','prep2','wet','fin'];const vals={prep1:st.prep1.cap,prep2:st.prep2.cap,wet:st.dye.cap+st.print.cap,fin:st.fin.cap};
 const bn=order.reduce((a,k)=>vals[k]<vals[a]?k:a,'prep1');return{st,flow,bn,vals,demand:pending/days*30/30,pending}}
// ---- skills & training
const trainCost=m=>500*skillOf(m)+(m.def.cost>15000?400:0);
function train(m){if(skillOf(m)>=5)return;const c=trainCost(m);if(G.money<c){toast('Not enough cash');return}G.money-=c;book('hiring',-c);m.skill=skillOf(m)+1;toast('🎓 '+m.name+' operator trained to skill '+m.skill+' — '+Math.round(skillF(m)*100)+'% speed');renderTab()}
// ---- panels
const SKL=['','Trainee','Standard','Skilled','Expert','Master'];
function capHTML(){const C=capacity(),mx=Math.max(1,...Object.values(C.vals)),names={prep1:'Singeing',prep2:'Desize, scour & bleach',wet:'Dyeing + printing',fin:'Stentering'};
 let h=`<div class="kpis"><div class="kpi"><span>Plant output</span><b>${C.flow.toFixed(1)} lots/day</b></div><div class="kpi"><span>= metres/day</span><b>${Math.round(C.flow*LOT_M).toLocaleString('en-US')}</b></div><div class="kpi"><span>Bottleneck</span><b class="down">${names[C.bn]}</b></div><div class="kpi"><span>Orders still to make</span><b>${C.pending} lots</b></div></div>`;
 h+=`<div class="card"><h4>Line balance (lots per day)</h4><div class="mut">A plant runs only as fast as its slowest stage. ${fabric().n}, ${fabric().gsm} gsm · 1 lot = ${LOT_M.toLocaleString()} m ≈ ${lotKg()} kg.</div>${['prep1','prep2','wet','fin'].map(k=>`<div class="capr${k===C.bn?' bn':''}"><span>${names[k]}${k===C.bn?' <b>⚠ bottleneck</b>':''}</span><div class="bar2"><i style="width:${C.vals[k]/mx*100}%"></i></div><b>${C.vals[k].toFixed(1)}</b></div>`).join('')}
  ${['recipes','paste','screens'].map(k=>{const x=C.st[k];if(!x.need)return '';const ok=x.cap>=x.need;return `<div class="capr sm${ok?'':' bn'}"><span>${x.n}</span><div class="bar2${ok?' done':''}"><i style="width:${Math.min(100,x.cap/Math.max(.1,x.need)*100)}%"></i></div><b>${ok?'✓':'short'}</b></div>`}).join('')}</div>`;
 for(const[k,n,ts,fl]of STAGES){const x=C.st[k];if(!x.ms.length)continue;h+=`<div class="card"><h4>${n} <span class="mut">· ${fl}</span></h4><table class="fs mt"><tr><th>Machine</th><th>Rated</th><th>Operator</th><th>Lots/day</th><th></th></tr>${x.ms.map(m=>{const r=ratedNow(m);return `<tr><td>${esc(m.name)} <span class="mut">L${m.level}</span>${m.broken?' 🔧':''}</td><td>${r?r[0].toFixed(r[0]<20?1:0)+' '+r[1].split(' ')[0]:''}</td><td>${SKL[skillOf(m)]} ★${skillOf(m)}</td><td><b>${capDay(m).toFixed(1)}</b></td><td><button class="btn sm ghost" data-up="${m.id}" ${m.level>=3?'disabled':''}>⬆ ${m.level>=3?'Max':short(upCost(m))}</button> <button class="btn sm ghost" data-tr="${m.id}" ${skillOf(m)>=5?'disabled':''}>🎓 ${skillOf(m)>=5?'Max':short(trainCost(m))}</button></td></tr>`}).join('')}</table></div>`}
 return h}
function troHTML(){const t=fleet(),u=troUse(),idle=troIdle(),tpl=trolleysPerLot();
 return `<div class="kpis"><div class="kpi"><span>Batch trolleys</span><b>${t.batch}</b></div><div class="kpi"><span>Payload each</span><b>${payload()} kg</b></div><div class="kpi"><span>Trolleys per lot</span><b>${tpl}</b></div><div class="kpi"><span>Lots on trolleys</span><b class="${u.pct>.9?'down':''}">${u.w} / ${u.cap}</b></div><div class="kpi"><span>Average idle</span><b class="${idle>.5?'down':''}">${Math.round(idle*100)}%</b></div><div class="kpi"><span>Machine stops (no trolley)</span><b class="${t.blocked?'down':''}">${t.blocked||0}</b></div></div>
 <div class="card"><h4>Fleet in use now</h4><div class="bar2${u.pct>.9?'':' done'}" style="height:16px"><i style="width:${u.pct*100}%"></i></div><div class="mut">Every lot waiting between processes sits on trolleys. A ${lotKg()} kg lot of ${fabric().n.toLowerCase()} needs ${tpl} trolley${tpl>1?'s':''} (max ${RULES.maxLoad} kg each including the ${t.opt.alu?95:140} kg trolley, one pusher). When the fleet is full, machines cannot unload and stop.</div></div>
 <div class="card"><h4>Procurement</h4><div class="row"><span style="flex:1"><b>${TRO.batch.n}</b> · ${t.batch} owned</span><button class="btn green sm" data-tb="batch" ${G.money<TRO.batch.cost?'disabled':''}>Buy · ${money(TRO.batch.cost)}</button><button class="btn ghost sm" data-ts="batch" ${t.batch<2?'disabled':''}>Sell · ${money(TRO.batch.cost*.4)}</button></div>
  <div class="row"><span style="flex:1"><b>${TRO.drum.n}</b> · ${t.drum} owned</span><button class="btn green sm" data-tb="drum" ${G.money<TRO.drum.cost?'disabled':''}>Buy · ${money(TRO.drum.cost)}</button><button class="btn ghost sm" data-ts="drum" ${t.drum<2?'disabled':''}>Sell · ${money(TRO.drum.cost*.4)}</button></div></div>
 <div class="card"><h4>Workflow optimisation</h4>${TOPT.map(([k,n,d,c])=>`<div class="rec"><b>${n}</b>${t.opt[k]?'<span class="gain">✓ Installed</span>':`<span class="gain" style="color:#9a5b00">${money(c)}</span>`}<div class="mut">${d}</div>${t.opt[k]?'':`<button class="btn sm" data-to="${k}" ${G.money<c?'disabled':''}>Install</button>`}</div>`).join('')}</div>`}
function sklHTML(){const prod=machines.filter(m=>!m.def.util&&m.def.time);return `<div class="card"><h4>Operator skills</h4><div class="mut">Each machine's operator has a skill level for that machine. Skill raises speed (★1 ×0.85 … ★5 ×1.45) and lowers rejects. Training costs money once.</div>
 <table class="fs mt"><tr><th>Machine</th><th>Operator skill</th><th>Speed</th><th></th></tr>${prod.map(m=>`<tr><td>${esc(m.name)}</td><td>${'★'.repeat(skillOf(m))}<span style="color:#e3cfac">${'★'.repeat(5-skillOf(m))}</span> ${SKL[skillOf(m)]}</td><td>×${skillF(m).toFixed(2)}</td><td><button class="btn sm ghost" data-tr="${m.id}" ${skillOf(m)>=5?'disabled':''}>🎓 ${skillOf(m)>=5?'Master':'Train · '+short(trainCost(m))}</button></td></tr>`).join('')}</table></div>`}
function fabHTML(){const cur=G.fab||'medium';return `<div class="card"><h4>Fabric programme</h4><div class="mut">The quality you run changes how fast every machine goes, how heavy a lot is (so how many trolleys it needs) and what buyers pay.</div><div class="grid" style="grid-template-columns:repeat(2,1fr)">${Object.entries(FABRICS).map(([k,f])=>`<button class="mc${cur===k?' on':''}" data-fab="${k}" style="min-height:0"><b>${f.n} · ${f.gsm} gsm</b><span class="rec">${f.d}</span><span class="cost">Speed: prep ×${f.f.prep} · dye ×${f.f.dye} · print ×${f.f.print} · stenter ×${f.f.fin}</span><span class="cost">Price ×${f.price} · ${Math.round(f.gsm*WIDTH_M)} kg/lot · ${Math.ceil(Math.round(f.gsm*WIDTH_M)/payload())} trolley(s)/lot</span></button>`).join('')}</div></div>`}
// ---- notification centre
function notes(){const N=[],C=capacity(),names={prep1:'Singeing',prep2:'Desize, scour & bleach',wet:'Dyeing + printing',fin:'Stentering'},t=fleet(),u=troUse();
 // bottleneck
 const bnTypes=C.bn==='wet'?['jet','jigger','baby','rotary','flatbed','digital']:C.bn==='prep1'?['desize']:C.bn==='prep2'?['bleach']:['stenter'];const bm=machines.filter(m=>bnTypes.includes(m.type));
 const second=Object.entries(C.vals).filter(([k])=>k!==C.bn).sort((a,b)=>a[1]-b[1])[0];const gap=second?second[1]-C.vals[C.bn]:0;
 if(bm.length||C.vals[C.bn]===0){const acts=[];const slow=bm.filter(m=>m.level<3).sort((a,b)=>capDay(a)-capDay(b))[0];if(slow)acts.push(['⬆ Upgrade '+slow.name,upCost(slow),()=>{const c=upCost(slow);if(G.money>=c){G.money-=c;book('upgrade',-c);slow.level++}}]);
  const low=bm.filter(m=>skillOf(m)<5).sort((a,b)=>skillOf(a)-skillOf(b))[0];if(low)acts.push(['🎓 Train '+low.name+' operator',trainCost(low),()=>train(low)]);
  const bt=bnTypes.find(x=>unlocked(x)&&x!=='digital')||bnTypes[0];acts.push(['🏗 Build another '+DEF[bt].name,DEF[bt].cost,()=>{closeNotes();UIS.cat=DEF[bt].zone;if(UIS.panel!=='build')togglePanel('build');setTool(bt)}]);
  N.push({lvl:'hi',ico:'🚧',t:'Bottleneck: '+names[C.bn],w:names[C.bn]+' can do '+C.vals[C.bn].toFixed(1)+' lots/day'+(gap>0?', '+gap.toFixed(1)+' less than the next slowest stage':'')+'. The whole plant runs at this pace.',acts})}
 // support shortages
 for(const k of ['recipes','paste','screens']){const x=C.st[k];if(x.need&&x.cap<x.need*.9){const typ=k==='recipes'?'station':k==='paste'?'kitchen':'coater';N.push({lvl:'md',ico:'🧪',t:x.n+' cannot keep up',w:'It supplies '+x.cap.toFixed(1)+' a day but the '+(k==='recipes'?'dyeing':'printing')+' machines can use '+x.need.toFixed(1)+'.',acts:[['🏗 Build '+DEF[typ].name,DEF[typ].cost,()=>{closeNotes();UIS.cat=DEF[typ].zone;if(UIS.panel!=='build')togglePanel('build');setTool(typ)}]]})}}
 // trolleys
 const stuck=machines.filter(m=>m.status==='Waiting for a free trolley');if(stuck.length||u.pct>.85){const need=Math.max(trolleysPerLot()*2,Math.ceil((u.w+4)*trolleysPerLot()/usableK())-t.batch);const acts=[['🛒 Buy '+need+' batch trolleys',need*TRO.batch.cost,()=>{const c=need*TRO.batch.cost;if(G.money>=c){G.money-=c;book('capex',-c);t.batch+=need;syncTrolleys(true)}}]];
  for(const[k,n,,c]of TOPT)if(!t.opt[k]){acts.push(['⚙ '+n,c,()=>{if(G.money>=c){G.money-=c;book('upgrade',-c);t.opt[k]=1}}]);break}
  N.push({lvl:stuck.length?'hi':'md',ico:'🛒',t:stuck.length?stuck.length+' machine'+(stuck.length>1?'s':'')+' stopped: no free trolley':'Trolley fleet almost full',w:u.w+' lots are waiting on trolleys; the fleet holds '+u.cap+'. Each lot needs '+trolleysPerLot()+' trolleys.',acts})}
 else if(troIdle()>.6&&t.hist.length>30&&t.batch>trolleysPerLot()*4){const extra=Math.floor(t.batch*.3);N.push({lvl:'lo',ico:'💤',t:'Trolleys standing idle',w:Math.round(troIdle()*100)+'% of the batch fleet is idle on average. Sell some to free cash.',acts:[['Sell '+extra+' trolleys',-extra*TRO.batch.cost*.4,()=>{t.batch-=extra;const v=extra*TRO.batch.cost*.4;G.money+=v;book('msale',v);syncTrolleys(true)}]]})}
 // low-skill operators on busy machines
 const ls=machines.filter(m=>!m.def.util&&m.def.time&&skillOf(m)<=1);if(ls.length)N.push({lvl:'lo',ico:'🎓',t:ls.length+' trainee operator'+(ls.length>1?'s':''),w:'Trainees run machines at 85% speed and spoil more lots.',acts:[['Train all to standard',ls.reduce((a,m)=>a+trainCost(m),0),()=>ls.forEach(train)]]});
 // demand vs output
 if(C.pending>0&&C.flow>0){const daysNeed=C.pending/C.flow;const soon=Math.min(...G.orders.map(o=>o.due-G.month))*30;if(daysNeed>soon+5)N.push({lvl:'md',ico:'⏱',t:'Orders are ahead of capacity',w:'Open orders need '+daysNeed.toFixed(0)+' days of output; the first one is due in about '+Math.max(0,soon)+' days.',acts:[[G.nightShift?'Night shift already on':'🌙 Start night shift',0,()=>setNight(true)]]})}
 return N}
function closeNotes(){const n=$('ncP');if(n)n.classList.add('hidden')}
function renderNotes(force){const N=notes(),b=$('ncB');const hi=N.filter(n=>n.lvl!=='lo').length;b.querySelector('i').textContent=N.length||'';b.querySelector('i').style.display=N.length?'':'none';b.classList.toggle('hot',hi>0);
 const p=$('ncP');if(p.classList.contains('hidden')&&!force)return;const html=`<header><b>🔔 Notification centre</b><button class="x" data-n="x">✕</button></header><div class="ncl">${N.length?N.map((n,i)=>`<div class="nci ${n.lvl}"><div class="nh"><span>${n.ico}</span><b>${esc(n.t)}</b></div><div class="mut">${esc(n.w)}</div><div class="row">${n.acts.map((a,j)=>`<button class="btn sm ${j?'ghost':'gold'}" data-na="${i}.${j}" ${a[1]>0&&G.money<a[1]?'disabled':''}>${esc(a[0])}${a[1]>0?' · '+short(a[1]):a[1]<0?' · +'+short(-a[1]):''}</button>`).join('')}</div></div>`).join(''):'<div class="nci lo"><div class="nh"><span>✅</span><b>No bottlenecks right now</b></div><div class="mut">Your line is balanced and the trolley fleet has room.</div></div>'}</div>`;
 if(p._h!==html){p._h=html;p.innerHTML=html;p._N=N}}
function ncInit(){const b=document.createElement('button');b.id='ncB';b.className='hidden';b.title='Notification centre: bottlenecks and how to fix them';b.innerHTML='🔔<i></i>';b.onclick=()=>{const p=$('ncP');p.classList.toggle('hidden');renderNotes(true)};$('tutBtn').before(b);
 const p=document.createElement('div');p.id='ncP';p.className='hidden';document.body.appendChild(p);p.onclick=e=>{const x=e.target.closest('[data-n]');if(x)return closeNotes();const a=e.target.closest('[data-na]');if(a&&!a.disabled){const[i,j]=a.dataset.na.split('.').map(Number);p._N[i].acts[j][2]();p._h='';renderNotes(true);refreshStats();renderTab()}};
 setInterval(()=>{if(UIS.inGame){troSample();renderNotes()}},1500)}

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
 if(e.key.toLowerCase()==='t'&&!e.ctrlKey&&!e.metaKey){setTutorial(!CO.on);return}if(e.key.toLowerCase()==='n'&&!e.ctrlKey){setNight(!G.nightShift);return}const map={b:'build',o:'orders',f:'finance',g:'goals'};if(map[e.key.toLowerCase()]&&!e.ctrlKey&&!e.metaKey)togglePanel(map[e.key.toLowerCase()])},true);
// keep the cash counter animating and the dock fresh between engine UI refreshes
setInterval(()=>{if(UIS.inGame)refreshStats()},200);
// the engine status line only matters while placing or with a machine selected
setInterval(()=>{if(UIS.inGame)refreshInfo()},400);
coachInit();statusInit();finInit();econInit();ncInit();{const sg=$('sRev').closest('.sg');if(sg){sg.style.cursor='pointer';sg.title='Click to see the revenue graph';sg.onclick=()=>UIS.inGame&&openRevenue()}}
if(window.engineReady)onModelsReady();
})();
