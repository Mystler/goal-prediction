<script lang="ts">
  import { browser } from "$app/environment";

  interface Props {
    xg1: number;
    xg2: number;
    team1: string;
    team2: string;
  }
  let { xg1, xg2, team1, team2 }: Props = $props();

  let tableMode: "chances" | "xp" = $state("chances");
  let xpConfig = $state({
    trend: 2,
    diff: 3,
    exact: 4,
    tie: 3,
  });
  if (browser) {
    const lsXPConfig = localStorage.getItem("xpConfig");
    if (lsXPConfig) {
      xpConfig = JSON.parse(lsXPConfig);
    }
  }
  $effect(() => {
    localStorage.setItem("xpConfig", JSON.stringify(xpConfig));
  });

  function factorial(n: number) {
    let res = 1;
    for (let i = 1; i <= n; i++) {
      res *= i;
    }
    return res;
  }

  function poisson(mean: number, k: number) {
    return (mean ** k * Math.E ** -mean) / factorial(k);
  }

  let scoreMatrix = $derived.by(() => {
    let mat = [
      [0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0],
    ];
    let t1Probs = Array(6).fill(0) as number[];
    for (let t1 = 0; t1 <= 5; t1++) {
      if (t1 === 5) {
        t1Probs[t1] = 1 - t1Probs[0] - t1Probs[1] - t1Probs[2] - t1Probs[3] - t1Probs[4];
      } else {
        t1Probs[t1] = poisson(xg1, t1);
      }
    }
    let t2Probs = Array(6).fill(0) as number[];
    for (let t2 = 0; t2 <= 5; t2++) {
      if (t2 === 5) {
        t2Probs[t2] = 1 - t2Probs[0] - t2Probs[1] - t2Probs[2] - t2Probs[3] - t2Probs[4];
      } else {
        t2Probs[t2] = poisson(xg2, t2);
      }
    }
    for (let t1 = 0; t1 <= 5; t1++) {
      for (let t2 = 0; t2 <= 5; t2++) {
        mat[t1][t2] = t1Probs[t1] * t2Probs[t2];
      }
    }
    return mat;
  });

  function sumProbs(func: (t1: number, t2: number) => boolean) {
    let res: number[] = [];
    for (let t1 = 0; t1 <= 5; t1++) {
      for (let t2 = 0; t2 <= 5; t2++) {
        if (func(t1, t2)) res.push(scoreMatrix[t1][t2]);
      }
    }
    return res.reduce((sum, x) => sum + x, 0);
  }
  let xpMatrix = $derived.by(() => {
    let mat = [
      [0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0],
    ];
    for (let t1 = 0; t1 <= 5; t1++) {
      for (let t2 = 0; t2 <= 5; t2++) {
        if (t1 === t2) {
          // All ties
          const ties = sumProbs((a, b) => a === b) * xpConfig.tie;
          const exact = scoreMatrix[t1][t2] * (xpConfig.exact - xpConfig.tie);
          mat[t1][t2] = ties + exact;
        } else {
          const trends = sumProbs((a, b) => Math.sign(a - b) === Math.sign(t1 - t2)) * xpConfig.trend;
          const diffs = sumProbs((a, b) => t1 - t2 === a - b) * (xpConfig.diff - xpConfig.trend);
          const exact = scoreMatrix[t1][t2] * (xpConfig.exact - xpConfig.diff);
          mat[t1][t2] = trends + diffs + exact;
        }
      }
    }
    return mat;
  });

  let displayMatrix = $derived.by(() => (tableMode === "xp" ? xpMatrix : scoreMatrix));

  let hueMatrix = $derived.by(() => {
    const flatMat = displayMatrix.flat();
    let min = 1;
    let max = 0;
    for (const n of flatMat) {
      min = n < min ? n : min;
      max = n > max ? n : max;
    }
    let mat = [
      [0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0],
    ];
    for (let t1 = 0; t1 <= 5; t1++) {
      for (let t2 = 0; t2 <= 5; t2++) {
        mat[t1][t2] = ((displayMatrix[t1][t2] - min) / (max - min)) * 120;
      }
    }
    return mat;
  });

  let { t1Chance, t2Chance, drawChance } = $derived.by(() => {
    let t1Chance = 0,
      t2Chance = 0,
      drawChance = 0;
    for (let t1 = 0; t1 <= 5; t1++) {
      for (let t2 = 0; t2 <= 5; t2++) {
        if (t1 > t2) t1Chance += scoreMatrix[t1][t2];
        else if (t2 > t1) t2Chance += scoreMatrix[t1][t2];
        else drawChance += scoreMatrix[t1][t2];
      }
    }
    return { t1Chance, t2Chance, drawChance };
  });
