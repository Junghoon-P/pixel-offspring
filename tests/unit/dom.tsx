import { act } from "react";
import type { ReactElement } from "react";
import { createRoot } from "react-dom/client";
import type { Root } from "react-dom/client";
import { beforeEach, afterEach, vi } from "vitest";
import { webcrypto } from "node:crypto";
let root: Root | undefined;
export const canvasContext = {
  save: vi.fn(),
  restore: vi.fn(),
  clearRect: vi.fn(),
  drawImage: vi.fn(),
  fillRect: vi.fn(),
  fillText: vi.fn(),
  measureText: (text: string): { width: number } => ({
    width: text.length * 24,
  }),
  imageSmoothingEnabled: false,
  font: "",
  fillStyle: "",
  textAlign: "center",
};
class LoadedImage {
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  private source = "";
  get src(): string { return this.source; }
  set src(value: string) {
    this.source = value;
    queueMicrotask(() => this.onload?.());
  }
}
export const setupDom = (): void => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    vi.stubGlobal("crypto", webcrypto);
    vi.stubGlobal("Image", LoadedImage);
    vi.stubGlobal("matchMedia", () => ({ matches: false }));
    vi.stubGlobal("scrollTo", vi.fn());
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(
      () => canvasContext as unknown as CanvasRenderingContext2D,
    );
    vi.spyOn(HTMLCanvasElement.prototype, "toBlob").mockImplementation(
      (callback) => callback(new Blob(["png"], { type: "image/png" })),
    );
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json({ data: { active: true, accepted: true } }),
      ),
    );
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: vi.fn(async () => undefined) },
    });
    Object.defineProperty(navigator, "share", {
      configurable: true,
      value: undefined,
    });
    Object.defineProperty(navigator, "canShare", {
      configurable: true,
      value: undefined,
    });
    URL.createObjectURL = vi.fn(() => "blob:result");
    URL.revokeObjectURL = vi.fn();
    sessionStorage.clear();
    history.replaceState(null, "", "/");
    document.body.innerHTML = "<div id='test-root'></div>";
  });
  afterEach(async () => {
    await act(async () => root?.unmount());
    root = undefined;
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });
};
export const render = async (element: ReactElement): Promise<void> => {
  root ??= createRoot(document.getElementById("test-root")!);
  await act(async () => {
    root!.render(element);
  });
};
export const button = (text: string): HTMLButtonElement => {
  const node = [...document.querySelectorAll("button")].find(
    (item) => item.textContent === text,
  );
  if (!node) throw new Error(`Button not found: ${text}`);
  return node;
};
export const click = async (node: HTMLElement): Promise<void> => {
  await act(async () => node.click());
};
export const input = async (selector: string, value: string): Promise<void> => {
  const node = document.querySelector(selector);
  if (!(node instanceof HTMLInputElement))
    throw new Error(`Input not found: ${selector}`);
  await act(async () => {
    Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      "value",
    )!.set!.call(node, value);
    node.dispatchEvent(new Event("input", { bubbles: true }));
  });
};
export const select = async (
  selector: string,
  value: string,
): Promise<void> => {
  const node = document.querySelector(selector);
  if (!(node instanceof HTMLSelectElement))
    throw new Error(`Select not found: ${selector}`);
  await act(async () => {
    node.value = value;
    node.dispatchEvent(new Event("change", { bubbles: true }));
  });
};
export const text = (): string => document.body.textContent ?? "";
export const flush = async (): Promise<void> => {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
};
