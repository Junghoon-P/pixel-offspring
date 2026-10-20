import { useState } from "react";
import type { ReactElement } from "react";
import { recordEvent } from "../shared/api";
import { shareFile } from "../shared/share";
import type { ResultCardState } from "./useResultCard";
interface ShareActions {
  notice: string;
  share: () => Promise<void>;
  copy: () => Promise<void>;
  download: () => void;
}
const useShareActions = ({ file, imageUrl }: ResultCardState): ShareActions => {
  const [notice, setNotice] = useState("");
  const share = async (): Promise<void> => {
    if (!file) return;
    recordEvent("share_opened");
    try {
      const result = await shareFile(file, location.href);
      if (result === "unsupported")
        setNotice(
          "공유 창을 지원하지 않아요. PNG 저장이나 링크 복사를 이용해 주세요.",
        );
    } catch {
      setNotice("공유하지 못했어요. PNG 저장이나 링크 복사를 이용해 주세요.");
    }
  };
  const copy = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(location.href);
      recordEvent("link_copied");
      setNotice("링크를 복사했어요.");
    } catch {
      setNotice("복사하지 못했어요. 아래 링크를 길게 눌러 복사해 주세요.");
    }
  };
  const download = (): void => {
    if (!imageUrl) return;
    const a = document.createElement("a");
    a.href = imageUrl;
    a.download = "pixel-offspring.png";
    a.click();
    recordEvent("card_downloaded");
  };
  return { notice, share, copy, download };
};
export const ResultShare = ({
  card,
}: {
  card: ResultCardState;
}): ReactElement => {
  const { file, imageUrl, cardError } = card;
  const { notice, share, copy, download } = useShareActions(card);
  return (
    <>
      <h2>이 조합, 같이 보자</h2>
      <div className="actions share-actions">
        <button disabled={!file} onClick={download}>
          PNG 저장
        </button>
        <button disabled={!file} onClick={() => void share()}>
          이미지 공유
        </button>
        <button className="secondary" onClick={() => void copy()}>
          링크 복사
        </button>
      </div>
      {!file && !cardError && (
        <p role="status">카드 이미지를 준비하고 있어요…</p>
      )}
      {cardError && (
        <>
          <p role="alert">{cardError}</p>
          <button onClick={card.retry}>카드 다시 준비</button>
        </>
      )}
      {notice && <p role="status">{notice}</p>}
      <label htmlFor="result-link">결과 링크</label>
      <input id="result-link" readOnly value={location.href} />
      {imageUrl && (
        <p>
          <a href={imageUrl} target="_blank" rel="noreferrer">
            이미지 크게 열기
          </a>{" "}
          · 저장이 안 되면 길게 누르거나 외부 브라우저에서 열어 주세요.
        </p>
      )}
    </>
  );
};
