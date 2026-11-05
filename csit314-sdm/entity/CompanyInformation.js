// Entity: CompanyInformation
// The interior design firm's details, one per designer account.
// Used by: Verify ID Accounts, Browse Interior Designers, View IDP,
//          Get Designer Recommendations
//
// Database table: company_information
//
// Attributes:
// - companyID, designerID (accountID), companyName, registrationNumber, description,
//   location, phone, website, logoURL
//
// Methods:
// - getCompanyInfo(designerID)                          null if the designer has no company details
// - searchCompanies(filters)                            keyword / location filters for browsing
//     keyword  matches companyName or description, ignoring case
//     location matches part of the location, ignoring case
//     an empty filter matches every company
import { readTable } from "./LocalStore";

function contains(text, part) {
  return (text ?? "").toLowerCase().includes(part.toLowerCase());
}

export class CompanyInformation {
  companyID;
  designerID;
  companyName;
  registrationNumber;
  description;
  location;
  phone;
  website;
  logoURL;

  constructor(data) {
    Object.assign(this, data);
  }

  static async getCompanyInfo(designerID) {
    const row = readTable("company_information").find(
      (r) => r.designerID === designerID,
    );
    return row ? new CompanyInformation(row) : null;
  }

  static async searchCompanies(filters = {}) {
    const keyword = (filters.keyword ?? "").trim();
    const location = (filters.location ?? "").trim();
    return readTable("company_information")
      .filter(
        (r) =>
          !keyword ||
          contains(r.companyName, keyword) ||
          contains(r.description, keyword),
      )
      .filter((r) => !location || contains(r.location, location))
      .map((r) => new CompanyInformation(r));
  }
}
