#!/usr/bin/env node
/**
 * TypeScriptファイルにJSDocコメントを自動追加するスクリプト
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * JSDocテンプレートを生成
 * @param {string} functionName - 関数名
 * @param {string[]} params - パラメータ名の配列
 * @param {boolean} hasReturn - 戻り値があるか
 * @returns {string} JSDocコメント
 */
function generateJSDoc(functionName, params, hasReturn) {
	const lines = ['/**'];
	lines.push(` * ${functionName}の処理を実行`);

	if (params.length > 0) {
		params.forEach((param) => {
			lines.push(` * @param ${param} - ${param}の値`);
		});
	}

	if (hasReturn) {
		lines.push(` * @returns 処理結果`);
	}

	lines.push(' */');
	return lines.join('\n');
}

/**
 * TypeScriptファイルを処理してJSDocを追加
 * @param {string} filePath - ファイルパス
 */
function processFile(filePath) {
	if (!fs.existsSync(filePath)) {
		console.error(`File not found: ${filePath}`);
		return;
	}

	let content = fs.readFileSync(filePath, 'utf-8');
	let modified = false;

	// 関数定義のパターン（JSDocがない場合）
	const functionPattern =
		/^(?![\s]*\/\*\*)[\s]*(export\s+)?(async\s+)?function\s+(\w+)\s*\(([^)]*)\)([^{]*)\{/gm;
	const methodPattern = /^(?![\s]*\/\*\*)[\s]*(async\s+)?(\w+)\s*\(([^)]*)\)([^{]*)\{/gm;
	const arrowPattern =
		/^(?![\s]*\/\*\*)[\s]*(export\s+)?const\s+(\w+)\s*=\s*(async\s+)?\([^)]*\)\s*=>/gm;

	// 関数定義を処理
	content = content.replace(
		functionPattern,
		(match, exportKeyword, asyncKeyword, functionName, params, returnType) => {
			const paramList = params.trim()
				? params.split(',').map((p) => p.trim().split(':')[0].trim())
				: [];
			const hasReturn = !returnType.includes('void');
			const jsdoc = generateJSDoc(functionName, paramList, hasReturn);
			modified = true;
			const indent = match.match(/^[\s]*/)[0];
			return `${indent}${jsdoc}\n${match}`;
		}
	);

	if (modified) {
		fs.writeFileSync(filePath, content, 'utf-8');
		console.log(`✅ Added JSDoc to ${path.basename(filePath)}`);
	}
}

// コマンドライン引数からファイルパスを取得
const args = process.argv.slice(2);
if (args.length === 0) {
	console.log('Usage: node add-jsdoc.js <file1> [file2] ...');
	process.exit(1);
}

args.forEach(processFile);
