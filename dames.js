let mode='human';
let board, turn, over, sel, chainPiece=null; // chainPiece: position forcée à continuer de capturer

document.querySelectorAll('#modeRow .optBtn').forEach(b=>{
  b.addEventListener('click', ()=>{
    document.querySelectorAll('#modeRow .optBtn').forEach(x=>x.classList.remove('selected'));
    b.classList.add('selected'); mode=b.dataset.mode;
  });
});
document.getElementById('startBtn').addEventListener('click', startGame);
document.getElementById('damesReset').addEventListener('click', ()=>{
  document.getElementById('gameScreen').style.display='none';
  document.getElementById('startScreen').style.display='flex';
});

function startGame(){
  board=[];
  for(let r=0;r<8;r++){ const row=[]; for(let c=0;c<8;c++){
    let p=null;
    if((r+c)%2===1){ if(r<3) p={c:'b',k:false}; else if(r>4) p={c:'w',k:false}; }
    row.push(p);
  } board.push(row); }
  turn='w'; over=false; sel=null; chainPiece=null;
  document.getElementById('startScreen').style.display='none';
  document.getElementById('gameScreen').style.display='flex';
  buildBoard();
  render();
}

function buildBoard(){
  const el=document.getElementById('damesBoard'); el.innerHTML='';
  for(let r=0;r<8;r++) for(let c=0;c<8;c++){
    const sq=document.createElement('div');
    sq.className='sq '+(((r+c)%2===0)?'light':'dark');
    sq.dataset.r=r; sq.dataset.c=c;
    sq.addEventListener('click', ()=>onSquareClick(r,c));
    el.appendChild(sq);
  }
}

const DIAGS=[[-1,-1],[-1,1],[1,-1],[1,1]];
const inb=(r,c)=>r>=0&&r<8&&c>=0&&c<8;

/* captures possibles pour une pièce (retourne une liste de sauts simples {tr,tc,cap:{r,c}}) */
function pieceCaptures(bd,r,c){
  const p=bd[r][c]; if(!p) return [];
  const out=[];
  if(p.k){
    for(const [dr,dc] of DIAGS){
      let nr=r+dr,nc=c+dc, foundEnemy=null;
      while(inb(nr,nc)){
        const occ=bd[nr][nc];
        if(!occ){ if(foundEnemy) out.push({tr:nr,tc:nc,cap:foundEnemy}); nr+=dr; nc+=dc; continue; }
        if(occ.c===p.c) break;
        if(foundEnemy) break; // deux pièces adverses d'affilée -> saut impossible
        foundEnemy={r:nr,c:nc}; nr+=dr; nc+=dc;
      }
    }
  } else {
    for(const [dr,dc] of DIAGS){
      const mr=r+dr, mc=c+dc, lr=r+2*dr, lc=c+2*dc;
      if(inb(lr,lc) && bd[mr][mc] && bd[mr][mc].c!==p.c && !bd[lr][lc]) out.push({tr:lr,tc:lc,cap:{r:mr,c:mc}});
    }
  }
  return out;
}
/* déplacements simples (sans capture) */
function pieceSimpleMoves(bd,r,c){
  const p=bd[r][c]; if(!p) return [];
  const out=[];
  if(p.k){
    for(const [dr,dc] of DIAGS){
      let nr=r+dr,nc=c+dc;
      while(inb(nr,nc) && !bd[nr][nc]){ out.push({tr:nr,tc:nc}); nr+=dr; nc+=dc; }
    }
  } else {
    const fwd = p.c==='w' ? -1 : 1;
    for(const dc of [-1,1]){
      const nr=r+fwd,nc=c+dc;
      if(inb(nr,nc) && !bd[nr][nc]) out.push({tr:nr,tc:nc});
    }
  }
  return out;
}

/* tous les coups légaux du joueur (prise obligatoire si une capture existe) */
function allMoves(bd,player){
  const captures=[], simples=[];
  for(let r=0;r<8;r++) for(let c=0;c<8;c++){
    const p=bd[r][c]; if(!p||p.c!==player) continue;
    pieceCaptures(bd,r,c).forEach(m=>captures.push({r,c,...m}));
    pieceSimpleMoves(bd,r,c).forEach(m=>simples.push({r,c,...m}));
  }
  return captures.length ? captures : simples;
}

