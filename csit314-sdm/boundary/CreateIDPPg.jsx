"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { CreateIDPController } from "@/controller/CreateIDPController";
import { EditIDPController } from "@/controller/EditIDPController";
import { SessionController } from "@/controller/SessionController";
import IDPFormFields, {
  ErrorList,
  NewPhotoCard,
  UploadPhotosButton,
  preparePhoto,
  toIDPInput,
} from "@/boundary/IDPFormFields";
import BackButton from "@/boundary/BackButton";

export default function CreateIDPPg() {
  const router = useRouter();
  const [formData, setFormData] = useState(null);
  const [values, setValues] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [errors, setErrors] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

  const displayCreateForm = (data) => {
    const category = data.categories[0];
    setValues({
      title: "",
      description: "",
      style: data.styles[0],
      category,
      propertyType: data.propertyTypesByCategory[category][0],
      budget: "",
      status: "completed",
    });
    setFormData(data);
  };
  const displayErrorMsg = (messages) => {
    setErrors(messages);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const displaySuccessPg = (idpID) =>
    router.push(`/designer/idp/${idpID}?created=1`);

  const submitIDP = async () => {
    if (!values) return;
    setIsSaving(true);
    const result = await CreateIDPController.createIDP(
      SessionController.getLoggedInDesignerID(),
      toIDPInput(values),
      photos,
    );
    setIsSaving(false);
    if (result.success && result.idpID) displaySuccessPg(result.idpID);
    else displayErrorMsg(result.errors);
  };

  useEffect(() => {
    // Designer clicks "Create IDP" -> the page asks the controller for the dropdown choices.
    const load = async () => {
      displayCreateForm(CreateIDPController.getCreateFormData());
    };
    load();
  }, []);

  if (!formData || !values) return <p className="p-8">Loading...</p>;

  const addFiles = async (files) => {
    if (!files) return;
    const prepared = await Promise.all(Array.from(files).map(preparePhoto));
    setPhotos((current) => [...current, ...prepared]);
  };

  return (
    <main className="mx-auto w-full max-w-3xl p-8">
      <BackButton fallbackHref="/designer/idp" />
      <p className="text-sm text-zinc-500">My Projects</p>
      <h1 className="text-3xl font-semibold">Create IDP</h1>

      <ErrorList messages={errors} />

      <form
        className="mt-6 flex flex-col gap-5"
        onSubmit={(event) => {
          event.preventDefault();
          submitIDP();
        }}
      >
        <IDPFormFields
          values={values}
          onChange={setValues}
          formData={formData}
        />

        <section>
          <p className="text-sm font-medium">
            Photos ({photos.length} of {EditIDPController.MAX_PHOTOS_PER_IDP}
            ). The first photo is the main photo.
          </p>
          {photos.length > 0 && (
            <ul className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {photos.map((photo, index) => (
                <NewPhotoCard
                  key={index}
                  photo={photo}
                  onRemove={() =>
                    setPhotos((current) =>
                      current.filter((_, i) => i !== index),
                    )
                  }
                />
              ))}
            </ul>
          )}
          <UploadPhotosButton
            label={photos.length === 0 ? "Upload photos" : "Upload more photos"}
            onFiles={addFiles}
          />
        </section>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={isSaving}
            className="btn btn-primary"
          >
            {isSaving ? "Creating..." : "Create IDP"}
          </button>
          <Link href="/designer/idp" className="btn">
            Cancel
          </Link>
        </div>
      </form>
    </main>
  );
}
