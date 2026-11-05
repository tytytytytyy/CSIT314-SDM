// Entity: UserAccount
// Stores login accounts for all roles. Shared by every feature.
// Used by: Verify ID Accounts, Create IDP, Browse Interior Designers,
//          Get Designer Recommendations, Generate Platform Report
//
// Fixed values:
// - ACCOUNT_STATUS = pending | active | suspended | rejected
//
// Database table: user_account
//
// Attributes:
// - accountID, email, password (hashed), profileID (links to UserProfile / role),
//   status, createdAt
//
// Methods:
// - getAccount(accountID)                               null if there is no such account
// - updateStatus(accountID, status)
// - searchAccounts(keyword)
// - countNewAccounts(profileID, startDate, endDate)     platform report
//
// Implemented so far: getAccount (Browse Interior Designers).
// password is not in the dummy data yet; it arrives with the Login feature.
import { readTable } from "./LocalStore";

export class UserAccount {
  static ACCOUNT_STATUS = ["pending", "active", "suspended", "rejected"];

  accountID;
  email;
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

  static async countNewAccounts(profileID, startDate, endDate) {
  return readTable("user_account").filter(
    (r) =>
      r.profileID === profileID &&
      r.createdAt >= startDate &&
      r.createdAt <= endDate,
  ).length;
  }
}
