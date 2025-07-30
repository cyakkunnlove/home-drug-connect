#!/bin/bash

# すべてのダッシュボードページに dynamic = 'force-dynamic' を追加

files=(
  "app/dashboard/pharmacy/page.tsx"
  "app/dashboard/inquiries/page.tsx"
  "app/dashboard/subscription/page.tsx"
  "app/dashboard/pharmacies/new/page.tsx"
  "app/dashboard/pharmacies/[id]/edit/page.tsx"
  "app/dashboard/pharmacies/[id]/page.tsx"
  "app/dashboard/pharmacies/page.tsx"
)

for file in "${files[@]}"; do
  echo "Adding dynamic export to $file..."
  
  # 'use client' を削除
  sed -i '' "/^'use client'/d" "$file"
  sed -i '' '/^$/N;/^\n$/d' "$file"  # 空行を削除
  
  # createClient を client から server に戻す
  sed -i '' "s|from '@/lib/supabase/client'|from '@/lib/supabase/server'|g" "$file"
  
  # export default function を export default async function に戻す
  sed -i '' "s|export default function|export default async function|g" "$file"
  
  # dynamic export を追加（まだない場合）
  if ! grep -q "export const dynamic" "$file"; then
    # import文の後に追加
    awk '/^import/ {imports=1} 
         /^$/ && imports {print "export const dynamic = '\''force-dynamic'\''\n"; imports=0} 
         {print}' "$file" > temp_file && mv temp_file "$file"
  fi
  
  echo "Updated $file"
done

echo "All files updated!"