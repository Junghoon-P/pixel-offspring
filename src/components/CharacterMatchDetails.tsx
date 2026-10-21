import type { ReactElement } from "react";
import type { Profile } from "../domain/model";
export const CharacterMatchDetails = ({ profile }: { profile?: Profile }): ReactElement | null => {
  if (!profile?.characterMatch) return null;
  return <details className="reading">
    <summary>왜 이 생물인가요?</summary>
    <p>{profile.characterMatch.reason}</p>
    <p className="muted">답변에서 드러난 성향을 캐릭터로 표현했어요. 어떤 캐릭터가 나와도 더 좋거나 나쁜 건 아니에요.</p>
  </details>;
};
