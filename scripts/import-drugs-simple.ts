#!/usr/bin/env node
/**
 * 薬剤データをdrugsテーブルに直接インポートするスクリプト
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

interface DrugData {
  name: string
}

async function processExcelFile(filePath: string): Promise<DrugData[]> {
  console.log(`\n📖 ファイルを処理中: ${path.basename(filePath)}`)
  
  try {
    await fs.access(filePath)
  } catch {
    console.error(`❌ ファイルが見つかりません: ${filePath}`)
    return []
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

  if (headerRowIndex === -1) {
    console.error('ヘッダー行が見つかりません')
    return []
  }

  const headers = jsonData[headerRowIndex]
  let nameIndex = -1
  
  // 薬剤名のカラムを探す
  headers.forEach((header, index) => {
    const headerStr = String(header).trim()
    if (headerStr.includes('薬価基準名') || headerStr.includes('品名')) {
      nameIndex = index
    }
  })

  if (nameIndex === -1) {
    console.error('薬剤名カラムが見つかりません')
    return []
  }

  const drugs: DrugData[] = []
  const uniqueNames = new Set<string>()

  // データ処理
  for (let i = headerRowIndex + 1; i < jsonData.length; i++) {
    const row = jsonData[i]
    if (!row || !row[nameIndex]) continue

    const fullName = String(row[nameIndex]).trim()
    if (!fullName || uniqueNames.has(fullName)) continue

    uniqueNames.add(fullName)

    drugs.push({
      name: fullName
    })
  }

  return drugs
}

async function main() {
  const filePaths = [
    '/Users/takuyakatou/Downloads/tp20250319-01_01.xlsx',
    '/Users/takuyakatou/Downloads/tp20250319-01_03.xlsx'
  ]

  try {
    console.log('🚀 薬剤データのインポートを開始します...')
    
    const allDrugs: DrugData[] = []
    
    for (const filePath of filePaths) {
      const drugs = await processExcelFile(filePath)
      allDrugs.push(...drugs)
    }

    console.log(`\n📊 ${allDrugs.length}件の薬剤データを処理中...`)

    // 既存データをクリア
    const { error: deleteError } = await supabase
      .from('drugs')
      .delete()
      .neq('id', 0) // 全レコード削除

    if (deleteError) {
      console.log('既存データのクリアをスキップ')
    }

    // バッチ処理でインポート
    const batchSize = 100
    let successCount = 0

    for (let i = 0; i < allDrugs.length; i += batchSize) {
      const batch = allDrugs.slice(i, i + batchSize)

      const { error } = await supabase
        .from('drugs')
        .insert(batch)

      if (!error) {
        successCount += batch.length
      } else {
        console.error('バッチエラー:', error)
      }

      process.stdout.write(`\r✅ 進捗: ${successCount}/${allDrugs.length} 件`)
    }

    console.log('\n✨ インポート完了！')
    
  } catch (error) {
    console.error('❌ エラー:', error)
    process.exit(1)
  }
}

if (require.main === module) {
  main()
}