# 技術実装ガイド

このドキュメントでは、オリジナリティ提案の具体的な実装方法を段階別に説明します。

## 🚀 **実装開始前の準備**

### 開発環境のセットアップ
```bash
# プロジェクト構造の拡張
pacman-game/
├── index.html
├── js/
│   ├── core/           # コアシステム
│   ├── entities/       # ゲームエンティティ
│   ├── systems/        # 各種システム
│   ├── effects/        # エフェクト関連
│   └── audio/          # オーディオシステム
├── assets/
│   ├── audio/          # 音声ファイル
│   ├── sprites/        # 画像ファイル
│   └── data/           # ゲームデータ
└── docs/               # ドキュメント
```

### 必要なライブラリ
```html
<!-- socket.io (マルチプレイヤー用) -->
<script src="https://cdn.socket.io/4.7.4/socket.io.min.js"></script>

<!-- seedrandom (ランダム生成用) -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/seedrandom/3.0.5/seedrandom.min.js"></script>
```

## 🎨 **Phase 1: パーティクルシステム実装**

### ステップ1: 基本パーティクルクラス作成

**ファイル: `js/effects/particle.js`**
```javascript
class Particle {
    constructor(x, y, options = {}) {
        this.x = x;
        this.y = y;
        this.vx = options.vx || 0;
        this.vy = options.vy || 0;
        this.life = options.life || 1.0;
        this.maxLife = options.maxLife || 1.0;
        this.color = options.color || '#ffffff';
        this.size = options.size || 2;
        this.gravity = options.gravity || 0;
        this.friction = options.friction || 1;
    }
    
    update(deltaTime) {
        // 物理更新
        this.x += this.vx * deltaTime;
        this.y += this.vy * deltaTime;
        
        // 重力適用
        this.vy += this.gravity * deltaTime;
        
        // 摩擦適用
        this.vx *= this.friction;
        this.vy *= this.friction;
        
        // 寿命減少
        this.life -= deltaTime;
        
        return this.life > 0;
    }
    
    render(ctx) {
        const alpha = this.life / this.maxLife;
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}
```

### ステップ2: パーティクルシステム統合

**ファイル: `js/effects/particle-system.js`**
```javascript
class ParticleSystem {
    constructor() {
        this.particles = [];
        this.presets = {
            dotCollect: {
                count: 8,
                life: 0.5,
                speed: 60,
                color: '#ffff00',
                size: 3
            },
            powerPellet: {
                count: 20,
                life: 1.0,
                speed: 100,
                color: '#ffff00',
                size: 4,
                gravity: 50
            }
        };
    }
    
    emit(type, x, y) {
        const preset = this.presets[type];
        if (!preset) return;
        
        for (let i = 0; i < preset.count; i++) {
            const angle = (Math.PI * 2 * i) / preset.count;
            const speed = preset.speed + (Math.random() - 0.5) * 20;
            
            this.particles.push(new Particle(x, y, {
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: preset.life,
                maxLife: preset.life,
                color: preset.color,
                size: preset.size,
                gravity: preset.gravity || 0,
                friction: 0.98
            }));
        }
    }
    
    update(deltaTime) {
        this.particles = this.particles.filter(particle => 
            particle.update(deltaTime)
        );
    }
    
    render(ctx) {
        this.particles.forEach(particle => particle.render(ctx));
    }
}
```

### ステップ3: ゲームへの統合

**ファイル: `js/game.js` に追加**
```javascript
class Game {
    constructor() {
        // 既存のコード...
        this.particleSystem = new ParticleSystem();
    }
    
    update(deltaTime) {
        // 既存の更新処理...
        this.particleSystem.update(deltaTime);
    }
    
    render() {
        // 既存の描画処理...
        this.particleSystem.render(this.ctx);
    }
    
    // ドット収集時に呼び出し
    collectDot(x, y) {
        const gridX = x * 20 + 10;
        const gridY = y * 20 + 10;
        this.particleSystem.emit('dotCollect', gridX, gridY);
        // 既存のドット収集処理...
    }
}
```

## ⚡ **Phase 2: アビリティシステム実装**

### ステップ1: アビリティ基底クラス

