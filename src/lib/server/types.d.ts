interface CsvRow {
  [key: string]: string;
}

interface ProcessedGame {
  date: Date;
  home_team: string;
  away_team: string;
  home_score: number;
  away_score: number;
  tournament: string;
}
