/** "March 2026" for a Firestore Timestamp (member-since lines). */
export function monthYear(timestamp) {
  if (!timestamp?.toDate) return ''
  return timestamp.toDate().toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
}

/** "3m", "2h", "5d" style relative time for a Firestore Timestamp. */
export function timeAgo(timestamp) {
  if (!timestamp?.toDate) return ''
  const seconds = Math.max(0, (Date.now() - timestamp.toDate().getTime()) / 1000)
  if (seconds < 60) return 'now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d`
  return timestamp.toDate().toLocaleDateString()
}
