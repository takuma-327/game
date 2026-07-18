let currentGame = null;
let animationFrameId = null;
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
let score = 0;

const keys = {};
window.addEventListener('keydown', e => keys[e.key] = true);
window.addEventListener('keyup', e => keys[e.key] = false);

// --- スマホ・タッチ操作用のイベント追加 ---
let touchStartX = 0;
let touchStartY = 0;

canvas.addEventListener('touchstart', e => {
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const touchX = touch.clientX - rect.left;
    
    // インベーダー・ブロック崩し：タップした位置へ移動
    if (currentGame === 'invaders' || currentGame === 'breakout') {
        movePaddleOrPlayer(touchX);
    }
    // インベーダー：画面タップで弾発射も兼ねる
    if (currentGame === 'invaders') {
        keys[' '] = true; 
        setTimeout(() => keys[' '] = false, 50);
    }
    
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
    e.preventDefault();
}, {passive: false});

canvas.addEventListener('touchmove', e => {
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const touchX = touch.clientX - rect.left;

    if (currentGame === 'invaders' || currentGame === 'breakout') {
        movePaddleOrPlayer(touchX);
    }

    // ヘビゲーム：スワイプで方向転換
    if (currentGame === 'snake') {
        const diffX = touch.clientX - touchStartX;
        const diffY = touch.clientY - touchStartY;
        if (Math.abs(diffX) > Math.abs(diffY)) {
            if (diffX > 10 && dx === 0) { dx = gridCount; dy = 0; }
            else if (diffX < -10 && dx === 0) { dx = -gridCount; dy = 0; }
        } else {
            if (diffY > 10 && dy === 0) { dx = 0; dy = gridCount; }
            else if (diffY < -10 && dy === 0) { dx = 0; dy = -gridCount; }
        }
    }
    e.preventDefault();
}, {passive: false});

function movePaddleOrPlayer(touchX) {
    // キャンバス内の比率に換算
    const scaleX = canvas.width / canvas.clientWidth;
    const targetX = touchX * scaleX;
    if (currentGame === 'invaders') {
        player.x = targetX - player.width / 2;
    } else if (currentGame === 'breakout') {
        paddle.x = targetX - paddle.width / 2;
    }
}

// --- ゲーム切り替え・メニュー処理 ---
window.switchGame = function(gameType) {
    currentGame = gameType;
    document.getElementById('menu-screen').style.display = 'none';
    document.getElementById('game-screen').style.display = 'flex';
    if (animationFrameId) cancelAnimationFrame(animationFrameId);
    score = 0;
    updateScore();
    
    if (gameType === 'invaders') {
        document.getElementById('game-title').innerText = 'SPACE INVADERS';
        document.getElementById('controls-text').innerText = 'PC: [←][→]移動 / [Space]発射\nスマホ: 画面タップ＆ドラッグ';
        initInvaders();
    } else if (gameType === 'breakout') {
        document.getElementById('game-title').innerText = 'BLOCK BREAKOUT';
        document.getElementById('controls-text').innerText = 'PC: マウス or [←][→]\nスマホ: 画面ドラッグ';
        initBreakout();
    } else if (gameType === 'snake') {
        document.getElementById('game-title').innerText = 'RETRO SNAKE';
        document.getElementById('controls-text').innerText = 'PC: 矢印キー\nスマホ: 画面を上下左右にスワイプ';
        initSnake();
    }
}

window.backToMenu = function() {
    currentGame = null;
    if (animationFrameId) cancelAnimationFrame(animationFrameId);
    canvas.onmousemove = null;
    document.getElementById('game-screen').style.display = 'none';
    document.getElementById('menu-screen').style.display = 'flex';
}

function updateScore() {
    document.getElementById('score-display').innerText = 'SCORE: ' + score;
}

// 1. Invaders
let player, bullets, enemies, enemyBullets, enemyDirection, enemySpeed, shootCooldown;
function initInvaders() {
    player = { x: canvas.width / 2 - 15, y: canvas.height - 40, width: 30, height: 20, speed: 4 };
    bullets = []; enemyBullets = []; enemies = []; enemyDirection = 1; enemySpeed = 1.0; shootCooldown = 0;
    const colors = ['#ff3366', '#ff9933', '#33ffff', '#33ff33'];
    for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 8; c++) {
            enemies.push({ x: 60 + c * 55, y: 50 + r * 35, width: 30, height: 20, color: colors[r], points: (4 - r) * 10 });
        }
    }
    gameLoopInvaders();
}

