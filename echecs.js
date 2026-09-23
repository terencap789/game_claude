let mode='human';
let board, turn, over, sel, castling, legalCache;
const glyph={wK:'♔',wQ:'♕',wR:'♖',wB:'♗',wN:'♘',wP:'♙',bK:'♚',bQ:'♛',bR:'♜',bB:'♝',bN:'♞',bP:'♟'};
const inb=(r,c)=>r>=0&&r<8&&c>=0&&c<8;
const opp=color=>color==='w'?'b':'w';

document.querySelectorAll('#modeRow .optBtn').forEach(b=>{
  b.addEventListener('click', ()=>{
    document.querySelectorAll('#modeRow .optBtn').forEach(x=>x.classList.remove('selected'));
    b.classList.add('selected'); mode=b.dataset.mode;
  });
});
document.getElementById('startBtn').addEventListener('click', startGame);
document.getElementById('chessReset').addEventListener('click', ()=>{
  document.getElementById('gameScreen').style.display='none';
  document.getElementById('startScreen').style.display='flex';
});

function startGame(){
  const back=['R','N','B','Q','K','B','N','R'];
  board=[];
  board.push(back.map(t=>'b'+t));
  board.push(Array(8).fill('bP'));
  for(let i=0;i<4;i++) board.push(Array(8).fill(''));
  board.push(Array(8).fill('wP'));
  board.push(back.map(t=>'w'+t));
  turn='w'; over=false; sel=null;
  castling={wK:true,wQ:true,bK:true,bQ:true};
  document.getElementById('startScreen').style.display='none';
  document.getElementById('gameScreen').style.display='flex';
  buildBoard();
  refreshLegal();
  render();
}

function buildBoard(){
  const el=document.getElementById('chessBoard'); el.innerHTML='';
  for(let r=0;r<8;r++) for(let c=0;c<8;c++){
    const sq=document.createElement('div');
    sq.className='sq '+(((r+c)%2===0)?'light':'dark');
    sq.dataset.r=r; sq.dataset.c=c;
    sq.addEventListener('click', ()=>onSquareClick(r,c));
    el.appendChild(sq);
  }
}

/* ---------- cases attaquées (sans le roque, pour la détection d'échec) ---------- */
function attackSquares(bd,r,c){
  const p=bd[r][c]; if(!p) return [];
  const color=p[0], type=p[1], out=[];
  const slide=(dirs)=>dirs.forEach(([dr,dc])=>{
    let nr=r+dr,nc=c+dc;
    while(inb(nr,nc)){ out.push({tr:nr,tc:nc}); if(bd[nr][nc]) break; nr+=dr; nc+=dc; }
  });
  if(type==='P'){
    const dir=color==='w'?-1:1;
    [[dir,-1],[dir,1]].forEach(([dr,dc])=>{ const nr=r+dr,nc=c+dc; if(inb(nr,nc)) out.push({tr:nr,tc:nc}); });
  } else if(type==='N'){
    [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]].forEach(([dr,dc])=>{ const nr=r+dr,nc=c+dc; if(inb(nr,nc)) out.push({tr:nr,tc:nc}); });
  } else if(type==='B'){ slide([[-1,-1],[-1,1],[1,-1],[1,1]]); }
  else if(type==='R'){ slide([[-1,0],[1,0],[0,-1],[0,1]]); }
  else if(type==='Q'){ slide([[-1,-1],[-1,1],[1,-1],[1,1],[-1,0],[1,0],[0,-1],[0,1]]); }
  else if(type==='K'){ [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]].forEach(([dr,dc])=>{ const nr=r+dr,nc=c+dc; if(inb(nr,nc)) out.push({tr:nr,tc:nc}); }); }
  return out;
}
function isAttacked(bd,r,c,byColor){
  for(let rr=0;rr<8;rr++) for(let cc=0;cc<8;cc++){
    const p=bd[rr][cc];
    if(p && p[0]===byColor && attackSquares(bd,rr,cc).some(s=>s.tr===r&&s.tc===c)) return true;
  }
  return false;
}
function findKing(bd,color){
  for(let r=0;r<8;r++) for(let c=0;c<8;c++) if(bd[r][c]===color+'K') return {r,c};
  return null;
}

