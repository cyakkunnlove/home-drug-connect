# Supabase Auth「Database error creating new user」エラーの修正方法

## 問題の概要
薬局と医師の登録時に「Database error creating new user」エラーが発生しています。
Service Role Keyは正しく設定されており、データベース接続も正常ですが、Supabase Auth APIがユーザー作成時にエラーを返しています。

## 原因の可能性
1. **auth.usersテーブルのトリガーエラー**
   - handle_new_userトリガー関数に問題がある可能性
   - トリガーがusersテーブルにアクセスできない

2. **Supabase Authの設定問題**
   - Email認証が無効になっている
   - 新規登録が制限されている

## 修正手順

### 1. Supabaseダッシュボードで確認

1. [Supabase Dashboard](https://app.supabase.com)にログイン
2. 「HOME-DRUG CONNECT」プロジェクトを選択

### 2. Auth設定の確認

1. 左側メニューの「Authentication」→「Providers」
2. 「Email」が有効になっていることを確認
3. 以下の設定を確認：
   - Enable Email Signup: ON
   - Enable Email Confirmations: OFF（開発中は無効を推奨）

### 3. トリガー関数の修正

SQL Editorで以下を実行：

```sql
-- 既存のトリガーを削除
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 新しいトリガー関数を作成（エラーハンドリング改善版）
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- ユーザーレコードを作成（エラーを無視）
  INSERT INTO public.users (id, email, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'pharmacy_admin')
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- エラーが発生してもユーザー作成を続行
    RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- トリガーを再作成
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

### 4. RLSポリシーの確認

```sql
-- usersテーブルのRLSポリシーを確認
SELECT tablename, policyname, permissive, roles, cmd 
FROM pg_policies 
WHERE tablename = 'users';

-- 必要に応じてサービスロール用のポリシーを追加
CREATE POLICY "Service role can do anything" ON public.users
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
```

### 5. 一時的な回避策

トリガーが問題の原因の場合、一時的に無効化：

```sql
-- トリガーを無効化
ALTER TABLE auth.users DISABLE TRIGGER on_auth_user_created;
```

### 6. 登録処理の代替実装

`lib/auth/actions.ts`で、Auth APIの代わりに直接データベースにユーザーを作成する方法：

```typescript
// Service clientでauth.usersに直接挿入（非推奨だが一時的な回避策）
const { data: authUser, error: authError } = await serviceClient
  .from('auth.users')
  .insert({
    id: crypto.randomUUID(),
    email,
    encrypted_password: await bcrypt.hash(password, 10),
    email_confirmed_at: new Date().toISOString(),
    raw_user_meta_data: { role }
  })
  .select()
  .single()
```

## 確認事項

1. **Supabase プロジェクトの状態**
   - プロジェクトが一時停止されていないか
   - 無料プランの制限に達していないか

2. **環境変数**
   - URLに改行文字が含まれていないか（修正済み）
   - Service Role Keyが正しいか

3. **データベースログ**
   - Supabase Dashboard → Logs → Postgres
   - エラーメッセージを確認

## 推奨される対応

1. まずSupabase Dashboardで上記の設定を確認
2. トリガー関数を修正版に更新
3. それでも解決しない場合は、Supabaseサポートに問い合わせ

## 連絡先
- Supabase Support: https://supabase.com/support
- GitHub Issues: https://github.com/supabase/supabase/issues