**ファイル: `js/systems/ability.js`**
```javascript
class Ability {
    constructor(name, cooldown, duration = 0) {
        this.name = name;
        this.maxCooldown = cooldown;
        this.cooldown = 0;
        this.duration = duration;
        this.active = false;
        this.timeLeft = 0;
    }
    
    canUse() {
        return this.cooldown <= 0 && !this.active;
    }
    
    activate(target) {
        if (!this.canUse()) return false;
        
        this.active = true;
        this.cooldown = this.maxCooldown;
        this.timeLeft = this.duration;
        
        this.onActivate(target);
        return true;
    }
    
    update(deltaTime, target) {
        // クールダウン更新
        if (this.cooldown > 0) {
            this.cooldown -= deltaTime;
        }
        
        // 持続時間更新
        if (this.active) {
            this.timeLeft -= deltaTime;
            this.onUpdate(deltaTime, target);
            
            if (this.timeLeft <= 0) {
                this.deactivate(target);
            }
        }
    }
    
    deactivate(target) {
        this.active = false;
        this.timeLeft = 0;
        this.onDeactivate(target);
    }
    
    // サブクラスでオーバーライド
    onActivate(target) {}
    onUpdate(deltaTime, target) {}
    onDeactivate(target) {}
}
```

### ステップ2: 具体的なアビリティ実装

**ファイル: `js/systems/abilities/dash.js`**
```javascript
class DashAbility extends Ability {
    constructor() {
        super('Dash', 3, 0.5); // 3秒クールダウン、0.5秒持続
        this.speedMultiplier = 3;
        this.originalSpeed = 0;
    }
    
    onActivate(player) {
        this.originalSpeed = player.speed;
        player.speed *= this.speedMultiplier;
        player.invulnerable = true; // ダッシュ中は無敵
    }
    
    onDeactivate(player) {
        player.speed = this.originalSpeed;
        player.invulnerable = false;
    }
}
```

### ステップ3: プレイヤーへの統合

**ファイル: `js/player.js` に追加**
```javascript
class Player {
    constructor(maze) {
        // 既存のコード...
        this.abilities = {
            dash: new DashAbility(),
            invisibility: new InvisibilityAbility(),
            wallBreaker: new WallBreakerAbility()
        };
        this.invulnerable = false;
    }
    
    update(deltaTime) {
        // 既存の更新処理...
        
        // アビリティ更新
        Object.values(this.abilities).forEach(ability => {
            ability.update(deltaTime, this);
        });
    }
    
    useAbility(abilityName) {
        const ability = this.abilities[abilityName];
        if (ability) {
            return ability.activate(this);
        }
        return false;
    }
}
```

## 🧠 **Phase 3: AI学習システム実装**

### ステップ1: 学習データ構造

**ファイル: `js/ai/learning-data.js`**
```javascript
class LearningData {
    constructor() {
        this.patterns = [];
        this.maxPatterns = 100;
        this.weights = new Map();
    }
    
    recordPattern(playerPos, playerDir, ghostPos, result) {
        const pattern = {
            playerX: playerPos.x,
            playerY: playerPos.y,
            playerDirX: playerDir.x,
            playerDirY: playerDir.y,
            ghostX: ghostPos.x,
            ghostY: ghostPos.y,
            result: result, // 'success', 'failure', 'neutral'
            timestamp: Date.now()
        };
        
        this.patterns.push(pattern);
        
        // 古いパターンを削除
        if (this.patterns.length > this.maxPatterns) {
            this.patterns.shift();
        }
        
        this.updateWeights(pattern);
    }
    
    updateWeights(pattern) {
        const key = `${pattern.playerDirX},${pattern.playerDirY}`;
        
        if (!this.weights.has(key)) {
            this.weights.set(key, { success: 0, failure: 0, total: 0 });
        }
        
        const weight = this.weights.get(key);
        weight.total++;
        
        if (pattern.result === 'success') {
            weight.success++;
        } else if (pattern.result === 'failure') {
            weight.failure++;
        }
    }
    
    predictDirection(playerPos, playerDir) {
        // 最も成功率の高い方向を予測
        let bestDirection = { x: 0, y: -1 };
        let bestScore = -1;
        
        const directions = [
            { x: 0, y: -1 }, { x: 0, y: 1 },
            { x: -1, y: 0 }, { x: 1, y: 0 }
        ];
        
        directions.forEach(dir => {
            const key = `${dir.x},${dir.y}`;
            const weight = this.weights.get(key);
            
            if (weight && weight.total > 5) {
                const score = weight.success / weight.total;
                if (score > bestScore) {
                    bestScore = score;
                    bestDirection = dir;
                }
            }
        });
        
        return bestDirection;
    }
}
```

