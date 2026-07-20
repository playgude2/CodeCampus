export const NotificationType = {
  NEW_ASSIGNMENT: 'new_assignment',
  ASSIGNMENT_UPDATED: 'assignment_updated',
  GRADES_PUBLISHED: 'grades_published',
} as const;
export type NotificationType = (typeof NotificationType)[keyof typeof NotificationType];

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  entityType: string | null;
  entityId: string | null;
  link: string | null;
  /** Null = unread. */
  readAt: string | null;
  createdAt: string;
}
