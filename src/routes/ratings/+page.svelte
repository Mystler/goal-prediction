<script lang="ts">
  import { page } from "$app/state";
</script>

{#each Object.entries(page.data.ratings as Record<string, number>).toSorted((a, b) => b[1] - a[1]) as [nation, elo], index (nation)}
  {index + 1} {nation} - {elo}<br />
{/each}