### ステップ2: 学習型ゴースト

**ファイル: `js/ai/smart-ghost.js`**
```javascript
class SmartGhost extends Ghost {
    constructor(x, y, color, maze, player) {
        super(x, y, color, maze, player);
        this.learningData = new LearningData();
        this.adaptationLevel = 1;
        this.lastPlayerPos = null;
        this.lastAction = null;
    }
    
    update(deltaTime) {
        const playerPos = this.player.getGridPosition();
        
        // 学習データ記録
        if (this.lastPlayerPos && this.lastAction) {
            const result = this.evaluateLastAction(playerPos);
            this.learningData.recordPattern(
                this.lastPlayerPos,
                this.player.currentDirection,
                { x: this.x, y: this.y },
                result
            );
        }
        
        // 既存の更新処理
        super.update(deltaTime);
        
        // 学習レベル上昇
        this.adaptationLevel += deltaTime * 0.001;
        
        // 前回の状態記録
        this.lastPlayerPos = { ...playerPos };
        this.lastAction = { ...this.direction };
    }
    
    evaluateLastAction(currentPlayerPos) {
        // プレイヤーに近づけたかで評価
        const prevDistance = this.getDistance(this.lastPlayerPos, {
            x: this.x - this.direction.x,
            y: this.y - this.direction.y
        });
        const currentDistance = this.getDistance(currentPlayerPos, {
            x: this.x, y: this.y
        });
        
        if (currentDistance < prevDistance) {
            return 'success';
        } else if (currentDistance > prevDistance) {
            return 'failure';
        }
        return 'neutral';
    }
    
    chooseDirection() {
        // 学習データに基づく方向予測を統合
        const predictedDirection = this.learningData.predictDirection(
            this.player.getGridPosition(),
            this.player.currentDirection
        );
        
        // 予測を考慮してターゲット位置を調整
        const playerPos = this.player.getGridPosition();
        this.target = {
            x: playerPos.x + predictedDirection.x * 2,
            y: playerPos.y + predictedDirection.y * 2
        };
        
        // 既存の方向選択処理を実行
        super.chooseDirection();
    }
    
    getDistance(pos1, pos2) {
        return Math.sqrt(
            Math.pow(pos1.x - pos2.x, 2) + 
            Math.pow(pos1.y - pos2.y, 2)
        );
    }
}
```

## 🎵 **Phase 4: アダプティブ音楽実装**

### ステップ1: 音楽管理クラス

