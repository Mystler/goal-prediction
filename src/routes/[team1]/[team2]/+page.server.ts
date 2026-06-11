import { predictMatch } from "$lib/server/GoalProjection";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ params }) => {
  return {
    match: await predictMatch(params.team1, params.team2),
  };
};
