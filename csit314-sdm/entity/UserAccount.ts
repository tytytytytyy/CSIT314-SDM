// Entity: UserAccount
// Stores login accounts for all roles. Shared by every feature.
// Used by: Verify ID Accounts, Create IDP, Browse Interior Designers,
//          Get Designer Recommendations, Generate Platform Report
//
// Database table: user_account
//
// Still to implement (by the features that need them):
// - updateStatus(accountID, status)
// - searchAccounts(keyword)
// - countNewAccounts(profileID, startDate, endDate)     platform report

import { getDb } from "@/lib/db";

export type AccountStatus = "pending" | "active" | "suspended" | "rejected";

export class UserAccount {
  static readonly ACCOUNT_STATUS: AccountStatus[] = ["pending", "active", "suspended", "rejected"];

  accountID: number;
  email: string;
  password: string; // hashed
  profileID: number;
  status: AccountStatus;
  createdAt: string;

  constructor(data: Partial<UserAccount> = {}) {
    this.accountID = data.accountID ?? 0;
    this.email = data.email ?? "";
    this.password = data.password ?? "";
    this.profileID = data.profileID ?? 0;
    this.status = data.status ?? "pending";
    this.createdAt = data.createdAt ?? "";
  }

  // Returns the account, or null if it does not exist.
  getAccount(accountID: number): UserAccount | null {
    const row = getDb()
      .prepare("SELECT * FROM user_account WHERE accountID = ?")
      .get(accountID) as UserAccount | undefined;
    return row ? new UserAccount(row) : null;
  }
}
