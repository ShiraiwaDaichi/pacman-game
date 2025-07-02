# 自動迷路生成システム

ゲーム起動時に毎回異なる迷路を生成するシステムの実装ガイドです。パックマンのゲーム性を保ちながら、多様性と面白さを提供します。

## 🎮 **実装アプローチ比較**

| アプローチ | 実装難易度 | 多様性 | ゲーム性 | 推奨レベル |
|------------|------------|--------|----------|------------|
| **パターン組み合わせ** | ⭐ | ⭐⭐ | ⭐⭐⭐⭐⭐ | 初心者 |
| **アルゴリズム生成** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | 中級者 |
| **ハイブリッド** | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | 上級者 |

## 🚀 **アプローチ1: パターン組み合わせ生成**

### 基本実装

```javascript
class PatternBasedMazeGenerator {
    constructor() {
        // 迷路のセクションパターン（9x9のブロック）
        this.cornerPatterns = [
            // パターン1: シンプル
            [
                [1,1,1,1,1,1,1,1,1],
                [1,2,2,2,1,2,2,2,1],
                [1,2,1,2,1,2,1,2,1],
                [1,2,2,2,2,2,2,2,1],
                [1,1,1,2,1,2,1,1,1],
                [1,2,2,2,2,2,2,2,1],
                [1,2,1,2,1,2,1,2,1],
                [1,2,2,2,1,2,2,2,1],
                [1,1,1,1,1,1,1,1,1]
            ],
            // パターン2: 複雑
            [
                [1,1,1,1,1,1,1,1,1],
                [1,2,2,2,2,2,2,2,1],
                [1,2,1,1,2,1,1,2,1],
                [1,2,1,2,2,2,1,2,1],
                [1,2,2,2,1,2,2,2,1],
                [1,2,1,2,2,2,1,2,1],
                [1,2,1,1,2,1,1,2,1],
                [1,2,2,2,2,2,2,2,1],
                [1,1,1,1,1,1,1,1,1]
            ]
            // 他のパターンも追加...
        ];
        
        this.centerPatterns = [
            // 中央部用パターン
            [
                [0,0,0,0,0,0,0,0,0],
                [0,1,1,0,0,0,1,1,0],
                [0,1,0,0,0,0,0,1,0],
                [0,0,0,0,0,0,0,0,0],
                [0,0,0,1,1,1,0,0,0],
                [0,0,0,0,0,0,0,0,0],
                [0,1,0,0,0,0,0,1,0],
                [0,1,1,0,0,0,1,1,0],
                [0,0,0,0,0,0,0,0,0]
            ]
            // 他の中央パターンも追加...
        ];
    }
    
    generateMaze(seed = Date.now()) {
        // シード値でランダム制御
        const random = this.createSeededRandom(seed);
        
        // 27x23の迷路を初期化
        const maze = Array(23).fill().map(() => Array(27).fill(1));
        
        // 四隅にパターンを配置
        this.placeCornerPatterns(maze, random);
        
        // 中央にパターンを配置
        this.placeCenterPattern(maze, random);
        
        // エッジ部分を処理
        this.processEdges(maze, random);
        
        // ワープ通路を追加
        this.addWarpTunnels(maze);
        
        // ドットとパワーペレットを配置
        this.placeDots(maze, random);
        
        return maze;
    }
    
    placeCornerPatterns(maze, random) {
        const patterns = this.cornerPatterns;
        
        // 左上
        const topLeftPattern = patterns[random.nextInt(0, patterns.length - 1)];
        this.copyPattern(maze, topLeftPattern, 0, 0);
        
        // 右上（左右反転）
        const topRightPattern = this.flipHorizontal(
            patterns[random.nextInt(0, patterns.length - 1)]
        );
        this.copyPattern(maze, topRightPattern, 18, 0);
        
        // 左下（上下反転）
        const bottomLeftPattern = this.flipVertical(
            patterns[random.nextInt(0, patterns.length - 1)]
        );
        this.copyPattern(maze, bottomLeftPattern, 0, 14);
        
        // 右下（両方反転）
        const bottomRightPattern = this.flipBoth(
            patterns[random.nextInt(0, patterns.length - 1)]
        );
        this.copyPattern(maze, bottomRightPattern, 18, 14);
    }
    
    placeCenterPattern(maze, random) {
        const centerPattern = this.centerPatterns[
            random.nextInt(0, this.centerPatterns.length - 1)
        ];
        this.copyPattern(maze, centerPattern, 9, 7);
    }
    
    copyPattern(targetMaze, pattern, startX, startY) {
        for (let y = 0; y < pattern.length; y++) {
            for (let x = 0; x < pattern[y].length; x++) {
                if (startY + y < targetMaze.length && 
                    startX + x < targetMaze[0].length) {
                    targetMaze[startY + y][startX + x] = pattern[y][x];
                }
            }
        }
    }
    
    flipHorizontal(pattern) {
        return pattern.map(row => [...row].reverse());
    }
    
    flipVertical(pattern) {
        return [...pattern].reverse();
    }
    
    flipBoth(pattern) {
        return this.flipHorizontal(this.flipVertical(pattern));
    }
    
    addWarpTunnels(maze) {
        // 左右のワープ通路を追加
        const tunnelY = 11; // 中央の高さ
        maze[tunnelY][0] = 0;
        maze[tunnelY][26] = 0;
        
        // 通路への接続も確保
        for (let x = 1; x <= 3; x++) {
            maze[tunnelY][x] = 0;
            maze[tunnelY][26 - x] = 0;
        }
    }
    
    placeDots(maze, random) {
        for (let y = 0; y < maze.length; y++) {
            for (let x = 0; x < maze[y].length; x++) {
                if (maze[y][x] === 0) { // 空のスペース
                    maze[y][x] = 2; // ドット
                }
            }
        }
        
        // パワーペレットをランダム配置
        this.placePowerPellets(maze, random);
        
        // プレイヤー・ゴーストスタート地点を確保
        this.clearStartPositions(maze);
    }
    
    placePowerPellets(maze, random) {
        const powerPelletPositions = [];
        const corners = [
            {x: 2, y: 2}, {x: 24, y: 2}, 
            {x: 2, y: 20}, {x: 24, y: 20}
        ];
        
        corners.forEach(pos => {
            if (maze[pos.y][pos.x] === 2) {
                maze[pos.y][pos.x] = 3; // パワーペレット
            }
        });
    }
    
    clearStartPositions(maze) {
        // プレイヤースタート位置
        maze[21][13] = 0;
        
        // ゴーストスタート位置（中央部）
        for (let y = 10; y <= 13; y++) {
            for (let x = 11; x <= 15; x++) {
                maze[y][x] = 0;
            }
        }
    }
    
    createSeededRandom(seed) {
        let currentSeed = seed;
        return {
            nextInt: (min, max) => {
                currentSeed = (currentSeed * 9301 + 49297) % 233280;
                return Math.floor((currentSeed / 233280) * (max - min + 1)) + min;
            },
            nextFloat: () => {
                currentSeed = (currentSeed * 9301 + 49297) % 233280;
                return currentSeed / 233280;
            }
        };
    }
}
```