/* ---------- coups possibles (avec roque) ; destination = tr,tc ---------- */
function pseudoMoves(bd,r,c,rights){
  const p=bd[r][c]; if(!p) return [];
  const color=p[0], type=p[1], moves=[];
  const add=(nr,nc)=>{ if(!inb(nr,nc)) return false; const t=bd[nr][nc];
    if(!t){ moves.push({tr:nr,tc:nc}); return true; } if(t[0]!==color) moves.push({tr:nr,tc:nc}); return false; };
  const slide=(dirs)=>dirs.forEach(([dr,dc])=>{ let nr=r+dr,nc=c+dc; while(inb(nr,nc)){ const cont=add(nr,nc); if(!cont) break; nr+=dr; nc+=dc; } });
  if(type==='P'){
    const dir=color==='w'?-1:1, startRow=color==='w'?6:1;
    if(inb(r+dir,c) && !bd[r+dir][c]){ moves.push({tr:r+dir,tc:c}); if(r===startRow && !bd[r+2*dir][c]) moves.push({tr:r+2*dir,tc:c}); }
    [c-1,c+1].forEach(nc=>{ if(inb(r+dir,nc) && bd[r+dir][nc] && bd[r+dir][nc][0]!==color) moves.push({tr:r+dir,tc:nc}); });
  } else if(type==='N'){
    [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]].forEach(([dr,dc])=>{ const nr=r+dr,nc=c+dc; if(inb(nr,nc)){ const t=bd[nr][nc]; if(!t||t[0]!==color) moves.push({tr:nr,tc:nc}); } });
  } else if(type==='B'){ slide([[-1,-1],[-1,1],[1,-1],[1,1]]); }
  else if(type==='R'){ slide([[-1,0],[1,0],[0,-1],[0,1]]); }
  else if(type==='Q'){ slide([[-1,-1],[-1,1],[1,-1],[1,1],[-1,0],[1,0],[0,-1],[0,1]]); }
  else if(type==='K'){
    [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]].forEach(([dr,dc])=>{ const nr=r+dr,nc=c+dc; if(inb(nr,nc)){ const t=bd[nr][nc]; if(!t||t[0]!==color) moves.push({tr:nr,tc:nc}); } });
    if(rights){
      const rank = color==='w'?7:0;
      if(r===rank && c===4 && !isAttacked(bd,rank,4,opp(color))){
        if(rights[color+'K'] && !bd[rank][5] && !bd[rank][6] && bd[rank][7]===color+'R'
           && !isAttacked(bd,rank,5,opp(color)) && !isAttacked(bd,rank,6,opp(color)))
          moves.push({tr:rank,tc:6,castle:'K'});
        if(rights[color+'Q'] && !bd[rank][3] && !bd[rank][2] && !bd[rank][1] && bd[rank][0]===color+'R'
           && !isAttacked(bd,rank,3,opp(color)) && !isAttacked(bd,rank,2,opp(color)))
          moves.push({tr:rank,tc:2,castle:'Q'});
      }
    }
  }
  return moves;
}

function applyMove(bd,rights,r,c,m){
  const nb=bd.map(row=>row.slice());
  const nr2=Object.assign({},rights);
  const p=nb[r][c];
  nb[r][c]='';
  nb[m.tr][m.tc]=p;
  if(p[1]==='P' && (m.tr===0||m.tr===7)) nb[m.tr][m.tc]=p[0]+'Q';
  if(m.castle==='K'){ const rank=p[0]==='w'?7:0; nb[rank][5]=nb[rank][7]; nb[rank][7]=''; }
  if(m.castle==='Q'){ const rank=p[0]==='w'?7:0; nb[rank][3]=nb[rank][0]; nb[rank][0]=''; }
  if(p[1]==='K'){ nr2[p[0]+'K']=false; nr2[p[0]+'Q']=false; }
  if(p[1]==='R'){
    const rank0=p[0]==='w'?7:0;
    if(r===rank0 && c===0) nr2[p[0]+'Q']=false;
    if(r===rank0 && c===7) nr2[p[0]+'K']=false;
  }
  if(m.tr===0 && m.tc===0) nr2.bQ=false;
  if(m.tr===0 && m.tc===7) nr2.bK=false;
  if(m.tr===7 && m.tc===0) nr2.wQ=false;
  if(m.tr===7 && m.tc===7) nr2.wK=false;
  return {board:nb, rights:nr2};
}

function legalMovesFor(bd,rights,color){
  const out=[];
  for(let r=0;r<8;r++) for(let c=0;c<8;c++){
    const p=bd[r][c]; if(!p||p[0]!==color) continue;
    pseudoMoves(bd,r,c,rights).forEach(m=>{
      const res=applyMove(bd,rights,r,c,m);
      const k=findKing(res.board,color);
      if(k && !isAttacked(res.board,k.r,k.c,opp(color))) out.push({r,c,tr:m.tr,tc:m.tc,castle:m.castle});
    });
  }
  return out;
}
function refreshLegal(){ legalCache = legalMovesFor(board,castling,turn); }

