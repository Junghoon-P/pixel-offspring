import { useEffect, useState } from "react";
import type { PublicResult } from "../domain/model";
import { renderCard } from "./card";
export interface ResultCardState {
  file: File | undefined;
  imageUrl: string;
  cardError: string;
  retry: () => void;
}
export const useResultCard = (
  result: PublicResult | undefined,
): ResultCardState => {
  const [file, setFile] = useState<File>(),
    [imageUrl, setImageUrl] = useState(""),
    [cardError, setCardError] = useState(""),
    [cardAttempt, setCardAttempt] = useState(0);
  useEffect(() => {
    let alive = true,
      url = "";
    if (!result) return;
    setCardError("");
    setFile(undefined);
    void renderCard(result)
      .then((blob) => {
        if (alive) {
          const value = new File([blob], "pixel-offspring.png", {
            type: "image/png",
          });
          setFile(value);
          url = URL.createObjectURL(blob);
          setImageUrl(url);
        }
      })
      .catch(() => {
        if (alive)
          setCardError(
            "카드 준비에 실패했어요. 다시 준비하거나 링크를 복사해 주세요.",
          );
      });
    return () => {
      alive = false;
      if (url) URL.revokeObjectURL(url);
    };
  }, [result, cardAttempt]);
  return {
    file,
    imageUrl,
    cardError,
    retry: () => setCardAttempt((v) => v + 1),
  };
};
