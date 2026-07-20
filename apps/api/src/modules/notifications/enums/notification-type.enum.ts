export enum NotificationType {
  /** A new assignment became available (DRAFT → ACTIVE). */
  NEW_ASSIGNMENT = 'new_assignment',
  /** A problem was added to an already-visible assignment. */
  ASSIGNMENT_UPDATED = 'assignment_updated',
  /** Grades + feedback were published for a completed assignment. */
  GRADES_PUBLISHED = 'grades_published',
}
