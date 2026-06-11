<script lang="ts">
  import { page } from "$app/state";
</script>

<svelte:head><title>ELO Ratings</title></svelte:head>

<h2>ELO Ratings</h2>

<table class="mx-auto">
  <tbody>
    {#each Object.entries(page.data.ratings as Record<string, number>).toSorted((a, b) => b[1] - a[1]) as [nation, elo], index (nation)}
      <tr class="odd:bg-slate-800">
        <td class="text-right">{index + 1}</td>
        <td class="text-left">{nation}</td>
        <td class="text-right">{elo}</td>
      </tr>
    {/each}
  </tbody>
</table>

<style>
  td {
    padding: 4px 8px;
  }
</style>
