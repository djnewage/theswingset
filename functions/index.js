const { onDocumentCreated, onDocumentDeleted } = require('firebase-functions/v2/firestore')
const { onObjectFinalized } = require('firebase-functions/v2/storage')
const { logger } = require('firebase-functions')
const admin = require('firebase-admin')

admin.initializeApp()
const db = admin.firestore()
const { FieldValue } = admin.firestore

// ---------- notification fan-out ----------

/** Writes a notification item for each recipient uid (skipping the actor). */
async function notify(recipientUids, actorUid, item) {
  const recipients = [...new Set(recipientUids)].filter((uid) => uid && uid !== actorUid)
  await Promise.all(
    recipients.map((uid) =>
      db.collection(`notifications/${uid}/items`).add({
        ...item,
        read: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      }),
    ),
  )
}

// ---------- denormalized counters ----------

exports.onLikeCreated = onDocumentCreated('posts/{postId}/likes/{uid}', async (event) => {
  await db.doc(`posts/${event.params.postId}`).update({ likeCount: FieldValue.increment(1) })
  const post = (await db.doc(`posts/${event.params.postId}`).get()).data()
  if (!post) return
  const liker = (await db.doc(`users/${event.params.uid}`).get()).data()
  await notify(post.authorUids, event.params.uid, {
    type: 'like',
    text: `${liker?.displayName ?? 'Someone'} liked your post`,
    link: `/post/${event.params.postId}`,
  })
})

exports.onLikeDeleted = onDocumentDeleted('posts/{postId}/likes/{uid}', (event) =>
  db.doc(`posts/${event.params.postId}`).update({ likeCount: FieldValue.increment(-1) }),
)

exports.onCommentCreated = onDocumentCreated('posts/{postId}/comments/{commentId}', async (event) => {
  await db.doc(`posts/${event.params.postId}`).update({ commentCount: FieldValue.increment(1) })
  const post = (await db.doc(`posts/${event.params.postId}`).get()).data()
  const comment = event.data?.data()
  if (!post || !comment) return
  await notify(post.authorUids, comment.authorId, {
    type: 'comment',
    text: `${comment.authorName} commented on your post`,
    link: `/post/${event.params.postId}`,
  })
})

exports.onCommentDeleted = onDocumentDeleted('posts/{postId}/comments/{commentId}', (event) =>
  db.doc(`posts/${event.params.postId}`).update({ commentCount: FieldValue.increment(-1) }),
)

// Reposts: bump shareCount on the original.
exports.onPostCreated = onDocumentCreated('posts/{postId}', async (event) => {
  const sharedFrom = event.data?.data()?.sharedFrom
  if (!sharedFrom?.postId) return
  await db
    .doc(`posts/${sharedFrom.postId}`)
    .update({ shareCount: FieldValue.increment(1) })
    .catch((err) => logger.warn('shareCount bump failed (original deleted?)', err))
})

// ---------- connection notifications ----------

const { onDocumentWritten } = require('firebase-functions/v2/firestore')

exports.onConnectionWritten = onDocumentWritten('connections/{connId}', async (event) => {
  const before = event.data?.before?.data()
  const after = event.data?.after?.data()
  if (!after) return

  if (!before && after.status === 'pending') {
    await notify(after.toUids, after.fromUids[0], {
      type: 'connection_request',
      text: `${after.fromName} wants to connect`,
      link: '/connections',
    })
  } else if (before?.status === 'pending' && after.status === 'accepted') {
    await notify(after.fromUids, after.toUids[0], {
      type: 'connection_accepted',
      text: `${after.toName} accepted your connection`,
      link: '/connections',
    })
  } else if (before?.status === 'pending' && after.status === 'pending') {
    // Dual consent: one partner approved — nudge the other.
    const beforeApprovals = Object.keys(before.approvals ?? {})
    const afterApprovals = Object.keys(after.approvals ?? {})
    const newApprover = afterApprovals.find((uid) => !beforeApprovals.includes(uid))
    if (newApprover) {
      await notify(after.toUids, newApprover, {
        type: 'approval_needed',
        text: `Your partner approved connecting with ${after.fromName} — your approval is needed`,
        link: '/connections',
      })
    }
  }
})

