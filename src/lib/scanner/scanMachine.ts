import { invoke } from "@tauri-apps/api/core";
import { getMockProfile, type MockProfileId } from "./mockMachine";
import type { MachineProfile } from "./types";

function isTauriRuntime(): boolean {
  return typeof window !== "undefined" && Boolean(window.__TAURI_INTERNALS__);
}

export async function scanMachine(mockProfileId: MockProfileId = "auto"): Promise<MachineProfile> {
  if (mockProfileId !== "auto") {
    return getMockProfile(mockProfileId);
  }

  if (!isTauriRuntime()) {
    return getMockProfile("auto");
  }

  try {
    return await invoke<MachineProfile>("scan_machine");
  } catch (error) {
    const fallback = getMockProfile("auto");
    return {
      ...fallback,
      scanWarnings: [
        "Hardware scan failed, so CanIRunAI is using a safe mock profile.",
        error instanceof Error ? error.message : String(error),
      ],
    };
  }
}
