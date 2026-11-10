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
          contains(r.description, keyword) ||
          r.designerID.toLowerCase() === keyword.toLowerCase(),
      )
      .filter((r) => !location || contains(r.location, location))
      .map((r) => new CompanyInformation(r));
  }
}
