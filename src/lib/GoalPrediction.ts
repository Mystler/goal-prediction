import type { predictionData } from "./server/MatchData";

function avgGoals(games: ProcessedGame[], team: string): number[] {
  const goals = [0, 0];
  if (games.length === 0) return [...goals, 0];

  let weightSum = 0;
  for (const game of games) {
    const weight = game.game_weight ?? 0.3;
    weightSum += weight;
    if (game.home_team === team) {
      goals[0] += game.home_score * weight;
      goals[1] += game.away_score * weight;
    } else if (game.away_team === team) {
      goals[1] += game.home_score * weight;
      goals[0] += game.away_score * weight;
    }
  }
  return [...goals.map((x) => x / weightSum), weightSum];
}

export function predictMatch(
  data: Awaited<ReturnType<typeof predictionData>>,
  weights: {
    t1Impact: number;
    t2Impact: number;
    h2h1: number;
    h2h2: number;
    recent1: number;
    recent2: number;
    similar1: number;
    similar2: number;
  },
) {
  if (!data) return;

  const h2hGoals = avgGoals(data.head2headGames, data.team1);
  const recentGoals1 = avgGoals(data.recentGamesTeam1, data.team1);
  const recentGoals2 = avgGoals(data.recentGamesTeam2, data.team2);
  const similarGoals1 = avgGoals(data.similarGamesTeam1, data.team1);
  const similarGoals2 = avgGoals(data.similarGamesTeam2, data.team2);

  const weightH2h1 = weights.h2h1 * h2hGoals[2];
  const weightH2h2 = weights.h2h2 * h2hGoals[2];
  const weightRecentT1 = weights.recent1 * recentGoals1[2];
  const weightRecentT2 = weights.recent2 * recentGoals2[2];
  const weightSimilarT1 = weights.similar1 * similarGoals1[2];
  const weightSimilarT2 = weights.similar2 * similarGoals2[2];
  const weightSumT1 = weightH2h1 + weightRecentT1 + weightSimilarT1;
  const weightSumT2 = weightH2h2 + weightRecentT2 + weightSimilarT2;

  const t1Scored =
    (h2hGoals[0] * weightH2h1 + recentGoals1[0] * weightRecentT1 + similarGoals1[0] * weightSimilarT1) / weightSumT1;
  const t1Conceded =
    (h2hGoals[1] * weightH2h1 + recentGoals1[1] * weightRecentT1 + similarGoals1[1] * weightSimilarT1) / weightSumT1;
  const t2Scored =
    (h2hGoals[1] * weightH2h2 + recentGoals2[0] * weightRecentT2 + similarGoals2[0] * weightSimilarT2) / weightSumT2;
  const t2Conceded =
    (h2hGoals[0] * weightH2h2 + recentGoals2[1] * weightRecentT2 + similarGoals2[1] * weightSimilarT2) / weightSumT2;

  const t1Projected = isNaN(t1Scored)
    ? t2Conceded
    : isNaN(t2Conceded)
      ? t1Scored
      : t1Scored * weights.t1Impact +
        t2Conceded * weights.t2Impact +
        (Math.abs(t1Scored - t2Conceded) / ((t1Scored + t2Conceded) / 2.0)) *
          weights.t1Impact *
          weights.t2Impact *
          (t1Scored - t2Conceded);
  const t2Projected = isNaN(t2Scored)
    ? t1Conceded
    : isNaN(t1Conceded)
      ? t2Scored
      : t2Scored * weights.t2Impact +
        t1Conceded * weights.t1Impact +
        (Math.abs(t2Scored - t1Conceded) / ((t2Scored + t1Conceded) / 2.0)) *
          weights.t1Impact *
          weights.t2Impact *
          (t2Scored - t1Conceded);

  return {
    h2hGoals,
    recentGoals1,
    recentGoals2,
    similarGoals1,
    similarGoals2,
    t1Projected,
    t2Projected,
    t1Scored,
    t1Conceded,
    t2Scored,
    t2Conceded,
  };
}
