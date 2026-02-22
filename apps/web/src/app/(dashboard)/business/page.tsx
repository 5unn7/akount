import { redirect } from 'next/navigation';

/**
 * Business domain root - redirect to Clients page
 */
export default function BusinessPage() {
  redirect('/business/clients');
}
