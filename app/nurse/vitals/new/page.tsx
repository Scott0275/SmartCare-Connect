'use client';

import dynamic from 'next/dynamic';

const NewVitalsPage = dynamic(
  () => import('./NewVitalsPageComponent'),
  { ssr: false }
);

export default function Page() {
  return <NewVitalsPage />;
}
