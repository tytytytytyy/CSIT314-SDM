// Boundary: UpdateIDPPg
// Feature: Update IDP (Interior Designer)
//
// Suggested route: /designer/idp/[idpID]/edit
//
// What goes here:
// - Same form as CreateIDPPg, pre-filled with the existing IDP.
// - Existing photos with a remove option, plus uploading new photos.
// - "Save" button that submits to UpdateIDPController.
//
// Methods:
// - displayUpdateForm(idp, photos, categories)
// - submitUpdate(idpID, title, description, categoryID, budget, newPhotos, removedPhotoIDs)
// - displaySuccessPg()
// - displayErrorPg(message)          e.g. "You can only edit your own IDPs"
//
// Attributes: none
