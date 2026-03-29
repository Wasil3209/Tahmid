const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game variables
let gameRunning = true;
let score = 0;
let coins = 0;
let highscore = localStorage.getItem('tahmidHighscore') || 0;
let frameCount = 0;
let speed = 5;

// Display highscore
document.getElementById('highscore').textContent = highscore;

// Tahmid character
const tahmid = {
    x: 200,
    y: 340,
    width: 40,
    height: 50,
    lane: 1, // 0=left, 1=middle, 2=right
    isRolling: false,
    isJumping: false,
    jumpHeight: 0,
    jumpVelocity: 0,
    rollTimer: 0,
    color: '#ff6b6b'
};

// Lanes positions
const lanes = [180, 280, 380];

// Obstacles array
let obstacles = [];

// Coins array
let coinArray = [];

// Train tracks (background)
let trackOffset = 0;

// Obstacle types
const obstacleTypes = [
    { name: 'barrier', width: 35, height: 45, color: '#c0392b', points: 10 },
    { name: 'sign', width: 30, height: 60, color: '#e67e22', points: 15 },
    { name: 'train', width: 70, height: 40, color: '#34495e', points: 20 }
];

// Game controls
let leftPressed = false;
let rightPressed = false;
let jumpPressed = false;
let rollPressed = false;

// Spawn timers
let obstacleSpawnCounter = 0;
let coinSpawnCounter = 0;

// Draw Tahmid (detailed character)
function drawTahmid() {
    let yPos = tahmid.y;
    let height = tahmid.height;
    let width = tahmid.width;
    
    if (tahmid.isRolling) {
        height = 30;
        yPos = tahmid.y + 20;
    }
    
    if (tahmid.isJumping) {
        yPos = tahmid.y - tahmid.jumpHeight;
    }
    
    // Body
    ctx.fillStyle = tahmid.color;
    ctx.fillRect(tahmid.x, yPos, width, height);
    
    // Head
    ctx.fillStyle = '#ff9f43';
    ctx.fillRect(tahmid.x + 5, yPos - 15, 30, 20);
    
    // Hair
    ctx.fillStyle = '#2d3436';
    ctx.fillRect(tahmid.x + 8, yPos - 20, 24, 10);
    
    // Eyes
    ctx.fillStyle = 'white';
    ctx.fillRect(tahmid.x + 10, yPos - 8, 8, 6);
    ctx.fillRect(tahmid.x + 22, yPos - 8, 8, 6);
    ctx.fillStyle = '#2d3436';
    ctx.fillRect(tahmid.x + 12, yPos - 7, 4, 4);
    ctx.fillRect(tahmid.x + 24, yPos - 7, 4, 4);
    
    // Smile
    ctx.beginPath();
    ctx.arc(tahmid.x + 20, yPos - 2, 10, 0, Math.PI);
    ctx.strokeStyle = '#2d3436';
    ctx.stroke();
    
    // Name tag
    ctx.fillStyle = 'white';
    ctx.font = 'bold 10px Arial';
    ctx.fillText('TAHMID', tahmid.x + 5, yPos - 2);
    
    // Cape (superhero style!)
    ctx.fillStyle = '#e74c3c';
    ctx.beginPath();
    ctx.moveTo(tahmid.x + width - 10, yPos + 10);
    ctx.lineTo(tahmid.x + width + 15, yPos);
    ctx.lineTo(tahmid.x + width - 10, yPos + 20);
    ctx.fill();
}

// Draw obstacles
function drawObstacles() {
    for (let obs of obstacles) {
        ctx.fillStyle = obs.color;
        ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
        
        // Add detail
        ctx.fillStyle = '#2c3e50';
        ctx.fillRect(obs.x + 5, obs.y + 10, obs.width - 10, 5);
        
        if (obs.name === 'train') {
            ctx.fillStyle = '#f1c40f';
            ctx.fillRect(obs.x + 10, obs.y + 15, 10, 10);
            ctx.fillRect(obs.x + 40, obs.y + 15, 10, 10);
        }
    }
}

