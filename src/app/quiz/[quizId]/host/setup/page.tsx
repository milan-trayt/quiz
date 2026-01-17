import { getQuizData } from '@/lib/actions';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import SetupDashboard from '@/components/SetupDashboard';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function SetupPage({ params }: { params: Promise<{ quizId: string }> }) {
  const session = await getSession();
  if (!session.isHost) redirect('/host');

  const { quizId } = await params;
  const quiz = await getQuizData(quizId);
  if (!quiz) redirect('/host');

  return <SetupDashboard quiz={quiz} />;
}
