<script lang="ts">
  import { cn } from '$lib/utils';
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';

  interface Props extends HTMLAttributes<HTMLDivElement> {
    children?: Snippet;
  }

  let { class: className, children, ...rest }: Props = $props();
</script>

<div
  class={cn(
    'bg-card text-card-foreground rounded-xl border shadow',
    className,
  )}
  {...rest}
>
  {#if children}
    {@render children()}
  {/if}
</div>