**ファイル: `js/audio/adaptive-audio.js`**
```javascript
class AdaptiveAudio {
    constructor() {
        this.context = null;
        this.masterGain = null;
        this.musicLayers = {};
        this.currentIntensity = 0;
        this.targetIntensity = 0;
    }
    
    async init() {
        try {
            this.context = new (window.AudioContext || window.webkitAudioContext)();
            this.masterGain = this.context.createGain();
            this.masterGain.connect(this.context.destination);
            
            await this.loadMusicLayers();
        } catch (error) {
            console.error('Audio initialization failed:', error);
        }
    }
    
    async loadMusicLayers() {
        const layers = {
            ambient: 'assets/audio/ambient.mp3',
            tension: 'assets/audio/tension.mp3',
            chase: 'assets/audio/chase.mp3'
        };
        
        for (const [name, url] of Object.entries(layers)) {
            try {
                const response = await fetch(url);
                const arrayBuffer = await response.arrayBuffer();
                const audioBuffer = await this.context.decodeAudioData(arrayBuffer);
                
                this.musicLayers[name] = {
                    buffer: audioBuffer,
                    source: null,
                    gainNode: null,
                    playing: false
                };
            } catch (error) {
                console.warn(`Failed to load ${name}:`, error);
            }
        }
    }
    
    startMusic() {
        Object.entries(this.musicLayers).forEach(([name, layer]) => {
            if (!layer.playing) {
                this.playLayer(name);
            }
        });
    }
    
    playLayer(layerName) {
        const layer = this.musicLayers[layerName];
        if (!layer || layer.playing) return;
        
        layer.source = this.context.createBufferSource();
        layer.gainNode = this.context.createGain();
        
        layer.source.buffer = layer.buffer;
        layer.source.loop = true;
        layer.gainNode.gain.value = 0;
        
        layer.source.connect(layer.gainNode);
        layer.gainNode.connect(this.masterGain);
        
        layer.source.start(0);
        layer.playing = true;
    }
    
    updateIntensity(player, ghosts) {
        let newIntensity = 0;
        
        // プレイヤーと最も近いゴーストの距離を計算
        let minDistance = Infinity;
        ghosts.forEach(ghost => {
            if (ghost.mode !== 'dead') {
                const distance = Math.sqrt(
                    Math.pow(ghost.x - player.x, 2) + 
                    Math.pow(ghost.y - player.y, 2)
                );
                minDistance = Math.min(minDistance, distance);
            }
        });
        
        // 距離に基づいて緊張度設定
        if (minDistance < 2) newIntensity = 1.0;
        else if (minDistance < 4) newIntensity = 0.7;
        else if (minDistance < 6) newIntensity = 0.4;
        else newIntensity = 0.1;
        
        this.targetIntensity = newIntensity;
    }
    
    update(deltaTime) {
        // 緊張度の滑らかな遷移
        const diff = this.targetIntensity - this.currentIntensity;
        this.currentIntensity += diff * 2 * deltaTime;
        
        // 各レイヤーの音量調整
        this.setLayerVolume('ambient', Math.max(0, 0.3 - this.currentIntensity * 0.3));
        this.setLayerVolume('tension', this.currentIntensity * 0.5);
        this.setLayerVolume('chase', Math.max(0, (this.currentIntensity - 0.5) * 0.6));
    }
    
    setLayerVolume(layerName, volume) {
        const layer = this.musicLayers[layerName];
        if (layer && layer.gainNode) {
            layer.gainNode.gain.linearRampToValueAtTime(
                volume, 
                this.context.currentTime + 0.1
            );
        }
    }
}
```

## 🌐 **Phase 5: マルチプレイヤー実装**

### ステップ1: WebSocketサーバー (Node.js)

**ファイル: `server/server.js`**
```javascript
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

class GameServer {
    constructor() {
        this.players = new Map();
        this.gameState = {
            maze: null,
            ghosts: [],
            gameMode: 'competitive'
        };
        this.updateRate = 60; // 60 FPS
    }
    
    start() {
        io.on('connection', (socket) => {
            console.log('Player connected:', socket.id);
            
            // プレイヤー参加処理
            socket.on('join-game', (playerData) => {
                this.addPlayer(socket.id, playerData);
                socket.emit('player-joined', {
                    playerId: socket.id,
                    gameState: this.gameState
                });
                
                // 他のプレイヤーに通知
                socket.broadcast.emit('player-connected', {
                    playerId: socket.id,
                    playerData: this.players.get(socket.id)
                });
            });
            
            // プレイヤー移動
            socket.on('player-move', (moveData) => {
                this.updatePlayerPosition(socket.id, moveData);
            });
            
            // プレイヤー切断
            socket.on('disconnect', () => {
                this.removePlayer(socket.id);
                socket.broadcast.emit('player-disconnected', {
                    playerId: socket.id
                });
            });
        });
        
        // ゲームループ開始
        this.startGameLoop();
        
        server.listen(8080, () => {
            console.log('Game server running on port 8080');
        });
    }
    
    addPlayer(socketId, playerData) {
        this.players.set(socketId, {
            id: socketId,
            x: 13,
            y: 21,
            score: 0,
            lives: 3,
            ...playerData
        });
    }
    
    updatePlayerPosition(socketId, moveData) {
        const player = this.players.get(socketId);
        if (player) {
            player.x = moveData.x;
            player.y = moveData.y;
            player.direction = moveData.direction;
            
            // 位置更新を全プレイヤーに送信
            io.emit('player-update', {
                playerId: socketId,
                position: { x: player.x, y: player.y },
                direction: player.direction
            });
        }
    }
    
    startGameLoop() {
        setInterval(() => {
            this.updateGame();
        }, 1000 / this.updateRate);
    }
    
    updateGame() {
        // ゲーム状態更新
        // 衝突判定、スコア計算等
        
        // 必要に応じてクライアントに状態送信
        io.emit('game-update', {
            players: Array.from(this.players.values()),
            ghosts: this.gameState.ghosts
        });
    }
}

new GameServer().start();
```

