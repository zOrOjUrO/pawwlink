// Client-side offline intake queue (localStorage). SSR-safe (no-ops on server).
export interface QueuedIntake {
  id: string;
  imageDataUrl: string;
  chipNumber?: string;
  timestamp: string;
  status: "pending" | "synced" | "failed";
}

const KEY = "pawlink.queue.v1";
const EVENT = "pawlink-queue";

function read(): QueuedIntake[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(window.localStorage.getItem(KEY) ?? "[]") as QueuedIntake[];
  } catch {
    return [];
  }
}

function write(queue: QueuedIntake[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(queue));
  window.dispatchEvent(new Event(EVENT));
}

export function addToQueue(intake: QueuedIntake): void {
  write([intake, ...read()]);
}

export function getQueue(): QueuedIntake[] {
  return read();
}

function setStatus(id: string, status: QueuedIntake["status"]): void {
  write(read().map((i) => (i.id === id ? { ...i, status } : i)));
}

export function markSynced(id: string): void {
  setStatus(id, "synced");
}

export function markFailed(id: string): void {
  setStatus(id, "failed");
}

export function pendingCount(): number {
  return read().filter((i) => i.status === "pending" || i.status === "failed").length;
}

export const QUEUE_EVENT = EVENT;
