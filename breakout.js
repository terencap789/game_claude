const W=480, H=420;
const canvas=document.getElementById('brickCanvas'), ctx=canvas.getContext('2d');
const overlay=document.getElementById('overlay');
const startButton=document.getElementById('startButton');

const PADDLE_W=84, PADDLE_H=10, BALL_R=6;
const ROWS=5, COLS=8, BRICK_W=54, BRICK_H=18, GAP=6, OFFSET_TOP=44;
const OFFSET_LEFT=(W-(COLS*(BRICK_W+GAP)-GAP))/2;
const ROW_COLORS=['#e0524a','#e0785a','#e3b23c','#5fb87a','#4fb3c9'];

let paddleX, ball, bricks, score, lives, running=false, launched=false, keys={};

function initGame(){
  paddleX=W/2-PADDLE_W/2;
  score=0; lives=3;
  document.getElementById('brickScore').textContent=score;
  document.getElementById('brickLives').textContent=lives;
  bricks=[];
  for(let r=0;r<ROWS;r++){ const row=[]; for(let c=0;c<COLS;c++) row.push(true); bricks.push(row); }
  placeBallOnPaddle();
  running=false; launched=false;
  draw();
}
function placeBallOnPaddle(){
  ball={x:paddleX+PADDLE_W/2, y:H-30-BALL_R, vx:3.2, vy:-3.6};
}
function showOverlay(icon,title,text,btn){
  document.getElementById('overlayIcon').textContent=icon;
  document.getElementById('overlayTitle').textContent=title;
  document.getElementById('overlayText').textContent=text;
  startButton.textContent=btn;
  overlay.classList.remove('hidden');
}
function hideOverlay(){ overlay.classList.add('hidden'); }

startButton.addEventListener('click', ()=>{
  if(!running && !launched){ initGame(); }
  hideOverlay(); running=true; launched=true; loop();
});

window.addEventListener('keydown', e=>{ keys[e.key.toLowerCase()]=true; });
window.addEventListener('keyup', e=>{ keys[e.key.toLowerCase()]=false; });
canvas.addEventListener('mousemove', e=>{
  const rect=canvas.getBoundingClientRect();
  const scale=W/rect.width;
  const x=(e.clientX-rect.left)*scale;
  paddleX=Math.max(0,Math.min(W-PADDLE_W, x-PADDLE_W/2));
});

function loop(){
  update();
  draw();
  if(running) requestAnimationFrame(loop);
}

function update(){
  const speed=6.5;
  if(keys['arrowleft']||keys['a']) paddleX-=speed;
  if(keys['arrowright']||keys['d']) paddleX+=speed;
  paddleX=Math.max(0,Math.min(W-PADDLE_W,paddleX));

  ball.x+=ball.vx; ball.y+=ball.vy;
  if(ball.x<BALL_R){ ball.x=BALL_R; ball.vx*=-1; }
  if(ball.x>W-BALL_R){ ball.x=W-BALL_R; ball.vx*=-1; }
  if(ball.y<BALL_R){ ball.y=BALL_R; ball.vy*=-1; }

  const paddleY=H-20;
  if(ball.y+BALL_R>paddleY && ball.y+BALL_R<paddleY+PADDLE_H+8 && ball.x>paddleX && ball.x<paddleX+PADDLE_W && ball.vy>0){
    ball.y=paddleY-BALL_R;
    ball.vy*=-1;
    ball.vx += (ball.x-(paddleX+PADDLE_W/2))*0.08;
  }

  if(ball.y>H+20){
    lives--; document.getElementById('brickLives').textContent=lives;
    if(lives<=0){
      running=false;
      showOverlay('💥','Partie perdue', `Score final : ${score}`, 'Rejouer');
      launched=false;
      return;
    }
    placeBallOnPaddle(); running=false; launched=false;
    showOverlay('🏓','Balle perdue', 'Clique sur Jouer pour relancer la balle.', 'Relancer');
    return;
  }

  // collisions briques
  outer:
  for(let r=0;r<ROWS;r++) for(let c=0;c<COLS;c++){
    if(!bricks[r][c]) continue;
    const bx=OFFSET_LEFT+c*(BRICK_W+GAP), by=OFFSET_TOP+r*(BRICK_H+GAP);
    if(ball.x>bx-BALL_R && ball.x<bx+BRICK_W+BALL_R && ball.y>by-BALL_R && ball.y<by+BRICK_H+BALL_R){
      bricks[r][c]=false; score+=10; document.getElementById('brickScore').textContent=score;
      ball.vy*=-1;
      break outer;
    }
  }

  if(bricks.every(row=>row.every(b=>!b))){
    running=false;
    showOverlay('🎉','Bien joué !', `Toutes les briques cassées — score : ${score}`, 'Rejouer');
    launched=false;
  }
}

function draw(){
  ctx.fillStyle='#070a0f'; ctx.fillRect(0,0,W,H);
  for(let r=0;r<ROWS;r++) for(let c=0;c<COLS;c++){
    if(!bricks[r][c]) continue;
    const bx=OFFSET_LEFT+c*(BRICK_W+GAP), by=OFFSET_TOP+r*(BRICK_H+GAP);
    ctx.fillStyle=ROW_COLORS[r];
    ctx.fillRect(bx,by,BRICK_W,BRICK_H);
  }
  ctx.fillStyle='#f2ede4';
  ctx.fillRect(paddleX,H-20,PADDLE_W,PADDLE_H);
  ctx.fillStyle='#4fb3c9';
  ctx.beginPath(); ctx.arc(ball.x,ball.y,BALL_R,0,Math.PI*2); ctx.fill();
}

initGame();
