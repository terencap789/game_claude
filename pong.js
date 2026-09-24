let mode='human';
document.querySelectorAll('#modeRow .optBtn').forEach(b=>{
  b.addEventListener('click', ()=>{
    document.querySelectorAll('#modeRow .optBtn').forEach(x=>x.classList.remove('selected'));
    b.classList.add('selected'); mode=b.dataset.mode;
  });
});
document.getElementById('startBtn').addEventListener('click', ()=>{
  document.getElementById('startScreen').style.display='none';
  document.getElementById('gameScreen').style.display='flex';
  document.getElementById('rightLabel').innerHTML = (mode==='bot' ? 'Robot ' : 'Joueur 2 ') + '<strong id="scoreRight">0</strong>';
  initPong();
});
document.getElementById('pongReset').addEventListener('click', ()=>{
  document.getElementById('gameScreen').style.display='none';
  document.getElementById('startScreen').style.display='flex';
  if(raf) cancelAnimationFrame(raf);
});

const W=480, H=320, PW=10, PH=64, BALL_R=6, WIN_SCORE=5;
let canvas, ctx, leftY, rightY, ball, scoreL, scoreR, keys={}, raf=null, running=false;

function initPong(){
  canvas=document.getElementById('pongCanvas'); ctx=canvas.getContext('2d');
  leftY=H/2-PH/2; rightY=H/2-PH/2; scoreL=0; scoreR=0; running=false;
  document.getElementById('scoreLeft').textContent=0;
  document.getElementById('scoreRight').textContent=0;
  resetBall(Math.random()<0.5?-1:1);
  showOverlay('🏓','Pong','Le premier à 5 points gagne.','Jouer');
  draw();
  document.getElementById('startButton').onclick = () => { hideOverlay(); running=true; if(!raf) loop(); };
}

function resetBall(dir){
  ball = {x:W/2, y:H/2, vx: 4*dir, vy: (Math.random()*4-2)};
}
function showOverlay(icon,title,text,btnLabel){
  document.getElementById('overlayIcon').textContent=icon;
  document.getElementById('overlayTitle').textContent=title;
  document.getElementById('overlayText').textContent=text;
  document.getElementById('startButton').textContent=btnLabel;
  document.getElementById('overlay').classList.remove('hidden');
}
function hideOverlay(){ document.getElementById('overlay').classList.add('hidden'); }

window.addEventListener('keydown', e=>{ keys[e.key.toLowerCase()]=true; if(['arrowup','arrowdown'].includes(e.key.toLowerCase())) e.preventDefault(); });
window.addEventListener('keyup', e=>{ keys[e.key.toLowerCase()]=false; });

function loop(){
  update();
  draw();
  if(running) raf=requestAnimationFrame(loop); else raf=null;
}

function update(){
  const speed=5.5;
  if(keys['w']) leftY-=speed; if(keys['s']) leftY+=speed;
  leftY=Math.max(0,Math.min(H-PH,leftY));

  if(mode==='human'){
    if(keys['arrowup']) rightY-=speed; if(keys['arrowdown']) rightY+=speed;
  } else {
    const target=ball.y-PH/2;
    const botSpeed=4.2;
    if(Math.abs(target-rightY)>4) rightY += target>rightY ? botSpeed : -botSpeed;
  }
  rightY=Math.max(0,Math.min(H-PH,rightY));

  ball.x+=ball.vx; ball.y+=ball.vy;
  if(ball.y<BALL_R){ ball.y=BALL_R; ball.vy*=-1; }
  if(ball.y>H-BALL_R){ ball.y=H-BALL_R; ball.vy*=-1; }

  // paddle gauche
  if(ball.x-BALL_R<PW+10 && ball.x-BALL_R>10 && ball.y>leftY && ball.y<leftY+PH && ball.vx<0){
    ball.vx*=-1.06; ball.x=PW+10+BALL_R;
    ball.vy += (ball.y-(leftY+PH/2))*0.12;
  }
  // paddle droite
  if(ball.x+BALL_R>W-PW-10 && ball.x+BALL_R<W-10 && ball.y>rightY && ball.y<rightY+PH && ball.vx>0){
    ball.vx*=-1.06; ball.x=W-PW-10-BALL_R;
    ball.vy += (ball.y-(rightY+PH/2))*0.12;
  }

  if(ball.x<0){ scoreR++; document.getElementById('scoreRight').textContent=scoreR; afterPoint(-1); }
  else if(ball.x>W){ scoreL++; document.getElementById('scoreLeft').textContent=scoreL; afterPoint(1); }
}

function afterPoint(nextDir){
  if(scoreL>=WIN_SCORE || scoreR>=WIN_SCORE){
    running=false;
    const winner = scoreL>scoreR ? (mode==='bot'?'Toi':'Joueur 1') : (mode==='bot'?'Le robot':'Joueur 2');
    showOverlay('🏆','Partie terminée', `${winner} gagne ${scoreL}-${scoreR} !`, 'Rejouer');
    document.getElementById('startButton').onclick = ()=> initPong();
    return;
  }
  resetBall(nextDir);
}

function draw(){
  ctx.fillStyle='#070a0f'; ctx.fillRect(0,0,W,H);
  ctx.strokeStyle='rgba(255,255,255,.12)'; ctx.setLineDash([6,8]);
  ctx.beginPath(); ctx.moveTo(W/2,0); ctx.lineTo(W/2,H); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle='#f2ede4';
  ctx.fillRect(10,leftY,PW,PH);
  ctx.fillRect(W-PW-10,rightY,PW,PH);
  ctx.fillStyle='#c76bd4';
  ctx.beginPath(); ctx.arc(ball.x,ball.y,BALL_R,0,Math.PI*2); ctx.fill();
}
