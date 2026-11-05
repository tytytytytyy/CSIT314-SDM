// Boundary helper: StatusBadge
// Small coloured label for an IDP's status, shared by the designer pages.
// The wording comes from IDViewIDPDetailsController.getStatusLabel.
import { IDViewIDPDetailsController } from "@/controller/IDViewIDPDetailsController";

export default function StatusBadge({ status }) {
  return (
    <span
      className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${
        status === "completed"
          ? "bg-green-100 text-green-800"
          : "bg-amber-100 text-amber-800"
      }`}
    >
      {IDViewIDPDetailsController.getStatusLabel(status)}
    </span>
  );
}