## 🌟 **アプローチ2: アルゴリズム生成**

### 改良版迷路生成アルゴリズム

```javascript
class AlgorithmicMazeGenerator {
    constructor() {
        this.width = 27;
        this.height = 23;
    }
    
    generateMaze(seed = Date.now()) {
        const random = this.createSeededRandom(seed);
        
        // 基本骨格を作成
        let maze = this.createBasicStructure();
        
        // 通路を生成
        maze = this.generatePaths(maze, random);
        
        // パックマン用に調整
        maze = this.adjustForPackman(maze, random);
        
        // ドット配置
        maze = this.placeDots(maze, random);
        
        return maze;
    }
    
    createBasicStructure() {
        const maze = Array(this.height).fill().map(() => Array(this.width).fill(1));
        
        // 外壁を作成
        for (let x = 0; x < this.width; x++) {
            maze[0][x] = 1; // 上壁
            maze[this.height - 1][x] = 1; // 下壁
        }
        for (let y = 0; y < this.height; y++) {
            maze[y][0] = 1; // 左壁
            maze[y][this.width - 1] = 1; // 右壁
        }
        
        // 中央のゴーストハウスエリアを確保
        this.createGhostHouse(maze);
        
        return maze;
    }
    
    createGhostHouse(maze) {
        // ゴーストハウス（11-15, 9-13）
        for (let y = 9; y <= 13; y++) {
            for (let x = 11; x <= 15; x++) {
                maze[y][x] = 0;
            }
        }
        
        // ゴーストハウスの壁
        for (let x = 11; x <= 15; x++) {
            maze[9][x] = 1; // 上壁
            maze[13][x] = 1; // 下壁
        }
        for (let y = 9; y <= 13; y++) {
            maze[y][11] = 1; // 左壁
            maze[y][15] = 1; // 右壁
        }
        
        // 出入り口
        maze[9][13] = 0;
    }
    
    generatePaths(maze, random) {
        const regions = this.divideIntoRegions();
        
        regions.forEach(region => {
            this.generateRegionPaths(maze, region, random);
        });
        
        // 各領域を接続
        this.connectRegions(maze, regions, random);
        
        return maze;
    }
    
    divideIntoRegions() {
        return [
            { x1: 1, y1: 1, x2: 10, y2: 8 },     // 左上
            { x1: 16, y1: 1, x2: 25, y2: 8 },    // 右上
            { x1: 1, y1: 14, x2: 10, y2: 21 },   // 左下
            { x1: 16, y1: 14, x2: 25, y2: 21 },  // 右下
            { x1: 1, y1: 9, x2: 10, y2: 13 },    // 左中
            { x1: 16, y1: 9, x2: 25, y2: 13 }    // 右中
        ];
    }
    
    generateRegionPaths(maze, region, random) {
        // 各領域内で迷路を生成
        const { x1, y1, x2, y2 } = region;
        
        // ランダムウォークで通路を作成
        let currentX = x1 + random.nextInt(0, Math.floor((x2 - x1) / 2)) * 2;
        let currentY = y1 + random.nextInt(0, Math.floor((y2 - y1) / 2)) * 2;
        
        maze[currentY][currentX] = 0;
        
        for (let i = 0; i < 20; i++) {
            const directions = this.getValidDirections(
                maze, currentX, currentY, x1, y1, x2, y2
            );
            
            if (directions.length > 0) {
                const dir = directions[random.nextInt(0, directions.length - 1)];
                currentX += dir.x * 2;
                currentY += dir.y * 2;
                
                // 通路を作成
                maze[currentY][currentX] = 0;
                maze[currentY - dir.y][currentX - dir.x] = 0;
            }
        }
    }
    
    getValidDirections(maze, x, y, x1, y1, x2, y2) {
        const directions = [
            { x: 0, y: -1 }, { x: 0, y: 1 },
            { x: -1, y: 0 }, { x: 1, y: 0 }
        ];
        
        return directions.filter(dir => {
            const newX = x + dir.x * 2;
            const newY = y + dir.y * 2;
            
            return newX >= x1 && newX <= x2 && 
                   newY >= y1 && newY <= y2 && 
                   maze[newY][newX] === 1;
        });
    }
    
    connectRegions(maze, regions, random) {
        // 隣接する領域を接続
        this.connectHorizontalRegions(maze, regions, random);
        this.connectVerticalRegions(maze, regions, random);
        
        // 中央エリアへの接続
        this.connectToCenter(maze, random);
    }
    
    connectToCenter(maze, random) {
        // ゴーストハウスと各領域を接続
        const connectionPoints = [
            { x: 13, y: 8 },  // 上から
            { x: 13, y: 14 }, // 下から
            { x: 10, y: 11 }, // 左から
            { x: 16, y: 11 }  // 右から
        ];
        
        connectionPoints.forEach(point => {
            if (random.nextFloat() > 0.3) { // 70%の確率で接続
                maze[point.y][point.x] = 0;
            }
        });
    }
    
    adjustForPackman(maze, random) {
        // パックマン用の調整
        
        // 1. 行き止まりを減らす
        this.reduceDeadEnds(maze, random);
        
        // 2. 十分な幅の通路を確保
        this.ensurePathWidth(maze);
        
        // 3. ワープトンネルを追加
        this.addWarpTunnels(maze);
        
        // 4. 戦略的な開けたエリアを作成
        this.createOpenAreas(maze, random);
        
        return maze;
    }
    
    reduceDeadEnds(maze, random) {
        let changed = true;
        while (changed) {
            changed = false;
            
            for (let y = 1; y < this.height - 1; y++) {
                for (let x = 1; x < this.width - 1; x++) {
                    if (maze[y][x] === 0 && this.isDeadEnd(maze, x, y)) {
                        if (random.nextFloat() > 0.3) { // 70%の確率で拡張
                            this.expandDeadEnd(maze, x, y, random);
                            changed = true;
                        }
                    }
                }
            }
        }
    }
    
    isDeadEnd(maze, x, y) {
        const neighbors = [
            maze[y-1][x], maze[y+1][x], maze[y][x-1], maze[y][x+1]
        ];
        return neighbors.filter(n => n === 0).length === 1;
    }
    
    expandDeadEnd(maze, x, y, random) {
        const walls = [];
        if (maze[y-1][x] === 1) walls.push({x: x, y: y-1});
        if (maze[y+1][x] === 1) walls.push({x: x, y: y+1});
        if (maze[y][x-1] === 1) walls.push({x: x-1, y: y});
        if (maze[y][x+1] === 1) walls.push({x: x+1, y: y});
        
        if (walls.length > 0) {
            const wall = walls[random.nextInt(0, walls.length - 1)];
            maze[wall.y][wall.x] = 0;
        }
    }
    
    createOpenAreas(maze, random) {
        // 戦略的なオープンエリアを作成
        const openAreas = [
            { x: 3, y: 3, width: 3, height: 3 },
            { x: 21, y: 3, width: 3, height: 3 },
            { x: 3, y: 17, width: 3, height: 3 },
            { x: 21, y: 17, width: 3, height: 3 },
            { x: 11, y: 17, width: 5, height: 3 }
        ];
        
        openAreas.forEach(area => {
            if (random.nextFloat() > 0.4) { // 60%の確率で作成
                this.createOpenArea(maze, area);
            }
        });
    }
    
    createOpenArea(maze, area) {
        for (let y = area.y; y < area.y + area.height; y++) {
            for (let x = area.x; x < area.x + area.width; x++) {
                if (y >= 0 && y < this.height && x >= 0 && x < this.width) {
                    maze[y][x] = 0;
                }
            }
        }
    }
    
    addWarpTunnels(maze) {
        const tunnelY = 11;
        maze[tunnelY][0] = 0;
        maze[tunnelY][this.width - 1] = 0;
        
        // 接続通路
        for (let x = 1; x <= 3; x++) {
            maze[tunnelY][x] = 0;
            maze[tunnelY][this.width - 1 - x] = 0;
        }
    }
    
    placeDots(maze, random) {
        // ドット配置のロジック（前のコードと同様）
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                if (maze[y][x] === 0) {
                    maze[y][x] = 2; // ドット
                }
            }
        }
        
        // パワーペレットをランダム配置
        this.placePowerPellets(maze, random);
        this.clearStartPositions(maze);
        
        return maze;
    }
    
    placePowerPellets(maze, random) {
        // 角の位置にパワーペレットを配置
        const corners = [
            {x: 2, y: 2}, {x: 24, y: 2}, 
            {x: 2, y: 20}, {x: 24, y: 20}
        ];
        
        corners.forEach(pos => {
            if (maze[pos.y] && maze[pos.y][pos.x] === 2) {
                maze[pos.y][pos.x] = 3;
            }
        });
        
        // 追加のパワーペレットをランダム配置
        const additionalPowerPellets = random.nextInt(0, 2);
        for (let i = 0; i < additionalPowerPellets; i++) {
            let placed = false;
            let attempts = 0;
            
            while (!placed && attempts < 50) {
                const x = random.nextInt(2, this.width - 3);
                const y = random.nextInt(2, this.height - 3);
                
                if (maze[y][x] === 2) {
                    maze[y][x] = 3;
                    placed = true;
                }
                attempts++;
            }
        }
    }
    
    clearStartPositions(maze) {
        // プレイヤー開始位置
        maze[21][13] = 0;
        maze[20][13] = 0;
        
        // ゴーストハウス周辺をクリア
        for (let y = 8; y <= 14; y++) {
            for (let x = 11; x <= 15; x++) {
                if (maze[y][x] === 2) {
                    maze[y][x] = 0;
                }
            }
        }
    }
    
    createSeededRandom(seed) {
        let currentSeed = seed;
        return {
            nextInt: (min, max) => {
                currentSeed = (currentSeed * 9301 + 49297) % 233280;
                return Math.floor((currentSeed / 233280) * (max - min + 1)) + min;
            },
            nextFloat: () => {
                currentSeed = (currentSeed * 9301 + 49297) % 233280;
                return currentSeed / 233280;
            }
        };
    }
}
```

