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
