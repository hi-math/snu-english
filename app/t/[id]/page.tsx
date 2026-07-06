import { notFound } from 'next/navigation';
import Activity from '@/app/Activity';

// 과제별 독립 URL: /t/1, /t/2
export default async function TaskActivityPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (id !== '1' && id !== '2') {
    notFound();
  }
  return <Activity taskId={Number(id)} />;
}
