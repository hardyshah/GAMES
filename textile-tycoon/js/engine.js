
// =====================================================================
// TEXTILE TYCOON 3D — built on the Integrated Textile Plant 3D layout
// =====================================================================
const T=THREE,PI=Math.PI,$=id=>document.getElementById(id);
const main=$('main');const VW=()=>main.clientWidth,VH=()=>main.clientHeight;
const R=new T.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
const DPR=Math.min(devicePixelRatio,1.5);R.setPixelRatio(DPR);R.setSize(VW(),VH());
R.shadowMap.enabled=true;R.shadowMap.type=T.PCFSoftShadowMap;R.toneMapping=T.ACESFilmicToneMapping;R.outputEncoding=T.sRGBEncoding;
main.prepend(R.domElement);
const S=new T.Scene(),BGC=0xdfe5ea;S.background=new T.Color(BGC);S.fog=new T.Fog(BGC,420,900);
const C=new T.PerspectiveCamera(32,VW()/VH(),3,600);
// ---------- lighting ----------
const hemi=new T.HemisphereLight(0xf4f8ff,0xa59c90,.28);S.add(hemi);
const sun=new T.DirectionalLight(0xfff4e6,.85);sun.position.set(-40,90,60);sun.castShadow=true;sun.shadow.mapSize.set(4096,4096);
Object.assign(sun.shadow.camera,{left:-90,right:90,top:70,bottom:-70,near:10,far:260});sun.shadow.bias=-.0012;sun.shadow.normalBias=.12;S.add(sun);
const fill=new T.DirectionalLight(0xcfe0ff,.25);fill.position.set(60,40,-40);S.add(fill);
// ---------- textures ----------
const mk=(w,h,fn,rep)=>{const c=document.createElement('canvas');c.width=w;c.height=h;fn(c.getContext('2d'),w,h);const t=new T.CanvasTexture(c);t.wrapS=t.wrapT=T.RepeatWrapping;t.anisotropy=8;if(rep)t.repeat.set(rep[0],rep[1]);return t};
const brushed=mk(256,256,(g,w,h)=>{g.fillStyle='#808080';g.fillRect(0,0,w,h);for(let i=0;i<2600;i++){const v=90+Math.random()*100|0;g.strokeStyle=`rgba(${v},${v},${v},.4)`;g.beginPath();const y=Math.random()*h;g.moveTo(0,y);g.lineTo(w,y+(Math.random()-.5)*2);g.stroke()}});
const concrete=mk(512,512,(g,w,h)=>{g.fillStyle='#d6d8da';g.fillRect(0,0,w,h);const d=g.getImageData(0,0,w,h);for(let i=0;i<d.data.length;i+=4){const n=(Math.random()-.5)*16;d.data[i]+=n;d.data[i+1]+=n;d.data[i+2]+=n}g.putImageData(d,0,0);
 for(let i=0;i<60;i++){g.fillStyle=`rgba(120,125,130,${Math.random()*.08})`;g.beginPath();g.ellipse(Math.random()*w,Math.random()*h,20+Math.random()*60,10+Math.random()*30,Math.random()*3,0,7);g.fill()}
 g.strokeStyle='rgba(70,76,82,.55)';g.lineWidth=3;g.strokeRect(0,0,w,h)});
const weave=mk(64,64,(g,w,h)=>{g.fillStyle='#888';g.fillRect(0,0,w,h);for(let y=0;y<h;y+=4)for(let x=0;x<w;x+=4){g.fillStyle=((x+y)/4%2)?'#aaa':'#666';g.fillRect(x,y,4,4)}});
function ftex(kind,col){const c=document.createElement('canvas');c.width=256;c.height=64;const g=c.getContext('2d');g.fillStyle=kind=='grey'?'#e6e0cf':col||'#fff';g.fillRect(0,0,256,64);
 if(kind=='print'){const cs=['#d6336c','#f2b134','#1c7ed6','#2f9e44','#fff','#7048e8'];for(let i=0;i<16;i++){g.fillStyle=cs[i%6];g.beginPath();g.ellipse(8+i*16,16+(i*23)%36,9,6,i,0,7);g.fill();g.fillStyle=cs[(i+2)%6];g.beginPath();g.arc(i*16+5,(i*31)%56+4,4,0,7);g.fill()}}
 else{g.strokeStyle='rgba(0,0,0,.09)';for(let i=0;i<256;i+=3){g.beginPath();g.moveTo(i,0);g.lineTo(i,64);g.stroke()}}
 const t=new T.CanvasTexture(c);t.wrapS=t.wrapT=T.RepeatWrapping;t.anisotropy=4;return t}
