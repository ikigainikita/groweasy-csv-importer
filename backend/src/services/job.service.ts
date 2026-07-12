// backend/src/services/job.service.ts

import { randomUUID } from 'crypto';
import type { ExtractionJob, JobStatus, ExtractionResult } from '../types';

interface StoredJob {
  job: ExtractionJob;
  results?: ExtractionResult;
}

class JobService {
  private jobs = new Map<string, StoredJob>();
  private cleanupInterval: NodeJS.Timeout | null = null;
  private readonly defaultTtlMs = 3600000;
  private readonly cleanupIntervalMs = 300000;

  constructor() {
    this.startCleanup();
  }

  private startCleanup(): void {
    this.cleanupInterval = setInterval(() => this.cleanupOldJobs(), this.cleanupIntervalMs);
    if (this.cleanupInterval.unref) this.cleanupInterval.unref();
  }

  private cleanupOldJobs(): void {
    const now = Date.now();
    let cleaned = 0;
    for (const [id, stored] of this.jobs.entries()) {
      const jobEndTime = stored.job.completedAt?.getTime() || stored.job.updatedAt.getTime();
      if (now - jobEndTime > this.defaultTtlMs) {
        this.jobs.delete(id);
        cleaned++;
      }
    }
    if (cleaned > 0) console.log(`🧹 Cleaned up ${cleaned} old job(s)`);
  }

  createJob(totalRecords: number): ExtractionJob {
    const job: ExtractionJob = {
      id: randomUUID(),
      status: 'pending',
      totalRecords,
      processedRecords: 0,
      progress: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.jobs.set(job.id, { job });
    return job;
  }

  updateJob(
    jobId: string,
    updates: Partial<Pick<ExtractionJob, 'status' | 'processedRecords' | 'progress' | 'error'>>
  ): ExtractionJob | null {
    const stored = this.jobs.get(jobId);
    if (!stored) return null;

    stored.job = { ...stored.job, ...updates, updatedAt: new Date() };
    if (updates.status && ['completed', 'failed'].includes(updates.status)) {
      stored.job.completedAt = new Date();
    }
    

    this.jobs.set(jobId, stored);
    return stored.job;
  }

  setResults(jobId: string, results: ExtractionResult): boolean {
    const stored = this.jobs.get(jobId);
    if (!stored) return false;

    stored.results = results;
    stored.job = {
      ...stored.job,
      status: 'completed',
      progress: 100,
      processedRecords: results.stats.totalExtracted,
      completedAt: new Date(),
      updatedAt: new Date(),
    };
    this.jobs.set(jobId, stored);
    return true;
  }

  getJob(jobId: string): ExtractionJob | null {
    return this.jobs.get(jobId)?.job ?? null;
  }

  getResults(jobId: string): ExtractionResult | null {
    return this.jobs.get(jobId)?.results ?? null;
  }

  getAllJobs(): ExtractionJob[] {
    return Array.from(this.jobs.values())
      .map((s) => s.job)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  deleteJob(jobId: string): boolean {
    return this.jobs.delete(jobId);
  }

  getStats(): { total: number; byStatus: Record<JobStatus, number> } {
    const stats = { total: 0, byStatus: { pending: 0, processing: 0, completed: 0, failed: 0 } };
    for (const { job } of this.jobs.values()) {
      stats.total++;
      stats.byStatus[job.status]++;
    }
    return stats;
  }

  shutdown(): void {
    if (this.cleanupInterval) clearInterval(this.cleanupInterval);
    this.jobs.clear();
  }
}

export const jobService = new JobService();