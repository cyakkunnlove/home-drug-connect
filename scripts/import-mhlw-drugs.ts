#!/usr/bin/env node
/**
 * 厚生労働省の薬価基準収載医薬品データをインポートするスクリプト
 * 
 * データソース:
 * - 薬価基準収載医薬品コード表（厚生労働省）
 * - https://www.mhlw.go.jp/topics/2021/04/tp20210401-01.html
 */

import { createClient } from '@supabase/supabase-js'
import { parse } from 'csv-parse'
import { createReadStream, createWriteStream } from 'fs'
import { pipeline } from 'stream/promises'
import fetch from 'node-fetch'
import path from 'path'
import dotenv from 'dotenv'

// 環境変数の読み込み
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

interface MHLWDrugData {
  code: string              // 医薬品コード
  name: string              // 医薬品名
  name_kana: string         // 医薬品名（カナ）
  dosage_form: string       // 剤形
  standard: string          // 規格
  manufacturer: string      // 製造販売業者
  generic_flag: string      // 後発品フラグ
}

interface DrugRecord {
  code: string
  name: string
  name_kana: string
  type: 'generic' | 'brand'
  manufacturer: string
  dosage_form?: string
  standard?: string
}

// サンプルデータ（実際のデータ取得までの仮データ）
const SAMPLE_DRUGS: DrugRecord[] = [
  // 高血圧治療薬
  { code: '2149039F1', name: 'アムロジピン錠2.5mg「サワイ」', name_kana: 'アムロジピンジョウ', type: 'generic', manufacturer: '沢井製薬', dosage_form: '錠剤' },
  { code: '2149039F2', name: 'アムロジピン錠5mg「サワイ」', name_kana: 'アムロジピンジョウ', type: 'generic', manufacturer: '沢井製薬', dosage_form: '錠剤' },
  { code: '2149039F0', name: 'ノルバスク錠2.5mg', name_kana: 'ノルバスクジョウ', type: 'brand', manufacturer: 'ファイザー', dosage_form: '錠剤' },
  
  // 痛み止め
  { code: '1149019C1', name: 'ロキソプロフェンNa錠60mg「サワイ」', name_kana: 'ロキソプロフェンナトリウムジョウ', type: 'generic', manufacturer: '沢井製薬', dosage_form: '錠剤' },
  { code: '1149019C0', name: 'ロキソニン錠60mg', name_kana: 'ロキソニンジョウ', type: 'brand', manufacturer: '第一三共', dosage_form: '錠剤' },
  
  // 胃薬
  { code: '2329023F1', name: 'レバミピド錠100mg「サワイ」', name_kana: 'レバミピドジョウ', type: 'generic', manufacturer: '沢井製薬', dosage_form: '錠剤' },
  { code: '2329023F0', name: 'ムコスタ錠100mg', name_kana: 'ムコスタジョウ', type: 'brand', manufacturer: '大塚製薬', dosage_form: '錠剤' },
  
  // PPI
  { code: '2329022H1', name: 'ランソプラゾールOD錠15mg「サワイ」', name_kana: 'ランソプラゾールオーディージョウ', type: 'generic', manufacturer: '沢井製薬', dosage_form: 'OD錠' },
  { code: '2329022H0', name: 'タケプロンOD錠15mg', name_kana: 'タケプロンオーディージョウ', type: 'brand', manufacturer: '武田薬品', dosage_form: 'OD錠' },
  
  // 糖尿病薬
  { code: '3969007F1', name: 'メトホルミン塩酸塩錠250mg「サワイ」', name_kana: 'メトホルミンエンサンエンジョウ', type: 'generic', manufacturer: '沢井製薬', dosage_form: '錠剤' },
  { code: '3969007F0', name: 'メトグルコ錠250mg', name_kana: 'メトグルコジョウ', type: 'brand', manufacturer: '住友ファーマ', dosage_form: '錠剤' },
  
  // 高脂血症薬
  { code: '2189015F1', name: 'アトルバスタチン錠10mg「サワイ」', name_kana: 'アトルバスタチンジョウ', type: 'generic', manufacturer: '沢井製薬', dosage_form: '錠剤' },
  { code: '2189015F0', name: 'リピトール錠10mg', name_kana: 'リピトールジョウ', type: 'brand', manufacturer: 'ヴィアトリス', dosage_form: '錠剤' },
  
  // 睡眠薬
  { code: '1129009F1', name: 'エスゾピクロン錠2mg「ケミファ」', name_kana: 'エスゾピクロンジョウ', type: 'generic', manufacturer: '日本ケミファ', dosage_form: '錠剤' },
  { code: '1129009F0', name: 'ルネスタ錠2mg', name_kana: 'ルネスタジョウ', type: 'brand', manufacturer: 'エーザイ', dosage_form: '錠剤' },
  
  // 抗生物質
  { code: '6241013F1', name: 'レボフロキサシン錠500mg「サワイ」', name_kana: 'レボフロキサシンジョウ', type: 'generic', manufacturer: '沢井製薬', dosage_form: '錠剤' },
  { code: '6241013F0', name: 'クラビット錠500mg', name_kana: 'クラビットジョウ', type: 'brand', manufacturer: '第一三共', dosage_form: '錠剤' },
  
  // 便秘薬
  { code: '2354003F2', name: 'センノシド錠12mg「サワイ」', name_kana: 'センノシドジョウ', type: 'generic', manufacturer: '沢井製薬', dosage_form: '錠剤' },
  { code: '2344009F1', name: 'マグミット錠330mg', name_kana: 'マグミットジョウ', type: 'brand', manufacturer: '協和化学', dosage_form: '錠剤' },
  
  // 抗うつ薬
  { code: '1179052M1', name: 'デュロキセチンカプセル20mg「サワイ」', name_kana: 'デュロキセチンカプセル', type: 'generic', manufacturer: '沢井製薬', dosage_form: 'カプセル' },
  { code: '1179052M0', name: 'サインバルタカプセル20mg', name_kana: 'サインバルタカプセル', type: 'brand', manufacturer: '塩野義製薬', dosage_form: 'カプセル' },
  
  // 認知症薬
  { code: '1190012F1', name: 'ドネペジル塩酸塩錠5mg「サワイ」', name_kana: 'ドネペジルエンサンエンジョウ', type: 'generic', manufacturer: '沢井製薬', dosage_form: '錠剤' },
  { code: '1190012F0', name: 'アリセプト錠5mg', name_kana: 'アリセプトジョウ', type: 'brand', manufacturer: 'エーザイ', dosage_form: '錠剤' }
]

