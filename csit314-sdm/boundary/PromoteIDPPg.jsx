// Boundary: PromoteIDPPg
// Feature: Promote IDP (Platform Management)
// User story: As a platform manager, I want to promote an IDP for a set period,
// so that high-quality projects get more visibility.
//
// Suggested route: /platform-manager/promote-idp/[idpID]
//
// What goes here:
// - Form showing the selected IDP with a start date and end date picker.
// - "Promote" button that submits to PromoteIDPController.
// - Success / error messages (e.g. promotion limit reached, invalid dates).
//
// Methods:
// - displayPromoteForm(idp)
// - submitPromotion(idpID, startDate, endDate)
// - displaySuccessPg()
// - displayErrorPg(message)
//
// Attributes: none
