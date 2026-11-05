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
// - getAccount(accountID)
// - updateStatus(accountID, status)
// - searchAccounts(keyword)
// - countNewAccounts(profileID, startDate, endDate)     platform report
