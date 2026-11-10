import { readTable } from "./LocalStore";
import { isWithinDateRange } from "@/lib/dates";

export class UserAccount {
  static ACCOUNT_STATUS = ["pending", "active", "suspended", "rejected"];

  accountID;
  email;
  password;
  profileID;
  status;
  createdAt;

  constructor(data) {
    Object.assign(this, data);
  }

  static async getAccount(accountID) {
    const row = readTable("user_account").find((r) => r.accountID === accountID);
    return row ? new UserAccount(row) : null;
  }

  // Emails are compared in lower case, so "Customer1@Example.com" finds customer1@example.com.
  static async getAccountByEmail(email) {
    const wanted = email.toLowerCase();
    const row = readTable("user_account").find((r) => r.email.toLowerCase() === wanted);
    return row ? new UserAccount(row) : null;
  }

  static async countNewAccounts(profileID, startDate, endDate) {
    return readTable("user_account").filter(
      (row) =>
        row.profileID === profileID &&
        isWithinDateRange(row.createdAt, startDate, endDate),
    ).length;
  }
}
