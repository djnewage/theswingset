import {
  addDoc,
  collection,
  collectionGroup,
  deleteDoc,
  deleteField,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  startAfter,
  Timestamp,
  updateDoc,
  where,
} from 'firebase/firestore'
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage'
import { db, storage } from '../../lib/firebase'
import { processImageForUpload } from '../../lib/images'

export const EVENTS_PAGE_SIZE = 15

// ---------- events ----------

export async function createEvent(host, form) {
  let coverPhotoURL = null
  if (form.coverFile) {
    const blob = await processImageForUpload(form.coverFile, 2000)
    const storageRef = ref(storage, `events/${host.uids[0]}/${crypto.randomUUID()}.jpg`)
    await uploadBytes(storageRef, blob, { contentType: 'image/jpeg' })
    coverPhotoURL = await getDownloadURL(storageRef)
  }

  const eventRef = await addDoc(collection(db, 'events'), {
    hostType: host.type,
    hostId: host.id,
    hostUids: host.uids,
    hostName: host.name,
    title: form.title,
    description: form.description,
    // Exact address lives in the private/location subdoc (rules restrict it
    // to host + "going" guests); the public doc only says whether one exists.
    hasExactLocation: !!form.locationText,
    geoArea: form.geoArea, // city/region for browsing
    startsAt: Timestamp.fromDate(new Date(form.startsAt)),
    endsAt: form.endsAt ? Timestamp.fromDate(new Date(form.endsAt)) : null,
    capacity: form.capacity ? Number(form.capacity) : null,
    visibility: form.visibility,
    approvalRequired: !!form.approvalRequired,
    recurrence: form.recurrence ?? 'none', // none | weekly | biweekly | monthly
    coverPhotoURL,
    goingCount: 0,
    interestedCount: 0,
    createdAt: serverTimestamp(),
  })
  if (form.locationText) {
    await setDoc(doc(db, 'events', eventRef.id, 'private', 'location'), {
      locationText: form.locationText,
    })
  }
  return eventRef.id
}

/** Exact address — null when the viewer isn't host or a confirmed guest. */
export async function fetchEventLocation(eventId) {
  try {
    const snap = await getDoc(doc(db, 'events', eventId, 'private', 'location'))
    return snap.exists() ? snap.data().locationText : null
  } catch (err) {
    if (err.code === 'permission-denied') return null
    throw err
  }
}

/** Legacy events kept the address on the public doc — host's client moves it
 * into the gated subdoc the next time they open the event. */
export async function migrateEventLocation(eventId, locationText) {
  await setDoc(doc(db, 'events', eventId, 'private', 'location'), { locationText })
  await updateDoc(doc(db, 'events', eventId), {
    locationText: deleteField(),
    hasExactLocation: true,
  })
}

export async function updateEvent(eventId, patch) {
  await updateDoc(doc(db, 'events', eventId), patch)
}

export async function deleteEvent(eventId) {
  await deleteDoc(doc(db, 'events', eventId))
}

export async function fetchEvent(eventId) {
  const snap = await getDoc(doc(db, 'events', eventId))
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

export async function fetchUpcomingEvents(cursor) {
  const base = [
    where('visibility', '==', 'members'),
    where('startsAt', '>=', Timestamp.now()),
    orderBy('startsAt', 'asc'),
    limit(EVENTS_PAGE_SIZE),
  ]
  const q = cursor
    ? query(collection(db, 'events'), ...base.slice(0, 3), startAfter(cursor), base[3])
    : query(collection(db, 'events'), ...base)
  const snap = await getDocs(q)
  return {
    events: snap.docs.map((d) => ({ id: d.id, ...d.data() })),
    cursor: snap.docs.length === EVENTS_PAGE_SIZE ? snap.docs[snap.docs.length - 1] : null,
  }
}

// ---------- RSVPs ----------

/**
 * RSVP as the current user. Denormalizes name/photo for the attendee list and
 * event start time for the calendar view (collection-group query).
 */
export async function setRsvp(eventId, event, attendee, status) {
  await setDoc(doc(db, 'events', eventId, 'rsvps', attendee.uid), {
    attendeeId: attendee.uid,
    attendeeName: attendee.name,
    attendeePhotoURL: attendee.photoURL ?? null,
    attendeeVerified: attendee.verified ?? false,
    status, // 'going' | 'interested' | 'declined'
    eventId,
    eventTitle: event.title,
    eventStartsAt: event.startsAt,
    updatedAt: serverTimestamp(),
  })
}

export async function fetchMyRsvp(eventId, uid) {
  const snap = await getDoc(doc(db, 'events', eventId, 'rsvps', uid))
  return snap.exists() ? snap.data() : null
}

export async function fetchAttendees(eventId) {
  const snap = await getDocs(
    query(
      collection(db, 'events', eventId, 'rsvps'),
      where('status', 'in', ['going', 'interested']),
    ),
  )
  return snap.docs.map((d) => d.data())
}

/** Host-only view: every RSVP including requested and waitlisted. */
export async function fetchAllRsvps(eventId) {
  const snap = await getDocs(collection(db, 'events', eventId, 'rsvps'))
  return snap.docs.map((d) => d.data())
}

/** Host action: approve a request, promote from waitlist, or remove. */
export async function hostSetRsvpStatus(eventId, attendeeId, status) {
  await updateDoc(doc(db, 'events', eventId, 'rsvps', attendeeId), {
    status,
    updatedAt: serverTimestamp(),
  })
}

/**
 * What status a "count me in" tap should produce for this event/viewer:
 * approval-required events queue a request; full events go to the waitlist.
 */
export function goingStatusFor(event, goingCount) {
  if (event.approvalRequired) return 'requested'
  if (event.capacity && goingCount >= event.capacity) return 'waitlist'
  return 'going'
}

/** All of my upcoming RSVPs across events — powers the calendar. */
export async function fetchMyCalendar(uid) {
  const snap = await getDocs(
    query(
      collectionGroup(db, 'rsvps'),
      where('attendeeId', '==', uid),
      where('status', 'in', ['going', 'interested']),
      where('eventStartsAt', '>=', Timestamp.now()),
      orderBy('eventStartsAt', 'asc'),
    ),
  )
  return snap.docs.map((d) => d.data())
}

// ---------- event chat ----------

export async function sendEventMessage(eventId, { authorId, authorName, authorPhotoURL, text }) {
  await addDoc(collection(db, 'events', eventId, 'messages'), {
    authorId,
    authorName,
    authorPhotoURL: authorPhotoURL ?? null,
    text,
    createdAt: serverTimestamp(),
  })
}

export async function fetchEventMessages(eventId) {
  const snap = await getDocs(
    query(collection(db, 'events', eventId, 'messages'), orderBy('createdAt', 'asc'), limit(200)),
  )
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}
