// === FLAPPY MODI v2 ===
// includes timer-based scoring and dynamic speed

let board;
let boardWidth = 360;
let boardHeight = 640;
let context;

// Bird setup
let birdWidth = 50;
let birdHeight = 82;
let birdX = boardWidth / 8;
let birdY = boardHeight / 2;
let birdImg;

// Logo
let logoImg;

let bird = { x: birdX, y: birdY, width: birdWidth, height: birdHeight };

// Pipes
let pipeArray = [];
let pipeWidth = 60;
let pipeHeight = 382;
let pipeX = boardWidth;
let pipeY = 0;

let topPipeImg;
let bottomPipeImg;

// Physics
let velocityX = -2;
let velocityY = 0;
let gravity = 0.4;

let gameOver = false;
let gameStarted = false;
let score = 0; // now actual pipes passed
let votes = 0; // time survived in seconds
let startTime = null;

// Sound
let sounds = {
  wing: new Audio("./sfx_wing.wav"),
  point: new Audio("./sfx_point.wav"),
  hit: new Audio("./sfx_hit.wav"),
  die: new Audio("./sfx_die.wav"),
  swooshing: new Audio("./sfx_swooshing.wav"),
  bgm: new Audio("./saiyaraModiji.mp3")
};

sounds.bgm.loop = true;
sounds.bgm.volume = 0.1;

let bgmStarted = false;

window.onload = function () {
  board = document.getElementById("board");
  board.height = boardHeight;
  board.width = boardWidth;
  context = board.getContext("2d");

  context.imageSmoothingEnabled = false;

  // load images
  birdImg = new Image();
  birdImg.src = "./flappybird.png";
  birdImg.onload = () => context.drawImage(birdImg, bird.x, bird.y, bird.width, bird.height);

  logoImg = new Image();
  logoImg.src = "./flappyModiLogo.png";

  topPipeImg = new Image();
  topPipeImg.src = "./toppipe.png";

  bottomPipeImg = new Image();
  bottomPipeImg.src = "./bottompipe.png";

  requestAnimationFrame(update);
  document.addEventListener("keydown", moveBird);
  document.addEventListener("click", moveBird);
  document.addEventListener("touchstart", moveBird);

  window.addEventListener("keydown", e => {
    if (e.code === "Space" || e.code === "ArrowUp") e.preventDefault();
  });

  const unlockAudio = () => {
    if (!bgmStarted) {
      sounds.bgm.play().then(() => (bgmStarted = true));
    }
  };

  document.body.addEventListener("touchstart", unlockAudio, { once: true });
  document.body.addEventListener("mousedown", unlockAudio, { once: true });
  document.body.addEventListener("keydown", unlockAudio, { once: true });
};

function update(timestamp) {
  requestAnimationFrame(update);
  context.clearRect(0, 0, board.width, board.height);

  if (!gameStarted && !gameOver) {
    drawStartScreen();
    return;
  }

  if (gameOver) {
    drawGameOverScreen();
    return;
  }

  // time counter
  if (!startTime) startTime = timestamp;
  let elapsed = (timestamp - startTime) / 1000;
  votes = Math.floor(elapsed); // time survived = votes

  // gradually increase speed every 10 seconds
  velocityX = -2 - Math.floor(elapsed / 10) * 0.5;

  // bird physics
  velocityY += gravity;
  bird.y = Math.max(bird.y + velocityY, 0);

  if (bird.y > board.height) {
    gameOver = true;
    playSound(sounds.die);
  }

  // pipes
  for (let pipe of pipeArray) {
    pipe.x += velocityX;
    context.drawImage(pipe.img, pipe.x, pipe.y, pipe.width, pipe.height);

    if (!pipe.passed && bird.x > pipe.x + pipe.width) {
      score += 0.5;
      pipe.passed = true;
      if (score % 1 === 0) playSound(sounds.point);
    }

    if (detectCollision(bird, pipe)) {
      gameOver = true;
      playSound(sounds.hit);
      setTimeout(() => playSound(sounds.die), 100);
    }
  }

  while (pipeArray.length > 0 && pipeArray[0].x < -pipeWidth) {
    pipeArray.shift();
  }

  // draw bird
  context.drawImage(birdImg, bird.x, bird.y, bird.width, bird.height);

  // HUD (votes + score)
  drawHUD(votes, score);
}

