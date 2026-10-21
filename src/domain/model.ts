import type { CharacterMatch, PersonalityReading, Compatibility, LegendDiscovery, LegendId, TraitAxis } from "./personalityModel";
export type LegacyBody = "snail" | "ghost" | "jelly" | "mushroom" | "bird" | "dragon";
export type ComicBody = "capybara" | "frog" | "duck" | "cat" | "hamster" | "potato" | "raccoon" | "penguin" | "axolotl" | "sloth" | "cucumber" | "broccoli" | "pepe" | "squidward";
export type Body = LegacyBody | ComicBody;
export type Hybrid = "mushroom-bird" | "snail-dragon" | "ghost-jelly"
  | "capybara-frog" | "duck-cat" | "hamster-potato" | "raccoon-penguin" | "axolotl-sloth";
export type Face = "happy" | "sleepy" | "signature";
export type Decoration = "flame" | "blanket" | "sparkles" | "leaves";
export interface Traits {
  adventure: number;
  energy: number;
  spontaneity: number;
  expression?: number;
  conflict?: number;
  support?: number;
}
export interface Recipe {
  assetVersion: 1 | 2 | 3 | 4;
  body: Body;
  hybrid?: Hybrid;
  hybridStyle?: "costume";
  portraitStyle?: "personality";
  fusionBody?: Body;
  fusionStyle?: "meme";
  legend?: LegendId;
  face: Face;
  decorations: Decoration[];
  palette: "original";
}
export interface AnswerEvidence {
  questionId: string;
  question: string;
  answer: string;
  axis: TraitAxis;
  score: number;
}
export interface CombinationReading {
  version: 1;
  headline: string;
  evidence: { axis: TraitAxis; title: string; parents: { parentId: string; question: string; answer: string }[]; interpretation: string }[];
}
export interface Profile {
  evidence?: AnswerEvidence[];
  characterMatch?: CharacterMatch;
  reading?: PersonalityReading;
  typeId: string;
  name: string;
  description: string;
  ability: string;
}
export interface Parent {
  quizVersion?: 1 | 2 | 3 | 4;
  scoreVersion?: 1 | 2 | 3 | 4;
  profile?: Profile;
  id: string;
  nickname: string;
  traits: Traits;
  recipe: Recipe;
  assetVersion: 1 | 2 | 3 | 4;
}
export interface Character extends Parent {
  createdAt: number;
  expiresAt: number;
}
export interface Inheritance {
  parentId: string;
  partId: string;
  slot: "body" | "face" | "decoration" | "palette";
  label: string;
}
export interface Child {
  combinationReading?: CombinationReading;
  compatibility?: Compatibility;
  legend?: LegendDiscovery;
  recipe: Recipe;
  name: string;
  description: string;
  ability: string;
  inheritance: Inheritance[];
  notes?: string[];
  engineVersion: 1 | 2 | 3;
  copyVersion: 1 | 2;
}
export interface PublicParent {
  quizVersion?: 1 | 2 | 3 | 4;
  scoreVersion?: 1 | 2 | 3 | 4;
  profile?: Profile;
  id: string;
  nickname: string;
  recipe: Recipe;
  assetVersion: 1 | 2 | 3 | 4;
}
export interface PublicResult {
  resultId: string;
  parents: PublicParent[];
  child: Child;
  createdAt: number;
  expiresAt: number;
}
export interface Invite {
  id: string;
  url: string;
  expiresAt: number;
}
export interface InvitePreview {
  parent: PublicParent;
  expiresAt: number;
}
export interface ResultPage {
  items: PublicResult[];
  nextCursor: string | null;
}
export interface Pair {
  resultId: string;
  resultUrl: string;
  created: boolean;
  expiresAt: number;
}
