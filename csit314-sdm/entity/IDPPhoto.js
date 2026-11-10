// Entity: IDPPhoto
// Photos belonging to an IDP.
// Used by: Create / Edit / View IDP, View Favourites List
//
// Database table: idp_photo
//
// Attributes:
// - photoID, idpID, photoURL, caption, sortOrder, uploadedAt
//
// Methods:
// - addPhoto(photo)
// - getPhotos(idpID)                                    ordered by sortOrder, first is the main photo
// - getMainPhotos(idpIDs)                               Map idpID -> main photoURL, for lists
// - deletePhoto(photoID)
//
// photoURL is a data: URL while the data lives in the browser (LocalStore).
import { readTable, writeTable } from "./LocalStore";

export class IDPPhoto {
  photoID;
  idpID;
  photoURL;
  caption;
  sortOrder;
  uploadedAt;

  constructor(data) {
    Object.assign(this, data);
  }

  static async getPhotos(idpID) {
    return readTable("idp_photo")
      .filter((r) => r.idpID === idpID)
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((r) => new IDPPhoto(r));
  }

  // Main photo (lowest sortOrder) of each of the given IDPs, read in one pass:
  // Map of idpID -> photoURL. IDPs without photos are left out.
  static async getMainPhotos(idpIDs) {
    const wanted = new Set(idpIDs);
    const main = new Map();
    for (const r of readTable("idp_photo")) {
      if (!wanted.has(r.idpID)) continue;
      const current = main.get(r.idpID);
      if (!current || r.sortOrder < current.sortOrder) main.set(r.idpID, r);
    }
    return new Map([...main].map(([idpID, photo]) => [idpID, photo.photoURL]));
  }

  // Saves a new photo and returns it with its new photoID and uploadedAt.
  static async addPhoto(photo) {
    const rows = readTable("idp_photo");
    const created = {
      ...photo,
      photoID: `P${Date.now()}${Math.floor(Math.random() * 1000)}`,
      uploadedAt: new Date().toISOString(),
    };
    writeTable("idp_photo", [...rows, created]);
    return new IDPPhoto(created);
  }

  // Removes a photo. False if there is no such photo.
  static async deletePhoto(photoID) {
    const rows = readTable("idp_photo");
    const remaining = rows.filter((r) => r.photoID !== photoID);
    if (remaining.length === rows.length) return false;
    writeTable("idp_photo", remaining);
    return true;
  }
}
