// メインエントリーポイント
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM読み込み完了');
    
    // キャンバス要素の存在確認
    const canvas = document.getElementById('gameCanvas');
    if (!canvas) {
        console.error('キャンバス要素が見つかりません');
        return;
    }
    console.log('キャンバス要素が見つかりました:', canvas);
    
    // ゲームインスタンスを作成
    try {
        const game = new Game();
        console.log('ゲームインスタンス作成成功');
        
        // ゲーム開始
        game.start();
        console.log('ゲーム開始成功');
    } catch (error) {
        console.error('ゲーム初期化エラー:', error);
    }
    
    console.log('パックマンゲームが開始されました！');
    console.log('操作方法:');
    console.log('- 矢印キーまたはWASDで移動');
    console.log('- スペースキーでポーズ/再開');
    console.log('- F5でゲームリスタート');
});
