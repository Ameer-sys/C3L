// Page tests for M04-FR-005: the due date form and how due dates show on the list and details pages.
// Run with:  bun test
import { describe, expect, test } from 'bun:test'
import { DUE_DATE_ERRORS } from './dueDate'
import mod from './index'

const get = (path: string) => mod.router.handle(new Request(`http://localhost${path}`))

const postDueDate = (id: string, dueDate: string) =>
  mod.router.handle(
    new Request(`http://localhost/assignments/${id}/due-date`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ dueDate }).toString(),
    }),
  )

describe('M04-FR-005: due dates on pages', () => {
  test('the list page shows readable Toronto time', async () => {
    const response = await get('/assignments?courseId=CSCN73030')
    expect(response.status).toBe(200)
    expect(await response.text()).toContain('Tue, Oct 20, 2026, 11:59 PM EDT')
  })

  test('the details page shows readable Toronto time and a link to change it', async () => {
    const response = await get('/assignments/assignment-001')
    const html = await response.text()
    expect(html).toContain('Tue, Oct 20, 2026, 11:59 PM EDT')
    expect(html).toContain('/assignments/assignment-001/due-date')
  })
})

describe('M04-FR-005: due date form', () => {
  test('the form opens filled with the current due date', async () => {
    const response = await get('/assignments/assignment-001/due-date')
    expect(response.status).toBe(200)
    expect(await response.text()).toContain('value="2026-10-20T23:59"')
  })

  test('the form for an unknown assignment answers 404', async () => {
    const response = await get('/assignments/does-not-exist/due-date')
    expect(response.status).toBe(404)
  })

  test('an impossible date is rejected with a message', async () => {
    const response = await postDueDate('assignment-001', '2026-02-30T10:00')
    expect(response.status).toBe(400)
    expect(await response.text()).toContain(DUE_DATE_ERRORS.calendar)
  })

  test('a missing date is rejected with a message', async () => {
    const response = await postDueDate('assignment-001', '')
    expect(response.status).toBe(400)
    expect(await response.text()).toContain(DUE_DATE_ERRORS.missing)
  })

  test('a valid date is saved and shows on the details page, other fields unchanged', async () => {
    const saved = await postDueDate('assignment-003', '2026-10-27T17:00')
    expect(saved.status).toBe(200)
    expect(await saved.text()).toContain('Tue, Oct 27, 2026, 5:00 PM EDT')

    const details = await (await get('/assignments/assignment-003')).text()
    expect(details).toContain('Tue, Oct 27, 2026, 5:00 PM EDT')
    expect(details).toContain('Software Quality Report')
    expect(details).toContain('Submit the quality report.')
  })
})
