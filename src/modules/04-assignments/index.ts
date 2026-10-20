// MODULE 4: Assignment & Submission System
//
// Scope from the project brief:
//   - Create assignments
//   - Assignment due dates
//   - File submission
//   - Resubmission rules
//   - Submission history
//   - Late submission tracking
//   - Handle accommodations
//
// HOW TO ADD A PAGE TO THE ROUTER (basic demo):
//   1. Find the router at the bottom of this file.
//   2. Copy the  .get('/hello', ...)  line.
//   3. Change the address ('/hello') and the HTML it returns.
//   4. Save. Your new page is at  http://localhost:3000/04-assignments/<your-address>
import { Elysia, t } from 'elysia'
import { defineModule, moduleBase } from '../../core/defineModule'
import { escapeHtml } from '../../core/pages'
import {
  listAssignmentsByCourse,
  getAssignmentById,
} from './assignments'
import {
  formatDueDate,
  setAssignmentDueDate,
  toDateTimeLocalValue,
} from './dueDate'

const base = moduleBase(import.meta.dir)

// M04-FR-003: Display assignments associated with a course
function renderAssignmentList(courseId: string): string {
  const assignments = listAssignmentsByCourse(courseId)

  const items = assignments
    .map(
      (assignment) => `
        <li>
          <a href="${base}/assignments/${encodeURIComponent(assignment.id)}">
            <strong>${escapeHtml(assignment.title)}</strong>
          </a>
          <span> — Due: ${escapeHtml(formatDueDate(assignment.dueDate))}</span>
        </li>
      `,
    )
    .join('')

  return `
    <h1>Assignments</h1>
    <p>Course: ${escapeHtml(courseId)}</p>
    ${
      assignments.length
        ? `<ul>${items}</ul>`
        : '<p>No assignments found for this course.</p>'
    }
    <p><a href="${base}">Back to Module 4</a></p>
  `
}

// M04-FR-004: Display the selected assignment's details
function renderAssignmentDetails(id: string): string | null {
  const assignment = getAssignmentById(id)

  if (!assignment) {
    return null
  }

  return `
    <h1>${escapeHtml(assignment.title)}</h1>

    <p>
      <strong>Course:</strong>
      ${escapeHtml(assignment.courseId)}
    </p>

    <p>
      <strong>Description:</strong>
      ${escapeHtml(assignment.description)}
    </p>

    <p>
      <strong>Due date:</strong>
      ${escapeHtml(formatDueDate(assignment.dueDate))}
    </p>

    <p>
      <a href="${base}/assignments/${encodeURIComponent(assignment.id)}/due-date">
        Change due date
      </a>
    </p>

    <p>
      <a href="${base}/assignments?courseId=${encodeURIComponent(assignment.courseId)}">
        Back to assignments
      </a>
    </p>
  `
}

// M04-FR-005: Form to configure an assignment's due date (Toronto time)
function renderDueDateForm(
  id: string,
  title: string,
  value: string,
  error?: string,
): string {
  return `
    <h1>Due date: ${escapeHtml(title)}</h1>
    ${error ? `<p role="alert"><strong>Error:</strong> ${escapeHtml(error)}</p>` : ''}
    <form method="post" action="${base}/assignments/${encodeURIComponent(id)}/due-date">
      <label for="dueDate">Due date and time (Toronto time)</label>
      <input type="datetime-local" id="dueDate" name="dueDate" value="${escapeHtml(value)}">
      <button type="submit">Save due date</button>
    </form>
    <p><a href="${base}/assignments/${encodeURIComponent(id)}">Back to assignment</a></p>
  `
}

const assignmentNotFound = `
  <h1>Assignment not found</h1>
  <p><a href="${base}">Back to Module 4</a></p>
`

export default defineModule({
  name: 'Module 4: Assignment & Submission System',
  description: 'Assignments, due dates, submissions',

  router: new Elysia()
    // Module 4 homepage
    .get(
      '/',
      () => `
        <h1>Module 4: Assignment &amp; Submission System</h1>
        <p>Assignment viewing prototype (demo data).</p>

        <p>
          <a href="${base}/assignments?courseId=CSCN73030">
            View CSCN73030 Assignments
          </a>
        </p>

        <p><a href="/">Back to the home page</a></p>
      `,
    )

    // M04-FR-003: View course assignments
    .get('/assignments', ({ query, set }) => {
      const courseId =
        typeof query.courseId === 'string' ? query.courseId : ''

      if (!courseId.trim()) {
        set.status = 400
        return '<h1>Course ID is required</h1>'
      }

      return renderAssignmentList(courseId)
    })

    // M04-FR-004: View individual assignment details
    .get('/assignments/:id', ({ params, set }) => {
      const details = renderAssignmentDetails(params.id)

      if (details === null) {
        set.status = 404
        return `
          <h1>Assignment not found</h1>
          <p><a href="${base}">Back to Module 4</a></p>
        `
      }

      return details
    })

    // M04-FR-005: Show the due date form
    .get('/assignments/:id/due-date', ({ params, set }) => {
      const assignment = getAssignmentById(params.id)

      if (!assignment) {
        set.status = 404
        return assignmentNotFound
      }

      return renderDueDateForm(
        assignment.id,
        assignment.title,
        toDateTimeLocalValue(assignment.dueDate),
      )
    })

    // M04-FR-005: Save the due date
    .post(
      '/assignments/:id/due-date',
      ({ params, body, set }) => {
        const assignment = getAssignmentById(params.id)

        if (!assignment) {
          set.status = 404
          return assignmentNotFound
        }

        const result = setAssignmentDueDate(assignment, body.dueDate)

        if (!result.ok) {
          set.status = 400
          return renderDueDateForm(
            assignment.id,
            assignment.title,
            body.dueDate ?? '',
            result.error,
          )
        }

        // TEMPORARY (Sprint 1): updates the in-memory sample data until the
        // team's shared assignment storage exists. Resets when the server restarts.
        Object.assign(assignment, result.assignment)

        return `
          <h1>Due date saved</h1>
          <p><strong>${escapeHtml(assignment.title)}</strong> is now due
            ${escapeHtml(formatDueDate(assignment.dueDate))}.</p>
          <p>Stored as: <code>${escapeHtml(assignment.dueDate)}</code></p>
          <p><a href="${base}/assignments/${encodeURIComponent(assignment.id)}">Back to assignment</a></p>
        `
      },
      { body: t.Object({ dueDate: t.Optional(t.String()) }) },
    ),
})
