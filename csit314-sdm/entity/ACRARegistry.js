// Entity: ACRARegistry
// A SIMULATED copy of ACRA's business register (Accounting and Corporate Regulatory Authority,
// Singapore), shaped like ACRA's open data on data.gov.sg. Not real ACRA data.
// In production this would read ACRA's open data (data.gov.sg API, Singapore Open Data Licence).
// Used by: Verify ID Accounts (automatic ACRA check)
//
// Database table: acra_registry   (primary key: uen)
//
// Attributes:
// - uen            the company's Unique Entity Number, e.g. "202610001D"
// - entityName     registered name, e.g. "FRESH START DESIGN PTE. LTD."
// - status         "live" or "struck off"
// - registeredAt   "YYYY-MM-DD"
//
// Methods:
// - findByUEN(uen)    the registered company, or null if the UEN is not registered
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
