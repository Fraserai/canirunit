use serde::Serialize;
use std::process::Command;

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct MachineProfile {
    pub os: String,
    pub os_version: Option<String>,
    pub arch: String,
    pub cpu: CpuInfo,
    pub memory: MemoryInfo,
    pub gpu: Vec<GpuInfo>,
    pub disk: DiskInfo,
    pub accelerators: Vec<String>,
    pub installed_runtimes: InstalledRuntimes,
    pub scan_warnings: Vec<String>,
}

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CpuInfo {
    pub name: String,
    pub cores: Option<u32>,
    pub threads: Option<u32>,
}

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct MemoryInfo {
    pub total_gb: f64,
    pub available_gb: Option<f64>,
}

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct GpuInfo {
    pub name: String,
    pub vendor: String,
    pub vram_gb: Option<f64>,
    pub is_integrated: Option<bool>,
}

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DiskInfo {
    pub free_gb: Option<f64>,
}

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct InstalledRuntimes {
    pub ollama: bool,
    pub llama_cpp: bool,
    pub python: bool,
    pub docker: bool,
}

#[tauri::command]
pub fn scan_machine() -> MachineProfile {
    let mut warnings = Vec::new();
    let cpu = detect_cpu(&mut warnings);
    let memory = detect_memory(&mut warnings);
    let gpu = detect_gpus(&mut warnings);
    let disk = get_disk_space();
    let runtimes = detect_runtimes();
    let accelerators = detect_accelerators(&gpu, &runtimes);

    if gpu.is_empty() {
        warnings.push("No GPU was detected, so rankings will use CPU and RAM signals.".to_string());
    } else if gpu.iter().all(|item| item.vram_gb.is_none()) {
        warnings.push(
            "GPU memory was not reported, so rankings use RAM and accelerator hints.".to_string(),
        );
    }

    if disk.free_gb.is_none() {
        warnings.push("Disk space could not be detected.".to_string());
    }

    MachineProfile {
        os: normalized_os(),
        os_version: detect_os_version(),
        arch: normalized_arch(),
        cpu,
        memory,
        gpu,
        disk,
        accelerators,
        installed_runtimes: runtimes,
        scan_warnings: warnings,
    }
}

#[tauri::command]
pub fn check_runtime(name: String) -> bool {
    runtime_exists(&name)
}

#[tauri::command]
pub fn get_disk_space() -> DiskInfo {
    DiskInfo {
        free_gb: detect_disk_free_gb(),
    }
}

#[tauri::command]
pub fn get_gpu_info() -> Vec<GpuInfo> {
    let mut warnings = Vec::new();
    detect_gpus(&mut warnings)
}

fn command_text(program: &str, args: &[&str]) -> Option<String> {
    let output = Command::new(program).args(args).output().ok()?;
    if !output.status.success() {
        return None;
    }

    let text = String::from_utf8(output.stdout).ok()?;
    let trimmed = text.trim();
    if trimmed.is_empty() {
        None
    } else {
        Some(trimmed.to_string())
    }
}

fn runtime_exists(name: &str) -> bool {
    #[cfg(target_os = "windows")]
    {
        command_text("where", &[name]).is_some()
    }

    #[cfg(not(target_os = "windows"))]
    {
        command_text("which", &[name]).is_some()
    }
}

fn detect_runtimes() -> InstalledRuntimes {
    InstalledRuntimes {
        ollama: runtime_exists("ollama"),
        llama_cpp: runtime_exists("llama-server")
            || runtime_exists("llama-cli")
            || runtime_exists("main"),
        python: runtime_exists("python3") || runtime_exists("python"),
        docker: runtime_exists("docker"),
    }
}

fn normalized_os() -> String {
    #[cfg(target_os = "macos")]
    {
        "macos".to_string()
    }
    #[cfg(target_os = "windows")]
    {
        "windows".to_string()
    }
    #[cfg(target_os = "linux")]
    {
        "linux".to_string()
    }
    #[cfg(not(any(target_os = "macos", target_os = "windows", target_os = "linux")))]
    {
        "unknown".to_string()
    }
}

