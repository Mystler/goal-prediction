import { readFileSync } from "fs";
import type { LayoutServerLoad } from "./$types";

export const load: LayoutServerLoad = async () => {
  return {
    ratings: JSON.parse(readFileSync("ratings.json", { encoding: "utf-8" })) as Record<string, number>,
  };
};
