<script lang="ts">
  import { page } from "$app/state";

  let search = $state("");

  let ratings = $derived(Object.entries(page.data.ratings as Record<string, number>).toSorted((a, b) => b[1] - a[1]));
  let filtered = $derived(ratings.filter((x) => x[0].toLowerCase().includes(search.toLowerCase())));
</script>

<svelte:head><title>ELO Ratings</title></svelte:head>

<h2>ELO Ratings</h2>

<div class="mb-4">
  <label>
    Search: <br />
    <input type="text" bind:value={search} />
  </label>
</div>

<table class="mx-auto">
  <tbody>
    {#each filtered as entry (entry[0])}
      <tr class="odd:bg-slate-800">
        <td class="text-right">{ratings.indexOf(entry) + 1}</td>
        <td class="text-left">{entry[0]}</td>
        <td class="text-right">{entry[1]}</td>
      </tr>
    {/each}
  </tbody>
</table>

<style>
  td {
    padding: 4px 8px;
  }
</style>
