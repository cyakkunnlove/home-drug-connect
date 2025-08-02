#!/usr/bin/env node
/**
 * 厚生労働省の薬価基準収載医薬品Excelファイルを処理するスクリプト
 */

import { createClient } from '@supabase/supabase-js'
import * as XLSX from 'xlsx'
import path from 'path'
import fs from 'fs/promises'
import dotenv from 'dotenv'

// 環境変数の読み込み
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

interface DrugData {
  code: string
  name: string
  name_kana: string
  type: 'generic' | 'brand'
  manufacturer: string
  dosage_form?: string
  standard?: string
  unit?: string
}

/**
 * Excelファイルから薬剤データを抽出
 */
async function extractDrugDataFromExcel(filePath: string): Promise<DrugData[]> {
  console.log(`📖 Excelファイルを読み込み中: ${path.basename(filePath)}`)
  
  // Excelファイルの読み込み
  const workbook = XLSX.readFile(filePath)
  const sheetName = workbook.SheetNames[0]
  const worksheet = workbook.Sheets[sheetName]
  
  // データをJSONに変換
  const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][]
  
  // ヘッダー行を探す（薬価基準収載医薬品の列名を含む行）
  let headerRowIndex = -1
  const expectedHeaders = ['医薬品コード', '薬価基準名', '成分名', '規格単位', '薬価', '製造会社']
  
  for (let i = 0; i < Math.min(jsonData.length, 20); i++) {
    const row = jsonData[i]
    if (!row) continue
    
    const rowStr = row.join(',').toLowerCase()
    if (rowStr.includes('医薬品コード') || rowStr.includes('薬価基準名')) {
      headerRowIndex = i
      break
    }
  }
  
  if (headerRowIndex === -1) {
    console.log('⚠️  ヘッダー行が見つかりません。最初の行をヘッダーとして使用します。')
    headerRowIndex = 0
  }
  
  const headers = jsonData[headerRowIndex]
  console.log('📋 検出されたヘッダー:', headers.slice(0, 10))
  
  // カラムインデックスのマッピング
  const columnMap: { [key: string]: number } = {}
  headers.forEach((header, index) => {
    const headerStr = String(header).trim()
    if (headerStr.includes('医薬品コード') || headerStr.includes('コード')) {
      columnMap.code = index
    } else if (headerStr.includes('薬価基準名') || headerStr.includes('品名')) {
      columnMap.name = index
    } else if (headerStr.includes('成分名')) {
      columnMap.ingredient = index
    } else if (headerStr.includes('規格単位') || headerStr.includes('規格')) {
      columnMap.standard = index
    } else if (headerStr.includes('メーカー') || headerStr.includes('製造会社') || headerStr.includes('会社名')) {
      columnMap.manufacturer = index
    } else if (headerStr.includes('先発') || headerStr.includes('後発')) {
      columnMap.genericFlag = index
    }
  })
  
  console.log('📍 カラムマッピング:', columnMap)
  
  // データの抽出
  const drugs: DrugData[] = []
  const dataStartRow = headerRowIndex + 1
  
  for (let i = dataStartRow; i < jsonData.length; i++) {
    const row = jsonData[i]
    if (!row || !row[columnMap.code]) continue
    
    try {
      const code = String(row[columnMap.code] || '').trim()
      const name = String(row[columnMap.name] || '').trim()
      const manufacturer = String(row[columnMap.manufacturer] || '').trim()
      
      // 空のデータはスキップ
      if (!code || !name) continue
      
      // ジェネリック判定（名前に「後発」が含まれる、または製造元が特定のジェネリックメーカー）
      const isGeneric = name.includes('「') && name.includes('」') && 
                       !name.includes('先発')
      
      // カナ名の生成（簡易版）
      const name_kana = convertToKana(name)
      
      // 剤形の抽出
      const dosage_form = extractDosageForm(name)
      
      const drug: DrugData = {
        code,
        name,
        name_kana,
        type: isGeneric ? 'generic' : 'brand',
        manufacturer,
        dosage_form,
        standard: row[columnMap.standard] ? String(row[columnMap.standard]).trim() : undefined
      }
      
      drugs.push(drug)
    } catch (error) {
      console.error(`行 ${i + 1} の処理エラー:`, error)
    }
  }
  
  console.log(`✅ ${drugs.length}件の薬剤データを抽出しました`)
  return drugs
}

/**
 * 剤形を抽出
 */
