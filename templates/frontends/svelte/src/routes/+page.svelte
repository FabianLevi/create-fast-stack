<script lang="ts">
  import { env } from '$lib/environment';
  import { fetchHealth } from '$lib/api/health';

  const TITLE_TEXT = `
 \u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2557 \u2588\u2588\u2588\u2588\u2588\u2557 \u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2557\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2557
 \u2588\u2588\u2554\u2550\u2550\u2550\u2550\u255d\u2588\u2588\u2554\u2550\u2550\u2588\u2588\u2557\u2588\u2588\u2554\u2550\u2550\u2550\u2550\u255d\u255a\u2550\u2550\u2588\u2588\u2554\u2550\u2550\u255d
 \u2588\u2588\u2588\u2588\u2588\u2557  \u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2551\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2557   \u2588\u2588\u2551
 \u2588\u2588\u2554\u2550\u2550\u255d  \u2588\u2588\u2554\u2550\u2550\u2588\u2588\u2551\u255a\u2550\u2550\u2550\u2550\u2588\u2588\u2551   \u2588\u2588\u2551
 \u2588\u2588\u2551     \u2588\u2588\u2551  \u2588\u2588\u2551\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2551   \u2588\u2588\u2551
 \u255a\u2550\u255d     \u255a\u2550\u255d  \u255a\u2550\u255d\u255a\u2550\u2550\u2550\u2550\u2550\u2550\u255d   \u255a\u2550\u255d

 \u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2557\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2557 \u2588\u2588\u2588\u2588\u2588\u2557  \u2588\u2588\u2588\u2588\u2588\u2588\u2557\u2588\u2588\u2557  \u2588\u2588\u2557
 \u2588\u2588\u2554\u2550\u2550\u2550\u2550\u255d\u255a\u2550\u2550\u2588\u2588\u2554\u2550\u2550\u255d\u2588\u2588\u2554\u2550\u2550\u2588\u2588\u2557\u2588\u2588\u2554\u2550\u2550\u2550\u2550\u255d\u2588\u2588\u2551 \u2588\u2588\u2554\u255d
 \u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2557   \u2588\u2588\u2551   \u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2551\u2588\u2588\u2551     \u2588\u2588\u2588\u2588\u2588\u2554\u255d
 \u255a\u2550\u2550\u2550\u2550\u2588\u2588\u2551   \u2588\u2588\u2551   \u2588\u2588\u2554\u2550\u2550\u2588\u2588\u2551\u2588\u2588\u2551     \u2588\u2588\u2554\u2550\u2588\u2588\u2557
 \u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2551   \u2588\u2588\u2551   \u2588\u2588\u2551  \u2588\u2588\u2551\u255a\u2588\u2588\u2588\u2588\u2588\u2588\u2557\u2588\u2588\u2551  \u2588\u2588\u2557
 \u255a\u2550\u2550\u2550\u2550\u2550\u2550\u255d   \u255a\u2550\u255d   \u255a\u2550\u255d  \u255a\u2550\u255d \u255a\u2550\u2550\u2550\u2550\u2550\u255d\u255a\u2550\u255d  \u255a\u2550\u255d`;

  type HealthStatus = 'CHECKING...' | 'CONNECTED' | 'DISCONNECTED';

  let status: HealthStatus = $state('CHECKING...');
  let error: string | null = $state(null);

  const statusColor = $derived(
    status === 'CHECKING...'
      ? 'text-yellow-400'
      : status === 'CONNECTED'
        ? 'text-green-400'
        : 'text-red-400',
  );

  const statusBox = $derived(
    [
      '+--------------------------------------+',
      `|  STATUS: ${status.padEnd(27)} |`,
      `|  HOST:   ${env.backendUrl.padEnd(27)} |`,
      `|  APP:    ${env.appName.padEnd(27)} |`,
      ...(error
        ? [`|  ERROR:  ${'Connection refused'.padEnd(27)} |`]
        : []),
      '+--------------------------------------+',
    ].join('\n'),
  );

  $effect(() => {
    fetchHealth()
      .then(() => {
        status = 'CONNECTED';
        error = null;
      })
      .catch(() => {
        status = 'DISCONNECTED';
        error = 'Connection refused';
      });
  });
</script>

<div
  class="flex min-h-svh flex-col items-center bg-black p-4 pt-[20vh]"
>
  <div class="container mx-auto flex max-w-6xl flex-col items-center">
    <pre
      class="font-mono text-[8px] leading-tight text-white sm:text-base md:text-lg lg:text-xl"
    >{TITLE_TEXT}</pre>

    <pre
      class="mt-6 font-mono text-[8px] leading-tight sm:text-base md:text-lg lg:text-xl {statusColor}"
    >{statusBox}</pre>
  </div>
</div>
