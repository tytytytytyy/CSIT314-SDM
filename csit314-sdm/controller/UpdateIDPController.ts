// Control: UpdateIDPController
// Feature: Update IDP (Interior Designer)
//
// What goes here:
// - Ownership check, validation of the changes, saving the IDP and its photo changes.
//
// Rules:
// - Only the designer who owns the IDP can update it.
// - Same field rules as CreateIDPController (required fields, active category).
// - After removing/adding photos the IDP must still have 1..MAX_PHOTOS_PER_IDP photos.
//
// Methods:
// - getUpdateFormData(idpID)
//     -> IDP.getIDP(idpID), IDPPhoto.getPhotos(idpID), IDPCategory.getActiveCategories()
// - checkOwnership(idpID, designerID)
// - validateUpdate(idpID, title, description, categoryID, budget, newPhotos, removedPhotoIDs)
// - updateIDP(idpID, title, description, categoryID, budget, newPhotos, removedPhotoIDs)
//     -> IDP.updateIDP(idp)
//     -> IDPPhoto.addPhoto(photo), IDPPhoto.deletePhoto(photoID)
//
// Entities used: IDP, IDPPhoto, IDPCategory
//
// Attributes: none
