// ゴーストクラス
class Ghost {
    constructor(x, y, color, maze, player) {
        this.startX = x;
        this.startY = y;
        this.x = x;
        this.y = y;
        this.color = color;
        this.maze = maze;
        this.player = player;
        this.speed = 3; // マス/秒
        this.direction = { x: 0, y: -1 }; // 初期方向は上
        this.mode = 'chase'; // chase, scatter, frightened, dead
        this.modeTimer = 0;
        this.frightenedTime = 8; // 8秒間
        this.target = { x: 0, y: 0 };
        
        // AI行動パターンのタイマー
        this.behaviorTimer = 0;
        this.behaviorDuration = 20; // 20秒ごとに行動変更
    }
    
    reset() {
        this.x = this.startX;
        this.y = this.startY;
        this.direction = { x: 0, y: -1 };
        this.mode = 'chase';
        this.modeTimer = 0;
        this.behaviorTimer = 0;
    }
    
    frighten() {
        if (this.mode !== 'dead') {
            this.mode = 'frightened';
            this.modeTimer = this.frightenedTime;
            // 方向を反転
            this.direction.x *= -1;
            this.direction.y *= -1;
        }
    }
    
    update(deltaTime) {
        // デバッグ: 赤いゴーストの状態をログ出力
        if (this.color === '#ff0000') {
            console.log(`赤ゴースト: 位置(${this.x}, ${this.y}), 方向(${this.direction.x}, ${this.direction.y}), モード: ${this.mode}`);
        }
        
        // モードタイマー更新
        if (this.mode === 'frightened') {
            this.modeTimer -= deltaTime;
            if (this.modeTimer <= 0) {
                this.mode = 'chase';
            }
        }
        
        // 行動パターンタイマー更新
        this.behaviorTimer += deltaTime;
        if (this.behaviorTimer >= this.behaviorDuration) {
            this.behaviorTimer = 0;
            this.mode = this.mode === 'chase' ? 'scatter' : 'chase';
        }
        
        // ターゲット設定
        this.setTarget();
        
        // 移動方向決定
        this.chooseDirection();
        
        // 移動
        this.move(deltaTime);
        
        // 画面端でのワープ処理
        this.handleScreenWrap();
    }
    
    setTarget() {
        const playerPos = this.player.getGridPosition();
        
        switch (this.mode) {
            case 'chase':
                // プレイヤーを追跡
                this.target = { x: playerPos.x, y: playerPos.y };
                break;
            case 'scatter':
                // 角へ散らばる
                this.target = this.getScatterTarget();
                break;
            case 'frightened':
                // ランダムに移動
                this.target = this.getRandomTarget();
                break;
            case 'dead':
                // スタート地点に戻る
                this.target = { x: this.startX, y: this.startY };
                break;
        }
    }
    
    getScatterTarget() {
        // 各ゴーストの散らばり先（マップの角）
        switch (this.color) {
            case '#ff0000': return { x: 25, y: 0 }; // 赤：右上
            case '#ffb8ff': return { x: 2, y: 0 };  // ピンク：左上
            case '#00ffff': return { x: 25, y: 22 }; // 青：右下
            case '#ffb852': return { x: 2, y: 22 };  // オレンジ：左下
            default: return { x: 13, y: 15 };
        }
    }
    
    getRandomTarget() {
        return {
            x: Math.floor(Math.random() * 27),
            y: Math.floor(Math.random() * 31)
        };
    }
    
