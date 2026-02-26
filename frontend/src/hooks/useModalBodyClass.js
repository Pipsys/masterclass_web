import { useEffect } from "react";

export default function useModalBodyClass(isOpen) {
  useEffect(() => {
    if (!isOpen) return undefined;

    const body = document.body;
    const current = Number(body.dataset.modalCount || "0");
    const next = current + 1;
    body.dataset.modalCount = String(next);
    body.classList.add("modal-open");

    return () => {
      const value = Number(body.dataset.modalCount || "1");
      const updated = Math.max(0, value - 1);
      if (updated === 0) {
        body.classList.remove("modal-open");
        delete body.dataset.modalCount;
      } else {
        body.dataset.modalCount = String(updated);
      }
    };
  }, [isOpen]);
}

