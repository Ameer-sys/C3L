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
import { Elysia } from 'elysia'
import { defineModule, moduleBase } from '../../core/defineModule'
import { escapeHtml } from '../../core/pages'
import { listAssignmentsByCourse } from './assignments'

const base = moduleBase(import.meta.dir)

function renderAssignmentList(courseId: string): string {
  const assignments = listAssignmentsByCourse(courseId)

  const items = assignments.map((assignment) => `
    <li>
      <strong>${escapeHtml(assignment.title)}</strong>
      <span> — Due: ${escapeHtml(assignment.dueDate)}</span>
    </li>
  `).join('')

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

export default defineModule({
  name: 'Module 4: Assignment & Submission System',
  description: 'Assignments, due dates, submissions',

  router: new Elysia()
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
    .get(
      '/assignments',
      ({ query }) => {
        const courseId =
          typeof query.courseId === 'string' ? query.courseId : ''

        if (!courseId.trim()) {
          return '<h1>Course ID is required</h1>'
        }

        return renderAssignmentList(courseId)
      },
    ),
})