</script>

<div class="mb-4 overflow-x-auto">
  <div class="grid grid-cols-8 min-w-xs max-w-(--breakpoint-lg) mx-auto text-[8px] sm:text-xs md:text-base">
    <button
      class={[tableMode === "chances" ? "bg-slate-700" : "bg-slate-800", "hover:bg-slate-600"]}
      onclick={() => (tableMode = "chances")}>Chances</button
    >
    <button
      class={[tableMode === "xp" ? "bg-slate-700" : "bg-slate-800", "hover:bg-slate-600"]}
      onclick={() => (tableMode = "xp")}>XP</button
    >
    <div class="col-span-6 flex gap-x-2 px-2 justify-between">
      <div class="flex flex-col">
        <div>Proj Goals:</div>
        <div class="flex flex-wrap gap-x-2 items-center justify-center">
          <input
            class="p-1 w-10 sm:w-12 md:w-14 border-0 rounded-none"
            type="number"
            step="0.01"
            value={xg1.toFixed(2)}
            onchange={(e) => (xg1 = parseFloat(e.currentTarget.value))}
          />
          <input
            class="p-1 w-10 sm:w-12 md:w-14 border-0 rounded-none"
            type="number"
            step="0.01"
            value={xg2.toFixed(2)}
            onchange={(e) => (xg2 = parseFloat(e.currentTarget.value))}
          />
        </div>
      </div>
      <div class="flex flex-col">
        <div>Prediction Points:</div>
        <div class="flex flex-wrap gap-x-2 items-center justify-center">
          <div>
            <span>Trend:</span>
            <input class="p-1 w-8 border-0 rounded-none" type="number" bind:value={xpConfig.trend} />
          </div>
          <div>
            <span>Diff:</span>
            <input class="p-1 w-8 border-0 rounded-none" type="number" bind:value={xpConfig.diff} />
          </div>
          <div>
            <span>Exact:</span>
            <input class="p-1 w-8 border-0 rounded-none" type="number" bind:value={xpConfig.exact} />
          </div>
          <div>
            <span>Tie:</span>
            <input class="p-1 w-8 border-0 rounded-none" type="number" bind:value={xpConfig.tie} />
          </div>
        </div>
      </div>
    </div>
    {#each { length: 8 } as _, t1 (t1)}
      {#each { length: 8 } as _, t2 (t2)}
        {#if t1 === 0 && t2 === 0}
          <div class="bg-slate-500">Score</div>
        {:else if t1 === 7 && t2 === 0}
          <div class="bg-red-800">{team1}</div>
        {:else if t2 === 7 && t1 === 0}
          <div class="bg-blue-800">{team2}</div>
        {:else if t2 === 0}
          <div class="bg-red-800">{t1 - 1}{t1 === 6 ? "+" : ""}</div>
        {:else if t1 === 0}
          <div class="bg-blue-800">{t2 - 1}{t2 === 6 ? "+" : ""}</div>
        {:else if t1 === 7 && t2 === 1}
          <div class="bg-slate-500">{(t1Chance * 100).toFixed(2)}%</div>
        {:else if t2 === 7 && t1 === 1}
          <div class="bg-slate-500">{(t2Chance * 100).toFixed(2)}%</div>
        {:else if t1 === 7 && t2 === 7}
          <div class="bg-slate-500">{(drawChance * 100).toFixed(2)}%</div>
        {:else if t1 === 7 || t2 === 7}
          <div></div>
        {:else}
          <div
            style:background-color={`hsl(${Math.round(hueMatrix[t1 - 1][t2 - 1])} 60% 40%)`}
            class={[hueMatrix[t1 - 1][t2 - 1] === 120 && "font-bold underline"]}
          >
            {tableMode === "xp"
              ? displayMatrix[t1 - 1][t2 - 1].toFixed(2)
              : `${(displayMatrix[t1 - 1][t2 - 1] * 100).toFixed(2)}%`}
          </div>
        {/if}
      {/each}
    {/each}
  </div>
</div>
