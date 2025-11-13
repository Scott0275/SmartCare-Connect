'use client';

import dynamic from 'next/dynamic';

const NewPrescriptionPage = dynamic(
  () => import('./NewPrescriptionPageComponent'),
  { ssr: false } // disables server-side rendering
);

export default function Page() {
  return <NewPrescriptionPage />;
}
