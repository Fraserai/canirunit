import type { Accelerator } from "../scanner/types";

export type ModelTask =
  | "chat"
  | "coding"
  | "vision"
  | "embedding"
  | "image"
  | "audio";

export type Runtime =
  | "ollama"
  | "llama.cpp"
  | "vllm"
  | "mlx"
  | "onnx"
  | "diffusers"
  | "transformers";

export type ModelVariant = {
  id: string;
  name: string;
  family: string;
  task: ModelTask;
  parameterBillion?: number;
  format: "gguf" | "ollama" | "safetensors" | "mlx" | "onnx" | "other";
  quantization?: string;
  license: string;
  source: "seed" | "huggingface" | "ollama" | "manual";
  sourceUrl?: string;
  lastUpdated?: string;
  requirements: {
    minRamGb: number;
    recommendedRamGb: number;
    minVramGb?: number;
    recommendedVramGb?: number;
    diskGb: number;
    requiredAccelerators?: Accelerator[];
    preferredAccelerators?: Accelerator[];
  };
  runtimes: Runtime[];
  installCommands: {
    ollama?: string;
    llamaCpp?: string;
    vllm?: string;
    notes?: string;
  };
  qualityHints: {
    speed: 1 | 2 | 3 | 4 | 5;
    quality: 1 | 2 | 3 | 4 | 5;
    easeOfUse: 1 | 2 | 3 | 4 | 5;
  };
};