fn normalized_arch() -> String {
    match std::env::consts::ARCH {
        "aarch64" | "arm64" => "arm64".to_string(),
        "x86_64" | "x86" | "amd64" => "x64".to_string(),
        _ => "unknown".to_string(),
    }
}

fn detect_os_version() -> Option<String> {
    #[cfg(target_os = "macos")]
    {
        command_text("sw_vers", &["-productVersion"])
    }

    #[cfg(target_os = "windows")]
    {
        powershell("(Get-CimInstance Win32_OperatingSystem).Version")
    }

    #[cfg(target_os = "linux")]
    {
        if let Ok(contents) = std::fs::read_to_string("/etc/os-release") {
            for line in contents.lines() {
                if let Some(value) = line.strip_prefix("PRETTY_NAME=") {
                    return Some(value.trim_matches('"').to_string());
                }
            }
        }
        None
    }

    #[cfg(not(any(target_os = "macos", target_os = "windows", target_os = "linux")))]
    {
        None
    }
}

fn detect_cpu(_warnings: &mut Vec<String>) -> CpuInfo {
    #[cfg(target_os = "macos")]
    {
        let name = command_text("sysctl", &["-n", "machdep.cpu.brand_string"])
            .or_else(|| apple_chip_name())
            .unwrap_or_else(|| "Apple processor".to_string());
        let cores =
            command_text("sysctl", &["-n", "hw.physicalcpu"]).and_then(|value| value.parse().ok());
        let threads =
            command_text("sysctl", &["-n", "hw.logicalcpu"]).and_then(|value| value.parse().ok());
        CpuInfo {
            name,
            cores,
            threads,
        }
    }

    #[cfg(target_os = "windows")]
    {
        let name = powershell(
            "(Get-CimInstance Win32_Processor | Select-Object -First 1 -ExpandProperty Name)",
        )
        .unwrap_or_else(|| "Windows processor".to_string());
        let cores = powershell("(Get-CimInstance Win32_Processor | Select-Object -First 1 -ExpandProperty NumberOfCores)")
            .and_then(|value| value.parse().ok());
        let threads = powershell("(Get-CimInstance Win32_Processor | Select-Object -First 1 -ExpandProperty NumberOfLogicalProcessors)")
            .and_then(|value| value.parse().ok());
        CpuInfo {
            name,
            cores,
            threads,
        }
    }

    #[cfg(target_os = "linux")]
    {
        let lscpu = command_text("lscpu", &[]).unwrap_or_default();
        let name = value_after_colon(&lscpu, "Model name")
            .or_else(|| cpuinfo_model_name())
            .unwrap_or_else(|| "Linux processor".to_string());
        let cores =
            value_after_colon(&lscpu, "Core(s) per socket").and_then(|value| value.parse().ok());
        let threads = value_after_colon(&lscpu, "CPU(s)").and_then(|value| value.parse().ok());
        CpuInfo {
            name,
            cores,
            threads,
        }
    }

    #[cfg(not(any(target_os = "macos", target_os = "windows", target_os = "linux")))]
    {
        _warnings.push("CPU details could not be fully detected.".to_string());
        CpuInfo {
            name: "Unknown processor".to_string(),
            cores: None,
            threads: None,
        }
    }
}

