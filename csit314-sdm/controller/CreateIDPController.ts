// Control: CreateIDPController
// Feature: Create IDP (Interior Designer)
//
// What goes here:
// - Validation of a new IDP and saving it with its photos.
//
// Constants:
// - MAX_PHOTOS_PER_IDP (e.g. 10)
// - MAX_TITLE_LENGTH, MAX_DESCRIPTION_LENGTH
//
// Rules:
// - Only a verified (active) interior designer can create an IDP.
// - Title, description, category and at least one photo are required.
// - Category must be active.
//
// Methods:
// - getCreateFormData()
//     -> IDPCategory.getActiveCategories()
// - checkDesignerVerified(designerID)
//     -> UserAccount.getAccount(designerID)
// - validateIDP(title, description, categoryID, budget, photos)
// - createIDP(designerID, title, description, categoryID, budget, photos)
//     -> IDP.createIDP(idp)
//     -> IDPPhoto.addPhoto(photo) for each photo
//
// Entities used: IDP, IDPPhoto, IDPCategory, UserAccount
//
// Attributes: none
