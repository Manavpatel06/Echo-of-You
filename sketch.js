let player, ghosts = [], switches = [], goal;
let recording = [];
let tempGhost = null;
let tileSize = 40;
let gameState = 'title';
let startTime, round = 1;
let maxTime = 10;
let showHelp = true;
let leaveButton;

function setup() {
  createCanvas(windowWidth, windowHeight);
  textFont('Courier New');
  resetLevel(true, false);

  leaveButton = createButton('Leave Game');
  leaveButton.size(100, 30);
  leaveButton.style('font-size', '16px');
  leaveButton.mousePressed(() => {
    gameState = 'title';
    ghosts = [];
    round = 1;
    resetLevel(true, false);
    leaveButton.hide();
  });
  leaveButton.hide();
}

function draw() {
  background(15);

  if (gameState === 'title') {
    leaveButton.hide();
    drawTitleScreen();
  }
  else if (gameState === 'play') {
    leaveButton.show();
    leaveButton.position(width / 2 - 50, 50);
    drawGame();
  }
  else if (gameState === 'win') {
    leaveButton.hide();
    drawWinScreen();
  }
}

function drawTitleScreen() {
  fill(255);
  textAlign(CENTER, CENTER);
  textSize(48);
  text("ECHOES OF YOU", width / 2, height / 3);
  textSize(20);
  text("A time-clone puzzle challenge", width / 2, height / 2.5);
  textSize(16);
  text("Press ENTER to Begin", width / 2, height / 1.7);
}

function drawGame() {
  drawHUD();
  if (showHelp) drawInstructions();

  for (let ghost of ghosts) ghost.update();
  if (tempGhost) tempGhost.update();

  player.update();
  player.show();
  recording.push({ x: player.x, y: player.y });

  for (let sw of switches) {
    fill(sw.active ? "green" : "red");
    rect(sw.x, sw.y, tileSize, tileSize, 6);
    if (dist(player.x, player.y, sw.x, sw.y) < 10) sw.active = true;
  }

  fill("gold");
  rect(goal.x, goal.y, tileSize, tileSize, 5);

  if (switches.every(sw => sw.active) && dist(player.x, player.y, goal.x, goal.y) < 10) {
    gameState = 'win';
  }

  if ((millis() - startTime) > maxTime * 1000) {
    resetLevel(false, false); // retry same level
  }
}

function drawWinScreen() {
  background(10, 20, 30);
  fill("cyan");
  textSize(32);
  textAlign(CENTER, CENTER);
  text("You Synchronized Time!", width / 2, height / 2.5);
  textSize(16);
  text("Rounds: " + round + " | Ghosts: " + ghosts.length, width / 2, height / 2);
  text("Press R to Continue or Q to Quit", width / 2, height / 1.5);
}

function drawHUD() {
  fill(30);
  rect(0, 0, width, 40);
  fill(255);
  textSize(14);
  textAlign(LEFT, CENTER);
  text(`⏱ Time: ${max(0, maxTime - floor((millis() - startTime) / 1000))}`, 10, 20);
  text(`👻 Ghosts: ${ghosts.length}`, 160, 20);
  text(`🔁 Round: ${round}`, 300, 20);
  text(`Press H: Toggle Help`, width - 160, 20);
}

function drawInstructions() {
  fill(0, 180);
  rect(20, 60, 300, 140, 10);
  fill(255);
  textSize(14);
  textAlign(LEFT, TOP);
  text(
    "🎮 How to Play:\n\n→ Use arrow keys or WASD to move\n→ Step on all red switches\n→ Reach the gold goal\n→ After each round, your past self becomes a ghost\n→ Use H to hide/show this help",
    30,
    70
  );
}

function keyPressed() {
  if (gameState === 'title' && keyCode === ENTER) {
    gameState = 'play';
    resetLevel(true, false);
    leaveButton.show();
  }

  if (gameState === 'win') {
  if (key === 'r' || key === 'R') {
    if (tempGhost) ghosts = [tempGhost]; // ← Replace ghost stack
    tempGhost = null;
    recording = [];
    round++;
    maxTime = max(5, 10 - round * 0.5);
    resetLevel(false, true); // New level
    gameState = 'play';
    leaveButton.show();
  } else if (key === 'q' || key === 'Q') {
    ghosts = [];
    round = 1;
    gameState = 'title';
    resetLevel(true, false);
    leaveButton.hide();
  }
}


  if (key === 'h' || key === 'H') {
    showHelp = !showHelp;
  }
}

function resetLevel(clearGhosts = true, randomize = false) {
  if (clearGhosts) ghosts = [];

  if (recording.length > 0 && gameState === 'play') {
    tempGhost = new Ghost([...recording]);
  }

  recording = [];

  if (randomize || switches.length === 0) {
    let numSwitches = min(5, 1 + floor(round / 2));
    switches = [];
    for (let i = 0; i < numSwitches; i++) {
      switches.push({
        x: floor(random(2, (width - 60) / tileSize)) * tileSize,
        y: floor(random(2, (height - 60) / tileSize)) * tileSize,
        active: false,
      });
    }
    goal = {
      x: floor(random((width - 60) / tileSize)) * tileSize,
      y: floor(random((height - 60) / tileSize)) * tileSize,
    };
  } else {
    for (let sw of switches) sw.active = false;
  }

  player = new Player(tileSize, tileSize);
  for (let ghost of ghosts) ghost.reset();
  if (tempGhost) tempGhost.reset();

  startTime = millis();
}

class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.speed = 2.5 + round * 0.2;
  }

  update() {
    if (keyIsDown(LEFT_ARROW) || keyIsDown(65)) this.x -= this.speed;
    if (keyIsDown(RIGHT_ARROW) || keyIsDown(68)) this.x += this.speed;
    if (keyIsDown(UP_ARROW) || keyIsDown(87)) this.y -= this.speed;
    if (keyIsDown(DOWN_ARROW) || keyIsDown(83)) this.y += this.speed;
    this.x = constrain(this.x, 0, width - tileSize);
    this.y = constrain(this.y, 40, height - tileSize);
  }

  show() {
    fill(0, 200, 255);
    rect(this.x, this.y, tileSize, tileSize, 8);
  }
}

class Ghost {
  constructor(path) {
    this.path = path;
    this.index = 0;
  }

  reset() {
    this.index = 0;
  }

  update() {
    if (this.index < this.path.length) {
      let pos = this.path[this.index];
      fill(255, 50);
      rect(pos.x, pos.y, tileSize, tileSize, 5);
      this.index++;
    }
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  resetLevel(false, false);
}
