"use server";

// Server Action for Create IDP.
// Runs on the server. It turns the form data from CreateIDPPg (boundary) into normal
// values and passes them to CreateIDPController. It contains no business rules.

import { CreateIDPController, type PhotoUpload } from "@/controller/CreateIDPController";
import { getLoggedInAccountID } from "@/lib/session";

export type CreateIDPFormState = {
  status: "idle" | "success" | "error";
  messages: string[];
  idpID?: number;
  attempt?: number; // counts submits, so the form can redraw with the kept values
  // What the user typed, so the form keeps it after an error.
  values?: { title: string; description: string; categoryID: string; budget: string };
};

export async function submitIDPAction(prev: CreateIDPFormState, formData: FormData): Promise<CreateIDPFormState> {
  const title = String(formData.get("title") ?? "");
  const description = String(formData.get("description") ?? "");
  const categoryText = String(formData.get("categoryID") ?? "");
  const budgetText = String(formData.get("budget") ?? "").trim();

  const files = formData.getAll("photos").filter((f): f is File => f instanceof File && f.size > 0);
  const photos: PhotoUpload[] = await Promise.all(
    files.map(async (file) => ({
      fileName: file.name,
      mimeType: file.type,
      size: file.size,
      data: new Uint8Array(await file.arrayBuffer()),
    }))
  );

  const result = new CreateIDPController().createIDP(
    getLoggedInAccountID(),
    title,
    description,
    categoryText === "" ? null : Number(categoryText),
    budgetText === "" ? null : Number(budgetText),
    photos
  );

  if (result.success) return { status: "success", messages: [], idpID: result.idpID };
  return {
    status: "error",
    messages: result.errors ?? [],
    attempt: (prev.attempt ?? 0) + 1,
    values: { title, description, categoryID: categoryText, budget: budgetText },
  };
}
