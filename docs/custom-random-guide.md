# カスタムランダムシステム設計ガイド

ゲーム開発において、通常の `Math.random()` よりも**恣意的**で**制御可能**なランダム関数が必要になることがあります。このドキュメントでは、目的別に最適なランダムシステムの実装方法を説明します。

## 🎯 **恣意的ランダムの目的**

### 1. **ゲームバランス調整**
- プレイヤーが不利になりすぎないよう調整
- 連続で同じ結果が出ないよう制御
- 難易度に応じた確率調整

### 2. **プレイヤー体験の向上**
- 「運が悪い」と感じさせない仕組み
- 適度な緊張感とリリーフの提供
- 予測可能性と意外性のバランス

### 3. **デバッグ・テスト支援**
- 再現可能なランダムシーケンス
- 特定の状況を意図的に作り出す
- QAテストでの一貫性確保

## 🛠️ **実装アプローチ比較**

| アプローチ | 適用場面 | 実装難易度 | 制御レベル |
|------------|----------|------------|------------|
| **カスタム** | 既存システムの改良 | ⭐⭐ | 中 |
| **一から作成** | 完全制御が必要 | ⭐⭐⭐⭐ | 高 |
| **ハイブリッド** | バランス重視 | ⭐⭐⭐ | 高 |

## 🎮 **パックマンゲーム用カスタムランダム**

### アプローチ1: 重み付きランダム（カスタム）

```javascript
class WeightedRandom {
    constructor() {
        this.weights = new Map();
        this.history = [];
        this.maxHistory = 10;
    }
    
    // 重みを設定（高いほど出やすい）
    setWeight(value, weight) {
        this.weights.set(value, weight);
    }
    
    // 最近の結果を考慮した重み付き選択
    select(options) {
        const adjustedWeights = new Map();
        
        options.forEach(option => {
            let baseWeight = this.weights.get(option) || 1;
            
            // 最近出た結果は重みを減らす（連続回避）
            const recentCount = this.history.filter(h => h === option).length;
            const penalty = Math.pow(0.5, recentCount);
            
            adjustedWeights.set(option, baseWeight * penalty);
        });
        
        const selected = this.weightedSelect(adjustedWeights);
        this.addToHistory(selected);
        return selected;
    }
    
    weightedSelect(weights) {
        const totalWeight = Array.from(weights.values()).reduce((sum, w) => sum + w, 0);
        let random = Math.random() * totalWeight;
        
        for (const [value, weight] of weights) {
            random -= weight;
            if (random <= 0) {
                return value;
            }
        }
        
        return Array.from(weights.keys())[0]; // フォールバック
    }
    
    addToHistory(value) {
        this.history.push(value);
        if (this.history.length > this.maxHistory) {
            this.history.shift();
        }
    }
}
```

### アプローチ2: シード付きランダム（一から作成）

```javascript
class SeededRandom {
    constructor(seed = Date.now()) {
        this.seed = seed;
        this.originalSeed = seed;
    }
    
    // Linear Congruential Generator (LCG)
    next() {
        this.seed = (this.seed * 1664525 + 1013904223) % Math.pow(2, 32);
        return this.seed / Math.pow(2, 32);
    }
    
    // 指定範囲の整数
    nextInt(min, max) {
        return Math.floor(this.next() * (max - min + 1)) + min;
    }
    
    // 指定範囲の浮動小数点
    nextFloat(min = 0, max = 1) {
        return this.next() * (max - min) + min;
    }
    
    // 配列からランダム選択
    choice(array) {
        return array[this.nextInt(0, array.length - 1)];
    }
    
    // 配列をシャッフル
    shuffle(array) {
        const result = [...array];
        for (let i = result.length - 1; i > 0; i--) {
            const j = this.nextInt(0, i);
            [result[i], result[j]] = [result[j], result[i]];
        }
        return result;
    }
    
    // シードをリセット（再現可能性）
    reset() {
        this.seed = this.originalSeed;
    }
    
    // 新しいシードを設定
    setSeed(newSeed) {
        this.seed = newSeed;
        this.originalSeed = newSeed;
    }
}
```

