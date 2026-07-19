import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { problemsApi } from '../api/problems.api';
import { EmptyState } from '@/components/shared/empty-state';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Difficulty } from '@/types/problem';

const DIFFICULTY_VARIANT: Record<Difficulty, 'default' | 'secondary' | 'destructive'> = {
  [Difficulty.EASY]: 'secondary',
  [Difficulty.MEDIUM]: 'default',
  [Difficulty.HARD]: 'destructive',
};

export function ProblemsListPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['problems', 'list'],
    queryFn: () => problemsApi.list(),
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Problems</h1>

      {isLoading && (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      )}

      {!isLoading && data?.data.length === 0 && (
        <EmptyState
          title="No problems yet"
          description="Problems you can access will show up here."
        />
      )}

      {!isLoading && data && data.data.length > 0 && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Difficulty</TableHead>
              <TableHead>Tags</TableHead>
              <TableHead>Source</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.data.map((problem) => (
              <TableRow key={problem.id}>
                <TableCell>
                  <Link to={`/home/problems/${problem.id}`} className="font-medium hover:underline">
                    {problem.title}
                  </Link>
                </TableCell>
                <TableCell>
                  <Badge variant={DIFFICULTY_VARIANT[problem.difficulty]} className="capitalize">
                    {problem.difficulty}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {problem.tags.map((tag) => (
                      <Badge key={tag} variant="outline">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell className="capitalize text-muted-foreground">{problem.source}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
