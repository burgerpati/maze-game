const COLS=21,ROWS=21,CELL=16;
const C=document.getElementById('gc');
const ctx=C.getContext('2d');

const msgs=[
  "Every step you take\nis a step closer\nto love. ♥",
  "Love is patient,\nlove is kind,\nand you made it! ♥",
  "Through every twist\nand turn, love\nfound a way! ♥",
  "You navigated\nthe maze of\nthe heart! ♥",
  "True love conquers\nall mazes! ♥♥♥"
];

const P={
  bg:'#1a0010',
  wall:['#2d0020','#3d0030','#4a0038'],
  wallTop:'#e879a0',
  floor:'#120008',
  floorAlt:'#180010',
  player:'#fde68a',
  pBody:'#f9a8d4',
  exit:'#fde68a',
  rose:'#e879a0',
  roseDark:'#831843',
  petal:'#fbcfe8',
  sparkle:'#fff',
};

let maze,player,exitPos,level,steps,lives,score,gameOver,won;
let tick=0,blink=0;

function genMaze(){
  const g=Array.from({length:ROWS},()=>Array(COLS).fill(1));
  const stack=[{r:1,c:1}];
  g[1][1]=0;
  const dirs=[{r:-2,c:0},{r:2,c:0},{r:0,c:-2},{r:0,c:2}];

  while(stack.length){
    const cur=stack[stack.length-1];
    const sh=dirs.map(d=>({...d,o:Math.random()})).sort((a,b)=>a.o-b.o);
    let mv=false;

    for(const d of sh){
      const nr=cur.r+d.r,nc=cur.c+d.c;

      if(nr>0&&nr<ROWS-1&&nc>0&&nc<COLS-1&&g[nr][nc]===1){
        g[cur.r+d.r/2][cur.c+d.c/2]=0;
        g[nr][nc]=0;
        stack.push({r:nr,c:nc});
        mv=true;
        break;
      }
    }

    if(!mv) stack.pop();
  }

  return g;
}

function getPaths(g){
  const p=[];
  for(let r=1;r<ROWS-1;r++)
    for(let c=1;c<COLS-1;c++)
      if(g[r][c]===0) p.push({r,c});

  return p;
}

function dist(a,b){
  return Math.abs(a.r-b.r)+Math.abs(a.c-b.c);
}

function startGame(){
  document.getElementById('reward-screen').classList.remove('show');
  level=1;
  steps=0;
  lives=3;
  score=0;
  gameOver=false;
  won=false;
  initLevel();
}

function initLevel(){
  document.getElementById('reward-screen').classList.remove('show');

  maze=genMaze();

  const paths=getPaths(maze);

  player={r:1,c:1};

  exitPos=paths.reduce(
    (b,p)=>dist(p,player)>dist(b,player)?p:b,
    paths[0]
  );

  won=false;
  gameOver=false;

  setMsg('LEVEL '+level+' — FIND THE GIFT! ♥');

  updateHUD();

  if(window._raf) cancelAnimationFrame(window._raf);

  loop();
}

function skipLevel(){
  level++;
  initLevel();
}

function nextLevelFromReward(){
  level++;
  initLevel();
}

function updateHUD(){
  document.getElementById('hl').textContent=level;
  document.getElementById('hs').textContent=steps;
  document.getElementById('hh').textContent='♥'.repeat(Math.max(0,lives));
  document.getElementById('hsc').textContent=score;
}

function setMsg(t){
  document.getElementById('msg').innerHTML=t.replace(/\n/g,'<br>');
}

function canMove(r,c){
  return r>=0&&r<ROWS&&c>=0&&c<COLS&&maze[r][c]===0;
}

function move(dr,dc){
  if(gameOver||won) return;

  const nr=player.r+dr;
  const nc=player.c+dc;

  if(!canMove(nr,nc)) return;

  player.r=nr;
  player.c=nc;

  steps++;

  updateHUD();

  if(player.r===exitPos.r&&player.c===exitPos.c){
    won=true;
    score+=1000+Math.max(0,500-steps)*level;

    updateHUD();

    setTimeout(showReward,400);
  }
}
