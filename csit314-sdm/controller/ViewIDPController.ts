// Control: ViewIDPController
// Feature: View IDP (Interior Designer and Customer)
//
// What goes here:
// - Loads everything needed to show one IDP.
// - Records a view event when a customer opens the IDP (used by the dashboard and report).
//
// Rules:
// - IDPs from designers who are not verified are hidden from customers.
// - A view is recorded only for customers, not when the owner views their own IDP.
//
// Methods:
// - viewIDP(idpID, viewerID)
//     -> IDP.getIDP(idpID)
//     -> IDPPhoto.getPhotos(idpID)
//     -> IDPLike.countLikes(idpID)
//     -> IDPLike.getLike(customerID, idpID)       has this customer liked it already?
//     -> CompanyInformation.getCompanyInfo(designerID)
// - recordView(idpID, customerID)
//     -> IDPView.createView(view)
//
// Entities used: IDP, IDPPhoto, IDPLike, IDPView, CompanyInformation
//
// Attributes: none