// ---------- materials ----------
const mat=(c,o)=>new T.MeshStandardMaterial(Object.assign({color:c,roughness:.5,metalness:.1},o||{}));
const ST=mat(0xd2d6db,{metalness:1,roughness:.3}),STd=mat(0x9aa0a6,{metalness:1,roughness:.38}),DK=mat(0x1f2328,{roughness:.65}),BL=mat(0x2162ae,{roughness:.4}),
GR=mat(0x8d949b,{roughness:.45,metalness:.5}),WH=mat(0xf1f3f5,{roughness:.38}),CR=mat(0xe4ddcc,{roughness:.55}),YL=mat(0xf6c21a,{roughness:.45}),RD=mat(0xc8232c,{roughness:.4}),
GN=mat(0x3f8040,{roughness:.55}),OR=mat(0xe8590c,{roughness:.45}),NV=mat(0x2d3b4e,{roughness:.4,metalness:.3}),
GL=mat(0x9fc4d9,{transparent:true,opacity:.28,roughness:.05,metalness:.2}),DRUM=mat(0x1b4fb8,{roughness:.32}),NI=mat(0xd9d6c8,{metalness:1,roughness:.3});
const GRN=mat(0x3f7d3f,{roughness:.5}),RDT=mat(0xb8504a,{roughness:.35,transparent:true,opacity:.85}),BEI=mat(0xcfc59a,{roughness:.6}),BLP=mat(0x2f5f9e,{roughness:.4});
const SC=c=>mat(c,{emissive:c,emissiveIntensity:1,roughness:.4});
const cols=[0xd6336c,0xf2b134,0x1c7ed6,0x2f9e44,0x7048e8,0xe8590c,0x15aabf,0x495057];
const JC=[0xd9a0a8,0xd9a0a8,0xd9a0a8,0xd9a441],TC=[0xf97316,0x6366f1,0xef4444,0xeab308,0x14b8a6];
const sm=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x)};
// ---------- geometry helpers ----------
const BGE={};const bgeo=(w,h,d)=>{const k=w.toFixed(3)+'|'+h.toFixed(3)+'|'+d.toFixed(3);return BGE[k]||(BGE[k]=new T.BoxGeometry(w,h,d))};
function grp(x,y,z,ry,p){const g=new T.Group();g.position.set(x,y,z);g.rotation.y=ry||0;(p||S).add(g);return g}
function box(w,h,d,m,x,y,z,p){const o=new T.Mesh(bgeo(w,h,d),m);o.position.set(x,y,z);o.castShadow=o.receiveShadow=true;(p||S).add(o);return o}
function cyl(r,h,m,x,y,z,ax,p,seg,r2){const o=new T.Mesh(new T.CylinderGeometry(r,r2==null?r:r2,h,seg||32),m);o.position.set(x,y,z);if(ax=='x')o.rotation.z=PI/2;if(ax=='z')o.rotation.x=PI/2;o.castShadow=o.receiveShadow=true;(p||S).add(o);return o}
function sph(r,m,x,y,z,sx,sy,sz,p){const o=new T.Mesh(new T.SphereGeometry(r,24,16),m);o.position.set(x,y,z);o.scale.set(sx||1,sy||1,sz||1);o.castShadow=true;(p||S).add(o);return o}
function lathe(pts,m,x,y,z,p){const o=new T.Mesh(new T.LatheGeometry(pts.map(a=>new T.Vector2(a[0],a[1])),40),m);o.position.set(x,y,z);o.castShadow=o.receiveShadow=true;(p||S).add(o);return o}
function vessel(r,len,m,x,y,z,p){const pts=[],d=.42*r;for(let i=0;i<=10;i++){const a=i/10*PI/2;pts.push([r*Math.sin(a),-len/2-d*Math.cos(a)])}for(let i=10;i>=0;i--){const a=i/10*PI/2;pts.push([r*Math.sin(a),len/2+d*Math.cos(a)])}const o=lathe(pts,m,x,y,z,p);o.rotation.z=PI/2;return o}
function ctank(r,h,m,x,y,z,p){return lathe([[.001,-.45*r],[.2*r,-.55*r],[r,0],[r,h],[.96*r,h+.05],[.001,h+.05]],m,x,y,z,p)}
function tube(pts,m,r,p){const cp=new T.CurvePath();for(let i=0;i<pts.length-1;i++)cp.add(new T.LineCurve3(new T.Vector3(...pts[i]),new T.Vector3(...pts[i+1])));const o=new T.Mesh(new T.TubeGeometry(cp,pts.length*6,r,10),m);o.castShadow=true;(p||S).add(o);return cp}
function scr(w,h,x,y,z,c,p){return box(w,h,.05,SC(c),x,y,z,p)}
function fabIn(A,ax,ay,bx,by,z,w,kind,col,sp,p){const L=Math.hypot(bx-ax,by-ay),g=grp((ax+bx)/2,(ay+by)/2,z,0,p);g.rotation.z=Math.atan2(by-ay,bx-ax);const t=ftex(kind,col);t.repeat.set(L/6,1);const m=new T.Mesh(new T.PlaneGeometry(L,w),new T.MeshStandardMaterial({map:t,side:2,roughness:.9,bumpMap:weave,bumpScale:.25}));m.rotation.x=-PI/2;m.receiveShadow=true;g.add(m);A.push((tt,dt)=>{t.offset.x-=sp*dt/6});return g}
function belt(A,len,w,x,y,z,col,sp,p){const t=ftex('dyed',col);t.repeat.set(len/6,1);const m=new T.Mesh(new T.PlaneGeometry(len,w),new T.MeshStandardMaterial({map:t,roughness:.9,bumpMap:weave,bumpScale:.25}));m.rotation.x=-PI/2;m.position.set(x,y,z);m.receiveShadow=true;p.add(m);A.push((tt,dt)=>{t.offset.x-=sp*dt/6});return m}
function roll(r,len,x,y,z,col,p){const g=grp(x,y,z,0,p);cyl(r,len,mat(col||0xf5f0e4,{roughness:.95,bumpMap:weave,bumpScale:.5}),0,0,0,'z',g,40);cyl(r*.3,len+.15,STd,0,0,0,'z',g,16);return g}
function strut(p1,p2,th,m,p){const a=new T.Vector3(...p1),b=new T.Vector3(...p2),d=b.clone().sub(a),L=d.length();const o=new T.Mesh(bgeo(th,th,L),m);o.position.copy(a).add(b).multiplyScalar(.5);o.quaternion.setFromUnitVectors(new T.Vector3(0,0,1),d.normalize());o.castShadow=o.receiveShadow=true;p.add(o);return o}
function spriteTex(t,col,bg,w,h,font){const c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d');g.fillStyle=bg;g.fillRect(0,0,w,h);g.fillStyle=col;g.font=font;g.textAlign='center';g.fillText(t,w/2,h*.67);return new T.CanvasTexture(c)}
function tag(t,x,y,z,col){const s=new T.Sprite(new T.SpriteMaterial({map:spriteTex(t,col||'#f2b134','rgba(18,24,32,.9)',420,72,'bold 30px Trebuchet MS'),depthTest:false,transparent:true}));s.scale.set(11.5,1.97,1);s.position.set(x,y,z);s.renderOrder=9;s.raycast=()=>{};S.add(s);return s}

// =====================================================================
// MACHINE MODELS (ported from the plant layout)
// =====================================================================
function cart(p,x,z,ry,c){const g=grp(x,0,z,ry,p);box(1.3,.08,1.3,BLP,0,.3,0,g);box(1.1,1,1.1,BEI,0,.88,0,g);box(.4,.12,.03,mat(c),0,1,.58,g);for(const a of[-.6,.6])box(.07,1.4,.07,BLP,a,1,-.6,g);box(1.2,.07,.07,BLP,0,1.7,-.6,g);for(const[a,b]of[[-.55,-.55],[.55,-.55],[-.55,.55],[.55,.55]])cyl(.1,.09,DK,a,.14,b,'z',g,16);return g}
// green-frame dispensing / weighing station with moving gantry
function station(g,A){const idx=(Math.random()*5)|0;
 for(const sx of[-1.5,1.5])for(const sz of[-.9,.9])box(.1,2.2,.1,GRN,sx,1.1,sz,g);
 for(const y of[2.15,.55]){for(const sz of[-.9,.9])box(3.1,.08,.08,GRN,0,y,sz,g);for(const sx of[-1.5,1.5])box(.08,.08,1.8,GRN,sx,y,0,g)}
 box(3.2,.07,2,RDT,0,2.24,0,g);box(1.2,1.2,1.2,BEI,-.7,.95,0,g);box(.4,.12,.03,mat(TC[idx]),-.7,1.1,.61,g);
 for(const[a,b]of[[-1.2,-.5],[-.2,-.5],[-1.2,.5],[-.2,.5]])cyl(.09,.09,DK,a,.2,b,'z',g,16);cart(g,1,1.6,0,TC[(idx+2)%5]);
 for(const sx of[-1.5,1.5])box(.1,1.8,.1,GRN,sx,3.1,-.6,g);box(3.2,.12,.12,GRN,0,4,-.6,g);box(3.2,.12,.12,GRN,0,3.7,-.6,g);
 const car=grp(0,4,-.6,0,g);box(.5,.4,.45,GRN,0,0,0,car);const arm=box(.08,1.5,.08,DK,0,-.9,0,car);const gr=box(.4,.08,.22,DK,0,-1.7,0,car);
 [[-1,-.6],[-.1,.4],[.9,-.2],[1.1,.55]].forEach((q,i)=>{const j=grp(q[0],2.58,q[1],0,g);cyl(.28,.6,mat(JC[i],{transparent:true,opacity:.78,roughness:.1}),0,0,0,'y',j);cyl(.29,.09,OR,0,.33,0,'y',j)});
 A.push(t=>{const ph=(t%10)/10;car.position.x=1.3*Math.cos(ph*2*PI);const a=Math.max(0,Math.sin(ph*6*PI));arm.position.y=-.9-a*.5;gr.position.y=-1.7-a*.5;A.status=a>.2?'Gripper weighing a dye jar':'Gantry moving to next jar'})}
// stainless tanks on a coloured frame platform with stirrers
function platform(g,A,n,col){const w=n*2.6+1,fm=mat(col,{roughness:.45});
 for(const sx of[-w/2,w/2])for(const sz of[-1.8,1.8])box(.16,3.4,.16,fm,sx,1.7,sz,g);box(w,.16,.16,fm,0,3.4,1.8,g);box(w,.16,.16,fm,0,3.4,-1.8,g);box(.16,.16,3.6,fm,-w/2,3.4,0,g);box(.16,.16,3.6,fm,w/2,3.4,0,g);
 const st=[];for(let i=0;i<n;i++){const px=-w/2+1.5+i*2.6;ctank(1.1,1.6,ST,px,3.9,0,g);cyl(1.1,.14,GN,px,5.55,0,'y',g,32);cyl(.35,.3,STd,px,5.7,0,'y',g,16);cyl(.07,1,STd,px,2.7,.8,'y',g,10);st.push(box(.7,.06,.08,ST,px,5.92,0,g))}
 for(const sx of[-w/2,w/2])box(.06,1,.06,fm,sx,4,1.8,g);box(w,.05,.05,fm,0,4.5,1.8,g);box(w,.05,.05,fm,0,4.5,-1.8,g);
 A.push((t,dt)=>st.forEach(s=>s.rotation.y+=dt*5))}
// HT jet dyeing machine
function jet(g,A){vessel(1.35,5.2,ST,0,2.1,0,g);box(.45,.9,2.2,GR,-2,.45,0,g);box(.45,.9,2.2,GR,2,.45,0,g);const win=[];
 for(let k=0;k<3;k++){const px=-1.3+k*1.3;cyl(.22,1.3,ST,px,4.1,-.1,'y',g);sph(.3,ST,px,4.8,-.1,1,1,1,g);cyl(.18,.8,ST,px+.3,5.1,-.1,'x',g);sph(.62,DK,px+.55,5.15,-.1,.9,.2,.6,g);
  const t=new T.Mesh(new T.TorusGeometry(.3,.08,12,28),ST);t.position.set(px,2.1,1.35);g.add(t);cyl(.26,.05,GL,px,2.1,1.34,'z',g);win.push(cyl(.2,.03,mat(0x1c7ed6,{emissive:0x1c7ed6,emissiveIntensity:.4}),px,2.1,1.33,'z',g))}
 box(.9,2,.8,ST,-3.5,1,1.4,g);const sc=scr(.5,.35,-3.5,1.6,1.82,0x38bdf8,g);const lamp=box(.1,.1,.06,SC(0x22c55e),-3.5,2.2,1.82,g);
 cyl(.75,5.4,ST,-4.8,2.7,-1.5,'y',g);cyl(.5,1.8,ST,-5,.9,1.5,'y',g);box(3.5,.08,1.4,DK,.5,.06,2.8,g);
 A.push(t=>{lamp.visible=Math.sin(t*3)>-.3;win.forEach((w,i)=>w.material.emissiveIntensity=.3+.3*Math.sin(t*4+i));const ph=t%24;A.status='HT dyeing cycle: '+(ph<4?'filling & heating':ph<16?'dyeing at 130 °C ('+Math.round(60+ph*4.4)+' °C)':ph<20?'cooling & rinsing':'unloading')})}
// preparatory continuous range (desizing / scouring / bleaching)
function prepRange(g,A,o){const L=o.L,n=o.n,cells=n+(o.jbox?1:0),step=L/cells;box(L,.3,3.8,GR,0,.15,0,g);const rl=[];
 for(let i=0;i<cells;i++){const px=-L/2+step*(i+.5);
  if(o.jbox&&i===1){cyl(1.3,3.6,ST,px,2.1,0,'y',g,32);sph(1.3,ST,px,3.9,0,1,.4,1,g);cyl(.18,1.2,STd,px+.9,4.2,0,'y',g,12);box(.4,.4,.05,SC(0xf97316),px,1.6,1.32,g);continue}
  box(step-.5,2.3,3.2,o.acc,px,1.45,0,g);box(step-.4,.16,3.3,ST,px,2.68,0,g);box((step-.5)*.6,.9,.05,GL,px,1.6,1.62,g);
  rl.push(cyl(.24,3.4,NI,px-step*.25,3,0,'z',g,20),cyl(.24,3.4,NI,px+step*.25,3,0,'z',g,20));cyl(.08,1.6,STd,px,3.6,-1.3,'y',g,8)}
 fabIn(A,-L/2,3.25,L/2,3.25,0,2.6,o.kind,o.col,1.6,g);roll(.8,3,-L/2-1.6,1.3,0,o.inCol,g);fabIn(A,-L/2-1.6,2.1,-L/2,3.25,0,2.6,'grey',null,1.6,g);
 const pl=grp(L/2+1.4,0,0,0,g);box(2,1.6,3,GR,0,.8,0,pl);const st=box(1.6,.6,2.4,mat(o.outCol,{roughness:.9}),0,1.9,0,pl);fabIn(A,L/2,3.25,L/2+1.4,2.4,0,2.6,o.kind,o.col,1.6,g);
 const cab=grp(-L/4,0,-2.6,0,g);box(3,2.2,.8,CR,0,1.1,0,cab);scr(.6,.4,0,1.5,.42,0x38bdf8,cab);
 A.push((t,dt)=>{rl.forEach(r=>r.rotation.y+=dt*3);const h=.4+(t%30)/30*1.2;st.scale.y=h;st.position.y=1.6+h*.3})}
// colour kitchen: tank platform + drum conveyor + dispenser
function kitchen(g,A){const p=grp(-2,0,0,0,g);platform(p,A,3,0x2f6fb5);
 const c=grp(0,0,3.6,0,g);box(7,.12,1.4,GR,0,.5,0,c);for(let i=0;i<22;i++)cyl(.06,1.3,STd,-3.3+i*.3,.62,0,'z',c,10);const bins=[];for(let i=0;i<4;i++)bins.push(cyl(.45,1.1,DRUM,0,1.2,0,'y',c,24));
 const d=grp(5.6,0,0,0,g);box(2.6,4,2.6,mat(0xcfd3d8,{metalness:.8,roughness:.4}),0,2,0,d);box(1.6,1.6,.08,GL,0,2.5,1.34,d);scr(.7,.5,0,1.1,1.34,0x38bdf8,d);box(2.6,.3,2.8,BL,0,4.1,0,d);
 A.push(t=>{bins.forEach((b,i)=>b.position.x=-3.2+((t*.45+i*1.7)%6.6));A.status='Mixing print paste · drums moving to the print lines'})}
function autoKitchen(g,A){const cab=grp(0,0,0,0,g);box(3.4,4.2,3,mat(0xcfd3d8,{metalness:.8,roughness:.4}),0,2.1,0,cab);box(2,1.6,.08,GL,0,2.6,1.54,cab);scr(.8,.55,1.1,1.3,1.54,0x38bdf8,cab);box(3.4,.3,3.2,BL,0,4.35,0,cab);
 const car=grp(0,4.5,0,0,cab);for(let i=0;i<16;i++){const a=i/16*2*PI;cyl(.16,.7,mat(cols[i%8],{roughness:.3}),Math.cos(a)*1.2,.35,Math.sin(a)*1.2,'y',car,14)}
 const c=grp(0,0,3.2,0,g);box(8,.12,1.4,GR,0,.5,0,c);for(let i=0;i<26;i++)cyl(.06,1.3,STd,-3.8+i*.3,.62,0,'z',c,10);const bins=[];for(let i=0;i<5;i++)bins.push(cyl(.45,1.1,DRUM,0,1.2,0,'y',c,24));
 const stir=[];for(let i=0;i<3;i++){const s=grp(-5.2,0,-1.6+i*1.6,0,g);cyl(.7,1.4,ST,0,1.3,0,'y',s,28);cyl(.5,1,STd,0,2.3,0,'y',s,24,.1);stir.push(box(.8,.05,.05,ST,0,2.9,0,s))}
 A.push((t,dt)=>{car.rotation.y+=dt*.6;stir.forEach(s=>s.rotation.y+=dt*6);bins.forEach((b,i)=>b.position.x=-3.7+((t*.6+i*1.6)%7.6));A.status='Auto-dispensing recipe from stored formula'})}
// screen engraving
function engraver(g,A){box(7,1.4,2.4,WH,0,.8,0,g);box(7.1,.7,2.5,mat(0xd23a44,{roughness:.3}),0,1.9,0,g);box(1.2,.3,.06,mat(0x23272c),0,.9,1.25,g);const lamp=box(.5,.4,.05,SC(0x38bdf8),-2.6,1.9,1.28,g);
 cyl(.5,6,STd,0,2.8,0,'x',g);const hd=box(.6,.5,.7,mat(0xe03131,{emissive:0xe03131,emissiveIntensity:.5}),0,3.6,0,g);cyl(.06,6,NI,0,3.4,0,'x',g,8);for(const sx of[-3.2,3.2])cyl(.2,.2,DK,sx,.2,1,'z',g,16);
 A.push(t=>{hd.position.x=Math.sin(t*.9)*2.6;lamp.material.emissiveIntensity=.8+.5*Math.sin(t*3);A.status='Laser exposing screen · head at '+Math.round((Math.sin(t*.9)+1)*50)+'%'})}
function blueCab(p,x,z,h){const g=grp(x,0,z,0,p);box(2.2,h,2,mat(0x6b9fd6,{roughness:.35}),0,h/2,0,g);box(1.8,h*.8,.08,ST,0,h*.45,1.03,g);box(.25,.7,.1,STd,.7,h*.5,1.1,g);box(.4,.3,.06,SC(0xef4444),.5,h*.9,1.04,g);return g}
function coaterSet(g,A){const BLU=mat(0x3f86d6,{roughness:.4}),CARD=mat(0xcdb98a,{roughness:.85});
 const c=grp(-3,0,0,0,g);for(const sx of[-.6,.6])box(.18,3.9,.18,BLU,sx,1.95,0,c);box(1.4,.2,.3,BLU,0,3.9,0,c);box(1.4,.18,.3,BLU,0,.15,0,c);cyl(.15,3.4,CARD,0,1.9,0,'y',c,16);const car=box(.6,.28,.6,DK,0,2,0,c);box(.6,1.2,.5,WH,1.2,.6,0,c);
 const d=grp(1.5,0,0,0,g);box(3.4,.85,1,WH,0,.85,0,d);box(3.2,.05,.8,mat(0x93c5fd,{roughness:.1}),0,1.28,0,d);cyl(.13,2.4,NI,0,1.34,0,'x',d,14);
 blueCab(g,4.7,0,3.8);
 A.push(t=>{car.position.y=2+Math.sin(t*.6)*1;A.status=Math.sin(t*.6)>0?'Auto coating screen (emulsion up-stroke)':'Developing & climatizing coated screens'})}
// rotary print line (baby or production)
function rotary(g,A,o){const{len,heads,dry}=o,SP=o.sp||3;
 const tw=grp(-len/2-3,0,0,0,g);for(const s of[-1.8,1.8])box(.5,5,.5,GR,0,2.5,s,tw);box(.8,.6,4.4,mat(0xb23a8a),0,5.2,0,tw);roll(.9,3.2,-2.6,1.1,0,null,tw);
 fabIn(A,-len/2-5.2,2,-len/2-3.3,5.4,0,2.6,'dyed','#e4ecf5',SP,g);fabIn(A,-len/2-3.3,5.4,-len/2-2.2,2.3,0,2.6,'dyed','#e4ecf5',SP,g);fabIn(A,-len/2-2.2,2.3,-len/2-.2,1.6,0,2.6,'dyed','#e4ecf5',SP,g);
 box(len+2,.7,3.6,GR,0,1.05,0,g);box(len,.1,3.3,DK,0,1.45,0,g);belt(A,len,3.1,0,1.52,0,'#2a2e33',SP,g);belt(A,len,3.1,0,.5,0,'#2a2e33',-SP,g);
 for(let a=-len/2;a<=len/2;a+=3)box(.3,1,.3,GR,a,.55,2.1,g);cyl(.9,3.4,DK,-len/2-.5,1,0,'z',g);cyl(1,3.4,DK,len/2+.5,1,0,'z',g);
 const pf=ftex('dyed','#e8eef6');pf.repeat.set(len/6,1);const pm=new T.Mesh(new T.PlaneGeometry(len,2.6),new T.MeshStandardMaterial({map:pf,roughness:.9,bumpMap:weave,bumpScale:.25}));pm.rotation.x=-PI/2;pm.position.set(0,1.54,0);g.add(pm);
 const dot=mk(64,64,q=>{q.fillStyle='#e2dcc0';q.fillRect(0,0,64,64);q.fillStyle='#6b6a5c';for(let y=4;y<64;y+=8)for(let x=(y/8%2)*4+2;x<64;x+=8){q.beginPath();q.arc(x,y,1.6,0,7);q.fill()}},[8,3]);
 const step=len/(heads+.5),scs=[];
 for(let i=0;i<heads;i++){const px=-len/2+step*(i+.8),col=cols[i%8];
  for(const s of[-1,1]){box(.9,.95,.8,mat(0xb23a8a,{roughness:.4}),px,2.3,s*2.1,g);box(.3,.3,.3,YL,px,2.9,s*2.2,g);box(.9,.3,.9,mat(0xb23a8a),px,1.9,s*2.1,g)}
  box(.35,.35,4.4,GR,px,3.1,0,g);const sc=new T.Mesh(new T.CylinderGeometry(.55,.55,3.6,40),new T.MeshStandardMaterial({color:0xffffff,map:dot,metalness:.8,roughness:.4}));sc.rotation.x=PI/2;sc.position.set(px,2.15,0);sc.castShadow=true;g.add(sc);scs.push(sc);
  const dr=grp(px-.3,0,4.6,0,g);cyl(.29,.95,DRUM,0,.48,0,'y',dr,36);cyl(.31,.06,mat(0x2f6fd0),0,.95,0,'y',dr,36);cyl(.295,.2,mat(col,{emissive:col,emissiveIntensity:.2}),0,.5,0,'y',dr,36);
  tube([[px-.3,1,4.6],[px-.3,3.6,4.3],[px,3.6,2.8],[px,2.95,2.3]],mat(col,{roughness:.3,transparent:true,opacity:.75}),.045,g)}
 A.push((t,dt)=>{pf.offset.x-=SP*dt/6;scs.forEach(s=>s.rotation.y+=SP/.55*dt)});
 box(len,.1,1.2,DK,0,.8,3.3,g);const cab=grp(len*.25,0,-2.8,0,g);box(4,3.2,.9,CR,0,1.9,0,cab);for(let i=0;i<4;i++)box(.8,2.7,.05,mat(0xd8d0bd),-1.5+i*.95,1.9,.5,cab);
 if(dry){const dx=len/2+dry/2+1.8,dg=grp(dx,0,0,0,g);box(dry,3.4,4,o.dryCol,0,2,0,dg);box(dry+.2,.18,4.2,WH,0,3.75,0,dg);const fans=[];
  for(let i=0;i<4;i++){const px=-dry/2+1.5+i*(dry-3)/3;cyl(.75,.14,CR,px,2.1,2.05,'z',dg,36);const f=box(.95,.05,.14,GR,px,2.1,2.15,dg);fans.push(f);const f2=box(.95,.05,.14,GR,px,2.1,2.15,dg);f2.rotation.z=PI/2;fans.push(f2);cyl(.2,.9,RD,px,1.2,2.5,'z',dg,16)}
  box(dry*.5,1.2,.05,GL,0,2.7,2.03,dg);const wt=ftex('print');wt.repeat.set(dry*.5/6,1);const wm=new T.Mesh(new T.PlaneGeometry(dry*.5,1.1),new T.MeshStandardMaterial({map:wt,roughness:.9,emissive:0x442200,emissiveIntensity:.3}));wm.position.set(0,2.7,2);dg.add(wm);cyl(.5,dry-1,GR,0,4.9,0,'x',dg);
  fabIn(A,len/2+.5,1.7,len/2+1.9,2,0,2.6,'print',null,SP,g);
  const pl=grp(dx+dry/2+2,0,0,0,g);box(2.2,3.4,3.2,GR,0,1.7,0,pl);const st=box(1.8,1,1.8,mat(0xe8e8e8),0,.6,-2.6,pl);const arm=box(.3,.3,2.4,ST,-.6,3.5,0,pl);
  A.push((t,dt)=>{fans.forEach(f=>f.rotation.z+=dt*9);wt.offset.x-=SP*dt/6;const h=.3+((t%40)/40)*2.2;st.scale.y=h;st.position.y=h/2;arm.position.x=-.6+Math.sin(t*2)*.5})}
 else{const pl=grp(len/2+2.6,0,0,0,g);box(1.6,1.4,3,GR,0,.7,0,pl);fabIn(A,len/2+.5,1.6,len/2+2,1.5,0,2.6,'print',null,SP,g)}
 A.push(()=>{A.status='Printing '+heads+' colours · '+Math.round(SP*20)+' m/min'})}
// flatbed screen printer with stop-and-go cycle
function flatbed(g,A){const N=4,PS=3.2,TL=14,TY=1;const EBL=mat(0x1f5fc4,{roughness:.35,metalness:.25}),SSL=mat(0xc9ced4,{roughness:.3,metalness:.85}),PNL=mat(0xb9c0c7,{roughness:.5,metalness:.35}),AL=mat(0xdfe3e7,{roughness:.3,metalness:.85}),BK=mat(0x15171a,{roughness:.8});
 for(const sz of[-1.8,1.8]){box(TL,.22,.2,EBL,0,.9,sz,g);box(TL,.14,.3,EBL,0,.28,sz,g)}
 for(let x=-TL/2+.4;x<=TL/2;x+=2){box(.2,.9,.2,EBL,x,.45,-1.8,g);box(.2,.9,.2,EBL,x,.45,1.8,g);box(.2,.14,3.6,EBL,x,.28,0,g)}
 box(TL,.14,3.4,mat(0x9a7448,{roughness:.6}),0,TY,0,g);for(const sz of[-1.72,1.72])box(TL,.12,.12,OR,0,TY+.16,sz,g);
 const bt=ftex('dyed','#b8bdb0');bt.repeat.set(TL/6,1);const bm=new T.Mesh(new T.PlaneGeometry(TL,3.1),new T.MeshStandardMaterial({map:bt,roughness:.85}));bm.rotation.x=-PI/2;bm.position.y=TY+.09;g.add(bm);
 const ft=ftex('print');ft.repeat.set(TL/6,1);const fm=new T.Mesh(new T.PlaneGeometry(TL-.4,2.5),new T.MeshStandardMaterial({map:ft,bumpMap:weave,bumpScale:.25,roughness:.9}));fm.rotation.x=-PI/2;fm.position.y=TY+.11;g.add(fm);
 const SSP=mat(0xd9dee2,{roughness:.26,metalness:.92});for(const sz of[-1.98,1.98])box(TL+.1,.92,.04,SSP,0,.58,sz,g);
 cyl(.3,3.3,BK,TL/2+.1,TY,0,'z',g,28);cyl(.25,3.3,BK,-TL/2-.1,TY,0,'z',g,28);
 const frs=[],trs=[];for(let i=0;i<N;i++){const x=-4.8+i*PS,s=grp(x,1.27,0,0,g);frs.push(s);for(const[dx,dz,w,d]of[[0,1.45,2.6,.14],[0,-1.45,2.6,.14],[1.25,0,.14,3],[-1.25,0,.14,3]])box(w,.12,d,SSL,dx,0,dz,s);
  const pm=new T.Mesh(new T.PlaneGeometry(2.4,2.8),new T.MeshBasicMaterial({color:cols[i%8],transparent:true,opacity:.35,depthWrite:false}));pm.rotation.x=-PI/2;pm.position.y=.01;s.add(pm);
  for(const sz of[-2.1,2.1])for(const sx of[-1.3,1.3])cyl(.06,1.2,ST,sx,-.5,sz,'y',s,10);
  const tl=grp(0,0,0,0,s);for(const sx of[-1.38,1.38])box(.3,.26,.42,EBL,sx,.27,0,tl);box(2.95,.22,.06,AL,0,.22,0,tl);box(2.9,.18,.035,BK,0,.08,0,tl);trs.push(tl)}
 const f=grp(-TL/2-2.8,0,0,0,g);for(const sz of[-1.9,1.9]){box(.3,3.4,.3,EBL,0,1.7,sz,f);box(1.8,.2,.3,EBL,.3,.2,sz,f)}box(.3,.3,4.1,EBL,0,3.4,0,f);roll(.85,3,.4,2.4,0,null,f);
 const ramp=(x0,y0,x1,y1,t)=>{const L=Math.hypot(x1-x0,y1-y0);t.repeat.set(L/6,1);const q=grp((x0+x1)/2,(y0+y1)/2,0,0,g);q.rotation.z=Math.atan2(y1-y0,x1-x0);const m=new T.Mesh(new T.PlaneGeometry(L,2.5),new T.MeshStandardMaterial({map:t,bumpMap:weave,bumpScale:.25,roughness:.9,side:2}));m.rotation.x=-PI/2;q.add(m)};
 const fi=ftex('dyed','#f6e7c6');ramp(-TL/2-2.4,2.5,-TL/2+.4,TY+.11,fi);const fo=ftex('print');ramp(TL/2,TY+.11,TL/2+3,2.55,fo);
 const D0=TL/2+3,DL=9,dry=grp(D0+DL/2,0,0,0,g);box(DL,.5,4.2,EBL,0,.35,0,dry);box(DL,2.9,3.9,PNL,0,2.15,0,dry);for(let i=1;i<6;i++)box(.05,2.9,3.96,mat(0x6a737c),-DL/2+i*DL/6,2.15,0,dry);box(DL+.1,.12,4,WH,0,3.65,0,dry);
 for(let i=0;i<3;i++)cyl(.45,.14,SSL,-3+i*3,3.8,-.6,'y',dry,28);box(1.6,1.2,1.2,EBL,1.5,1.4,-2.6,dry);
 const ex=grp(DL/2+.8,0,0,0,dry);box(1.6,1.4,3.4,EBL,0,.9,0,ex);box(1.4,.5,3,mat(0xf6e7c6,{roughness:.9}),0,1.85,0,ex);
 const c=grp(-TL/2+1.2,0,3.1,0,g);box(.9,2.3,.7,mat(0xaab3bb,{roughness:.4,metalness:.3}),0,1.15,0,c);box(.5,.32,.02,mat(0x3b82f6,{emissive:0x1e40af,emissiveIntensity:.6}),0,1.9,.37,c);
 A.push(t=>{const P=5.75,pt=t%P,n=Math.floor(t/P),cum=n+sm(pt/1.6);const lift=pt<1.6?1:pt<2?1-sm((pt-1.6)/.4):pt<5.05?0:pt<5.45?sm((pt-5.05)/.4):1;
  const tz=pt<2?-1.2:pt<3.47?-1.2+2.4*sm((pt-2)/1.47):pt<3.87?1.2:pt<5.05?1.2-2.4*sm((pt-3.87)/1.18):-1.2;const off=-cum*PS/6;bt.offset.x=off;ft.offset.x=off;fi.offset.x=off;fo.offset.x=off;
  frs.forEach(s=>s.position.y=1.12+.15*lift);trs.forEach(q=>q.position.z=tz);
  A.status='Flatbed cycle: '+(pt<1.6?'blanket advances':pt<2?'screens lowering':pt<3.47?'squeegee stroke across the fabric':pt<5.05?'flood return':'screens lifting')})}
// digital inkjet printer
function digital(g,A,w,name){box(w,.5,3.8,OR,0,.25,0,g);box(w,2.6,3.6,NV,0,1.8,-.1,g);box(w+.05,.12,3.7,OR,0,3.15,-.1,g);box(w*.6,1.1,.08,GL,-w*.12,2.2,1.74,g);box(1.3,3.1,3.4,NV,w/2-.3,1.85,-.1,g);scr(.8,.6,w/2-.3,2.4,1.62,0x7dd3fc,g);
 const lb=new T.Mesh(new T.PlaneGeometry(2.4,.45),new T.MeshBasicMaterial({map:spriteTex(name,'#e8eef5','#2d3b4e',256,48,'italic bold 30px Arial')}));lb.position.set(-w/2+1.6,3,1.74);g.add(lb);
 const cr=box(.7,.4,.5,OR,0,2.5,.4,g);const t2=ftex('print');t2.repeat.set(w/8,1);const dr=new T.Mesh(new T.PlaneGeometry(w*.55,1.6),new T.MeshStandardMaterial({map:t2,side:2,roughness:.9}));dr.position.set(-w*.12,.95,2);dr.rotation.x=-.12;g.add(dr);cyl(.3,w*.6,mat(0xf0ead6),-w*.12,.35,2.3,'x',g,20);
 A.push((t,dt)=>{cr.position.x=-w*.12+Math.sin(t*1.6)*w*.25;t2.offset.y-=dt*.25;A.status='Inkjet carriage printing · no screens needed'})}
// finishing stenter
function stenter(g,A,len,n){const cw=len/n,chim=[];box(len,.35,6,GR,0,.3,0,g);
 for(let i=0;i<n;i++){const px=-len/2+cw*(i+.5);box(cw-.12,2.5,5.6,mat(0xc9ced4,{metalness:.75,roughness:.35}),px,1.8,0,g);box(cw-.3,.2,5.8,ST,px,3.1,0,g);
  cyl(.4,2.4,STd,px,4.5,-1.5,'y',g,16);cyl(.45,.4,ST,px,3.4,-1.5,'y',g,16);cyl(.34,.61,ST,px,3.8,1.8,'y',g,18);cyl(.34,2,ST,px,3.8,.5,'z',g,18);
  const elb=new T.Mesh(new T.TorusGeometry(.8,.34,12,18,PI/2),ST);elb.position.set(px,4.6,-.4);elb.rotation.set(0,PI/2,0);g.add(elb);
  for(let k=0;k<3;k++)box(.7,.5,.08,GR,px-cw*.25+k*.7,1.5,2.84,g);box(.9,1.1,.06,mat(0x5a6470,{metalness:.8,roughness:.4}),px,1.7,2.85,g);
  chim.push(sph(.35,mat(0xffffff,{transparent:true,opacity:.0,roughness:1}),px,5.8,-1.5,1,1,1,g))}
 const inl=grp(-len/2-3,0,0,0,g);for(const s of[-2.5,2.5])box(.3,2.8,.3,GR,0,1.4,s,inl);box(.3,.3,5.3,GR,0,2.8,0,inl);roll(1.1,4.6,-len/2-5.4,1.3,0,0xe4ecf5,g);
 fabIn(A,-len/2-4.5,1.3,-len/2,1.3,0,4.8,'dyed','#e4ecf5',1.6,g);roll(1.1,4.6,len/2+4.8,1.3,0,0xece4d2,g);fabIn(A,len/2,1.3,len/2+3.7,1.3,0,4.8,'dyed','#f2eee2',1.6,g);box(len,.1,.1,YL,0,1.3,-2.9,g);
 A.push(t=>{chim.forEach((c,i)=>{const p=((t*.4+i*.17)%1);c.position.y=5.8+p*3;c.material.opacity=.35*(1-p);c.scale.setScalar(1+p*1.5)});A.status='Heat-setting & width control · '+n+' chambers at 180 °C'})}
// A-frame batching trolley
function batcher(p,o){o=o||{};const col=mat(o.col||0x1f6fd0,{roughness:.42,metalness:.15});const g=new T.Group();p.add(g);const L=3.7,W=1.12,sY=1.42;
 for(const s of[-1,1])box(L,.1,.06,col,0,.32,s*W/2,g);for(const e of[-1,0,1])box(.06,.1,W,col,e*(L/2-.03),.32,0,g);
 for(const ex of[-1,1])for(const s of[-1,1])cyl(.1,.06,mat(0x2a2d31,{roughness:.8}),ex*(L/2-.14),.1,s*(W/2-.03),'z',g,20);
 for(const e of[-1,1]){const a=grp(e*(L/2-.22),0,0,0,g);for(const s of[-1,1])strut([0,.36,s*(W/2-.05)],[0,sY-.14,s*.2],.09,col,a);box(.12,.1,.6,col,0,sY-.13,0,a);box(.28,.2,.3,STd,0,sY-.02,0,a)}
 cyl(.075,L-.1,ST,0,sY,0,'x',g,20);cyl(.2,.07,mat(0x23272c),-(L/2-.5),sY,0,'x',g,24);
 if(o.fab!==null){cyl(o.r||.62,2.4,mat(o.fab==null?0xf4efe2:o.fab,{roughness:.95,bumpMap:weave,bumpScale:.12}),0,sY,0,'x',g,40)}
 tube([[-L/2+.12,.5,W/2-.06],[-L/2-.12,.62,W/2-.1],[-L/2-.12,.62,-W/2+.1],[-L/2+.12,.5,-W/2+.06]],col,.022,g);return g}
function trolleyBay(g,A){const F=[0xf4efe2,0x1b2a4a,0xb3262e,0xe8e2d0];for(let i=0;i<4;i++){const b=batcher(g,{col:[0x1f6fd0,0xf6c21a][i%2],fab:F[i]});b.scale.setScalar(.75);b.position.set(0,0,-2.4+i*1.6)}
 box(3.4,.03,.12,YL,0,.04,-3.4,g);box(3.4,.03,.12,YL,0,.04,3.4,g);A.status='WIP buffer: 4 batching trolleys'}
// utilities
function boiler(g,A){const RED=mat(0xb33a2c,{roughness:.45});vessel(1.4,4.6,RED,0,1.9,0,g);for(const sx of[-1.8,1.8])box(.5,.9,2.4,GR,sx,.45,0,g);box(1.4,1.6,1.6,NV,-3.6,.8,0,g);cyl(.35,1.2,ST,-3.6,2,0,'y',g,16);
 cyl(.45,8,STd,3.4,4,-1,'y',g,20);cyl(.2,4.8,ST,0,3.6,0,'x',g,12);box(.8,1.6,.6,CR,2.8,.8,1.6,g);scr(.4,.3,2.8,1.2,1.92,0x38bdf8,g);
 const puffs=[];for(let i=0;i<4;i++)puffs.push(sph(.5,mat(0xf8f8f8,{transparent:true,opacity:0,roughness:1}),3.4,8.2,-1,1,1,1,g));
 A.push(t=>{puffs.forEach((p,i)=>{const q=(t*.25+i/4)%1;p.position.y=8.2+q*5;p.position.x=3.4+q*1.5;p.material.opacity=.45*(1-q);p.scale.setScalar(1+q*2)});A.status='Steam on line: 10 bar'})}
function etp(g,A){const CON=mat(0xb8bcc0,{roughness:.8}),WAT=mat(0x4f7f6a,{roughness:.1,metalness:.2});const arms=[];
 for(const sx of[-3.2,3.2]){cyl(2.6,1.3,CON,sx,.65,0,'y',g,40);cyl(2.4,.05,WAT,sx,1.25,0,'y',g,40);const a=grp(sx,1.45,0,0,g);box(5,.18,.4,YL,0,0,0,a);cyl(.25,.6,ST,0,.2,0,'y',a,14);arms.push(a)}
 box(5,1.2,3,CON,0,.6,4.2,g);box(4.6,.05,2.6,mat(0x6f8f60,{roughness:.2}),0,1.21,4.2,g);const bub=[];for(let i=0;i<8;i++)bub.push(sph(.12,mat(0xffffff,{transparent:true,opacity:.7}),-2+i*.55,1.25,4.2+((i*7)%5-2)*.4,1,1,1,g));
 box(2,2.4,2,CR,7.2,1.2,4,g);A.push((t,dt)=>{arms.forEach(a=>a.rotation.y+=dt*.3);bub.forEach((b,i)=>b.position.y=1.25+Math.abs(Math.sin(t*3+i))*.2);A.status='Treating effluent: clarifiers turning'})}
function qcLab(g,A){box(6,3,4,WH,0,1.5,0,g);box(6.1,.2,4.1,BL,0,3.1,0,g);box(4.6,1,.05,GL,0,1.9,2.02,g);box(1,2.1,.06,mat(0x5a6470),2.3,1.05,2.02,g);box(1.2,.7,.6,GR,-2,3.5,0,g);
 const s1=scr(.6,.4,-1.2,1.6,1.9,0x38bdf8,g),s2=scr(.6,.4,0,1.6,1.9,0x22c55e,g),s3=scr(.6,.4,1.2,1.6,1.9,0xf97316,g);A.push(t=>{[s1,s2,s3].forEach((s,i)=>s.material.emissiveIntensity=.6+.5*Math.sin(t*2+i*2));A.status='Testing fastness, GSM & shrinkage'})}

// =====================================================================
// PLANT LAYOUT: slab, departments, floor grid
// =====================================================================
const X0=-60,X1=90,Z0=-44,Z1=40;
const ZONES={
 lab:{name:'Lab / dispensing',r:[-60,-33,-44,-16],c:0xf0e385,tc:'#fde68a'},
 dye:{name:'Dyeing hall',r:[-33,-4,-44,-16],c:0x9ad8c9,tc:'#67e8f9'},
 finish:{name:'Finishing dept',r:[-4,90,-44,-16],c:0xb4d0e8,tc:'#fca5a5'},
 kitchen:{name:'Colour kitchen',r:[-60,-20,-16,0],c:0xd8c4f0,tc:'#d8b4fe'},
 trolley:{name:'Trolley storage',r:[-60,-45,0,40],c:0xb4dca8,tc:'#fdba74'},
 engrave:{name:'Screen engraving',r:[-45,-20,0,40],c:0xc9b6e8,tc:'#f0abfc'},
 rotary:{name:'Rotary printing',r:[-20,30,-16,40],c:0xf0c895,tc:'#fcd34d'},
 prep:{name:'Preparatory',r:[30,90,-16,14],c:0xe8d8b0,tc:'#bef264'},
 flat:{name:'Flatbed & digital',r:[30,90,14,40],c:0xe8b0d4,tc:'#7dd3fc'}};
function zone(x0,x1,z0,z1,col,y,h){const w=x1-x0,d=z1-z0;const t=concrete.clone();t.needsUpdate=true;t.repeat.set(w/6,d/6);const m=new T.Mesh(new T.BoxGeometry(w,h,d),new T.MeshStandardMaterial({color:col,map:t,roughness:.42,metalness:0,bumpMap:t,bumpScale:.3}));m.position.set((x0+x1)/2,y+h/2,(z0+z1)/2);m.receiveShadow=true;m.raycast=()=>{};S.add(m);return m}
{const base=new T.Mesh(new T.BoxGeometry(X1-X0,1,Z1-Z0),mat(0xb9a58f,{roughness:.7}));base.position.set((X0+X1)/2,-.5,(Z0+Z1)/2);base.receiveShadow=true;S.add(base);
 zone(X0,X1,Z0,Z1,0xc9d3dc,0,.05);for(const k in ZONES){const z=ZONES[k],r=z.r;zone(r[0]+.15,r[1]-.15,r[2]+.15,r[3]-.15,z.c,.05,.04);tag(z.name,(r[0]+r[1])/2,9,(r[2]+r[3])/2,z.tc)}
 const TS=6,pts=[];for(let x=X0;x<=X1+.01;x+=TS)pts.push(x,.13,Z0,x,.13,Z1);for(let z=Z0;z<=Z1+.01;z+=TS)pts.push(X0,.13,z,X1,.13,z);
 const gg=new T.BufferGeometry();gg.setAttribute('position',new T.Float32BufferAttribute(pts,3));S.add(new T.LineSegments(gg,new T.LineBasicMaterial({color:0x5b6670,transparent:true,opacity:.35})));
 const dl=(txt,x,z,big)=>{const m=new T.Mesh(new T.PlaneGeometry(big?7:3.6,big?1.75:.9),new T.MeshBasicMaterial({map:spriteTex(txt,big?'#111':'#e8eef5',big?'rgba(242,177,52,.95)':'rgba(18,24,32,.85)',256,64,'bold 36px Arial'),transparent:true}));m.rotation.x=-PI/2;m.position.set(x,.2,z);S.add(m);return m};
 for(let x=X0;x<X1-.01;x+=TS)dl(Math.min(TS,X1-x)+' m',x+Math.min(TS,X1-x)/2,Z1+1.6);
 for(let z=Z0;z<Z1-.01;z+=TS){const d=Math.min(TS,Z1-z);dl(d+' m',X1+1.6,z+d/2).rotation.z=-PI/2}
 dl('Plant length '+(X1-X0)+' m',(X0+X1)/2,Z1+3.8,true);dl('Plant width '+(Z1-Z0)+' m',X1+3.8,(Z0+Z1)/2,true).rotation.z=-PI/2;
 const dm=new T.LineBasicMaterial({color:0xf2b134});for(const p of[[X0,.15,Z1+2.7,X1,.15,Z1+2.7],[X1+2.7,.15,Z0,X1+2.7,.15,Z1]]){const g2=new T.BufferGeometry();g2.setAttribute('position',new T.Float32BufferAttribute(p,3));S.add(new T.Line(g2,dm))}
 // blue dye supply pipe along the dyeing hall wall (as in the layout)
 tube([[-33,6.5,-43],[-5,6.5,-43]],mat(0x1c8cff,{roughness:.35,emissive:0x0a4fa0,emissiveIntensity:.4}),.18)}

// =====================================================================
// GAME DATA
// =====================================================================
const MAT={greige:'Greige',scoured:'Scoured',rfd:'Ready-for-dyeing/printing',dyed:'Dyed',printed:'Printed',fd:'Finished dyed',fp:'Finished printed',recipe:'Dye recipes',paste:'Print paste',screens:'Engraved screens'};
const CAP={recipe:30,paste:30,screens:20,scoured:60,rfd:60,dyed:60,printed:60};
// Machine models: Fable Machine Models library (detailed GLB models), plus the A-frame trolley and ETP clarifier / DAF unit
// from the Machine Spares Explorer catalogue. Each def keeps a procedural builder (b) as a fallback if its model can't load.
const DEF={
 desize:{name:'Gas singeing machine',zone:'prep',icon:'🔥',cost:9000,up:450,time:6,need:{greige:1},out:{scoured:1},glb:'gas_singeing',ph:['Brushing & dust extraction','Burners singeing the face','Quench & cooling','Batching'],b:(g,A)=>prepRange(g,A,{L:12,n:4,acc:mat(0x4a8a6a,{roughness:.45}),kind:'grey',inCol:0xe6e0cf,outCol:0xefe8d6}),desc:'Gas burners singe protruding fibres off greige cloth, then the fabric is quenched and batched for pretreatment.'},
 bleach:{name:'Desize, scour & bleach range',zone:'prep',icon:'⚪',cost:16000,up:700,time:6,need:{scoured:1},out:{rfd:1},glb:'bleaching_range',ph:['Desize impregnation','Steaming','Hot washing','Peroxide bleaching','Final wash & dry'],b:(g,A)=>prepRange(g,A,{L:14,n:3,jbox:1,acc:mat(0x7090b0,{roughness:.45}),kind:'dyed',col:'#f6f8fa',inCol:0xefe8d6,outCol:0xf8fafc}),desc:'Continuous 2000 mm range: desizing, scouring and peroxide bleaching with steamers and washers. Its output, PFD fabric, feeds dyeing and printing.'},
 station:{name:'Automatic dye dispensing system',zone:'lab',icon:'⚖️',cost:4500,up:180,time:5,need:{},out:{recipe:1},glb:'lab_dispenser',ph:['Reading recipe','Dosing dye solutions','Weighing check','Recipe ready'],b:(g,A)=>station(g,A),desc:'Automatic dye and chemical dispensing: doses each recipe for the jets and jiggers.'},
 chem:{name:'Powder dissolving system',zone:'lab',icon:'🛢️',cost:6000,up:150,util:1,glb:'powder_dissolving_system',ph:['Dissolving & stirring'],b:(g,A)=>platform(g,A,3,0x2f6fb5),desc:'Stirred dissolving tanks for dyes and chemicals. Each one speeds up all jets and jiggers by 10% (max 2).'},
 jet:{name:'HT jet dyeing machine',zone:'dye',icon:'🌀',cost:16000,up:850,time:12,need:{rfd:1,recipe:1},out:{dyed:1},glb:'jet_dyeing',ph:['Loading & filling','Heating to 130 °C','Dyeing at 130 °C','Cooling & rinsing','Unloading'],b:(g,A)=>jet(g,A),desc:'High-temperature soft-flow / jet rope dyeing machine. Needs PFD fabric + a dye recipe.'},
 jigger:{name:'HTHP jigger',zone:'dye',icon:'🔄',cost:9000,up:450,time:16,need:{rfd:1,recipe:1},out:{dyed:1},glb:'hthp_jigger',ph:['Batching on','Dyeing passes','Rinsing passes','Batching off'],b:(g,A)=>jet(g,A),desc:'High-temperature, high-pressure jigger: open-width dyeing for woven fabric. Cheaper than a jet but slower.'},
 kitchen:{name:'Colour weighing & recipe station',zone:'kitchen',icon:'🎨',cost:7000,up:300,time:6,need:{},out:{paste:1},glb:'colour_weighing_station',ph:['Weighing thickener','Adding colours','Mixing paste'],b:(g,A)=>kitchen(g,A),desc:'Colour kitchen weighing and recipe station: mixes print paste for the print lines.'},
 autokit:{name:'Auto print paste dispensing (24 colours)',zone:'kitchen',icon:'🤖',cost:18000,up:600,time:3,need:{},out:{paste:1},research:'autokit',glb:'auto_colour_dispensing',ph:['Recipe from formula','Dispensing 24 colours','Stirring','Bucket ready'],b:(g,A)=>autoKitchen(g,A),desc:'Automatic print paste dispensing with 24 colour lines — twice as fast as manual weighing.'},
 coater:{name:'Rotary screen lacquering machine',zone:'engrave',icon:'🖌️',cost:6000,up:250,time:14,need:{},out:{screens:1},glb:'screen_lacquering_machine',ph:['Degreasing','Ring squeegee coating','Drying','Screen ready'],b:(g,A)=>coaterSet(g,A),desc:'Ring-squeegee coater: lacquers rotary screens with emulsion before exposing.'},
 laser:{name:'Rotary screen laser engraver',zone:'engrave',icon:'⚡',cost:20000,up:700,time:6,need:{},out:{screens:1},research:'laser',glb:'rotary_screen_engraver',ph:['Loading design file','Laser engraving','Unloading screen'],b:(g,A)=>engraver(g,A),desc:'3.2 m laser / inkjet CTS engraver: exposes screens straight from the design file.'},
 baby:{name:'Baby rotary sampling machine',zone:'rotary',icon:'🖨️',cost:14000,up:650,time:13,need:{rfd:1,paste:1,screens:.25},out:{printed:1},glb:'baby_rotary_sampling_machine',ph:['Fabric on blanket','Printing 2 colours','Drying','Batching'],b:(g,A)=>rotary(g,A,{len:10,heads:4,dry:0,sp:2.4}),desc:'2-colour baby rotary for samples and short runs. Needs PFD fabric, print paste and screens.'},
 rotary:{name:'Infinium TD rotary, 8 colour',zone:'rotary',icon:'🖨️',cost:45000,up:1700,time:5,need:{rfd:1,paste:1,screens:.1},out:{printed:1},research:'rotary',glb:'infinium_td_8c_gas',ph:['Infeed & gluing to blanket','Printing 8 colours','Gas-fired drying','Plaiting'],b:(g,A)=>rotary(g,A,{len:16,heads:8,dry:12,dryCol:mat(0xf5d90a,{roughness:.35}),sp:3.2}),desc:'Embee Infinium TD 8-colour, 1620 mm rotary printing machine with gas-fired dryer.'},
 flatbed:{name:'Automatic flatbed screen printer',zone:'flat',icon:'📋',cost:38000,up:1400,time:8,need:{rfd:1,paste:1,screens:.15},out:{printed:1},research:'flatbed',glb:'flatbed_screen_printer',ph:['Blanket advances','Screens lowering','Squeegee stroke','Screens lifting','Drying'],b:(g,A)=>flatbed(g,A),desc:'10-colour, 1800 mm automatic flatbed with stop-and-go blanket and dryer.'},
 digital:{name:'Wide-format inkjet printer',zone:'flat',icon:'💻',cost:30000,up:1100,time:7,need:{rfd:1,paste:.25},out:{printed:1},research:'digital',glb:'wide_format_printer',ph:['Loading roll','Inkjet passes','Curing','Rewinding'],b:(g,A)=>digital(g,A,9.5,'INKJET'),desc:'3.2 m roll-to-roll inkjet printer — no screens, very little paste.'},
 stenter:{name:'Stenter, 6 chamber',zone:'finish',icon:'📏',cost:30000,up:1300,time:7,stenter:1,need:{},out:{},glb:'stenter_ekta_6ch',ph:['Padding finish','Pinning on chains','Drying in 6 chambers','Cooling & batching'],b:(g,A)=>stenter(g,A,16,6),desc:'6-chamber pin-cum-clip gas-fired stenter. Finishes dyed or printed fabric for delivery.'},
 bay:{name:'Batching trolley bay',zone:'trolley',icon:'🛒',cost:3000,up:40,util:1,glb:[{f:'batching_trolley',x:0,z:-2.25},{f:'batching_trolley',x:0,z:-.75},{f:'batching_trolley',x:0,z:.75},{f:'batching_trolley',x:0,z:2.25}],ph:['WIP buffer: 4 trolleys'],b:(g,A)=>trolleyBay(g,A),desc:'Four channel-type batching trolleys buffer WIP between departments. +5% plant speed each (max 3) and more trolleys on the aisle.'},
 boiler:{name:'Electric steam boiler',zone:'any',icon:'♨️',cost:12000,up:500,util:1,glb:'electric_steam_boiler',ph:['Steam on line: 10 bar'],b:(g,A)=>boiler(g,A),desc:'500 kg/h steam for preparatory, dyeing and finishing. +15% speed on those machines.'},
 etp:{name:'Effluent treatment plant',zone:'any',icon:'♻️',cost:16000,up:600,util:1,research:'etp',glb:[{f:'etp_clarifier',x:0,z:0},{f:'daf_unit',x:0,z:9.5}],ph:['Clarifying & flotation'],b:(g,A)=>etp(g,A),desc:'Clarifier and DAF flotation unit. Needed for reputation above 70 and for export orders.'},
 qc:{name:'Fabric inspection machine',zone:'any',icon:'🔬',cost:7000,up:300,util:1,glb:'inspection_machine',ph:['Inspecting & grading'],b:(g,A)=>qcLab(g,A),desc:'Batch-to-roll inspection: grades every lot. +1 reputation a month and +5% order value.'}};
const DEPTS=[['prep',['desize','bleach']],['lab',['station','chem']],['dye',['jet','jigger']],['kitchen',['kitchen','autokit']],['engrave',['coater','laser']],['rotary',['baby','rotary']],['flat',['flatbed','digital']],['finish',['stenter']],['trolley',['bay']],['any',['boiler','etp','qc']]];
const RESEARCH=[
 {id:'rotary',name:'Production rotary',desc:'8-head rotary line with dryer — the volume printer.',cost:20000,icon:'🖨️'},
 {id:'flatbed',name:'Flatbed printing',desc:'Stop-and-go flatbed printer for large repeats.',cost:22000,icon:'📋',req:'rotary'},
 {id:'digital',name:'Digital printing',desc:'Inkjet printing, no screens needed.',cost:28000,icon:'💻',req:'flatbed'},
 {id:'autokit',name:'Auto colour dispensing',desc:'Computer-controlled colour kitchen, 2× speed.',cost:12000,icon:'🤖'},
 {id:'laser',name:'Laser engraving',desc:'Laser screen exposure — screens in under half the time.',cost:15000,icon:'⚡'},
 {id:'etp',name:'Effluent treatment',desc:'Unlock the ETP: reputation above 70, export orders.',cost:15000,icon:'♻️'},
 {id:'export',name:'Export marketing',desc:'Export buyers pay 1.5× — needs a running ETP.',cost:10000,icon:'🌍',req:'etp'},
 {id:'market',name:'Domestic marketing',desc:'More orders arrive each month.',cost:8000,icon:'📰'},
 {id:'lean',name:'Lean maintenance',desc:'−15% machine upkeep and half the breakdowns.',cost:12000,icon:'🔧'}];
const VIEWS=[
 ['Overview',[15,0,-2],190,.62,.92,'Your integrated plant (one-way trolley loops in yellow lanes): preparatory, lab & dispensing, dyeing hall, colour kitchen, screen engraving, rotary printing, flatbed & digital bay, finishing and trolley storage. Pick a machine in Build and place it in its department.'],
 ['Preparatory',[60,2,-1],70,.6,.85,'Gas singeing, then the continuous desize, scour & bleach range. Its output, PFD fabric, feeds both dyeing and printing.'],
 ['Dyeing dept',[-34,2,-30],62,.7,.9,'Left room: automatic dye dispensing systems and powder dissolving tanks make the recipes. Right hall: HT jets and HTHP jiggers turn PFD fabric + a recipe into dyed fabric.'],
 ['Colour kitchen',[-40,2,-8],48,.5,.85,'Colour weighing & recipe stations and the 24-colour auto paste dispenser make print paste for every print line.'],
 ['Screen engraving',[-32,1.5,20],62,.5,.85,'Rotary screen lacquering machines and the laser engraver make the screens the rotary and flatbed lines wear out.'],
 ['Rotary printing',[5,2,12],80,.55,.85,'Baby rotary for samples and the Embee Infinium TD 8-colour rotary for production, with its gas-fired dryer.'],
 ['Trolley loops',[0,0,-16],95,.35,.8,'Plant rules: trolleys run on one-way loops, equally spaced at walking pace (1.2 m/s), so no trolley ever meets another. One person pushes each trolley, and its total load stays within 300 kg. Lanes stay clear: no machine may stand on a yellow lane.'],
 ['Trolley storage',[-52,1,18],46,.6,.9,'Channel-type batching trolleys buffer work-in-progress. More bays put more trolleys on the aisle and speed up the plant.'],
 ['Flatbed & digital',[60,1.5,27],55,.55,.8,'10-colour automatic flatbed screen printer and wide-format inkjet printers.'],
 ['Finishing',[40,5,-30],90,.6,.8,'6-chamber pin-cum-clip stenters heat-set, dry and width-control dyed or printed fabric into deliverable finished goods.']];

// =====================================================================
// GAME STATE
// =====================================================================
let MONTH=60; // seconds of game time per month
let G,machines=[],MID=0;
function freshState(){return{money:40000,workers:9,month:0,dayT:0,speed:1,rep:50,revenue:0,research:{},inv:{greige:20,scoured:0,rfd:4,dyed:0,printed:0,fd:0,fp:0,recipe:3,paste:3,screens:3},orders:[],nextOrder:1,greige:250,loan:0,hist:[]}}
const fmt=n=>'$'+Math.round(n).toLocaleString();
const unlocked=k=>{const d=DEF[k];return !d.research||!!G.research[d.research]};

// ---------- building models & placement ----------
const MODELS={},MODEL_ERR={};
function buildModel(def){const outer=new T.Group(),inner=new T.Group();outer.add(inner);const A=[];
 const parts=def.glb?(typeof def.glb==='string'?[{f:def.glb,x:0,z:0}]:def.glb):[];
 if(parts.length&&parts.every(p=>MODELS[p.f])){for(const p of parts){const c=MODELS[p.f].clone();c.position.set(p.x||0,0,p.z||0);c.rotation.y=p.ry||0;inner.add(c)}
  const ph=def.ph||['Running'];A.push((t,dt,m)=>{const f=m&&def.time?m.progress/def.time:(t/20)%1;A.status=ph[Math.min(ph.length-1,Math.floor(f*ph.length))]+(def.time?' · '+Math.round(f*100)+'%':'')})}
 else{def.b(inner,A);if(def.sc)inner.scale.set(...def.sc)}
 inner.updateMatrixWorld(true);const bb=new T.Box3().setFromObject(inner),c=bb.getCenter(new T.Vector3()),s=bb.getSize(new T.Vector3());
 inner.position.x-=c.x;inner.position.z-=c.z;inner.position.y-=Math.min(0,bb.min.y);if(!def.w){def.w=Math.ceil(s.x+.3);def.d=Math.ceil(s.z+.3);def.h=s.y}return{outer,A}}
// load a library model (base64 gzip GLB) and merge its meshes by material so a plant full of detailed machines stays fast
const MODEL_SCALE={batching_trolley:.001};
async function loadModel(f){const r=await fetch('models/'+f+'.txt');if(!r.ok)throw new Error(f+' missing');const bin=Uint8Array.from(atob((await r.text()).trim()),ch=>ch.charCodeAt(0));
 const buf=await new Response(new Blob([bin]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer();
 const scene=await new Promise((res,rej)=>new T.GLTFLoader().parse(buf,'',g=>res(g.scene),rej));scene.updateMatrixWorld(true);
 const groups=new Map();scene.traverse(o=>{if(!o.isMesh||!o.geometry)return;let g=o.geometry.clone();g.applyMatrix4(o.matrixWorld);for(const k of Object.keys(g.attributes))if(!['position','normal','uv'].includes(k))g.deleteAttribute(k);if(!g.attributes.normal)g.computeVertexNormals();if(g.index)g=g.toNonIndexed();
  const mt=Array.isArray(o.material)?o.material[0]:o.material,key=mt.uuid+'|'+Object.keys(g.attributes).sort().join(',');if(!groups.has(key))groups.set(key,{mt,gs:[]});groups.get(key).gs.push(g)});
 const out=new T.Group();for(const{mt,gs}of groups.values()){const mg=T.BufferGeometryUtils.mergeBufferGeometries(gs,false);if(!mg)continue;if(MODEL_SCALE[f])mg.scale(MODEL_SCALE[f],MODEL_SCALE[f],MODEL_SCALE[f]);const m=new T.Mesh(mg,mt);m.castShadow=m.receiveShadow=!mt.transparent;if(mt.transparent)mt.depthWrite=false;out.add(m)}
 return out}
function dims(def,rot){if(!def.w)buildModel(def);return rot%2?[def.d,def.w]:[def.w,def.d]}
function zoneOf(x,z){for(const k in ZONES){const r=ZONES[k].r;if(x>=r[0]&&x<=r[1]&&z>=r[2]&&z<=r[3])return k}return null}
function rectOK(def,x,z,rot,ignore){const[w,d]=dims(def,rot),a=[x-w/2,x+w/2,z-d/2,z+d/2];
 if(def.zone==='any'){if(a[0]<X0||a[1]>X1||a[2]<Z0||a[3]>Z1)return 'Outside the plant'}
 else{const r=ZONES[def.zone].r;if(a[0]<r[0]||a[1]>r[1]||a[2]<r[2]||a[3]>r[3])return 'Must stand inside '+ZONES[def.zone].name}
 for(const l of LANES)if(a[0]<l[1]&&a[1]>l[0]&&a[2]<l[3]&&a[3]>l[2])return 'Keep the trolley lane clear';
 for(const m of machines){if(m===ignore)continue;const[w2,d2]=dims(m.def,m.rot);if(Math.abs(m.x-x)*2<w+w2+1&&Math.abs(m.z-z)*2<d+d2+1)return 'Too close to '+m.name}
 return ''}
const ghostMat=new T.MeshBasicMaterial({color:0x4ade80,transparent:true,opacity:.35,depthWrite:false});
const labelCache={};
function setLabel(m,text,col){const k=text+'|'+col;if(m.lk===k)return;m.lk=k;if(!labelCache[k])labelCache[k]=spriteTex(text,col,'rgba(18,24,32,.82)',360,56,'bold 24px Trebuchet MS');m.lab.material.map=labelCache[k];m.lab.material.needsUpdate=true}
function addMachine(type,x,z,rot,o){o=o||{};const def=DEF[type];const{outer,A}=buildModel(def);outer.position.set(x,0,z);outer.rotation.y=rot*PI/2;S.add(outer);
 const n=machines.filter(q=>q.type===type).length+1;
 const m={id:++MID,type,def,x,z,rot,g:outer,A,mt:Math.random()*20,progress:0,hold:false,worker:false,broken:!!o.broken,level:o.level||1,produced:o.produced||0,col:null,name:o.name||def.name+(n>1?' #'+n:''),status:'',running:false,mats:null};
 outer.traverse(q=>{q.userData.mid=m.id});
 const bb0=new T.Box3().setFromObject(outer);m.beacon=new T.Group();cyl(.04,.9,STd,0,.45,0,'y',m.beacon,8);m.lamp=sph(.16,mat(0x22c55e,{emissive:0x22c55e,emissiveIntensity:1}),0,1,0,1,1,1,m.beacon);m.beacon.position.set(bb0.max.x-x-.4,bb0.max.y,bb0.min.z-z+.4);m.beacon.traverse(q=>{q.raycast=()=>{}});outer.add(m.beacon);
 if(type!=='bay'){const w=mkWorker(uniformFor(m));w.root.position.set(0,0,(def.d||4)/2+.6);w.root.rotation.y=PI;outer.add(w.root);m.op=w}
 m.lab=new T.Sprite(new T.SpriteMaterial({depthTest:false,transparent:true}));m.lab.scale.set(7.2,1.12,1);m.lab.position.set(0,(def.h||4)+1.4,0);m.lab.renderOrder=8;m.lab.raycast=()=>{};m.lab.visible=showLabels;outer.add(m.lab);
 machines.push(m);if(o.col)paint(m,o.col);return m}
function removeMachine(m){S.remove(m.g);if(m.op)WKS.splice(WKS.indexOf(m.op),1);machines=machines.filter(q=>q!==m);if(sel===m)select(null)}

// ---------- painting (machine editor) ----------
function paintables(m){if(m.mats)return m.mats;const list=[],seen=new Map();
 m.g.traverse(q=>{if(!q.isMesh||!q.material||Array.isArray(q.material))return;const mt=q.material;if(mt.transparent||!mt.color||mt.map)return;const c=mt.color,L=.299*c.r+.587*c.g+.114*c.b;if(mt.metalness>.7||L<.04)return;
  let nm=seen.get(mt);if(!nm){nm=mt.clone();nm.userData.base=c.clone();nm.userData.L=L;seen.set(mt,nm)}q.material=nm;if(!list.includes(nm))list.push(nm)});
 let avg=0;list.forEach(x=>avg+=x.userData.L);m.avg=list.length?avg/list.length:1;m.mats=list;return list}
function paint(m,hex){m.col=hex;const tc=new T.Color(hex);paintables(m).forEach(x=>{const k=Math.min(1.5,Math.max(.55,x.userData.L/m.avg));x.color.setRGB(Math.min(1,tc.r*k),Math.min(1,tc.g*k),Math.min(1,tc.b*k))})}
function unpaint(m){m.col=null;(m.mats||[]).forEach(x=>x.color.copy(x.userData.base))}

// =====================================================================
// MOTION RULES (as in Kibrom Plant 3D): one-way trolley loops — equal spacing + equal speed + one direction,
// so no trolley ever meets another; trolleys move at walking pace (1.2 m/s); one person pushes each trolley, never more,
// and a trolley's total load (fabric + tare) stays within 300 kg.
// =====================================================================
// Rule values, as in the Sheet "Textile Tycoon — Trolleys, Workers & Plant Rules" (Loops and Trolleys & crews tabs)
const RULES={speed:1.2,maxLoad:300,crew:[[300,1]],
 loops:{A:{start:3,perBay:1,max:6,loads:[160,150,140,160,130,150],tare:140},B:{start:2,perBay:.5,max:4,loads:[150,160,150,160],tare:140},C:{start:2,perBay:0,max:2,loads:[220,180],tare:60}},
 text:[['Trolley loops','Trolleys run on closed one-way loops, equally spaced and at the same speed, so no trolley ever meets another.','Yellow lanes with direction arrows; the Trolley loops view'],
  ['Speed','Walking pace: 1.2 m/s at 1× game speed.','Trolleys on the loops'],
  ['Push crew','One person pushes each trolley, never two or more. A trolley\'s total load (fabric + trolley tare) stays within 300 kg, so one person can always push it.','Load tag on each trolley: "kg · 1 person"'],
  ['Clear lanes','No machine may stand on a yellow lane.','Build preview: "Keep the trolley lane clear"'],
  ['Operators','Each production machine needs one operator. Without one it stops and its operator disappears.','Machines; Operators stat in the sidebar'],
  ['Operator poses','Panel while running, stand while waiting for material, kneel with a spanner when broken. The inspector inspects.','At each machine'],
  ['Trolley count','More trolley bays put more trolleys on the wet-processing and printing loops.','Loops; trolleys on the floor'],
  ['Crews and wages','Push crews are visual only: they don\'t count as operators or cost wages.','Floor rules card on the Finance tab']]};
const GA=[];
function loopPath(pts){const P=pts.map(p=>new T.Vector3(p[0],0,p[1]));P.push(P[0]);const seg=[];let tot=0;for(let i=0;i<P.length-1;i++){const l=P[i].distanceTo(P[i+1]);seg.push([tot,l,i]);tot+=l}
 const at=d=>{d=((d%tot)+tot)%tot;for(const[s0,l,i]of seg)if(d<=s0+l+1e-6)return P[i].clone().lerp(P[i+1],(d-s0)/l);return P[0].clone()};
 const head=d=>{const a=at(d-.8),b=at(d+.8);return Math.atan2(b.x-a.x,b.z-a.z)};return{pts,tot,at,head}}
const LOOPS={
 A:Object.assign(loopPath([[-56,-17.2],[86,-17.2],[86,-14.8],[-56,-14.8]]),{name:'Wet-processing loop',kind:'batch',u:'sto',loads:RULES.loops.A.loads,tare:RULES.loops.A.tare,sp:RULES.speed}),
 B:Object.assign(loopPath([[28.8,-12.5],[28.8,38],[31.2,38],[31.2,-12.5]]),{name:'Printing loop',kind:'batch',u:'prt',loads:RULES.loops.B.loads,tare:RULES.loops.B.tare,sp:RULES.speed}),
 C:Object.assign(loopPath([[-21.2,-12.5],[-21.2,38],[-18.8,38],[-18.8,-12.5]]),{name:'Colour-drum loop',kind:'drum',u:'ck',loads:RULES.loops.C.loads,tare:RULES.loops.C.tare,sp:RULES.speed})};
const LANES=Object.values(LOOPS).map(L=>{const xs=L.pts.map(q=>q[0]),zs=L.pts.map(q=>q[1]);return[Math.min(...xs)-1.6,Math.max(...xs)+1.6,Math.min(...zs)-1.6,Math.max(...zs)+1.6]});
// lane markings: yellow edge lines and direction arrows
{const LM=mat(0xf5c400,{roughness:.6});for(const L of Object.values(LOOPS)){const xs=L.pts.map(q=>q[0]),zs=L.pts.map(q=>q[1]);const x0=Math.min(...xs)-1.1,x1=Math.max(...xs)+1.1,z0=Math.min(...zs)-1.1,z1=Math.max(...zs)+1.1;
 for(const[a,b,c,d]of[[x0,z0,x1,z0],[x0,z1,x1,z1],[x0,z0,x0,z1],[x1,z0,x1,z1]]){const len=Math.hypot(c-a,d-b);const m=box(a==c?.1:len,.012,a==c?len:.1,LM,0,0,0);m.position.set((a+c)/2,.11,(b+d)/2);m.raycast=()=>{}}
 for(let d=4;d<L.tot;d+=9){const q=L.at(d),h=L.head(d);const g=grp(q.x,.12,q.z,h);const ar=new T.Mesh(new T.ConeGeometry(.28,.6,3),LM);ar.rotation.x=PI/2;ar.scale.set(1,1,.05);g.add(ar);ar.raycast=()=>{}}}}
// ---------------- workers (department uniforms, articulated, posed) ----------------
const UNI={prep:['Preparation',0x0f9d8a],dye:['Dyeing',0x1d4ed8],fin:['Finishing',0x7c3aed],prt:['Printing',0xb91c1c],sto:['Stores & material handling',0x65a30d],ins:['Inspection',0xdb2777],
 chm:['Chemicals store',0xd97706],ck:['Colour kitchen',0x9a3412],eng:['Screen engraving',0x0891b2],lab:['Laboratory',0xe8eaee],utl:['Utilities',0x475569],etp:['ETP',0x166534],mnt:['Maintenance',0x1e3a5f]};
const WKS=[];const WMC=new Map();const WM=c=>{if(!WMC.has(c))WMC.set(c,new T.MeshStandardMaterial({color:c,roughness:.78}));return WMC.get(c)};
const WG={th:new T.BoxGeometry(.16,.45,.17),sh:new T.BoxGeometry(.13,.45,.15),ft:new T.BoxGeometry(.13,.07,.27),pl:new T.BoxGeometry(.38,.15,.22),to:new T.BoxGeometry(.42,.56,.24),
 ua:new T.BoxGeometry(.115,.30,.12),fa:new T.BoxGeometry(.10,.27,.10),ha:new T.SphereGeometry(.055,8,6),hd:new T.SphereGeometry(.11,14,10),nk:new T.CylinderGeometry(.05,.05,.08,8),
 hl:new T.SphereGeometry(.128,14,8,0,PI*2,0,PI/2),br:new T.CylinderGeometry(.15,.15,.015,16),bd:new T.BoxGeometry(.43,.045,.25)};
const SKIN=[0x8d5524,0x6b4423,0xa0673d,0x7a4a2a];
function wp(geo,m,x,y,z,p){const o=new T.Mesh(geo,m);o.position.set(x,y,z);o.castShadow=true;o.raycast=()=>{};p.add(o);return o}
function mkWorker(u){const shirt=UNI[u][1],pant=u==='mnt'?shirt:0x27303d,skin=WM(SKIN[WKS.length%4]),hand=(u==='mnt'||u==='etp')?WM(0x3f3f46):skin,helm=u==='mnt'?0x2563eb:u==='lab'?null:0xfacc15;
 const root=new T.Group(),hips=new T.Group();hips.position.y=.92;root.add(hips);wp(WG.pl,WM(pant),0,0,0,hips);const lp=[],kn=[],ap=[],el=[];
 for(const s of[-1,1]){const l=new T.Group();l.position.set(s*.1,-.03,0);hips.add(l);wp(WG.th,WM(pant),0,-.225,0,l);const k=new T.Group();k.position.y=-.45;l.add(k);wp(WG.sh,WM(pant),0,-.225,0,k);wp(WG.ft,WM(0x18181b),0,-.47,.05,k);lp.push(l);kn.push(k)}
 const torso=new T.Group();torso.position.y=.05;hips.add(torso);wp(WG.to,WM(shirt),0,.29,0,torso);if(u==='mnt'){wp(WG.bd,WM(0xd4ff3a),0,.2,0,torso);wp(WG.bd,WM(0xd4ff3a),0,.4,0,torso)}
 if(u==='lab')wp(new T.BoxGeometry(.44,.36,.255),WM(0xffffff),0,.04,0,torso);
 wp(WG.nk,skin,0,.6,0,torso);const head=new T.Group();head.position.y=.72;torso.add(head);wp(WG.hd,skin,0,0,0,head);if(helm!==null){wp(WG.hl,WM(helm),0,.035,0,head);wp(WG.br,WM(helm),0,.035,.02,head)}
 for(const s of[-1,1]){const a=new T.Group();a.position.set(s*.275,.52,0);torso.add(a);wp(WG.ua,WM(shirt),0,-.15,0,a);const e=new T.Group();e.position.y=-.3;a.add(e);wp(WG.fa,WM(shirt),0,-.135,0,e);wp(WG.ha,hand,0,-.29,0,e);ap.push(a);el.push(e)}
 const w={root,hips,torso,lp,kn,ap,el,head,u,ph:Math.random()*10};WKS.push(w);return w}
const POSES={
 walk(w,t){const f=t*5.6;w.lp[0].rotation.x=.42*Math.sin(f);w.lp[1].rotation.x=-.42*Math.sin(f);w.kn[0].rotation.x=.25+.25*Math.sin(f-1.2);w.kn[1].rotation.x=.25+.25*Math.sin(f+PI-1.2);
  w.ap[0].rotation.x=-.35*Math.sin(f);w.ap[1].rotation.x=.35*Math.sin(f);w.el[0].rotation.x=w.el[1].rotation.x=-.3;w.hips.position.y=.92+.02*Math.abs(Math.cos(f))},
 push(w,t){POSES.walk(w,t);w.ap[0].rotation.x=w.ap[1].rotation.x=-1.22;w.el[0].rotation.x=w.el[1].rotation.x=-.32;w.torso.rotation.x=.16},
 panel(w,t){w.ap[1].rotation.x=-1.0+.12*Math.sin(t*2);w.el[1].rotation.x=-.85+.18*Math.sin(t*4.2);w.ap[0].rotation.x=.05;w.el[0].rotation.x=-.15;w.head.rotation.y=.25*Math.sin(t*.45);w.hips.rotation.y=.05*Math.sin(t*.3)},
 inspect(w,t){w.ap[0].rotation.x=-.75;w.el[0].rotation.x=-1.25;w.ap[1].rotation.x=-.6;w.el[1].rotation.x=-1.45+.15*Math.sin(t*6);w.head.rotation.x=.35+.08*Math.sin(t*.6);w.head.rotation.y=.3*Math.sin(t*.35)},
 kneel(w,t){w.hips.position.y=.52;w.lp[0].rotation.x=-1.45;w.kn[0].rotation.x=1.45;w.lp[1].rotation.x=.08;w.kn[1].rotation.x=1.5;w.torso.rotation.x=.3;w.ap[1].rotation.x=-1.1+.28*Math.sin(t*4);w.el[1].rotation.x=-.7;w.ap[0].rotation.x=-.55;w.el[0].rotation.x=-.65},
 stand(w,t){w.ap[0].rotation.x=.05;w.ap[1].rotation.x=-.05;w.head.rotation.y=.4*Math.sin(t*.25);w.hips.rotation.y=.06*Math.sin(t*.2)}};
function resetPose(w){for(const o of[w.torso,w.head,w.hips,...w.lp,...w.kn,...w.ap,...w.el])o.rotation.set(0,0,0);w.hips.position.y=.92}
function spanner(w){if(!w.sp)w.sp=wp(new T.BoxGeometry(.035,.24,.018),WM(0x9ca3af),0,-.4,.03,w.el[1]);return w.sp}
const UNIFORM={prep:'prep',lab:'lab',dye:'dye',kitchen:'ck',engrave:'eng',rotary:'prt',flat:'prt',finish:'fin',trolley:'sto'};
function uniformFor(m){return m.type==='boiler'?'utl':m.type==='etp'?'etp':m.type==='qc'?'ins':m.type==='chem'?'chm':UNIFORM[m.def.zone]||'utl'}
// ---------------- trolleys + push crews on the loops ----------------
const MOV=new T.Group();S.add(MOV);let movers=[];
function crewFor(kg){return 1}
function loadTag(txt){const s=new T.Sprite(new T.SpriteMaterial({map:spriteTex(txt,'#fde68a','rgba(18,24,32,.85)',256,64,'bold 30px Arial'),transparent:true}));s.scale.set(1.5,.38,1);s.raycast=()=>{};return s}
function trolleyModel(kind){const g=new T.Group();const f=kind==='drum'?'colour_drum_trolley':'batching_trolley';
 if(MODELS[f]){const c=MODELS[f].clone();if(kind!=='drum')c.rotation.y=PI/2;g.add(c)}else{const b=batcher(g,{col:0x1f6fd0,fab:0x1b2a4a,r:.55});b.scale.setScalar(.75);b.rotation.y=PI/2}
 g.updateMatrixWorld(true);const bb=new T.Box3().setFromObject(g),c=bb.getCenter(new T.Vector3());g.children.forEach(o=>{o.position.x-=c.x;o.position.z-=c.z});g.userData.len=bb.getSize(new T.Vector3()).z;return g}
function trolleyCount(L){const bays=machines.filter(m=>m.type==='bay').length,k=Object.keys(LOOPS).find(q=>LOOPS[q]===L),r=RULES.loops[k];return Math.min(r.max,r.start+Math.floor(bays*r.perBay))}
function syncTrolleys(){const want={};for(const k in LOOPS)want[k]=trolleyCount(LOOPS[k]);if(movers.length&&Object.keys(LOOPS).every(k=>movers.filter(v=>v.k===k).length===want[k]))return;
 for(const v of movers){MOV.remove(v.tr);v.ws.forEach(w=>{MOV.remove(w.root);WKS.splice(WKS.indexOf(w),1)})}movers=[];
 for(const k in LOOPS){const L=LOOPS[k],n=want[k];for(let i=0;i<n;i++){const tr=trolleyModel(L.kind);MOV.add(tr);const tot=Math.min(RULES.maxLoad,L.loads[i%L.loads.length]+L.tare),np=crewFor(tot);
  const lt=loadTag(tot+' kg · '+np+(np>1?' people':' person'));lt.position.y=2.2;tr.add(lt);
  const ws=[];for(let j=0;j<np;j++){const w=mkWorker(L.u);MOV.add(w.root);ws.push(w)}movers.push({k,L,tr,ws,np,len:tr.userData.len||2.7,d0:i*L.tot/n,ph:Math.random()*5,tot})}}}
GA.push((t)=>{for(const v of movers){const{L,tr,ws,np,len}=v,d=v.d0+t*L.sp,p=L.at(d),h=L.head(d);tr.position.copy(p);tr.rotation.y=h;
 ws.forEach((w,j)=>{const front=j===2,dw=front?d+len/2+.45:d-len/2-.5,q=L.at(dw),hh=L.head(dw),off=front||np===1?0:(j===0?-.36:.36);
  w.root.position.set(q.x+Math.cos(hh)*off,0,q.z-Math.sin(hh)*off);w.root.rotation.y=hh+(front?PI:0);resetPose(w);POSES[front?'walk':'push'](w,t*L.sp*.95+v.ph+j*.7)})}});

// =====================================================================
// SIMULATION
// =====================================================================
function count(type,running){return machines.filter(m=>m.type===type&&(!running||!m.broken)).length}
function speedOf(m){let s=1+.25*(m.level-1);s*=1+.05*Math.min(3,count('bay',1));
 if(count('boiler',1)&&['prep','dye','finish'].includes(m.def.zone))s*=1.15;
 if(m.type==='jet'||m.type==='jigger')s*=1+.1*Math.min(2,count('chem',1));return s}
function pendingQty(t){return G.orders.filter(o=>o.type===t).reduce((a,o)=>a+o.qty,0)}
function missing(m){const d=m.def;if(d.stenter)return G.inv.dyed>=1||G.inv.printed>=1?'':'dyed or printed fabric';
 for(const k in d.need)if(G.inv[k]<d.need[k])return MAT[k];
 for(const k in d.out)if(CAP[k]&&G.inv[k]>=CAP[k])return 'space ('+MAT[k]+' store full)';return ''}
function tryStart(m){if(missing(m))return false;const d=m.def;
 if(d.stenter){const pr=G.inv.printed>=1&&(G.inv.dyed<1||pendingQty('fp')-G.inv.fp>=pendingQty('fd')-G.inv.fd);m.lot=pr?'printed':'dyed';G.inv[m.lot]--;return true}
 for(const k in d.need)G.inv[k]=+(G.inv[k]-d.need[k]).toFixed(3);return true}
function finish(m){const d=m.def;if(d.stenter)G.inv[m.lot==='printed'?'fp':'fd']++;else for(const k in d.out)G.inv[k]+=d.out[k];m.produced++;if(window.onProduce)onProduce(m)}
function sim(dt){
 // operators go to production machines in build order
 let free=G.workers;for(const m of machines){if(m.def.util){m.worker=true;continue}m.worker=free>0&&!m.broken;if(m.worker)free--}
 for(const m of machines){const d=m.def;
  if(d.util){m.running=!m.broken;m.status=m.broken?'Broken':'Running';continue}
  if(m.broken){m.running=false;m.status='Broken — repair it';continue}
  if(!m.worker){m.running=false;m.status='No operator';continue}
  if(!m.hold){if(tryStart(m))m.hold=true;else{m.running=false;m.status='Waiting for '+missing(m);continue}}
  m.running=true;m.status='Running';m.progress+=dt*speedOf(m);
  if(m.progress>=d.time){m.progress=0;m.hold=false;finish(m)}}
 G.dayT+=dt;if(G.dayT>=MONTH){G.dayT-=MONTH;monthTick()}}
function monthTick(){G.month++;
 let up=0;machines.forEach(m=>up+=m.def.up);if(G.research.lean)up*=.85;const wages=G.workers*(G.wage||600),int=Math.round(G.loan*.01),cost=Math.round(up+wages+int);G.money-=cost;
 for(const m of machines)if(!m.def.util&&!m.broken&&Math.random()<(G.research.lean?.5:1)*(G.brk!=null?G.brk:.025)){m.broken=true;toast('⚠️ '+m.name+' broke down — click it to repair')}
 G.greige=Math.round(Math.max(200,Math.min(320,G.greige+(Math.random()*40-20))));
 const want=G.research.market?.8:.55;for(let i=0;i<2;i++)if(G.orders.length<6&&Math.random()<want)newOrder();
 G.orders=G.orders.filter(o=>{if(o.due<G.month){G.rep=Math.max(0,G.rep-6);toast('Order #'+o.id+' missed — reputation fell');return false}return true});
 G.rep=Math.min(100,G.rep+count('qc',1));if(!count('etp',1))G.rep=Math.min(70,G.rep);
 G.hist.push({m:G.month,cost});if(G.hist.length>24)G.hist.shift();
 if(G.money<0)toast('⚠️ Negative cash — deliver orders, sell stock or take a loan');if(window.onMonth)onMonth(cost);save(true);renderTab()}
function newOrder(){const printing=machines.some(m=>m.def.out&&m.def.out.printed);const type=printing&&Math.random()<(G.printBias!=null?G.printBias:.55)?'fp':'fd';
 const exp=G.research.export&&count('etp',1)&&Math.random()<.35;const qty=4+Math.floor(Math.random()*13);let unit=(type==='fp'?1400:900)*(.9+Math.random()*.3)*(.8+G.rep/250);if(exp)unit*=1.5;if(count('qc',1))unit*=1.05;
 G.orders.push({id:G.nextOrder++,type,qty,reward:Math.round(qty*unit/10)*10,due:G.month+3+Math.floor(Math.random()*3),exp})}
function deliver(id){const o=G.orders.find(q=>q.id===id);if(!o||G.inv[o.type]<o.qty)return;G.inv[o.type]-=o.qty;G.money+=o.reward;G.revenue+=o.reward;G.rep=Math.min(count('etp',1)?100:70,G.rep+(o.exp?5:3));G.orders=G.orders.filter(q=>q!==o);toast('📦 Order #'+o.id+' delivered — '+fmt(o.reward));if(window.onDeliver)onDeliver(o)}

// =====================================================================
// CAMERA, INPUT, SELECTION
// =====================================================================
const bar=$('bar');const cur={t:new T.Vector3(15,0,-2),r:190,th:.62,ph:.92},goal={t:cur.t.clone(),r:cur.r,th:cur.th,ph:cur.ph};let viewIdx=0;
function go(i){viewIdx=i;const v=VIEWS[i];goal.t.set(...v[1]);goal.r=v[2];goal.th=v[3];goal.ph=v[4];[...bar.children].forEach((b,k)=>b.classList.toggle('on',k==i));refreshInfo()}
VIEWS.forEach((v,i)=>{const b=document.createElement('button');b.textContent=v[0];b.onclick=()=>go(i);bar.appendChild(b)});
function viewForZone(z){const map={prep:1,lab:2,dye:2,kitchen:3,engrave:4,rotary:5,trolley:7,flat:8,finish:9};return map[z]==null?0:map[z]}
const ray=new T.Raycaster(),ndc=new T.Vector2(),floorP=new T.Plane(new T.Vector3(0,1,0),0);
function setNdc(e){const r=R.domElement.getBoundingClientRect();ndc.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);ray.setFromCamera(ndc,C)}
function floorHit(e){setNdc(e);const p=new T.Vector3();return ray.ray.intersectPlane(floorP,p)?p:null}
function pick(e){setNdc(e);const hits=ray.intersectObjects(machines.map(m=>m.g),true);for(const h of hits){const id=h.object.userData.mid;if(id)return machines.find(m=>m.id===id)}return null}
const snap=v=>Math.round(v);
// placement ghost
let tool=null,ghost=null,gRot=0,gPos=null;
function setTool(k){if(ghost){S.remove(ghost);ghost=null}tool=k;gPos=null;
 if(k){select(null);const def=DEF[k];const{outer}=buildModel(def);outer.traverse(q=>{if(q.isMesh){q.material=ghostMat;q.castShadow=false}});outer.visible=false;ghost=outer;S.add(ghost);go(viewForZone(def.zone))}
 renderTab();refreshInfo()}
function moveGhost(e){if(!ghost)return;const p=floorHit(e);if(!p){ghost.visible=false;return}gPos=[snap(p.x),snap(p.z)];ghost.visible=true;ghost.position.set(gPos[0],0,gPos[1]);ghost.rotation.y=gRot*PI/2;
 const err=rectOK(DEF[tool],gPos[0],gPos[1],gRot,null),cash=G.money>=DEF[tool].cost;ghostMat.color.set(!err&&cash?0x4ade80:0xff5050);$('st').textContent=err||(cash?'Click to build · R rotates · Esc cancels':'Not enough cash')}
function placeGhost(){if(!tool||!gPos)return;const def=DEF[tool],err=rectOK(def,gPos[0],gPos[1],gRot,null);if(err){toast(err);return}if(G.money<def.cost){toast('Not enough cash');return}
 G.money-=def.cost;const m=addMachine(tool,gPos[0],gPos[1],gRot);syncTrolleys();toast(def.icon+' '+m.name+' built for '+fmt(def.cost));if(!def.util&&machines.filter(q=>!q.def.util).length>G.workers)toast('Hire an operator so the new '+def.name+' can run');}
// selection visuals
let sel=null;const hl=new T.Box3Helper(new T.Box3(),0xf2b134);hl.visible=false;hl.material.depthTest=false;hl.renderOrder=9;S.add(hl);
const ring=new T.Mesh(new T.RingGeometry(.9,1,48),new T.MeshBasicMaterial({color:0xf2b134,transparent:true,opacity:.85,side:2,depthTest:false}));ring.rotation.x=-PI/2;ring.visible=false;ring.renderOrder=9;S.add(ring);
function syncHL(){if(!sel){hl.visible=ring.visible=false;return}const lv=sel.lab.visible;sel.lab.visible=false;const b=new T.Box3().setFromObject(sel.g);sel.lab.visible=lv;hl.box.copy(b);hl.visible=true;const c=b.getCenter(new T.Vector3()),s=b.getSize(new T.Vector3());ring.visible=true;ring.position.set(c.x,.08,c.z);const r=Math.hypot(s.x,s.z)/2*1.05;ring.scale.set(r,r,1)}
function select(m){sel=m;syncHL();buildEditor();refreshInfo()}
// pointer handling: orbit, pan, place, select, drag-move
let down=null,dragM=null,dragOK=true;
R.domElement.addEventListener('contextmenu',e=>e.preventDefault());
R.domElement.addEventListener('pointerdown',e=>{down={x:e.clientX,y:e.clientY,lx:e.clientX,ly:e.clientY,b:e.button,shift:e.shiftKey,moved:false};
 if(e.button===0&&!tool&&sel){const m=pick(e);if(m===sel){const p=floorHit(e);dragM={m,ox:p?p.x-m.x:0,oz:p?p.z-m.z:0,x0:m.x,z0:m.z}}}
 R.domElement.setPointerCapture(e.pointerId)});
R.domElement.addEventListener('pointermove',e=>{moveGhost(e);if(!down)return;const dx=e.clientX-down.lx,dy=e.clientY-down.ly;down.lx=e.clientX;down.ly=e.clientY;
 if(Math.abs(e.clientX-down.x)+Math.abs(e.clientY-down.y)>5)down.moved=true;if(!down.moved)return;
 if(dragM){const p=floorHit(e);if(!p)return;const nx=snap(p.x-dragM.ox),nz=snap(p.z-dragM.oz),err=rectOK(sel.def,nx,nz,sel.rot,sel);dragOK=!err;sel.g.position.set(nx,0,nz);sel._nx=nx;sel._nz=nz;ring.material.color.set(err?0xff5050:0xf2b134);$('st').textContent=err||'Release to move here';syncHL();return}
 if(down.b===2||down.shift){const f=new T.Vector3(),rgt=new T.Vector3();C.getWorldDirection(f);f.y=0;f.normalize();rgt.crossVectors(f,new T.Vector3(0,1,0));const k=goal.r*.0016;goal.t.addScaledVector(rgt,-dx*k).addScaledVector(f,dy*k)}
 else{goal.th-=dx*.006;goal.ph=Math.min(1.45,Math.max(.2,goal.ph-dy*.005))}});
R.domElement.addEventListener('pointerup',e=>{if(!down)return;const click=!down.moved,b=down.b;
 if(dragM){if(down.moved){if(dragOK){sel.x=sel._nx;sel.z=sel._nz;toast(sel.name+' moved')}else{sel.g.position.set(dragM.x0,0,dragM.z0);toast('Cannot move there')}ring.material.color.set(0xf2b134);syncHL();buildEditor()}dragM=null}
 if(click&&b===0){if(tool)placeGhost();else{const m=pick(e);if(m||!sel)select(m);else select(null)}}
 if(click&&b===2&&tool)setTool(null);down=null});
R.domElement.addEventListener('wheel',e=>{e.preventDefault();goal.r=Math.min(260,Math.max(8,goal.r*(1+e.deltaY*.001)))},{passive:false});
$('zi').onclick=()=>goal.r=Math.max(8,goal.r*.8);$('zo').onclick=()=>goal.r=Math.min(260,goal.r*1.25);
$('pp').onclick=()=>{G.paused=!G.paused;$('pp').textContent=G.paused?'▶':'❚❚'};
$('spd').onclick=()=>{G.speed=G.speed>=4?1:G.speed*2;$('spd').textContent=G.speed+'×'};
let showLabels=true;$('lbl').onclick=()=>{showLabels=!showLabels;machines.forEach(m=>m.lab.visible=showLabels);$('lbl').style.opacity=showLabels?1:.5};
function tryMove(m,nx,nz,rot){const err=rectOK(m.def,nx,nz,rot,m);if(err){toast(err);return false}m.x=nx;m.z=nz;m.rot=rot;m.g.position.set(nx,0,nz);m.g.rotation.y=rot*PI/2;syncHL();buildEditor();return true}
addEventListener('keydown',e=>{if(e.target.tagName==='INPUT')return;const k=e.key;
 if(k==='Escape'){if(tool)setTool(null);else select(null)}
 else if(k==='r'||k==='R'){if(tool){gRot=(gRot+1)%4;if(ghost)ghost.rotation.y=gRot*PI/2}else if(sel)tryMove(sel,sel.x,sel.z,(sel.rot+1)%4)}
 else if(k===' '){e.preventDefault();$('pp').click()}
 else if(sel&&k.startsWith('Arrow')){e.preventDefault();const d={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]}[k];tryMove(sel,sel.x+d[0],sel.z+d[1],sel.rot)}
 else if(sel&&(k==='Delete'||k==='Backspace')){sellMachine(sel)}});

// =====================================================================
// MACHINE EDITOR (property window)
// =====================================================================
const PAL=['#c8503c','#d98b2b','#e3c23a','#5f9e4a','#2f8f8a','#3c78b8','#6a5fb0','#b4558f','#e8e8e4','#8c96a0','#3b4450','#1a1f26'];
const pe=$('pe');
function sellMachine(m){const v=Math.round(m.def.cost*.4*(1+.5*(m.level-1)));G.money+=v;toast(m.name+' sold for '+fmt(v));removeMachine(m);syncTrolleys()}
function upCost(m){return Math.round(m.def.cost*.5*m.level)}
function repCost(m){return Math.round(m.def.cost*.1)}
function buildEditor(){if(!sel){pe.style.display='none';return}const m=sel,d=m.def,[w,dd]=dims(d,m.rot);pe.style.display='block';
 pe.innerHTML=`<h3><input id="peN" value="${m.name.replace(/"/g,'&quot;')}"><button id="peX">✕</button></h3><div class="b">
 <div class="dim">${d.icon} ${d.name} · ${ZONES[d.zone]?ZONES[d.zone].name:'Any department'}</div>
 <div class="dim">Footprint ${w} × ${dd} m · height ${(d.h||0).toFixed(1)} m</div>
 <div class="dim" id="peS"></div>
 <div class="sec">Layout</div>
 <label><span>X (m)</span><input type="number" id="peXv" step="1" value="${m.x}"></label>
 <label><span>Z (m)</span><input type="number" id="peZv" step="1" value="${m.z}"></label>
 <div class="row"><button id="peR">⟳ Rotate 90°</button><button id="peF">🎯 Focus</button></div>
 <div class="sec">Colour</div><div class="row">${PAL.map(c=>`<button class="sw" style="background:${c}" data-c="${c}"></button>`).join('')}<input type="color" id="peC" value="${m.col||'#3c78b8'}"><button id="peU">Reset</button></div>
 <div class="sec">Operations</div><div class="row">
 ${d.util?'':`<button id="peUp" ${m.level>=3||G.money<upCost(m)?'disabled':''}>⬆ Upgrade L${m.level+1} ${m.level>=3?'(max)':fmt(upCost(m))}</button>`}
 ${m.broken?`<button id="peRp" ${G.money<repCost(m)?'disabled':''}>🔧 Repair ${fmt(repCost(m))}</button>`:''}
 <button id="peCl" ${G.money<d.cost?'disabled':''}>⧉ Clone ${fmt(d.cost)}</button>
 <button id="peSl">💰 Sell ${fmt(d.cost*.4*(1+.5*(m.level-1)))}</button></div>
 <div class="dim" style="margin-top:8px">Drag the machine to move it · R rotates · arrow keys nudge 1 m · Del sells · Esc closes</div></div>`;
 $('peX').onclick=()=>select(null);$('peN').onchange=e=>{m.name=e.target.value;m.lk=null};
 $('peXv').onchange=e=>tryMove(m,snap(+e.target.value),m.z,m.rot);$('peZv').onchange=e=>tryMove(m,m.x,snap(+e.target.value),m.rot);
 $('peR').onclick=()=>tryMove(m,m.x,m.z,(m.rot+1)%4);$('peF').onclick=()=>{goal.t.set(m.x,1.5,m.z);goal.r=Math.max(22,Math.max(w,dd)*2.4)};
 pe.querySelectorAll('.sw').forEach(b=>b.onclick=()=>paint(m,b.dataset.c));$('peC').oninput=e=>paint(m,e.target.value);$('peU').onclick=()=>unpaint(m);
 if($('peUp'))$('peUp').onclick=()=>{const c=upCost(m);if(G.money<c)return;G.money-=c;m.level++;toast(m.name+' upgraded to level '+m.level+' (+25% speed)');buildEditor()};
 if($('peRp'))$('peRp').onclick=()=>{const c=repCost(m);if(G.money<c)return;G.money-=c;m.broken=false;toast(m.name+' repaired');buildEditor()};
 $('peCl').onclick=()=>{if(G.money<d.cost)return;for(let r=1;r<40;r++)for(const[a,b]of[[r,0],[-r,0],[0,r],[0,-r],[r,r],[-r,-r]]){const nx=m.x+a*2,nz=m.z+b*2;if(!rectOK(d,nx,nz,m.rot,null)){G.money-=d.cost;const c=addMachine(m.type,nx,nz,m.rot,{col:m.col});syncTrolleys();select(c);toast('Cloned '+d.name);return}}toast('No free space for a clone in '+(ZONES[d.zone]?ZONES[d.zone].name:'the plant'))};
 $('peSl').onclick=()=>sellMachine(m);refreshEditorStatus()}
function refreshEditorStatus(){if(!sel||!$('peS'))return;const m=sel;$('peS').innerHTML=`Status: <b class="${m.running?'good':'bad'}">${m.status}</b><br>Level ${m.level} · produced ${m.produced} lots${m.def.time?' · '+Math.round(m.progress/m.def.time*100)+'%':''}`}

// =====================================================================
// UI: sidebar tabs, info panel, toast
// =====================================================================
let tab='build',toastT=0;
function toast(t){const el=$('msg');el.textContent=t;el.classList.add('show');clearTimeout(toastT);toastT=setTimeout(()=>el.classList.remove('show'),3500)}
document.querySelectorAll('.tab').forEach(t=>t.onclick=()=>{tab=t.dataset.t;document.querySelectorAll('.tab').forEach(x=>x.classList.toggle('on',x===t));renderTab()});
function stockHTML(){return '<div class="card stock">'+Object.keys(MAT).map(k=>MAT[k]+': <b>'+(+G.inv[k].toFixed(1))+'</b>').join(' · ')+'</div>'}
function renderTab(){const tc=$('tc');let h='';
 if(tab==='build'){h+=stockHTML();for(const[z,list]of DEPTS){const Z=ZONES[z];h+=`<div class="ct"><i style="background:#${Z?Z.c.toString(16).padStart(6,'0'):'888'}"></i>${Z?Z.name:'Utilities (any department)'}</div>`;
  for(const k of list){const d=DEF[k],ok=unlocked(k);h+=`<button class="ib${tool===k?' on':''}" data-a="tool" data-k="${k}" ${ok?'':'disabled'}><span class="ic">${d.icon}</span><span><div class="nm">${d.name}${ok?'':' 🔒'}</div><div class="dt">${fmt(d.cost)} · ${fmt(d.up)}/mo${d.time?' · '+recipeText(d):''}${ok?'':' · research first'}</div></span></button>`}}}
 else if(tab==='orders'){h+=stockHTML();if(!G.orders.length)h+='<div class="card">No open orders. New buyers write in at the start of each month.</div>';
  for(const o of G.orders){const ok=G.inv[o.type]>=o.qty;h+=`<div class="card">${o.exp?'🌍 Export':'📦 Domestic'} order #${o.id}<br><b>${o.qty} lots ${MAT[o.type]}</b> — ${fmt(o.reward)}<br><span class="${o.due-G.month<=1?'bad':''}">Due ${monthName(o.due)}</span> · you have <span class="${ok?'good':'bad'}">${Math.floor(G.inv[o.type])}/${o.qty}</span><div class="row"><button data-a="deliver" data-k="${o.id}" ${ok?'':'disabled'}>Deliver</button></div></div>`}}
 else if(tab==='rules'){h+='<div class="card"><b>Plant rules</b> (as in the Kibrom Plant 3D layout)</div>';for(const r of RULES.text)h+=`<div class="card"><b>${r[0]}</b><br>${r[1]}<br><span style="color:var(--mut)">Where: ${r[2]}</span></div>`;
  const on=movers.length,crew=movers.reduce((a,v)=>a+v.np,0);h+=`<div class="card"><b>On the floor now</b><br>${on} trolleys on ${Object.keys(LOOPS).length} loops, pushed by ${crew} people</div>`}
 else if(tab==='research'){for(const r of RESEARCH){const done=G.research[r.id],can=!r.req||G.research[r.req];h+=`<div class="card${done?' done':''}">${r.icon} <b>${r.name}</b>${done?' ✅':''}<br><span style="color:var(--mut)">${r.desc}</span>${done?'':`<div class="row"><button data-a="res" data-k="${r.id}" ${can&&G.money>=r.cost?'':'disabled'}>Research ${fmt(r.cost)}</button>${can?'':' <span class="bad">needs '+RESEARCH.find(x=>x.id===r.req).name+'</span>'}</div>`}</div>`}}
 else{let up=0;machines.forEach(m=>up+=m.def.up);if(G.research.lean)up*=.85;const busy=machines.filter(m=>!m.def.util&&m.worker).length,need=machines.filter(m=>!m.def.util).length;
  h+=stockHTML()+`<div class="card"><b>Monthly running cost</b><br>Machine upkeep ${fmt(up)}<br>Wages ${G.workers} × $600 = ${fmt(G.workers*600)}<br>Loan interest ${fmt(G.loan*.01)}<br>Total revenue so far <span class="good">${fmt(G.revenue)}</span></div>
  <div class="card"><b>Floor rules</b><br>• One-way trolley loops: equal spacing, equal speed, one direction — no trolley meets another<br>• Walking pace 1.2 m/s<br>• One person pushes each trolley; total load stays within 300 kg<br>• Machines may not stand on the yellow lanes<br>• Each production machine needs one operator; without one it stops<br>Material handlers on the loops: ${movers.reduce((a,v)=>a+v.np,0)}</div>
  <div class="card"><b>Operators</b> — ${busy} working, ${need} machines need one<div class="row"><button data-a="hire" ${G.money<1500?'disabled':''}>👷 Hire ($1,500)</button><button data-a="fire" ${G.workers<1?'disabled':''}>Dismiss</button></div></div>
  <div class="card"><b>Greige market</b> — ${fmt(G.greige)} per lot<div class="row"><button data-a="buy" data-k="10" ${G.money<G.greige*10?'disabled':''}>Buy 10 lots ${fmt(G.greige*10)}</button><button data-a="buy" data-k="30" ${G.money<G.greige*30?'disabled':''}>Buy 30</button></div></div>
  <div class="card"><b>Spot market</b> (lower than order prices)<div class="row"><button data-a="spot" data-k="fd" ${G.inv.fd<1?'disabled':''}>Sell finished dyed $550/lot</button><button data-a="spot" data-k="fp" ${G.inv.fp<1?'disabled':''}>Sell finished printed $800/lot</button></div></div>
  <div class="card"><b>Bank loan</b> ${fmt(G.loan)} of $100,000 · 1% a month<div class="row"><button data-a="borrow" ${G.loan>=100000?'disabled':''}>Borrow $10,000</button><button data-a="repay" ${G.loan<10000||G.money<10000?'disabled':''}>Repay $10,000</button></div></div>
  <div class="card"><b>Game</b><div class="row"><button data-a="save">💾 Save</button><button data-a="load">📂 Load</button><button data-a="new">🔄 New plant</button></div></div>`}
 tc.innerHTML=h}
function recipeText(d){if(d.stenter)return 'dyed/printed → finished';const i=Object.keys(d.need).map(k=>MAT[k]).join(' + ');return (i?i+' → ':'makes ')+Object.keys(d.out).map(k=>MAT[k]).join('')}
$('tc').addEventListener('click',e=>{const b=e.target.closest('button[data-a]');if(!b||b.disabled)return;const a=b.dataset.a,k=b.dataset.k;
 if(a==='tool'){setTool(tool===k?null:k);return}
 if(a==='deliver')deliver(+k);
 if(a==='res'){const r=RESEARCH.find(x=>x.id===k);if(G.money>=r.cost){G.money-=r.cost;G.research[k]=1;toast('🔬 '+r.name+' researched')}}
 if(a==='hire'&&G.money>=1500){G.money-=1500;G.workers++;toast('Operator hired ('+G.workers+')')}
 if(a==='fire'&&G.workers>0){G.workers--;toast('Operator dismissed')}
 if(a==='buy'){const n=+k,c=G.greige*n;if(G.money>=c){G.money-=c;G.inv.greige+=n;toast('Bought '+n+' lots of greige for '+fmt(c))}}
 if(a==='spot'){const n=Math.floor(G.inv[k]),v=n*(k==='fp'?800:550);G.inv[k]-=n;G.money+=v;G.revenue+=v;toast('Sold '+n+' lots on the spot market for '+fmt(v))}
 if(a==='borrow'){G.loan+=10000;G.money+=10000}
 if(a==='repay'&&G.money>=10000){G.loan-=10000;G.money-=10000}
 if(a==='save')save();if(a==='load')load();if(a==='new'&&confirm('Start a new plant? Unsaved progress is lost.'))newGame();
 renderTab();refreshStats()});
function monthName(m){return ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][m%12]+' Y'+(Math.floor(m/12)+1)}
function refreshStats(){$('sCash').textContent=fmt(G.money);$('sCash').style.color=G.money<0?'#ff7b7b':'#4ade80';const need=machines.filter(m=>!m.def.util).length;$('sWk').textContent=G.workers+' / '+need;$('sWk').style.color=G.workers<need?'#ff7b7b':'';$('sRep').textContent=Math.round(G.rep)+'/100';$('sMon').textContent=monthName(G.month)}
function refreshInfo(){const h=$('info').querySelector('h2'),p=$('info').querySelector('p');
 if(tool){const d=DEF[tool];h.textContent='Placing: '+d.name;p.textContent=d.desc+' Place it in '+(ZONES[d.zone]?ZONES[d.zone].name:'any department')+'.'}
 else if(sel){h.textContent=sel.def.icon+' '+sel.name;p.textContent=sel.def.desc}
 else{const v=VIEWS[viewIdx];h.textContent=v[0];p.textContent=v[5]}}
