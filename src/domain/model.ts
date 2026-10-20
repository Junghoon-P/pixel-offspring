export type Body = "snail" | "ghost" | "jelly" | "mushroom" | "bird" | "dragon";
export type Face = "happy" | "sleepy";
export type Decoration = "flame" | "blanket" | "sparkles" | "leaves";
export interface Traits {
  adventure: number;
  energy: number;
  spontaneity: number;
  expression?: number;
}
export interface Recipe {
  assetVersion: 1 | 2 | 3;
  body: Body;
  face: Face;
  decorations: Decoration[];
  palette: "original";
}
export interface Profile {
  typeId: string;
  name: string;
  description: string;
  ability: string;
}
export interface Parent {
  quizVersion?: 1 | 2;
  scoreVersion?: 1 | 2;
  profile?: Profile;
  id: string;
  nickname: string;
  traits: Traits;
  recipe: Recipe;
  assetVersion: 1 | 2 | 3;
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
  recipe: Recipe;
  name: string;
  description: string;
  ability: string;
  inheritance: Inheritance[];
  notes?: string[];
  engineVersion: 1 | 2;
  copyVersion: 1 | 2;
}
export interface PublicParent {
  quizVersion?: 1 | 2;
  scoreVersion?: 1 | 2;
  profile?: Profile;
  id: string;
  nickname: string;
  recipe: Recipe;
  assetVersion: 1 | 2 | 3;
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
