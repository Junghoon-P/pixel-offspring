import type { AnswerEvidence, CombinationReading, Parent } from "./model";
import type { TraitAxis } from "./personalityModel";
const TITLES: Record<TraitAxis, string> = {
  energy: "함께 보내는 시간", adventure: "새로운 경험", spontaneity: "약속을 준비하는 방식",
  expression: "마음을 표현하는 방식", conflict: "서운함을 푸는 속도", support: "고민을 들어줄 때",
};
interface SharedAnswer { first: AnswerEvidence; second: AnswerEvidence }
interface AxisCopy { positive: string; negative: string; difference: string; together: string }
const AXIS_COPY: Record<TraitAxis, AxisCopy> = {
  energy: { positive: "더 움직이며 놀기", negative: "느긋하게 쉬기", difference: "활동과 휴식의 타이밍이 다를 수 있어요. 더 놀기 전에 쉬는 시간을 함께 정해보세요.", together: "함께 보내는 시간를 맞추기 편할 수 있어요." },
  adventure: { positive: "새로운 경험 해보기", negative: "익숙한 선택 즐기기", difference: "새로운 도전과 익숙한 선택이 갈렸어요. 이번에는 새 식당, 다음에는 단골집처럼 번갈아 골라보세요.", together: "무엇을 함께 해볼지 고르기 편할 수 있어요." },
  spontaneity: { positive: "그때 끌리는 대로 고르기", negative: "미리 정해두기", difference: "미리 정할지 현장에서 고를지가 달랐어요. 만날 시간 하나만 정하고 나머지는 함께 골라보세요.", together: "약속을 준비하는 호흡이 맞을 수 있어요." },
  expression: { positive: "마음을 바로 말로 나누기", negative: "마음을 조용히 간직하거나 표현하기", difference: "바로 말하는 쪽과 조용히 표현하는 쪽으로 갈렸어요. 표현의 크기만으로 마음의 크기를 판단하지 않으면 좋겠어요.", together: "마음을 표현하는 방식이 익숙하게 느껴질 수 있어요." },
  conflict: { positive: "바로 이야기하며 풀기", negative: "생각을 정리한 뒤 이야기하기", difference: "서운함을 꺼내고 싶은 시점이 달랐어요. 잠깐 쉬더라도 언제 다시 이야기할지 정해보세요.", together: "서운함을 이야기할 시점을 맞추기 편할 수 있어요." },
  support: { positive: "해결할 방법부터 찾기", negative: "마음부터 들어주기", difference: "해결책과 공감 중 먼저 건네는 것이 달랐어요. 지금은 들어주면 좋을지, 방법을 찾으면 좋을지 물어보세요.", together: "고민에 반응하는 첫 방식이 비슷할 수 있어요." },
};
const interpretation = ({ first, second }: SharedAnswer): string => {
  const copy = AXIS_COPY[first.axis];
  if (first.score === 0 && second.score === 0)
    return `두 사람 모두 ‘둘 다 비슷해요’를 골랐어요. 이럴 때는 상황에 따라 선택이 달라질 수 있겠네요.`;
  if (first.score === 0 || second.score === 0)
    return `한 사람은 ‘둘 다 비슷해요’를 골랐어요. 어느 쪽이 좋은지 그때그때 서로 물어보세요.`;
  if (Math.sign(first.score) !== Math.sign(second.score)) return copy.difference;
  const direction = first.score > 0 ? copy.positive : copy.negative;
  return first.score === second.score ? `둘 다 ‘${direction}’ 쪽을 골랐어요. 답변의 강도도 같았네요. ${copy.together}`
    : `둘 다 ‘${direction}’ 쪽을 골랐지만, 얼마나 끌리는지는 조금 달랐어요. ${copy.together}`;
};
const sharedAnswers = (a: Parent, b: Parent): SharedAnswer[] => (a.profile?.evidence ?? []).flatMap((first) => {
  const second = b.profile?.evidence?.find((entry) => entry.questionId === first.questionId && entry.axis === first.axis && entry.question === first.question);
  return second ? [{ first, second }] : [];
}).sort((a, b) => Math.abs(b.first.score - b.second.score) - Math.abs(a.first.score - a.second.score)
  || Number(a.first.questionId.slice(1)) - Number(b.first.questionId.slice(1)));
export const describeCombination = (input: Parent[]): CombinationReading | undefined => {
  if (input.length !== 2 || input.some((parent) => parent.quizVersion !== 4 || !parent.profile?.evidence)) return undefined;
  const [a, b] = [...input].sort((first, second) => first.id.localeCompare(second.id));
  const shared = sharedAnswers(a, b);
  const selected = shared.filter((item, index) => shared.findIndex((candidate) => candidate.first.axis === item.first.axis) === index).slice(0, 3);
  if (selected.length < 2) return undefined;
  return { version: 1, headline: "같은 질문에 우리는 어떻게 답했을까요?", evidence: selected.map((item) => ({
    axis: item.first.axis, title: TITLES[item.first.axis],
    parents: [{ parentId: a.id, question: item.first.question, answer: item.first.answer },
      { parentId: b.id, question: item.second.question, answer: item.second.answer }],
    interpretation: interpretation(item),
  })) };
};
