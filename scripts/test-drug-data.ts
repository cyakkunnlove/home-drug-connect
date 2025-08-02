#!/usr/bin/env node
/**
 * テスト用の薬剤データを生成してJSONファイルを作成
 */

import fs from 'fs/promises'
import path from 'path'

// テスト用の薬剤データ（実際のデータ構造を模倣）
const testDrugs = [
  // 先発品
  { id: 1, n: "アムロジピン", b: "ノルバスク錠", f: "錠", s: "5mg" },
  { id: 2, n: "オメプラゾール", b: "オメプラール錠", f: "錠", s: "20mg" },
  { id: 3, n: "ロスバスタチン", b: "クレストール錠", f: "錠", s: "2.5mg" },
  
  // ジェネリック
  { id: 4, n: "アムロジピン", g: ["サワイ", "日医工", "トーワ"], f: "錠", s: "5mg" },
  { id: 5, n: "オメプラゾール", g: ["サワイ", "日医工"], f: "錠", s: "20mg" },
  { id: 6, n: "ロスバスタチン", g: ["サワイ", "トーワ"], f: "錠", s: "2.5mg" },
  
  // その他の薬剤
  { id: 7, n: "ムコダイン", b: "ムコダイン錠", f: "錠", s: "250mg" },
  { id: 8, n: "メチコバール", b: "メチコバール錠", f: "錠", s: "500μg" },
  { id: 9, n: "ロキソプロフェン", b: "ロキソニン錠", f: "錠", s: "60mg" },
  { id: 10, n: "アセトアミノフェン", b: "カロナール錠", f: "錠", s: "200mg" },
]

async function generateTestJSON() {
  console.log('🚀 テスト用薬剤JSONファイルの生成を開始...')
  
  const publicDir = path.join(process.cwd(), 'public', 'data')
  await fs.mkdir(publicDir, { recursive: true })
  
  // 1. 完全版
  const fullPath = path.join(publicDir, 'drugs-full.json')
  await fs.writeFile(fullPath, JSON.stringify(testDrugs))
  
  const fullStats = await fs.stat(fullPath)
  console.log(`📁 完全版: ${(fullStats.size / 1024).toFixed(1)}KB`)
  
  // 2. 頻出薬剤版
  const commonDrugs = testDrugs.slice(0, 5)
  const commonPath = path.join(publicDir, 'drugs-common.json')
  await fs.writeFile(commonPath, JSON.stringify(commonDrugs))
  
  const commonStats = await fs.stat(commonPath)
  console.log(`📁 頻出版: ${(commonStats.size / 1024).toFixed(1)}KB`)
  
  // 3. インデックス
  const indexData = testDrugs.map(d => d.n)
  const indexPath = path.join(publicDir, 'drugs-index.json')
  await fs.writeFile(indexPath, JSON.stringify(indexData))
  
  const indexStats = await fs.stat(indexPath)
  console.log(`📁 インデックス: ${(indexStats.size / 1024).toFixed(1)}KB`)
  
  console.log('✅ テストJSONファイル生成完了！')
}

if (require.main === module) {
  generateTestJSON()
}