function refreshLabels(){const now=performance.now()/1000;for(const m of machines){const c=m.status==='Running'?'#4ade80':m.status.startsWith('Waiting')?'#fcd34d':'#ff7b7b';setLabel(m,m.name.length>26?m.name.slice(0,25)+'…':m.name,c);if(m.lamp){m.lamp.material.color.set(c);m.lamp.material.emissive.set(c);m.lamp.material.emissiveIntensity=m.running?1.2+Math.sin(now*4)*.6:.5}}}
function refreshStatusLine(){if(tool)return;if(sel){$('st').textContent=sel.running&&sel.A.status?sel.A.status:sel.status;return}
 const v=VIEWS[viewIdx][0];if(v==='Flatbed & digital'){const f=machines.find(m=>m.type==='flatbed'&&m.running);$('st').textContent=f?f.A.status:''}else $('st').textContent=''}

// =====================================================================
// SAVE / LOAD / NEW GAME
// =====================================================================
const KEY='textileTycoon3D_v2';
function save(quiet){try{localStorage.setItem(KEY,JSON.stringify({G,ms:machines.map(m=>({t:m.type,x:m.x,z:m.z,r:m.rot,n:m.name,l:m.level,p:m.produced,b:m.broken,c:m.col}))}));if(!quiet)toast('💾 Plant saved')}catch(e){}}
function clearPlant(){machines.slice().forEach(removeMachine);machines=[];MID=0}
function load(){try{const d=JSON.parse(localStorage.getItem(KEY)||'null');if(!d){toast('No saved plant yet');return false}clearPlant();G=Object.assign(freshState(),d.G);G.paused=false;
 d.ms.forEach(q=>{if(DEF[q.t])addMachine(q.t,q.x,q.z,q.r,{name:q.n,level:q.l,produced:q.p,broken:q.b,col:q.c})});syncTrolleys();renderTab();refreshStats();toast('📂 Plant loaded — '+monthName(G.month));return true}catch(e){return false}}