// ---------- album grant notifications ----------

exports.onGrantWritten = onDocumentWritten('albums/{albumId}/grants/{granteeUid}', async (event) => {
  const before = event.data?.before?.data()
  const after = event.data?.after?.data()
  if (!after) return
  const album = (await db.doc(`albums/${event.params.albumId}`).get()).data()
  if (!album) return

  if (before?.status !== 'granted' && after.status === 'granted') {
    await notify([after.uid], null, {
      type: 'album_granted',
      text: `${album.ownerName} granted you access to “${album.title}”`,
      link: `/albums/${event.params.albumId}`,
    })
  } else if (!before && after.status === 'requested') {
    await notify(album.ownerUids, after.uid, {
      type: 'album_request',
      text: `${after.name} requested access to “${album.title}”`,
      link: `/albums/${event.params.albumId}`,
    })
  } else if (before?.status === 'requested' && after.status === 'requested') {
    const newApprover = Object.keys(after.approvals ?? {}).find(
      (uid) => !(before.approvals ?? {})[uid],
    )
    if (newApprover) {
      await notify(album.ownerUids, newApprover, {
        type: 'approval_needed',
        text: `Your partner approved album access for ${after.name} — your approval is needed`,
        link: `/albums/${event.params.albumId}`,
      })
    }
  }
})

// ---------- RSVP counters + host notifications ----------

exports.onRsvpWritten = onDocumentWritten('events/{eventId}/rsvps/{attendeeId}', async (event) => {
  const before = event.data?.before?.data()?.status
  const after = event.data?.after?.data()?.status
  if (before === after) return

  const delta = { going: 0, interested: 0 }
  if (before === 'going') delta.going -= 1
  if (before === 'interested') delta.interested -= 1
  if (after === 'going') delta.going += 1
  if (after === 'interested') delta.interested += 1
  if (!delta.going && !delta.interested) return

  await db
    .doc(`events/${event.params.eventId}`)
    .update({
      goingCount: FieldValue.increment(delta.going),
      interestedCount: FieldValue.increment(delta.interested),
    })
    .catch((err) => logger.warn('rsvp counter update failed (event deleted?)', err))

  const eventRef = db.doc(`events/${event.params.eventId}`)
  const eventDoc = (await eventRef.get()).data()
  const rsvp = event.data?.after?.data() ?? event.data?.before?.data()
  if (!eventDoc || !rsvp) return

  // Tell the host about new positive RSVPs and join requests.
  if ((after === 'going' || after === 'interested' || after === 'requested') && before !== 'going') {
    const verb =
      after === 'going' ? 'is going to'
      : after === 'interested' ? 'is interested in'
      : 'requested to join'
    await notify(eventDoc.hostUids, rsvp.attendeeId, {
      type: 'rsvp',
      text: `${rsvp.attendeeName} ${verb} ${eventDoc.title}`,
      link: `/events/${event.params.eventId}`,
    })
  }

  // Tell the attendee when the host confirms them.
  if (after === 'going' && (before === 'requested' || before === 'waitlist')) {
    await notify([rsvp.attendeeId], null, {
      type: 'rsvp_confirmed',
      text: `You're in! ${eventDoc.title} confirmed your spot`,
      link: `/events/${event.params.eventId}`,
    })
  }

  // Waitlist auto-promote: a confirmed spot was freed on a capped event.
  if (before === 'going' && after !== 'going' && eventDoc.capacity) {
    const goingNow = (eventDoc.goingCount ?? 0) + delta.going
    if (goingNow < eventDoc.capacity) {
      const next = await eventRef
        .collection('rsvps')
        .where('status', '==', 'waitlist')
        .orderBy('updatedAt', 'asc')
        .limit(1)
        .get()
      if (!next.empty) {
        await next.docs[0].ref.update({
          status: 'going',
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        })
        // The promoted attendee gets notified via the rsvp_confirmed branch
        // when this trigger fires again for their doc.
      }
    }
  }
})

