"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { dictionary, type Locale } from "@/lib/i18n";

type Props = {
  locale: Locale;
};

export function SelectionClearButton({ locale }: Props) {
  const t = dictionary[locale];
  const [mounted, setMounted] = useState(false);
  const [active, setActive] = useState(false);

  useEffect(() => {
    setMounted(true);

    const update = () => {
      const selection = window.getSelection();
      setActive(Boolean(selection && !selection.isCollapsed && selection.toString().trim().length > 0));
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
    setActive(false);
  };

  if (!mounted) return null;

  return createPortal(
    <button
      type="button"
      className={`selection-clear-button${active ? " is-active" : ""}`}
      onClick={clearSelection}
      onMouseDown={(event) => event.preventDefault()}
      aria-label={t.selectionClearLabel}
      title={t.selectionClearLabel}
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
    </button>,
    document.body
  );
}