const STARTER=[['desize',42,-8,0],['bleach',61,5,0],['station',-55,-39,0],['station',-48,-39,0],['chem',-47,-24,0],['jet',-19,-35,0],['kitchen',-42,-8,0],['coater',-33,24,0],['baby',-2,-6,0],['stenter',27,-32,0],['bay',-52,12,0],['boiler',72,-26,0]];
function newGame(){clearPlant();G=freshState();G.paused=false;STARTER.forEach(s=>addMachine(s[1]?s[0]:s[0],s[1],s[2],s[3]));syncTrolleys();newOrder();newOrder();select(null);renderTab();refreshStats();go(0);toast('Welcome! Your starter plant is running — buy greige, deliver orders and expand.')}

// =====================================================================
// RENDERING (realism pass + HQ post-processing, as in the layout)
// =====================================================================
function upgrade(){const e=new T.Scene();e.add(new T.Mesh(new T.BoxGeometry(120,70,120),new T.MeshBasicMaterial({color:0x8d9bab,side:1})));
 const sb=(w,h,x,y,z,c,rx,ry)=>{const m=new T.Mesh(new T.PlaneGeometry(w,h),new T.MeshBasicMaterial({color:c,side:2}));m.position.set(x,y,z);m.rotation.set(rx||0,ry||0,0);e.add(m)};
 sb(80,50,0,34,0,0xffffff,PI/2);sb(30,25,-55,20,0,0xfff0dd,0,PI/2);sb(30,25,55,20,10,0xdde8ff,0,PI/2);sb(60,20,0,12,-58,0xeaf0f6);
 S.environment=new T.PMREMGenerator(R).fromScene(e,.03).texture;
 for(const m of [ST,STd,NI,GR])if(!m.bumpMap){m.bumpMap=brushed;m.bumpScale=.35}}
