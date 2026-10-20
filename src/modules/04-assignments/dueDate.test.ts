// Tests for M04-FR-005: Configure assignment due date.   Run with:  bun test
import { describe, expect, test } from 'bun:test'
import type { Assignment } from './assignments'
import {
  DUE_DATE_ERRORS,
  formatDueDate,
  parseDueDateInput,
  setAssignmentDueDate,
  toDateTimeLocalValue,
} from './dueDate'

describe('M04-FR-005: valid due dates', () => {
  test('stores a Toronto summer time (EDT) with a -04:00 offset', () => {
    expect(parseDueDateInput('2026-10-23T23:59')).toEqual({
      ok: true,
      dueDate: '2026-10-23T23:59:00-04:00',
    })
  })

  test('stores a Toronto winter time (EST) with a -05:00 offset', () => {
    expect(parseDueDateInput('2026-12-10T23:59')).toEqual({
      ok: true,
      dueDate: '2026-12-10T23:59:00-05:00',
    })
  })

  test('accepts seconds', () => {
    expect(parseDueDateInput('2026-10-23T23:59:30')).toEqual({
      ok: true,
      dueDate: '2026-10-23T23:59:30-04:00',
    })
  })
})

describe('M04-FR-005: invalid due dates are rejected', () => {
  test('missing due date', () => {
    expect(parseDueDateInput('')).toEqual({ ok: false, error: DUE_DATE_ERRORS.missing })
    expect(parseDueDateInput('   ')).toEqual({ ok: false, error: DUE_DATE_ERRORS.missing })
    expect(parseDueDateInput(undefined)).toEqual({ ok: false, error: DUE_DATE_ERRORS.missing })
  })

  test('text that is not a date', () => {
    expect(parseDueDateInput('tomorrow')).toEqual({ ok: false, error: DUE_DATE_ERRORS.format })
    expect(parseDueDateInput('2026-10-23')).toEqual({ ok: false, error: DUE_DATE_ERRORS.format })
    expect(parseDueDateInput('23/10/2026 23:59')).toEqual({
      ok: false,
      error: DUE_DATE_ERRORS.format,
    })
  })

  test('dates that do not exist on the calendar', () => {
    expect(parseDueDateInput('2026-02-30T10:00')).toEqual({
      ok: false,
      error: DUE_DATE_ERRORS.calendar,
    })
    expect(parseDueDateInput('2026-13-01T10:00')).toEqual({
      ok: false,
      error: DUE_DATE_ERRORS.calendar,
    })
    expect(parseDueDateInput('2026-10-23T24:00')).toEqual({
      ok: false,
      error: DUE_DATE_ERRORS.calendar,
    })
  })

  test('Feb 29 only exists in leap years', () => {
    expect(parseDueDateInput('2028-02-29T12:00').ok).toBe(true)
    expect(parseDueDateInput('2027-02-29T12:00')).toEqual({
      ok: false,
      error: DUE_DATE_ERRORS.calendar,
    })
  })
})

describe('M04-FR-005: time-zone normalization', () => {
  test('a UTC time is converted to the same moment in Toronto time', () => {
    expect(parseDueDateInput('2026-10-24T03:59:00Z')).toEqual({
      ok: true,
      dueDate: '2026-10-23T23:59:00-04:00',
    })
  })

  test('a Vancouver time is converted to the same moment in Toronto time', () => {
    expect(parseDueDateInput('2026-10-23T20:59:00-07:00')).toEqual({
      ok: true,
      dueDate: '2026-10-23T23:59:00-04:00',
    })
  })

  test('the same input always gives the same stored value', () => {
    const first = parseDueDateInput('2026-11-15T17:00')
    const second = parseDueDateInput('2026-11-15T17:00')
    expect(first).toEqual(second)
  })
})

describe('M04-FR-005: daylight saving time', () => {
  test('the night clocks spring forward, 2:30 AM does not exist and is rejected', () => {
    expect(parseDueDateInput('2026-03-08T02:30')).toEqual({
      ok: false,
      error: DUE_DATE_ERRORS.dstGap,
    })
  })

  test('just before and after the spring-forward gap are fine', () => {
    expect(parseDueDateInput('2026-03-08T01:59')).toEqual({
      ok: true,
      dueDate: '2026-03-08T01:59:00-05:00',
    })
    expect(parseDueDateInput('2026-03-08T03:00')).toEqual({
      ok: true,
      dueDate: '2026-03-08T03:00:00-04:00',
    })
  })

  test('the night clocks fall back, 1:30 AM happens twice and the first (EDT) is used', () => {
    expect(parseDueDateInput('2026-11-01T01:30')).toEqual({
      ok: true,
      dueDate: '2026-11-01T01:30:00-04:00',
    })
  })
})

describe('M04-FR-005: displaying due dates', () => {
  test('shows a readable Toronto time', () => {
    expect(formatDueDate('2026-10-23T23:59:00-04:00')).toBe('Fri, Oct 23, 2026, 11:59 PM EDT')
  })

  test('shows the same text whatever offset the moment was stored with', () => {
    expect(formatDueDate('2026-10-24T03:59:00Z')).toBe(formatDueDate('2026-10-23T23:59:00-04:00'))
  })

  test('shows a safe message for a broken value', () => {
    expect(formatDueDate('not a date')).toBe('No due date')
  })

  test('fills the date-time input with Toronto time', () => {
    expect(toDateTimeLocalValue('2026-10-24T03:59:00Z')).toBe('2026-10-23T23:59')
    expect(toDateTimeLocalValue('not a date')).toBe('')
  })

  test('store then display gives back what the instructor typed', () => {
    const result = parseDueDateInput('2026-11-01T09:00')
    if (!result.ok) throw new Error(result.error)
    expect(toDateTimeLocalValue(result.dueDate)).toBe('2026-11-01T09:00')
  })
})

describe('M04-FR-005: updating an assignment due date', () => {
  const original: Assignment = {
    id: 'assignment-001',
    courseId: 'CSCN73030',
    title: 'Design Sprint 1',
    description: 'Complete the first design sprint.',
    dueDate: '2026-10-20T23:59:00-04:00',
  }

  test('changes the due date', () => {
    const result = setAssignmentDueDate(original, '2026-10-27T17:00')
    if (!result.ok) throw new Error(result.error)
    expect(result.assignment.dueDate).toBe('2026-10-27T17:00:00-04:00')
  })

  test('keeps every other field the same', () => {
    const result = setAssignmentDueDate(original, '2026-10-27T17:00')
    if (!result.ok) throw new Error(result.error)
    expect(result.assignment).toEqual({ ...original, dueDate: '2026-10-27T17:00:00-04:00' })
  })

  test('does not change the original assignment object', () => {
    setAssignmentDueDate(original, '2026-10-27T17:00')
    expect(original.dueDate).toBe('2026-10-20T23:59:00-04:00')
  })

  test('an invalid new due date is rejected and nothing changes', () => {
    expect(setAssignmentDueDate(original, '2026-02-30T10:00')).toEqual({
      ok: false,
      error: DUE_DATE_ERRORS.calendar,
    })
    expect(original.dueDate).toBe('2026-10-20T23:59:00-04:00')
  })
})
