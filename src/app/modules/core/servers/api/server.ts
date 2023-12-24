export interface Server {
  server_id: string;
  server_label: string;
  ip_address: string;
  hostname: string;
  hd_summary: string;
  ram_summary: string;
  gpu_summary: string;
  gpu_ram_used: number;
  gpu_ram_total: number;
  index: number;
  handlers: {
    label: string;
    description: string[];
    value: string;
  }[];
  ram: {
    total: number;
    available: number;
    used: number;
    percent_used: number;
  };
  cpu: { count: number; percent_used: number };
  hd: {
    total: number;
    used: number;
    free: number;
    percent_used: number;
  };
  skill_groups: {}[];
  skill_groups_installed: {}[];
  installed_skills: {
    name: string;
    label: string;
    routing_key: string;
    use: string[];
    available_precision: {}[];
    memory_usage: {}[];
    model: {}[];
  }[];
  running_skills: {
    name: string;
    device: string;
    label: string;
    device_label: string;
    server_id: string;
    ram: number;
    ram_summary: string;
  }[];
  installed_models: string[];
  downloading_models: string[];
  installed_repository: string[];
  gpu: {
    device: string;
    name: string;
    memory_total: number;
    memory_total_summary: string;
    memory_used: number;
    memory_used_summary: string;
    memory_free: number;
    memory_free_summary: string;
    gpu_utilization: number;
    memory_utilization: number;
  }[];
}