### アプローチ3: ゲームバランス考慮ランダム（ハイブリッド）

```javascript
class GameBalancedRandom {
    constructor(seed) {
        this.seededRandom = new SeededRandom(seed);
        this.weightedRandom = new WeightedRandom();
        this.streakBreaker = new StreakBreaker();
        this.playerLuckMeter = 50; // 0-100（50が中立）
    }
    
    // プレイヤーの運レベルを考慮した結果生成
    generateWithLuck(successProbability) {
        let adjustedProbability = successProbability;
        
        // 運メーターが低い場合は成功率を上げる
        if (this.playerLuckMeter < 30) {
            adjustedProbability *= 1.5; // 救済措置
        }
        // 運メーターが高い場合は成功率を下げる
        else if (this.playerLuckMeter > 70) {
            adjustedProbability *= 0.8; // バランス調整
        }
        
        const result = this.seededRandom.next() < adjustedProbability;
        this.updateLuckMeter(result);
        
        return result;
    }
    
    // ゴーストの行動パターン選択（恣意的制御）
    selectGhostBehavior(player, ghost) {
        const distance = this.calculateDistance(player, ghost);
        const behaviors = ['aggressive', 'defensive', 'random', 'smart'];
        
        // 距離と運メーターに基づく重み付け
        this.weightedRandom.setWeight('aggressive', 
            distance < 3 ? (this.playerLuckMeter > 60 ? 8 : 3) : 1
        );
        this.weightedRandom.setWeight('defensive', 
            distance > 5 ? 6 : 2
        );
        this.weightedRandom.setWeight('random', 3);
        this.weightedRandom.setWeight('smart', 
            this.playerLuckMeter < 40 ? 2 : 5
        );
        
        return this.weightedRandom.select(behaviors);
    }
    
    // アイテムドロップの恣意的制御
    generateItemDrop(baseDropRate) {
        const streakCount = this.streakBreaker.getCurrentStreak('no_item');
        
        // アイテムが出ていない期間が長いほど確率上昇
        let adjustedRate = baseDropRate + (streakCount * 0.1);
        
        // プレイヤーの状況を考慮
        if (this.playerLuckMeter < 25) {
            adjustedRate *= 2; // 危機的状況では大幅補正
        }
        
        const dropped = this.generateWithLuck(adjustedRate);
        this.streakBreaker.recordEvent(dropped ? 'item_drop' : 'no_item');
        
        return dropped;
    }
    
    updateLuckMeter(wasSuccessful) {
        if (wasSuccessful) {
            this.playerLuckMeter = Math.min(100, this.playerLuckMeter + 5);
        } else {
            this.playerLuckMeter = Math.max(0, this.playerLuckMeter - 3);
        }
    }
    
    calculateDistance(player, ghost) {
        return Math.sqrt(
            Math.pow(player.x - ghost.x, 2) + 
            Math.pow(player.y - ghost.y, 2)
        );
    }
}

// 連続同一結果を防ぐヘルパークラス
class StreakBreaker {
    constructor() {
        this.streaks = new Map();
        this.maxStreak = 3; // 最大連続回数
    }
    
    recordEvent(eventType) {
        if (!this.streaks.has(eventType)) {
            this.streaks.set(eventType, 0);
        }
        
        // 同じイベントの連続回数を増加
        this.streaks.set(eventType, this.streaks.get(eventType) + 1);
        
        // 他のイベントタイプはリセット
        for (const [type, count] of this.streaks) {
            if (type !== eventType) {
                this.streaks.set(type, 0);
            }
        }
    }
    
    getCurrentStreak(eventType) {
        return this.streaks.get(eventType) || 0;
    }
    
    shouldForceBreak(eventType) {
        return this.getCurrentStreak(eventType) >= this.maxStreak;
    }
}
```

