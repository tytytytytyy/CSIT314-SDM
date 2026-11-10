import { readTable } from "./LocalStore";
import { isWithinDateRange } from "@/lib/dates";

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
      (row) =>
        row.status === "approved" &&
        isWithinDateRange(row.reviewedAt, startDate, endDate),
    ).length;
  }
}
