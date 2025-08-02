'use client'

import { useState, useEffect } from 'react'
import OfflineDrugAutocomplete from './OfflineDrugAutocomplete'
import OptimizedDrugAutocomplete from './OptimizedDrugAutocomplete'

interface DrugAutocompleteWrapperProps {
  value: string
  onChange: (value: string) => void
  onSelect?: (drug: any) => void
  placeholder?: string
  className?: string
}

export default function DrugAutocompleteWrapper(props: DrugAutocompleteWrapperProps) {
  const [hasOfflineData, setHasOfflineData] = useState<boolean | null>(null)

  useEffect(() => {
    // JSONファイルの存在をチェック
    fetch('/data/drugs-common.json', { method: 'HEAD' })
      .then(res => setHasOfflineData(res.ok))
      .catch(() => setHasOfflineData(false))
  }, [])

  // チェック中はOptimizedDrugAutocompleteを使用
  if (hasOfflineData === null || !hasOfflineData) {
    return <OptimizedDrugAutocomplete {...props} />
  }

  // オフラインデータがある場合はOfflineDrugAutocompleteを使用
  return <OfflineDrugAutocomplete {...props} />
}