/* ---------- rendu et interaction ---------- */
function render(){
  document.querySelectorAll('#chessBoard .sq').forEach(sq=>{
    const r=+sq.dataset.r,c=+sq.dataset.c; sq.innerHTML=''; sq.classList.remove('sel','move','hasPiece','check');
    const p=board[r][c];
    if(p){ const s=document.createElement('span'); s.textContent=glyph[p]; s.className='piece-'+p[0]; sq.appendChild(s); }
  });
  const kp=findKing(board,turn);
  const inCheck = kp && isAttacked(board,kp.r,kp.c,opp(turn));
  if(inCheck) document.querySelector(`.sq[data-r="${kp.r}"][data-c="${kp.c}"]`).classList.add('check');

  if(legalCache.length===0){
    over=true;
    const msg = inCheck ? `Échec et mat — <strong>${turn==='w'?'les noirs':'les blancs'}</strong> gagnent !` : 'Pat — match nul !';
    document.getElementById('chessStatus').innerHTML=msg;
    return;
  }
  let statusMsg=`Au tour des <strong>${turn==='w'?'blancs':'noirs'}</strong>`;
  if(inCheck) statusMsg+=' — échec !';
  document.getElementById('chessStatus').innerHTML=statusMsg;

  if(sel){
    document.querySelector(`.sq[data-r="${sel.r}"][data-c="${sel.c}"]`).classList.add('sel');
    legalCache.filter(m=>m.r===sel.r&&m.c===sel.c).forEach(m=>{
      const destSq=document.querySelector(`.sq[data-r="${m.tr}"][data-c="${m.tc}"]`);
      destSq.classList.add('move');
      if(board[m.tr][m.tc]) destSq.classList.add('hasPiece');
    });
  }
}

function onSquareClick(r,c){
  if(over) return;
  if(mode==='bot' && turn==='b') return;
  if(sel){
    const mv = legalCache.find(m=>m.r===sel.r&&m.c===sel.c&&m.tr===r&&m.tc===c);
    if(mv){ playMove(mv); return; }
  }
  const p=board[r][c];
  if(p && p[0]===turn){ sel={r,c}; render(); }
  else { sel=null; render(); }
}

function playMove(mv){
  const res=applyMove(board,castling,mv.r,mv.c,mv);
  board=res.board; castling=res.rights;
  sel=null;
  turn=opp(turn);
  refreshLegal();
  render();
  if(mode==='bot' && !over && turn==='b') setTimeout(botMove,400);
}

/* ---------- IA : minimax simple avec évaluation matérielle ---------- */
const VAL={P:1,N:3,B:3,R:5,Q:9,K:0};
function evaluate(bd){
  let s=0;
  for(let r=0;r<8;r++) for(let c=0;c<8;c++){ const p=bd[r][c]; if(p) s += (p[0]==='w'?1:-1)*VAL[p[1]]; }
  return s;
}
function minimax(bd,rights,color,depth,alpha,beta){
  const moves=legalMovesFor(bd,rights,color);
  if(moves.length===0){
    const k=findKing(bd,color);
    const inCheck = k && isAttacked(bd,k.r,k.c,opp(color));
    if(!inCheck) return 0;
    return color==='w' ? -1000+depth : 1000-depth;
  }
  if(depth===0) return evaluate(bd);
  if(color==='w'){
    let best=-Infinity;
    for(const m of moves){
      const res=applyMove(bd,rights,m.r,m.c,m);
      best=Math.max(best, minimax(res.board,res.rights,'b',depth-1,alpha,beta));
      alpha=Math.max(alpha,best);
      if(beta<=alpha) break;
    }
    return best;
  } else {
    let best=Infinity;
    for(const m of moves){
      const res=applyMove(bd,rights,m.r,m.c,m);
      best=Math.min(best, minimax(res.board,res.rights,'w',depth-1,alpha,beta));
      beta=Math.min(beta,best);
      if(beta<=alpha) break;
    }
    return best;
  }
}
function botMove(){
  if(over) return;
  const moves=legalMovesFor(board,castling,'b');
  if(!moves.length) return;
  let bestScore=Infinity, bestMoves=[];
  for(const m of moves){
    const res=applyMove(board,castling,m.r,m.c,m);
    const score=minimax(res.board,res.rights,'w',2,-Infinity,Infinity);
    if(score<bestScore){ bestScore=score; bestMoves=[m]; }
    else if(score===bestScore) bestMoves.push(m);
  }
  const pick=bestMoves[Math.random()*bestMoves.length|0];
  playMove(pick);
}