// ---------- recurring events: clone the next occurrence daily ----------

const { onSchedule } = require('firebase-functions/v2/scheduler')

const RECURRENCE_DAYS = { weekly: 7, biweekly: 14, monthly: 30 }

exports.rollRecurringEvents = onSchedule('every day 06:00', async () => {
  const now = admin.firestore.Timestamp.now()
  const dayAgo = admin.firestore.Timestamp.fromMillis(now.toMillis() - 86400_000)

  const ended = await db
    .collection('events')
    .where('startsAt', '>=', dayAgo)
    .where('startsAt', '<', now)
    .get()

  for (const docSnap of ended.docs) {
    const data = docSnap.data()
    const days = RECURRENCE_DAYS[data.recurrence]
    if (!days) continue

    const nextStart = admin.firestore.Timestamp.fromMillis(
      data.startsAt.toMillis() + days * 86400_000,
    )
    // Skip if this occurrence was already rolled forward.
    const dupe = await db
      .collection('events')
      .where('hostId', '==', data.hostId)
      .where('startsAt', '==', nextStart)
      .limit(1)
      .get()
    if (!dupe.empty) continue

    await db.collection('events').add({
      ...data,
      startsAt: nextStart,
      endsAt: data.endsAt
        ? admin.firestore.Timestamp.fromMillis(data.endsAt.toMillis() + days * 86400_000)
        : null,
      goingCount: 0,
      interestedCount: 0,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    })
    logger.info(`rolled recurring event ${docSnap.id} → ${nextStart.toDate().toISOString()}`)
  }
})

// ---------- group member counter ----------

exports.onGroupMemberCreated = onDocumentCreated('groups/{groupId}/members/{uid}', (event) =>
  db.doc(`groups/${event.params.groupId}`).update({ memberCount: FieldValue.increment(1) }),
)

exports.onGroupMemberDeleted = onDocumentDeleted('groups/{groupId}/members/{uid}', (event) =>
  db
    .doc(`groups/${event.params.groupId}`)
    .update({ memberCount: FieldValue.increment(-1) })
    .catch(() => {}),
)

// ---------- icebreaker reaction notifications ----------

exports.onPromptReaction = onDocumentCreated('promptReactions/{reactionId}', async (event) => {
  const reaction = event.data?.data()
  if (!reaction) return
  await notify(reaction.toUids, reaction.fromId, {
    type: 'prompt_reaction',
    text: `${reaction.fromName} reacted ${reaction.emoji} to your icebreaker`,
    link: '/reactions',
  })
})

// ---------- admin: ban/unban (disable the auth account) ----------

const { onCall, HttpsError } = require('firebase-functions/v2/https')

exports.adminSetUserDisabled = onCall(async (request) => {
  const caller = request.auth?.uid
  if (!caller) throw new HttpsError('unauthenticated', 'Sign in required.')
  const callerIsAdmin = (await db.doc(`admins/${caller}`).get()).exists
  if (!callerIsAdmin) throw new HttpsError('permission-denied', 'Admins only.')

  const { uid, disabled } = request.data ?? {}
  if (typeof uid !== 'string' || typeof disabled !== 'boolean') {
    throw new HttpsError('invalid-argument', 'Expected { uid: string, disabled: boolean }.')
  }
  if (uid === caller) throw new HttpsError('failed-precondition', 'You can’t ban yourself.')

  await admin.auth().updateUser(uid, { disabled })
  if (disabled) await admin.auth().revokeRefreshTokens(uid)
  await db.doc(`users/${uid}`).update({ banned: disabled }).catch(() => {})
  logger.info(`admin ${caller} set disabled=${disabled} for ${uid}`)
  return { ok: true }
})

// ---------- direct message notifications ----------

