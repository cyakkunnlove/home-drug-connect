#!/usr/bin/env node
/**
 * 薬剤データを最適化するスクリプト
 * 後発品名から一般名を抽出し、効率的なデータ構造に変換
 */

import { createClient } from '@supabase/supabase-js'
import * as XLSX from 'xlsx'
import path from 'path'
import fs from 'fs/promises'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// 最適化された薬剤データ構造
interface OptimizedDrug {
  // 一般名（メーカー名を除いた名前）
  generic_name: string
  // 成分名
  ingredient_name?: string
  // 規格
  standard?: string
  // 剤形
  dosage_form?: string
  // 先発品名（ある場合）
  brand_name?: string
  // 先発品メーカー
  brand_manufacturer?: string
  // 後発品メーカーリスト
  generic_manufacturers?: string[]
  // 検索用カナ
  name_kana?: string
  // 分類
  category?: string
}

/**
 * 後発品名から一般名を抽出
 * 例: "アムロジピン錠5mg「サワイ」" → "アムロジピン錠5mg"
 */
function extractGenericName(drugName: string): { genericName: string, manufacturer?: string } {
  // パターン1: 「メーカー名」形式
  const pattern1 = /^(.+?)「([^」]+)」$/
  const match1 = drugName.match(pattern1)
  if (match1) {
    return {
      genericName: match1[1].trim(),
      manufacturer: match1[2].trim()
    }
  }

  // パターン2: （メーカー名）形式
  const pattern2 = /^(.+?)（([^）]+)）$/
  const match2 = drugName.match(pattern2)
  if (match2 && match2[2].length <= 10) { // メーカー名は通常短い
    return {
      genericName: match2[1].trim(),
      manufacturer: match2[2].trim()
    }
  }

  // パターンに一致しない場合はそのまま返す
  return { genericName: drugName }
}

/**
 * 剤形と規格を分離
 * 例: "アムロジピン錠5mg" → { base: "アムロジピン", form: "錠", standard: "5mg" }
 */
function parseDrugName(genericName: string): {
  baseName: string
  dosageForm?: string
  standard?: string
} {
  // 剤形のパターン
  const formPatterns = [
    '錠', 'カプセル', '散', '顆粒', '細粒', 'シロップ', '液',
    '注射', '注', '点眼', '点鼻', '吸入', '貼付', '軟膏', 'クリーム',
    'ゲル', 'ローション', '坐剤', 'テープ', 'パッチ', 'OD錠'
  ]

  let baseName = genericName
  let dosageForm: string | undefined
  let standard: string | undefined

  // 剤形を検出
  for (const form of formPatterns) {
    const formIndex = genericName.indexOf(form)
    if (formIndex !== -1) {
      baseName = genericName.substring(0, formIndex).trim()
      dosageForm = form
      
      // 規格を検出（剤形の後の部分）
      const afterForm = genericName.substring(formIndex + form.length).trim()
      if (afterForm) {
        standard = afterForm
      }
      break
    }
  }

  // 規格のみのパターン（mg、mL等）
  if (!standard) {
    const standardMatch = genericName.match(/(\d+\.?\d*)(mg|g|mL|L|μg|単位|万単位|%)/i)
    if (standardMatch) {
      standard = standardMatch[0]
      baseName = genericName.replace(standard, '').trim()
    }
  }

  return { baseName, dosageForm, standard }
}

/**
 * Excelから薬剤データを抽出して最適化
 */
async function processExcelFiles(filePaths: string[]): Promise<Map<string, OptimizedDrug>> {
  const drugMap = new Map<string, OptimizedDrug>()
  
  for (const filePath of filePaths) {
    console.log(`\n📖 ファイルを処理中: ${path.basename(filePath)}`)
    
    try {
      await fs.access(filePath)
    } catch {
      console.error(`❌ ファイルが見つかりません: ${filePath}`)
      continue
    }

    const workbook = XLSX.readFile(filePath)
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][]

    // ヘッダー行を探す
    let headerRowIndex = -1
    for (let i = 0; i < Math.min(jsonData.length, 20); i++) {
      const row = jsonData[i]
      if (!row) continue
      
      const rowStr = row.join(',').toLowerCase()
      if (rowStr.includes('医薬品コード') || rowStr.includes('薬価基準名')) {
        headerRowIndex = i
        break
      }
    }

    if (headerRowIndex === -1) continue

    const headers = jsonData[headerRowIndex]
    const columnMap: { [key: string]: number } = {}
    
    // カラムマッピング
    headers.forEach((header, index) => {
      const headerStr = String(header).trim()
      if (headerStr.includes('薬価基準名') || headerStr.includes('品名')) {
        columnMap.name = index
      } else if (headerStr.includes('成分名')) {
        columnMap.ingredient = index
      } else if (headerStr.includes('規格')) {
        columnMap.standard = index
      } else if (headerStr.includes('メーカー') || headerStr.includes('製造')) {
        columnMap.manufacturer = index
      } else if (headerStr.includes('先発')) {
        columnMap.isBrand = index
      }
    })

    // データ処理
    for (let i = headerRowIndex + 1; i < jsonData.length; i++) {
      const row = jsonData[i]
      if (!row || !row[columnMap.name]) continue

      const fullName = String(row[columnMap.name]).trim()
      const ingredientName = row[columnMap.ingredient] ? String(row[columnMap.ingredient]).trim() : undefined
      const manufacturer = row[columnMap.manufacturer] ? String(row[columnMap.manufacturer]).trim() : undefined
      
      // 一般名とメーカーを分離
      const { genericName, manufacturer: extractedManufacturer } = extractGenericName(fullName)
      const finalManufacturer = extractedManufacturer || manufacturer

      // 剤形と規格を分離
      const { baseName, dosageForm, standard } = parseDrugName(genericName)

      // キーは一般名（メーカー名を除いた名前）
      const key = genericName

      if (!drugMap.has(key)) {
        drugMap.set(key, {
          generic_name: genericName,
          ingredient_name: ingredientName || baseName,
          dosage_form: dosageForm,
          standard: standard,
          generic_manufacturers: []
        })
      }

      const drug = drugMap.get(key)!

      // 先発品かジェネリックかを判定
      const isBrand = !fullName.includes('「') && !fullName.includes('（')
      
      if (isBrand && finalManufacturer) {
        drug.brand_name = fullName
        drug.brand_manufacturer = finalManufacturer
      } else if (finalManufacturer && !drug.generic_manufacturers?.includes(finalManufacturer)) {
        drug.generic_manufacturers!.push(finalManufacturer)
      }
    }
  }

  return drugMap
}

