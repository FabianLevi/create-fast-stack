'use client';

import { useQuery } from '@tanstack/react-query';

import { useTRPC } from '@/trpc/utils';

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

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:8000';
const APP_NAME = '{{baseName}}';

export default function Home() {
  const trpc = useTRPC();
  const { data, isPending, error } = useQuery(
    trpc.health.check.queryOptions(),
  );

  const status = isPending
    ? 'CHECKING...'
    : data
      ? 'CONNECTED'
      : 'DISCONNECTED';
  const statusColor = isPending
    ? 'text-yellow-400'
    : data
      ? 'text-green-400'
      : 'text-red-400';

  return (
    <div className="flex min-h-svh flex-col items-center bg-black p-4 pt-[20vh]">
      <div className="container mx-auto flex max-w-6xl flex-col items-center">
        <pre className="font-mono text-[8px] leading-tight text-white sm:text-base md:text-lg lg:text-xl">
          {TITLE_TEXT}
        </pre>

        <pre
          className={`mt-6 font-mono text-[8px] leading-tight sm:text-base md:text-lg lg:text-xl ${statusColor}`}
        >
          {[
            '+--------------------------------------+',
            `|  STATUS: ${status.padEnd(27)} |`,
            `|  HOST:   ${BACKEND_URL.padEnd(27)} |`,
            `|  APP:    ${APP_NAME.padEnd(27)} |`,
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
