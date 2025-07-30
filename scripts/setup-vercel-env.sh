#!/bin/bash

echo "Vercel環境変数を設定します..."

# 環境変数を設定
echo "https://hrbsbdyutqwdxfartyzz.supabase.co" | vercel env add NEXT_PUBLIC_SUPABASE_URL production
echo "https://hrbsbdyutqwdxfartyzz.supabase.co" | vercel env add NEXT_PUBLIC_SUPABASE_URL preview  
echo "https://hrbsbdyutqwdxfartyzz.supabase.co" | vercel env add NEXT_PUBLIC_SUPABASE_URL development

echo "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhyYnNiZHl1dHF3ZHhmYXJ0eXp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4NTY3MTcsImV4cCI6MjA2OTQzMjcxN30.vSGlWeY6vxB1oDP48DGTRqpNgU36viWq4CE9RROuDRE" | vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
echo "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhyYnNiZHl1dHF3ZHhmYXJ0eXp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4NTY3MTcsImV4cCI6MjA2OTQzMjcxN30.vSGlWeY6vxB1oDP48DGTRqpNgU36viWq4CE9RROuDRE" | vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY preview
echo "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhyYnNiZHl1dHF3ZHhmYXJ0eXp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4NTY3MTcsImV4cCI6MjA2OTQzMjcxN30.vSGlWeY6vxB1oDP48DGTRqpNgU36viWq4CE9RROuDRE" | vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY development

echo "AIzaSyBN-JwTRud38REKKJFFeKBrtho13MCWQZs" | vercel env add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY production
echo "AIzaSyBN-JwTRud38REKKJFFeKBrtho13MCWQZs" | vercel env add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY preview
echo "AIzaSyBN-JwTRud38REKKJFFeKBrtho13MCWQZs" | vercel env add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY development

echo "https://home-drug-connect.vercel.app" | vercel env add NEXT_PUBLIC_APP_URL production
echo "https://home-drug-connect.vercel.app" | vercel env add NEXT_PUBLIC_APP_URL preview
echo "http://localhost:3000" | vercel env add NEXT_PUBLIC_APP_URL development

echo "環境変数の設定が完了しました。"
echo "再デプロイを開始します..."

# 再デプロイ（キャッシュなし）
vercel --prod --force

echo "デプロイが開始されました。"