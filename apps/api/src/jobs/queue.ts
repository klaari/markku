export interface QueueJob {
  jobId: string;
  userId: string;
  url: string;
}

type ProcessFn = (job: QueueJob) => Promise<void>;

const CONCURRENCY = 2;

let processFn: ProcessFn | null = null;
const pending: QueueJob[] = [];
let running = 0;

export function setProcessor(fn: ProcessFn) {
  processFn = fn;
}

export function enqueue(job: QueueJob) {
  pending.push(job);
  drain();
}

function drain() {
  while (running < CONCURRENCY && pending.length > 0 && processFn) {
    const job = pending.shift()!;
    running++;
    processFn(job)
      .catch((err) => {
        console.error(`[queue] Job ${job.jobId} uncaught error:`, err);
      })
      .finally(() => {
        running--;
        drain();
      });
  }
}

export function getQueueStats() {
  return { pending: pending.length, running };
}
