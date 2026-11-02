"use client";

// Boundary: CreateIDPPg
// Feature: Create IDP (Interior Designer)
// Route: /designer/idp/create   (app/designer/idp/create/page.tsx shows this page)
//
// - Form for a new IDP: title, description, category, budget, photos (upload).
// - Category dropdown filled from active categories.
// - "Create" button that submits to CreateIDPController (through submitIDPAction).
//
// No business rules here: all checking is done by CreateIDPController.

import { useActionState } from "react";
import { submitIDPAction, type CreateIDPFormState } from "@/app/designer/idp/create/actions";

export type CategoryOption = { categoryID: number; name: string };

type Props = {
  categories: CategoryOption[];
  designerVerified: boolean;
};

const initialState: CreateIDPFormState = { status: "idle", messages: [] };

export default function CreateIDPPg({ categories, designerVerified }: Props) {
  const [state, submitIDP, isSubmitting] = useActionState(submitIDPAction, initialState);

  if (!designerVerified) {
    return displayErrorPg(["Only verified interior designers can create an IDP. Please wait for your account to be approved."]);
  }
  if (state.status === "success") {
    return displaySuccessPg(state.idpID!);
  }
  return displayCreateForm(categories);

  // ---- Boundary methods ----

  function displayCreateForm(categories: CategoryOption[]) {
    return (
      <main className="mx-auto w-full max-w-2xl px-4 py-10">
        <h1 className="text-2xl font-semibold">Create Interior Design Project</h1>
        <p className="mt-1 text-sm text-zinc-500">Share a project in your portfolio so customers can find you.</p>

        {state.status === "error" && <ErrorList messages={state.messages} />}

        <form key={state.attempt ?? 0} action={submitIDP} className="mt-6 flex flex-col gap-5">
          <Field label="Title" htmlFor="title">
            <input id="title" name="title" type="text" required maxLength={100} defaultValue={state.values?.title} className={inputClass} />
          </Field>

          <Field label="Description" htmlFor="description">
            <textarea
              id="description"
              name="description"
              required
              rows={5}
              maxLength={2000}
              defaultValue={state.values?.description}
              className={inputClass}
            />
          </Field>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Category" htmlFor="categoryID">
              <select id="categoryID" name="categoryID" required defaultValue={state.values?.categoryID ?? ""} className={inputClass}>
                <option value="" disabled>
                  Choose a style
                </option>
                {categories.map((category) => (
                  <option key={category.categoryID} value={category.categoryID}>
                    {category.name}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Budget (SGD, optional)" htmlFor="budget">
              <input id="budget" name="budget" type="number" min={0} step="any" defaultValue={state.values?.budget} className={inputClass} />
            </Field>
          </div>

          <Field label="Photos (1 to 10 images, JPG / PNG / WebP, max 5 MB each)" htmlFor="photos">
            <input
              id="photos"
              name="photos"
              type="file"
              multiple
              required
              accept="image/jpeg,image/png,image/webp"
              className="block w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-zinc-100 file:px-3 file:py-2 file:text-sm dark:file:bg-zinc-800 dark:file:text-zinc-100"
            />
          </Field>

          <button
            type="submit"
            disabled={isSubmitting}
            className="self-start rounded-md bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
          >
            {isSubmitting ? "Creating..." : "Create"}
          </button>
        </form>
      </main>
    );
  }

  function displaySuccessPg(idpID: number) {
    return (
      <main className="mx-auto w-full max-w-2xl px-4 py-10">
        <h1 className="text-2xl font-semibold">IDP created</h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">Your project has been saved (IDP #{idpID}).</p>
        {/* A full page load gives a fresh, empty form. */}
        <a href="/designer/idp/create" className="mt-6 inline-block text-sm font-medium underline">
          Create another IDP
        </a>
      </main>
    );
  }

  function displayErrorPg(messages: string[]) {
    return (
      <main className="mx-auto w-full max-w-2xl px-4 py-10">
        <h1 className="text-2xl font-semibold">Create Interior Design Project</h1>
        <ErrorList messages={messages} />
      </main>
    );
  }
}

// ---- Small layout helpers ----

const inputClass =
  "w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900";

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

function ErrorList({ messages }: { messages: string[] }) {
  return (
    <div role="alert" className="mt-6 rounded-md border border-red-300 bg-red-50 p-4 text-sm text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200">
      <ul className="list-disc pl-5">
        {messages.map((message) => (
          <li key={message}>{message}</li>
        ))}
      </ul>
    </div>
  );
}