async function downloadMHLWData(): Promise<string> {
  console.log('📥 厚生労働省のデータをダウンロード中...')
  
  // 実際のダウンロードURL（例）
  // const url = 'https://www.mhlw.go.jp/content/12400000/000123456.csv'
  
  // 現在はサンプルデータを使用
  console.log('⚠️  デモ用のサンプルデータを使用します')
  const tempPath = path.join(process.cwd(), 'temp', 'drugs.csv')
  
  // サンプルデータをCSV形式で保存
  const csv = 'code,name,name_kana,type,manufacturer,dosage_form\n' +
    SAMPLE_DRUGS.map(d => `${d.code},${d.name},${d.name_kana},${d.type},${d.manufacturer},${d.dosage_form}`).join('\n')
  
  const fs = await import('fs/promises')
  await fs.mkdir(path.dirname(tempPath), { recursive: true })
  await fs.writeFile(tempPath, csv, 'utf8')
  
  return tempPath
}

async function parseMHLWData(filePath: string): Promise<DrugRecord[]> {
  console.log('🔄 データを解析中...')
  const drugs: DrugRecord[] = []
  
  return new Promise((resolve, reject) => {
    createReadStream(filePath)
      .pipe(parse({
        columns: true,
        skip_empty_lines: true,
        encoding: 'utf8'
      }))
      .on('data', (row: any) => {
        drugs.push({
          code: row.code,
          name: row.name,
          name_kana: row.name_kana,
          type: row.type as 'generic' | 'brand',
          manufacturer: row.manufacturer,
          dosage_form: row.dosage_form
        })
      })
      .on('end', () => resolve(drugs))
      .on('error', reject)
  })
}

async function importToDatabase(drugs: DrugRecord[]): Promise<void> {
  console.log(`📊 ${drugs.length}件の薬剤データをデータベースに登録中...`)
  
  // 既存データをクリア
  const { error: deleteError } = await supabase
    .from('drugs')
    .delete()
    .neq('code', '')
  
  if (deleteError) {
    console.error('既存データの削除エラー:', deleteError)
    throw deleteError
  }
  
  // バッチ処理でインポート
  const batchSize = 100
  let successCount = 0
  
  for (let i = 0; i < drugs.length; i += batchSize) {
    const batch = drugs.slice(i, i + batchSize)
    const { error } = await supabase
      .from('drugs')
      .insert(batch)
    
    if (error) {
      console.error(`バッチ ${Math.floor(i / batchSize) + 1} のエラー:`, error)
      // エラーがあっても続行
    } else {
      successCount += batch.length
    }
    
    process.stdout.write(`\r✅ 進捗: ${successCount}/${drugs.length} 件`)
  }
  
  console.log('\n✅ インポート完了！')
}

async function createSearchIndex(): Promise<void> {
  console.log('🔍 検索インデックスを作成中...')
  
  // pg_trgmが有効になっていることを確認
  await supabase.rpc('create_extension_if_not_exists', { name: 'pg_trgm' })
  
  // インデックスの作成（エラーが出ても無視）
  const indexQueries = [
    'CREATE INDEX IF NOT EXISTS idx_drugs_name_trgm ON drugs USING gin (name gin_trgm_ops)',
    'CREATE INDEX IF NOT EXISTS idx_drugs_name_kana_trgm ON drugs USING gin (name_kana gin_trgm_ops)',
    'CREATE INDEX IF NOT EXISTS idx_drugs_type ON drugs(type)',
    'CREATE INDEX IF NOT EXISTS idx_drugs_manufacturer ON drugs(manufacturer)'
  ]
  
  for (const query of indexQueries) {
    try {
      await supabase.rpc('exec_sql', { sql: query })
    } catch (e) {
      // インデックスが既に存在する場合は無視
    }
  }
  
  console.log('✅ インデックス作成完了')
}

async function main() {
  const startTime = Date.now()
  
  try {
    console.log('🚀 薬剤マスターデータのインポートを開始します...\n')
    
    // データのダウンロード
    const csvPath = await downloadMHLWData()
    
    // データの解析
    const drugs = await parseMHLWData(csvPath)
    console.log(`\n📋 ${drugs.length}件の薬剤データを解析しました`)
    
    // データベースへのインポート
    await importToDatabase(drugs)
    
    // 検索インデックスの作成
    await createSearchIndex()
    
    // 一時ファイルの削除
    const fs = await import('fs/promises')
    await fs.unlink(csvPath)
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(1)
    console.log(`\n✨ 完了！ 処理時間: ${duration}秒`)
    console.log('\n💡 ヒント: 実際の厚生労働省データを使用する場合は、以下のサイトからダウンロードしてください:')
    console.log('   https://www.mhlw.go.jp/topics/2021/04/tp20210401-01.html')
    
  } catch (error) {
    console.error('\n❌ エラーが発生しました:', error)
    process.exit(1)
  }
}

// 直接実行された場合
if (require.main === module) {
  main()
}

export { main as importMHLWDrugs }