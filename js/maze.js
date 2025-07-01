// 迷路クラス
class Maze {
    constructor() {
        this.tileSize = 20;
        this.width = 27;
        this.height = 23;
        
        // 迷路のレイアウト
        // 0: 通路, 1: 壁, 2: ドット, 3: パワーペレット
        this.layout = [
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
            [1,2,2,2,2,2,2,2,2,2,2,2,2,1,2,2,2,2,2,2,2,2,2,2,2,2,1],
            [1,3,1,1,1,1,2,1,1,1,1,1,2,1,2,1,1,1,1,1,2,1,1,1,1,3,1],
            [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
            [1,2,1,1,1,1,2,1,1,2,1,1,1,1,1,1,1,2,1,1,2,1,1,1,1,2,1],
            [1,2,2,2,2,2,2,1,1,2,2,2,2,1,2,2,2,2,1,1,2,2,2,2,2,2,1],
            [1,1,1,1,1,1,2,1,1,1,1,1,0,1,0,1,1,1,1,1,2,1,1,1,1,1,1],
            [0,0,0,0,0,1,2,1,1,0,0,0,0,0,0,0,0,0,1,1,2,1,0,0,0,0,0],
            [0,0,0,0,0,1,2,1,1,0,1,1,0,0,0,1,1,0,1,1,2,1,0,0,0,0,0],
            [1,1,1,1,1,1,2,1,1,0,1,0,0,0,0,0,1,0,1,1,2,1,1,1,1,1,1],
            [0,0,0,0,0,0,2,0,0,0,1,0,0,0,0,0,1,0,0,0,2,0,0,0,0,0,0],
            [1,1,1,1,1,1,2,1,1,0,1,0,0,0,0,0,1,0,1,1,2,1,1,1,1,1,1],
            [0,0,0,0,0,1,2,1,1,0,1,1,1,1,1,1,1,0,1,1,2,1,0,0,0,0,0],
            [0,0,0,0,0,1,2,1,1,0,0,0,0,0,0,0,0,0,1,1,2,1,0,0,0,0,0],
            [1,1,1,1,1,1,2,1,1,1,1,1,0,1,0,1,1,1,1,1,2,1,1,1,1,1,1],
            [1,2,2,2,2,2,2,2,2,2,2,2,2,1,2,2,2,2,2,2,2,2,2,2,2,2,1],
            [1,2,1,1,1,1,2,1,1,1,1,1,2,1,2,1,1,1,1,1,2,1,1,1,1,2,1],
            [1,3,2,2,1,1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1,1,2,2,3,1],
            [1,1,1,2,1,1,2,1,1,2,1,1,1,1,1,1,1,2,1,1,2,1,1,2,1,1,1],
            [1,2,2,2,2,2,2,1,1,2,2,2,2,1,2,2,2,2,1,1,2,2,2,2,2,2,1],
            [1,2,1,1,1,1,1,1,1,1,1,1,2,1,2,1,1,1,1,1,1,1,1,1,1,2,1],
            [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
        ];
        
        // ドットとパワーペレットの初期化
        this.originalLayout = this.layout.map(row => [...row]);
        this.dotsRemaining = this.countDots();
    }
    
    countDots() {
        let count = 0;
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                if (this.layout[y] && (this.layout[y][x] === 2 || this.layout[y][x] === 3)) {
                    count++;
                }
            }
        }
        return count;
    }
    
    canMoveTo(x, y) {
        // 境界チェック
        if (y < 0 || y >= this.height || x < -1 || x > this.width) {
            return false;
        }
        
        // 左右の画面端（ワープ用）は通行可能
        if (x < 0 || x >= this.width) {
            return y >= 10 && y <= 12; // ワープ通路の高さ
        }
        
        // 壁チェック
        return this.layout[y][x] !== 1;
    }
    
    collectDot(x, y) {
        if (y >= 0 && y < this.height && x >= 0 && x < this.width) {
            if (this.layout[y][x] === 2) {
                this.layout[y][x] = 0;
                this.dotsRemaining--;
                return true;
            }
        }
        return false;
    }
    
    collectPowerPellet(x, y) {
        if (y >= 0 && y < this.height && x >= 0 && x < this.width) {
            if (this.layout[y][x] === 3) {
                this.layout[y][x] = 0;
                this.dotsRemaining--;
                return true;
            }
        }
        return false;
    }
    
    allDotsCollected() {
        return this.dotsRemaining <= 0;
    }
    
    reset() {
        this.layout = this.originalLayout.map(row => [...row]);
        this.dotsRemaining = this.countDots();
    }
    
    render(ctx) {
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const tileType = this.layout[y][x];
                const drawX = x * this.tileSize;
                const drawY = y * this.tileSize;
                
                switch (tileType) {
                    case 1: // 壁
                        ctx.fillStyle = '#0000ff';
                        ctx.fillRect(drawX, drawY, this.tileSize, this.tileSize);
                        break;
                    case 2: // ドット
                        ctx.fillStyle = '#ffff00';
                        ctx.beginPath();
                        ctx.arc(
                            drawX + this.tileSize / 2,
                            drawY + this.tileSize / 2,
                            2,
                            0,
                            2 * Math.PI
                        );
                        ctx.fill();
                        break;
                    case 3: // パワーペレット
                        ctx.fillStyle = '#ffff00';
                        ctx.beginPath();
                        ctx.arc(
                            drawX + this.tileSize / 2,
                            drawY + this.tileSize / 2,
                            6,
                            0,
                            2 * Math.PI
                        );
                        ctx.fill();
                        break;
                }
            }
        }
        
        // 迷路の境界線
        ctx.strokeStyle = '#0000ff';
        ctx.lineWidth = 2;
        ctx.strokeRect(0, 0, this.width * this.tileSize, this.height * this.tileSize);
    }
}
