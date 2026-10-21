import type { ReactElement } from "react";
import type { Profile } from "../domain/model";
export const CharacterMatchDetails = ({ profile }: { profile?: Profile }): ReactElement | null => {
  if (!profile?.characterMatch) return null;
  return <details className="reading">
    <summary>왜 이 생물인가요?</summary>
    <p>{profile.characterMatch.reason}</p>
    <p className="muted">성향을 캐릭터에 빗댄 표현이에요. 표정이나 종이 능력·성격의 좋고 나쁨을 뜻하지 않아요.</p>
  </details>;
};
