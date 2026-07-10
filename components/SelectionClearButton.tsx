"use client";

import { useEffect, useState } from "react";
import { Eraser } from "lucide-react";
import { dictionary, type Locale } from "@/lib/i18n";

type Props = {
  locale: Locale;
};

export function SelectionClearButton({ locale }: Props) {
  const [visible, setVisible] = useState(false);
  const t = dictionary[locale];

  useEffect(() => {
    const update = () => {
      const selection = window.getSelection();
      setVisible(Boolean(selection && !selection.isCollapsed && selection.toString().trim().length > 0));
    };

    update();
    document.addEventListener("selectionchange", update);
    document.addEventListener("pointerup", update);
    document.addEventListener("keyup", update);

    return () => {
      document.removeEventListener("selectionchange", update);
      document.removeEventListener("pointerup", update);
      document.removeEventListener("keyup", update);
    };
  }, []);

  const clearSelection = () => {
    window.getSelection()?.removeAllRanges();
    setVisible(false);
  };

  return (
    <button
      type="button"
      className={`selection-clear-button${visible ? " is-visible" : ""}`}
      onClick={clearSelection}
      aria-label={t.selectionClearLabel}
      aria-hidden={!visible}
      tabIndex={visible ? 0 : -1}
    >
      <Eraser aria-hidden="true" />
      <span>{t.selectionClearLabel}</span>
    </button>
  );
}
