export type Accelerator =
  | "cpu"
  | "metal"
  | "cuda"
  | "rocm"
  | "vulkan"
  | "directml"
  | "openvino"
  | "unknown";

export type MachineProfile = {
  os: "macos" | "windows" | "linux" | "unknown";
  osVersion?: string;
  arch: "arm64" | "x64" | "unknown";
  cpu: {
    name: string;
    cores?: number;
    threads?: number;
  };
  memory: {
    totalGb: number;
    availableGb?: number;
  };
  gpu: {
    name: string;
    vendor: "apple" | "nvidia" | "amd" | "intel" | "qualcomm" | "unknown";
    vramGb?: number;
    isIntegrated?: boolean;
  }[];
  disk: {
    freeGb?: number;
  };
  accelerators: Accelerator[];
  installedRuntimes: {
    ollama: boolean;
    llamaCpp: boolean;
    python: boolean;
    docker: boolean;
  };
  scanWarnings: string[];
};
