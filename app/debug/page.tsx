import AuthDebug from '@/components/debug/AuthDebug'

export default function DebugPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            システムデバッグページ
          </h1>
          <p className="mt-2 text-gray-600">
            認証状態と環境設定を確認できます
          </p>
        </div>
        
        <AuthDebug />
        
        <div className="mt-8 text-center">
          <div className="bg-amber-50 border border-amber-200 rounded-md p-4">
            <h3 className="text-sm font-medium text-amber-800 mb-2">
              AI依頼文生成機能のトラブルシューティング
            </h3>
            <div className="text-sm text-amber-700 space-y-1">
              <p>• OpenAI APIキーが設定されていない場合、テンプレートが使用されます</p>
              <p>• 医師ロールでログインしている必要があります</p>
              <p>• 少なくとも1つの薬剤を入力してください</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}