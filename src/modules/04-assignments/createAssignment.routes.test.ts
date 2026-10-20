
import { describe, expect, test } from 'bun:test'
import mod from './index'

const validInput = {
  courseId: 'CSCN73030',
  title: 'Route Test Assignment',
  description: 'Created through the Elysia POST route.',
  dueDate: '2026-10-23T23:59',
}

// Simulate an instructor submitting the HTML form.
function submitAssignment(
  input: Record<string, string>,
): Promise<Response> | Response {
  return mod.router.handle(
    new Request('http://localhost/assignments/new', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams(input).toString(),
    }),
  )
}

describe('M04-FR-001/002: Assignment creation routes', () => {
  test('GET /assignments/new displays the creation form', async () => {
    const response = await mod.router.handle(
      new Request(
        'http://localhost/assignments/new?courseId=CSCN73030',
      ),
    )

    const html = await response.text()

    expect(response.status).toBe(200)
    expect(html).toContain('<form')
    expect(html).toContain('name="title"')
    expect(html).toContain('name="description"')
    expect(html).toContain('name="dueDate"')
    expect(html).toContain('Toronto time')
    expect(html).toContain('CSCN73030')
  })

  test('POST rejects a missing title with status 400', async () => {
    const response = await submitAssignment({
      ...validInput,
      title: '',
    })

    const html = await response.text()

    expect(response.status).toBe(400)
    expect(html).toContain('Title is required.')
    expect(html).toContain(validInput.description)
  })

  test('POST rejects an impossible due date', async () => {
    const response = await submitAssignment({
      ...validInput,
      dueDate: '2026-02-30T10:00',
    })

    const html = await response.text()

    expect(response.status).toBe(400)
    expect(html).toContain('Due date is not a real calendar date.')
  })

  test('POST creates an assignment and displays its details', async () => {
    const response = await submitAssignment(validInput)
    const html = await response.text()

    expect(response.status).toBe(201)
    expect(html).toContain('Assignment Created Successfully')

    // Find the assignment ID from the success page.
    const match = html.match(
      /assignments\/([0-9a-f-]{36})/,
    )

    expect(match).not.toBeNull()

    if (!match) return

    const assignmentId = match[1]

    // Confirm that the existing details route can display it.
    const detailsResponse = await mod.router.handle(
      new Request(
        `http://localhost/assignments/${assignmentId}`,
      ),
    )

    const detailsHtml = await detailsResponse.text()

    expect(detailsResponse.status).toBe(200)
    expect(detailsHtml).toContain(validInput.title)
    expect(detailsHtml).toContain(validInput.description)
    expect(detailsHtml).toContain('Oct 23, 2026')

    // Confirm that the existing list route also displays it.
    const listResponse = await mod.router.handle(
      new Request(
        'http://localhost/assignments?courseId=CSCN73030',
      ),
    )

    const listHtml = await listResponse.text()

    expect(listResponse.status).toBe(200)
    expect(listHtml).toContain(assignmentId)
    expect(listHtml).toContain(validInput.title)
  })

  test('course list contains a link to create an assignment', async () => {
    const response = await mod.router.handle(
      new Request(
        'http://localhost/assignments?courseId=CSCN73030',
      ),
    )

    const html = await response.text()

    expect(response.status).toBe(200)
    expect(html).toContain(
      '/04-assignments/assignments/new?courseId=CSCN73030',
    )
  })
})
