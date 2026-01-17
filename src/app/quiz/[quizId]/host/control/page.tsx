import { getQuizData } from '@/lib/actions';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { getSnapshots } from '@/lib/snapshot';
import ControlDashboard from '@/components/ControlDashboard';
import SnapshotManager from '@/components/SnapshotManager';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function ControlPage({ params }: { params: Promise<{ quizId: string }> }) {
  const session = await getSession();
  if (!session.isHost) redirect('/host');

  const { quizId } = await params;
  const quiz = await getQuizData(quizId);
  if (!quiz) redirect('/host');

  const snapshots = await getSnapshots(quizId);

  return (
    <>
      <SnapshotManager quizId={quizId} snapshots={JSON.parse(JSON.stringify(snapshots))} quizStatus={quiz.status} />
      <ControlDashboard quiz={quiz} />
    </>
  );
}
