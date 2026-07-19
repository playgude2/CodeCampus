import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ChevronDown, ChevronRight, Code2 } from 'lucide-react';
import { assignmentsApi } from '../api/assignments.api';
import { EmptyState } from '@/components/shared/empty-state';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
  const [expandedId, setExpandedId] = useState<string | null>(null);

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
          {data.data.map((assignment) => {
            const expanded = expandedId === assignment.id;
            return (
              <div key={assignment.id} className="rounded-lg border border-border">
                <button
                  type="button"
                  onClick={() => setExpandedId(expanded ? null : assignment.id)}
                  className="flex w-full items-center justify-between p-4 text-left"
                >
                  <div className="flex items-center gap-2">
                    {expanded ? (
                      <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                    )}
                    <div>
                      <p className="font-medium">{assignment.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(assignment.startDate).toLocaleDateString()} –{' '}
                        {new Date(assignment.endDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <Badge variant={STATUS_VARIANT[assignment.status]} className="capitalize">
                    {assignment.status.replace('_', ' ')}
                  </Badge>
                </button>
                {expanded && <AssignmentProblemsPanel assignmentId={assignment.id} />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function AssignmentProblemsPanel({ assignmentId }: { assignmentId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ['assignments', assignmentId, 'problems'],
    queryFn: () => assignmentsApi.problems(assignmentId),
  });

  return (
    <div className="border-t border-border p-4">
      {isLoading && (
        <div className="space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      )}
      {!isLoading && data?.length === 0 && (
        <p className="text-sm text-muted-foreground">No problems assigned yet.</p>
      )}
      {!isLoading && data && data.length > 0 && (
        <div className="space-y-2">
          {data.map((ap) => (
            <div
              key={ap.id}
              className="flex items-center justify-between rounded-md bg-muted/50 p-3"
            >
              <div>
                <p className="text-sm font-medium">{ap.title}</p>
                <div className="mt-1 flex items-center gap-2">
                  <Badge variant="outline" className="capitalize">
                    {ap.difficulty}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{ap.score} pts</span>
                </div>
              </div>
              <Button asChild size="sm">
                <Link to={`/solve/${ap.id}`}>
                  <Code2 className="size-4" />
                  Solve
                </Link>
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
