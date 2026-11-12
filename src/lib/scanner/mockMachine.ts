import type { MachineProfile } from "./types";

export type MockProfileId =
  | "auto"
  | "macbook-air-m2"
  | "macbook-pro-m3-max"
  | "windows-rtx-4070"
  | "windows-integrated"
  | "linux-rtx-4090"
  | "old-laptop"
  | "raspberry-pi";

export type MockProfileOption = {
  id: MockProfileId;
  label: string;
};

export const mockProfileOptions: MockProfileOption[] = [
  { id: "auto", label: "Auto / real scan" },
  { id: "macbook-air-m2", label: "MacBook Air M2, 16GB" },
  { id: "macbook-pro-m3-max", label: "MacBook Pro M3 Max, 64GB" },
  { id: "windows-rtx-4070", label: "Windows gaming PC, RTX 4070" },
  { id: "windows-integrated", label: "Windows laptop, integrated graphics" },
  { id: "linux-rtx-4090", label: "Linux server, RTX 4090" },
  { id: "old-laptop", label: "Old laptop, 8GB CPU-only" },
  { id: "raspberry-pi", label: "Raspberry Pi-style ARM, 8GB" },
];

export const mockProfiles: Record<Exclude<MockProfileId, "auto">, MachineProfile> = {
  "macbook-air-m2": {
    os: "macos",
    osVersion: "15.5",
    arch: "arm64",
    cpu: { name: "Apple M2", cores: 8, threads: 8 },
    memory: { totalGb: 16, availableGb: 9.5 },
    gpu: [
      {
        name: "Apple M2 integrated GPU",
        vendor: "apple",
        isIntegrated: true,
      },
    ],
    disk: { freeGb: 188 },
    accelerators: ["metal", "cpu"],
    installedRuntimes: {
      ollama: true,
      llamaCpp: true,
      python: true,
      docker: false,
    },
    scanWarnings: [],
  },
  "macbook-pro-m3-max": {
    os: "macos",
    osVersion: "15.5",
    arch: "arm64",
    cpu: { name: "Apple M3 Max", cores: 16, threads: 16 },
    memory: { totalGb: 64, availableGb: 41 },
    gpu: [
      {
        name: "Apple M3 Max integrated GPU",
        vendor: "apple",
        isIntegrated: true,
      },
    ],
    disk: { freeGb: 612 },
    accelerators: ["metal", "cpu"],
    installedRuntimes: {
      ollama: true,
      llamaCpp: true,
      python: true,
      docker: true,
    },
    scanWarnings: [],
  },
  "windows-rtx-4070": {
    os: "windows",
    osVersion: "11 Pro",
    arch: "x64",
    cpu: { name: "AMD Ryzen 7 7800X3D", cores: 8, threads: 16 },
    memory: { totalGb: 32, availableGb: 21 },
    gpu: [
      {
        name: "NVIDIA GeForce RTX 4070",
        vendor: "nvidia",
        vramGb: 12,
        isIntegrated: false,
      },
    ],
    disk: { freeGb: 820 },
    accelerators: ["cuda", "vulkan", "directml", "cpu"],
    installedRuntimes: {
      ollama: true,
      llamaCpp: false,
      python: true,
      docker: true,
    },
    scanWarnings: [],
  },
  "windows-integrated": {
    os: "windows",
    osVersion: "11 Home",
    arch: "x64",
    cpu: { name: "Intel Core Ultra 5", cores: 12, threads: 14 },
    memory: { totalGb: 16, availableGb: 8 },
    gpu: [
      {
        name: "Intel Arc integrated graphics",
        vendor: "intel",
        isIntegrated: true,
      },
    ],
    disk: { freeGb: 142 },
    accelerators: ["directml", "vulkan", "cpu"],
    installedRuntimes: {
      ollama: true,
      llamaCpp: false,
      python: true,
      docker: false,
    },
    scanWarnings: ["GPU memory was not reported, so rankings use system memory as the main signal."],
  },
  "linux-rtx-4090": {
    os: "linux",
    osVersion: "Ubuntu 24.04 LTS",
    arch: "x64",
    cpu: { name: "AMD Threadripper 7960X", cores: 24, threads: 48 },
    memory: { totalGb: 64, availableGb: 49 },
    gpu: [
      {
        name: "NVIDIA GeForce RTX 4090",
        vendor: "nvidia",
        vramGb: 24,
        isIntegrated: false,
      },
    ],
    disk: { freeGb: 1320 },
    accelerators: ["cuda", "vulkan", "cpu"],
    installedRuntimes: {
      ollama: true,
      llamaCpp: true,
      python: true,
      docker: true,
    },
    scanWarnings: [],
  },
  "old-laptop": {
    os: "linux",
    osVersion: "Linux Mint 21",
    arch: "x64",
    cpu: { name: "Intel Core i5-5300U", cores: 2, threads: 4 },
    memory: { totalGb: 8, availableGb: 3.5 },
    gpu: [
      {
        name: "Intel HD Graphics 5500",
        vendor: "intel",
        isIntegrated: true,
      },
    ],
    disk: { freeGb: 54 },
    accelerators: ["cpu"],
    installedRuntimes: {
      ollama: false,
      llamaCpp: true,
      python: true,
      docker: false,
    },
    scanWarnings: ["No dedicated GPU was detected, so larger models are ranked conservatively."],
  },
  "raspberry-pi": {
    os: "linux",
    osVersion: "Debian 12",
    arch: "arm64",
    cpu: { name: "ARM Cortex-A76", cores: 4, threads: 4 },
    memory: { totalGb: 8, availableGb: 4.2 },
    gpu: [
      {
        name: "VideoCore integrated graphics",
        vendor: "unknown",
        isIntegrated: true,
      },
    ],
    disk: { freeGb: 42 },
    accelerators: ["cpu"],
    installedRuntimes: {
      ollama: false,
      llamaCpp: true,
      python: true,
      docker: false,
    },
    scanWarnings: ["This profile is CPU-only for local model matching."],
  },
};

export function getMockProfile(id: MockProfileId): MachineProfile {
  if (id === "auto") {
    return {
      ...mockProfiles["macbook-air-m2"],
      scanWarnings: [
        "Real Tauri hardware scanning is not available in this browser preview, so a safe mock profile is being used.",
      ],
    };
  }

  return mockProfiles[id];
}
