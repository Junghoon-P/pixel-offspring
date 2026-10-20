import type { Parent, Traits } from "./model";
import type { Compatibility, SituationReading, TraitAxis } from "./personalityModel";
const distance = (a: Traits, b: Traits, axis: TraitAxis): number => Math.abs((a[axis] ?? 0) - (b[axis] ?? 0));
const travel = (a: Traits, b: Traits): SituationReading => ({
  title: "같이 떠날 때",
  match: distance(a, b, "adventure") <= 0.5 ? "새로운 곳과 익숙한 곳 중 무엇을 고를지 취향을 맞추기 쉬워요." : "한쪽의 새로운 제안에 다른 쪽의 익숙한 선택지가 더해져요.",
  friction: distance(a, b, "spontaneity") >= 1 ? "일정을 미리 정할지 현장에서 고를지 부딪힐 수 있어요." :
    a.spontaneity >= 0.5 && b.spontaneity >= 0.5 ? "둘 다 즉흥적이면 시간과 장소를 정하는 일이 뒤로 밀릴 수 있어요." : "비슷한 준비 방식이어도 꼭 하고 싶은 일은 다를 수 있어요.",
  tip: "출발 시간과 꼭 갈 곳 하나만 함께 정하고, 나머지는 여백으로 남겨보세요.",
});
const rest = (a: Traits, b: Traits): SituationReading => ({
  title: "함께 쉬고 놀 때",
  match: distance(a, b, "energy") <= 0.5 ? "활동과 휴식의 속도를 맞추기 비교적 편해요." : "움직이고 싶은 마음과 쉬어가는 여유를 서로에게 알려줄 수 있어요.",
  friction: distance(a, b, "energy") >= 1 ? "한쪽은 더 놀고 싶은데 다른 쪽은 이미 충전이 필요할 수 있어요." : "체력이 비슷해 보여도 그날의 컨디션까지 같지는 않아요.",
  tip: "중간에 쉬는 시간을 정하고, 잠깐 따로 보내는 시간도 괜찮다고 말해보세요.",
});
const conversation = (a: Traits, b: Traits): SituationReading => {
  if (a.conflict === undefined || b.conflict === undefined || a.support === undefined || b.support === undefined)
    return { title: "대화하고 위로할 때", match: "구버전 설문에는 대화·위로 방식 질문이 없어요.",
      friction: "없는 답변을 추정해 궁합을 판단하지 않았어요.", tip: "두 사람 모두 새 24문항 설문을 마치면 이 부분도 풀어드려요." };
  return { title: "대화하고 위로할 때",
    match: distance(a, b, "support") <= 0.5 ? "어떤 도움을 먼저 건네고 싶은지 방향이 비슷해요." : "공감하는 역할과 해결 방법을 찾는 역할을 나눌 수 있어요.",
    friction: distance(a, b, "conflict") >= 1 ? "바로 대화하고 싶은 사람과 먼저 생각할 사람이 엇갈릴 수 있어요." :
      distance(a, b, "support") >= 1 ? "해결책이 필요한 순간과 먼저 들어줬으면 하는 순간이 다를 수 있어요." : "비슷한 방식이어도 상대가 지금 원하는 도움을 넘겨짚을 수 있어요.",
    tip: "지금은 들어주면 좋을지 방법을 찾으면 좋을지 물어보세요. 쉬었다 이야기할 때는 돌아올 시간도 정해주세요.",
  };
};
export const describeCompatibility = (parents: Parent[]): Compatibility => {
  const [a, b] = parents.map((parent) => parent.traits);
  const partial = [a.conflict, b.conflict, a.support, b.support].some((value) => value === undefined);
  const axes: TraitAxis[] = ["adventure", "energy", "spontaneity", ...(partial ? [] : ["conflict", "support"] as TraitAxis[])];
  const gaps = axes.filter((axis) => distance(a, b, axis) >= 1).length;
  const situations = [travel(a, b), rest(a, b), conversation(a, b)];
  return { version: 1, partial, title: gaps >= 3 ? "티격태격, 그래도 한 팀" : gaps >= 1 ? "다른데 묘하게 잘 맞아" : "설명 안 해도 통하는 사이",
    strengths: [situations[0].match, situations[1].match],
    complement: gaps ? "한 명이 발견하고, 한 명이 챙기고. 서로 다른 방식이 둘만의 팀워크가 될 수 있어요." : "취향이 통해도 마음까지 자동으로 읽히진 않아요. 오늘은 어떤지, 한 번 더 물어봐 주세요.",
    situations,
  };
};
