<script lang="ts">
  import { page } from "$app/state";
  import { predictMatch } from "$lib/GoalPrediction.js";
  import PoissonTable from "$lib/PoissonTable.svelte";

  let { data } = $props();

  // Make match data prop deeply reactive
  let match = $derived.by(() => {
    const matchData = $state(data.match);
    return matchData;
  });

  let title = $derived(match ? `${match.team1} - ${match.team2}` : "Goal Projection");

  let weights = $derived.by(() => {
    const w = $state({
      h2h1: 0.75,
      h2h2: 0.75,
      recent1: 0.5,
      recent2: 0.5,
      similar1: 1,
      similar2: 1,
      t1Impact: match?.team1EloProb ?? 0.5,
      t2Impact: match?.team2EloProb ?? 0.5,
    });
    return w;
  });

  let projections = $derived(predictMatch(match, weights));
</script>

<svelte:head>
  <title>{title}</title>
</svelte:head>

{#if !match || !projections}
  <p>No data for the specified teams!</p>
{:else}
  <div class="sm:grid grid-cols-[1fr_50px_1fr] gap-6 justify-center mb-2">
    <div class="text-2xl text-amber-400 font-bold sm:text-right">{match.team1}</div>
    <div class="text-xl">vs</div>
    <div class="text-2xl text-amber-400 font-bold sm:text-left">{match.team2}</div>
  </div>

  <div>Ratings</div>
  <div class="flex gap-6 justify-center text-slate-500">
    <div>{page.data.ratings[match.team1]}</div>
    <div>{page.data.ratings[match.team2]}</div>
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

  {@render projectedGoals(projections.t1Projected, projections.t2Projected)}

  <div>Team Weight</div>
  <div class="flex justify-center gap-6 text-slate-500">
    <div>{Math.round(weights.t1Impact * 100)}%</div>
    <div>{Math.round(weights.t2Impact * 100)}%</div>
  </div>
  <div class="max-w-xs mx-auto mb-4">
    <input
      type="range"
      class="slider"
      min="0"
      max="1"
      step="0.001"
      bind:value={weights.t1Impact}
      oninput={() => {
        weights.t2Impact = 1 - weights.t1Impact;
      }}
      title={`${Math.round(weights.t1Impact * 100)}%`}
    />
  </div>

  <PoissonTable xg1={projections.t1Projected} xg2={projections.t2Projected} team1={match.team1} team2={match.team2} />

  {#snippet gamesSection(title: string, team: string | undefined, games: ProcessedGame[], avg: number[])}
    {#if games.length > 0}
      <div class="mb-4">
        <h3>{title}</h3>
        {#each games.toSorted((a, b) => b.date.getTime() - a.date.getTime()) as game (game.date + game.home_team + game.away_team)}
          {const isHome = !team || game.home_team === team}
          {const isAway = !team || game.away_team === team}
          <div class="max-w-md mx-auto even:bg-slate-800 p-1 py-2 relative">
            <div class="text-xs text-slate-500">{game.date.toISOString().slice(0, 10)}<br />{game.tournament}</div>
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
            <input
              class="slider absolute bottom-0 z-10 -translate-x-1/2 translate-y-1/2"
              type="range"
              min="0"
              max="1"
              step="0.01"
              bind:value={game.game_weight}
              title={game.game_weight?.toFixed(2).toString() ?? ""}
            />
          </div>
        {/each}
        {@render projectedGoals(avg[0], avg[1])}
      </div>
    {/if}
  {/snippet}

  {@render gamesSection("Head to Head", undefined, match.head2headGames, projections.h2hGoals)}

  <div class="sm:grid grid-cols-2 gap-2 mb-4 justify-center">
    <div>
      <h2 class="text-amber-400">{match.team1}</h2>
      {@render gamesSection("Recent Games", match.team1, match.recentGamesTeam1, projections.recentGoals1)}
      {@render gamesSection("Similar Opponents", match.team1, match.similarGamesTeam1, projections.similarGoals1)}
      <h3>Team Total</h3>
      <div class="grid grid-cols-[320px_50px] justify-center">
        <div class="col-span-2">Head to Head</div>
        <div class="flex items-center">
          <input
            type="range"
            class="slider"
            min="0"
            max="1"
            step="0.01"
            bind:value={weights.h2h1}
            title={`${Math.round(weights.h2h1 * 100)}%`}
          />
        </div>
        <div class="text-slate-500">{`${Math.round(weights.h2h1 * 100)}%`}</div>
        <div class="col-span-2">Recent Games</div>
        <div class="flex items-center">
          <input
            type="range"
            class="slider"
            min="0"
            max="1"
            step="0.01"
            bind:value={weights.recent1}
            title={`${Math.round(weights.recent1 * 100)}%`}
          />
        </div>
        <div class="text-slate-500">{`${Math.round(weights.recent1 * 100)}%`}</div>
        <div class="col-span-2">Similar Opponents</div>
        <div class="flex items-center">
          <input
            type="range"
            class="slider"
            min="0"
            max="1"
            step="0.01"
            bind:value={weights.similar1}
            title={`${Math.round(weights.similar1 * 100)}%`}
          />
        </div>
        <div class="text-slate-500">{`${Math.round(weights.similar1 * 100)}%`}</div>
      </div>
      {@render projectedGoals(projections.t1Scored, projections.t1Conceded)}
    </div>
    <div>
      <h2 class="text-amber-400">{match.team2}</h2>
      {@render gamesSection("Recent Games", match.team2, match.recentGamesTeam2, projections.recentGoals2)}
      {@render gamesSection("Similar Opponents", match.team2, match.similarGamesTeam2, projections.similarGoals2)}
      <h3>Team Total</h3>
      <div class="grid grid-cols-[320px_50px] justify-center">
        <div class="col-span-2">Head to Head</div>
        <div class="flex items-center">
          <input
            type="range"
            class="slider"
            min="0"
            max="1"
            step="0.01"
            bind:value={weights.h2h2}
            title={`${Math.round(weights.h2h2 * 100)}%`}
          />
        </div>
        <div class="text-slate-500">{`${Math.round(weights.h2h2 * 100)}%`}</div>
        <div class="col-span-2">Recent Games</div>
        <div class="flex items-center">
          <input
            type="range"
            class="slider"
            min="0"
            max="1"
            step="0.01"
            bind:value={weights.recent2}
            title={`${Math.round(weights.recent2 * 100)}%`}
          />
        </div>
        <div class="text-slate-500">{`${Math.round(weights.recent2 * 100)}%`}</div>
        <div class="col-span-2">Similar Opponents</div>
        <div class="flex items-center">
          <input
            type="range"
            class="slider"
            min="0"
            max="1"
            step="0.01"
            bind:value={weights.similar2}
            title={`${Math.round(weights.similar2 * 100)}%`}
          />
        </div>
        <div class="text-slate-500">{`${Math.round(weights.similar2 * 100)}%`}</div>
      </div>
      {@render projectedGoals(projections.t2Scored, projections.t2Conceded)}
    </div>
  </div>
  <h3>Result</h3>
  {@render projectedGoals(projections.t1Projected, projections.t2Projected)}
{/if}

<style>
  .slider {
    appearance: none;
    width: 100%;
    height: 4px;
    background: var(--color-slate-500);
    outline: none;
    opacity: 0.7;
    transition: opacity 0.2s;
    border-radius: 4px;
  }

  .slider:hover {
    opacity: 1;
  }

  .slider::-webkit-slider-thumb {
    appearance: none;
    width: 12px;
    height: 12px;
    border-radius: 100%;
    background: var(--color-slate-300);
    cursor: pointer;
  }

  .slider::-moz-range-thumb {
    width: 12px;
    height: 12px;
    border-radius: 100%;
    background: var(--color-slate-300);
    cursor: pointer;
  }
</style>