/**
 * 最適化されたデータ構造でデータベースを更新
 */
async function updateOptimizedDatabase(drugMap: Map<string, OptimizedDrug>): Promise<void> {
  console.log(`\n📊 最適化されたデータをデータベースに登録中...`)
  console.log(`   元のデータ数: 推定 ${drugMap.size * 10}件以上`)
  console.log(`   最適化後: ${drugMap.size}件`)

  // 新しいテーブル構造を作成
  const { error: createTableError } = await supabase.rpc('exec_sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS drugs_optimized (
        id SERIAL PRIMARY KEY,
        generic_name VARCHAR NOT NULL UNIQUE,
        ingredient_name VARCHAR,
        dosage_form VARCHAR,
        standard VARCHAR,
        brand_name VARCHAR,
        brand_manufacturer VARCHAR,
        generic_manufacturers TEXT[],
        name_kana VARCHAR,
        category VARCHAR,
        search_vector tsvector,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
      
      -- 全文検索用インデックス
      CREATE INDEX IF NOT EXISTS idx_drugs_search_vector ON drugs_optimized USING GIN (search_vector);
      CREATE INDEX IF NOT EXISTS idx_drugs_generic_name ON drugs_optimized (generic_name);
      CREATE INDEX IF NOT EXISTS idx_drugs_ingredient ON drugs_optimized (ingredient_name);
    `
  })

  if (createTableError) {
    console.error('テーブル作成エラー:', createTableError)
  }

  // バッチ処理でインポート
  const drugs = Array.from(drugMap.values())
  const batchSize = 100
  let successCount = 0

  for (let i = 0; i < drugs.length; i += batchSize) {
    const batch = drugs.slice(i, i + batchSize).map(drug => ({
      ...drug,
      search_vector: `${drug.generic_name} ${drug.ingredient_name || ''} ${drug.brand_name || ''}`
    }))

    const { error } = await supabase
      .from('drugs_optimized')
      .upsert(batch, { onConflict: 'generic_name' })

    if (!error) {
      successCount += batch.length
    }

    process.stdout.write(`\r✅ 進捗: ${successCount}/${drugs.length} 件`)
  }

  console.log('\n✅ 最適化完了！')
}

/**
 * 統計情報を表示
 */
function showStatistics(drugMap: Map<string, OptimizedDrug>): void {
  const drugs = Array.from(drugMap.values())
  
  const withBrand = drugs.filter(d => d.brand_name).length
  const genericOnly = drugs.filter(d => !d.brand_name && d.generic_manufacturers && d.generic_manufacturers.length > 0).length
  const avgManufacturers = drugs.reduce((sum, d) => sum + (d.generic_manufacturers?.length || 0), 0) / drugs.length

  console.log('\n📊 統計情報:')
  console.log(`   総薬剤数: ${drugs.length}件`)
  console.log(`   先発品あり: ${withBrand}件`)
  console.log(`   後発品のみ: ${genericOnly}件`)
  console.log(`   平均後発品メーカー数: ${avgManufacturers.toFixed(1)}社`)
  console.log(`   データ削減率: 約${(1 - 1 / avgManufacturers) * 100}%`)
}

/**
 * メイン処理
 */
async function main() {
  const args = process.argv.slice(2)
  
  if (args.length === 0) {
    console.log('使用方法: npx tsx scripts/optimize-drug-data.ts <Excelファイル1> [Excelファイル2...]')
    process.exit(1)
  }

  try {
    console.log('🚀 薬剤データの最適化を開始します...')
    
    // Excelファイルを処理
    const drugMap = await processExcelFiles(args)
    
    // 統計情報を表示
    showStatistics(drugMap)
    
    // データベースを更新
    await updateOptimizedDatabase(drugMap)
    
    console.log('\n✨ 最適化が完了しました！')
    
  } catch (error) {
    console.error('❌ エラー:', error)
    process.exit(1)
  }
}

if (require.main === module) {
  main()
}