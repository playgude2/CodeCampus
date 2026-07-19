import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { problemsApi } from '../api/problems.api';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

export function ProblemDetailPage() {
  const { id } = useParams<{ id: string }>();

  const { data: problem, isLoading } = useQuery({
    queryKey: ['problems', id],
    queryFn: () => problemsApi.getById(id!),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!problem) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-semibold">{problem.title}</h1>
        <Badge className="capitalize">{problem.difficulty}</Badge>
      </div>
      <div className="flex flex-wrap gap-1">
        {problem.tags.map((tag) => (
          <Badge key={tag} variant="outline">
            {tag}
          </Badge>
        ))}
      </div>
      <div className="whitespace-pre-wrap text-sm leading-relaxed">{problem.body}</div>
    </div>
  );
}
