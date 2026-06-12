import { readFileSync } from "fs";
import type { LayoutServerLoad } from "./$types";
import { execSync } from "child_process";

export const load: LayoutServerLoad = async () => {
  return {
    dataUpdated: new Date(execSync("git log -1 --format=%cI", { cwd: "../international_results" }).toString().trim()),
    ratings: JSON.parse(readFileSync("ratings.json", { encoding: "utf-8" })) as Record<string, number>,
  };
};
