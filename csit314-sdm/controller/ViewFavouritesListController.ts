// Control: ViewFavouritesListController
// Feature: View Favourites List (Customer)
//
// What goes here:
// - Loads the logged-in customer's liked IDPs, newest like first.
// - Skips IDPs that are no longer visible (deleted, or designer no longer verified).
//
// Methods:
// - getFavourites(customerID)
//     -> IDPLike.getLikesByCustomer(customerID)
//     -> IDP.getIDP(idpID) for each like
//     -> IDPPhoto.getPhotos(idpID)              first photo as the cover
//
// Entities used: IDPLike, IDP, IDPPhoto
//
// Attributes: none
