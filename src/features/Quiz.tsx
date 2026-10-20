"use client";
import { useEffect, useRef, useState } from "react";
import type { ReactElement } from "react";
import { z } from "zod";
import { QUESTIONS_V3 as QUESTIONS, ANSWER_OPTIONS, answerLabel } from "../domain/surveyV3Questions";
import type { AnswerOption } from "../domain/surveyV3Questions";
import {
  characterSchema,
  idSchema,
  nicknameSchema,
  submissionSchema,
} from "../shared/contracts";
import { api, ensureSession, recordEvent } from "../shared/api";
const draftSchema = z.object({
  quizVersion: z.literal(3),
  migrated: z.boolean().optional(),
  nickname: z.string(),
  choices: z.record(z.string(), z.enum(ANSWER_OPTIONS)),
  step: z
    .number()
    .int()
    .min(0)
    .max(QUESTIONS.length - 1),
  key: z.uuid(),
});
interface Draft {
  quizVersion: 3;
  migrated?: boolean;
  nickname: string;
  choices: Record<string, AnswerOption>;
  step: number;
  key: string;
}
interface QuizState {
  draft: Draft;
  error: string;
  busy: boolean;
  update: (draft: Draft) => void;
  next: () => Promise<void>;
  reset: () => void;
}
const newDraft = (): Draft => ({
  quizVersion: 3,
  nickname: "",
  choices: {},
  step: 0,
  key: crypto.randomUUID(),
});
const loadDraft = (): Draft => {
  try {
    const raw = sessionStorage.getItem("quiz-draft");
    if (!raw) return newDraft();
    const value: unknown = JSON.parse(raw);
    const parsed = draftSchema.safeParse(value);
    if (parsed.success) {
      if (!nicknameSchema.safeParse(parsed.data.nickname).success)
        return { ...parsed.data, step: 0 };
      const firstMissing = QUESTIONS.findIndex(
        (q) => !parsed.data.choices[q.id],
      );
      return {
        ...parsed.data,
        step:
          firstMissing < 0
            ? parsed.data.step
            : Math.min(parsed.data.step, firstMissing),
      };
    }
    const old = z
      .object({ nickname: z.string(), quizVersion: z.number().optional() })
      .safeParse(value);
    if (old.success && old.data.quizVersion !== 3)
      return { ...newDraft(), nickname: old.data.nickname, migrated: true };
  } catch {
    /* 저장이 제한된 브라우저에서도 새 설문을 시작할 수 있다. */
  }
  return newDraft();
};
const saveCharacter = async (
  draft: Draft,
  navigate: (path: string) => void,
): Promise<void> => {
  const payload = submissionSchema.parse({
    quizVersion: 3,
    nickname: draft.nickname,
    answers: QUESTIONS.map((q) => ({
      questionId: q.id,
      optionId: draft.choices[q.id],
    })),
    idempotencyKey: draft.key,
  });
  await ensureSession();
  await api("/api/characters", characterSchema, "POST", payload);
  let invite: string | null = null;
  try {
    sessionStorage.removeItem("quiz-draft");
    invite = sessionStorage.getItem("pending-invite");
  } catch {
    /* Saving succeeded even when browser storage is disabled. */
  }
  const pending = idSchema.safeParse(
    new URLSearchParams(location.search).get("invite") ?? invite,
  );
  navigate(pending.success ? `/i/${pending.data}` : "/me");
};
const validationMessage = (draft: Draft): string => {
  if (!nicknameSchema.safeParse(draft.nickname).success)
    return "닉네임은 줄바꿈 없이 1~12글자로 입력해 주세요.";
  return draft.choices[QUESTIONS[draft.step].id]
    ? ""
    : "마음에 가까운 답 하나를 골라 주세요.";
};
const useQuiz = (navigate: (path: string) => void): QuizState => {
  const [draft, setDraft] = useState(loadDraft),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const update = (value: Draft): void => {
    const next = { ...value, migrated: false };
    setDraft(next);
    try {
      sessionStorage.setItem("quiz-draft", JSON.stringify(next));
    } catch {
      /* Keep the in-memory draft if storage is full. */
    }
  };
  const next = async (): Promise<void> => {
    const message = validationMessage(draft);
    setError(message);
    if (message) return;
    if (draft.step < QUESTIONS.length - 1) {
      update({ ...draft, step: draft.step + 1 });
      return;
    }
    setBusy(true);
    try {
      await saveCharacter(draft, navigate);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "저장하지 못했어요. 다시 시도해 주세요.",
      );
    } finally {
      setBusy(false);
    }
  };
  const reset = (): void => {
    update(newDraft());
    setError("");
  };
  useEffect(() => {
    void ensureSession()
      .then(() => recordEvent("quiz_started"))
      .catch(() => undefined);
  }, []);
  return { draft, error, busy, update, next, reset };
};
const NicknameField = ({
  state,
}: {
  state: QuizState;
}): ReactElement | null => {
  if (state.draft.step !== 0) return null;
  return (
    <>
      <label htmlFor="nickname">닉네임</label>
      <input
        id="nickname"
        autoComplete="off"
        value={state.draft.nickname}
        disabled={state.busy}
        onChange={(e) =>
          state.update({
            ...state.draft,
            nickname: e.target.value,
            key: crypto.randomUUID(),
          })
        }
        aria-describedby={state.error ? "quiz-error" : undefined}
      />
    </>
  );
};
const QuestionField = ({ state }: { state: QuizState }): ReactElement => {
  const question = QUESTIONS[state.draft.step];
  const ref = useRef<HTMLFieldSetElement>(null);
  const previous = useRef(state.draft.step);
  useEffect(() => {
    if (previous.current !== state.draft.step) ref.current?.focus();
    previous.current = state.draft.step;
  }, [state.draft.step]);
  return (
    <fieldset ref={ref} tabIndex={-1} disabled={state.busy}>
      <legend>{question.text}</legend>
      {ANSWER_OPTIONS.map((option) => (
        <label className="choice" key={option}>
          <input
            type="radio"
            name={question.id}
            checked={state.draft.choices[question.id] === option}
            onChange={() =>
              state.update({
                ...state.draft,
                choices: { ...state.draft.choices, [question.id]: option },
                key: crypto.randomUUID(),
              })
            }
          />
          {answerLabel(question, option)}
        </label>
      ))}
    </fieldset>
  );
};
const QuizActions = ({
  state,
  navigate,
}: {
  state: QuizState;
  navigate: (path: string) => void;
}): ReactElement => (
  <>
    <div className="actions">
      <button
        className="secondary"
        disabled={state.busy}
        onClick={() =>
          state.draft.step > 0
            ? state.update({ ...state.draft, step: state.draft.step - 1 })
            : navigate("/")
        }
      >
        이전
      </button>
      <button disabled={state.busy} onClick={() => void state.next()}>
        {state.busy
          ? "저장 중…"
          : state.draft.step === QUESTIONS.length - 1
            ? "내 생물 탄생시키기"
            : "다음"}
      </button>
    </div>
    <button className="secondary" disabled={state.busy} onClick={state.reset}>
      처음부터 다시
    </button>
  </>
);
export const Quiz = ({
  navigate,
}: {
  navigate: (path: string) => void;
}): ReactElement => {
  const state = useQuiz(navigate);
  return (
    <>
      <p className="eyebrow">나를 닮은 작은 생물 찾기</p>
      <h1>오늘의 나는?</h1>
      <p>정답은 없어요. 평소의 나에게 가까운 쪽을 골라주세요.</p>
      <p className="muted">
        닉네임·생물·성향 풀이와 조합 궁합은 초대·결과 링크를 아는 사람에게 보여요. 원본 답변은
        서버에 보관하지 않아요.
      </p>
      <progress
        value={state.draft.step + 1}
        max={QUESTIONS.length}
        aria-label="질문 진행률"
      />
      <p className="question-count">
        {state.draft.step + 1} / {QUESTIONS.length}
      </p>
      {state.draft.migrated && (
        <p role="status">
          설문이 24문항으로 새로워졌어요. 닉네임은 유지했고, 이전 답변을 섞지
          않도록 첫 질문부터 시작해요.
        </p>
      )}
      <NicknameField state={state} />
      <QuestionField state={state} />
      {state.error && (
        <p id="quiz-error" className="error" role="alert">
          {state.error}
        </p>
      )}
      <QuizActions state={state} navigate={navigate} />
    </>
  );
};
