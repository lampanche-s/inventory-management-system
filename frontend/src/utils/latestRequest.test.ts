import { describe, expect, it } from 'vitest'
import {
  beginLatestRequest,
  invalidateLatestRequest,
  isLatestRequest,
} from './latestRequest'

function createSequenceRef() {
  return { current: 0 }
}

describe('latestRequest', () => {
  it('only considers the most recently started request current', () => {
    const sequenceRef = createSequenceRef()
    const first = beginLatestRequest(sequenceRef)
    const second = beginLatestRequest(sequenceRef)

    expect(isLatestRequest(sequenceRef, first)).toBe(false)
    expect(isLatestRequest(sequenceRef, second)).toBe(true)
  })

  it('keeps stale success and failure completions from committing state', async () => {
    const sequenceRef = createSequenceRef()
    const committed: string[] = []

    const run = async (label: string, completion: Promise<'success' | 'error'>) => {
      const sequence = beginLatestRequest(sequenceRef)
      const outcome = await completion

      if (!isLatestRequest(sequenceRef, sequence)) {
        return
      }

      committed.push(`${label}:${outcome}`)
    }

    let resolveFirst!: (value: 'success' | 'error') => void
    let resolveSecond!: (value: 'success' | 'error') => void

    const firstPromise = new Promise<'success' | 'error'>((resolve) => {
      resolveFirst = resolve
    })
    const secondPromise = new Promise<'success' | 'error'>((resolve) => {
      resolveSecond = resolve
    })

    const first = run('old', firstPromise)
    const second = run('new', secondPromise)

    resolveSecond('success')
    await second
    resolveFirst('error')
    await first

    expect(committed).toEqual(['new:success'])
  })

  it('invalidates an in-flight request even when no replacement request starts', () => {
    const sequenceRef = createSequenceRef()
    const current = beginLatestRequest(sequenceRef)

    invalidateLatestRequest(sequenceRef)

    expect(isLatestRequest(sequenceRef, current)).toBe(false)
  })
})
