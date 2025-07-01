// プレイヤー（パックマン）クラス
class Player {
    constructor(maze) {
        this.maze = maze;
        this.reset();
        this.speed = 5; // マス/秒
        this.nextDirection = { x: 0, y: 0 };
        this.currentDirection = { x: 0, y: 0 };
        this.animationFrame = 0;
        this.animationSpeed = 10; // フレーム/秒
    }
    
    reset() {
        // 開始位置（迷路の下部中央）
        this.x = 13;
        this.y = 20; // 迷路の範囲内に修正
        this.nextDirection = { x: 0, y: 0 };
        this.currentDirection = { x: 0, y: 0 };
    }
    
    setDirection(x, y) {
        console.log(`プレイヤー方向設定: x=${x}, y=${y}, 現在位置: (${this.x}, ${this.y})`);
        this.nextDirection.x = x;
        this.nextDirection.y = y;
    }
    
    update(deltaTime) {
        // アニメーションフレーム更新
        this.animationFrame += this.animationSpeed * deltaTime;
        
        // 次の方向に移動可能かチェック
        if (this.nextDirection.x !== 0 || this.nextDirection.y !== 0) {
            const nextX = Math.round(this.x + this.nextDirection.x);
            const nextY = Math.round(this.y + this.nextDirection.y);
            
            console.log(`移動可能性チェック: 現在位置(${this.x}, ${this.y}) -> 次の位置(${nextX}, ${nextY})`);
            
            if (this.maze.canMoveTo(nextX, nextY)) {
                console.log('移動可能！方向を更新');
                this.currentDirection = { ...this.nextDirection };
                this.nextDirection = { x: 0, y: 0 };
            } else {
                console.log('移動不可能');
            }
        }
        
        // 現在の方向に移動
        if (this.currentDirection.x !== 0 || this.currentDirection.y !== 0) {
            const oldX = this.x;
            const oldY = this.y;
            const newX = this.x + this.currentDirection.x * this.speed * deltaTime;
            const newY = this.y + this.currentDirection.y * this.speed * deltaTime;
            
            console.log(`移動計算: (${oldX}, ${oldY}) -> (${newX}, ${newY}), deltaTime: ${deltaTime}`);
            
            // 移動先が壁でないかチェック
            if (this.maze.canMoveTo(Math.round(newX), Math.round(newY))) {
                this.x = newX;
                this.y = newY;
                console.log(`実際に移動: (${this.x}, ${this.y})`);
            } else {
                // 壁に当たったら停止
                console.log('壁に当たったため停止');
                this.currentDirection = { x: 0, y: 0 };
            }
        }
        
        // 画面端でのワープ処理
        this.handleScreenWrap();
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
        
        // パックマンの向きを計算
        let angle = 0;
        if (this.currentDirection.x > 0) angle = 0; // 右
        else if (this.currentDirection.x < 0) angle = Math.PI; // 左
        else if (this.currentDirection.y > 0) angle = Math.PI / 2; // 下
        else if (this.currentDirection.y < 0) angle = -Math.PI / 2; // 上
        
        // 口の開閉アニメーション
        const mouthAngle = Math.abs(Math.sin(this.animationFrame)) * Math.PI / 3;
        
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(angle);
        
        // パックマンの体
        ctx.fillStyle = '#ffff00';
        ctx.beginPath();
        ctx.arc(0, 0, radius, mouthAngle / 2, 2 * Math.PI - mouthAngle / 2);
        ctx.lineTo(0, 0);
        ctx.fill();
        
        // 目
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(-radius / 3, -radius / 2, 2, 0, 2 * Math.PI);
        ctx.fill();
        
        ctx.restore();
    }
    
    getGridPosition() {
        return {
            x: Math.round(this.x),
            y: Math.round(this.y)
        };
    }
}
