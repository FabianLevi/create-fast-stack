import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { environment } from '@/environments/environment';
import { HealthService } from '@/app/services/health.service';

const TITLE_TEXT = `
 ███████╗ █████╗ ███████╗████████╗
 ██╔════╝██╔══██╗██╔════╝╚══██╔══╝
 █████╗  ███████║███████╗   ██║
 ██╔══╝  ██╔══██║╚════██║   ██║
 ██║     ██║  ██║███████║   ██║
 ╚═╝     ╚═╝  ╚═╝╚══════╝   ╚═╝

 ███████╗████████╗ █████╗  ██████╗██╗  ██╗
 ██╔════╝╚══██╔══╝██╔══██╗██╔════╝██║ ██╔╝
 ███████╗   ██║   ███████║██║     █████╔╝
 ╚════██║   ██║   ██╔══██║██║     ██╔═██╗
 ███████║   ██║   ██║  ██║╚██████╗██║  ██╗
 ╚══════╝   ╚═╝   ╚═╝  ╚═╝ ╚═════╝╚═╝  ╚═╝`;

function pad(value: string, width = 27): string {
  return value.padEnd(width);
}

@Component({
  selector: 'app-home',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex min-h-svh flex-col items-center bg-black p-4 pt-[20vh]">
      <div class="container mx-auto flex max-w-6xl flex-col items-center">
        <pre class="font-mono text-[8px] leading-tight text-white sm:text-base md:text-lg lg:text-xl">{{ titleText }}</pre>

        <pre [class]="'mt-6 font-mono text-[8px] leading-tight sm:text-base md:text-lg lg:text-xl ' + statusColor()">{{ statusBox() }}</pre>
      </div>
    </div>
  `,
})
export class HomeComponent {
  private healthService = inject(HealthService);

  titleText = TITLE_TEXT;
  status = signal<'loading' | 'connected' | 'error'>('loading');

  statusText = computed(() => {
    const s = this.status();
    if (s === 'loading') return 'CHECKING...';
    if (s === 'connected') return 'CONNECTED';
    return 'DISCONNECTED';
  });

  statusColor = computed(() => {
    const s = this.status();
    if (s === 'loading') return 'text-yellow-400';
    if (s === 'connected') return 'text-green-400';
    return 'text-red-400';
  });

  statusBox = computed(() => {
    const lines = [
      '+--------------------------------------+',
      `|  STATUS: ${pad(this.statusText())} |`,
      `|  HOST:   ${pad(environment.backendUrl)} |`,
      `|  APP:    ${pad(environment.appName)} |`,
    ];
    if (this.status() === 'error') {
      lines.push(`|  ERROR:  ${pad('Connection refused')} |`);
    }
    lines.push('+--------------------------------------+');
    return lines.join('\n');
  });

  constructor() {
    this.healthService
      .check()
      .pipe(takeUntilDestroyed())
      .subscribe({
        next: () => this.status.set('connected'),
        error: () => this.status.set('error'),
      });
  }
}
