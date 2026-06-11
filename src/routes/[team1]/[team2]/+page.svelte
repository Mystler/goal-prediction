<script lang="ts">
  let { data } = $props();
</script>

{data.match?.team1}
{data.match?.team1ProjectedGoals.toFixed(2)} - {data.match?.team2ProjectedGoals.toFixed(2)}
{data.match?.team2}