let composer=null,useFX=true;
function initFX(){try{const rt=new T.WebGLMultisampleRenderTarget(VW()*DPR,VH()*DPR,{format:T.RGBAFormat,type:T.HalfFloatType});
 composer=new T.EffectComposer(R,rt);composer.setPixelRatio(DPR);composer.setSize(VW(),VH());composer.addPass(new T.RenderPass(S,C));
 const ssao=new T.SSAOPass(S,C,VW(),VH());ssao.kernelRadius=3;ssao.minDistance=.0012;ssao.maxDistance=.014;composer.addPass(ssao);
 composer.addPass(new T.UnrealBloomPass(new T.Vector2(VW()/2,VH()/2),.22,.55,1.6));
 composer.addPass(new T.ShaderPass({uniforms:{tDiffuse:{value:null}},vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
  fragmentShader:'uniform sampler2D tDiffuse;varying vec2 vUv;vec3 aces(vec3 x){return clamp((x*(2.51*x+.03))/(x*(2.43*x+.59)+.14),0.,1.);}void main(){vec3 c=texture2D(tDiffuse,vUv).rgb;c=aces(c*.8);c=pow(c,vec3(1./2.2));c=mix(vec3(dot(c,vec3(.299,.587,.114))),c,1.12);c=(c-.5)*1.06+.5;vec2 d=vUv-.5;c*=1.-dot(d,d)*.35;gl_FragColor=vec4(c,1.);}'}));
 }catch(err){console.warn('FX off',err);composer=null}}
