const CELL=40,COLS=13,ROWS=13; 
const W=COLS*CELL,HC=ROWS*CELL;
const canvas=document.getElementById('mc');
canvas.width=W;canvas.height=HC;
const ctx=canvas.getContext('2d');
ctx.imageSmoothingEnabled=false;

const C={bg:'#0d0520',wall:'#aa88ff',player:'#ff69b4',goal:'#ffdd00',goalGlow:'#ff4400',hint:'rgba(255,221,0,0.1)',start:'#00ffaa',particle:['#ff69b4','#ffdd00','#aa88ff','#ff4400','#00ffaa','#1DB954']};

function mkMaze(seed){
  let s=seed;
  const rng=()=>{s=(s*1664525+1013904223)&0xFFFFFFFF;return(s>>>0)/0xFFFFFFFF};
  const vis=Array.from({length:ROWS},()=>new Array(COLS).fill(false));
  const hW=Array.from({length:ROWS+1},()=>new Array(COLS).fill(true));
  const vW=Array.from({length:ROWS},()=>new Array(COLS+1).fill(true));
  function carve(cx,cy){
    vis[cy][cx]=true;
    const dirs=[{dx:0,dy:-1},{dx:0,dy:1},{dx:-1,dy:0},{dx:1,dy:0}].sort(()=>rng()-0.5);
    for(const{dx,dy}of dirs){const nx=cx+dx,ny=cy+dy;
    if(nx<0||nx>=COLS||ny<0||ny>=ROWS||vis[ny][nx])continue;
    if(dy===-1)hW[cy][cx]=false;if(dy===1)hW[cy+1][cx]=false;
    if(dx===-1)vW[cy][cx]=false;if(dx===1)vW[cy][cx+1]=false;carve(nx,ny);}}
  carve(0,0);return{hW,vW};}

const MAZES=[mkMaze(42),mkMaze(137)];
let curLv=0,player={x:0,y:0},moveCount=0,showHint=false,hintPath=null;
let particles=[],animId,winAnim=0,frame=0;

function canMove(fx,fy,tx,ty){
  const{hW,vW}=MAZES[curLv];
  if(tx<0||tx>=COLS||ty<0||ty>=ROWS)return false;
  const dx=tx-fx,dy=ty-fy;
  if(dy===-1&&hW[fy][fx])return false;if(dy===1&&hW[fy+1][fx])return false;
  if(dx===-1&&vW[fy][fx])return false;if(dx===1&&vW[fy][fx+1])return false;
  return true;}

function bfs(){
  const q=[{x:player.x,y:player.y,path:[]}];const seen=new Set([`${player.x},${player.y}`]);
  while(q.length){const{x,y,path}=q.shift();if(x===COLS-1&&y===ROWS-1)return path;
  for(const[dx,dy]of[[0,-1],[0,1],[-1,0],[1,0]]){const nx=x+dx,ny=y+dy;
  if(!seen.has(`${nx},${ny}`)&&canMove(x,y,nx,ny)){seen.add(`${nx},${ny}`);q.push({x:nx,y:ny,path:[...path,{x:nx,y:ny}]})}}}return[];}

function spawnP(gx,gy,n){const cx=gx*CELL+CELL/2,cy=gy*CELL+CELL/2;
  for(let i=0;i<n;i++){const a=Math.random()*Math.PI*2,sp=1.5+Math.random()*3;
  particles.push({x:cx,y:cy,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,life:1,col:C.particle[Math.floor(Math.random()*C.particle.length)],sz:Math.random()<0.5?4:6});}}

function drawPixelHeart(cx,cy,sz,col){
  const p=Math.max(2,Math.floor(sz/8));
  const pat=[[0,1,0,1,0],[1,1,1,1,1],[1,1,1,1,1],[0,1,1,1,0],[0,0,1,0,0]];
  const ox=cx-p*2.5,oy=cy-p*2.5;
  ctx.fillStyle=col;
  pat.forEach((row,r)=>row.forEach((v,c)=>{if(v)ctx.fillRect(Math.round(ox+c*p),Math.round(oy+r*p),p,p);}));}

function drawPixelStar(cx,cy,col){
  ctx.fillStyle=col;const p=3;
  [[0,1,0],[1,1,1],[0,1,0]].forEach((row,r)=>row.forEach((v,c)=>{if(v)ctx.fillRect(cx-p+c*p,cy-p+r*p,p,p);}));}

