import { predictMatch } from "../src/lib/server/GoalProjection.ts";

function logGames(games: NonNullable<Awaited<ReturnType<typeof predictMatch>>>["head2headGames"]) {
  for (const game of games) {
    console.log(
      `${game.date.toISOString().slice(0, 10)}: ${game.home_team} ${game.home_score} - ${game.away_score} ${game.away_team}`,
    );
  }
}

const args = process.argv.slice(2);
if (args.length < 2) {
  console.error("Usage: pnpm predict -- <Team A> <Team B>");
  process.exit(1);
}
const data = await predictMatch(args[0], args[1]);
if (!data) process.exit(1);

console.log(`Predicting ${data.team1} - ${data.team2}`);
console.log();

console.log("HEAD TO HEAD");
logGames(data.head2headGames);
console.log(`Average ${data.team1}: ${data.head2headAvgGoals[0].toFixed(2)} - ${data.head2headAvgGoals[1].toFixed(2)}`);
console.log();

console.log("RECENT GAMES");
logGames(data.recentGamesTeam1);
console.log(
  `Average ${data.team1}: ${data.recentGamesAvgGoalsTeam1[0].toFixed(2)} - ${data.recentGamesAvgGoalsTeam1[1].toFixed(2)}`,
);
logGames(data.recentGamesTeam2);
console.log(
  `Average ${data.team2}: ${data.recentGamesAvgGoalsTeam2[0].toFixed(2)} - ${data.recentGamesAvgGoalsTeam2[1].toFixed(2)}`,
);
console.log();

console.log("SIMILAR OPPONENTS");
logGames(data.similarGamesTeam1);
console.log(
  `Average ${data.team1}: ${data.similarGamesAvgGoalsTeam1[0].toFixed(2)} - ${data.similarGamesAvgGoalsTeam1[1].toFixed(2)}`,
);
logGames(data.similarGamesTeam2);
console.log(
  `Average ${data.team2}: ${data.similarGamesAvgGoalsTeam2[0].toFixed(2)} - ${data.similarGamesAvgGoalsTeam2[1].toFixed(2)}`,
);
console.log();

console.log("COMBINED RESULTS");
console.log(`ELO: ${data.team1EloProb.toFixed(2)} - ${data.team2EloProb.toFixed(2)}`);
console.log(`${data.team1}: ${data.team1Scored.toFixed(2)} - ${data.team1Conceded.toFixed(2)}`);
console.log(`${data.team2}: ${data.team2Scored.toFixed(2)} - ${data.team2Conceded.toFixed(2)}`);
console.log();
console.log(`Resulting Projection: ${data.team1ProjectedGoals.toFixed(2)} - ${data.team2ProjectedGoals.toFixed(2)}`);
console.log();
