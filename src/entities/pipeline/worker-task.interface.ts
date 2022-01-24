export interface IWorkerTask {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  userId: number;
  workerName?: string;
  workerSecret?: string;
}
