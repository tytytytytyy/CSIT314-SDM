// Control: HomeController  (TEMPORARY - replace with the real IDP list / search feature)
// Supplies the IDP cards (title + main photo) shown on the home page carousel.
//
// Methods:
// - getFeaturedIDPs()
//     -> IDP.getIDP(idpID) for each seeded id     removed IDPs come back null and are skipped
//     -> IDPPhoto.getPhotos(idpID)                first photo is the main photo
//
// Entities used: IDP, IDPPhoto
//
// Attributes: none
import { IDP } from "@/entity/IDP";
import { IDPPhoto } from "@/entity/IDPPhoto";

const SEEDED_IDP_IDS = [1, 2, 3, 4];

export interface IDPCard {
  idpID: number;
  title: string;
  mainPhotoURL: string | null;
}

export class HomeController {
  static async getFeaturedIDPs(): Promise<IDPCard[]> {
    const cards: IDPCard[] = [];
    for (const idpID of SEEDED_IDP_IDS) {
      const idp = await IDP.getIDP(idpID);
      if (!idp) continue;
      const photos = await IDPPhoto.getPhotos(idpID);
      cards.push({ idpID, title: idp.title, mainPhotoURL: photos[0]?.photoURL ?? null });
    }
    return cards;
  }
}
