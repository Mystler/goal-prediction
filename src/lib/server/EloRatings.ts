import { parse } from "csv-parse/sync";
import * as fs from "fs";

// Expected data source: https://github.com/martj42/international_results

const ELOKFactor = 30.0;
const ELOScaleFactor = 400.0;
const ELOExponentBase = 10.0;

export function eloProb(ratingDiff: number): number {
  return 1.0 / (1.0 + ELOExponentBase ** (ratingDiff / ELOScaleFactor));
}

export function eloNextRating(rating: number, actual: number, expected: number, weight: number): number {
  return rating + Math.round(weight * ELOKFactor * (actual - expected));
}

function tournamentWeight(t: string): number {
  let weight = 2.0 / 3.0;
  if (t.includes("FIFA World ")) {
    weight = 4.0 / 3.0;
  } else if (t.includes("UEFA ")) {
    weight = 4.0 / 3.0;
  } else if (
    [
      "AFC ",
      "CAF ",
      "CONCACAF ",
      "CONMEBOL ",
      "OFC ",
      "Confederations Cup",
      "Copa América",
      "African Cup of Nations",
      "Africa Cup of Nations",
      "African Nations",
    ].some((x) => t.includes(x))
  ) {
    weight = 4.0 / 3.0;
  }
  return weight;
}

export async function calculateEloRatings() {
  const csvPath = "../international_results/results.csv";
  if (!fs.existsSync(csvPath)) {
    console.error(`File not found: ${csvPath}`);
    return;
  }

  const fileContent = fs.readFileSync(csvPath, { encoding: "utf-8" });
  const raw = parse(fileContent, { columns: true, skip_empty_lines: true }) as CsvRow[];

  const records: ProcessedGame[] = raw
    .filter((x) => x["home_score"] !== "NA" && x["away_score"] !== "NA")
    .map((x) => ({
      date: new Date(x["date"]),
      home_team: x["home_team"],
      away_team: x["away_team"],
      home_score: parseInt(x["home_score"]),
      away_score: parseInt(x["away_score"]),
      tournament: x["tournament"],
    }))
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  const teamElo: Record<string, number> = {};
  for (const game of records) {
    const homeElo = teamElo[game.home_team] ?? 1500;
    const awayElo = teamElo[game.away_team] ?? 1500;
    const diff = awayElo - homeElo;

    const homeScore = game.home_score > game.away_score ? 1.0 : game.home_score < game.away_score ? 0.0 : 0.5;
    const awayScore = 1.0 - homeScore;

    let gameWeight = tournamentWeight(game.tournament);
    const goalDiff = Math.abs(game.home_score - game.away_score);
    if (goalDiff >= 2 && goalDiff <= 3) {
      gameWeight *= 1.0 + goalDiff / 4.0;
    } else if (goalDiff >= 4) {
      gameWeight *= 1.75 + (goalDiff - 3.0) / 8.0;
    }

    teamElo[game.home_team] = eloNextRating(homeElo, homeScore, eloProb(diff), gameWeight);
    teamElo[game.away_team] = eloNextRating(awayElo, awayScore, eloProb(-diff), gameWeight);
  }

  fs.writeFileSync("ratings.json", JSON.stringify(teamElo));
}
