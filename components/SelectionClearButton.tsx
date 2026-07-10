"use client";

import { useEffect, useState } from "react";
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
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
        <path
          d="M5 15.5 12.4 8l6.6 6.5-4.4 4.5H9.1L5 15.5Z"
          fill="currentColor"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinejoin="round"
        />
        <path d="M11.8 8.2 15.4 4.5 20 9.1l-3.6 3.6" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" />
      </svg>
      <span>{t.selectionClearLabel}</span>
    </button>
  );
}