## 🎯 **アプローチ3: ハイブリッド生成（推奨）**

```javascript
class HybridMazeGenerator {
    constructor() {
        this.patternGenerator = new PatternBasedMazeGenerator();
        this.algorithmGenerator = new AlgorithmicMazeGenerator();
    }
    
    generateMaze(difficulty = 1, seed = Date.now()) {
        const random = this.createSeededRandom(seed);
        
        // 難易度に応じて生成方法を選択
        if (difficulty <= 3) {
            // 初心者向け：パターンベース
            return this.generateEasyMaze(seed, random);
        } else if (difficulty <= 7) {
            // 中級者向け：ハイブリッド
            return this.generateMediumMaze(seed, random);
        } else {
            // 上級者向け：アルゴリズム重視
            return this.generateHardMaze(seed, random);
        }
    }
    
    generateEasyMaze(seed, random) {
        const maze = this.patternGenerator.generateMaze(seed);
        
        // 簡単な変更を加える
        this.addRandomVariations(maze, random, 0.1); // 10%変更
        
        return maze;
    }
    
    generateMediumMaze(seed, random) {
        // パターンベースで基本構造を作成
        let maze = this.patternGenerator.generateMaze(seed);
        
        // アルゴリズム的に一部を変更
        this.applyAlgorithmicChanges(maze, random, 0.3); // 30%変更
        
        return maze;
    }
    
    generateHardMaze(seed, random) {
        // アルゴリズム生成をベースに
        let maze = this.algorithmGenerator.generateMaze(seed);
        
        // パターンで安定化
        this.stabilizeWithPatterns(maze, random);
        
        return maze;
    }
    
    addRandomVariations(maze, random, intensity) {
        const changeCount = Math.floor(maze.length * maze[0].length * intensity);
        
        for (let i = 0; i < changeCount; i++) {
            const x = random.nextInt(1, maze[0].length - 2);
            const y = random.nextInt(1, maze.length - 2);
            
            // 安全に変更できる場所のみ
            if (this.isSafeToChange(maze, x, y)) {
                maze[y][x] = maze[y][x] === 1 ? 0 : 1;
            }
        }
    }
    
    isSafeToChange(maze, x, y) {
        // ゴーストハウスエリアは変更しない
        if (x >= 11 && x <= 15 && y >= 9 && y <= 13) {
            return false;
        }
        
        // プレイヤー開始位置周辺は変更しない
        if (x >= 11 && x <= 15 && y >= 19 && y <= 22) {
            return false;
        }
        
        // ワープトンネル周辺は変更しない
        if ((x <= 3 || x >= 23) && y >= 10 && y <= 12) {
            return false;
        }
        
        return true;
    }
    
    createSeededRandom(seed) {
        let currentSeed = seed;
        return {
            nextInt: (min, max) => {
                currentSeed = (currentSeed * 9301 + 49297) % 233280;
                return Math.floor((currentSeed / 233280) * (max - min + 1)) + min;
            },
            nextFloat: () => {
                currentSeed = (currentSeed * 9301 + 49297) % 233280;
                return currentSeed / 233280;
            }
        };
    }
}
```

