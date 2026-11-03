// Boundary helper: IDPFormFields
// The form fields shared by IDCreateIDPPg (Create IDP) and IDUpdateIDPPg (Update IDP):
// title, description, status, style, category, property type, budget.
// Also holds small UI helpers both pages use. No business rules here.
"use client";

import type { NewPhotoUpload, UpdateFormData, UpdateIDPInput } from "@/controller/IDUpdateIDPController";

// What the form holds while the designer types. Budget stays text until it is submitted.
export type IDPFormValues = Omit<UpdateIDPInput, "budget"> & { budget: string };

export function toIDPInput(values: IDPFormValues): UpdateIDPInput {
  return { ...values, budget: values.budget.trim() === "" ? NaN : Number(values.budget) };
}

export default function IDPFormFields({
  values,
  onChange,
  formData,
}: {
  values: IDPFormValues;
  onChange: (values: IDPFormValues) => void;
  formData: UpdateFormData;
}) {
  const set = (field: keyof IDPFormValues, value: string) => onChange({ ...values, [field]: value });

  // Changing the category also resets the property type if it no longer fits.
  const changeCategory = (category: string) => {
    const types = formData.propertyTypesByCategory[category] ?? [];
    onChange({ ...values, category, propertyType: types.includes(values.propertyType) ? values.propertyType : types[0] });
  };

  return (
    <>
      <Field label="Title" htmlFor="title">
        <input id="title" value={values.title} onChange={(e) => set("title", e.target.value)} className={inputClass} />
      </Field>

      <Field label="Description" htmlFor="description">
        <textarea
          id="description"
          rows={4}
          value={values.description}
          onChange={(e) => set("description", e.target.value)}
          className={inputClass}
        />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Status" htmlFor="status">
          <select id="status" value={values.status} onChange={(e) => set("status", e.target.value)} className={inputClass}>
            {formData.statuses.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Style" htmlFor="style">
          <select id="style" value={values.style} onChange={(e) => set("style", e.target.value)} className={inputClass}>
            {formData.styles.map((style) => (
              <option key={style}>{style}</option>
            ))}
          </select>
        </Field>

        <Field label="Category" htmlFor="category">
          <select id="category" value={values.category} onChange={(e) => changeCategory(e.target.value)} className={inputClass}>
            {formData.categories.map((category) => (
              <option key={category}>{category}</option>
            ))}
          </select>
        </Field>

        <Field label="Property type" htmlFor="propertyType">
          <select
            id="propertyType"
            value={values.propertyType}
            onChange={(e) => set("propertyType", e.target.value)}
            className={inputClass}
          >
            {(formData.propertyTypesByCategory[values.category] ?? []).map((type) => (
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
            value={values.budget}
            onChange={(e) => set("budget", e.target.value)}
            className={inputClass}
          />
        </Field>
      </div>
    </>
  );
}

export function ErrorList({ messages }: { messages: string[] }) {
  if (messages.length === 0) return null;
  return (
    <div role="alert" className="mt-6 rounded border border-red-300 bg-red-50 p-4 text-sm text-red-800">
      <ul className="list-disc pl-5">
        {messages.map((message) => (
          <li key={message}>{message}</li>
        ))}
      </ul>
    </div>
  );
}

export function UploadPhotosButton({ onFiles, label }: { onFiles: (files: FileList | null) => void; label: string }) {
  return (
    <label className="mt-3 inline-block cursor-pointer rounded border px-4 py-2 text-sm">
      {label}
      <input
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        onChange={(e) => {
          onFiles(e.target.files);
          e.target.value = "";
        }}
      />
    </label>
  );
}

export function NewPhotoCard({ photo, onRemove }: { photo: NewPhotoUpload; onRemove: () => void }) {
  return (
    <li className="rounded border border-dashed border-green-500 p-2">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={photo.dataURL} alt={photo.fileName} className="aspect-[8/5] w-full rounded object-cover" />
      <div className="mt-1 flex items-center justify-between gap-2 text-xs">
        <span className="truncate text-green-700">New: {photo.fileName}</span>
        <button type="button" onClick={onRemove} className="shrink-0 underline">
          Remove
        </button>
      </div>
    </li>
  );
}

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
export async function preparePhoto(file: File): Promise<NewPhotoUpload> {
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
