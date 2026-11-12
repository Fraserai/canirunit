import type { FitLevel } from "../compatibility/types";

export function formatGb(value?: number): string {
  if (value === undefined) return "Unknown";
  if (value < 1) return `${Math.round(value * 1024)}MB`;
  return `${Number.isInteger(value) ? value : value.toFixed(1)}GB`;
}

export function formatDate(value?: string): string {
  if (!value) return "Unknown";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export function fitLabel(fit: FitLevel): string {
  if (fit === "not_recommended") return "Not recommended";
  return fit[0].toUpperCase() + fit.slice(1);
}

export function humanRuntime(runtime?: string): string {
  if (!runtime) return "Runtime needed";
  if (runtime === "llama.cpp") return "llama.cpp";
  if (runtime === "vllm") return "vLLM";
  return runtime[0].toUpperCase() + runtime.slice(1);
}

export function humanTask(task: string): string {
  if (task === "embedding") return "Embeddings";
  return task[0].toUpperCase() + task.slice(1);
}
