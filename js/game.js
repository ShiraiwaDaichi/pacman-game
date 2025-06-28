// ゲームの主要クラス
class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.score = 0;
        this.lives = 3;
        this.gameState = 'playing'; // playing, paused, gameOver
        this.lastTime = 0;
        
        // ゲームオブジェクト
        this.maze = new Maze();
        this.player = new Player(this.maze);
        this.ghosts = [];
        
        // ゴーストを初期化
        this.initGhosts();
        
        // イベントリスナー設定
        this.setupControls();
        
        // スコア表示要素
        this.scoreElement = document.getElementById('scoreValue');
        this.livesElement = document.getElementById('livesValue');
        
        this.updateUI();
    }
    
    initGhosts() {
        // 4匹のゴーストを作成（赤、ピンク、青、オレンジ）
        const ghostColors = ['#ff0000', '#ffb8ff', '#00ffff', '#ffb852'];
        const startPositions = [
            {x: 13, y: 11}, // 赤ゴーストの開始位置
            {x: 13, y: 13}, // ピンクゴーストの開始位置
            {x: 12, y: 13}, // 青ゴーストの開始位置
            {x: 14, y: 13}  // オレンジゴーストの開始位置
        ];
        
        for (let i = 0; i < 4; i++) {
            this.ghosts.push(new Ghost(
                startPositions[i].x,
                startPositions[i].y,
                ghostColors[i],
                this.maze,
                this.player
            ));
        }
    }
    
    setupControls() {
        document.addEventListener('keydown', (e) => {
            if (this.gameState !== 'playing') return;
            
            switch(e.key) {
                case 'ArrowUp':
                case 'w':
                case 'W':
                    this.player.setDirection(0, -1);
                    break;
                case 'ArrowDown':
                case 's':
                case 'S':
                    this.player.setDirection(0, 1);
                    break;
                case 'ArrowLeft':
                case 'a':
                case 'A':
                    this.player.setDirection(-1, 0);
                    break;
                case 'ArrowRight':
                case 'd':
                case 'D':
                    this.player.setDirection(1, 0);
                    break;
                case ' ':
                    this.togglePause();
                    break;
            }
        });
    }
    
    togglePause() {
        if (this.gameState === 'playing') {
            this.gameState = 'paused';
        } else if (this.gameState === 'paused') {
            this.gameState = 'playing';
        }
    }
    
    update(deltaTime) {
        if (this.gameState !== 'playing') return;
        
        // プレイヤー更新
        this.player.update(deltaTime);
        
        // ゴースト更新
        this.ghosts.forEach(ghost => {
            ghost.update(deltaTime);
        });
        
        // 衝突判定
        this.checkCollisions();
        
        // ドット収集判定
        this.checkDotCollection();
        
        // ゲーム終了判定
        this.checkGameEnd();
    }
    
    checkCollisions() {
        this.ghosts.forEach(ghost => {
            const distance = Math.sqrt(
                Math.pow(this.player.x - ghost.x, 2) + 
                Math.pow(this.player.y - ghost.y, 2)
            );
            
            if (distance < 0.8) { // 衝突判定の閾値
                if (ghost.mode === 'frightened') {
                    // ゴーストを食べた
                    ghost.reset();
                    this.addScore(200);
                } else {
                    // プレイヤーがやられた
                    this.loseLife();
                }
            }
        });
    }
    
    checkDotCollection() {
        const playerGridX = Math.round(this.player.x);
        const playerGridY = Math.round(this.player.y);
        
        if (this.maze.collectDot(playerGridX, playerGridY)) {
            this.addScore(10);
        }
        
        if (this.maze.collectPowerPellet(playerGridX, playerGridY)) {
            this.addScore(50);
            this.frightenGhosts();
        }
    }
    
    frightenGhosts() {
        this.ghosts.forEach(ghost => {
            ghost.frighten();
        });
    }
    
    checkGameEnd() {
        // 全てのドットを集めたかチェック
        if (this.maze.allDotsCollected()) {
            this.gameState = 'victory';
        }
        
        // ライフが0になったかチェック
        if (this.lives <= 0) {
            this.gameState = 'gameOver';
        }
    }
    
    loseLife() {
        this.lives--;
        this.updateUI();
        
        if (this.lives > 0) {
            // リスポーン
            this.player.reset();
            this.ghosts.forEach(ghost => ghost.reset());
        }
    }
    
    addScore(points) {
        this.score += points;
        this.updateUI();
    }
    
    updateUI() {
        this.scoreElement.textContent = this.score;
        this.livesElement.textContent = this.lives;
    }
    
    render() {
        // 画面をクリア
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 迷路を描画
        this.maze.render(this.ctx);
        
        // プレイヤーを描画
        this.player.render(this.ctx);
        
        // ゴーストを描画
        this.ghosts.forEach(ghost => {
            ghost.render(this.ctx);
        });
        
        // ゲーム状態メッセージ
        this.renderGameState();
    }
    
    renderGameState() {
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '24px Arial';
        this.ctx.textAlign = 'center';
        
        if (this.gameState === 'paused') {
            this.ctx.fillText('ポーズ中 - スペースキーで再開', this.canvas.width / 2, this.canvas.height / 2);
        } else if (this.gameState === 'gameOver') {
            this.ctx.fillStyle = '#ff0000';
            this.ctx.fillText('ゲームオーバー', this.canvas.width / 2, this.canvas.height / 2 - 20);
            this.ctx.fillStyle = '#fff';
            this.ctx.fillText('F5で再スタート', this.canvas.width / 2, this.canvas.height / 2 + 20);
        } else if (this.gameState === 'victory') {
            this.ctx.fillStyle = '#00ff00';
            this.ctx.fillText('クリア！', this.canvas.width / 2, this.canvas.height / 2 - 20);
            this.ctx.fillStyle = '#fff';
            this.ctx.fillText('F5で再スタート', this.canvas.width / 2, this.canvas.height / 2 + 20);
        }
        
        this.ctx.textAlign = 'left';
    }
    
    gameLoop(currentTime) {
        const deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;
        
        this.update(deltaTime);
        this.render();
        
        requestAnimationFrame((time) => this.gameLoop(time));
    }
    
    start() {
        requestAnimationFrame((time) => this.gameLoop(time));
    }
}
