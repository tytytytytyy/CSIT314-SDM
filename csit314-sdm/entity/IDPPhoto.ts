// Entity: IDPPhoto
// Photos belonging to an IDP.
// Used by: Create / Update / View IDP, View Favourites List
//
// Database table: idp_photo
// Image files are saved in public/uploads/idp/ and the table stores their URL.
//
// Still to implement (by the features that need them):
// - deletePhoto(photoID)

import { getDb, nowISO } from "@/lib/db";
import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";

const FILE_EXTENSIONS: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

function uploadDir(): string {
  return process.env.UPLOAD_DIR ?? path.join(process.cwd(), "public", "uploads", "idp");
}

export class IDPPhoto {
  photoID: number;
  idpID: number;
  photoURL: string;
  caption: string | null;
  sortOrder: number;
  uploadedAt: string;

  constructor(data: Partial<IDPPhoto> = {}) {
    this.photoID = data.photoID ?? 0;
    this.idpID = data.idpID ?? 0;
    this.photoURL = data.photoURL ?? "";
    this.caption = data.caption ?? null;
    this.sortOrder = data.sortOrder ?? 0;
    this.uploadedAt = data.uploadedAt ?? "";
  }

  // Saves the image file to disk, then saves its record. Returns the saved photo.
  addPhoto(photo: IDPPhoto, fileData: Uint8Array, mimeType: string): IDPPhoto {
    const fileName = `${randomUUID()}${FILE_EXTENSIONS[mimeType] ?? ""}`;
    fs.mkdirSync(uploadDir(), { recursive: true });
    fs.writeFileSync(path.join(uploadDir(), fileName), fileData);

    const photoURL = `/uploads/idp/${fileName}`;
    const now = nowISO();
    const result = getDb()
      .prepare(
        `INSERT INTO idp_photo (idpID, photoURL, caption, sortOrder, uploadedAt)
         VALUES (?, ?, ?, ?, ?)`
      )
      .run(photo.idpID, photoURL, photo.caption, photo.sortOrder, now);
    return new IDPPhoto({ ...photo, photoID: Number(result.lastInsertRowid), photoURL, uploadedAt: now });
  }

  // All photos of an IDP, in display order.
  getPhotos(idpID: number): IDPPhoto[] {
    const rows = getDb()
      .prepare("SELECT * FROM idp_photo WHERE idpID = ? ORDER BY sortOrder")
      .all(idpID) as IDPPhoto[];
    return rows.map((row) => new IDPPhoto(row));
  }
}
