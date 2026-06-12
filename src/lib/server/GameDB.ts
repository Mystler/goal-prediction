import { execSync, spawnSync } from "child_process";

const DBFolder = "../international_results";

export async function updateDB() {
  console.log("Updating DB...");
  execSync("git pull", { cwd: DBFolder });
  console.log("Calcualting ELO Ratings...");
  execSync("pnpm calculate", { cwd: "." });
  console.log("Updated!");
}

export function getLastDBUpdateDate() {
  return new Date(execSync("git log -1 --format=%cI", { cwd: DBFolder }).toString().trim());
}
