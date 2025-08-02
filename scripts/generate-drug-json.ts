#!/usr/bin/env node
/**
 * データベースから静的JSONファイルを生成
 * ビルド時に実行して、クライアントサイドで高速検索を実現
 */

import { createClient } from '@supabase/supabase-js'
import fs from 'fs/promises'
import path from 'path'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

interface DrugData {
  id: number
  n: string  // name (短縮)
  b?: string // brand_name
  g?: string[] // generic_manufacturers
  f?: string // dosage_form
  s?: string // standard
}

async function generateDrugJSON() {
  console.log('🚀 薬剤JSONファイルの生成を開始...')
  
  try {
    // 既存のdrugsテーブルから薬剤データを取得
    console.log('drugsテーブルから薬剤データを取得中...')
    
    const { data: allDrugs, error: drugsError } = await supabase
      .from('drugs')
      .select('*')
      .order('name')
    
    if (drugsError) throw drugsError
    
    if (!allDrugs || allDrugs.length === 0) {
      console.log('薬剤データが見つかりません')
      return
    }
    
    console.log(`${allDrugs.length}件の薬剤データを処理中...`)
    
    // 薬剤データを一般名でグループ化して最適化
    const drugMap = new Map<string, CompressedDrug>()
    
    allDrugs.forEach(drug => {
      // ジェネリック薬剤名とメーカー名を分離
      const genericMatch = drug.name.match(/^(.+?)「([^」]+)」$/)
      
      if (genericMatch) {
        // ジェネリック薬剤
        const genericName = genericMatch[1].trim()
        const manufacturer = genericMatch[2].trim()
        
        if (drugMap.has(genericName)) {
          const existing = drugMap.get(genericName)!
          if (!existing.g) existing.g = []
          if (!existing.g.includes(manufacturer)) {
            existing.g.push(manufacturer)
          }
        } else {
          drugMap.set(genericName, {
            id: drug.id,
            n: genericName,
            g: [manufacturer],
            f: drug.form || undefined,
            s: drug.standard || undefined
          })
        }
      } else {
        // 先発品または一般的な薬剤名
        const existingGeneric = drugMap.get(drug.name)
        if (!existingGeneric) {
          drugMap.set(drug.name, {
            id: drug.id,
            n: drug.name,
            b: drug.name, // 先発品名として扱う
            f: drug.form || undefined,
            s: drug.standard || undefined
          })
        }
      }
    })
    
    const compressedData = Array.from(drugMap.values())
      .sort((a, b) => a.n.localeCompare(b.n, 'ja'))
    
    console.log(`最適化後: ${compressedData.length}件の薬剤データ`)
    
    await saveJSONFiles(compressedData)
    
    console.log('✅ JSONファイル生成完了！')
    
  } catch (error) {
    console.error('❌ エラー:', error)
    process.exit(1)
  }
}

async function saveJSONFiles(data: DrugData[]) {
  const publicDir = path.join(process.cwd(), 'public', 'data')
  await fs.mkdir(publicDir, { recursive: true })
  
  // 1. 完全版（検索用）
  const fullPath = path.join(publicDir, 'drugs-full.json')
  await fs.writeFile(fullPath, JSON.stringify(data))
  
  const fullStats = await fs.stat(fullPath)
  console.log(`📁 完全版: ${(fullStats.size / 1024).toFixed(1)}KB`)
  
  // 2. 頻出薬剤版（初期ロード用）
  const commonDrugs = data.slice(0, 200)
  const commonPath = path.join(publicDir, 'drugs-common.json')
  await fs.writeFile(commonPath, JSON.stringify(commonDrugs))
  
  const commonStats = await fs.stat(commonPath)
  console.log(`📁 頻出版: ${(commonStats.size / 1024).toFixed(1)}KB`)
  
  // 3. インデックスファイル（薬剤名のみ）
  const indexData = data.map(d => d.n)
  const indexPath = path.join(publicDir, 'drugs-index.json')
  await fs.writeFile(indexPath, JSON.stringify(indexData))
  
  const indexStats = await fs.stat(indexPath)
  console.log(`📁 インデックス: ${(indexStats.size / 1024).toFixed(1)}KB`)
}

if (require.main === module) {
  generateDrugJSON()
}