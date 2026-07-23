/**
 * How a member's name is shown: their full name when they've chosen to share
 * one (first/last are optional profile fields), otherwise their display name.
 * Members control their own identifiability — never force real names.
 */
export function memberName(member) {
  if (!member) return ''
  const full = [member.firstName, member.lastName].filter(Boolean).join(' ').trim()
  return full || member.displayName || ''
}
