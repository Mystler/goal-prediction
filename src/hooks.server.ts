import { building } from "$app/environment";
import { updateDB } from "$lib/server/GameDB";
import type { ServerInit } from "@sveltejs/kit";

export const init: ServerInit = async () => {
  process.on("SIGINT", () => {
    process.exit(0);
  });

  if (!building) {
    // Update DB and Ratings once and every hour after
    updateDB();
    setInterval(() => {
      updateDB();
    }, 3_600_000);
  }
};
