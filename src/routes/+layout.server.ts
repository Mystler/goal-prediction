import { readFileSync } from "fs";
import type { LayoutServerLoad } from "./$types";
import { getLastDBUpdateDate } from "$lib/server/GameDB";

export const load: LayoutServerLoad = async () => {
  return {
    dataUpdated: getLastDBUpdateDate(),
    ratings: JSON.parse(readFileSync("ratings.json", { encoding: "utf-8" })) as Record<string, number>,
  };
};
