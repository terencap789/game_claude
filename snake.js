const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const scoreEl = document.getElementById("score");
const highScoreEl = document.getElementById("highScore");
const overlay = document.getElementById("overlay");
const overlayTitle = document.getElementById("overlayTitle");
const overlayText = document.getElementById("overlayText");
const overlayIcon = document.getElementById("overlayIcon");
const startButton = document.getElementById("startButton");

const GRID = 24;
const CELL = canvas.width / GRID;

let snake;
let food;
let direction;
let nextDirection;
let score = 0;
let highScore = Number(localStorage.getItem("snakeHighScore")) || 0;
let gameRunning = false;
let gamePaused = false;
let timer = null;
let speed = 115;

highScoreEl.textContent = highScore;

function resetGame() {
  snake = [
    { x: 12, y: 12 },
    { x: 11, y: 12 },
    { x: 10, y: 12 },
    { x: 9, y: 12},
    { x: 8, y: 12},
    { x: 7, y: 12}
  ];
  direction = { x: 1, y: 0 };
  nextDirection = { x: 1, y: 0 };
  score = 0;
  speed = 115;
  scoreEl.textContent = score;
  spawnFood();
  draw();
}

function spawnFood() {
  do {
    food = {
      x: Math.floor(Math.random() * GRID),
      y: Math.floor(Math.random() * GRID)
    };
  } while (snake.some(part => part.x === food.x && part.y === food.y));
}

function startGame() {
  clearInterval(timer);
  resetGame();
  gameRunning = true;
  gamePaused = false;
  hideOverlay();
  timer = setInterval(gameLoop, speed);
}

function gameLoop() {
  if (!gameRunning || gamePaused) return;

  direction = nextDirection;

  const head = {
    x: snake[0].x + direction.x,
    y: snake[0].y + direction.y
  };

  // Collision avec les murs
  if (head.x < 0 || head.x >= GRID || head.y < 0 || head.y >= GRID) {
    endGame();
    return;
  }

  // Collision avec le corps
  if (snake.some(part => part.x === head.x && part.y === head.y)) {
    endGame();
    return;
  }

  snake.unshift(head);

  if (head.x === food.x && head.y === food.y) {
    score++;
    scoreEl.textContent = score;

    if (score > highScore) {
      highScore = score;
      highScoreEl.textContent = highScore;
      localStorage.setItem("snakeHighScore", highScore);
    }

    spawnFood();

    // Le jeu accélère légèrement au fil du score.
    if (score % 5 === 0 && speed > 55) {
      speed -= 7;
      clearInterval(timer);
      timer = setInterval(gameLoop, speed);
    }
  } else {
    snake.pop();
  }

  draw();
}

function endGame() {
  gameRunning = false;
  clearInterval(timer);
  draw();

  overlayIcon.textContent = "💥";
  overlayTitle.textContent = "Game Over";
  overlayText.textContent = `Ton score : ${score} — record : ${highScore}`;
  startButton.textContent = "Rejouer";
  overlay.classList.remove("hidden");
}

function togglePause() {
  if (!gameRunning) return;

  gamePaused = !gamePaused;

  if (gamePaused) {
    overlayIcon.textContent = "⏸️";
    overlayTitle.textContent = "Pause";
    overlayText.textContent = "Appuie sur Échap ou sur le bouton pour reprendre.";
    startButton.textContent = "Reprendre";
    overlay.classList.remove("hidden");
  } else {
    hideOverlay();
  }
}

function hideOverlay() {
  overlay.classList.add("hidden");
}

function setDirection(newDirection) {
  if (!gameRunning) {
    startGame();
  }

  if (gamePaused) return;

  // Empêche le demi-tour instantané.
  if (
    newDirection.x === -direction.x &&
    newDirection.y === -direction.y
  ) {
    return;
  }

  nextDirection = newDirection;
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Fond + grille
  ctx.fillStyle = "#070a0f";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = "rgba(255,255,255,.045)";
  ctx.lineWidth = 1;

  for (let i = 0; i <= GRID; i++) {
    const p = i * CELL;
    ctx.beginPath();
    ctx.moveTo(p, 0);
    ctx.lineTo(p, canvas.height);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, p);
    ctx.lineTo(canvas.width, p);
    ctx.stroke();
  }

  // Nourriture
  const foodX = food.x * CELL + CELL / 2;
  const foodY = food.y * CELL + CELL / 2;
  const foodRadius = CELL * .29;

  ctx.fillStyle = "#ff5b6e";
  ctx.beginPath();
  ctx.arc(foodX, foodY, foodRadius, 0, Math.PI * 2);
  ctx.fill();

  // Petit reflet
  ctx.fillStyle = "rgba(255,255,255,.65)";
  ctx.beginPath();
  ctx.arc(foodX - foodRadius * .3, foodY - foodRadius * .3, foodRadius * .22, 0, Math.PI * 2);
  ctx.fill();

  // Serpent
  snake.forEach((part, index) => {
    const padding = index === 0 ? 2 : 3;
    const x = part.x * CELL + padding;
    const y = part.y * CELL + padding;
    const size = CELL - padding * 2;

    ctx.fillStyle = index === 0 ? "#72f38c" : "#38cf68";
    roundRect(ctx, x, y, size, size, 5);
    ctx.fill();

    if (index === 0) {
      drawEyes(x, y, size);
    }
  });
}

function drawEyes(x, y, size) {
  ctx.fillStyle = "#07100a";

  let eye1;
  let eye2;

  if (direction.x === 1) {
    eye1 = { x: x + size * .68, y: y + size * .30 };
    eye2 = { x: x + size * .68, y: y + size * .70 };
  } else if (direction.x === -1) {
    eye1 = { x: x + size * .32, y: y + size * .30 };
    eye2 = { x: x + size * .32, y: y + size * .70 };
  } else if (direction.y === -1) {
    eye1 = { x: x + size * .30, y: y + size * .32 };
    eye2 = { x: x + size * .70, y: y + size * .32 };
  } else {
    eye1 = { x: x + size * .30, y: y + size * .68 };
    eye2 = { x: x + size * .70, y: y + size * .68 };
  }

  ctx.beginPath();
  ctx.arc(eye1.x, eye1.y, 2.2, 0, Math.PI * 2);
  ctx.arc(eye2.x, eye2.y, 2.2, 0, Math.PI * 2);
  ctx.fill();
}

function roundRect(ctx, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

// Clavier
document.addEventListener("keydown", (event) => {
  const key = event.key.toLowerCase();

  const directions = {
    arrowup: { x: 0, y: -1 },
    w: { x: 0, y: -1 },
    arrowdown: { x: 0, y: 1 },
    s: { x: 0, y: 1 },
    arrowleft: { x: -1, y: 0 },
    a: { x: -1, y: 0 },
    arrowright: { x: 1, y: 0 },
    d: { x: 1, y: 0 }
  };

  if (directions[key]) {
    event.preventDefault();
    setDirection(directions[key]);
  }

  if (key === "escape") {
    event.preventDefault();
    togglePause();
  }
});

// Boutons tactiles
document.querySelectorAll(".control[data-direction]").forEach(button => {
  button.addEventListener("pointerdown", () => {
    const dir = button.dataset.direction;

    const directions = {
      up: { x: 0, y: -1 },
      down: { x: 0, y: 1 },
      left: { x: -1, y: 0 },
      right: { x: 1, y: 0 }
    };

    setDirection(directions[dir]);
  });
});

startButton.addEventListener("click", () => {
  if (gamePaused) {
    togglePause();
  } else {
    startGame();
  }
});

// Premier affichage
resetGame();