function applyFX(){if(useFX&&composer){R.toneMapping=T.NoToneMapping;R.outputEncoding=T.LinearEncoding;S.background=new T.Color(window.skyCol||BGC).convertSRGBToLinear();S.fog.color.copy(S.background)}
 else{R.toneMapping=T.ACESFilmicToneMapping;R.outputEncoding=T.sRGBEncoding;S.background=new T.Color(window.skyCol||BGC);S.fog.color.set(window.skyCol||BGC)}$('fx').style.opacity=useFX?1:.5}
$('fx').onclick=()=>{useFX=!useFX;applyFX()};
function onResize(){R.setSize(VW(),VH());C.aspect=VW()/VH();C.updateProjectionMatrix();if(composer)composer.setSize(VW(),VH())}
addEventListener('resize',onResize);

// =====================================================================
// START
// =====================================================================
G=freshState();
upgrade();initFX();applyFX();
(async()=>{const files=[...new Set(Object.values(DEF).flatMap(d=>!d.glb?[]:typeof d.glb==='string'?[d.glb]:d.glb.map(p=>p.f)))];let n=0;
 await Promise.all(files.map(f=>loadModel(f).then(m=>{MODELS[f]=m}).catch(e=>{MODEL_ERR[f]=1;console.warn('model',f,e)}).finally(()=>{n++;$('ld').textContent='Loading detailed machine models… '+n+' / '+files.length})));
 $('ld').remove();onResize();if(window.onModelsReady)onModelsReady()})();
