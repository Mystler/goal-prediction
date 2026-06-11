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
  {data.match.team1}
  {data.match.team1ProjectedGoals.toFixed(2)} - {data.match.team2ProjectedGoals.toFixed(2)}
  {data.match.team2}
{/if}
