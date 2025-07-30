'use client'

import { useState } from 'react'
import { testServerAction } from './test-action'

export default function SimpleActionTest() {
  const [result, setResult] = useState<string>('')
  const [loading, setLoading] = useState(false)
  
  async function handleTest() {
    setLoading(true)
    try {
      const response = await testServerAction()
      setResult(response)
    } catch (error) {
      setResult(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div className="mt-4 p-4 border border-blue-300 rounded-lg bg-blue-50">
      <h3 className="text-lg font-semibold mb-2">Server Actionテスト</h3>
      <button
        onClick={handleTest}
        disabled={loading}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
      >
        {loading ? 'テスト中...' : 'Server Actionテスト'}
      </button>
      {result && (
        <p className="mt-2 text-sm">{result}</p>
      )}
    </div>
  )
}