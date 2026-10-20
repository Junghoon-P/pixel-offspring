"use client";
import Link from "next/link";
import { readSessionValue, removeSessionValue } from "../shared/sessionStorage";
import { useEffect, useState } from "react";
import type { ReactElement } from "react";
import type { PublicResult } from "../domain/model";
import { getResult } from "../shared/api";
import { useResource } from "../shared/useResource";
import { CreatureCanvas } from "../components/CreatureCanvas";
import { useResultCard } from "./useResultCard";
import { ResultShare } from "./ResultShare";
const useBirth = (id: string): { birth: boolean; skip: () => void } => {
  const [birth, setBirth] = useState(false);
  useEffect(() => {
    if (readSessionValue("birth-result") === id)
      setBirth(!matchMedia("(prefers-reduced-motion: reduce)").matches);
    removeSessionValue("birth-result");
    const timer = setTimeout(() => setBirth(false), 1800);
    return () => clearTimeout(timer);
  }, [id]);
  return { birth, skip: () => setBirth(false) };
};
const ResultDetails = ({ result }: { result: PublicResult }): ReactElement => (
  <section className="panel">
    <div className="parents">
      {result.parents.map((p) => (
        <div key={p.id}>
          <CreatureCanvas recipe={p.recipe} label={p.nickname} scale={2} />
          <p>{p.nickname}</p>
        </div>
      ))}
    </div>
    <CreatureCanvas recipe={result.child.recipe} label={result.child.name} />
    <h2>{result.child.name}</h2>
    <p>{result.child.description}</p>
    <p>
      <strong>특수 능력</strong>
      <br />
      {result.child.ability}
    </p>
    <ul>
      {result.child.inheritance.map((v, i) => (
        <li key={i}>
          {result.parents.find((p) => p.id === v.parentId)?.nickname}에게 받은{" "}
          {v.label}
        </li>
      ))}
    </ul>
    {result.child.notes?.map((note) => (
      <p className="muted" key={note}>
        {note}
      </p>
    ))}
  </section>
);
export const Result = ({ id }: { id: string }): ReactElement => {
  const resource = useResource(() => getResult(id), id);
  const card = useResultCard(resource.data);
  const { birth, skip } = useBirth(id);
  if (resource.loading) return <p role="status">저장된 결과를 불러오는 중…</p>;
  if (resource.error)
    return (
      <>
        <h1>결과를 볼 수 없어요</h1>
        <p role="alert">{resource.error}</p>
        <button onClick={resource.reload}>다시 시도</button>
        <p>
          <Link href="/">처음으로</Link>
        </p>
      </>
    );
  const result = resource.data!;
  return (
    <>
      <p className="eyebrow">두 사람의 작은 특징이 만나서</p>
      <h1>우리 사이에 태어난 생물</h1>
      {birth && (
        <section className="panel birth" role="status">
          <p>새 생물이 눈을 뜨고 있어요…</p>
          <button onClick={skip}>연출 건너뛰기</button>
        </section>
      )}
      <ResultDetails result={result} />
      <ResultShare card={card} />
      <p className="muted">
        {new Date(result.expiresAt).toLocaleDateString("ko-KR")}까지 보관돼요.
        부모 생물 중 하나가 삭제되면 이 공동 결과도 볼 수 없어요.
      </p>
      <Link className="button" href="/create">
        나도 생물 만들기
      </Link>
    </>
  );
};
