import { comicRecipe } from "./comicCatalog";
import { answersV2Schema } from "../shared/contracts";
import type { Body, Profile, Recipe, Traits } from "./model";
type Axis = "adventure" | "energy" | "spontaneity" | "expression";
interface Question {
  id: string;
  text: string;
  a: string;
  b: string;
  axis: Axis;
  aScore: number;
}
export const QUESTIONS_V2: Question[] = [
  {
    id: "q1",
    axis: "adventure",
    aScore: -1,
    text: "산책 중 처음 보는 골목을 발견했다.",
    a: "늘 가던 길로 이어 걷는다",
    b: "골목 안에 뭐가 있는지 들어가 본다",
  },
  {
    id: "q2",
    axis: "energy",
    aScore: 1,
    text: "약속 없는 오후, 몸이 원하는 건?",
    a: "밖에서 이것저것 움직이기",
    b: "한곳에서 느긋하게 쉬기",
  },
  {
    id: "q3",
    axis: "spontaneity",
    aScore: -1,
    text: "친구와 작은 여행을 가기로 했다.",
    a: "꼭 갈 곳과 동선을 정해 둔다",
    b: "도착해서 끌리는 곳을 고른다",
  },
  {
    id: "q4",
    axis: "expression",
    aScore: 1,
    text: "마음에 꼭 드는 선물을 받았다.",
    a: "왜 좋은지 신나게 이야기한다",
    b: "오래 간직하며 조용히 고마워한다",
  },
  {
    id: "q5",
    axis: "adventure",
    aScore: 1,
    text: "자주 가는 식당에 새 메뉴가 생겼다.",
    a: "오늘은 새 메뉴를 먹어 본다",
    b: "좋아하는 메뉴를 다시 즐긴다",
  },
  {
    id: "q6",
    axis: "energy",
    aScore: -1,
    text: "재미있는 하루를 보내고 집에 왔다.",
    a: "편한 자세로 쉬고 싶다",
    b: "좋아하는 일을 조금 더 하고 싶다",
  },
  {
    id: "q7",
    axis: "spontaneity",
    aScore: 1,
    text: "주말에 하고 싶은 일이 몇 가지 있다.",
    a: "그날 끌리는 것부터 한다",
    b: "순서를 정해두면 마음이 편하다",
  },
  {
    id: "q8",
    axis: "expression",
    aScore: -1,
    text: "친구가 예상 밖의 웃긴 이야기를 했다.",
    a: "웃으면서 찬찬히 들어 준다",
    b: "내 이야기도 보태며 반응한다",
  },
  {
    id: "q9",
    axis: "adventure",
    aScore: -1,
    text: "취미에 쓸 작은 도구를 고른다면?",
    a: "써봐서 손에 익은 도구",
    b: "아직 안 써본 새로운 도구",
  },
  {
    id: "q10",
    axis: "energy",
    aScore: 1,
    text: "작은 축제에 놀러 왔다.",
    a: "여러 부스를 차례로 돌아보고 싶다",
    b: "마음에 드는 곳을 오래 즐기고 싶다",
  },
  {
    id: "q11",
    axis: "spontaneity",
    aScore: -1,
    text: "친구와 만날 날이 정해졌다.",
    a: "시간과 장소를 미리 정해두고 싶다",
    b: "당일 상황을 보고 정하고 싶다",
  },
  {
    id: "q12",
    axis: "expression",
    aScore: 1,
    text: "마음에 드는 사진 한 장을 찍었다.",
    a: "바로 보여 주며 감상을 나눈다",
    b: "혼자 몇 번 더 들여다본다",
  },
];
const TYPE_NAMES = [
  "포근한 기록가",
  "다정한 준비꾼",
  "느긋한 감상가",
  "말랑한 이야기꾼",
  "동네 길잡이",
  "든든한 분위기꾼",
  "가벼운 산책가",
  "흥겨운 단골 친구",
  "조용한 탐사자",
  "호기심 수집가",
  "느린 발견가",
  "상상 여행가",
  "씩씩한 개척자",
  "신나는 원정대장",
  "자유로운 모험가",
  "반짝이는 즉흥가",
];
const AXES: Axis[] = ["adventure", "energy", "spontaneity", "expression"];
export const scoreSurvey = (input: unknown): Traits => {
  const answers = answersV2Schema.parse(input);
  const score = (axis: Axis): number =>
    QUESTIONS_V2.filter((q) => q.axis === axis).reduce(
      (sum, q) =>
        sum +
        (answers.find((a) => a.questionId === q.id)!.optionId === "a"
          ? q.aScore
          : -q.aScore),
      0,
    ) / 3;
  return {
    adventure: score("adventure"),
    energy: score("energy"),
    spontaneity: score("spontaneity"),
    expression: score("expression"),
  };
};
export const describeTraits = (traits: Traits): Profile => {
  const typeId = AXES.map((axis) => ((traits[axis] ?? 0) > 0 ? "1" : "0")).join(
    "",
  );
  const discovery =
    traits.adventure > 0
      ? "새로운 길을 발견하고"
      : "익숙한 곳의 작은 변화를 찾고";
  const rhythm =
    traits.energy > 0 ? "발걸음은 경쾌해요" : "자기 속도로 천천히 즐겨요";
  const plan =
    traits.spontaneity > 0
      ? "마음이 이끄는 순간을 따라"
      : "작은 준비를 차곡차곡 쌓아";
  const expression =
    (traits.expression ?? 0) > 0
      ? "좋아하는 마음을 풍성하게 나눠요"
      : "좋아하는 마음을 조용히 간직해요";
  return {
    typeId,
    name: TYPE_NAMES[parseInt(typeId, 2)],
    description: `${discovery} ${rhythm}. ${plan} ${expression}.`,
    ability: `${traits.spontaneity > 0 ? "우연히 만난" : "미리 점찍은"} ${traits.adventure > 0 ? "새로운 장소" : "단골 장소"}에서 ${traits.energy > 0 ? "즐거움 열 개" : "소중한 장면 하나"} ${(traits.expression ?? 0) > 0 ? "친구에게 전하기" : "오래 기억하기"}`,
  };
};
interface SurveyProfile {
  traits: Traits;
  recipe: Recipe;
  profile: Profile;
}
export const TYPE_BODIES: Body[] = [
  "potato", "cat", "capybara", "ghost",
  "frog", "bird", "jelly", "duck",
  "snail", "hamster", "mushroom", "sloth",
  "dragon", "raccoon", "penguin", "axolotl",
];
export const createSurveyProfile = (input: unknown): SurveyProfile => {
  const traits = scoreSurvey(input);
  const profile = describeTraits(traits);
  const body = selectSurveyBody(profile.typeId, traits);
  return { traits, profile, recipe: comicRecipe(body) };
};
const selectSurveyBody = (typeId: string, traits: Traits): Body => {
  // 유형은 유지하고 축별 답변 강도로 후보를 정해 재시도·답변 순서에도 외형이 같다.
  if (typeId === "0000" && traits.energy === -1 / 3 && traits.expression === -1) return "cucumber";
  if (typeId === "1101" && traits.energy === 1 / 3 && traits.expression === 1) return "broccoli";
  if (typeId === "0101" && traits.energy === 1 / 3 && traits.expression === 1) return "pepe";
  if (typeId === "1000" && traits.energy === -1 / 3 && traits.expression === -1) return "squidward";
  return TYPE_BODIES[parseInt(typeId, 2)];
};
export const surveyExamples = (): SurveyProfile[] =>
  Array.from({ length: 16 }, (_, index) => {
    const bits = index.toString(2).padStart(4, "0");
    return createSurveyProfile(
      QUESTIONS_V2.map((q) => ({
        questionId: q.id,
        optionId:
          q.aScore === (bits[AXES.indexOf(q.axis)] === "1" ? 1 : -1)
            ? "a"
            : "b",
      })),
    );
  });
