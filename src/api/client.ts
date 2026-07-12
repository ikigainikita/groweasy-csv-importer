import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import type {
  PreviewResponse,
  ExtractResponse,
  JobStatusResponse,
  JobResultsResponse,
} from '@/types/crm';

// Use relative URL for Vercel deployment (same-origin)
// VITE_API_URL can be set for local development with separate backend
const API_BASE_URL = import.meta.env.VITE_API_URL || '';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 300000,
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        if (config.data instanceof FormData) {
          delete config.headers['Content-Type'];
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        const message = this.extractErrorMessage(error);
        return Promise.reject(new Error(message));
      }
    );
  }

  private extractErrorMessage(error: AxiosError): string {
    if (error.response?.data) {
      const data = error.response.data as { message?: string; error?: string };
      return data.message || data.error || `HTTP ${error.response.status}: ${error.response.statusText}`;
    }
    if (error.request) {
      return 'Network error: Unable to reach server';
    }
    return error.message || 'Unknown error';
  }

  async previewCSV(file: File): Promise<PreviewResponse> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await this.client.post<PreviewResponse>('/api/v1/csv/preview', formData);
    return response.data;
  }

  async extractCSV(file: File, options?: { provider?: string; async?: boolean; batchSize?: number }): Promise<ExtractResponse> {
    const formData = new FormData();
    formData.append('file', file);
    const params = new URLSearchParams();
    if (options?.provider) params.append('provider', options.provider);
    if (options?.async !== undefined) params.append('async', String(options.async));
    if (options?.batchSize) params.append('batchSize', String(options.batchSize));

    const response = await this.client.post<ExtractResponse>(`/api/v1/csv/extract?${params}`, formData);
    return response.data;
  }

  async getJobStatus(jobId: string): Promise<JobStatusResponse> {
    const response = await this.client.get<JobStatusResponse>(`/api/v1/csv/extract/${jobId}/status`);
    return response.data;
  }

  async getJobResults(jobId: string): Promise<JobResultsResponse> {
    const response = await this.client.get<JobResultsResponse>(`/api/v1/csv/extract/${jobId}/results`);
    return response.data;
  }
}

export const api = new ApiClient();