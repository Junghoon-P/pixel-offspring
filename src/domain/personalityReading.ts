import type { Traits } from "./model";
import type { PersonalityReading, TraitAxis, TraitReading } from "./personalityModel";
interface AxisCopy { label: string; low: string; high: string; balanced: string }
export const AXIS_COPY: Record<TraitAxis, AxisCopy> = {
  adventure: { label: "새로운 경험", low: "익숙한 곳의 작은 변화를 즐겨요", high: "처음 보는 경험에 마음이 움직여요", balanced: "익숙함과 새로움을 상황에 맞게 고르는 균형형이에요" },
  energy: { label: "활동 리듬", low: "한 가지를 느긋하게 즐기며 충전해요", high: "다양하게 움직일 때 활력이 생겨요", balanced: "활동과 휴식 사이에서 균형을 찾아요" },
  spontaneity: { label: "계획과 즉흥", low: "미리 정해두면 마음이 편해요", high: "그때 끌리는 방향을 고르면 편해요", balanced: "계획과 즉흥을 함께 사용하는 균형형이에요" },
  expression: { label: "마음 표현", low: "말보다 조용히 챙기는 행동이 편해요", high: "좋아하는 마음을 바로 나누는 편이에요", balanced: "말과 행동으로 마음을 나누는 균형형이에요" },
  conflict: { label: "의견 조율", low: "먼저 생각한 뒤 이야기하면 편해요", high: "함께 바로 이야기하며 정리하면 편해요", balanced: "대화할 시점을 상황에 맞추는 균형형이에요" },
  support: { label: "도움 방식", low: "마음을 충분히 듣고 공감하는 쪽이에요", high: "실제로 도움이 될 방법부터 찾는 쪽이에요", balanced: "공감과 해결을 함께 챙기는 균형형이에요" },
};
const choose = (score: number, low: string, high: string, balanced: string): string =>
  Math.abs(score) < 0.25 ? balanced : score > 0 ? high : low;
const readAxis = (traits: Traits, axis: TraitAxis): TraitReading => {
  const copy = AXIS_COPY[axis], score = traits[axis] ?? 0;
  const summary = choose(score, copy.low, copy.high, copy.balanced);
  return { axis, label: copy.label, score, summary: Math.abs(score) >= 0.75 ? `특히 ${summary}` : summary };
};
export const describePersonality = (traits: Traits): PersonalityReading => {
  const axes = (Object.keys(AXIS_COPY) as TraitAxis[]).map((axis) => readAxis(traits, axis));
  return {
    version: 1,
    headline: choose(traits.spontaneity, "계획이 있으면 더 신나", "재밌으면 일단 가보는 편", "계획 반, 여백 반") +
      choose(traits.expression ?? 0, " · 마음은 행동으로", " · 좋아하면 바로 표현", " · 말과 행동을 함께"),
    strength: choose(traits.adventure, "늘 보던 사람의 작은 변화도 놓치지 않아요. 익숙한 사이를 오래 챙기는 힘이 있어요.",
      "남들이 지나친 곳에서 재미를 발견해요. “이거 해볼래?”로 새로운 이야기를 시작하는 쪽이에요.", "새로운 것도 좋지만, 익숙한 것의 매력도 알아요. 상황을 보고 더 끌리는 쪽을 고를 수 있어요."),
    misunderstanding: choose(traits.conflict ?? 0, "생각을 정리하는 시간이 무관심처럼 보일 수 있어요.",
      "바로 풀고 싶은 마음이 상대에게는 재촉처럼 들릴 수 있어요.", "상황마다 대화 속도가 달라 상대가 시점을 헷갈릴 수 있어요."),
    stress: choose(traits.energy, "일정이 몰릴 때는 혼자 느긋하게 충전할 시간이 필요해요.",
      "움직이고 싶은데 계속 기다려야 하면 답답해질 수 있어요.", "활동과 휴식 중 어느 한쪽만 계속되면 피로해질 수 있어요."),
    friendship: choose(traits.support ?? 0, "방법을 제안하기 전에 기분부터 물어봐 주세요. 충분히 들어주는 사람이 편해요.",
      "고민을 나눈 뒤 함께 해볼 작은 행동을 찾아주세요. 실질적인 도움이 힘이 돼요.",
      "들어주면 좋을지 함께 해결하면 좋을지 물어봐 주세요. 상황에 따라 원하는 도움이 달라요."),
    axes,
  };
};
