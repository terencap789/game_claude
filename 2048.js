const SIZE = 4;
const gridEl = document.getElementById('t2048Grid');
const scoreEl = document.getElementById('t2048Score');
const highEl = document.getElementById('t2048High');
const overlay = document.getElementById('overlay');

let board, score, high = +(localStorage.getItem('t2048High') || 0), won = false, over = false;
highEl.textContent = high;

const CELL_PX = 78, GAP = 8;
gridEl.style.gridTemplateColumns = `repeat(${SIZE},${CELL_PX}px)`;
gridEl.style.gridTemplateRows = `repeat(${SIZE},${CELL_PX}px)`;
gridEl.style.gap = GAP + 'px';

const COLORS = {
  2:'#3a3153', 4:'#463b63', 8:'#e0785a', 16:'#e0674a', 32:'#e0524a',
  64:'#d9424a', 128:'#e3b23c', 256:'#e3a33c', 512:'#5fb87a', 1024:'#4fb3c9', 2048:'#c76bd4'
};

function newGame(){
  board = Array.from({length:SIZE}, () => Array(SIZE).fill(0));
  score = 0; won = false; over = false;
  scoreEl.textContent = 0;
  hideOverlay();
  addRandomTile(); addRandomTile();
  render();
}

function addRandomTile(){
  const empties = [];
  for(let r=0;r<SIZE;r++) for(let c=0;c<SIZE;c++) if(!board[r][c]) empties.push([r,c]);
  if(!empties.length) return;
  const [r,c] = empties[Math.random()*empties.length|0];
  board[r][c] = Math.random() < 0.9 ? 2 : 4;
}

function render(){
  gridEl.innerHTML = '';
  for(let r=0;r<SIZE;r++) for(let c=0;c<SIZE;c++){
    const v = board[r][c];
    const t = document.createElement('div');
    t.className = 'tile2048';
    t.style.width = CELL_PX+'px'; t.style.height = CELL_PX+'px';
    t.style.fontSize = (v>512 ? 22 : 28) + 'px';
    if(v){ t.textContent = v; t.style.background = COLORS[v] || '#c76bd4'; t.style.color = v<=4 ? 'var(--ink)' : '#1a1520'; }
    gridEl.appendChild(t);
  }
  scoreEl.textContent = score;
}

/* fait glisser + fusionne une ligne vers la gauche ; renvoie {row, gained, moved} */
function slideRowLeft(row){
  const vals = row.filter(v=>v);
  const out = [];
  let gained = 0;
  for(let i=0;i<vals.length;i++){
    if(vals[i]===vals[i+1]){ const merged=vals[i]*2; out.push(merged); gained+=merged; i++; }
    else out.push(vals[i]);
  }
  while(out.length<SIZE) out.push(0);
  const moved = out.some((v,i)=>v!==row[i]);
  return {row:out, gained, moved};
}
function rotateCW(bd){
  const nb = Array.from({length:SIZE}, () => Array(SIZE).fill(0));
  for(let r=0;r<SIZE;r++) for(let c=0;c<SIZE;c++) nb[c][SIZE-1-r]=bd[r][c];
  return nb;
}

function move(dir){
  if(over) return;
  let bd = board.map(r=>r.slice());
  let rotations = {left:0, up:3, right:2, down:1}[dir];
  for(let i=0;i<rotations;i++) bd = rotateCW(bd);

  let moved=false, gained=0;
  const newBd = bd.map(row=>{
    const res = slideRowLeft(row);
    if(res.moved) moved=true;
    gained += res.gained;
    return res.row;
  });
  bd = newBd;
  for(let i=0;i<(4-rotations)%4;i++) bd = rotateCW(bd);

  if(!moved) return;
  board = bd; score += gained;
  if(score>high){ high=score; localStorage.setItem('t2048High',high); highEl.textContent=high; }
  addRandomTile();
  render();

  if(!won && board.some(row=>row.some(v=>v>=2048))){
    won=true;
    showOverlay('🎉','2048 !', `Tu as atteint 2048 avec un score de ${score}. Continue si tu veux viser plus haut.`, 'Continuer');
  } else if(!canMove()){
    over=true;
    showOverlay('💥','Partie terminée', `Plus aucun coup possible — score final : ${score}`, 'Recommencer');
    document.getElementById('overlayBtn').onclick = newGame;
  }
}

function canMove(){
  for(let r=0;r<SIZE;r++) for(let c=0;c<SIZE;c++){
    if(!board[r][c]) return true;
    if(c<SIZE-1 && board[r][c]===board[r][c+1]) return true;
    if(r<SIZE-1 && board[r][c]===board[r+1][c]) return true;
  }
  return false;
}

function showOverlay(icon,title,text,btn){
  document.getElementById('overlayIcon').textContent=icon;
  document.getElementById('overlayTitle').textContent=title;
  document.getElementById('overlayText').textContent=text;
  document.getElementById('overlayBtn').textContent=btn;
  overlay.classList.remove('hidden');
}
function hideOverlay(){ overlay.classList.add('hidden'); }

document.getElementById('overlayBtn').addEventListener('click', hideOverlay);
document.getElementById('t2048Restart').addEventListener('click', newGame);

window.addEventListener('keydown', e=>{
  const k=e.key.toLowerCase();
  const map = {arrowleft:'left', a:'left', arrowright:'right', d:'right', arrowup:'up', w:'up', arrowdown:'down', s:'down'};
  if(map[k]){ e.preventDefault(); move(map[k]); }
});

let touchStart=null;
gridEl.addEventListener('touchstart', e=>{ touchStart={x:e.touches[0].clientX, y:e.touches[0].clientY}; }, {passive:true});
gridEl.addEventListener('touchend', e=>{
  if(!touchStart) return;
  const dx = e.changedTouches[0].clientX - touchStart.x;
  const dy = e.changedTouches[0].clientY - touchStart.y;
  if(Math.max(Math.abs(dx),Math.abs(dy)) > 24){
    if(Math.abs(dx)>Math.abs(dy)) move(dx>0?'right':'left');
    else move(dy>0?'down':'up');
  }
  touchStart=null;
});

newGame();
