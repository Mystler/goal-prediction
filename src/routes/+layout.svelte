<script lang="ts">
  import { goto } from "$app/navigation";
  import { resolve } from "$app/paths";
  import "./layout.css";

  let { data, children } = $props();

  let team1 = $state("");
  let team2 = $state("");

  function onChange() {
    if (!team1 || !team2) return;
    goto(
      resolve("/[team1]/[team2]", {
        team1: encodeURIComponent(team1.toLowerCase()),
        team2: encodeURIComponent(team2.toLowerCase()),
      }),
    );
  }
</script>

<p class="mt-2 text-center text-xs text-slate-500">
  Last Data Update:<br />{data.dataUpdated?.toLocaleString("en-US", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: false,
  })}
</p>

<h1 class="text-center mt-2">Goal Projection</h1>

<p class="text-center"><a class="link-btn" href={resolve("/ratings")}>Show ELO Ratings</a></p>

<div class="flex flex-wrap gap-4 text-center justify-center">
  <div>
    <label>
      Team 1:<br />
      <input type="text" list="nations1" bind:value={team1} onchange={onChange} />
    </label>
  </div>
  <div>
    <label>
      Team 2:<br />
      <input type="text" list="nations2" bind:value={team2} onchange={onChange} />
    </label>
  </div>
</div>

<p class="text-center">
  <button
    class="link-btn"
    onclick={() => {
      team1 = "";
      team2 = "";
    }}>Clear</button
  >
</p>

<datalist id="nations1">
  {#if team1.length > 0}
    {#each Object.keys(data.ratings)
      .filter((x) => x.toLowerCase().startsWith(team1.toLowerCase()))
      .toSorted() as nation (nation)}
      <option>{nation}</option>
    {/each}
  {/if}
</datalist>
<datalist id="nations2">
  {#if team2.length > 0}
    {#each Object.keys(data.ratings)
      .filter((x) => x.toLowerCase().startsWith(team2.toLowerCase()))
      .toSorted() as nation (nation)}
      <option>{nation}</option>
    {/each}
  {/if}
</datalist>

<hr />

<div class="max-w-(--breakpoint-xl) mx-auto text-center">
  {@render children()}
</div>
