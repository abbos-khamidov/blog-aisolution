"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { dictionary, type Locale } from "@/lib/i18n";

type Props = {
  locale: Locale;
};

const MARK_SELECTOR = "[data-aisolution-selection-mark='true']";

function hasMarkedSelection() {
  return document.querySelector(MARK_SELECTOR) !== null;
}

function unwrapMarks() {
  document.querySelectorAll(MARK_SELECTOR).forEach((node) => {
    const parent = node.parentNode;
    if (!parent) return;

    while (node.firstChild) {
      parent.insertBefore(node.firstChild, node);
    }

    parent.removeChild(node);
  });
}

function selectionInsideControl(selection: Selection) {
  const anchor = selection.anchorNode;
  const focus = selection.focusNode;
  const anchorElement = anchor instanceof Element ? anchor : anchor?.parentElement;
  const focusElement = focus instanceof Element ? focus : focus?.parentElement;

  return Boolean(
    anchorElement?.closest(".selection-clear-button") || focusElement?.closest(".selection-clear-button")
  );
}

export function SelectionClearButton({ locale }: Props) {
  const t = dictionary[locale];
  const [mounted, setMounted] = useState(false);
  const [active, setActive] = useState(false);

  useEffect(() => {
    setMounted(true);
    setActive(hasMarkedSelection());

    const commitSelection = () => {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return;
      if (!selection.toString().trim()) return;
      if (selectionInsideControl(selection)) return;

      const range = selection.getRangeAt(0);
      const wrapper = document.createElement("span");
      wrapper.dataset.aisolutionSelectionMark = "true";
      wrapper.className = "selection-mark";

      try {
        wrapper.appendChild(range.extractContents());
        range.insertNode(wrapper);
        selection.removeAllRanges();
        setActive(true);
      } catch {
        // If the selection cannot be wrapped cleanly, leave the browser's
        // native selection intact instead of breaking the page.
        setActive(selection.toString().trim().length > 0 || hasMarkedSelection());
      }
    };

    const syncActive = () => {
      setActive(hasMarkedSelection());
    };

    document.addEventListener("mouseup", commitSelection);
    document.addEventListener("pointerup", commitSelection);
    document.addEventListener("keyup", commitSelection);
    document.addEventListener("selectionchange", syncActive);

    return () => {
      document.removeEventListener("mouseup", commitSelection);
      document.removeEventListener("pointerup", commitSelection);
      document.removeEventListener("keyup", commitSelection);
      document.removeEventListener("selectionchange", syncActive);
    };
  }, []);

  const clearSelection = () => {
    unwrapMarks();
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