function render(){
  document.querySelectorAll('#damesBoard .sq').forEach(sq=>{
    const r=+sq.dataset.r,c=+sq.dataset.c;
    sq.innerHTML=''; sq.classList.remove('sel','move');
    const p=board[r][c];
    if(p){ const s=document.createElement('span'); s.textContent = p.k ? (p.c==='w'?'⛁':'⛀') : '●'; s.className='piece-'+p.c; sq.appendChild(s); }
  });
  let statusMsg = `Au tour des <strong>${turn==='w'?'blancs':'noirs'}</strong>`;
  if(over){ document.getElementById('damesStatus').innerHTML = statusMsg; return; }

  const legal = chainPiece ? pieceCaptures(board,chainPiece.r,chainPiece.c).map(m=>({r:chainPiece.r,c:chainPiece.c,...m})) : allMoves(board,turn);
  if(legal.length===0){
    over=true;
    document.getElementById('damesStatus').innerHTML = `<strong>${turn==='w'?'Noirs':'Blancs'}</strong> gagnent (plus aucun coup possible) !`;
    return;
  }
  if(sel){
    document.querySelector(`.sq[data-r="${sel.r}"][data-c="${sel.c}"]`).classList.add('sel');
    legal.filter(m=>m.r===sel.r&&m.c===sel.c).forEach(m=>{
      document.querySelector(`.sq[data-r="${m.tr}"][data-c="${m.tc}"]`).classList.add('move');
    });
  }
  if(chainPiece) statusMsg += ' — prise multiple : continuez avec la même pièce';
  document.getElementById('damesStatus').innerHTML = statusMsg;
}

function onSquareClick(r,c){
  if(over) return;
  if(mode==='bot' && turn==='b') return;
  const legal = chainPiece ? pieceCaptures(board,chainPiece.r,chainPiece.c).map(m=>({r:chainPiece.r,c:chainPiece.c,...m})) : allMoves(board,turn);

  if(sel){
    const mv = legal.find(m=>m.r===sel.r&&m.c===sel.c&&m.tr===r&&m.tc===c);
    if(mv){ executeMove(mv); return; }
  }
  const p=board[r][c];
  if(p && p.c===turn && (!chainPiece || (chainPiece.r===r&&chainPiece.c===c)) && legal.some(m=>m.r===r&&m.c===c)){
    sel={r,c}; render();
  } else if(!chainPiece){ sel=null; render(); }
}

function executeMove(mv){
  const p=board[mv.r][mv.c];
  board[mv.r][mv.c]=null;
  board[mv.tr][mv.tc]=p;
  let wasCapture=false;
  if(mv.cap){ board[mv.cap.r][mv.cap.c]=null; wasCapture=true; }
  const promoted = (p.c==='w' && mv.tr===0) || (p.c==='b' && mv.tr===7);
  if(promoted) p.k=true;

  if(wasCapture){
    const further = pieceCaptures(board,mv.tr,mv.tc);
    if(further.length){ sel={r:mv.tr,c:mv.tc}; chainPiece={r:mv.tr,c:mv.tc}; render(); maybeBot(); return; }
  }
  sel=null; chainPiece=null;
  turn = turn==='w' ? 'b' : 'w';
  render();
  maybeBot();
}

function maybeBot(){
  if(over || mode!=='bot' || turn!=='b') return;
  setTimeout(botMove, 350);
}
function botMove(){
  if(over) return;
  const legal = chainPiece ? pieceCaptures(board,chainPiece.r,chainPiece.c).map(m=>({r:chainPiece.r,c:chainPiece.c,...m})) : allMoves(board,turn);
  if(!legal.length) return;
  // préfère la capture qui prend une dame, sinon coup aléatoire
  legal.sort((a,b)=>{
    const av = a.cap && board[a.cap.r][a.cap.c] && board[a.cap.r][a.cap.c].k ? 1 : 0;
    const bv = b.cap && board[b.cap.r][b.cap.c] && board[b.cap.r][b.cap.c].k ? 1 : 0;
    return bv-av;
  });
  const best = legal.filter(m=>{
    const bv = m.cap && board[m.cap.r][m.cap.c] && board[m.cap.r][m.cap.c].k;
    return legal[0].cap ? (m.cap!==undefined) : true;
  });
  const pick = best[Math.random()*best.length|0];
  executeMove(pick);
}
