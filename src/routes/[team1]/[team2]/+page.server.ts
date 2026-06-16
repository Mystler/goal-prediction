import { predictionData } from "$lib/server/MatchData";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ params }) => {
  return {
    match: await predictionData(params.team1, params.team2),
  };
};