function drawStartScreen() {
  if (logoImg.complete) {
    let logoWidth = 280;
    let logoHeight = (logoImg.height / logoImg.width) * logoWidth;
    let logoX = (boardWidth - logoWidth) / 2;
    let logoY = boardHeight / 4 - 20;
    context.drawImage(logoImg, logoX, logoY, logoWidth, logoHeight);
  }

  let centerBirdX = (boardWidth - birdWidth) / 2;
  let centerBirdY = boardHeight / 2 - 30;
  context.drawImage(birdImg, centerBirdX, centerBirdY, birdWidth, birdHeight);

  context.fillStyle = "white";
  context.strokeStyle = "black";
  context.lineWidth = 3;

  context.font = "bold 28px sans-serif";
  let startText = "Tap to Start";
  let startWidth = context.measureText(startText).width;
  let startX = (boardWidth - startWidth) / 2;
  context.strokeText(startText, startX, boardHeight - 180);
  context.fillText(startText, startX, boardHeight - 180);

  context.font = "22px sans-serif";
  let instructionText = "Tap / Space to Flap";
  let instructionWidth = context.measureText(instructionText).width;
  let instructionX = (boardWidth - instructionWidth) / 2;
  context.strokeText(instructionText, instructionX, boardHeight - 140);
  context.fillText(instructionText, instructionX, boardHeight - 140);
}

function drawGameOverScreen() {
  if (logoImg.complete) {
    let logoWidth = 280;
    let logoHeight = (logoImg.height / logoImg.width) * logoWidth;
    let logoX = (boardWidth - logoWidth) / 2;
    let logoY = 80;
    context.drawImage(logoImg, logoX, logoY, logoWidth, logoHeight);
  }

  context.fillStyle = "white";
  context.strokeStyle = "black";
  context.lineWidth = 3;
  context.font = "bold 45px";
  let gameOverText = "GAME OVER";
  let gameOverWidth = context.measureText(gameOverText).width;
  let gameOverX = (boardWidth - gameOverWidth) / 2;
  context.strokeText(gameOverText, gameOverX, boardHeight / 2 + 20);
  context.fillText(gameOverText, gameOverX, boardHeight / 2 + 20);

  context.font = "bold 35px sans-serif";
  let finalVotesText = `Votes: ${votes}`;
  let finalScoreText = `Score: ${score}`;
  context.strokeText(finalVotesText, 100, boardHeight / 2 + 80);
  context.fillText(finalVotesText, 100, boardHeight / 2 + 80);
  context.strokeText(finalScoreText, 100, boardHeight / 2 + 130);
  context.fillText(finalScoreText, 100, boardHeight / 2 + 130);

  context.font = "27px sans-serif";
  let restartText = "Tap to Restart";
  let restartWidth = context.measureText(restartText).width;
  let restartX = (boardWidth - restartWidth) / 2;
  context.strokeText(restartText, restartX, boardHeight - 150);
  context.fillText(restartText, restartX, boardHeight - 150);
}

function drawHUD(votes, score) {
  context.fillStyle = "white";
  context.strokeStyle = "black";
  context.lineWidth = 3;
  context.font = "bold 28px sans-serif";

  context.strokeText(`Votes: ${votes}`, 20, 40);
  context.fillText(`Votes: ${votes}`, 20, 40);

  context.strokeText(`Score: ${score}`, 20, 80);
  context.fillText(`Score: ${score}`, 20, 80);
}

function placePipes() {
  if (gameOver || !gameStarted) return;

  let randomPipeY = pipeY - pipeHeight / 4 - Math.random() * (pipeHeight / 2);
  let openingSpace = board.height / 4;

  pipeArray.push({ img: topPipeImg, x: pipeX, y: randomPipeY, width: pipeWidth, height: pipeHeight, passed: false });
  pipeArray.push({
    img: bottomPipeImg,
    x: pipeX,
    y: randomPipeY + pipeHeight + openingSpace,
    width: pipeWidth,
    height: pipeHeight,
    passed: false
  });

  playSound(sounds.swooshing);
}

function moveBird(e) {
  if (e.type === "keydown" && !["Space", "ArrowUp", "KeyX"].includes(e.code)) return;
  if (e.type === "click" || e.type === "touchstart") e.preventDefault();

  if (!gameStarted && !gameOver) {
    gameStarted = true;
    startTime = null;
    score = 0;
    votes = 0;
    sounds.bgm.volume = 0.5;
    setInterval(placePipes, 1500);
  }

  velocityY = -6;
  sounds.wing.volume = 0.7;
  playSound(sounds.wing);

  if (gameOver) {
    Object.values(sounds).forEach(s => {
      if (!s.loop) {
        s.pause();
        s.currentTime = 0;
      }
    });
    bird.y = birdY;
    pipeArray = [];
    gameOver = false;
    gameStarted = true;
    startTime = null;
    score = 0;
    votes = 0;
    velocityX = -2;
    sounds.bgm.volume = 0.5;
  }
}

function detectCollision(a, b) {
  let padding = 8;
  return (
    a.x + padding < b.x + b.width &&
    a.x + a.width - padding > b.x &&
    a.y + padding < b.y + b.height &&
    a.y + a.height - padding > b.y
  );
}

function playSound(sound) {
  sound.currentTime = 0;
  sound.play().catch(() => {});
}
