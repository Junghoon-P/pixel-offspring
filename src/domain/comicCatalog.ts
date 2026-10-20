import type { Body, ComicBody, Hybrid, LegacyBody, Recipe } from "./model";
export const COMIC_BODIES: ComicBody[] = ["capybara", "frog", "duck", "cat", "hamster", "potato", "raccoon", "penguin", "axolotl", "sloth", "cucumber", "broccoli", "pepe", "squidward"];
export const isLegacyBody = (body: Body): body is LegacyBody =>
  !COMIC_BODIES.some((item) => item === body);
export interface HybridDesign {
  id: Hybrid;
  parents: [Body, Body];
  baseBody: Body;
  costumeLabel: string;
  name: string;
  description: string;
  ability: string;
}
export const HYBRIDS: HybridDesign[] = [
  { id: "capybara-frog", parents: ["capybara", "frog"], baseBody: "capybara", costumeLabel: "개구리 우비",
    name: "개구리 우비 카피바라", description: "비가 올까 봐 개구리 우비를 챙겼어요. 커피가 식기 전까지는 현관에서 느긋하게 기다릴 거예요.",
    ability: "우비를 입고도 비 오는 날을 실내에서 즐기기." },
  { id: "duck-cat", parents: ["duck", "cat"], baseBody: "duck", costumeLabel: "고양이 후드",
    name: "고양이 후드 오리", description: "고양이처럼 조용히 다니려고 후드를 썼어요. 첫인사는 자신 있게 꽥이라고 해 버렸어요.",
    ability: "변장 첫마디에 정체 들키기." },
  { id: "hamster-potato", parents: ["hamster", "potato"], baseBody: "hamster", costumeLabel: "감자 잠옷과 넥타이",
    name: "감자 잠옷 햄스터", description: "감자 잠옷 위에 넥타이만 매고 출근 준비를 끝냈어요. 볼주머니에는 오늘의 간식을 챙겼어요.",
    ability: "잠옷 차림으로도 출근한 기분 내기." },
  { id: "raccoon-penguin", parents: ["raccoon", "penguin"], baseBody: "raccoon", costumeLabel: "펭귄 망토",
    name: "펭귄 망토 라쿤", description: "펭귄 망토를 입고 뒤뚱뒤뚱 걸어 봐요. 숨기지 못한 줄무늬 꼬리가 뒤에서 따라와요.",
    ability: "뒤에서 보면 바로 들키는 완벽한 변장." },
  { id: "axolotl-sloth", parents: ["axolotl", "sloth"], baseBody: "axolotl", costumeLabel: "나무늘보 수면모자와 잠옷",
    name: "꿀잠 준비 우파루파", description: "나무늘보 수면모자를 쓰고 알람시계를 꼭 안았어요. 깨워 달라는 건지 같이 자자는 건지 모르겠어요.",
    ability: "알람시계까지 재우는 포근한 낮잠." },
  { id: "mushroom-bird", parents: ["mushroom", "bird"], baseBody: "bird", costumeLabel: "버섯 모자",
    name: "버섯 모자 작은 새", description: "버섯 모자를 쓰고 소풍에 나섰어요. 모자가 살짝 기울어도 날개를 펴고 당당하게 걸어요.",
    ability: "모자 하나로 소풍 분위기 완성하기." },
  { id: "snail-dragon", parents: ["snail", "dragon"], baseBody: "dragon", costumeLabel: "달팽이 배낭",
    name: "달팽이 배낭 꼬마 용", description: "달팽이 모양 배낭에 간식을 잔뜩 챙겼어요. 여행보다 짐 싸는 시간이 더 신나는 꼬마 용이에요.",
    ability: "천천히 걸으며 간식 빠짐없이 가져가기." },
  { id: "ghost-jelly", parents: ["ghost", "jelly"], baseBody: "ghost", costumeLabel: "푸딩 모자",
    name: "푸딩 모자 유령", description: "푸딩 모자를 쓰고 깜짝 등장했어요. 친구들이 놀라기보다 귀엽다고 해서 조금 뿌듯해요.",
    ability: "놀래키러 갔다가 디저트 파티에 초대받기." },
];
export const findHybrid = (a: Body, b: Body): HybridDesign | undefined =>
  HYBRIDS.find((design) => design.parents.some((body) => body === a) && design.parents.some((body) => body === b) && a !== b);