function extractDosageForm(name: string): string {
  const forms = [
    '錠', 'カプセル', '散', '顆粒', '細粒', 'シロップ', '液', 
    '注射', '点眼', '点鼻', '吸入', '貼付', '軟膏', 'クリーム',
    'ゲル', 'ローション', '坐剤', 'テープ', 'パッチ'
  ]
  
  for (const form of forms) {
    if (name.includes(form)) {
      return form
    }
  }
  
  return '錠剤' // デフォルト
}

/**
 * カナ変換（簡易版）
 */
function convertToKana(name: string): string {
  // 実際の実装では、より高度な変換ロジックが必要
  return name
    .replace(/[ァ-ヶー]/g, '') // カタカナを除去
    .replace(/[「」（）]/g, '') // 括弧を除去
    .toUpperCase()
}

/**
 * データベースへのインポート
 */
async function importToDatabase(drugs: DrugData[]): Promise<void> {
  console.log(`\n📊 ${drugs.length}件の薬剤データをデータベースに登録中...`)
  
  // 重複を除去（コードでユニーク）
  const uniqueDrugs = new Map<string, DrugData>()
  drugs.forEach(drug => {
    if (!uniqueDrugs.has(drug.code) || drug.type === 'brand') {
      uniqueDrugs.set(drug.code, drug)
    }
  })
  
  const uniqueDrugArray = Array.from(uniqueDrugs.values())
  console.log(`🔍 重複除去後: ${uniqueDrugArray.length}件`)
  
  // バッチ処理でインポート
  const batchSize = 500
  let successCount = 0
  let errorCount = 0
  
  for (let i = 0; i < uniqueDrugArray.length; i += batchSize) {
    const batch = uniqueDrugArray.slice(i, i + batchSize)
    
    try {
      const { error } = await supabase
        .from('drugs')
        .upsert(batch, { onConflict: 'code' })
      
      if (error) {
        console.error(`バッチ ${Math.floor(i / batchSize) + 1} のエラー:`, error)
        errorCount += batch.length
      } else {
        successCount += batch.length
      }
    } catch (err) {
      console.error(`バッチ処理エラー:`, err)
      errorCount += batch.length
    }
    
    process.stdout.write(`\r✅ 進捗: ${successCount + errorCount}/${uniqueDrugArray.length} 件 (成功: ${successCount}, エラー: ${errorCount})`)
  }
  
  console.log('\n✅ インポート完了！')
  console.log(`   成功: ${successCount}件`)
  console.log(`   エラー: ${errorCount}件`)
}

/**
 * メイン処理
 */
async function main() {
  const args = process.argv.slice(2)
  
  if (args.length === 0) {
    console.log('使用方法: npx tsx scripts/process-mhlw-excel.ts <Excelファイルパス> [追加のExcelファイル...]')
    console.log('例: npx tsx scripts/process-mhlw-excel.ts ~/Downloads/tp20250319-01_01.xlsx ~/Downloads/tp20250319-01_03.xlsx')
    process.exit(1)
  }
  
  const startTime = Date.now()
  
  try {
    console.log('🚀 薬価データのインポートを開始します...\n')
    
    let allDrugs: DrugData[] = []
    
    // 各Excelファイルを処理
    for (const filePath of args) {
      // ファイルの存在確認
      try {
        await fs.access(filePath)
      } catch {
        console.error(`❌ ファイルが見つかりません: ${filePath}`)
        continue
      }
      
      const drugs = await extractDrugDataFromExcel(filePath)
      allDrugs = allDrugs.concat(drugs)
      console.log(`\n`)
    }
    
    console.log(`\n📋 合計 ${allDrugs.length}件の薬剤データを処理します`)
    
    if (allDrugs.length > 0) {
      // データベースへのインポート
      await importToDatabase(allDrugs)
      
      // 統計情報の表示
      const genericCount = allDrugs.filter(d => d.type === 'generic').length
      const brandCount = allDrugs.filter(d => d.type === 'brand').length
      
      console.log('\n📊 統計情報:')
      console.log(`   先発品: ${brandCount}件`)
      console.log(`   後発品: ${genericCount}件`)
      console.log(`   製造元数: ${new Set(allDrugs.map(d => d.manufacturer)).size}社`)
    }
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(1)
    console.log(`\n✨ 処理完了！ 処理時間: ${duration}秒`)
    
  } catch (error) {
    console.error('\n❌ エラーが発生しました:', error)
    process.exit(1)
  }
}

// 直接実行された場合
if (require.main === module) {
  main()
}

export { main as processMHLWExcel }