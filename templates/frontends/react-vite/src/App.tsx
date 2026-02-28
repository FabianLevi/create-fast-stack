import { env } from '@/environment';
import { useHealth } from '@/hooks/use-health';

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

export default function App() {
  const { data, error, isPending } = useHealth();

  const status = isPending ? 'CHECKING...' : data ? 'CONNECTED' : 'DISCONNECTED';
  const statusColor = isPending
    ? 'text-yellow-400'
    : data
      ? 'text-green-400'
      : 'text-red-400';

  return (
    <div className="flex min-h-svh flex-col items-center pt-[20vh] p-4 bg-black">
      <div className="container mx-auto flex max-w-6xl flex-col items-center">
        <pre className="font-mono text-[8px] leading-tight text-white sm:text-base md:text-lg lg:text-xl">
          {TITLE_TEXT}
        </pre>

        <pre className={`mt-6 font-mono text-[8px] leading-tight sm:text-base md:text-lg lg:text-xl ${statusColor}`}>
          {[
            '+--------------------------------------+',
            `|  STATUS: ${status.padEnd(27)} |`,
            `|  HOST:   ${env.backendUrl.padEnd(27)} |`,
            `|  APP:    ${env.appName.padEnd(27)} |`,
            ...(error
              ? [`|  ERROR:  ${'Connection refused'.padEnd(27)} |`]
              : []),
            '+--------------------------------------+',
          ].join('\n')}
        </pre>
      </div>
    </div>
  );
}
