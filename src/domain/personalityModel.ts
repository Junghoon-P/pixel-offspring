export type TraitAxis = "adventure" | "energy" | "spontaneity" | "expression" | "conflict" | "support";
export type LegendId = "expedition" | "chaos" | "silent" | "guardian";
export interface TraitReading { axis: TraitAxis; label: string; score: number; summary: string }
export interface PersonalityReading {
  version: 1;
  headline: string;
  strength: string;
  misunderstanding: string;
  stress: string;
  friendship: string;
  axes: TraitReading[];
}
export interface SituationReading { title: string; match: string; friction: string; tip: string }
export interface Compatibility {
  version: 1;
  title: string;
  partial: boolean;
  strengths: string[];
  complement: string;
  situations: SituationReading[];
}
export interface LegendDiscovery {
  version: 1;
  id: LegendId;
  name: string;
  reason: string;
  ability: string;
  matched: LegendId[];
}
