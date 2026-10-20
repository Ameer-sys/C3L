export interface Assignment {
  id: string
  courseId: string
  title: string
  description: string
  dueDate: string
}

// Temporary data for Sprint 1 development.
// Replace with the team's shared persistence layer during integration.
const sampleAssignments: Assignment[] = [
  {
    id: 'assignment-001',
    courseId: 'CSCN73030',
    title: 'Design Sprint 1',
    description: 'Complete the first design sprint.',
    dueDate: '2026-10-20T23:59:00-04:00',
  },
  {
    id: 'assignment-002',
    courseId: 'CSCN73030',
    title: 'Design Sprint 2',
    description: 'Complete the second design sprint.',
    dueDate: '2026-11-03T23:59:00-05:00',
  },
  {
    id: 'assignment-003',
    courseId: 'CSCN73010',
    title: 'Software Quality Report',
    description: 'Submit the quality report.',
    dueDate: '2026-10-25T23:59:00-04:00',
  },
]

export function listAssignmentsByCourse(
  courseId: string,
  assignments: readonly Assignment[] = sampleAssignments,
): Assignment[] {
  if (!courseId.trim()) return []

  return assignments.filter(
    (assignment) => assignment.courseId === courseId,
  )
}

export function getAssignmentById(
  id: string,
  assignments: readonly Assignment[] = sampleAssignments,
): Assignment | undefined {
  return assignments.find((assignment) => assignment.id === id)
}