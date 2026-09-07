type SequenceRef = {
  current: number
}

export function beginLatestRequest(sequenceRef: SequenceRef) {
  sequenceRef.current += 1
  return sequenceRef.current
}

export function isLatestRequest(sequenceRef: SequenceRef, sequence: number) {
  return sequenceRef.current === sequence
}

export function invalidateLatestRequest(sequenceRef: SequenceRef) {
  sequenceRef.current += 1
}
