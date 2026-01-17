import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function HostDashboardPage({ params }: { params: Promise<{ quizId: string }> }) {
  const session = await getSession();
  if (!session.isHost) redirect('/host');

  const { quizId } = await params;
  
  // Redirect to setup dashboard by default
  redirect(`/quiz/${quizId}/host/setup`);
}