### ステップ2: クライアント側マルチプレイヤー

**ファイル: `js/multiplayer/client.js`**
```javascript
class MultiplayerClient {
    constructor(game) {
        this.game = game;
        this.socket = null;
        this.playerId = null;
        this.otherPlayers = new Map();
        this.connected = false;
    }
    
    connect() {
        this.socket = io('http://localhost:8080');
        
        this.socket.on('connect', () => {
            console.log('Connected to server');
            this.connected = true;
            
            // ゲームに参加
            this.socket.emit('join-game', {
                name: 'Player' + Math.floor(Math.random() * 1000)
            });
        });
        
        this.socket.on('player-joined', (data) => {
            this.playerId = data.playerId;
            console.log('Joined as player:', this.playerId);
        });
        
        this.socket.on('player-connected', (data) => {
            this.addOtherPlayer(data.playerId, data.playerData);
        });
        
        this.socket.on('player-update', (data) => {
            this.updateOtherPlayer(data.playerId, data.position, data.direction);
        });
        
        this.socket.on('player-disconnected', (data) => {
            this.removeOtherPlayer(data.playerId);
        });
    }
    
    sendPlayerUpdate() {
        if (this.connected && this.game.player) {
            this.socket.emit('player-move', {
                x: this.game.player.x,
                y: this.game.player.y,
                direction: this.game.player.currentDirection
            });
        }
    }
    
    addOtherPlayer(playerId, playerData) {
        this.otherPlayers.set(playerId, new RemotePlayer(playerData));
    }
    
    updateOtherPlayer(playerId, position, direction) {
        const player = this.otherPlayers.get(playerId);
        if (player) {
            player.updatePosition(position, direction);
        }
    }
    
    removeOtherPlayer(playerId) {
        this.otherPlayers.delete(playerId);
    }
    
    render(ctx) {
        // 他のプレイヤーを描画
        this.otherPlayers.forEach(player => {
            player.render(ctx);
        });
    }
}

class RemotePlayer {
    constructor(data) {
        this.id = data.id;
        this.x = data.x;
        this.y = data.y;
        this.targetX = data.x;
        this.targetY = data.y;
        this.direction = { x: 0, y: 0 };
        this.interpolationSpeed = 10;
    }
    
    updatePosition(position, direction) {
        this.targetX = position.x;
        this.targetY = position.y;
        this.direction = direction;
    }
    
    update(deltaTime) {
        // スムーズな位置補間
        const dx = this.targetX - this.x;
        const dy = this.targetY - this.y;
        
        this.x += dx * this.interpolationSpeed * deltaTime;
        this.y += dy * this.interpolationSpeed * deltaTime;
    }
    
    render(ctx) {
        const tileSize = 20;
        const centerX = this.x * tileSize + tileSize / 2;
        const centerY = this.y * tileSize + tileSize / 2;
        const radius = tileSize / 2 - 2;
        
        // 他のプレイヤーを異なる色で描画
        ctx.fillStyle = '#00ff00'; // 緑色
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        ctx.fill();
        
        // プレイヤーIDを表示
        ctx.fillStyle = '#ffffff';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(this.id.substring(0, 6), centerX, centerY - radius - 5);
    }
}
```

## 📊 **実装進捗管理**

### 開発スケジュール例
```
Week 1-2: パーティクルシステム + UI改善
Week 3-4: アビリティシステム + 効果音
Week 5-6: AI学習システム + バランス調整
Week 7-8: アダプティブ音楽 + ライティング
Week 9-10: マルチプレイヤー基盤
Week 11-12: テスト + デバッグ + ポリッシュ
```

### Git管理のベストプラクティス
```bash
# フィーチャーブランチ作成
git checkout -b feature/particle-system

# 段階的コミット
git add js/effects/particle.js
git commit -m "Add basic Particle class"

git add js/effects/particle-system.js  
git commit -m "Add ParticleSystem manager"

git add js/game.js
git commit -m "Integrate particles into main game loop"

# マージ
git checkout main
git merge feature/particle-system
```

このガイドを参考に、段階的に機能を実装していってください。各フェーズの完了後は必ずテストを行い、次のフェーズに進むことをお勧めします。
