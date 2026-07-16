export const MIN_AGE = 18

/** Age in whole years for a date-of-birth given as a "YYYY-MM-DD" string or Date. */
export function ageFromDob(dob) {
  const d = typeof dob === 'string' ? new Date(`${dob}T00:00:00`) : dob
  if (Number.isNaN(d?.getTime())) return null
  const now = new Date()
  let age = now.getFullYear() - d.getFullYear()
  const hadBirthday =
    now.getMonth() > d.getMonth() ||
    (now.getMonth() === d.getMonth() && now.getDate() >= d.getDate())
  if (!hadBirthday) age -= 1
  return age
}

export function isAdult(dob) {
  const age = ageFromDob(dob)
  return age !== null && age >= MIN_AGE
}
