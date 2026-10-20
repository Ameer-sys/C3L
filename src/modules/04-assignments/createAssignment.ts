import { addAssignment, type Assignment } from './assignments'
import { parseDueDateInput } from './dueDate'

// The values submitted by the assignment creation form.
export interface AssignmentInput {
  courseId?: string
  title?: string
  description?: string
  dueDate?: string
}

// Field-specific messages explain what the instructor needs to fix.
export interface AssignmentFieldErrors {
  courseId?: string
  title?: string
  description?: string
  dueDate?: string
}

// Validation either succeeds with cleaned values or fails with errors.
export type AssignmentValidationResult =
  | {
      ok: true
      values: {
        courseId: string
        title: string
        description: string
        dueDate: string
      }
    }
  | {
      ok: false
      errors: AssignmentFieldErrors
    }

// M04-FR-002: Validate required assignment fields.
export function validateAssignmentInput(
  input: AssignmentInput,
): AssignmentValidationResult {
  const errors: AssignmentFieldErrors = {}

  const courseId = (input.courseId ?? '').trim()
  const title = (input.title ?? '').trim()
  const description = (input.description ?? '').trim()

  // Course ID validation
  if (!courseId) {
    errors.courseId = 'Course ID is required.'
  }

  // Title validation
  if (!title) {
    errors.title = 'Title is required.'
  } else if (title.length > 200) {
    errors.title = 'Title must be 200 characters or fewer.'
  }

  // Description validation
  if (!description) {
    errors.description = 'Description is required.'
  } else if (description.length > 5000) {
    errors.description =
      'Description must be 5000 characters or fewer.'
  }

  // Reuse FR-005 validation to handle Toronto dates correctly.
  const dueDateResult = parseDueDateInput(input.dueDate)

  if (!dueDateResult.ok) {
    errors.dueDate = dueDateResult.error
  }

  // Reject the input if at least one field is invalid.
  if (Object.keys(errors).length > 0) {
    return { ok: false, errors }
  }

  // TypeScript can now safely use the validated due date.
  if (!dueDateResult.ok) {
    return { ok: false, errors: { dueDate: dueDateResult.error } }
  }

  return {
    ok: true,
    values: {
      courseId,
      title,
      description,
      dueDate: dueDateResult.dueDate,
    },
  }
}



// M04-FR-001: Create an assignment after validating its fields.
export function createAssignment(
  input: AssignmentInput,
):
  | { ok: true; assignment: Assignment }
  | { ok: false; errors: AssignmentFieldErrors } {

  // Step 1: Validate the instructor's input.
  const validation = validateAssignmentInput(input)

  // Step 2: Reject invalid input without saving anything.
  if (!validation.ok) {
    return {
      ok: false,
      errors: validation.errors,
    }
  }

  // Step 3: Create the assignment with a unique identifier.
  const assignment: Assignment = {
    id: crypto.randomUUID(),
    courseId: validation.values.courseId,
    title: validation.values.title,
    description: validation.values.description,
    dueDate: validation.values.dueDate,
  }

  // Step 4: Save the assignment to temporary storage.
  addAssignment(assignment)

  // Step 5: Return the created assignment.
  return {
    ok: true,
    assignment,
  }
}
