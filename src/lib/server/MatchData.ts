import * as fs from "fs";
import { parse } from "csv-parse/sync";
import { eloProb } from "./EloRatings";

export function cutoffDate() {
  const cutoffDate = new Date();
  cutoffDate.setFullYear(cutoffDate.getFullYear() - 8);
  return cutoffDate;
}

function recencyWeight(date: Date, start: Date, end: Date) {
  // Scale from 0.3 to 1.0 between start and end date
  return Math.max(
    0.3,
    Math.min(1.0, ((date.getTime() - start.getTime()) / (end.getTime() - start.getTime())) * 0.7 + 0.3),
  );
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

export async function predictionData(team1: string, team2: string) {
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

  const cutoff = cutoffDate();
  const cutoffEnd = new Date();
  // cutoffEnd.setFullYear(cutoffEnd.getFullYear(), 1, 1);
  let data = toProcessedGames(filteredRows);
  data = data.filter((x) => x.date >= cutoff);
  data.sort((a, b) => a.date.getTime() - b.date.getTime());
  data.forEach((x) => (x.game_weight = recencyWeight(x.date, cutoff, cutoffEnd)));

  // Head to Head games
  const h2hCount = 5;
  const h2h = data
    .filter((x) => [team1, team2].includes(x.home_team) && [team1, team2].includes(x.away_team))
    .slice(-h2hCount);

  // Recent Games
  const recentCount = 10;
  const recent1 = data.filter((x) => [x.home_team, x.away_team].includes(team1)).slice(-recentCount);

  const recent2 = data.filter((x) => [x.home_team, x.away_team].includes(team2)).slice(-recentCount);

  // Similar Opponents
  const similarOpponents = 11; // includes self
  const similarCount = 10;
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

  return {
    team1,
    team2,
    head2headGames: h2h,
    recentGamesTeam1: recent1,
    recentGamesTeam2: recent2,
    similarGamesTeam1: similar1,
    similarGamesTeam2: similar2,
    team1EloProb: t1Prob,
    team2EloProb: t2Prob,
  };
}
