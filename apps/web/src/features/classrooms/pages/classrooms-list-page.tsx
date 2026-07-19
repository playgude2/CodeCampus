import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { classroomsApi } from '../api/classrooms.api';
import { EmptyState } from '@/components/shared/empty-state';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function ClassroomsListPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['classrooms', 'list'],
    queryFn: () => classroomsApi.list(),
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Classrooms</h1>

      {isLoading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-lg" />
          ))}
        </div>
      )}

      {!isLoading && data?.data.length === 0 && (
        <EmptyState
          title="No classrooms yet"
          description="Classrooms you're enrolled in or teaching will show up here."
        />
      )}

      {!isLoading && data && data.data.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.data.map((classroom) => (
            <Link key={classroom.id} to={`/home/classrooms/${classroom.id}`}>
              <Card className="h-full transition-shadow hover:shadow-md">
                <CardHeader>
                  <CardTitle className="text-base">{classroom.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-sm text-muted-foreground">{classroom.courseId}</p>
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary">{classroom.term}</Badge>
                    <span className="text-xs text-muted-foreground">
                      {classroom.totalUsers} member{classroom.totalUsers === 1 ? '' : 's'}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
