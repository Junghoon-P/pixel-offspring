import type { Parent, Traits } from "./model";
import type { LegendDiscovery, LegendId } from "./personalityModel";
interface LegendDesign { id: LegendId; name: string; hint: string; reason: string; ability: string; decoration: "leaves" | "flame" | "blanket" | "sparkles" }
export const LEGENDS: LegendDesign[] = [
  { id: "guardian", name: "티격태격 수호자", hint: "대화의 속도는 반대지만, 마음을 들어주는 두 친구가 만나면?", reason: "대화할 시점은 정반대지만 둘 다 마음을 충분히 듣는 쪽이었어요.", ability: "티격태격하다가도 서로의 마음부터 챙기기", decoration: "sparkles" },
  { id: "expedition", name: "이불 밖 원정대", hint: "같은 곳을 꿈꾸는, 다른 속도의 친구를 만나보세요.", reason: "둘 다 새로운 경험을 좋아하지만 활동 리듬은 정반대였어요.", ability: "가보고 싶은 곳과 쉬어갈 곳을 동시에 발견하기", decoration: "leaves" },
  { id: "silent", name: "무언의 동맹", hint: "말은 적어도 마음을 충분히 들어주는 두 친구가 만나면?", reason: "둘 다 조용히 표현하고 공감을 먼저 건네는 성향이 강했어요.", ability: "말없이 간식부터 건네 마음을 알아주기", decoration: "blanket" },
  { id: "chaos", name: "무계획 대참사", hint: "준비보다 출발이 빠른 두 친구가 만나면?", reason: "둘 다 새로운 경험을 좋아하고 즉흥적으로 움직이는 성향이 강했어요.", ability: "길은 잃어도 이야기만큼은 잔뜩 가져오기", decoration: "flame" },
];
const matches = (id: LegendId, a: Traits, b: Traits): boolean => {
  if (id === "guardian") return Math.abs(a.conflict! - b.conflict!) >= 1.5 && a.support! <= -0.5 && b.support! <= -0.5;
  if (id === "expedition") return a.adventure >= 0.5 && b.adventure >= 0.5 &&
    ((a.energy >= 0.5 && b.energy <= -0.5) || (b.energy >= 0.5 && a.energy <= -0.5));
  if (id === "silent") return a.expression! <= -0.75 && b.expression! <= -0.75 && a.support! <= -0.5 && b.support! <= -0.5;
  return a.spontaneity >= 0.75 && b.spontaneity >= 0.75 && a.adventure >= 0.5 && b.adventure >= 0.5;
};
export const discoverLegend = (parents: Parent[]): LegendDiscovery | undefined => {
  if (parents.some((parent) => (parent.quizVersion ?? 0) < 3 || parent.traits.conflict === undefined || parent.traits.support === undefined || parent.traits.expression === undefined)) return undefined;
  const [a, b] = parents.map((parent) => parent.traits);
  const matched = LEGENDS.filter((design) => matches(design.id, a, b));
  const first = matched[0];
  return first ? { version: 1, id: first.id, name: first.name, reason: first.reason, ability: first.ability, matched: matched.map((design) => design.id) } : undefined;
};
