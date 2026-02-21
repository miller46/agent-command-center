export interface Agent {
  id: string;
  name: string;
  type: string;
  status: "idle" | "busy" | "error";
  description?: string;
  lastActive?: Date;
}
