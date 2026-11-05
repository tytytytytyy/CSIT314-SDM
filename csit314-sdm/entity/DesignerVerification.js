// Entity: DesignerVerification
// One verification request per interior designer account.
// Used by: Verify ID Accounts, Browse Interior Designers, Get Designer Recommendations,
//          Generate Platform Report
//
// Fixed values:
// - VERIFICATION_STATUS = pending | approved | rejected
//
// Database table: designer_verification
//
// Attributes:
// - verificationID, designerID (accountID), status, submittedAt,
//   reviewedBy (admin accountID), reviewedAt, rejectReason
//
// Methods:
// - getPendingVerifications()
// - getVerification(verificationID)
// - getVerificationByDesigner(designerID)               null if the designer never applied
// - updateVerification(verification)
// - countVerified(startDate, endDate)                   platform report
//
// Implemented so far: getVerificationByDesigner (Browse Interior Designers).
import { readTable } from "./LocalStore";

export class DesignerVerification {
  static VERIFICATION_STATUS = ["pending", "approved", "rejected"];

  verificationID;
  designerID;
  status;
  submittedAt;
  reviewedBy;
  reviewedAt;
  rejectReason;

  constructor(data) {
    Object.assign(this, data);
  }

  static async getVerificationByDesigner(designerID) {
    const row = readTable("designer_verification").find(
      (r) => r.designerID === designerID,
    );
    return row ? new DesignerVerification(row) : null;
  }

  static async countVerified(startDate, endDate) {
  return readTable("designer_verification").filter(
    (r) =>
      r.status === "approved" &&
      r.reviewedAt &&
      r.reviewedAt >= startDate &&
      r.reviewedAt <= endDate,
  ).length;
  }
}
