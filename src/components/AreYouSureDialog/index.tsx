import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { ReactNode } from "react";

interface AreYouSureDialogProps {
  open: boolean;
  loading: boolean;
  description: ReactNode;
  callToActionLabel: ReactNode;
  onClose: VoidFunction;
  onCallToAction: VoidFunction;
}

export default function AreYouSureDialog({
  open,
  loading,
  description,
  callToActionLabel,
  onClose,
  onCallToAction,
}: AreYouSureDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      transition
      className="fixed inset-0 flex w-screen items-center justify-center bg-base-content/30 p-4 transition duration-300 ease-out data-[closed]:opacity-0 z-50"
    >
      <div className="modal modal-bottom sm:modal-middle modal-open">
        <DialogPanel className="modal-box">
          <DialogTitle className="font-bold text-lg mb-6">
            Are you sure?
          </DialogTitle>
          <p className="py-4">{description}</p>
          <div className="modal-action">
            <button
              className="btn btn-ghost"
              disabled={loading}
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              className="btn btn-primary"
              disabled={loading}
              onClick={onCallToAction}
            >
              {callToActionLabel}
            </button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
