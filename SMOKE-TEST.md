# The Swingset — Smoke-Test Checklist

Run against the emulator suite (`npm run emulators` + `VITE_USE_EMULATORS=true`)
or a staging Firebase project. Use at least **3 accounts** (A, B = a couple;
C = a single) in separate browser profiles.

## Gate & auth
- [ ] Fresh incognito visit shows the 18+ interstitial before anything else; "Leave" exits the site
- [ ] Signup with an under-18 DOB is rejected client-side
- [ ] Forged under-18 write is rejected by rules (attempt via console → permission denied)
- [ ] Email/password signup → lands on feed; DOB is stored and immutable (edit attempt fails)
- [ ] Google sign-in (first time) → forced to /welcome; no access until 18+ DOB submitted
- [ ] Signed-out visit to any deep link redirects to /login

## Profiles & couple linking
- [ ] Edit profile: name, bio, location, interests, visibility all persist
- [ ] Profile photo upload works; downloaded copy has **no EXIF/GPS** (check with exiftool)
- [ ] A creates a couple → gets invite code; B joins with code → both see the linked couple
- [ ] A third account cannot join with a spent/false code
- [ ] C (not connected) cannot view a profile set to "connections"; a connection can
- [ ] Unlink flow removes B; couple survives with A; B's coupleId cleared

## Feed
- [ ] Post text-only, and with 1 and 4 images (5th image is refused)
- [ ] Feed shows members-visible posts newest-first; infinite scroll loads more
- [ ] Like → count bumps (optimistic, then function-confirmed); unlike reverses
- [ ] Comment → appears; count bumps; post author can delete any comment
- [ ] Share → repost with attribution appears; original shareCount bumps
- [ ] Report post → doc appears in `reports` collection with status open
- [ ] Block author → their posts and comments vanish from feed/post views; unblock restores

## Events
- [ ] Create event (as user and as couple) with future date; past date refused
- [ ] Exact location hidden until RSVP "going"; visible to host always
- [ ] RSVP going/interested/declined; counters update; capacity blocks going when full
- [ ] My calendar groups upcoming RSVPs by month
- [ ] Event chat: only host + RSVP'd members can send; others see prompt
- [ ] Host can delete event; non-host sees Report instead

## Discover & connections
- [ ] Discover lists other couples (never your own); looking-for filter works
- [ ] Connect request A→C; C sees it under Requests; accept → both show Connected
- [ ] Decline removes the request; re-request possible
- [ ] Disconnect removes the connection both ways

## Albums
- [ ] Create albums at each access level; upload photos (EXIF stripped)
- [ ] "All members" album photos visible to strangers
- [ ] "Connections only" album locked for strangers, open for connections
- [ ] "Request to view": stranger requests → owner approves → photos visible; revoke → locked again
- [ ] Non-owner cannot upload or delete photos (console attempt → denied)

## Notifications
- [ ] Like/comment/connection request/accept/RSVP each produce a notification for the right person, never the actor
- [ ] Bell shows unread dot; opening the page marks all read

## Safety & account
- [ ] Report flows exist on posts, comments, user profiles, couple profiles, events
- [ ] Blocked list shows on Connections page with working unblock
- [ ] Account deletion: blocked while couple-linked; after unlink, wipes user doc, storage files (verify in emulator UI), notifications, and auth user

## Boundaries & prompts
- [ ] Boundaries card: set/clear each field on user and couple profiles; renders on profile views; every field filters Discover
- [ ] Icebreaker prompts: add up to 3 with answers; another member reacts (emoji + line) → owner gets notification and sees it in /reactions
- [ ] Message policy setting persists (enforcement lands with DMs)

## Verification
- [ ] Submit selfie + code (user and couple); appears in /admin/verifications for an admin (create `admins/{uid}` doc in console to test)
- [ ] Non-admin cannot open the queue or read verification images (Storage denies)
- [ ] Approve → badge appears on profile, Discover card, attendee list; "Verified only" filter works
- [ ] Verification selfie is never visible anywhere in the member-facing UI

## Discretion mode
- [ ] Quick-hide button and Ctrl+Shift+H swap instantly to the Notes decoy; browser tab title becomes "Notes"
- [ ] Triple-tap "Notes" returns (PIN prompt when set)
- [ ] PIN lock on open: backgrounding the tab re-locks
- [ ] Discreet notifications: all notification text renders as "New activity"
- [ ] Installed PWA shows as "Pina" with the abstract icon

## Dual consent
- [ ] Couple enables dual consent → partner A accepts a request → status stays pending, partner B notified → B accepts → connected
- [ ] Same flow for request-only album grants
- [ ] Rules reject a single-partner accept when dual consent is on (console attempt)

## Host power tools
- [ ] Approval-required event: "Request to join" → host approves from Host tools → attendee notified
- [ ] Capacity event fills → next RSVP lands on waitlist → a confirmed guest cancels → earliest waitlisted member auto-promotes + notified
- [ ] Recurring event rolls to the next occurrence (run the scheduled function in emulator)
- [ ] After the event ends, attendees see the "stay in touch" connect list

## Community
- [ ] Create group (creator = mod), join/leave, post, mod deletes post and removes member; non-members can't read the feed
- [ ] Reference: connected member leaves one; subject can remove; non-connected member is rejected by rules
- [ ] Travel plan appears in Discover ("traveling to your area" when city matches your location)

## Direct messages
- [ ] Message button on a profile whose policy is "everyone" opens a thread; send/receive works live in two browsers
- [ ] Policy gates: "connections only" profile shows disabled button to strangers (and rules reject a forged thread via console); connected member can message
- [ ] "Couples only" policy rejects a single sender; "verified only" rejects unverified
- [ ] Messaging a linked member opens a thread with their COUPLE (both partners see it and can reply)
- [ ] Couple recipients gate on the couple doc's messagePolicy, not the partners' personal settings
- [ ] Unread dot on the Messages tab; opening the thread clears it
- [ ] Block after a thread exists: further messages from the blocked side are rejected
- [ ] New message produces a notification for the other side, never the sender (requires deployed functions)

## Image moderation (staging project only — Vision is unavailable in the emulator)
- [ ] Explicit image as profile photo → file deleted, `reports` doc created, uploader notified
- [ ] Same image in a request-to-view album → stays up, no report
- [ ] Violent image in an album → deleted + reported
- [ ] Normal photo (faces, landscape) on any surface → untouched, no report

## PWA & privacy
- [ ] Lighthouse: installable PWA; app opens standalone from home screen
- [ ] Every response carries `X-Robots-Tag: noindex` (check network tab on hosting)
- [ ] `robots` meta present; no Firebase keys committed (`git grep AIza` is clean)
