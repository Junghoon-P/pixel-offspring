import type { Body, Traits } from "./model";
import type { CharacterMatch, TraitAxis } from "./personalityModel";
export const TYPE_AXES: TraitAxis[] = ["adventure", "energy", "spontaneity", "expression"];
export const BALANCED_THRESHOLD = 0.25;
interface CharacterDesign { typeId: string; body: Body; name: string; visualStory: string; artDirection: string }
export const PERSONALITY_CHARACTERS: CharacterDesign[] = [
  { typeId: "0000", body: "sloth", name: "느긋한 준비꾼", visualStory: "잠옷은 편안한 속도를, 알람은 미리 챙기는 습관을 담았어요.", artDirection: "알람을 맞추고 이불을 정돈하는 차분한 표정. 게으름으로 묘사하지 않기." },
  { typeId: "0001", body: "mushroom", name: "마음까지 챙긴 준비꾼", visualStory: "우산과 장화에는 꼼꼼한 준비를, 여분 우산을 내미는 웃음에는 마음을 나누는 모습을 담았어요.", artDirection: "반갑게 웃으며 여분 우산을 건네는 원화 반영 완료." },
  { typeId: "0010", body: "capybara", name: "느긋한 쉼표 수집가", visualStory: "온천에 몸을 맡긴 자세에 익숙한 공간, 여유로운 선택, 조용한 휴식을 담았어요.", artDirection: "물에 편히 기대고 작은 귤을 머리에 얹은 안정된 실루엣 유지." },
  { typeId: "0011", body: "jelly", name: "말랑한 기분 전달자", visualStory: "편안히 퍼진 몸에는 느긋한 즉흥성을, 활짝 웃는 손인사에는 숨기지 않는 마음을 담았어요.", artDirection: "백기 대신 손인사와 편안한 미소 반영 완료." },
  { typeId: "0100", body: "potato", name: "묵묵한 일상 실행가", visualStory: "체크리스트와 넥타이에는 일상의 순서를, 힘찬 발걸음과 담담한 얼굴에는 조용한 실행력을 담았어요.", artDirection: "체크리스트를 들고 걷는 원화 반영 완료." },
  { typeId: "0101", body: "raccoon", name: "부지런한 다정꾼", visualStory: "간식을 씻는 부지런한 손과 친구에게 건네는 사과에, 익숙한 일로 마음을 나누는 모습을 담았어요.", artDirection: "간식을 씻고 나누는 밝은 원화 반영 완료." },
  { typeId: "0110", body: "frog", name: "내 페이스 단골러", visualStory: "단골 커피를 든 가벼운 발걸음과 담담한 표정에, 익숙한 곳을 자기 방식으로 오가는 모습을 담았어요.", artDirection: "커피를 들고 경쾌하게 걷는 원화 반영 완료." },
  { typeId: "0111", body: "bird", name: "흥 오른 간식 친구", visualStory: "큰 과자를 들고 날갯짓하는 모습에, 좋아하는 것을 즉흥적으로 즐기고 나누는 에너지를 담았어요.", artDirection: "과자를 나누자고 날개를 펼치고 활짝 웃기. 간식과 역동적인 날개 유지." },
  { typeId: "1000", body: "snail", name: "차근차근 탐험가", visualStory: "커다란 짐은 새 길을 위한 준비, 작은 발걸음은 서두르지 않는 탐험을 담았어요.", artDirection: "짐에 접힌 지도와 여행 표식 추가. 낯선 길을 확인하는 차분한 시선." },
  { typeId: "1001", body: "hamster", name: "설레는 보급대장", visualStory: "가득 챙긴 볼주머니와 반짝이는 눈에, 새 경험을 준비하고 설렘을 나누는 모습을 담았어요.", artDirection: "여행 간식을 정리하며 하나를 건네기. 느긋한 앉은 자세와 기대하는 표정." },
  { typeId: "1010", body: "ghost", name: "조용한 샛길 탐사자", visualStory: "작은 랜턴을 들고 새 길을 가리키는 모습에, 낯선 곳을 자기 속도로 조용히 탐색하는 마음을 담았어요.", artDirection: "청소기 대신 랜턴과 호기심 어린 손짓 반영 완료." },
  { typeId: "1011", body: "duck", name: "느긋한 호기심 방송국", visualStory: "뜻밖의 빵에 끼고도 날개로 반응하는 모습에, 새 경험과 감상을 편하게 나누는 성향을 담았어요.", artDirection: "새로운 간식을 맛보며 표정으로 감탄하기. 서두르지 않는 앉은 자세." },
  { typeId: "1100", body: "penguin", name: "장비부터 챙긴 개척자", visualStory: "헬멧은 준비를, 빙판 위 움직임은 낯선 환경에 직접 뛰어드는 마음을 담았어요.", artDirection: "헬멧을 단단히 쓰고 새 코스를 집중해서 살피기. 활동적인 발과 절제된 표정." },
  { typeId: "1101", body: "axolotl", name: "준비 완료 원정대장", visualStory: "물안경과 튜브를 갖추고 신나게 떠다니는 모습에, 준비된 모험과 드러나는 설렘을 담았어요.", artDirection: "새 물길을 가리키며 친구를 부르는 표정. 튜브와 힘찬 손짓 유지." },
  { typeId: "1110", body: "cat", name: "혼자서도 모험가", visualStory: "상자 썰매로 새 길을 달리는 모습과 담담한 표정에, 자기 선택대로 움직이는 조용한 모험심을 담았어요.", artDirection: "상자 썰매를 타는 역동적인 원화 반영 완료." },
  { typeId: "1111", body: "dragon", name: "일단 해보는 불꽃 친구", visualStory: "직접 불을 뿜고 작은 성공에 신나는 모습에, 새로운 시도를 바로 행동으로 옮기는 성향을 담았어요.", artDirection: "즉흥 간식 실험에 신난 눈과 꼬리. 한 몸의 연결된 실루엣 유지." },
];
interface MatchedCharacter { body: Body; typeId: string; name: string; characterMatch: CharacterMatch }
const specialBody = (typeId: string, traits: Traits): { body: Body; story: string } | undefined => {
  if (typeId === "0000" && traits.energy >= -0.5 && traits.expression! <= -0.75 && traits.conflict! <= -0.75)
    return { body: "cucumber", story: "표현을 아끼고 생각을 정리할 시간을 선호해, 차분한 눈빛의 오이로 나타났어요." };
  if (typeId === "0010" && traits.expression! <= -0.75 && traits.conflict! <= -0.75)
    return { body: "squidward", story: "조용한 표현과 혼자 정리하는 시간을 선호해, 자기 공간을 지키는 징징이로 나타났어요." };
  if (typeId === "0101" && traits.expression! >= 0.75 && traits.support! <= -0.75)
    return { body: "pepe", story: "마음을 표현하고 공감을 먼저 건네는 성향이 뚜렷해, 엄지로 응원하는 페페가 나타났어요." };
  if (typeId === "1101" && traits.expression! >= 0.75 && traits.support! >= 0.75)
    return { body: "broccoli", story: "표현과 실질적인 도움을 함께 선호해, 먼저 해보자고 엄지를 올리는 브로콜리가 나타났어요." };
  return undefined;
};
const mixedName = (traits: Traits): string => {
  const axis = [...TYPE_AXES].sort((a, b) => Math.abs(traits[b] ?? 0) - Math.abs(traits[a] ?? 0))[0];
  const names: Record<string, [string, string]> = {
    adventure: ["익숙함을 아끼는", "새로움에 끌리는"], energy: ["여유를 즐기는", "움직임을 즐기는"],
    spontaneity: ["준비가 편한", "즉흥이 편한"], expression: ["조용히 표현하는", "마음을 나누는"],
  };
  return `${names[axis][(traits[axis] ?? 0) > 0 ? 1 : 0]} 혼합형`;
};
export const matchCharacter = (traits: Traits): MatchedCharacter => {
  const typeId = TYPE_AXES.map((axis) => Math.abs(traits[axis] ?? 0) < BALANCED_THRESHOLD ? "x" : traits[axis]! > 0 ? "1" : "0").join("");
  const kind = typeId === "xxxx" ? "balanced" : typeId.includes("x") ? "mixed" : "type";
  // 동점 축으로 새 성향을 만들지 않는다. 대표 그림의 선택과 성향 판정을 분리한다.
  const candidates = PERSONALITY_CHARACTERS.filter((design) => [...typeId].every((bit, index) => bit === "x" || bit === design.typeId[index]));
  const design = candidates.find((item) => item.body === "capybara") ?? candidates[0];
  const special = kind === "type" ? specialBody(typeId, traits) : undefined;
  const reason = kind === "balanced" ? "네 가지 기본 성향이 모두 균형 범위예요. 특정 유형으로 단정하지 않고 카피바라를 대표 외형으로 보여드려요. 그림의 느긋한 자세가 활동성이 낮다는 뜻은 아니에요."
    : kind === "mixed" ? `뚜렷한 성향은 반영하고 중립인 축은 열어뒀어요. ${candidates.length}개 유형이 가능해, 그중 하나를 대표 외형으로 보여드려요. 자세한 성향은 아래 풀이를 봐주세요.`
    : special?.story ?? design.visualStory;
  return { body: special?.body ?? design.body, typeId,
    name: kind === "balanced" ? "경계 없는 균형가" : kind === "mixed" ? mixedName(traits) : design.name,
    characterMatch: { version: 1, kind, reason },
  };
};
