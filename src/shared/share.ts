import { graphemes } from "./contracts";
interface ShareSupport {
  canShare?: (data: ShareData) => boolean;
  share?: (data: ShareData) => Promise<void>;
}
export const shareFile = async (
  file: File,
  url: string,
  support: ShareSupport = navigator,
): Promise<"shared" | "cancelled" | "unsupported"> => {
  if (!support.share) return "unsupported";
  const data = support.canShare?.({ files: [file] })
    ? { files: [file], title: "우리 무슨 조합?", url }
    : { title: "우리 무슨 조합?", url };
  try {
    await support.share(data);
    return "shared";
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError")
      return "cancelled";
    throw error;
  }
};
export const wrapText = (
  text: string,
  measure: (text: string) => number,
  max: number,
): string[] => {
  const lines: string[] = [];
  let line = "";
  for (const letter of graphemes(text)) {
    if (line && measure(line + letter) > max) {
      lines.push(line);
      line = letter;
    } else line += letter;
  }
  if (line) lines.push(line);
  return lines;
};