exports.onMessageCreated = onDocumentCreated('threads/{threadId}/messages/{messageId}', async (event) => {
  const message = event.data?.data()
  if (!message) return
  const thread = (await db.doc(`threads/${event.params.threadId}`).get()).data()
  if (!thread) return

  const recipients = thread.memberUids.filter(
    (uid) => !thread.entities[message.senderEntityId]?.uids?.includes(uid),
  )
  await notify(recipients, message.senderUid, {
    type: 'message',
    text: `${message.senderName} sent you a message`,
    link: `/messages/${event.params.threadId}`,
  })
})

// ---------- account deletion: full data wipe ----------

exports.onUserDeleted = onDocumentDeleted('users/{uid}', async (event) => {
  const uid = event.params.uid
  const bucket = admin.storage().bucket()

  // Wipe every file the member uploaded (profile, posts, events, albums).
  await Promise.all(
    [`users/${uid}/`, `posts/${uid}/`, `events/${uid}/`, `albums/${uid}/`].map((prefix) =>
      bucket.deleteFiles({ prefix }).catch((err) => logger.warn(`wipe ${prefix} failed`, err)),
    ),
  )

  // Wipe their notification inbox.
  await db.recursiveDelete(db.collection(`notifications/${uid}/items`)).catch(() => {})

  logger.info(`account data wiped for ${uid}`)
})

// ---------- image moderation (Cloud Vision SafeSearch) ----------

const vision = require('@google-cloud/vision')
const visionClient = new vision.ImageAnnotatorClient()

const LIKELY_PLUS = ['LIKELY', 'VERY_LIKELY']

// Albums sit behind access levels (members / connections / request-to-view),
// so adult content is permitted there. Verification selfies are admin-only.
// Everything else — profile photos, couple covers, post images, event
// covers — is visible to all members and must stay non-explicit.
// Violent content is disallowed everywhere.
function moderationPolicy(surface, safe) {
  const violence = LIKELY_PLUS.includes(safe.violence)
  if (surface === 'albums' || surface === 'verifications') {
    return { remove: violence, flag: false }
  }
  return {
    remove: violence || LIKELY_PLUS.includes(safe.adult),
    // Racy-but-not-adult on a member-wide surface: leave it up, let an admin decide.
    flag: safe.racy === 'VERY_LIKELY',
  }
}

exports.moderateImage = onObjectFinalized(async (event) => {
  const { bucket, name: path, contentType } = event.data
  if (!contentType?.startsWith('image/')) return

  let safe
  try {
    const [result] = await visionClient.safeSearchDetection(`gs://${bucket}/${path}`)
    safe = result.safeSearchAnnotation
  } catch (err) {
    // Vision unavailable (emulator, quota, API disabled): leave the image up
    // but surface the failure in logs — do NOT silently pass unmoderated.
    logger.error('safeSearch failed — image NOT moderated', { path, error: err.message })
    return
  }
  if (!safe) return

  const [surface, ownerId] = path.split('/')
  const { remove, flag } = moderationPolicy(surface, safe)
  if (!remove && !flag) return

  if (remove) {
    await admin
      .storage()
      .bucket(bucket)
      .file(path)
      .delete()
      .catch((err) => logger.error('moderation delete failed', { path, error: err.message }))
  }

  await db.collection('reports').add({
    reporterId: 'system:image-moderation',
    targetType: 'image',
    targetId: path,
    reason: remove ? 'image auto-removed' : 'image flagged for review',
    details:
      `SafeSearch — adult: ${safe.adult}, racy: ${safe.racy}, violence: ${safe.violence}` +
      (remove ? '. File deleted; check for an orphaned post/profile reference.' : ''),
    status: 'open',
    createdAt: FieldValue.serverTimestamp(),
  })

  // Tell the uploader why their photo vanished. Path owner is a uid on every
  // surface except couple covers, where it's a coupleId.
  if (remove) {
    let uids = [ownerId]
    if (surface === 'couples') {
      const couple = (await db.doc(`couples/${ownerId}`).get()).data()
      uids = couple?.partnerUids ?? []
    }
    await notify(uids, null, {
      type: 'moderation',
      text: 'One of your photos was removed for violating community guidelines',
      link: '/profile',
    }).catch(() => {})
  }

  logger.warn('moderation action', { path, removed: remove, flagged: flag, safe })
})
