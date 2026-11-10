import { readTable } from "./LocalStore";

export class ACRARegistry {
  uen;
  entityName;
  status;
  registeredAt;

  constructor(data) {
    Object.assign(this, data);
  }

  static async findByUEN(uen) {
    const key = String(uen ?? "").trim().toUpperCase();
    if (!key) return null;
    const row = readTable("acra_registry").find((r) => r.uen === key);
    return row ? new ACRARegistry(row) : null;
  }
}
