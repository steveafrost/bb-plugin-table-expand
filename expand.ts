// Click a markdown table in the timeline to open it full width in a modal
// <dialog>. bb renders markdown tables as
//   [data-markdown-preview] div.my-2.flex > div.overflow-x-auto > table
// We tag each such table, show a small expand button on hover, and open a
// clone of the table in a top-layer dialog on click (Esc/backdrop closes).

const TABLE = "[data-markdown-preview] div.overflow-x-auto > table";
const TAGGED = "data-te-table";
const BUTTON = "data-te-button";

function isInteractive(target: EventTarget | null): boolean {
  return target instanceof Element && !!target.closest("a, button, input, summary, [role='button']");
}

function hasSelection(): boolean {
  const sel = window.getSelection();
  return !!sel && !sel.isCollapsed && sel.toString().trim().length > 0;
}

export function startTableExpand(signal: AbortSignal): () => void {
  let dialog: HTMLDialogElement | null = null;
  let frame: number | null = null;

  const close = () => dialog?.close();

  const open = (table: HTMLTableElement) => {
    if (!dialog) {
      dialog = document.createElement("dialog");
      dialog.setAttribute("data-te-dialog", "");
      dialog.setAttribute("aria-label", "Table");
      dialog.addEventListener("click", (event) => {
        // Clicks on the backdrop land on the dialog element itself.
        if (event.target === dialog) close();
      });
      dialog.addEventListener("close", () => dialog?.replaceChildren());
      document.body.appendChild(dialog);
    }
    const closeButton = document.createElement("button");
    closeButton.type = "button";
    closeButton.setAttribute("data-te-close", "");
    closeButton.setAttribute("aria-label", "Close table");
    closeButton.textContent = "✕";
    closeButton.addEventListener("click", close);

    const scroller = document.createElement("div");
    scroller.setAttribute("data-te-scroller", "");
    const copy = table.cloneNode(true) as HTMLTableElement;
    copy.removeAttribute(TAGGED);
    scroller.appendChild(copy);

    dialog.replaceChildren(closeButton, scroller);
    dialog.showModal();
    closeButton.focus();
  };

  const onClick = (event: MouseEvent) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const button = target.closest<HTMLElement>(`[${BUTTON}]`);
    if (button) {
      const table = button.parentElement?.querySelector<HTMLTableElement>(`table[${TAGGED}]`);
      if (table) {
        event.preventDefault();
        event.stopPropagation();
        open(table);
      }
      return;
    }
    const table = target.closest<HTMLTableElement>(`table[${TAGGED}]`);
    if (!table || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey) return;
    if (isInteractive(target) || hasSelection()) return;
    open(table);
  };

  const tag = () => {
    frame = null;
    for (const table of document.querySelectorAll<HTMLTableElement>(TABLE)) {
      if (table.hasAttribute(TAGGED) || table.closest("[data-te-dialog]")) continue;
      table.setAttribute(TAGGED, "");
      table.title = "Click to expand";
      const wrapper = table.parentElement?.parentElement;
      if (!wrapper || wrapper.querySelector(`:scope > [${BUTTON}]`)) continue;
      const button = document.createElement("button");
      button.type = "button";
      button.setAttribute(BUTTON, "");
      button.setAttribute("aria-label", "Expand table");
      button.title = "Expand table";
      button.innerHTML =
        '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>';
      wrapper.setAttribute("data-te-wrapper", "");
      wrapper.appendChild(button);
    }
  };

  const schedule = () => {
    if (frame === null) frame = requestAnimationFrame(tag);
  };

  const observer = new MutationObserver(schedule);
  observer.observe(document.body, { childList: true, subtree: true });
  document.addEventListener("click", onClick, true);
  schedule();

  const dispose = () => {
    observer.disconnect();
    document.removeEventListener("click", onClick, true);
    if (frame !== null) cancelAnimationFrame(frame);
    dialog?.close();
    dialog?.remove();
    dialog = null;
    for (const el of document.querySelectorAll(`[${BUTTON}]`)) el.remove();
    for (const el of document.querySelectorAll(`[data-te-wrapper]`)) el.removeAttribute("data-te-wrapper");
    for (const el of document.querySelectorAll<HTMLElement>(`table[${TAGGED}]`)) {
      el.removeAttribute(TAGGED);
      el.removeAttribute("title");
    }
  };
  signal.addEventListener("abort", dispose, { once: true });
  return dispose;
}
