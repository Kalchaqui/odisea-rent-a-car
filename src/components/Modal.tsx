import { Icon } from "@stellar/design-system";

interface IModal {
  title: string;
  closeModal: () => void;
  children: React.ReactNode;
}

function Modal({ title, closeModal, children }: IModal) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm shadow-lg"
      data-test="modal-container"
      onClick={closeModal}
    >
      <div
        className="relative w-11/12 max-w-lg rounded-lg glass shadow-xl border border-purple-500/30 glow-purple"
        data-test="modal-outside-container"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between rounded-t p-4 md:p-5 border-b border-purple-500/30">
          <h3
            className="text-lg font-semibold text-purple-400 neon-text-purple"
            data-test="modal-title"
          >
            {title}
          </h3>
          <button
            type="button"
            className="end-2.5 ms-auto inline-flex h-8 w-8 items-center justify-center rounded-lg bg-transparent text-sm text-gray-400 hover:bg-purple-500/20 hover:text-purple-400 cursor-pointer transition-colors"
            data-test="modal-btn-close"
            onClick={closeModal}
          >
            <Icon.XClose className="h-5 w-5" />
            <span className="sr-only">Close modal</span>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default Modal;
