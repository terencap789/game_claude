let mode = 'human';   // 'human' ou 'bot'
let size = 3;
let winLen = 3;
let board, turn, over, humanSymbol='X', botSymbol='O';

/* ---- écran de démarrage ---- */
document.querySelectorAll('#modeRow .optBtn').forEach(b=>{
  b.addEventListener('click', ()=>{
    document.querySelectorAll('#modeRow .optBtn').forEach(x=>x.classList.remove('selected'));
    b.classList.add('selected'); mode = b.dataset.mode;
  });
});
document.querySelectorAll('#sizeRow .optBtn').forEach(b=>{
  b.addEventListener('click', ()=>{
    document.querySelectorAll('#sizeRow .optBtn').forEach(x=>x.classList.remove('selected'));
    b.classList.add('selected'); size = +b.dataset.size;
  });
});
document.getElementById('startBtn').addEventListener('click', startGame);
document.getElementById('tttReset').addEventListener('click', ()=>{
  document.getElementById('gameScreen').style.display='none';
  document.getElementById('startScreen').style.display='flex';
});

function startGame(){
  winLen = size<=3 ? 3 : 4;
  board = Array(size*size).fill('');
  turn = 'X'; over = false;
  document.getElementById('startScreen').style.display='none';
  const gs = document.getElementById('gameScreen'); gs.style.display='flex';
  const grid = document.getElementById('tttGrid');
  grid.innerHTML='';
  const cellPx = size<=4 ? 84 : (size===5?66:56);
  grid.style.gridTemplateColumns = `repeat(${size},${cellPx}px)`;
  grid.style.gridTemplateRows = `repeat(${size},${cellPx}px)`;
  for(let i=0;i<size*size;i++){
    const c=document.createElement('div');
    c.className='tttCell'; c.dataset.i=i;
    c.style.fontSize = (cellPx*0.5)+'px';
    c.addEventListener('click', ()=>play(i));
    grid.appendChild(c);
  }
  updateStatus();
}

function updateStatus(msg){
  document.getElementById('tttStatus').innerHTML = msg || `Au tour de <strong>${turn}</strong>`;
}

function idx(r,c){ return r*size+c; }

/* renvoie {cells,player} si victoire trouvée sur tout le plateau */
function checkWin(bd){
  const dirs=[[0,1],[1,0],[1,1],[1,-1]];
  for(let r=0;r<size;r++) for(let c=0;c<size;c++){
    const p = bd[idx(r,c)]; if(!p) continue;
    for(const [dr,dc] of dirs){
      const cells=[[r,c]];
      for(let k=1;k<winLen;k++){
        const nr=r+dr*k, nc=c+dc*k;
        if(nr<0||nr>=size||nc<0||nc>=size||bd[idx(nr,nc)]!==p) break;
        cells.push([nr,nc]);
      }
      if(cells.length===winLen) return {cells,player:p};
    }
  }
  return null;
}

function play(i){
  if(over || board[i]) return;
  if(mode==='bot' && turn!==humanSymbol) return;
  place(i, turn);
}

function place(i, sym){
  board[i]=sym;
  const cellEl=document.querySelector(`.tttCell[data-i="${i}"]`);
  cellEl.textContent=sym;
  const win = checkWin(board);
  if(win){
    over=true;
    win.cells.forEach(([r,c])=>document.querySelector(`.tttCell[data-i="${idx(r,c)}"]`).classList.add('win'));
    updateStatus(`<strong>${sym}</strong> a gagné !`);
    return;
  }
  if(board.every(v=>v)){ over=true; updateStatus('Match nul !'); return; }
  turn = turn==='X' ? 'O' : 'X';
  updateStatus();
  if(mode==='bot' && turn===botSymbol && !over){ setTimeout(botMove, 300); }
}

/* ---- IA ---- */
function botMove(){
  if(over) return;
  let i;
  if(size===3) i = bestMoveMinimax();
  else i = bestMoveHeuristic();
  place(i, botSymbol);
}

function emptyCells(bd){
  const r=[]; bd.forEach((v,i)=>{ if(!v) r.push(i); }); return r;
}

/* minimax parfait pour la grille 3x3 */
function bestMoveMinimax(){
  let best=-Infinity, move=null;
  for(const i of emptyCells(board)){
    board[i]=botSymbol;
    const score = minimax(board, 0, false);
    board[i]='';
    if(score>best){ best=score; move=i; }
  }
  return move;
}
function minimax(bd, depth, isMax){
  const win = checkWin(bd);
  if(win) return win.player===botSymbol ? 10-depth : depth-10;
  if(bd.every(v=>v)) return 0;
  if(isMax){
    let best=-Infinity;
    for(const i of emptyCells(bd)){ bd[i]=botSymbol; best=Math.max(best, minimax(bd,depth+1,false)); bd[i]=''; }
    return best;
  } else {
    let best=Infinity;
    for(const i of emptyCells(bd)){ bd[i]=humanSymbol; best=Math.min(best, minimax(bd,depth+1,true)); bd[i]=''; }
    return best;
  }
}

/* heuristique pour les grilles plus grandes : gagner > bloquer > jouer près du centre/pièces */
function wouldWin(bd, i, sym){
  bd[i]=sym; const w=checkWin(bd); bd[i]=''; return !!(w && w.player===sym);
}
function bestMoveHeuristic(){
  const empties = emptyCells(board);
  for(const i of empties) if(wouldWin(board,i,botSymbol)) return i;
  for(const i of empties) if(wouldWin(board,i,humanSymbol)) return i;
  const mid=(size-1)/2;
  const scored = empties.map(i=>{
    const r=Math.floor(i/size), c=i%size;
    let near=0;
    for(let dr=-1;dr<=1;dr++) for(let dc=-1;dc<=1;dc++){
      const nr=r+dr,nc=c+dc;
      if(nr>=0&&nr<size&&nc>=0&&nc<size&&board[idx(nr,nc)]) near++;
    }
    const dist = Math.abs(r-mid)+Math.abs(c-mid);
    return {i, score: near*3 - dist*0.3 + Math.random()};
  });
  scored.sort((a,b)=>b.score-a.score);
  return scored[0].i;
}