function drawFrame(){
  ctx.clearRect(0,0,W,HC);frame++;
  const{hW,vW}=MAZES[curLv];
  ctx.fillStyle=C.bg;ctx.fillRect(0,0,W,HC);
  if(showHint&&hintPath){ctx.fillStyle=C.hint;hintPath.forEach(p=>ctx.fillRect(p.x*CELL,p.y*CELL,CELL,CELL));}
  ctx.fillStyle='rgba(255,221,0,0.08)';ctx.fillRect((COLS-1)*CELL,(ROWS-1)*CELL,CELL,CELL);
  ctx.fillStyle=C.wall;
  for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++){
    if(hW[r][c])ctx.fillRect(c*CELL,r*CELL,CELL,2);
    if(vW[r][c])ctx.fillRect(c*CELL,r*CELL,2,CELL);}
  ctx.fillRect(COLS*CELL,0,2,HC);ctx.fillRect(0,ROWS*CELL,W,2);
  const blink=frame%16<8;
  drawPixelHeart((COLS-1)*CELL+CELL/2,(ROWS-1)*CELL+CELL/2,CELL*0.8,blink?C.goal:C.goalGlow);
  const bob=frame%30<15?0:2;
  if(winAnim>0){winAnim=Math.min(winAnim+0.05,2);const sc=1+Math.sin(winAnim*Math.PI)*0.4;
    drawPixelHeart(player.x*CELL+CELL/2,player.y*CELL+CELL/2+bob-2,CELL*0.75*sc,C.player);}
  else drawPixelHeart(player.x*CELL+CELL/2,player.y*CELL+CELL/2+bob-2,CELL*0.75,C.player);
  drawPixelStar(CELL/2,CELL/2,C.start);
  particles.forEach(p=>{
    const s=Math.max(2,Math.round(p.sz*p.life));
    ctx.fillStyle=p.col;ctx.globalAlpha=p.life;
    ctx.fillRect(Math.round(p.x-s/2),Math.round(p.y-s/2),s,s);
    p.x+=p.vx;p.y+=p.vy;p.vy+=0.15;p.life-=0.03;});
  ctx.globalAlpha=1;particles=particles.filter(p=>p.life>0);}

function loop(){drawFrame();animId=requestAnimationFrame(loop);}
function setMsg(t){document.getElementById('msg-bar').textContent=t;}

function move(dx,dy){
  if(winAnim>0)return;const nx=player.x+dx,ny=player.y+dy;
  if(!canMove(player.x,player.y,nx,ny))return;
  player={x:nx,y:ny};moveCount++;document.getElementById('moves').textContent=moveCount;
  if(nx===COLS-1&&ny===ROWS-1){
    winAnim=1;spawnP(nx,ny,40);
    if(curLv===0){
      setMsg('★ LEVEL 1 CLEAR! GET READY...');
      setTimeout(()=>{curLv=1;player={x:0,y:0};moveCount=0;winAnim=0;hintPath=null;showHint=false;
        document.getElementById('btn-hint').classList.remove('hon');
        document.getElementById('moves').textContent=0;document.getElementById('lvld').textContent=2;
        document.getElementById('mzt').textContent='♥ LOVE MAZE — LEVEL 2 / 2';
        document.getElementById('mzd').textContent='FINAL LEVEL! REACH YOUR LOVE!';setMsg('');},1800);
    }else{
      setMsg('★ YOU DID IT! PLAYLIST UNLOCKED!');
      cancelAnimationFrame(animId);
      setTimeout(()=>{
        document.getElementById('screen-maze').style.display='none';
        document.getElementById('screen-win').style.display='block';},2200);}}}

function initLevel(){
  player={x:0,y:0};moveCount=0;winAnim=0;hintPath=null;showHint=false;particles=[];
  document.getElementById('moves').textContent=0;document.getElementById('lvld').textContent=curLv+1;
  setMsg('');cancelAnimationFrame(animId);loop();}

document.addEventListener('keydown',e=>{
  const map={ArrowUp:[0,-1],ArrowDown:[0,1],ArrowLeft:[-1,0],ArrowRight:[1,0],w:[0,-1],s:[0,1],a:[-1,0],d:[1,0],W:[0,-1],S:[0,1],A:[-1,0],D:[1,0]};
  if(map[e.key]){e.preventDefault();move(...map[e.key]);}});
document.querySelectorAll('.db').forEach(b=>b.addEventListener('click',()=>{
  const m={up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]};move(...m[b.dataset.d]);}));
document.getElementById('btn-rst').addEventListener('click',initLevel);
document.getElementById('btn-hint').addEventListener('click',()=>{
  const btn=document.getElementById('btn-hint');
  if(!hintPath)hintPath=bfs();showHint=!showHint;btn.classList.toggle('hon',showHint);});
document.getElementById('btn-open').addEventListener('click',()=>{
  document.getElementById('screen-win').style.display='none';
  document.getElementById('screen-player').style.display='block';});
document.getElementById('back2').addEventListener('click',()=>{
  document.getElementById('screen-player').style.display='none';
  document.getElementById('screen-win').style.display='block';});

initLevel();