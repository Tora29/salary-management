#!/bin/bash

echo "🚀 全TypeScriptファイルにJSDocを追加します..."
echo ""

# カウンター
processed=0
skipped=0

# 対象ファイルを検索（.ts, .tsx, .svelte.ts）
files=$(find src -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.svelte.ts" \) | grep -v node_modules | grep -v ".svelte-kit")

# ファイル総数
total=$(echo "$files" | wc -l | tr -d ' ')
echo "📊 対象ファイル数: $total"
echo ""

# 各ファイルを処理
for file in $files; do
    echo "📝 処理中: $file"
    
    # JSDoc追加スクリプトを実行
    if npm run add-jsdoc "$file" 2>/dev/null | grep -q "Added JSDoc"; then
        echo "   ✅ JSDoc追加完了"
        ((processed++))
    else
        echo "   ⏭️  スキップ（JSDoc既存 or 対象外）"
        ((skipped++))
    fi
done

echo ""
echo "========================================="
echo "✨ 処理完了！"
echo "   - 処理済み: $processed ファイル"
echo "   - スキップ: $skipped ファイル"
echo "   - 合計: $total ファイル"
echo "========================================="
echo ""
echo "次のステップ:"
echo "1. npm run format  # コードフォーマット"
echo "2. npm run lint    # ESLintチェック"