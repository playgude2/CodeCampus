import { apiClient } from '@/lib/api-client';
import type { Assignment } from '@/types/assignment';
import type { PaginatedResult } from '@/types/common';

export interface AssignmentsQuery {
  page?: number;
  limit?: number;
  classroomId?: string;
}

export const assignmentsApi = {
  async list(query: AssignmentsQuery = {}): Promise<PaginatedResult<Assignment>> {
    const { data } = await apiClient.get<PaginatedResult<Assignment>>('/assignments', {
      params: { page: 1, limit: 20, ...query },
    });
    return data;
  },

  async deadlines(): Promise<Assignment[]> {
    const { data } = await apiClient.get<Assignment[]>('/assignments/deadlines');
    return data;
  },
};