fn detect_memory(warnings: &mut Vec<String>) -> MemoryInfo {
    #[cfg(target_os = "macos")]
    {
        let total_gb = command_text("sysctl", &["-n", "hw.memsize"])
            .and_then(|value| value.parse::<f64>().ok())
            .map(bytes_to_gb)
            .unwrap_or_else(|| {
                warnings.push("Total memory could not be detected.".to_string());
                0.0
            });

        MemoryInfo {
            total_gb,
            available_gb: mac_available_memory_gb(),
        }
    }

    #[cfg(target_os = "windows")]
    {
        let total_gb = powershell("(Get-CimInstance Win32_ComputerSystem).TotalPhysicalMemory")
            .and_then(|value| value.parse::<f64>().ok())
            .map(bytes_to_gb)
            .unwrap_or_else(|| {
                warnings.push("Total memory could not be detected.".to_string());
                0.0
            });
        let available_gb = powershell("(Get-CimInstance Win32_OperatingSystem).FreePhysicalMemory")
            .and_then(|value| value.parse::<f64>().ok())
            .map(|kb| kb / 1024.0 / 1024.0);

        MemoryInfo {
            total_gb,
            available_gb,
        }
    }

    #[cfg(target_os = "linux")]
    {
        if let Ok(contents) = std::fs::read_to_string("/proc/meminfo") {
            let total_gb = meminfo_kb(&contents, "MemTotal")
                .map(kb_to_gb)
                .unwrap_or(0.0);
            let available_gb = meminfo_kb(&contents, "MemAvailable").map(kb_to_gb);
            return MemoryInfo {
                total_gb,
                available_gb,
            };
        }
        warnings.push("Memory details could not be fully detected.".to_string());
        MemoryInfo {
            total_gb: 0.0,
            available_gb: None,
        }
    }

    #[cfg(not(any(target_os = "macos", target_os = "windows", target_os = "linux")))]
    {
        warnings.push("Memory details could not be fully detected.".to_string());
        MemoryInfo {
            total_gb: 0.0,
            available_gb: None,
        }
    }
}

fn detect_gpus(_warnings: &mut Vec<String>) -> Vec<GpuInfo> {
    #[cfg(target_os = "macos")]
    {
        detect_macos_gpus()
    }

    #[cfg(target_os = "windows")]
    {
        detect_windows_gpus()
    }

    #[cfg(target_os = "linux")]
    {
        detect_linux_gpus()
    }

    #[cfg(not(any(target_os = "macos", target_os = "windows", target_os = "linux")))]
    {
        Vec::new()
    }
}

fn detect_accelerators(_gpus: &[GpuInfo], _runtimes: &InstalledRuntimes) -> Vec<String> {
    let mut accelerators = vec!["cpu".to_string()];

    #[cfg(target_os = "macos")]
    {
        accelerators.push("metal".to_string());
    }

    #[cfg(target_os = "windows")]
    {
        accelerators.push("directml".to_string());
        if _gpus.iter().any(|gpu| gpu.vendor == "nvidia") || runtime_exists("nvidia-smi") {
            accelerators.push("cuda".to_string());
        }
        if _gpus.iter().any(|gpu| gpu.vendor == "amd") || runtime_exists("rocminfo") {
            accelerators.push("rocm".to_string());
        }
        if !_gpus.is_empty() {
            accelerators.push("vulkan".to_string());
        }
    }

    #[cfg(target_os = "linux")]
    {
        if runtime_exists("nvidia-smi") || _gpus.iter().any(|gpu| gpu.vendor == "nvidia") {
            accelerators.push("cuda".to_string());
        }
        if runtime_exists("rocminfo") || _gpus.iter().any(|gpu| gpu.vendor == "amd") {
            accelerators.push("rocm".to_string());
        }
        if runtime_exists("vulkaninfo") || !_gpus.is_empty() {
            accelerators.push("vulkan".to_string());
        }
    }

    accelerators.sort();
    accelerators.dedup();
    accelerators
}

fn detect_disk_free_gb() -> Option<f64> {
    #[cfg(target_os = "windows")]
    {
        return powershell("(Get-PSDrive -PSProvider FileSystem | Sort-Object Free -Descending | Select-Object -First 1 -ExpandProperty Free)")
            .and_then(|value| value.parse::<f64>().ok())
            .map(bytes_to_gb);
    }

    #[cfg(not(target_os = "windows"))]
    {
        let output = command_text("df", &["-k", "."])?;
        let line = output.lines().nth(1)?;
        let available_kb = line.split_whitespace().nth(3)?.parse::<f64>().ok()?;
        return Some(kb_to_gb(available_kb));
    }
}

