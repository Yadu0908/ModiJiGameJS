//board
let board;
let boardWidth = 360;
let boardHeight = 640;
let context;

//bird
let birdWidth = 50; // Increased size for better clarity
let birdHeight = 82; // Maintaining 377:661 aspect ratio
let birdX = boardWidth / 8;
let birdY = boardHeight / 2;
let birdImg;

// Logo image
let logoImg;

let bird = {
  x: birdX,
  y: birdY,
  width: birdWidth,
  height: birdHeight
};

//pipes
let pipeArray = [];
let pipeWidth = 64;
let pipeHeight = 512;
let pipeX = boardWidth;
let pipeY = 0;

let topPipeImg;
let bottomPipeImg;

//physics
let velocityX = -2;
let velocityY = 0;
let gravity = 0.4;

let gameOver = false;
let gameStarted = false;
let score = 0;

//sound effects
let sounds = {
  wing: new Audio("./sfx_wing.wav"),
  point: new Audio("./sfx_point.wav"),
  hit: new Audio("./sfx_hit.wav"),
  die: new Audio("./sfx_die.wav"),
  swooshing: new Audio("./sfx_swooshing.wav"),
  bgm: new Audio("./saiyaraModiji.mp3")
};

// Background music settings
sounds.bgm.loop = true;
sounds.bgm.volume = 0.1;

let bgmStarted = false;

window.onload = function () {
  board = document.getElementById("board");
  board.height = boardHeight;
  board.width = boardWidth;
  context = board.getContext("2d");

  // Disable smoothing for pixel art
  context.imageSmoothingEnabled = false;
  context.mozImageSmoothingEnabled = false;
  context.webkitImageSmoothingEnabled = false;
  context.msImageSmoothingEnabled = false;

  //load images
  birdImg = new Image();
  birdImg.src = "./flappybird.png";
  birdImg.onload = function () {
    context.drawImage(birdImg, bird.x, bird.y, bird.width, bird.height);
  };

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

  // Prevent spacebar from scrolling
  window.addEventListener("keydown", function (e) {
    if (e.code === "Space" || e.code === "ArrowUp") e.preventDefault();
  });

  // User gesture to unlock audio on all devices
  const unlockAudio = () => {
    if (!bgmStarted) {
      sounds.bgm.play().then(() => {
        bgmStarted = true;
        console.log("BGM started successfully");
      }).catch(() => {
        console.log("Waiting for user interaction to start audio");
      });
    }
  };

  // Listen for first gesture to start music
  document.body.addEventListener("touchstart", unlockAudio, { once: true });
  document.body.addEventListener("mousedown", unlockAudio, { once: true });
  document.body.addEventListener("keydown", unlockAudio, { once: true });
};

function update() {
  requestAnimationFrame(update);
  context.clearRect(0, 0, board.width, board.height);

  // Show logo before start
  if (!gameStarted && !gameOver) {
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
    return;
  }

  // Draw bird
  context.drawImage(birdImg, bird.x, bird.y, bird.width, bird.height);

  if (gameOver) {
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
    context.font = "bold 45px sans-serif";
    let gameOverText = "GAME OVER";
    let gameOverWidth = context.measureText(gameOverText).width;
    let gameOverX = (boardWidth - gameOverWidth) / 2;
    context.strokeText(gameOverText, gameOverX, boardHeight / 2 + 20);
    context.fillText(gameOverText, gameOverX, boardHeight / 2 + 20);

    context.font = "bold 35px sans-serif";
    let finalScoreText = "Total votes: " + score;
    let finalScoreWidth = context.measureText(finalScoreText).width;
    let finalScoreX = (boardWidth - finalScoreWidth) / 2;
    context.strokeText(finalScoreText, finalScoreX, boardHeight / 2 + 75);
    context.fillText(finalScoreText, finalScoreX, boardHeight / 2 + 75);

    context.font = "27px sans-serif";
    let restartText = "Tap to Restart";
    let restartWidth = context.measureText(restartText).width;
    let restartX = (boardWidth - restartWidth) / 2;
    context.strokeText(restartText, restartX, boardHeight - 150);
    context.fillText(restartText, restartX, boardHeight - 150);
    return;
  }

  //bird
  velocityY += gravity;
  bird.y = Math.max(bird.y + velocityY, 0);
  if (bird.y > board.height) {
    gameOver = true;
    playSound(sounds.die);
  }

  //pipes
  for (let i = 0; i < pipeArray.length; i++) {
    let pipe = pipeArray[i];
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

  //clear pipes
  while (pipeArray.length > 0 && pipeArray[0].x < -pipeWidth) {
    pipeArray.shift();
  }

  //score
  context.fillStyle = "white";
  context.font = "bold 50px sans-serif";
  context.strokeStyle = "black";
  context.lineWidth = 3;
  let scoreText = score.toString();
  let scoreWidth = context.measureText(scoreText).width;
  let scoreX = (boardWidth - scoreWidth) / 2;
  context.strokeText(scoreText, scoreX, 70);
  context.fillText(scoreText, scoreX, 70);
}

function placePipes() {
  if (gameOver || !gameStarted) return;

  let randomPipeY = pipeY - pipeHeight / 4 - Math.random() * (pipeHeight / 2);
  let openingSpace = board.height / 4;

  let topPipe = {
    img: topPipeImg,
    x: pipeX,
    y: randomPipeY,
    width: pipeWidth,
    height: pipeHeight,
    passed: false
  };
  pipeArray.push(topPipe);

  let bottomPipe = {
    img: bottomPipeImg,
    x: pipeX,
    y: randomPipeY + pipeHeight + openingSpace,
    width: pipeWidth,
    height: pipeHeight,
    passed: false
  };
  pipeArray.push(bottomPipe);

  playSound(sounds.swooshing);
}

function moveBird(e) {
  if (e.type === "keydown") {
    if (e.code !== "Space" && e.code !== "ArrowUp" && e.code !== "KeyX") return;
  }

  if (e.type === "click" || e.type === "touchstart") e.preventDefault();

  if (!gameStarted && !gameOver) {
    gameStarted = true;
    sounds.bgm.volume = 0.5;
    if (!bgmStarted) {
      sounds.bgm.play().then(() => {
        bgmStarted = true;
      }).catch(() => {
        console.log("User gesture required for audio");
      });
    }
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
    score = 0;
    gameOver = false;
    gameStarted = true;
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