export const comicRecipe = (body: Body): Recipe => ({
  assetVersion: 4, body, face: "signature", decorations: [], palette: "original",
});
export const COMIC_COPY: Record<Body, { description: string; ability: string }> = {
  pepe: { description: "눈은 촉촉하지만 엄지는 꿋꿋하게 올라가요. 말없이 보내는 응원에는 묘하게 설득력이 있어요.", ability: "엄지 하나로 친구에게 괜찮다고 전하기" },
  squidward: { description: "할 말은 많지만 눈꺼풀만 움직여요. 소란스러운 하루가 끝나면 혼자만의 조용한 시간을 기다려요.", ability: "한 번의 눈빛으로 긴 감상평 대신하기" },
  cucumber: { description: "커피는 다 마셨는데 월요일은 아직 남았어요. 길어진 얼굴만큼 생각도 잠깐 쉬는 중이에요.", ability: "아무 말 없이 눈꺼풀로 모든 감상 전하기" },
  broccoli: { description: "일단 엄지는 올렸어요. 괜찮다는 말보다 눈 밑 그늘이 조금 더 솔직한 브로콜리예요.", ability: "난감한 순간에도 일단 분위기는 살리기" },
  ghost: { description: "벽은 통과하지만 청소기 줄에는 걸려요. 집안일 앞에서는 초능력도 쉬는 날이에요.", ability: "먼지보다 먼저 자기 자신을 청소하기" },
  jelly: { description: "계획은 완벽했는데 몸이 먼저 녹았어요. 접시 위에서 조용히 백기를 흔들어요.", ability: "어떤 상황에도 유연하게 늘어져 있기" },
  snail: { description: "배송은 느려도 준비물은 빠짐없어요. 오늘도 집보다 큰 택배를 싣고 출발해요.", ability: "문 앞까지 집도 함께 배달하기" },
  dragon: { description: "불을 뿜을 줄은 알지만 마시멜로 하나에도 온 힘을 써요. 작은 성공에도 온몸이 뿌듯해져요.", ability: "간식 하나 굽고 대모험을 끝낸 기분 내기" },
  mushroom: { description: "머리가 이미 우산인데 우산을 하나 더 챙겼어요. 혹시 모를 혹시를 준비하는 버섯이에요.", ability: "비 예보가 없어도 이중으로 대비하기" },
  bird: { description: "과자 하나만 가져가려다 자기보다 큰 걸 골랐어요. 뻔뻔한 얼굴로 날개를 바삐 움직여요.", ability: "욕심만큼 큰 간식으로 비행 연습하기" },
  raccoon: { description: "뭐든 깨끗이 씻고 나서 생각해요. 솜사탕도 씻으면 좋아질 줄 알았어요.", ability: "간식을 세탁하고 추억만 남기기" },
  penguin: { description: "빙판의 주인공인 줄 알았는데 오늘도 엉덩이로 이동해요. 헬멧만큼은 제대로 썼어요.", ability: "넘어지면서 목적지까지 도착하기" },
  axolotl: { description: "물속에 살지만 물안경과 튜브는 꼭 필요해요. 준비를 끝내면 비로소 신나게 떠다녀요.", ability: "익숙한 곳에서도 첫 여행처럼 설레기" },
  sloth: { description: "출발한다고 말한 지 한참인데 아직 잠옷이에요. 서두르는 마음만 먼저 도착했어요.", ability: "알람 세 개와 평화롭게 공존하기" },
  capybara: { description: "급한 일도 온천 밖에서 기다리게 해요. 머리 위 귤이 떨어지기 전까지는 퇴근 상태예요.", ability: "주변 사람의 조급함까지 불려 버리기" },
  frog: { description: "눈은 반쯤 감겼지만 커피는 절대 놓지 않아요. 충전 중이라는 말만 벌써 세 번째예요.", ability: "커피 향만 맡고 5분 더 버티기" },
  duck: { description: "간식을 챙기려다 간식에 끼었어요. 당황하지 않은 척 날개를 펼치고 있어요.", ability: "어디서든 아침 식사 준비 완료" },
  cat: { description: "상자가 작은 게 아니라 세상이 넓은 거예요. 불편해 보이지만 나올 생각은 없어요.", ability: "불가능해 보이는 공간에 자리 잡기" },
  hamster: { description: "비상식량은 충분하지만 씨앗 하나도 양보할 수 없어요. 말 대신 볼주머니로 대답해요.", ability: "여행 가방 없이 간식 삼 일 치 챙기기" },
  potato: { description: "넥타이는 출근했지만 마음은 아직 침대예요. 아무 생각이 없는 듯 아주 많은 생각을 멈췄어요.", ability: "가만히 있어도 회의에 참석한 것처럼 보이기" },
};
