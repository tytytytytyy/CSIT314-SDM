// Entity: IDPPhoto
// Photos belonging to an IDP.
// Used by: Create / Update / View IDP, View Favourites List
//
// Database table: idp_photo
//
// Attributes:
// - photoID, idpID, photoURL, caption, sortOrder, uploadedAt
//
// Methods:
// - addPhoto(photo)
// - getPhotos(idpID)                                    ordered by sortOrder, first is the main photo
// - deletePhoto(photoID)
//
// Only getPhotos is implemented so far.
import { readTable } from "./LocalStore";

export interface IDPPhotoData {
  photoID: string;
  idpID: number;
  photoURL: string;
  caption: string;
  sortOrder: number;
  uploadedAt: string;
}

export class IDPPhoto implements IDPPhotoData {
  photoID!: string;
  idpID!: number;
  photoURL!: string;
  caption!: string;
  sortOrder!: number;
  uploadedAt!: string;

  constructor(data: IDPPhotoData) {
    Object.assign(this, data);
  }

  static async getPhotos(idpID: number): Promise<IDPPhoto[]> {
    return readTable<IDPPhotoData>("idp_photo")
      .filter((r) => r.idpID === idpID)
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((r) => new IDPPhoto(r));
  }
}
