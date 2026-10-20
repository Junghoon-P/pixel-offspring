import type { Body, Decoration, Face } from "./model";
export const BODY_NAMES: Record<Body, string> = {
  pepe: "엄지 척 페페",
  squidward: "퇴근하고 싶은 징징이",
  cucumber: "현타 오이",
  broccoli: "괜찮은 척 브로콜리",
  capybara: "퇴근한 카피바라",
  frog: "카페인 개구리",
  duck: "식빵 낀 오리",
  cat: "박스 과적 고양이",
  hamster: "비상식량 햄스터",
  potato: "출근 감자",
  raccoon: "빨래하는 라쿤",
  penguin: "미끄럼 초보 펭귄",
  axolotl: "물안경 우파루파",
  sloth: "로딩 중 나무늘보",
  snail: "달팽이",
  ghost: "유령",
  jelly: "젤리",
  mushroom: "버섯",
  bird: "작은 새",
  dragon: "꼬마 용",
};
export const COMIC_NAMES: Record<Body, string> = {
  ...BODY_NAMES,
  snail: "택배 과적 달팽이", ghost: "청소하다 엉킨 유령", jelly: "항복한 젤리",
  mushroom: "우산 쓴 버섯", bird: "과자 도둑 새", dragon: "초보 불멍 용",
};
export const FACE_NAMES: Record<Face, string> = {
  signature: "고유 표정과 자세",
  happy: "반짝이는 표정",
  sleepy: "졸린 표정",
};
export const DECORATION_NAMES: Record<Decoration, string> = {
  flame: "불꽃",
  blanket: "이불",
  sparkles: "반짝임",
  leaves: "새싹",
};
export const compatible = (body: Body, decoration: Decoration): boolean =>
  decoration !== "blanket" || ["snail", "ghost", "jelly"].includes(body);
export const QUESTIONS = [
  {
    id: "q1",
    text: "갑자기 쉬는 날이 생겼다!",
    a: "이불 속에 자리 잡기",
    b: "처음 가는 동네 탐험하기",
  },
  {
    id: "q2",
    text: "메뉴판에 낯선 음식이 보이면?",
    a: "늘 먹던 메뉴가 좋다",
    b: "궁금하니까 도전한다",
  },
  {
    id: "q3",
    text: "친구들과 신나게 놀고 집에 오면?",
    a: "충전 시간이 필요하다",
    b: "아직 더 놀 수 있다",
  },
  {
    id: "q4",
    text: "주말에 하고 싶은 일이 세 개 생겼다!",
    a: "하나만 하고 나머지는 다음에",
    b: "일단 세 개 다 해본다",
  },
  {
    id: "q5",
    text: "여행 갈 때 나는?",
    a: "동선부터 정리한다",
    b: "가서 마음 가는 대로 간다",
  },
  {
    id: "q6",
    text: "갑자기 친구가 만나자고 하면?",
    a: "오늘 계획부터 확인한다",
    b: "재미있겠다, 일단 나간다",
  },
];
export const PARTS = [
  "snail",
  "ghost",
  "jelly",
  "mushroom",
  "bird",
  "dragon",
  "happy",
  "sleepy",
  "flame",
  "blanket",
  "sparkles",
  "leaves",
] as const;
