import { answersV3Schema, personalityReadingSchema, compatibilitySchema, legendDiscoverySchema, legendIdSchema } from "./personalitySchemas";
import { isLegacyBody, HYBRIDS } from "../domain/comicCatalog";
import { z } from "zod";
export const graphemes = (text: string): string[] =>
  Array.from(
    new Intl.Segmenter("ko", { granularity: "grapheme" }).segment(text),
    (item) => item.segment,
  );
export const nicknameSchema = z
  .string()
  .max(256)
  .transform((s) => s.normalize("NFC").trim())
  .refine(
    (s) =>
      graphemes(s).length >= 1 &&
      graphemes(s).length <= 12 &&
      !/[\u0000-\u001f\u007f-\u009f\u061c\u200e\u200f\u202a-\u202e\u2066-\u2069]/u.test(
        s,
      ),
    "닉네임은 줄바꿈 없이 1~12글자로 입력해 주세요.",
  );
export const answersSchema = z
  .array(
    z
      .object({
        questionId: z.enum(["q1", "q2", "q3", "q4", "q5", "q6"]),
        optionId: z.enum(["a", "b"]),
      })
      .strict(),
  )
  .length(6)
  .refine((a) => new Set(a.map((v) => v.questionId)).size === 6);
export const idSchema = z.uuid();
export const answersV2Schema = z
  .array(
    z
      .object({
        questionId: z.enum([
          "q1",
          "q2",
          "q3",
          "q4",
          "q5",
          "q6",
          "q7",
          "q8",
          "q9",
          "q10",
          "q11",
          "q12",
        ]),
        optionId: z.enum(["a", "b"]),
      })
      .strict(),
  )
  .length(12)
  .refine((answers) => new Set(answers.map((a) => a.questionId)).size === 12);
export const submissionSchema = z.discriminatedUnion("quizVersion", [
  z.object({ quizVersion: z.literal(3), nickname: nicknameSchema, answers: answersV3Schema, idempotencyKey: idSchema }).strict(),
  z
    .object({
      quizVersion: z.literal(1),
      nickname: nicknameSchema,
      answers: answersSchema,
      idempotencyKey: idSchema,
    })
    .strict(),
  z
    .object({
      quizVersion: z.literal(2),
      nickname: nicknameSchema,
      answers: answersV2Schema,
      idempotencyKey: idSchema,
    })
    .strict(),
]);
export const bodySchema = z.enum([
  "snail",
  "cucumber", "broccoli", "pepe", "squidward",
  "ghost",
  "jelly",
  "mushroom",
  "bird",
  "dragon", "capybara", "frog", "duck", "cat", "hamster", "potato", "raccoon", "penguin", "axolotl", "sloth",
]);
export const recipeSchema = z
  .object({
    assetVersion: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]),
    body: bodySchema,
    face: z.enum(["happy", "sleepy", "signature"]),
    hybrid: z.enum(["mushroom-bird", "snail-dragon", "ghost-jelly", "capybara-frog",
      "duck-cat", "hamster-potato", "raccoon-penguin", "axolotl-sloth"]).optional(),
    hybridStyle: z.literal("costume").optional(),
    fusionBody: bodySchema.optional(),
    legend: legendIdSchema.optional(),
    decorations: z
      .array(z.enum(["flame", "blanket", "sparkles", "leaves"]))
      .max(2),
    palette: z.literal("original"),
  })
  .strict()
  .refine((r) => {
    if (r.assetVersion !== 4) return isLegacyBody(r.body) && r.face !== "signature" && !r.hybrid && !r.hybridStyle && !r.fusionBody && !r.legend;
    if (r.fusionBody && (r.hybrid || r.hybridStyle)) return false;
    if (r.legend && !r.fusionBody && !r.hybrid) return false;
    const design = HYBRIDS.find((item) => item.id === r.hybrid);
    if (r.hybridStyle && (!design || r.body !== design.baseBody)) return false;
    const validBody = r.hybrid ? design?.parents.some((body) => body === r.body) : true;
    return Boolean(validBody) && r.face === "signature" && r.decorations.length === 0;
  }, "외형 버전과 몸통·표정·장식이 맞지 않아요.")
  .refine(
    (r) =>
      new Set(r.decorations).size === r.decorations.length &&
      !(r.decorations.includes("flame") && r.decorations.includes("leaves")),
    "장식이 중복되거나 같은 자리를 차지해요.",
  )
  .refine(
    (r) =>
      !r.decorations.includes("blanket") ||
      ["snail", "ghost", "jelly"].includes(r.body),
    "몸통과 이불이 맞지 않아요.",
  );
export const traitsSchema = z
  .object({
    adventure: z.number().min(-1).max(1),
    energy: z.number().min(-1).max(1),
    spontaneity: z.number().min(-1).max(1),
    expression: z.number().min(-1).max(1).optional(),
    conflict: z.number().min(-1).max(1).optional(),
    support: z.number().min(-1).max(1).optional(),
  })
  .strict();
export const profileSchema = z
  .object({
    reading: personalityReadingSchema.optional(),
    typeId: z.string().regex(/^[01]{4}$/),
    name: z.string(),
    description: z.string(),
    ability: z.string(),
  })
  .strict();
export const characterSchema = z
  .object({
    id: idSchema,
    nickname: nicknameSchema,
    traits: traitsSchema,
    quizVersion: z.union([z.literal(1), z.literal(2), z.literal(3)]).optional(),
    scoreVersion: z.union([z.literal(1), z.literal(2), z.literal(3)]).optional(),
    profile: profileSchema.optional(),
    recipe: recipeSchema,
    assetVersion: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]),
    createdAt: z.number(),
    expiresAt: z.number(),
  })
  .strict();
export const publicParentSchema = characterSchema.omit({
  traits: true,
  createdAt: true,
  expiresAt: true,
});
export const childSchema = z
  .object({
    compatibility: compatibilitySchema.optional(),
    legend: legendDiscoverySchema.optional(),
    recipe: recipeSchema,
    name: z.string(),
    description: z.string(),
    ability: z.string(),
    inheritance: z.array(
      z
        .object({
          parentId: z.string(),
          partId: z.string(),
          slot: z.enum(["body", "face", "decoration", "palette"]),
          label: z.string(),
        })
        .strict(),
    ),
    notes: z.array(z.string()).optional(),
    engineVersion: z.union([z.literal(1), z.literal(2), z.literal(3)]),
    copyVersion: z.union([z.literal(1), z.literal(2)]),
  })
  .strict();
export const resultSchema = z
  .object({
    resultId: idSchema,
    parents: z.array(publicParentSchema).length(2),
    child: childSchema,
    createdAt: z.number(),
    expiresAt: z.number(),
  })
  .strict();
export const pairInputSchema = z.object({ characterId: idSchema }).strict();
export const inviteInputSchema = pairInputSchema.extend({
  idempotencyKey: idSchema,
});
export const eventSchema = z
  .object({
    event: z.enum([
      "quiz_started",
      "invite_opened",
      "share_opened",
      "link_copied",
      "card_downloaded",
    ]),
  })
  .strict();
export const cursorSchema = z
  .object({ createdAt: z.number().int().nonnegative(), id: idSchema })
  .strict();
