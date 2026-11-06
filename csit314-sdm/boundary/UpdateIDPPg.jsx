// Boundary: UpdateIDPPg
// Feature: Update IDP (Interior Designer)
// Opened with the "Edit IDP" button on IDViewIDPDetailsPg.
//
// Route: /designer/idp/[idpID]/edit   (app/designer/idp/[idpID]/edit/page.jsx renders this)
//
// What goes here:
// - Form filled with the IDP's current values (fields shared with Create IDP: IDPFormFields).
// - Current photos with a Remove / Undo button each.
// - Upload more photos (they are shrunk in the browser before saving, to save space).
// - "Save changes" submits to UpdateIDPController; "Cancel" goes back without saving.
// - No business rules here: all checking is done by UpdateIDPController.
//
// Methods:
// - displayUpdateForm(idpDetails, formData)
// - submitUpdate()
// - displaySuccessPg()               goes back to the details page with an "IDP updated" message
// - displayErrorMsg(errors)          e.g. "Title is required", "At least one photo is required"
// - displayErrorPg(message)          "IDP not found" or "You can only update your own IDPs"
//
// Attributes: none
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { UpdateIDPController } from "@/controller/UpdateIDPController";
import { SessionController } from "@/controller/SessionController";
import IDPFormFields, {
  ErrorList,
  NewPhotoCard,
  UploadPhotosButton,
  preparePhoto,
  toIDPInput,
} from "@/boundary/IDPFormFields";

export default function UpdateIDPPg({ idpID }) {
  const router = useRouter();
  const [view, setView] = useState({ kind: "loading" });
  const [values, setValues] = useState(null);
  const [removedPhotoIDs, setRemovedPhotoIDs] = useState([]);
  const [newPhotos, setNewPhotos] = useState([]);
  const [errors, setErrors] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

  const displayUpdateForm = (idpDetails, formData) => {
    const { idp } = idpDetails;
    setValues({
      title: idp.title,
      description: idp.description,
      style: idp.style,
      propertyType: idp.propertyType,
      category: idp.category,
      budget: String(idp.budget),
      status: idp.status,
    });
    setView({ kind: "form", details: idpDetails, formData });
  };
  const displayErrorPg = (message) => setView({ kind: "error", message });
  const displayErrorMsg = (messages) => {
    setErrors(messages);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const displaySuccessPg = () =>
    router.push(`/designer/idp/${idpID}?updated=1`);

  const submitUpdate = async () => {
    if (!values) return;
    setIsSaving(true);
    const result = await UpdateIDPController.updateIDP(
      SessionController.getLoggedInDesignerID(),
      idpID,
      toIDPInput(values),
      removedPhotoIDs,
      newPhotos,
    );
    setIsSaving(false);
    if (result.success) displaySuccessPg();
    else displayErrorMsg(result.errors);
  };

  useEffect(() => {
    // Designer clicks "Edit IDP" -> the page asks the controller for the current values.
    const load = async () => {
      const result = await UpdateIDPController.getIDPForUpdate(
        SessionController.getLoggedInDesignerID(),
        idpID,
      );
      if (result.status === "ok" && result.details) {
        displayUpdateForm(
          result.details,
          UpdateIDPController.getUpdateFormData(),
        );
      } else if (result.status === "notOwner")
        displayErrorPg("You can only update your own IDPs");
      else displayErrorPg("IDP not found");
    };
    load();
  }, [idpID]);

  if (view.kind === "loading" || (view.kind === "form" && !values))
    return <p className="p-8">Loading...</p>;
  if (view.kind === "error")
    return <p className="p-8 text-red-600">{view.message}</p>;

  const { details, formData } = view;

  const toggleRemove = (photoID) =>
    setRemovedPhotoIDs((ids) =>
      ids.includes(photoID)
        ? ids.filter((id) => id !== photoID)
        : [...ids, photoID],
    );

  const addFiles = async (files) => {
    if (!files) return;
    const prepared = await Promise.all(Array.from(files).map(preparePhoto));
    setNewPhotos((photos) => [...photos, ...prepared]);
  };

  const photoCount =
    details.photos.length - removedPhotoIDs.length + newPhotos.length;

  return (
    <main className="mx-auto w-full max-w-3xl p-8">
      <p className="text-sm text-zinc-500">My Project #{idpID}</p>
      <h1 className="text-3xl font-semibold">Edit IDP</h1>

      <ErrorList messages={errors} />

      <form
        className="mt-6 flex flex-col gap-5"
        onSubmit={(event) => {
          event.preventDefault();
          submitUpdate();
        }}
      >
        <IDPFormFields
          values={values}
          onChange={setValues}
          formData={formData}
        />

        <section>
          <p className="text-sm font-medium">
            Photos ({photoCount} of {UpdateIDPController.MAX_PHOTOS_PER_IDP})
          </p>
          <ul className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {details.photos.map((photo) => {
              const removed = removedPhotoIDs.includes(photo.photoID);
              return (
                <li key={photo.photoID} className="rounded border p-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photo.photoURL}
                    alt={photo.caption}
                    className={`aspect-[8/5] w-full rounded object-cover ${removed ? "opacity-30" : ""}`}
                  />
                  <div className="mt-1 flex items-center justify-between gap-2 text-xs">
                    <span className="truncate">
                      {removed ? "Will be removed" : photo.caption}
                    </span>
                    <button
                      type="button"
                      onClick={() => toggleRemove(photo.photoID)}
                      className="shrink-0 underline"
                    >
                      {removed ? "Undo" : "Remove"}
                    </button>
                  </div>
                </li>
              );
            })}
            {newPhotos.map((photo, index) => (
              <NewPhotoCard
                key={index}
                photo={photo}
                onRemove={() =>
                  setNewPhotos((photos) => photos.filter((_, i) => i !== index))
                }
              />
            ))}
          </ul>
          <UploadPhotosButton label="Upload more photos" onFiles={addFiles} />
        </section>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={isSaving}
            className="rounded bg-zinc-900 px-5 py-2 text-white disabled:opacity-50"
          >
            {isSaving ? "Saving..." : "Save changes"}
          </button>
          <Link
            href={`/designer/idp/${idpID}`}
            className="rounded border px-5 py-2"
          >
            Cancel
          </Link>
        </div>
      </form>
    </main>
  );
}
