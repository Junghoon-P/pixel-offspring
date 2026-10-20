import { writeFileSync } from "node:fs";
import { parentRecipe, scoreAnswers, offspring } from "../src/domain/engine";
import { BODY_NAMES, compatible } from "../src/domain/catalog";
import type { Body, Decoration, Parent, Recipe } from "../src/domain/model";
const bodies = Object.keys(BODY_NAMES) as Body[];
const decorations: Decoration[] = ["flame", "blanket", "sparkles", "leaves"];
const sets = decorations.flatMap((first, index): Decoration[][] => [
  [first],
  ...decorations
    .slice(index + 1)
    .filter((second) => !(first === "flame" && second === "leaves"))
    .map((second) => [first, second]),
]);
const cases = bodies.flatMap((body) =>
  sets
    .filter((set) => set.every((item) => compatible(body, item)))
    .flatMap((set) =>
      (["happy", "sleepy"] as const).map(
        (face): Recipe => ({
          assetVersion: 3,
          body,
          face,
          decorations: set,
          palette: "original",
        }),
      ),
    ),
);
const parents: Parent[] = Array.from({ length: 64 }, (_, mask) => {
  const answers = Array.from({ length: 6 }, (_, i) => ({
    questionId: `q${i + 1}`,
    optionId: mask & (1 << i) ? "b" : "a",
  }));
  return {
    id: `pattern-${mask}`,
    nickname: `패턴 ${mask + 1}`,
    traits: scoreAnswers(answers),
    recipe: parentRecipe(answers),
    assetVersion: 3,
  };
});
const key = (recipe: Recipe): string =>
  `${recipe.body}/${recipe.face}/${[...recipe.decorations].sort().join("+")}`;
const counts: Record<string, number> = {};
const children = new Set<string>();
for (const parent of parents)
  counts[key(parent.recipe)] = (counts[key(parent.recipe)] ?? 0) + 1;
for (const a of parents) {
  for (const b of parents)
    children.add(
      key(
        (await offspring({ ...a, id: `a-${a.id}` }, { ...b, id: `b-${b.id}` }))
          .recipe,
      ),
    );
}
const report = {
  parentAnswerPatterns: 64,
  uniqueParentRecipes: Object.keys(counts).length,
  fixedIdOrderedPairs: 4096,
  uniqueSampleChildRecipes: children.size,
  supportedNonemptyRecipes: cases.length,
  parentDistribution: counts,
  sampledChildRecipes: [...children].sort(),
  cases,
};
writeFileSync(
  "docs/character-audit-data.json",
  JSON.stringify(report, null, 2) + "\n",
);
process.stdout.write(
  JSON.stringify(
    { ...report, cases: undefined, sampledChildRecipes: undefined },
    null,
    2,
  ) + "\n",
);