function gameLoopInvaders() {
    if (keys['ArrowLeft'] && player.x > 0) player.x -= player.speed;
    if (keys['ArrowRight'] && player.x < canvas.width - player.width) player.x += player.speed;
    if (shootCooldown > 0) shootCooldown--;
    if (keys[' '] && shootCooldown === 0) {
        bullets.push({ x: player.x + player.width / 2 - 2, y: player.y, width: 4, height: 10, speed: 6 });
        shootCooldown = 20;
    }
    bullets.forEach((b, index) => { b.y -= b.speed; if (b.y < 0) bullets.splice(index, 1); });
    enemyBullets.forEach((eb, index) => {
        eb.y += eb.speed; if (eb.y > canvas.height) enemyBullets.splice(index, 1);
        if (eb.x < player.x + player.width && eb.x + eb.width > player.x && eb.y < player.y + player.height && eb.y + eb.height > player.y) {
            alert('GAME OVER! SCORE: ' + score); backToMenu(); return;
        }
    });
    let hitWall = false;
    enemies.forEach(e => {
        e.x += enemySpeed * enemyDirection;
        if (e.x + e.width > canvas.width - 20 || e.x < 20) hitWall = true;
        if (Math.random() < 0.003) enemyBullets.push({ x: e.x + e.width/2, y: e.y + e.height, width: 4, height: 8, speed: 3 });
    });
    if (hitWall) {
        enemyDirection *= -1;
        enemies.forEach(e => { e.y += 15; if (e.y + e.height >= player.y) { alert('GAME OVER'); backToMenu(); return; } });
    }
    bullets.forEach((b, bIdx) => {
        enemies.forEach((e, eIdx) => {
            if (b.x < e.x + e.width && b.x + b.width > e.x && b.y < e.y + e.height && b.y + b.height > e.y) {
                bullets.splice(bIdx, 1); score += e.points; updateScore(); enemies.splice(eIdx, 1);
            }
        });
    });
    if (enemies.length === 0) { alert('STAGE CLEAR!!'); backToMenu(); return; }
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#2e5c46'; ctx.fillRect(player.x, player.y, player.width, player.height);
    ctx.fillRect(player.x + 12, player.y - 6, 6, 6);
    ctx.fillStyle = '#ffff33'; bullets.forEach(b => ctx.fillRect(b.x, b.y, b.width, b.height));
    ctx.fillStyle = '#ff3333'; enemyBullets.forEach(eb => ctx.fillRect(eb.x, eb.y, eb.width, eb.height));
    enemies.forEach(e => {
        ctx.fillStyle = e.color; ctx.fillRect(e.x, e.y, e.width, e.height);
        ctx.fillStyle = '#000'; ctx.fillRect(e.x + 6, e.y + 5, 4, 4); ctx.fillRect(e.x + 20, e.y + 5, 4, 4);
    });
    animationFrameId = requestAnimationFrame(gameLoopInvaders);
}

