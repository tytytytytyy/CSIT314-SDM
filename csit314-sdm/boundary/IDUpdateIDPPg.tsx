// Boundary: IDUpdateIDPPg
// Feature: Update IDP (Interior Designer)
// Opened with the "Edit IDP" button on IDViewIDPDetailsPg.
//
// Route: /designer/idp/[idpID]/edit   (app/designer/idp/[idpID]/edit/page.tsx renders this)
//
// What goes here:
// - Form filled with the IDP's current values: title, description, style, category,
//   property type (only the types for the chosen category), budget, status.
// - Current photos with a Remove / Undo button each.
// - Upload more photos (they are shrunk in the browser before saving, to save space).
// - "Save changes" submits to IDUpdateIDPController; "Cancel" goes back without saving.
// - No business rules here: all checking is done by IDUpdateIDPController.
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
import {
  IDUpdateIDPController,
  type NewPhotoUpload,
  type UpdateFormData,
  type UpdateIDPInput,
} from "@/controller/IDUpdateIDPController";
import type { IDPDetails } from "@/controller/IDViewIDPDetailsController";
import { SessionController } from "@/controller/SessionController";

type View =
  | { kind: "loading" }
  | { kind: "form"; details: IDPDetails; formData: UpdateFormData }
  | { kind: "error"; message: string };

type FormValues = Omit<UpdateIDPInput, "budget"> & { budget: string };