let last=performance.now(),TT=0,uiLast=0;
(function loop(n){requestAnimationFrame(loop);const rdt=Math.min(.05,(n-last)/1000);last=n;const gdt=G.paused?0:rdt*G.speed;
 if(gdt>0&&machines.length){sim(gdt*(window.shiftRate||1));TT+=gdt;for(const m of machines)if(m.op){const w=m.op,pose=m.broken?'kneel':m.running?(m.type==='qc'?'inspect':m.def.util?'stand':'panel'):'stand';w.root.visible=m.def.util||m.worker||m.broken;resetPose(w);if(w.sp)w.sp.visible=pose==='kneel';if(pose==='kneel')spanner(w).visible=true;POSES[pose](w,TT+w.ph)}for(const m of machines)if(m.running){m.mt+=gdt;for(const f of m.A)f(m.mt,gdt,m)}GA.forEach(f=>f(TT,gdt))}
 if(dragM||sel)syncHL();
 if(window.onFrame)onFrame(rdt,gdt);if(window.menuOrbit)goal.th+=rdt*.04;cur.t.lerp(goal.t,.06);for(const k of['r','th','ph'])cur[k]+=(goal[k]-cur[k])*.06;
 C.position.set(cur.t.x+cur.r*Math.sin(cur.ph)*Math.sin(cur.th),cur.t.y+cur.r*Math.cos(cur.ph),cur.t.z+cur.r*Math.sin(cur.ph)*Math.cos(cur.th));C.lookAt(cur.t);
 if(n-uiLast>400){uiLast=n;refreshStats();refreshLabels();refreshStatusLine();refreshEditorStatus();if(tab==='orders'||tab==='finance'){if(!$('tc').matches(':hover'))renderTab()}}
 if(useFX&&composer)composer.render();else R.render(S,C)})(last);
