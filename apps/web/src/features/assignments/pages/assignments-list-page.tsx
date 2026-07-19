import { useQuery } from '@tanstack/react-query';
import { assignmentsApi } from '../api/assignments.api';
import { EmptyState } from '@/components/shared/empty-state';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AssignmentStatus } from '@/types/assignment';

const STATUS_VARIANT: Record<
  AssignmentStatus,
  'default' | 'secondary' | 'outline' | 'destructive'
> = {
  [AssignmentStatus.DRAFT]: 'outline',
  [AssignmentStatus.SCHEDULED]: 'secondary',
  [AssignmentStatus.ACTIVE]: 'default',
  [AssignmentStatus.COMPLETED]: 'secondary',
  [AssignmentStatus.GRADE_PUBLISHED]: 'secondary',
};

export function AssignmentsListPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['assignments', 'list'],
    queryFn: () => assignmentsApi.list(),
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Assignments</h1>

      {isLoading && (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      )}

      {!isLoading && data?.data.length === 0 && (
        <EmptyState
          title="No assignments yet"
          description="Assignments across your classrooms will show up here."
        />
      )}

      {!isLoading && data && data.data.length > 0 && (
        <div className="space-y-2">
          {data.data.map((assignment) => (
            <div
              key={assignment.id}
              className="flex items-center justify-between rounded-lg border border-border p-4"
            >
              <div>
                <p className="font-medium">{assignment.title}</p>
                <p className="text-sm text-muted-foreground">
                  {new Date(assignment.startDate).toLocaleDateString()} –{' '}
                  {new Date(assignment.endDate).toLocaleDateString()}
                </p>
              </div>
              <Badge variant={STATUS_VARIANT[assignment.status]} className="capitalize">
                {assignment.status.replace('_', ' ')}
              </Badge>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