## 🎯 **パックマンゲーム具体例**

### 1. ゴーストAIの恣意的制御

```javascript
class BalancedGhostAI {
    constructor(ghost, gameRandom) {
        this.ghost = ghost;
        this.random = gameRandom;
        this.aggressionLevel = 50; // 0-100
    }
    
    chooseDirection() {
        const playerDistance = this.getPlayerDistance();
        
        // プレイヤーが苦戦している場合は手加減
        if (this.random.playerLuckMeter < 30) {
            this.aggressionLevel = Math.max(20, this.aggressionLevel - 10);
        }
        // プレイヤーが余裕の場合は強化
        else if (this.random.playerLuckMeter > 70) {
            this.aggressionLevel = Math.min(90, this.aggressionLevel + 5);
        }
        
        const behavior = this.random.selectGhostBehavior(
            this.ghost.player, 
            this.ghost
        );
        
        switch (behavior) {
            case 'aggressive':
                return this.getDirectPathToPlayer();
            case 'defensive':
                return this.getEvasiveDirection();
            case 'random':
                return this.getRandomDirection();
            case 'smart':
                return this.getPredictiveDirection();
        }
    }
    
    // 恣意的なミス（プレイヤーに有利に）
    shouldMakeMistake() {
        const mistakeChance = this.random.playerLuckMeter < 40 ? 0.3 : 0.1;
        return this.random.generateWithLuck(mistakeChance);
    }
}
```

### 2. パワーペレット効果の動的調整

```javascript
class DynamicPowerPellet {
    constructor(gameRandom) {
        this.random = gameRandom;
        this.baseDuration = 8; // 基本持続時間
    }
    
    calculateDuration() {
        let duration = this.baseDuration;
        
        // プレイヤーの状況に応じて持続時間調整
        if (this.random.playerLuckMeter < 25) {
            duration *= 1.5; // 苦戦時は長めに
        } else if (this.random.playerLuckMeter > 75) {
            duration *= 0.7; // 余裕時は短めに
        }
        
        // ランダム要素も加える（±20%）
        const variation = this.random.seededRandom.nextFloat(0.8, 1.2);
        
        return duration * variation;
    }
    
    shouldSpawnBonus() {
        // 特定条件下でボーナスアイテム出現
        const desperation = 100 - this.random.playerLuckMeter;
        const bonusChance = Math.min(0.5, desperation / 200);
        
        return this.random.generateWithLuck(bonusChance);
    }
}
```

### 3. 迷路生成の恣意的制御

```javascript
class BiasedMazeGenerator {
    constructor(seed) {
        this.random = new SeededRandom(seed);
        this.playerFavorability = 0.3; // プレイヤー有利度
    }
    
    generateMaze(difficulty) {
        const maze = this.createBaseMaze();
        
        // 難易度とプレイヤー有利度に応じて調整
        if (difficulty > 7 && this.playerFavorability > 0.2) {
            this.addEscapeRoutes(maze);
            this.addHidingSpots(maze);
        }
        
        // 恣意的にアイテム配置を調整
        this.placeItemsStrategically(maze);
        
        return maze;
    }
    
    addEscapeRoutes(maze) {
        // プレイヤーが逃げやすいよう通路を追加
        const escapeRoutes = 3;
        for (let i = 0; i < escapeRoutes; i++) {
            const x = this.random.nextInt(5, 22);
            const y = this.random.nextInt(5, 18);
            
            // 戦略的な位置に通路を作成
            if (this.isStrategicPosition(x, y)) {
                maze[y][x] = 0; // 通路に変更
            }
        }
    }
    
    placeItemsStrategically(maze) {
        // 危険な場所により多くのアイテムを配置
        for (let y = 0; y < maze.length; y++) {
            for (let x = 0; x < maze[y].length; x++) {
                if (maze[y][x] === 0) { // 通路の場合
                    const dangerLevel = this.calculateDangerLevel(x, y);
                    const itemChance = 0.3 + (dangerLevel * 0.4);
                    
                    if (this.random.next() < itemChance) {
                        maze[y][x] = 2; // ドット配置
                    }
                }
            }
        }
    }
}
```

