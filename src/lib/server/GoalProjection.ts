import * as fs from "fs";
import { parse } from "csv-parse/sync";
import { eloProb } from "./EloRatings";

function avgGoals(games: ProcessedGame[], team: string): number[] {
  const goals = [0, 0];
  if (games.length === 0) return goals;

  for (const game of games) {
    if (game.home_team === team) {
      goals[0] += game.home_score;
      goals[1] += game.away_score;
    } else if (game.away_team === team) {
      goals[1] += game.home_score;
      goals[0] += game.away_score;
    }
  }
  return goals.map((x) => x / games.length);
}

function parseResults(filePath: string): CsvRow[] {
  const content = fs.readFileSync(filePath, { encoding: "utf-8" });
  return parse(content, { columns: true, skip_empty_lines: true }) as CsvRow[];
}

function toProcessedGames(rows: CsvRow[]): ProcessedGame[] {
  return rows.map((x) => ({
    date: new Date(x["date"]),
    home_team: x["home_team"],
    away_team: x["away_team"],
    home_score: parseInt(x["home_score"]),
    away_score: parseInt(x["away_score"]),
    tournament: x["tournament"],
  }));
}

export async function predictMatch(team1: string, team2: string) {
  const teamdataPath = "ratings.json";
  if (!fs.existsSync(teamdataPath)) {
    console.error(`Ratings file not found!`);
    return;
  }

  const elos = JSON.parse(fs.readFileSync(teamdataPath, { encoding: "utf-8" })) as Record<string, number>;
  team1 = Object.keys(elos).find((key) => key.toLowerCase() === team1.toLowerCase()) ?? "";
  team2 = Object.keys(elos).find((key) => key.toLowerCase() === team2.toLowerCase()) ?? "";
  if (!team1 || !team2) {
    console.error("One or both teams not found!");
    return;
  }

  const t1Elo = elos[team1];
  const t2Elo = elos[team2];
  if (!t1Elo || !t2Elo) {
    console.error("One or both teams not found in teamdata.csv");
    return;
  }

  const diff = t2Elo - t1Elo;
  const t1Prob = eloProb(diff);
  const t2Prob = eloProb(-diff);

  const resultsPath = "../international_results/results.csv";
  if (!fs.existsSync(resultsPath)) {
    console.error(`File not found: ${resultsPath}`);
    return;
  }

  const allRows = parseResults(resultsPath);
  const filteredRows = allRows.filter((x) => {
    const scoresValid = x["home_score"] !== "NA" && x["away_score"] !== "NA";
    const involvesTeam = [team1, team2].includes(x["home_team"]) || [team1, team2].includes(x["away_team"]);
    return scoresValid && involvesTeam;
  });

  let data = toProcessedGames(filteredRows);

  const cutoffDate = new Date();
  cutoffDate.setFullYear(cutoffDate.getFullYear() - 8);
  data = data.filter((x) => x.date >= cutoffDate);
  data.sort((a, b) => a.date.getTime() - b.date.getTime());

  // Head to Head games
  const h2hCount = 3;
  const h2h = data
    .filter((x) => [team1, team2].includes(x.home_team) && [team1, team2].includes(x.away_team))
    .slice(-h2hCount);
  const h2hGoals = avgGoals(h2h, team1);

  // Recent Games
  const recentCount = 10;
  const recent1 = data.filter((x) => [x.home_team, x.away_team].includes(team1)).slice(-recentCount);
  const recentGoals1 = avgGoals(recent1, team1);

  const recent2 = data.filter((x) => [x.home_team, x.away_team].includes(team2)).slice(-recentCount);
  const recentGoals2 = avgGoals(recent2, team2);

  // Similar Opponents
  const similarOpponents = 10;
  const similarCount = 7;
  const t1EloPartners = Object.entries(elos)
    .map(([k, v]) => ({ team: k, diff: Math.abs(t2Elo - v) }))
    .sort((a, b) => a.diff - b.diff)
    .map((x) => x.team)
    .slice(0, similarOpponents);
  const similar1 = data
    .filter(
      (x) =>
        (x.home_team === team1 && t1EloPartners.includes(x.away_team)) ||
        (x.away_team === team1 && t1EloPartners.includes(x.home_team)),
    )
    .slice(-similarCount);
  const similarGoals1 = avgGoals(similar1, team1);
  const t2EloPartners = Object.entries(elos)
    .map(([k, v]) => ({ team: k, diff: Math.abs(t1Elo - v) }))
    .sort((a, b) => a.diff - b.diff)
    .map((x) => x.team)
    .slice(0, similarOpponents);
  const similar2 = data
    .filter(
      (x) =>
        (x.home_team === team2 && t2EloPartners.includes(x.away_team)) ||
        (x.away_team === team2 && t2EloPartners.includes(x.home_team)),
    )
    .slice(-similarCount);
  const similarGoals2 = avgGoals(similar2, team2);

  // Combine
  const weightH2h = 0.25 * h2h.length;
  const weightRecent = 0.5;
  const weightRecentT1 = weightRecent * recent1.length;
  const weightRecentT2 = weightRecent * recent2.length;
  const weightSimilar = 1.0;
  const weightSimilarT1 = weightSimilar * similar1.length;
  const weightSimilarT2 = weightSimilar * similar2.length;
  const weightSumT1 = weightH2h + weightRecentT1 + weightSimilarT1;
  const weightSumT2 = weightH2h + weightRecentT2 + weightSimilarT2;

  const t1Scored =
    (h2hGoals[0] * weightH2h + recentGoals1[0] * weightRecentT1 + similarGoals1[0] * weightSimilarT1) / weightSumT1;
  const t1Conceded =
    (h2hGoals[1] * weightH2h + recentGoals1[1] * weightRecentT1 + similarGoals1[1] * weightSimilarT1) / weightSumT1;
  const t2Scored =
    (h2hGoals[1] * weightH2h + recentGoals2[0] * weightRecentT2 + similarGoals2[0] * weightSimilarT2) / weightSumT2;
  const t2Conceded =
    (h2hGoals[0] * weightH2h + recentGoals2[1] * weightRecentT2 + similarGoals2[1] * weightSimilarT2) / weightSumT2;

  const t1Projected =
    t1Scored * t1Prob +
    t2Conceded * t2Prob +
    (Math.abs(t1Scored - t2Conceded) / ((t1Scored + t2Conceded) / 2.0)) * t1Prob * t2Prob * (t1Scored - t2Conceded);
  const t2Projected =
    t2Scored * t2Prob +
    t1Conceded * t1Prob +
    (Math.abs(t2Scored - t1Conceded) / ((t2Scored + t1Conceded) / 2.0)) * t1Prob * t2Prob * (t2Scored - t1Conceded);

  return {
    team1,
    team2,
    head2headGames: h2h,
    head2headAvgGoals: h2hGoals,
    recentGamesTeam1: recent1,
    recentGamesTeam2: recent2,
    recentGamesAvgGoalsTeam1: recentGoals1,
    recentGamesAvgGoalsTeam2: recentGoals2,
    similarGamesTeam1: similar1,
    similarGamesTeam2: similar2,
    similarGamesAvgGoalsTeam1: similarGoals1,
    similarGamesAvgGoalsTeam2: similarGoals2,
    team1EloProb: t1Prob,
    team2EloProb: t2Prob,
    team1Scored: t1Scored,
    team1Conceded: t1Conceded,
    team2Scored: t2Scored,
    team2Conceded: t2Conceded,
    team1ProjectedGoals: t1Projected,
    team2ProjectedGoals: t2Projected,
  };
}
