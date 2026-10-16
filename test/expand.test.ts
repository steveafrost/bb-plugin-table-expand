import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { startTableExpand } from "../expand";

const nextFrame = () => new Promise((resolve) => requestAnimationFrame(() => resolve(undefined)));

function renderTable(): HTMLTableElement {
  document.body.innerHTML = `
    <div data-markdown-preview>
      <div class="my-2 flex justify-center">
        <div class="w-max max-w-full overflow-x-auto">
          <table><tbody><tr><td>cell</td><td><a href="#x">link</a></td></tr></tbody></table>
        </div>
      </div>
    </div>`;
  return document.querySelector("table")!;
}

describe("startTableExpand", () => {
  let controller: AbortController;

  beforeEach(() => {
    // jsdom lacks the modal dialog API; model just the open state.
    HTMLDialogElement.prototype.showModal = function () {
      this.setAttribute("open", "");
    };
    HTMLDialogElement.prototype.close = function () {
      if (!this.hasAttribute("open")) return;
      this.removeAttribute("open");
      this.dispatchEvent(new Event("close"));
    };
    controller = new AbortController();
  });

  afterEach(() => {
    controller.abort();
    document.body.innerHTML = "";
  });

  it("tags markdown tables and adds one expand button", async () => {
    const table = renderTable();
    startTableExpand(controller.signal);
    await nextFrame();
    await nextFrame();
    expect(table.hasAttribute("data-te-table")).toBe(true);
    expect(document.querySelectorAll("[data-te-button]")).toHaveLength(1);
  });

  it("opens a copy of the table when a cell is clicked", async () => {
    const table = renderTable();
    startTableExpand(controller.signal);
    await nextFrame();
    table.querySelector("td")!.click();
    const dialog = document.querySelector<HTMLDialogElement>("dialog[data-te-dialog]");
    expect(dialog?.hasAttribute("open")).toBe(true);
    const copy = dialog!.querySelector("table")!;
    expect(copy).not.toBe(table);
    expect(copy.textContent).toContain("cell");
    expect(copy.hasAttribute("data-te-table")).toBe(false);
  });

  it("opens from the expand button", async () => {
    renderTable();
    startTableExpand(controller.signal);
    await nextFrame();
    document.querySelector<HTMLButtonElement>("[data-te-button]")!.click();
    expect(document.querySelector("dialog[data-te-dialog]")?.hasAttribute("open")).toBe(true);
  });

  it("ignores clicks on links and modified clicks", async () => {
    const table = renderTable();
    startTableExpand(controller.signal);
    await nextFrame();
    table.querySelector("a")!.click();
    table.querySelector("td")!.dispatchEvent(new MouseEvent("click", { bubbles: true, metaKey: true }));
    expect(document.querySelector("dialog[data-te-dialog]")).toBeNull();
  });

  it("closes on backdrop click and empties the dialog", async () => {
    const table = renderTable();
    startTableExpand(controller.signal);
    await nextFrame();
    table.querySelector("td")!.click();
    const dialog = document.querySelector<HTMLDialogElement>("dialog[data-te-dialog]")!;
    dialog.click();
    expect(dialog.hasAttribute("open")).toBe(false);
    expect(dialog.childElementCount).toBe(0);
  });

  it("removes everything it added when aborted", async () => {
    const table = renderTable();
    startTableExpand(controller.signal);
    await nextFrame();
    table.querySelector("td")!.click();
    controller.abort();
    expect(document.querySelector("dialog[data-te-dialog]")).toBeNull();
    expect(document.querySelector("[data-te-button]")).toBeNull();
    expect(document.querySelector("[data-te-wrapper]")).toBeNull();
    expect(table.hasAttribute("data-te-table")).toBe(false);
    expect(table.hasAttribute("title")).toBe(false);
  });
});
