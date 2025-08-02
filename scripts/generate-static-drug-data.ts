#!/usr/bin/env node
/**
 * ExcelファイルからJSONファイルを直接生成
 * ビルド時に実行して、静的ファイルとしてデプロイ
 */

import * as XLSX from 'xlsx'
import fs from 'fs/promises'
import path from 'path'

interface DrugData {
  id: number
  n: string  // name
  b?: string // brand_name
  g?: string[] // generic_manufacturers
  f?: string // form
  s?: string // standard
}

async function processExcelFiles() {
  const filePaths = [
    '/Users/takuyakatou/Downloads/tp20250319-01_01.xlsx',
    '/Users/takuyakatou/Downloads/tp20250319-01_03.xlsx'
  ]
  
  const allDrugs: Map<string, DrugData> = new Map()
  let idCounter = 1

  for (const filePath of filePaths) {
    try {
      await fs.access(filePath)
      console.log(`📖 処理中: ${path.basename(filePath)}`)
      
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
      let nameIndex = -1
      
      headers.forEach((header, index) => {
        const headerStr = String(header).trim()
        if (headerStr.includes('薬価基準名') || headerStr.includes('品名')) {
          nameIndex = index
        }
      })

      if (nameIndex === -1) continue

      // データ処理
      for (let i = headerRowIndex + 1; i < jsonData.length; i++) {
        const row = jsonData[i]
        if (!row || !row[nameIndex]) continue

        const fullName = String(row[nameIndex]).trim()
        if (!fullName) continue

        // ジェネリック薬剤名とメーカー名を分離
        const genericMatch = fullName.match(/^(.+?)「([^」]+)」$/)
        
        if (genericMatch) {
          // ジェネリック薬剤
          const genericName = genericMatch[1].trim()
          const manufacturer = genericMatch[2].trim()
          
          if (allDrugs.has(genericName)) {
            const existing = allDrugs.get(genericName)!
            if (!existing.g) existing.g = []
            if (!existing.g.includes(manufacturer)) {
              existing.g.push(manufacturer)
            }
          } else {
            // 剤形と規格を抽出
            const { form, standard } = extractFormAndStandard(genericName)
            
            allDrugs.set(genericName, {
              id: idCounter++,
              n: genericName,
              g: [manufacturer],
              f: form,
              s: standard
            })
          }
        } else {
          // 先発品
          if (!allDrugs.has(fullName)) {
            const { form, standard } = extractFormAndStandard(fullName)
            
            allDrugs.set(fullName, {
              id: idCounter++,
              n: fullName.replace(/錠.*$/, '').trim(),
              b: fullName,
              f: form,
              s: standard
            })
          }
        }
      }
    } catch (error) {
      console.error(`⚠️ ファイル処理エラー: ${filePath}`, error)
    }
  }

  return Array.from(allDrugs.values())
}

function extractFormAndStandard(name: string): { form?: string, standard?: string } {
  let form: string | undefined
  let standard: string | undefined

  const formPatterns = [
    '錠', 'カプセル', '散', '顆粒', '細粒', 'シロップ', '液',
    '注射', '注', '点眼', '点鼻', '吸入', '貼付', '軟膏', 'クリーム',
    'ゲル', 'ローション', '坐剤', 'テープ', 'パッチ', 'OD錠'
  ]

  for (const pattern of formPatterns) {
    if (name.includes(pattern)) {
      form = pattern
      break
    }
  }

  const standardMatch = name.match(/(\d+\.?\d*)(mg|g|mL|L|μg|単位|万単位|%)/i)
  if (standardMatch) {
    standard = standardMatch[0]
  }

  return { form, standard }
}

async function generateStaticJSON() {
  console.log('🚀 静的薬剤データの生成を開始...')
  
  try {
    const drugs = await processExcelFiles()
    console.log(`📊 ${drugs.length}件の薬剤データを処理`)
    
    const publicDir = path.join(process.cwd(), 'public', 'data')
    await fs.mkdir(publicDir, { recursive: true })
    
    // 1. 完全版
    const fullPath = path.join(publicDir, 'drugs-full.json')
    await fs.writeFile(fullPath, JSON.stringify(drugs))
    
    const fullStats = await fs.stat(fullPath)
    console.log(`📁 完全版: ${(fullStats.size / 1024).toFixed(1)}KB`)
    
    // 2. 頻出薬剤版（先頭200件）
    const commonDrugs = drugs.slice(0, 200)
    const commonPath = path.join(publicDir, 'drugs-common.json')
    await fs.writeFile(commonPath, JSON.stringify(commonDrugs))
    
    const commonStats = await fs.stat(commonPath)
    console.log(`📁 頻出版: ${(commonStats.size / 1024).toFixed(1)}KB`)
    
    // 3. インデックス
    const indexData = drugs.map(d => d.n)
    const indexPath = path.join(publicDir, 'drugs-index.json')
    await fs.writeFile(indexPath, JSON.stringify(indexData))
    
    const indexStats = await fs.stat(indexPath)
    console.log(`📁 インデックス: ${(indexStats.size / 1024).toFixed(1)}KB`)
    
    console.log('✅ 静的JSONファイル生成完了！')
    
  } catch (error) {
    console.error('❌ エラー:', error)
    process.exit(1)
  }
}

if (require.main === module) {
  generateStaticJSON()
}