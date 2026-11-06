// Entity: UserAccount
// Stores login accounts for all roles. Shared by every feature.
// Used by: Log in, Verify ID Accounts, Create IDP, Browse Interior Designers,
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
// - getAccountByEmail(email)                            log in; null if no account uses it
// - updateStatus(accountID, status)
// - searchAccounts(keyword)
// - countNewAccounts(profileID, startDate, endDate)     platform report
//
// Implemented so far: getAccount (Browse Interior Designers), getAccountByEmail (Log in),
// countNewAccounts (Generate Platform Report).
// Only the demo login accounts in LocalStore have a password (stored as plain TEST data).
import { readTable } from "./LocalStore";

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
    (r) =>
      r.profileID === profileID &&
      r.createdAt >= startDate &&
      r.createdAt <= endDate,
  ).length;
  }
}