// Draw coins
function drawCoins() {
    for (let coin of coinArray) {
        ctx.fillStyle = '#f1c40f';
        ctx.beginPath();
        ctx.ellipse(coin.x + 15, coin.y + 15, 12, 15, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#f39c12';
        ctx.beginPath();
        ctx.ellipse(coin.x + 15, coin.y + 15, 8, 11, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 12px Arial';
        ctx.fillText('🪙', coin.x + 8, coin.y + 20);
    }
}

// Draw train tracks
function drawTracks() {
    trackOffset = (trackOffset + speed) % 40;
    
    for (let i = 0; i < 3; i++) {
        for (let j = -40; j < canvas.height + 40; j += 40) {
            ctx.fillStyle = '#7f8c8d';
            ctx.fillRect(lanes[i] - 5, j + trackOffset, 3, 20);
            ctx.fillRect(lanes[i] + 42, j + trackOffset, 3, 20);
        }
    }
    
    // Rails
    for (let i = 0; i < 3; i++) {
        ctx.fillStyle = '#bdc3c7';
        ctx.fillRect(lanes[i] - 8, 0, 3, canvas.height);
        ctx.fillRect(lanes[i] + 45, 0, 3, canvas.height);
    }
}

// Spawn obstacles
function spawnObstacle() {
    const lane = Math.floor(Math.random() * 3);
    const type = obstacleTypes[Math.floor(Math.random() * obstacleTypes.length)];
    
    obstacles.push({
        x: lanes[lane] + 5,
        y: canvas.height,
        width: type.width,
        height: type.height,
        color: type.color,
        name: type.name,
        lane: lane
    });
}

// Spawn coins
function spawnCoin() {
    const lane = Math.floor(Math.random() * 3);
    coinArray.push({
        x: lanes[lane] + 10,
        y: canvas.height,
        width: 30,
        height: 30,
        lane: lane
    });
}

// Update game logic
function updateGame() {
    if (!gameRunning) return;
    
    // Move obstacles
    for (let i = 0; i < obstacles.length; i++) {
        obstacles[i].y -= speed;
        if (obstacles[i].y + obstacles[i].height < 0) {
            obstacles.splice(i, 1);
            i--;
        }
    }
    
    // Move coins
    for (let i = 0; i < coinArray.length; i++) {
        coinArray[i].y -= speed;
        if (coinArray[i].y + coinArray[i].width < 0) {
            coinArray.splice(i, 1);
            i--;
        }
    }
    
    // Handle jumping
    if (tahmid.isJumping) {
        tahmid.jumpHeight += tahmid.jumpVelocity;
        tahmid.jumpVelocity += 0.8;
        
        if (tahmid.jumpHeight >= 0) {
            tahmid.isJumping = false;
            tahmid.jumpHeight = 0;
            tahmid.jumpVelocity = 0;
        }
    }
    
    // Handle rolling
    if (tahmid.isRolling) {
        tahmid.rollTimer--;
        if (tahmid.rollTimer <= 0) {
            tahmid.isRolling = false;
        }
    }
    
    // Move lanes
    if (leftPressed && tahmid.lane > 0) {
        tahmid.lane--;
        tahmid.x = lanes[tahmid.lane];
        leftPressed = false;
    }
    if (rightPressed && tahmid.lane < 2) {
        tahmid.lane++;
        tahmid.x = lanes[tahmid.lane];
        rightPressed = false;
    }
    
    // Jump action
    if (jumpPressed && !tahmid.isJumping && !tahmid.isRolling) {
        tahmid.isJumping = true;
        tahmid.jumpVelocity = -12;
        jumpPressed = false;
    }
    
    // Roll action
    if (rollPressed && !tahmid.isRolling && !tahmid.isJumping) {
        tahmid.isRolling = true;
        tahmid.rollTimer = 30;
        rollPressed = false;
    }
    
    // Collision detection with obstacles
    let tahmidY = tahmid.y;
    let tahmidHeight = tahmid.height;
    
    if (tahmid.isJumping) {
        tahmidY = tahmid.y - tahmid.jumpHeight;
    }
    if (tahmid.isRolling) {
        tahmidHeight = 30;
        tahmidY = tahmid.y + 20;
    }
    
    for (let obs of obstacles) {
        if (obs.lane === tahmid.lane) {
            if (tahmidXCollision(tahmid.x, obs.x, tahmid.width, obs.width) &&
                tahmidYCollision(tahmidY, obs.y, tahmidHeight, obs.height)) {
                
                if (!tahmid.isJumping && !tahmid.isRolling) {
                    gameOver();
                    return;
                } else if (tahmid.isJumping && tahmid.jumpHeight > 20) {
                    // Jump over obstacle
                    score += obs.points || 10;
                    obstacles.splice(obstacles.indexOf(obs), 1);
                }
            }
        }
    }
    
    // Collect coins
    for (let i = 0; i < coinArray.length; i++) {
        if (coinArray[i].lane === tahmid.lane) {
            if (tahmidXCollision(tahmid.x, coinArray[i].x, tahmid.width, coinArray[i].width) &&
                tahmidYCollision(tahmidY, coinArray[i].y, tahmidHeight, coinArray[i].width)) {
                coins++;
                document.getElementById('coins').textContent = coins;
                coinArray.splice(i, 1);
                i--;
            }
        }
    }
    
    // Increase score over time
    frameCount++;
    if (frameCount % 30 === 0) {
        score += 10;
        document.getElementById('score').textContent = score;
        
        // Increase difficulty
        if (score > 500 && speed < 12) {
            speed = 7;
        } else if (score > 1000 && speed < 15) {
            speed = 9;
        } else if (score > 2000 && speed < 18) {
            speed = 11;
        }
    }
    
    // Spawn obstacles
    obstacleSpawnCounter++;
    if (obstacleSpawnCounter > 80 - Math.floor(speed * 2)) {
        spawnObstacle();
        obstacleSpawnCounter = 0;
    }
    
    // Spawn coins
    coinSpawnCounter++;
    if (coinSpawnCounter > 40) {
        spawnCoin();
        coinSpawnCounter = 0;
    }
}

function tahmidXCollision(tahmidX, objX, tahmidW, objW) {
    return tahmidX < objX + objW && tahmidX + tahmidW > objX;
}

function tahmidYCollision(tahmidY, objY, tahmidH, objH) {
    return tahmidY < objY + objH && tahmidY + tahmidH > objY;
}

// Draw background
function drawBackground() {
    // Sky gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#1a1a2e');
    gradient.addColorStop(1, '#16213e');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Buildings in background
    ctx.fillStyle = '#2c3e50';
    for (let i = 0; i < 10; i++) {
        ctx.fillRect(50 + i * 80, 100, 30, 200);
        ctx.fillStyle = '#34495e';
        ctx.fillRect(55 + i * 80, 130, 20, 30);
    }
}

// Draw everything
function draw() {
    drawBackground();
    drawTracks();
    drawObstacles();
    drawCoins();
    drawTahmid();
    
    // Score effect
    ctx.fillStyle = 'white';
    ctx.font = 'bold 20px Arial';
    ctx.shadowBlur = 0;
    
    // Instructions on canvas
    if (gameRunning && score < 100) {
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.font = '14px Arial';
        ctx.fillText('Swipe or use buttons to move!', canvas.width/2 - 100, 50);
    }
}

// Game over
function gameOver() {
    gameRunning = false;
    
    if (score > highscore) {
        highscore = score;
        localStorage.setItem('tahmidHighscore', highscore);
        document.getElementById('highscore').textContent = highscore;
    }
    
    document.getElementById('gameOverScreen').style.display = 'flex';
}

// Restart game
function restartGame() {
    gameRunning = true;
    score = 0;
    coins = 0;
    speed = 5;
    frameCount = 0;
    obstacles = [];
    coinArray = [];
    obstacleSpawnCounter = 0;
    coinSpawnCounter = 0;
    
    tahmid.lane = 1;
    tahmid.x = lanes[1];
    tahmid.isJumping = false;
    tahmid.isRolling = false;
    tahmid.jumpHeight = 0;
    
    document.getElementById('score').textContent = '0';
    document.getElementById('coins').textContent = '0';
    document.getElementById('gameOverScreen').style.display = 'none';
}

// Animation loop
function gameLoop() {
    updateGame();
    draw();
    requestAnimationFrame(gameLoop);
}

// Touch and keyboard controls
function setupControls() {
    // Keyboard
    document.addEventListener('keydown', (e) => {
        if (!gameRunning) return;
        
        switch(e.key) {
            case 'ArrowLeft': leftPressed = true; e.preventDefault(); break;
            case 'ArrowRight': rightPressed = true; e.preventDefault(); break;
            case 'ArrowUp': jumpPressed = true; e.preventDefault(); break;
            case 'ArrowDown': rollPressed = true; e.preventDefault(); break;
        }
    });
    
    // Touch buttons
    document.getElementById('leftBtn').addEventListener('click', () => {
        if (gameRunning) leftPressed = true;
    });
    document.getElementById('rightBtn').addEventListener('click', () => {
        if (gameRunning) rightPressed = true;
    });
    document.getElementById('jumpBtn').addEventListener('click', () => {
        if (gameRunning) jumpPressed = true;
    });
    document.getElementById('rollBtn').addEventListener('click', () => {
        if (gameRunning) rollPressed = true;
    });
    
    // Swipe controls
    let touchStartX = 0;
    let touchStartY = 0;
    
    canvas.addEventListener('touchstart', (e) => {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        e.preventDefault();
    });
    
    canvas.addEventListener('touchend', (e) => {
        if (!gameRunning) return;
        
        const touchEndX = e.changedTouches[0].clientX;
        const touchEndY = e.changedTouches[0].clientY;
        
        const dx = touchEndX - touchStartX;
        const dy = touchEndY - touchStartY;
        
        if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 20) {
            if (dx > 0) rightPressed = true;
            else leftPressed = true;
        } else if (Math.abs(dy) > 20) {
            if (dy > 0) rollPressed = true;
            else jumpPressed = true;
        }
        e.preventDefault();
    });
    
    // Restart buttons
    document.getElementById('restartBtn').addEventListener('click', () => restartGame());
    document.getElementById('playAgainBtn').addEventListener('click', () => restartGame());
}

// Start game
setupControls();
gameLoop();