    chooseDirection() {
        const currentX = Math.round(this.x);
        const currentY = Math.round(this.y);
        
        // 現在位置がグリッドの中心付近でない場合は現在の方向を維持
        if (Math.abs(this.x - currentX) > 0.1 || Math.abs(this.y - currentY) > 0.1) {
            return;
        }
        
        const possibleDirections = [
            { x: 0, y: -1 }, // 上
            { x: 0, y: 1 },  // 下
            { x: -1, y: 0 }, // 左
            { x: 1, y: 0 }   // 右
        ];
        
        // 後退は避ける（frightenedモード以外）
        const validDirections = possibleDirections.filter(dir => {
            const newX = currentX + dir.x;
            const newY = currentY + dir.y;
            
            // 壁チェック
            if (!this.maze.canMoveTo(newX, newY)) {
                return false;
            }
            
            // 後退チェック（frightenedモード以外）
            if (this.mode !== 'frightened') {
                if (dir.x === -this.direction.x && dir.y === -this.direction.y) {
                    return false;
                }
            }
            
            return true;
        });
        
        if (validDirections.length === 0) {
            // 進める方向がない場合は後退
            this.direction.x *= -1;
            this.direction.y *= -1;
            return;
        }
        
        // ターゲットに最も近い方向を選択
        let bestDirection = validDirections[0];
        let bestDistance = this.getDistanceToTarget(
            currentX + bestDirection.x,
            currentY + bestDirection.y
        );
        
        for (let i = 1; i < validDirections.length; i++) {
            const dir = validDirections[i];
            const distance = this.getDistanceToTarget(
                currentX + dir.x,
                currentY + dir.y
            );
            
            if (this.mode === 'frightened') {
                // frightenedモードでは遠い方向を選ぶ
                if (distance > bestDistance) {
                    bestDistance = distance;
                    bestDirection = dir;
                }
            } else {
                // 通常モードでは近い方向を選ぶ
                if (distance < bestDistance) {
                    bestDistance = distance;
                    bestDirection = dir;
                }
            }
        }
        
        this.direction = bestDirection;
    }
    
    getDistanceToTarget(x, y) {
        return Math.sqrt(
            Math.pow(x - this.target.x, 2) + 
            Math.pow(y - this.target.y, 2)
        );
    }
    
    move(deltaTime) {
        const speed = this.mode === 'frightened' ? this.speed * 0.5 : this.speed;
        
        const newX = this.x + this.direction.x * speed * deltaTime;
        const newY = this.y + this.direction.y * speed * deltaTime;
        
        // 移動先が壁でないかチェック
        if (this.maze.canMoveTo(Math.round(newX), Math.round(newY))) {
            this.x = newX;
            this.y = newY;
        }
    }
    
    handleScreenWrap() {
        // 左端から右端へワープ
        if (this.x < 0) {
            this.x = 26;
        }
        // 右端から左端へワープ
        else if (this.x > 26) {
            this.x = 0;
        }
    }
    
    render(ctx) {
        const tileSize = 20;
        const centerX = this.x * tileSize + tileSize / 2;
        const centerY = this.y * tileSize + tileSize / 2;
        const radius = tileSize / 2 - 2;
        
        // ゴーストの色（frightenedモードでは青色）
        let ghostColor = this.color;
        if (this.mode === 'frightened') {
            // 時間が残り少ない時は点滅
            if (this.modeTimer < 2 && Math.floor(this.modeTimer * 10) % 2 === 0) {
                ghostColor = '#ffffff';
            } else {
                ghostColor = '#0000ff';
            }
        }
        
        ctx.fillStyle = ghostColor;
        
        // ゴーストの体（上半分は円、下半分は波状）
        ctx.beginPath();
        ctx.arc(centerX, centerY - radius / 4, radius, Math.PI, 0);
        
        // 下部の波状部分
        const waveHeight = radius / 3;
        const waveWidth = radius / 2;
        ctx.lineTo(centerX + radius, centerY + radius / 2);
        ctx.lineTo(centerX + radius - waveWidth, centerY + radius / 2 - waveHeight);
        ctx.lineTo(centerX, centerY + radius / 2);
        ctx.lineTo(centerX - radius + waveWidth, centerY + radius / 2 - waveHeight);
        ctx.lineTo(centerX - radius, centerY + radius / 2);
        
        ctx.closePath();
        ctx.fill();
        
        // 目
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(centerX - radius / 3, centerY - radius / 3, radius / 4, 0, 2 * Math.PI);
        ctx.arc(centerX + radius / 3, centerY - radius / 3, radius / 4, 0, 2 * Math.PI);
        ctx.fill();
        
        // 瞳
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(centerX - radius / 3, centerY - radius / 3, radius / 8, 0, 2 * Math.PI);
        ctx.arc(centerX + radius / 3, centerY - radius / 3, radius / 8, 0, 2 * Math.PI);
        ctx.fill();
    }
}
