import axios, { AxiosInstance, AxiosError } from 'axios'
import { APIResponse, ImportResult, ParsedCSVData } from '@/types/csv'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'

class APIClient {
  private client: AxiosInstance

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 300000,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    this.client.interceptors.response.use(
      response => response,
      (error: AxiosError) => {
        const message = error.response?.data?.message || error.message || 'An error occurred'
        return Promise.reject(new Error(message))
      }
    )
  }

  async importCSV(file: File, mappings: Record<string, string>): Promise<APIResponse<ImportResult>> {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('mappings', JSON.stringify(mappings))

    const response = await this.client.post<APIResponse<ImportResult>>('/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: progressEvent => {
        // Progress handled via SSE or polling
      },
    })

    return response.data
  }

  async previewImport(file: File, mappings: Record<string, string>, sampleSize: number = 5): Promise<APIResponse<ImportResult>> {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('mappings', JSON.stringify(mappings))
    formData.append('preview', 'true')
    formData.append('sampleSize', sampleSize.toString())

    const response = await this.client.post<APIResponse<ImportResult>>('/import/preview', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })

    return response.data
  }

  async getImportStatus(importId: string): Promise<APIResponse<{ status: string; progress: number; result?: ImportResult }>> {
    const response = await this.client.get<APIResponse<{ status: string; progress: number; result?: ImportResult }>>(`/import/${importId}/status`)
    return response.data
  }

  async downloadResults(importId: string, format: 'csv' | 'json' = 'csv'): Promise<Blob> {
    const response = await this.client.get(`/import/${importId}/download`, {
      params: { format },
      responseType: 'blob',
    })
    return response.data
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.client.get('/health')
      return response.status === 200
    } catch {
      return false
    }
  }
}

export const api = new APIClient()