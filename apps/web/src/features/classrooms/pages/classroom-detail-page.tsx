import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { classroomsApi } from '../api/classrooms.api';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

export function ClassroomDetailPage() {
  const { id } = useParams<{ id: string }>();

  const { data: classroom, isLoading } = useQuery({
    queryKey: ['classrooms', id],
    queryFn: () => classroomsApi.getById(id!),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (!classroom) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{classroom.title}</h1>
        <p className="text-sm text-muted-foreground">
          {classroom.courseId} · {classroom.term}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Badge variant="secondary">{classroom.totalUsers} members</Badge>
        {classroom.professor && (
          <Badge variant="outline">
            Professor: {classroom.professor.firstName} {classroom.professor.lastName}
          </Badge>
        )}
      </div>

      {classroom.description && <p className="text-sm">{classroom.description}</p>}

      {classroom.students && classroom.students.length > 0 && (
        <div>
          <h2 className="mb-2 text-lg font-medium">Students</h2>
          <ul className="space-y-1 text-sm">
            {classroom.students.map((s) => (
              <li key={s.id} className="text-muted-foreground">
                {s.firstName} {s.lastName} — {s.email}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
