<script lang="ts">
  let { data } = $props();

  let title = $derived(data.match ? `${data.match.team1} - ${data.match.team2}` : "Goal Projection");
</script>

<svelte:head>
  <title>{title}</title>
</svelte:head>

{#if !data.match}
  <p>No data for the specified teams!</p>
{:else}
  <div class="sm:grid grid-cols-[1fr_50px_1fr] gap-6 justify-center mb-2">
    <div class="text-2xl text-amber-400 font-bold sm:text-right">{data.match.team1}</div>
    <div class="text-xl">vs</div>
    <div class="text-2xl text-amber-400 font-bold sm:text-left">{data.match.team2}</div>
  </div>

  {#snippet projectedGoals(a: number, b: number)}
    <div class="my-4 flex justify-center">
      <div class={["p-4", a > b ? "bg-slate-600" : "bg-slate-700"]}>
        {isNaN(a) ? "-" : a.toFixed(2)}
      </div>
      <div class={["p-4", b > a ? "bg-slate-600" : "bg-slate-700"]}>
        {isNaN(b) ? "-" : b.toFixed(2)}
      </div>
    </div>
  {/snippet}

  {@render projectedGoals(data.match.team1ProjectedGoals, data.match.team2ProjectedGoals)}

  <div>ELO Probability</div>
  <div class="flex justify-center gap-6 text-slate-500 mb-4">
    <div>{Math.round(data.match.team1EloProb * 100)}%</div>
    <div>{Math.round(data.match.team2EloProb * 100)}%</div>
  </div>

  {#snippet gamesSection(title: string, team: string | undefined, games: ProcessedGame[], avg: number[])}
    {#if games.length > 0}
      <div class="mb-4">
        <h3>{title}</h3>
        {#each games.reverse() as game (game.date + game.home_team + game.away_team)}
          {const isHome = !team || game.home_team === team}
          {const isAway = !team || game.away_team === team}
          <div class="max-w-md mx-auto">
            <div class="text-xs text-slate-500">{game.date.toISOString().slice(0, 10)}</div>
            <div class="grid grid-cols-[1fr_30px_30px_1fr]">
              <div
                class={[
                  isHome && game.home_score > game.away_score && "text-green-400",
                  isHome && game.away_score > game.home_score && "text-red-400",
                  isHome && game.home_score === game.away_score && "text-yellow-400",
                ]}
              >
                {game.home_team}
              </div>
              <div>{game.home_score}</div>
              <div>{game.away_score}</div>
              <div
                class={[
                  isAway && game.away_score > game.home_score && "text-green-400",
                  isAway && game.home_score > game.away_score && "text-red-400",
                  isAway && game.home_score === game.away_score && "text-yellow-400",
                ]}
              >
                {game.away_team}
              </div>
            </div>
          </div>
        {/each}
        {@render projectedGoals(avg[0], avg[1])}
      </div>
    {/if}
  {/snippet}

  {@render gamesSection("Head to Head", undefined, data.match.head2headGames, data.match.head2headAvgGoals)}

  <div class="sm:grid grid-cols-2 gap-2 mb-4 justify-center">
    <div>
      <h2 class="text-amber-400">{data.match.team1}</h2>
      {@render gamesSection(
        "Recent Games",
        data.match.team1,
        data.match.recentGamesTeam1,
        data.match.recentGamesAvgGoalsTeam1,
      )}
      {@render gamesSection(
        "Similar Opponents",
        data.match.team1,
        data.match.similarGamesTeam1,
        data.match.similarGamesAvgGoalsTeam1,
      )}
      <div>Combined</div>
      {@render projectedGoals(data.match.team1Scored, data.match.team1Conceded)}
    </div>
    <div>
      <h2 class="text-amber-400">{data.match.team2}</h2>
      {@render gamesSection(
        "Recent Games",
        data.match.team2,
        data.match.recentGamesTeam2,
        data.match.recentGamesAvgGoalsTeam2,
      )}
      {@render gamesSection(
        "Similar Opponents",
        data.match.team2,
        data.match.similarGamesTeam2,
        data.match.similarGamesAvgGoalsTeam2,
      )}
      <div>Combined</div>
      {@render projectedGoals(data.match.team2Scored, data.match.team2Conceded)}
    </div>
  </div>
{/if}
