import m from "mithril";

// Define the interface for modal attributes
interface Modal {
  title?: string;
  contents?: () => m.Children;
  onDismiss?: () => void;
  buttons?: () => m.Children;
}

const Modal = (attrs: Modal): m.Component<Modal> => {
  let modal = null as null | HTMLIonModalElement;
  return {
    oncreate: ({ dom }) => {
      modal = dom as HTMLIonModalElement;
      modal.present(); // Show the modal on creation

      // Automatically close the modal and trigger `onDismiss` if provided
      modal.onDidDismiss();
    },
    view: ({ children }) => {
      return m("ion-modal", { id: "general-modal" }, [
        m("ion-header", [
          m("ion-toolbar", [
            m("ion-title", attrs.title || "Modal Title"),
            m("ion-buttons", { slot: "end" }, [
              m(
                "ion-button",
                {
                  onclick: () => {
                    if (modal) {
                      modal.setAttribute("inert", "true");
                      modal.dismiss(); // Close the modal
                    }
                  },
                },
                "Close"
              ),
            ]),
          ]),
        ]),
        m("ion-content", { class: "ion-padding" }, [
          m("div.modal-content", children[0] || "Default Content"), // Display modal content
          m("div.modal-buttons", children[1] || null), // Additional buttons if provided
        ]),
      ]);
    },
  };
};

export default Modal;
