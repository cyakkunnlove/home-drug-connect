#!/usr/bin/env node
/**
 * ETL Script for Drug Master Data
 * Downloads and processes MHLW drug data, generates JSON for client-side search
 */

import { createClient } from '@supabase/supabase-js'
import fs from 'fs/promises'
import path from 'path'
import { parse } from 'csv-parse'
import { createReadStream } from 'fs'

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Drug data structure
interface DrugRecord {
  code: string
  name: string
  name_kana?: string
  type: 'generic' | 'brand'
  approval_date?: string
  manufacturer?: string
}

// Processed drug for JSON
interface ProcessedDrug {
  name: string
  type: 'generic' | 'brand'
}

async function downloadMHLWData(): Promise<string> {
  console.log('📥 Downloading MHLW drug data...')
  
  // Note: Replace with actual MHLW data URL
  // This is a placeholder for the actual implementation
  const response = await fetch('https://example.com/mhlw-drugs.csv')
  if (!response.ok) {
    throw new Error(`Failed to download: ${response.statusText}`)
  }
  
  const data = await response.text()
  const tempPath = path.join(__dirname, '../temp/mhlw-drugs.csv')
  await fs.mkdir(path.dirname(tempPath), { recursive: true })
  await fs.writeFile(tempPath, data)
  
  return tempPath
}

async function parseDrugData(filePath: string): Promise<DrugRecord[]> {
  console.log('🔄 Parsing drug data...')
  const drugs: DrugRecord[] = []
  
  return new Promise((resolve, reject) => {
    createReadStream(filePath)
      .pipe(parse({
        columns: true,
        skip_empty_lines: true,
        encoding: 'utf8'
      }))
      .on('data', (row: any) => {
        // Map CSV columns to our structure
        // Adjust based on actual MHLW CSV format
        drugs.push({
          code: row['医薬品コード'] || row['code'],
          name: row['医薬品名'] || row['name'],
          name_kana: row['医薬品名カナ'] || row['name_kana'],
          type: row['先発後発区分'] === '先発' ? 'brand' : 'generic',
          approval_date: row['承認日'] || row['approval_date'],
          manufacturer: row['製造販売元'] || row['manufacturer']
        })
      })
      .on('end', () => resolve(drugs))
      .on('error', reject)
  })
}

async function updateDatabase(drugs: DrugRecord[]): Promise<void> {
  console.log(`📊 Updating database with ${drugs.length} drugs...`)
  
  // Clear existing data
  const { error: deleteError } = await supabase
    .from('drugs')
    .delete()
    .neq('code', '')
  
  if (deleteError) {
    console.error('Error clearing drugs table:', deleteError)
    throw deleteError
  }
  
  // Insert in batches of 1000
  const batchSize = 1000
  for (let i = 0; i < drugs.length; i += batchSize) {
    const batch = drugs.slice(i, i + batchSize)
    const { error } = await supabase
      .from('drugs')
      .insert(batch)
    
    if (error) {
      console.error(`Error inserting batch ${i / batchSize + 1}:`, error)
      throw error
    }
    
    console.log(`✅ Inserted batch ${i / batchSize + 1}/${Math.ceil(drugs.length / batchSize)}`)
  }
}

async function generateClientJSON(drugs: DrugRecord[]): Promise<void> {
  console.log('🔨 Generating client-side JSON...')
  
  // Process and deduplicate drugs
  const uniqueDrugs = new Map<string, ProcessedDrug>()
  
  drugs.forEach(drug => {
    const key = drug.name.toLowerCase()
    
    // Keep only one entry per drug name, preferring brand over generic
    if (!uniqueDrugs.has(key) || drug.type === 'brand') {
      uniqueDrugs.set(key, {
        name: drug.name,
        type: drug.type
      })
    }
  })
  
  // Convert to array and sort
  const drugArray = Array.from(uniqueDrugs.values())
    .sort((a, b) => a.name.localeCompare(b.name, 'ja'))
  
  // Generate versioned filename
  const version = new Date().toISOString().slice(0, 7).replace('-', '')
  const filename = `drugs.v${version}.json`
  const filePath = path.join(__dirname, '../public', filename)
  
  // Write JSON file
  await fs.writeFile(filePath, JSON.stringify(drugArray))
  
  // Update latest symlink
  const latestPath = path.join(__dirname, '../public/drugs.latest.json')
  try {
    await fs.unlink(latestPath)
  } catch (e) {
    // Ignore if doesn't exist
  }
  await fs.symlink(filename, latestPath)
  
  const stats = await fs.stat(filePath)
  console.log(`✅ Generated ${filename} (${(stats.size / 1024).toFixed(1)}KB)`)
}

async function notifySlack(message: string, isError: boolean = false): Promise<void> {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL
  if (!webhookUrl) {
    console.log('⚠️  No Slack webhook configured')
    return
  }
  
  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: isError ? `❌ ETL Error: ${message}` : `✅ ETL Success: ${message}`,
        username: 'Drug ETL Bot',
        icon_emoji: isError ? ':warning:' : ':pill:'
      })
    })
  } catch (error) {
    console.error('Failed to send Slack notification:', error)
  }
}

// Main ETL process
async function main() {
  const startTime = Date.now()
  
  try {
    console.log('🚀 Starting drug ETL process...')
    
    // Download data
    const csvPath = await downloadMHLWData()
    
    // Parse CSV
    const drugs = await parseDrugData(csvPath)
    console.log(`📋 Parsed ${drugs.length} drug records`)
    
    // Update database
    await updateDatabase(drugs)
    
    // Generate client JSON
    await generateClientJSON(drugs)
    
    // Cleanup
    await fs.unlink(csvPath)
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(1)
    const message = `Drug ETL completed successfully in ${duration}s. Processed ${drugs.length} records.`
    console.log(`✅ ${message}`)
    await notifySlack(message)
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('❌ ETL failed:', errorMessage)
    await notifySlack(errorMessage, true)
    process.exit(1)
  }
}

// Run if called directly
if (require.main === module) {
  main()
}

export { main as runDrugETL }