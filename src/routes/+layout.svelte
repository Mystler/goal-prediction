<script lang="ts">
  import { goto } from "$app/navigation";
  import { resolve } from "$app/paths";
  import "./layout.css";

  let { data, children } = $props();

  let team1 = $state("");
  let team2 = $state("");

  function onChange() {
    goto(
      resolve("/[team1]/[team2]", {
        team1: team1.toLowerCase(),
        team2: team2.toLowerCase(),
      }),
    );
  }
</script>

<h1>Goal Projection</h1>

<div>
  <label>
    Team 1:<br />
    <input type="text" list="nations" bind:value={team1} onchange={onChange} />
  </label>
</div>
<div>
  <label>
    Team 2:<br />
    <input type="text" list="nations" bind:value={team2} onchange={onChange} />
  </label>
</div>

<datalist id="nations">
  {#each Object.keys(data.ratings).toSorted() as nation (nation)}
    <option>{nation}</option>
  {/each}
</datalist>

<hr />

{@render children()}
