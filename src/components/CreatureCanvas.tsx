"use client";
import { useEffect, useRef, useState } from "react";
import type { ReactElement } from "react";
import type { Recipe } from "../domain/model";
import { drawCreature } from "./renderCreature";
export const CreatureCanvas = ({
  recipe,
  label,
  scale = 3,
}: {
  recipe: Recipe;
  label: string;
  scale?: number;
}): ReactElement => {
  const ref = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    let alive = true;
    const canvas = document.createElement("canvas");
    canvas.width = 64 * scale;
    canvas.height = 64 * scale;
    const context = canvas.getContext("2d");
    if (!context) return;
    void drawCreature(context, recipe, 0, 0, scale)
      .then(() => {
        if (alive) {
          const target = ref.current?.getContext("2d");
          target?.clearRect(0, 0, canvas.width, canvas.height);
          target?.drawImage(canvas, 0, 0);
          if (ref.current) ref.current.dataset.ready = "true";
          setError("");
        }
      })
      .catch(() => {
        if (alive)
          setError("생물 그림을 불러오지 못했어요. 새로고침해 주세요.");
      });
    return () => {
      alive = false;
    };
  }, [recipe, scale]);
  return (
    <>
      <canvas
        ref={ref}
        width={64 * scale}
        height={64 * scale}
        data-asset-version={recipe.assetVersion}
        role="img"
        aria-label={label}
      />
      {error && <p role="alert">{error}</p>}
    </>
  );
};
