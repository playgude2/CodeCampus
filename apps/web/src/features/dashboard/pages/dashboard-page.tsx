import { useQuery } from '@tanstack/react-query';
import { assignmentsApi } from '@/features/assignments/api/assignments.api';
import { useAuth } from '@/features/auth/context/auth-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/shared/empty-state';
import { Skeleton } from '@/components/ui/skeleton';

export function DashboardPage() {
  const { user } = useAuth();

  const { data: deadlines, isLoading } = useQuery({
    queryKey: ['assignments', 'deadlines'],
    queryFn: assignmentsApi.deadlines,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Welcome back, {user?.firstName}</h1>
        <p className="text-sm text-muted-foreground">
          Here's what's happening across your classrooms.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Upcoming deadlines</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          )}
          {!isLoading && (!deadlines || deadlines.length === 0) && (
            <EmptyState title="Nothing due soon" />
          )}
          {!isLoading && deadlines && deadlines.length > 0 && (
            <ul className="space-y-2">
              {deadlines.map((assignment) => (
                <li key={assignment.id} className="flex items-center justify-between text-sm">
                  <span className="font-medium">{assignment.title}</span>
                  <span className="text-muted-foreground">
                    due {new Date(assignment.endDate).toLocaleDateString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
