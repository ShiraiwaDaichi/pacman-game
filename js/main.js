// メインエントリーポイント
document.addEventListener('DOMContentLoaded', () => {
    // ゲームインスタンスを作成
    const game = new Game();
    
    // ゲーム開始
    game.start();
    
    console.log('パックマンゲームが開始されました！');
    console.log('操作方法:');
    console.log('- 矢印キーまたはWASDで移動');
    console.log('- スペースキーでポーズ/再開');
    console.log('- F5でゲームリスタート');
});
