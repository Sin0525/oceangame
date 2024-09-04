let initPoints = [];
let player;
let trash = [];
let score = 0;
let timer = 60; 
let gameStarted = false; // Game state variable
let startButton;
let lastTimerUpdate;
let trashSpawnInterval = 30; // Time frames between spawning new trash
let trashSpawnCounter = 0;
let scrollSpeed = 3; // Speed at which the screen scrolls
let boat, trashImage, gameOverImage;

function preload() {
  boat = loadImage("boat.png");
  trashImage = loadImage("trash.png");
  gameOverImage = loadImage("info.png");
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  angleMode(DEGREES);
  stroke(255);
  strokeWeight(1);

  // Initialize points
  randomSeed(80);
  for (let i = 0; i < 12; i++) {
    initPoints.push(createVector(random(width), random(height)));
  }

  // Initialize player
  player = new Player();

  // start button
  startButton = createButton('Start Game');
  startButton.position(width / 2 - 50, height / 2);
  startButton.size(100, 50);
  startButton.mousePressed(startGame);

  frameRate(30); // Increased frame rate for smoother gameplay
  pixelDensity(1);
}

function draw() {
  if (!gameStarted) {
    background(0);
    fill(255);
    textSize(32);
    textAlign(CENTER, CENTER);
    text('Press Space or Click Start to Begin', width / 2, height / 2 - 60);
    return; // Exit the draw loop if the game hasn't started
  }

  background(0); // Clear the canvas each frame

  //the wave effect, reference: https://www.youtube.com/watch?v=kUexPZMIwuA
  loadPixels();
  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      let closestDist = Infinity;

      // Calculating distance from the closest point
      for (let i = 0; i < initPoints.length; i++) {
        let d = (x - initPoints[i].x) ** 2 + (y - initPoints[i].y) ** 2;
        if (d < closestDist) {
          closestDist = d;
        }
      }

      let noise = sqrt(closestDist);
      let colR = waveColor(noise, 40, 0, 2.0);    // Lower red value
      let colG = waveColor(noise, 30, 150, 2.5);  // Higher green value
      let colB = waveColor(noise, 20, 200, 3.0);  // Higher blue value
      
      let index = (x + y * width) * 4;
      pixels[index] = colR;          // Red channel
      pixels[index + 1] = colG;      // Green channel
      pixels[index + 2] = colB;      // Blue channel
      pixels[index + 3] = 255;       // Alpha channel
    }
  }
  updatePixels();
  
  // Display player
  player.show();
  player.move();
  
  // Display trash
  for (let i = trash.length - 1; i >= 0; i--) {
    trash[i].move(); // Move the trash downwards
    trash[i].show();
    if (player.collect(trash[i])) {
      trash.splice(i, 1);
      score++;
    }
  }
  
  // Spawn new trash at random intervals
  if (trashSpawnCounter >= trashSpawnInterval) {
    trash.push(new Trash());
    trashSpawnCounter = 0;
    trashSpawnInterval = int(random(5, 20)); // Further reduced interval for faster spawning
  }
  trashSpawnCounter++;

  // Update timer
  if (millis() - lastTimerUpdate >= 1000) {
    timer--;
    lastTimerUpdate = millis();
  }

  // Display score and timer
  displayScore();
  displayTimer();
  
  // game over
  if (timer <= 0) {
    gameOver();
  }
}

function waveColor(x, a, b, e) {
  if (x < 0) return b;
  else return pow(x / a, e) + b;
}

function displayScore() {
  fill(255); 
  textSize(24);
  text('Score: ' + score, 60, 30);
}

function displayTimer() {
  fill(255); 
  textSize(24);
  text('Time: ' + timer, width - 100, 30);
}

function gameOver() {
  noLoop(); 
  imageMode(CENTER);
  image(gameOverImage, width / 2, height / 2, windowWidth, windowHeight); 
  
  fill(255); 
  textSize(28);
  textAlign(CENTER, CENTER);
  text('Your score: ' + score, width / 2, height - 80);
  text('Press Space', width / 2, height - 50);
}

// Start the game when the start button is pressed
function startGame() {
  startButton.hide();
  gameStarted = true;
  timer = 60;
  lastTimerUpdate = millis(); 
  trashSpawnCounter = trashSpawnInterval - 60; 
  spawnInitialTrash(); // Spawn trash at the beginning
}

// Start the game when the space key is pressed or restart with 'R'
function keyPressed() {
  if (key === ' ' && !gameStarted) {
    startButton.hide();
    startGame();
  }
  if (key === ' ' && timer <= 0) { // Restart the game with Space after it ends
    resetGame();
    loop(); 
    startGame();
  }
}

function resetGame() {
  score = 0;
  trash = [];
  timer = 60; 
  gameStarted = false; 
  startButton.show(); 
}

function spawnInitialTrash() {
  for (let i = 0; i < 5; i++) {
    trash.push(new Trash()); // Spawn 5 pieces of trash immediately
  }
}

class Player {
  constructor() {
    this.x = width / 2;
    this.y = height - 100;
    this.size = 60;
  }
  
  show() {
    fill(0, 0, 255);
    image(boat, this.x, this.y, this.size, this.size);
  }
  
  move() {
    // Move directly to the touch position
    if (touches.length > 0) {
      this.x = touches[0].x;
      this.y = touches[0].y;
    }

    // Keyboard controls for desktop
    if (keyIsDown(LEFT_ARROW) && this.x > 5) { 
      this.x -= 8; 
    }
    if (keyIsDown(RIGHT_ARROW) && this.x < width - this.size - 5) {
      this.x += 8; 
    }
    if (keyIsDown(UP_ARROW) && this.y > 5) {
      this.y -= 8; 
    }
    if (keyIsDown(DOWN_ARROW) && this.y < height - this.size - 5) {
      this.y += 8; 
    }
  }
  
  collect(trash) {
    let d = dist(this.x, this.y, trash.x, trash.y);
    return d < this.size / 2 + trash.size / 2;
  }
}

class Trash {
  constructor() {
    this.x = random(width);
    this.y = random(-height, 0);
    this.size = 50; 
  }

  move() {
    this.y += scrollSpeed; // Move downward
    if (this.y > height) {
      this.y = random(-height, 0); // Re-spawn above the screen
      this.x = random(width);
    }
  }

  show() {
    image(trashImage, this.x, this.y, this.size, this.size);
  }
}

// Disable default touch behavior
function touchMoved() {
  return false; // Prevent default behavior (scrolling)
}