export default function IDUpdateIDPPg({ idpID }: { idpID: number }) {
  const router = useRouter();
  const [view, setView] = useState<View>({ kind: "loading" });
  const [values, setValues] = useState<FormValues | null>(null);
  const [removedPhotoIDs, setRemovedPhotoIDs] = useState<string[]>([]);
  const [newPhotos, setNewPhotos] = useState<NewPhotoUpload[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const displayUpdateForm = (idpDetails: IDPDetails, formData: UpdateFormData) => {
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
  const displayErrorPg = (message: string) => setView({ kind: "error", message });
  const displayErrorMsg = (messages: string[]) => {
    setErrors(messages);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const displaySuccessPg = () => router.push(`/designer/idp/${idpID}?updated=1`);

  const submitUpdate = async () => {
    if (!values) return;
    setIsSaving(true);
    const result = await IDUpdateIDPController.updateIDP(
      SessionController.getLoggedInDesignerID(),
      idpID,
      { ...values, budget: values.budget.trim() === "" ? NaN : Number(values.budget) },
      removedPhotoIDs,
      newPhotos
    );
    setIsSaving(false);
    if (result.success) displaySuccessPg();
    else displayErrorMsg(result.errors);
  };

  useEffect(() => {
    // Designer clicks "Edit IDP" -> the page asks the controller for the current values.
    const load = async () => {
      const result = await IDUpdateIDPController.getIDPForUpdate(SessionController.getLoggedInDesignerID(), idpID);
      if (result.status === "ok" && result.details) {
        displayUpdateForm(result.details, IDUpdateIDPController.getUpdateFormData());
      } else if (result.status === "notOwner") displayErrorPg("You can only update your own IDPs");
      else displayErrorPg("IDP not found");
    };
    load();
  }, [idpID]);

  if (view.kind === "loading" || (view.kind === "form" && !values)) return <p className="p-8">Loading...</p>;
  if (view.kind === "error") return <p className="p-8 text-red-600">{view.message}</p>;

  const { details, formData } = view;
  const form = values!;
  const set = (field: keyof FormValues, value: string) => setValues({ ...form, [field]: value });

  // Changing the category also resets the property type if it no longer fits.
  const changeCategory = (category: string) => {
    const types = formData.propertyTypesByCategory[category] ?? [];
    setValues({ ...form, category, propertyType: types.includes(form.propertyType) ? form.propertyType : types[0] });
  };

  const toggleRemove = (photoID: string) =>
    setRemovedPhotoIDs((ids) => (ids.includes(photoID) ? ids.filter((id) => id !== photoID) : [...ids, photoID]));

  const addFiles = async (files: FileList | null) => {
    if (!files) return;
    const prepared = await Promise.all(Array.from(files).map(preparePhoto));
    setNewPhotos((photos) => [...photos, ...prepared]);
  };

  const photoCount = details.photos.length - removedPhotoIDs.length + newPhotos.length;

  return (
    <main className="mx-auto w-full max-w-3xl p-8">
      <p className="text-sm text-zinc-500">My IDP #{idpID}</p>
      <h1 className="text-3xl font-semibold">Edit IDP</h1>

      {errors.length > 0 && (
        <div role="alert" className="mt-6 rounded border border-red-300 bg-red-50 p-4 text-sm text-red-800">
          <ul className="list-disc pl-5">
            {errors.map((message) => (
              <li key={message}>{message}</li>
            ))}
          </ul>
        </div>
      )}

      <form
        className="mt-6 flex flex-col gap-5"
        onSubmit={(event) => {
          event.preventDefault();
          submitUpdate();
        }}
      >
        <Field label="Title" htmlFor="title">
          <input id="title" value={form.title} onChange={(e) => set("title", e.target.value)} className={inputClass} />
        </Field>

        <Field label="Description" htmlFor="description">
          <textarea
            id="description"
            rows={4}
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            className={inputClass}
          />
        </Field>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Status" htmlFor="status">
            <select id="status" value={form.status} onChange={(e) => set("status", e.target.value)} className={inputClass}>
              {formData.statuses.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Style" htmlFor="style">
            <select id="style" value={form.style} onChange={(e) => set("style", e.target.value)} className={inputClass}>
              {formData.styles.map((style) => (
                <option key={style}>{style}</option>
              ))}
            </select>
          </Field>

          <Field label="Category" htmlFor="category">
            <select id="category" value={form.category} onChange={(e) => changeCategory(e.target.value)} className={inputClass}>
              {formData.categories.map((category) => (
                <option key={category}>{category}</option>
              ))}
            </select>
          </Field>

          <Field label="Property type" htmlFor="propertyType">
            <select
              id="propertyType"
              value={form.propertyType}
              onChange={(e) => set("propertyType", e.target.value)}
              className={inputClass}
            >
              {(formData.propertyTypesByCategory[form.category] ?? []).map((type) => (
                <option key={type}>{type}</option>
              ))}
            </select>
          </Field>

          <Field label="Budget (SGD)" htmlFor="budget">
            <input
              id="budget"
              type="number"
              min={1}
              step="any"
              value={form.budget}
              onChange={(e) => set("budget", e.target.value)}
              className={inputClass}
            />
          </Field>
        </div>

        <section>
          <p className="text-sm font-medium">
            Photos ({photoCount} of {IDUpdateIDPController.MAX_PHOTOS_PER_IDP})
          </p>
          <ul className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {details.photos.map((photo) => {
              const removed = removedPhotoIDs.includes(photo.photoID);
              return (
                <li key={photo.photoID} className="rounded border p-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photo.photoURL} alt={photo.caption} className={`aspect-[8/5] w-full rounded object-cover ${removed ? "opacity-30" : ""}`} />
                  <div className="mt-1 flex items-center justify-between gap-2 text-xs">
                    <span className="truncate">{removed ? "Will be removed" : photo.caption}</span>
                    <button type="button" onClick={() => toggleRemove(photo.photoID)} className="shrink-0 underline">
                      {removed ? "Undo" : "Remove"}
                    </button>
                  </div>
                </li>
              );
            })}
            {newPhotos.map((photo, index) => (
              <li key={index} className="rounded border border-dashed border-green-500 p-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photo.dataURL} alt={photo.fileName} className="aspect-[8/5] w-full rounded object-cover" />
                <div className="mt-1 flex items-center justify-between gap-2 text-xs">
                  <span className="truncate text-green-700">New: {photo.fileName}</span>
                  <button
                    type="button"
                    onClick={() => setNewPhotos((photos) => photos.filter((_, i) => i !== index))}
                    className="shrink-0 underline"
                  >
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>
          <label className="mt-3 inline-block cursor-pointer rounded border px-4 py-2 text-sm">
            Upload more photos
            <input
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              onChange={(e) => {
                addFiles(e.target.files);
                e.target.value = "";
              }}
            />
          </label>
        </section>

        <div className="flex gap-3">
          <button type="submit" disabled={isSaving} className="rounded bg-zinc-900 px-5 py-2 text-white disabled:opacity-50">
            {isSaving ? "Saving..." : "Save changes"}
          </button>
          <Link href={`/designer/idp/${idpID}`} className="rounded border px-5 py-2">
            Cancel
          </Link>
        </div>
      </form>
    </main>
  );
}

// ---- Helpers (UI only) ----

const inputClass = "w-full rounded border border-zinc-300 bg-white px-3 py-2 text-sm text-black";

function Field({ label, htmlFor, children }: { label: string; htmlFor: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-sm font-medium">
        {label}
      </label>
      {children}
    </div>
  );
}

// Shrinks an image to at most 1280px wide/high as a JPEG, so it fits in browser storage.
// Files that are not images are passed through unchanged, so the controller can reject them.
async function preparePhoto(file: File): Promise<NewPhotoUpload> {
  const original = await new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.readAsDataURL(file);
  });
  if (!file.type.startsWith("image/")) return { fileName: file.name, dataURL: original };

  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = original;
    });
    const scale = Math.min(1, 1280 / Math.max(image.width, image.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(image.width * scale);
    canvas.height = Math.round(image.height * scale);
    const context = canvas.getContext("2d")!;
    context.fillStyle = "#fff"; // white behind transparent PNGs
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    return { fileName: file.name, dataURL: canvas.toDataURL("image/jpeg", 0.8) };
  } catch {
    return { fileName: file.name, dataURL: original };
  }
}
