#!/bin/bash

# サーバーコンポーネントをクライアントコンポーネントに変換するスクリプト

files=(
  "app/dashboard/settings/page.tsx"
  "app/dashboard/pharmacy/page.tsx"
  "app/dashboard/inquiries/page.tsx"
  "app/dashboard/subscription/page.tsx"
  "app/dashboard/pharmacies/new/page.tsx"
  "app/dashboard/pharmacies/[id]/edit/page.tsx"
  "app/dashboard/pharmacies/[id]/page.tsx"
  "app/dashboard/pharmacies/page.tsx"
)

for file in "${files[@]}"; do
  echo "Converting $file..."
  
  # ファイルの先頭に 'use client' を追加
  if ! grep -q "^'use client'" "$file"; then
    echo "'use client'" > temp_file
    echo "" >> temp_file
    cat "$file" >> temp_file
    mv temp_file "$file"
  fi
  
  # createClient を server から client に変更
  sed -i '' "s|from '@/lib/supabase/server'|from '@/lib/supabase/client'|g" "$file"
  
  # async function から通常の function に変更
  sed -i '' "s|export default async function|export default function|g" "$file"
  
  echo "Converted $file"
done

echo "Conversion complete!"