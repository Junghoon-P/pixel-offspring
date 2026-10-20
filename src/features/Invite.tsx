"use client";
import Link from "next/link";
import {
  writeSessionValue,
  removeSessionValue,
} from "../shared/sessionStorage";
import { useEffect, useState } from "react";
import type { ReactElement } from "react";
import {
  createPair,
  getCharacters,
  getInvite,
  RequestError,
  ensureSession,
  recordEvent,
} from "../shared/api";
import { useResource } from "../shared/useResource";
import { CreatureCanvas } from "../components/CreatureCanvas";
import type { Character, InvitePreview } from "../domain/model";
import type { Resource } from "../shared/useResource";
interface InviteProps {
  id: string;
  navigate: (path: string) => void;
}
interface InviteData {
  invite: InvitePreview;
  characters: Character[];
}
interface InviteState {
  resource: Resource<InviteData>;
  selected: string;
  busy: boolean;
  error: string;
  setSelected: (id: string) => void;
  combine: () => Promise<void>;
}
const loadInvite = async (id: string): Promise<InviteData> => {
  const invite = await getInvite(id);
  const characters = await getCharacters().catch((e: unknown) => {
    if (e instanceof RequestError && e.status === 401) return [];
    throw e;
  });
  return { invite, characters };
};
const useInvite = ({ id, navigate }: InviteProps): InviteState => {
  const resource = useResource(() => loadInvite(id), id);
  const [selected, setSelected] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  useEffect(() => {
    writeSessionValue("pending-invite", id);
    void ensureSession()
      .then(() => recordEvent("invite_opened"))
      .catch(() => undefined);
  }, [id]);
  const combine = async (): Promise<void> => {
    setBusy(true);
    setError("");
    try {
      const pair = await createPair(
        id,
        selected || resource.data!.characters[0].id,
      );
      removeSessionValue("pending-invite");
      if (pair.created) writeSessionValue("birth-result", pair.resultId);
      navigate(pair.resultUrl);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "저장에 실패했어요. 다시 시도해 주세요.",
      );
    } finally {
      setBusy(false);
    }
  };
  return { resource, selected, busy, error, setSelected, combine };
};
const ChosenCharacter = ({ chosen }: { chosen: Character }): ReactElement => (
  <section className="panel" aria-label="선택한 내 생물">
    <CreatureCanvas recipe={chosen.recipe} label={chosen.nickname} scale={2} />
    {chosen.profile && (
      <>
        <h3>{chosen.profile.name}</h3>
        <p>{chosen.profile.description}</p>
      </>
    )}
  </section>
);
const JoinInvite = ({
  id,
  state,
  characters,
}: {
  id: string;
  state: InviteState;
  characters: Character[];
}): ReactElement => {
  const { selected, setSelected, busy, combine } = state;
  const chosen =
    characters.find((character) => character.id === selected) ?? characters[0];
  return (
    <>
      <h2>내 생물</h2>
      <label htmlFor="my-character">함께할 생물 선택</label>
      <select
        id="my-character"
        value={selected || characters[0].id}
        onChange={(e) => setSelected(e.target.value)}
      >
        {characters.map((c) => (
          <option key={c.id} value={c.id}>
            {c.nickname}
          </option>
        ))}
      </select>
      {chosen && <ChosenCharacter chosen={chosen} />}
      <div className="actions">
        <button disabled={busy} onClick={() => void combine()}>
          {busy ? "함께 저장하는 중…" : "우리 생물 만들기"}
        </button>
      </div>
      <Link href={`/create?invite=${encodeURIComponent(id)}`}>
        새 생물로 참여하기
      </Link>
    </>
  );
};
const InviteHeader = ({ invite }: { invite: InvitePreview }): ReactElement => (
  <>
    <p className="eyebrow">친구가 작은 초대를 보냈어요</p>
    <h1>
      우리 생물은
      <br />
      어떤 모습일까?
    </h1>
    <section className="panel">
      <CreatureCanvas
        recipe={invite.parent.recipe}
        label={invite.parent.nickname}
      />
      <h2>{invite.parent.nickname}의 생물</h2>
      {invite.parent.profile && <p>{invite.parent.profile.name}</p>}
    </section>
  </>
);
export const Invite = (props: InviteProps): ReactElement => {
  const state = useInvite(props);
  const { resource, error } = state;
  const { id } = props;
  if (resource.loading) return <p role="status">초대를 확인하고 있어요…</p>;
  if (resource.error)
    return (
      <>
        <h1>초대를 확인해 주세요</h1>
        <p role="alert">{resource.error}</p>
        <button onClick={resource.reload}>다시 시도</button>
        <p>
          <Link href="/">처음으로</Link>
        </p>
      </>
    );
  const data = resource.data!;
  return (
    <>
      <InviteHeader invite={data.invite} />
      {data.characters.length > 0 ? (
        <JoinInvite id={id} state={state} characters={data.characters} />
      ) : (
        <>
          <p>
            먼저 나를 닮은 생물을 만들어 주세요. 질문이 끝나면 이 초대로
            돌아와요.
          </p>
          <Link
            className="button"
            href={`/create?invite=${encodeURIComponent(id)}`}
          >
            내 생물 만들기
          </Link>
        </>
      )}
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <p className="muted">
        초대 기한 {new Date(data.invite.expiresAt).toLocaleDateString("ko-KR")}
      </p>
    </>
  );
};
