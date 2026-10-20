"use client";
import Link from "next/link";
import { COMIC_NAMES } from "../domain/catalog";
import { useEffect, useState } from "react";
import type { ReactElement } from "react";
import { z } from "zod";
import {
  api,
  createInvite,
  getCharacters,
  getResults,
  recordEvent,
} from "../shared/api";
import { useResource } from "../shared/useResource";
import type { Resource } from "../shared/useResource";
import { CreatureCanvas } from "../components/CreatureCanvas";
import type {
  Character,
  Invite,
  ResultPage,
  PublicResult,
} from "../domain/model";
interface MeData {
  characters: Character[];
  results: ResultPage;
}
interface MeState {
  resource: Resource<MeData>;
  invite: Invite | undefined;
  error: string;
  busy: boolean;
  results: ResultPage | undefined;
  action: (task: () => Promise<void>) => Promise<void>;
  remove: (id: string) => Promise<void>;
  inviteFriend: (id: string) => Promise<void>;
  refresh: () => void;
  more: () => Promise<void>;
}
const loadMe = async (): Promise<MeData> => {
  const [characters, results] = await Promise.all([
    getCharacters(),
    getResults(),
  ]);
  return { characters, results };
};
const useAction = (): Pick<MeState, "error" | "busy" | "action"> => {
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const action = async (task: () => Promise<void>): Promise<void> => {
    setBusy(true);
    setError("");
    try {
      await task();
    } catch (e) {
      setError(e instanceof Error ? e.message : "다시 시도해 주세요.");
    } finally {
      setBusy(false);
    }
  };
  return { error, busy, action };
};
const useMe = (): MeState => {
  const resource = useResource(loadMe, "me");
  const { error, busy, action } = useAction();
  const [invite, setInvite] = useState<Invite>(),
    [page, setPage] = useState<ResultPage>();
  const refresh = (): void => {
    setPage(undefined);
    resource.reload();
  };
  useEffect(() => {
    window.addEventListener("focus", refresh);
    return () => window.removeEventListener("focus", refresh);
  }, [resource.reload]);
  const remove = async (id: string): Promise<void> => {
    if (
      !confirm(
        "이 생물과 관련 초대·공동 결과가 양쪽 모두에게서 삭제됩니다. 계속할까요?",
      )
    )
      return;
    await api(`/api/me/characters/${id}`, z.undefined(), "DELETE");
    setInvite(undefined);
    refresh();
  };
  const inviteFriend = async (id: string): Promise<void> =>
    setInvite(await createInvite(id, crypto.randomUUID()));
  const results = page ?? resource.data?.results;
  const more = async (): Promise<void> => {
    if (!results?.nextCursor) return;
    const next = await getResults(results.nextCursor);
    setPage({
      items: [...results.items, ...next.items],
      nextCursor: next.nextCursor,
    });
  };
  return {
    resource,
    invite,
    error,
    busy,
    results,
    action,
    remove,
    inviteFriend,
    refresh,
    more,
  };
};
const CharacterCard = ({
  character,
  state,
}: {
  character: Character;
  state: MeState;
}): ReactElement => (
  <section className="panel">
    <CreatureCanvas
      recipe={character.recipe}
      label={`${character.nickname}의 생물`}
    />
    <h2>{character.nickname}</h2>
    {character.profile && (
      <>
        <h3>{character.recipe.assetVersion === 4 ? `${COMIC_NAMES[character.recipe.body]} · ` : ""}{character.profile.name}</h3>
        <p>{character.profile.description}</p>
        <p>
          <strong>작은 능력</strong> · {character.profile.ability}
        </p>
      </>
    )}
    <p className="muted">
      보관 기한 {new Date(character.expiresAt).toLocaleDateString("ko-KR")}
    </p>
    <div className="actions">
      <button
        disabled={state.busy}
        onClick={() =>
          void state.action(() => state.inviteFriend(character.id))
        }
      >
        친구 초대 링크 만들기
      </button>
      <button
        className="secondary"
        disabled={state.busy}
        onClick={() => void state.action(() => state.remove(character.id))}
      >
        이 생물 삭제
      </button>
    </div>
  </section>
);
const InviteLink = ({ invite }: { invite: Invite }): ReactElement => {
  const [notice, setNotice] = useState("");
  const copy = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(invite.url);
      recordEvent("link_copied");
      setNotice("링크를 복사했어요.");
    } catch {
      setNotice("아래 링크를 직접 선택해 복사해 주세요.");
    }
  };
  return (
    <section className="panel">
      <label htmlFor="invite-url">초대 링크</label>
      <input id="invite-url" readOnly value={invite.url} />
      <p>여러 친구에게 같은 링크를 보낼 수 있어요.</p>
      <button onClick={() => void copy()}>초대 링크 복사</button>
      {notice && <p role="status">{notice}</p>}
    </section>
  );
};
const ResultSummary = ({ result }: { result: PublicResult }): ReactElement => (
  <section className="panel">
    <CreatureCanvas
      recipe={result.child.recipe}
      label={result.child.name}
      scale={2}
    />
    <h3>{result.child.name}</h3>
    <p>{result.parents.map((p) => p.nickname).join(" + ")}</p>
    <Link className="button" href={`/r/${result.resultId}`}>
      결과 보기 · {result.child.name}
    </Link>
  </section>
);
const ResultList = ({ state }: { state: MeState }): ReactElement => (
  <>
    <h2>우리 생물들</h2>
    <button className="secondary" onClick={state.refresh}>
      목록 새로고침
    </button>
    {state.results?.items.length === 0 && (
      <p>아직 함께 만든 생물이 없어요. 친구를 초대해 보세요.</p>
    )}
    {state.results?.items.map((result) => (
      <ResultSummary key={result.resultId} result={result} />
    ))}
    {state.results?.nextCursor && (
      <button
        disabled={state.busy}
        onClick={() => void state.action(state.more)}
      >
        더 보기
      </button>
    )}
  </>
);
export const Me = (): ReactElement => {
  const state = useMe();
  if (state.resource.loading && !state.resource.data)
    return <p role="status">내 생물을 찾고 있어요…</p>;
  if (state.resource.error)
    return (
      <>
        <h1>내 생물</h1>
        <p role="alert">{state.resource.error}</p>
        <button onClick={state.refresh}>다시 시도</button>
        <p>
          <Link href="/create">새 생물 만들기</Link>
        </p>
      </>
    );
  return (
    <>
      <h1>내 생물</h1>
      <p className="muted">
        이 브라우저에 연결된 생물이에요. 쿠키를 지우거나 기기를 바꾸면 관리
        권한을 복구할 수 없어요.
      </p>
      {state.error && (
        <p className="error" role="alert">
          {state.error}
        </p>
      )}
      {state.resource.data?.characters.length === 0 && (
        <p>
          아직 생물이 없어요. <Link href="/create">내 생물 만들기</Link>
        </p>
      )}
      {state.resource.data?.characters.map((character) => (
        <CharacterCard key={character.id} character={character} state={state} />
      ))}
      {state.invite && <InviteLink invite={state.invite} />}
      <ResultList state={state} />
      <p>
        <Link href="/create">새 생물 만들기</Link>
      </p>
    </>
  );
};
