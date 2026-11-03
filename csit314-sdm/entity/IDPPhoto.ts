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
// photoURL is a data: URL while the data lives in the browser (LocalStore).
import { readTable, writeTable } from "./LocalStore";

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

  // Saves a new photo and returns it with its new photoID and uploadedAt.
  static async addPhoto(photo: Omit<IDPPhotoData, "photoID" | "uploadedAt">): Promise<IDPPhoto> {
    const rows = readTable<IDPPhotoData>("idp_photo");
    const created: IDPPhotoData = {
      ...photo,
      photoID: `P${Date.now()}${Math.floor(Math.random() * 1000)}`,
      uploadedAt: new Date().toISOString(),
    };
    writeTable("idp_photo", [...rows, created]);
    return new IDPPhoto(created);
  }

  // Removes a photo. False if there is no such photo.
  static async deletePhoto(photoID: string): Promise<boolean> {
    const rows = readTable<IDPPhotoData>("idp_photo");
    const remaining = rows.filter((r) => r.photoID !== photoID);
    if (remaining.length === rows.length) return false;
    writeTable("idp_photo", remaining);
    return true;
  }
}