#[cfg(target_os = "macos")]
fn apple_chip_name() -> Option<String> {
    let profile = command_text("system_profiler", &["SPHardwareDataType"])?;
    for line in profile.lines() {
        let trimmed = line.trim();
        if let Some(value) = trimmed.strip_prefix("Chip:") {
            return Some(value.trim().to_string());
        }
        if let Some(value) = trimmed.strip_prefix("Processor Name:") {
            return Some(value.trim().to_string());
        }
    }
    None
}

#[cfg(target_os = "macos")]
fn mac_available_memory_gb() -> Option<f64> {
    let vm_stat = command_text("vm_stat", &[])?;
    let page_size = vm_stat
        .lines()
        .next()
        .and_then(|line| line.split("page size of ").nth(1))
        .and_then(|rest| rest.split_whitespace().next())
        .and_then(|value| value.parse::<f64>().ok())
        .unwrap_or(16384.0);

    let pages = ["Pages free", "Pages inactive", "Pages speculative"]
        .iter()
        .filter_map(|label| vm_stat_page_count(&vm_stat, label))
        .sum::<f64>();

    Some(bytes_to_gb(pages * page_size))
}

#[cfg(target_os = "macos")]
fn vm_stat_page_count(vm_stat: &str, label: &str) -> Option<f64> {
    for line in vm_stat.lines() {
        let trimmed = line.trim();
        if trimmed.starts_with(label) {
            return trimmed
                .split(':')
                .nth(1)
                .map(|value| value.trim().trim_end_matches('.').replace('.', ""))
                .and_then(|value| value.parse::<f64>().ok());
        }
    }
    None
}

#[cfg(target_os = "macos")]
fn detect_macos_gpus() -> Vec<GpuInfo> {
    let mut gpus = Vec::new();
    if let Some(profile) = command_text("system_profiler", &["SPDisplaysDataType"]) {
        let mut current_name: Option<String> = None;
        let mut current_vram: Option<f64> = None;

        for line in profile.lines() {
            let trimmed = line.trim();
            if let Some(value) = trimmed.strip_prefix("Chipset Model:") {
                if let Some(name) = current_name.take() {
                    gpus.push(GpuInfo {
                        vendor: vendor_from_name(&name),
                        is_integrated: Some(name.to_lowercase().contains("apple")),
                        name,
                        vram_gb: current_vram.take(),
                    });
                }
                current_name = Some(value.trim().to_string());
            }

            if trimmed.starts_with("VRAM") {
                current_vram = first_number(trimmed);
            }
        }

        if let Some(name) = current_name.take() {
            gpus.push(GpuInfo {
                vendor: vendor_from_name(&name),
                is_integrated: Some(name.to_lowercase().contains("apple")),
                name,
                vram_gb: current_vram,
            });
        }
    }

    if gpus.is_empty() && normalized_arch() == "arm64" {
        if let Some(chip) = apple_chip_name() {
            gpus.push(GpuInfo {
                name: format!("{chip} integrated GPU"),
                vendor: "apple".to_string(),
                vram_gb: None,
                is_integrated: Some(true),
            });
        }
    }

    gpus
}

#[cfg(target_os = "windows")]
fn detect_windows_gpus() -> Vec<GpuInfo> {
    let mut gpus = Vec::new();
    if let Some(output) = powershell("Get-CimInstance Win32_VideoController | ForEach-Object { \"$($_.Name)|$($_.AdapterRAM)\" }") {
        for line in output.lines() {
            let mut parts = line.split('|');
            let name = parts.next().unwrap_or("Unknown GPU").trim().to_string();
            let vram_gb = parts
                .next()
                .and_then(|value| value.trim().parse::<f64>().ok())
                .filter(|value| *value > 0.0)
                .map(bytes_to_gb);
            let vendor = vendor_from_name(&name);
            let is_integrated = Some(matches!(vendor.as_str(), "intel" | "apple" | "qualcomm"));
            gpus.push(GpuInfo {
                name,
                vendor,
                vram_gb,
                is_integrated,
            });
        }
    }
    gpus
}

