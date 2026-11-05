// Control: ViewFavouritesListController
// Feature: View Favourites List (Customer)
//
// What goes here:
// - Loads the logged-in customer's liked IDPs, newest like first.
// - Leaves out IDPs the designer has removed (IDP.getIDP returns null when the designer has deleted the IDP).
//
// Methods:
// - getFavourites(customerID)
//     -> IDPLike.getLikesByCustomer(customerID)
//     -> IDP.getIDP(idpID) for each like
//     -> IDPPhoto.getPhotos(idpID)              first photo is the main photo
//
// Entities used: IDPLike, IDP, IDPPhoto
//
// Attributes: none
import { IDP } from "@/entity/IDP";
import { IDPLike } from "@/entity/IDPLike";
import { IDPPhoto } from "@/entity/IDPPhoto";

export class ViewFavouritesListController {
  static async getFavourites(customerID) {
    const likes = await IDPLike.getLikesByCustomer(customerID);
    const favourites = [];
    for (const like of likes) {
      const idp = await IDP.getIDP(like.idpID);
      if (!idp) continue; // deleted by the designer
      const photos = await IDPPhoto.getPhotos(idp.idpID);
      favourites.push({
        idpID: idp.idpID,
        title: idp.title,
        mainPhotoURL: photos[0]?.photoURL ?? null,
        styleName: idp.style,
      });
    }
    return favourites;
  }
}
