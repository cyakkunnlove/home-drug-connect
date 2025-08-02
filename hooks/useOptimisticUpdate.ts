import { useState, useCallback } from 'react'

interface OptimisticUpdateOptions<T> {
  onUpdate: (data: T) => Promise<void>
  onError?: (error: Error, previousData: T) => void
  onSuccess?: (data: T) => void
}

export function useOptimisticUpdate<T>(
  initialData: T,
  options: OptimisticUpdateOptions<T>
) {
  const [data, setData] = useState<T>(initialData)
  const [isUpdating, setIsUpdating] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const optimisticUpdate = useCallback(async (newData: T | ((prev: T) => T)) => {
    setIsUpdating(true)
    setError(null)
    
    // Store previous data for rollback
    const previousData = data
    
    // Optimistically update the UI
    const updatedData = typeof newData === 'function' 
      ? (newData as (prev: T) => T)(data) 
      : newData
    setData(updatedData)

    try {
      // Perform the actual update
      await options.onUpdate(updatedData)
      
      // Call success callback if provided
      options.onSuccess?.(updatedData)
    } catch (err) {
      // Rollback on error
      setData(previousData)
      const error = err instanceof Error ? err : new Error('Update failed')
      setError(error)
      
      // Call error callback if provided
      options.onError?.(error, previousData)
    } finally {
      setIsUpdating(false)
    }
  }, [data, options])

  return {
    data,
    isUpdating,
    error,
    optimisticUpdate,
    setData
  }
}

// Example usage for request updates
export function useOptimisticRequestUpdate(request: any) {
  return useOptimisticUpdate(request, {
    onUpdate: async (updatedRequest) => {
      const response = await fetch(`/api/requests/${updatedRequest.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedRequest)
      })
      
      if (!response.ok) {
        throw new Error('Failed to update request')
      }
    },
    onError: (error, previousRequest) => {
      console.error('Failed to update request:', error)
      // Show error toast or notification
    },
    onSuccess: (updatedRequest) => {
      // Show success notification
    }
  })
}