## 🎮 **ゲームへの統合**

```javascript
// maze.js の拡張
class GeneratedMaze extends Maze {
    constructor() {
        super();
        this.generator = new HybridMazeGenerator();
        this.currentSeed = Date.now();
        this.difficulty = 1;
    }
    
    generateNewMaze(difficulty = this.difficulty, seed = null) {
        this.currentSeed = seed || Date.now();
        this.difficulty = difficulty;
        
        console.log(`迷路生成中... Seed: ${this.currentSeed}, 難易度: ${difficulty}`);
        
        // 新しい迷路を生成
        this.layout = this.generator.generateMaze(difficulty, this.currentSeed);
        this.originalLayout = this.layout.map(row => [...row]);
        this.dotsRemaining = this.countDots();
        
        console.log(`迷路生成完了! ドット数: ${this.dotsRemaining}`);
    }
    
    // デバッグ用：特定シードで再生成
    regenerateWithSeed(seed) {
        this.generateNewMaze(this.difficulty, seed);
    }
    
    // 次の難易度で生成
    generateNextLevel() {
        this.difficulty = Math.min(10, this.difficulty + 1);
        this.generateNewMaze(this.difficulty);
    }
}

// game.js での使用例
class Game {
    constructor() {
        // 既存のコード...
        this.maze = new GeneratedMaze();
        
        // ゲーム開始時に迷路生成
        this.maze.generateNewMaze(1); // 初期難易度1
    }
    
    startNewGame() {
        // 新しい迷路で再開
        this.maze.generateNewMaze(this.getCurrentDifficulty());
        this.resetGameState();
    }
    
    nextLevel() {
        // レベルクリア時に新しい迷路
        this.maze.generateNextLevel();
        this.resetPositions();
    }
    
    getCurrentDifficulty() {
        // スコアやレベルに基づいて難易度を決定
        return Math.min(10, Math.floor(this.level / 2) + 1);
    }
    
    // デバッグコンソール用
    regenerateMaze(seed = null) {
        if (seed) {
            this.maze.regenerateWithSeed(seed);
        } else {
            this.maze.generateNewMaze(this.getCurrentDifficulty());
        }
        this.resetGameState();
        console.log(`新しい迷路が生成されました (Seed: ${this.maze.currentSeed})`);
    }
}
```

## 🎯 **実装の段階的アプローチ**

### Phase 1: 基本実装
1. **PatternBasedMazeGenerator** を実装
2. **GeneratedMaze** クラスでゲームに統合
3. 起動時の自動生成を確認

### Phase 2: 改良
1. **AlgorithmicMazeGenerator** を追加
2. より多くのパターンバリエーションを作成
3. 難易度調整システムを実装

### Phase 3: 高度化
1. **HybridMazeGenerator** を実装
2. プレイヤー行動データに基づく動的難易度調整
3. シード共有機能（友達と同じ迷路でプレイ）

このシステムにより、毎回異なる迷路でプレイできる、リプレイ性の高いパックマンゲームが実現できます！

どの段階から実装を始めたいか教えていただければ、具体的なコードサポートができます。 🚀
