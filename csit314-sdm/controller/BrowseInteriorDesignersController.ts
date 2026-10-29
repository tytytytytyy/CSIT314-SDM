// Control: BrowseInteriorDesignersController
// Feature: Browse Interior Designers (Customer)
//
// What goes here:
// - Combines 4 entities into one designer card each:
//   UserAccount + DesignerVerification + CompanyInformation + IDP.
// - Applies filters and sorting.
// - Hides unverified designers (account not active / verification not approved).
//
// Constants:
// - SORT_OPTIONS = name | mostIDPs | mostLiked | newest
//
// Methods:
// - validateFilters(filters, sortBy)
// - browseDesigners(filters, sortBy)
//     -> CompanyInformation.searchCompanies(filters)
//     -> UserAccount.getAccount(designerID)            keep only active accounts
//     -> DesignerVerification.getVerificationByDesigner(designerID)   keep only approved
//     -> IDP.getIDPsByDesigner(designerID)             IDP count + categories
//     -> IDPLike.countLikes(idpID)                     total likes per designer
// - sortDesigners(designers, sortBy)
//
// Entities used: UserAccount, DesignerVerification, CompanyInformation, IDP, IDPLike
//
// Attributes: none