// 2. Breakout
let ball, paddle, bricks;
function initBreakout() {
    paddle = { x: canvas.width / 2 - 40, y: canvas.height - 30, width: 80, height: 12, speed: 6 };
    ball = { x: canvas.width / 2, y: canvas.height - 50, dx: 3, dy: -3, radius: 6 };
    bricks = [];
    const colors = ['#ff3333', '#ff9933', '#ffff33', '#33ff33', '#33ffff'];
    for (let r = 0; r < 5; r++) {
        for (let c = 0; c < 9; c++) {
            bricks.push({ x: 15 + c * 63, y: 40 + r * 22, width: 55, height: 15, color: colors[r], status: 1 });
        }
    }
    canvas.onmousemove = function(e) {
        const rect = canvas.getBoundingClientRect();
        paddle.x = e.clientX - rect.left - paddle.width / 2;
    };
    gameLoopBreakout();
}
function gameLoopBreakout() {
    if (keys['ArrowLeft'] && paddle.x > 0) paddle.x -= paddle.speed;
    if (keys['ArrowRight'] && paddle.x < canvas.width - paddle.width) paddle.x += paddle.speed;
    if (paddle.x < 0) paddle.x = 0; if (paddle.x > canvas.width - paddle.width) paddle.x = canvas.width - paddle.width;
    ball.x += ball.dx; ball.y += ball.dy;
    if (ball.x + ball.radius > canvas.width || ball.x - ball.radius < 0) ball.dx *= -1;
    if (ball.y - ball.radius < 0) ball.dy *= -1;
    if (ball.y + ball.radius >= paddle.y && ball.x > paddle.x && ball.x < paddle.x + paddle.width) {
        ball.dy = -Math.abs(ball.dy); ball.dx = (ball.x - (paddle.x + paddle.width/2)) * 0.1;
    }
    if (ball.y > canvas.height) { alert('GAME OVER! SCORE: ' + score); backToMenu(); return; }
    let allCleared = true;
    bricks.forEach(b => {
        if (b.status === 1) {
            allCleared = false;
            if (ball.x > b.x && ball.x < b.x + b.width && ball.y > b.y && ball.y < b.y + b.height) {
                ball.dy *= -1; b.status = 0; score += 10; updateScore();
            }
        }
    });
    if (allCleared) { alert('ALL CLEAR!!!'); backToMenu(); return; }
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#33ffff'; ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height);
    ctx.beginPath(); ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2); ctx.fillStyle = '#fff'; ctx.fill(); ctx.closePath();
    bricks.forEach(b => {
        if (b.status === 1) { ctx.fillStyle = b.color; ctx.fillRect(b.x, b.y, b.width, b.height); ctx.strokeStyle = '#000'; ctx.strokeRect(b.x, b.y, b.width, b.height); }
    });
    animationFrameId = requestAnimationFrame(gameLoopBreakout);
}

// 3. Snake
let snake, food, dx, dy, gridCount, lastUpdateTime;
function initSnake() {
    gridCount = 20;
    snake = [{ x: 10 * gridCount, y: 10 * gridCount }, { x: 9 * gridCount, y: 10 * gridCount }, { x: 8 * gridCount, y: 10 * gridCount }];
    dx = gridCount; dy = 0; spawnFood(); lastUpdateTime = 0;
    gameLoopSnake(0);
}
function spawnFood() {
    food = {
        x: Math.floor(Math.random() * (canvas.width / gridCount)) * gridCount,
        y: Math.floor(Math.random() * (canvas.height / gridCount)) * gridCount
    };
}
function gameLoopSnake(timestamp) {
    animationFrameId = requestAnimationFrame(gameLoopSnake);
    if (timestamp - lastUpdateTime < 120) return;
    lastUpdateTime = timestamp;
    if (keys['ArrowUp'] && dy === 0) { dx = 0; dy = -gridCount; }
    if (keys['ArrowDown'] && dy === 0) { dx = 0; dy = gridCount; }
    if (keys['ArrowLeft'] && dx === 0) { dx = -gridCount; dy = 0; }
    if (keys['ArrowRight'] && dx === 0) { dx = gridCount; dy = 0; }
    const head = { x: snake[0].x + dx, y: snake[0].y + dy };
    if (head.x < 0 || head.x >= canvas.width || head.y < 0 || head.y >= canvas.height) { alert('GAME OVER! SCORE: ' + score); backToMenu(); return; }
    for (let i = 0; i < snake.length; i++) {
        if (head.x === snake[i].x && head.y === snake[i].y) { alert('GAME OVER'); backToMenu(); return; }
    }
    snake.unshift(head);
    if (head.x === food.x && head.y === food.y) { score += 20; updateScore(); spawnFood(); } else { snake.pop(); }
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ff3333'; ctx.fillRect(food.x + 2, food.y + 2, gridCount - 4, gridCount - 4);
    snake.forEach((part, index) => {
        ctx.fillStyle = index === 0 ? '#33ff33' : '#1e3d2f';
        ctx.fillRect(part.x + 1, part.y + 1, gridCount - 2, gridCount - 2);
    });
}
