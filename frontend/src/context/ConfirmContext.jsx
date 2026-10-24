import { createContext, useContext, useState, useRef } from "react";
import ConfirmDialog from "../components/admin/ConfirmDialog";

const ConfirmContext = createContext(null);

export const ConfirmProvider = ({ children }) => {
  const [dialogState, setDialogState] = useState({
    open: false,
    title: "",
    message: "",
    productName: "",
    productImage: "",
    confirmLabel: "Confirm",
    cancelLabel: "Cancel",
    variant: "danger",
    loading: false,
  });

  const resolverRef = useRef(null);
  const actionRef = useRef(null);

  const confirm = (options = {}) => {
    return new Promise((resolve) => {
      resolverRef.current = resolve;
      actionRef.current = options.onConfirm || null;

      setDialogState({
        open: true,
        title: options.title || "Confirm action",
        message: options.message || "This action cannot be undone.",
        productName: options.productName || "",
        productImage: options.productImage || "",
        confirmLabel: options.confirmLabel || "Confirm",
        cancelLabel: options.cancelLabel || "Cancel",
        variant: options.variant || "danger",
        loading: false,
      });
    });
  };

  const handleCancel = () => {
    if (dialogState.loading) return;
    setDialogState((prev) => ({ ...prev, open: false }));
    if (resolverRef.current) {
      resolverRef.current(false);
      resolverRef.current = null;
    }
  };

  const handleConfirm = async () => {
    if (actionRef.current) {
      try {
        setDialogState((prev) => ({ ...prev, loading: true }));
        await actionRef.current();
        setDialogState((prev) => ({ ...prev, open: false, loading: false }));
        if (resolverRef.current) {
          resolverRef.current(true);
          resolverRef.current = null;
        }
      } catch (err) {
        setDialogState((prev) => ({ ...prev, loading: false }));
        throw err;
      }
    } else {
      setDialogState((prev) => ({ ...prev, open: false }));
      if (resolverRef.current) {
        resolverRef.current(true);
        resolverRef.current = null;
      }
    }
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <ConfirmDialog
        open={dialogState.open}
        title={dialogState.title}
        message={dialogState.message}
        productName={dialogState.productName}
        productImage={dialogState.productImage}
        confirmLabel={dialogState.confirmLabel}
        cancelLabel={dialogState.cancelLabel}
        variant={dialogState.variant}
        loading={dialogState.loading}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </ConfirmContext.Provider>
  );
};

export const useConfirm = () => {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error("useConfirm must be used within a ConfirmProvider");
  }
  return context;
};