#[cfg(target_os = "linux")]
fn detect_linux_gpus() -> Vec<GpuInfo> {
    if let Some(output) = command_text(
        "nvidia-smi",
        &[
            "--query-gpu=name,memory.total",
            "--format=csv,noheader,nounits",
        ],
    ) {
        let gpus = output
            .lines()
            .filter_map(|line| {
                let mut parts = line.split(',');
                let name = parts.next()?.trim().to_string();
                let vram_gb = parts
                    .next()
                    .and_then(|value| value.trim().parse::<f64>().ok())
                    .map(|mb| mb / 1024.0);
                Some(GpuInfo {
                    name,
                    vendor: "nvidia".to_string(),
                    vram_gb,
                    is_integrated: Some(false),
                })
            })
            .collect::<Vec<_>>();
        if !gpus.is_empty() {
            return gpus;
        }
    }

    let mut gpus = Vec::new();
    if let Some(output) = command_text("lspci", &[]) {
        for line in output.lines() {
            let lower = line.to_lowercase();
            if lower.contains("vga compatible controller") || lower.contains("3d controller") {
                let name = line
                    .split(':')
                    .skip(2)
                    .collect::<Vec<_>>()
                    .join(":")
                    .trim()
                    .to_string();
                let gpu_name = if name.is_empty() {
                    line.to_string()
                } else {
                    name
                };
                let vendor = vendor_from_name(&gpu_name);
                let is_integrated = Some(matches!(vendor.as_str(), "intel" | "qualcomm"));
                gpus.push(GpuInfo {
                    name: gpu_name,
                    vendor,
                    vram_gb: None,
                    is_integrated,
                });
            }
        }
    }
    gpus
}

#[cfg(target_os = "windows")]
fn powershell(command: &str) -> Option<String> {
    command_text("powershell", &["-NoProfile", "-Command", command])
}

#[cfg(target_os = "linux")]
fn value_after_colon(output: &str, key: &str) -> Option<String> {
    for line in output.lines() {
        if let Some(value) = line.trim().strip_prefix(key) {
            return value
                .split(':')
                .nth(1)
                .map(|text| text.trim().to_string())
                .filter(|text| !text.is_empty());
        }
    }
    None
}

#[cfg(target_os = "linux")]
fn cpuinfo_model_name() -> Option<String> {
    let contents = std::fs::read_to_string("/proc/cpuinfo").ok()?;
    value_after_colon(&contents, "model name")
}

#[cfg(target_os = "linux")]
fn meminfo_kb(contents: &str, key: &str) -> Option<f64> {
    for line in contents.lines() {
        if line.starts_with(key) {
            return line
                .split_whitespace()
                .nth(1)
                .and_then(|value| value.parse::<f64>().ok());
        }
    }
    None
}

fn vendor_from_name(name: &str) -> String {
    let lower = name.to_lowercase();
    if lower.contains("apple")
        || lower.contains("m1")
        || lower.contains("m2")
        || lower.contains("m3")
    {
        "apple".to_string()
    } else if lower.contains("nvidia") || lower.contains("geforce") || lower.contains("rtx") {
        "nvidia".to_string()
    } else if lower.contains("amd") || lower.contains("radeon") {
        "amd".to_string()
    } else if lower.contains("intel") || lower.contains("arc") {
        "intel".to_string()
    } else if lower.contains("qualcomm") || lower.contains("adreno") {
        "qualcomm".to_string()
    } else {
        "unknown".to_string()
    }
}

fn first_number(text: &str) -> Option<f64> {
    text.split_whitespace().find_map(|part| {
        part.trim_matches(|c: char| !c.is_ascii_digit() && c != '.')
            .parse::<f64>()
            .ok()
    })
}

fn bytes_to_gb(bytes: f64) -> f64 {
    round_one(bytes / 1024.0 / 1024.0 / 1024.0)
}

fn kb_to_gb(kb: f64) -> f64 {
    round_one(kb / 1024.0 / 1024.0)
}

fn round_one(value: f64) -> f64 {
    (value * 10.0).round() / 10.0
}