## 🎮 **ゲームへの統合**

```javascript
class EnhancedGame extends Game {
    constructor() {
        super();
        // 恣意的ランダムシステムの初期化
        this.gameRandom = new GameBalancedRandom(Date.now());
        this.balancedAI = new BalancedGhostAI(this.ghosts[0], this.gameRandom);
        this.dynamicEffects = new DynamicPowerPellet(this.gameRandom);
        
        // デバッグ用：特定シードでテスト可能
        if (this.debugMode) {
            this.gameRandom.setSeed(12345);
        }
    }
    
    update(deltaTime) {
        super.update(deltaTime);
        
        // プレイヤーの状況を定期的にログ
        if (this.debugMode) {
            console.log(`Luck Meter: ${this.gameRandom.playerLuckMeter}`);
        }
    }
    
    // 開発者向けコンソールコマンド
    setPlayerLuck(level) {
        this.gameRandom.playerLuckMeter = Math.max(0, Math.min(100, level));
        console.log(`Player luck set to: ${level}`);
    }
    
    forceDifficulty(level) {
        this.gameRandom.playerLuckMeter = level > 5 ? 30 : 70;
        console.log(`Difficulty adjusted to: ${level}`);
    }
}
```

## 🔍 **デバッグ・テスト支援**

```javascript
class RandomDebugger {
    constructor(gameRandom) {
        this.gameRandom = gameRandom;
        this.log = [];
        this.enabled = false;
    }
    
    enable() {
        this.enabled = true;
        console.log('Random debugging enabled');
    }
    
    logEvent(eventType, result, context = {}) {
        if (!this.enabled) return;
        
        const logEntry = {
            timestamp: Date.now(),
            type: eventType,
            result: result,
            luckMeter: this.gameRandom.playerLuckMeter,
            seed: this.gameRandom.seededRandom.seed,
            context: context
        };
        
        this.log.push(logEntry);
        console.log('Random Event:', logEntry);
    }
    
    exportLog() {
        return JSON.stringify(this.log, null, 2);
    }
    
    replay(logData) {
        // ログからイベントを再現
        const events = JSON.parse(logData);
        events.forEach(event => {
            this.gameRandom.seededRandom.setSeed(event.seed);
            // イベントを再実行...
        });
    }
}
```

## 🎯 **推奨実装戦略**

### パックマンゲームの場合

**推奨: ハイブリッドアプローチ**

1. **基盤**: `SeededRandom`（再現性・デバッグ）
2. **バランス**: `GameBalancedRandom`（体験向上）
3. **AI制御**: `WeightedRandom`（行動調整）

```javascript
// 統合例
class PackmanRandomSystem {
    constructor(seed) {
        this.core = new SeededRandom(seed);
        this.balanced = new GameBalancedRandom(seed);
        this.debugger = new RandomDebugger(this.balanced);
    }
    
    // 用途別メソッド
    forAI() { return this.balanced; }
    forGeneration() { return this.core; }
    forBalance() { return this.balanced; }
    forDebug() { return this.debugger; }
}
```

この設計により、**恣意的**でありながら**制御可能**なランダムシステムが実現できます。プレイヤーの体験を向上させながら、開発・テストの効率も保てます。

## 💡 **応用アイデア**

- **アダプティブ難易度**: プレイヤーのスキルに応じて自動調整
- **ドラマチック演出**: 緊迫したタイミングでの救済イベント
- **学習機能**: プレイヤーの行動パターンを学習して調整
- **季節イベント**: 特定期間での特別な確率設定
