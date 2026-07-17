import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../auth/AuthContext'
import { isAdminUser } from '../verification/api'
import { VerificationQueue } from '../verification/AdminVerificationsPage'
import { createInvite, listInvites, setInviteActive } from '../auth/invites'
import {
  fetchAllUsers,
  fetchReports,
  reportTargetLink,
  setUserBanned,
  setUserVerified,
  updateReportStatus,
} from './api'
import { Avatar } from '../../components/Avatar'
import { timeAgo } from '../../lib/time'

const TABS = ['Members', 'Reports', 'Verifications', 'Invites']

export function AdminPage() {
  const { user } = useAuth()
  const [tab, setTab] = useState('Members')

  const { data: isAdmin, isPending } = useQuery({
    queryKey: ['isAdmin', user.uid],
    queryFn: () => isAdminUser(user.uid),
  })

  if (isPending) {
    return <p className="px-4 pt-16 text-center text-sm text-charcoal-400">Loading…</p>
  }
  if (!isAdmin) {
    return (
      <p className="px-4 pt-16 text-center text-sm text-charcoal-400">
        This page is for moderators.
      </p>
    )
  }

  return (
    <div className="px-4 pt-6 pb-10">
      <h1 className="mb-4 text-xl font-semibold text-charcoal-50">Admin</h1>

      <div className="mb-5 grid grid-cols-4 gap-2 rounded-2xl bg-charcoal-900 p-1 ring-1 ring-charcoal-700">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`h-10 rounded-xl text-sm font-medium transition ${
              tab === t ? 'bg-gold-500 text-charcoal-950' : 'text-charcoal-300 hover:text-charcoal-100'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'Members' && <MembersTab />}
      {tab === 'Reports' && <ReportsTab />}
      {tab === 'Verifications' && <VerificationQueue />}
      {tab === 'Invites' && <InvitesTab />}
    </div>
  )
}

// ---------- invites ----------

function InvitesTab() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [note, setNote] = useState('')
  const [maxUses, setMaxUses] = useState('')
  const [copied, setCopied] = useState('')

  const { data: invites = [], isPending } = useQuery({
    queryKey: ['invites'],
    queryFn: listInvites,
  })

  const create = useMutation({
    mutationFn: () => createInvite(user.uid, { note, maxUses: maxUses || null }),
    onSuccess: () => {
      setNote('')
      setMaxUses('')
      queryClient.invalidateQueries({ queryKey: ['invites'] })
    },
  })

  const toggle = useMutation({
    mutationFn: ({ code, active }) => setInviteActive(code, active),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['invites'] }),
  })

  const copy = (code) => {
    navigator.clipboard?.writeText(code).then(() => {
      setCopied(code)
      setTimeout(() => setCopied(''), 1500)
    })
  }

  return (
    <div>
      <div className="rounded-2xl bg-charcoal-900 p-4 ring-1 ring-charcoal-800">
        <p className="text-sm font-semibold text-charcoal-100">Create an invite code</p>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Note (e.g. “for Sarah”)"
            maxLength={80}
            className="h-11 flex-1 rounded-2xl border border-charcoal-600 bg-charcoal-800 px-4 text-sm text-charcoal-50 placeholder-charcoal-400 outline-none focus:border-gold-500"
          />
          <input
            value={maxUses}
            onChange={(e) => setMaxUses(e.target.value.replace(/[^0-9]/g, ''))}
            placeholder="Max uses (blank = ∞)"
            inputMode="numeric"
            className="h-11 rounded-2xl border border-charcoal-600 bg-charcoal-800 px-4 text-sm text-charcoal-50 placeholder-charcoal-400 outline-none focus:border-gold-500 sm:w-40"
          />
          <button
            onClick={() => create.mutate()}
            disabled={create.isPending}
            className="h-11 rounded-2xl bg-gold-500 px-5 text-sm font-semibold text-charcoal-950 hover:bg-gold-400 disabled:opacity-50"
          >
            {create.isPending ? 'Creating…' : 'Generate'}
          </button>
        </div>
      </div>

      {isPending && <p className="py-8 text-center text-sm text-charcoal-500">Loading codes…</p>}

      <div className="mt-4 flex flex-col gap-2">
        {invites.map((inv) => {
          const usedUp = inv.maxUses != null && (inv.useCount ?? 0) >= inv.maxUses
          return (
            <div
              key={inv.code}
              className={`flex items-center gap-3 rounded-2xl bg-charcoal-900 p-3.5 ring-1 ${
                inv.active && !usedUp ? 'ring-charcoal-800' : 'ring-charcoal-800 opacity-60'
              }`}
            >
              <button
                onClick={() => copy(inv.code)}
                className="rounded-lg bg-charcoal-800 px-3 py-1.5 font-mono text-sm font-semibold tracking-wider text-gold-400 ring-1 ring-charcoal-600 hover:bg-charcoal-700"
                title="Copy code"
              >
                {copied === inv.code ? 'Copied!' : inv.code}
              </button>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-charcoal-200">{inv.note || <span className="text-charcoal-500">No note</span>}</p>
                <p className="text-xs text-charcoal-400">
                  {inv.useCount ?? 0}
                  {inv.maxUses != null ? ` / ${inv.maxUses}` : ''} used
                  {' · '}
                  {usedUp ? 'used up' : inv.active ? 'active' : 'disabled'}
                </p>
              </div>
              <button
                onClick={() => toggle.mutate({ code: inv.code, active: !inv.active })}
                disabled={toggle.isPending}
                className="h-8 rounded-lg bg-charcoal-800 px-3 text-xs font-semibold text-charcoal-200 ring-1 ring-charcoal-600 hover:bg-charcoal-700 disabled:opacity-50"
              >
                {inv.active ? 'Disable' : 'Enable'}
              </button>
            </div>
          )
        })}
        {!isPending && invites.length === 0 && (
          <p className="py-8 text-center text-sm text-charcoal-500">
            No invite codes yet — generate one above.
          </p>
        )}
      </div>
    </div>
  )
}

// ---------- members ----------

function MembersTab() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [notice, setNotice] = useState('')

  const { data: users = [], isPending } = useQuery({
    queryKey: ['adminUsers'],
    queryFn: fetchAllUsers,
  })

  const ban = useMutation({
    mutationFn: ({ uid, banned }) => setUserBanned(uid, banned),
    onSuccess: (result, { banned }) => {
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] })
      setNotice(
        result.authDisabled
          ? banned
            ? 'Account disabled — they can no longer sign in.'
            : 'Account re-enabled.'
          : 'Profile flagged, but the sign-in block needs Cloud Functions deployed (Blaze).',
      )
    },
  })

  const unverify = useMutation({
    mutationFn: (uid) => setUserVerified(uid, false),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['adminUsers'] }),
  })

  const needle = search.trim().toLowerCase()
  const visible = users.filter(
    (u) =>
      !needle ||
      u.displayName?.toLowerCase().includes(needle) ||
      u.location?.toLowerCase().includes(needle) ||
      u.id.toLowerCase().includes(needle),
  )

  return (
    <div>
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search name, city, or uid…"
        className="mb-3 h-11 w-full rounded-2xl border border-charcoal-600 bg-charcoal-800 px-4 text-sm text-charcoal-50 placeholder-charcoal-400 outline-none focus:border-gold-500"
      />
      {notice && <p className="mb-3 text-sm text-gold-400">{notice}</p>}
      {isPending && <p className="py-8 text-center text-sm text-charcoal-500">Loading members…</p>}

      <div className="flex flex-col gap-2">
        {visible.map((u) => (
          <div
            key={u.id}
            className={`rounded-2xl bg-charcoal-900 p-3.5 ring-1 ${
              u.banned ? 'ring-red-900' : 'ring-charcoal-800'
            }`}
          >
            <div className="flex items-center gap-3">
              <Link to={`/u/${u.id}`}>
                <Avatar src={u.photoURL} name={u.displayName} className="h-10 w-10 text-base" />
              </Link>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-charcoal-50">
                  {u.displayName}
                  {u.verified && <span className="ml-1 text-gold-400">✓</span>}
                  {u.banned && (
                    <span className="ml-1.5 rounded-full bg-red-950 px-2 py-0.5 text-[10px] font-semibold text-red-400">
                      BANNED
                    </span>
                  )}
                </p>
                <p className="truncate text-xs text-charcoal-400">
                  {u.location ?? 'No location'} · joined {timeAgo(u.createdAt)} ·{' '}
                  <span className="font-mono">{u.id.slice(0, 8)}…</span>
                </p>
              </div>
              {u.verified && (
                <button
                  onClick={() => unverify.mutate(u.id)}
                  className="h-8 rounded-lg bg-charcoal-800 px-2.5 text-xs text-charcoal-300 ring-1 ring-charcoal-600 hover:bg-charcoal-700"
                >
                  Un-verify
                </button>
              )}
              <button
                onClick={() => {
                  const verb = u.banned ? 'Unban' : 'Ban'
                  if (window.confirm(`${verb} ${u.displayName}?`)) {
                    ban.mutate({ uid: u.id, banned: !u.banned })
                  }
                }}
                disabled={ban.isPending}
                className={`h-8 rounded-lg px-3 text-xs font-semibold disabled:opacity-50 ${
                  u.banned
                    ? 'bg-charcoal-800 text-charcoal-200 ring-1 ring-charcoal-600'
                    : 'bg-red-500 text-white hover:bg-red-400'
                }`}
              >
                {u.banned ? 'Unban' : 'Ban'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ---------- reports ----------

function ReportsTab() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const { data: reports = [], isPending } = useQuery({
    queryKey: ['adminReports'],
    queryFn: () => fetchReports('open'),
  })

  const act = useMutation({
    mutationFn: ({ id, status }) => updateReportStatus(id, status, user.uid),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['adminReports'] }),
  })

  if (isPending) {
    return <p className="py-8 text-center text-sm text-charcoal-500">Loading reports…</p>
  }
  if (reports.length === 0) {
    return <p className="py-10 text-center text-sm text-charcoal-400">No open reports. 🎉</p>
  }

  return (
    <div className="flex flex-col gap-3">
      {reports.map((r) => {
        const link = reportTargetLink(r)
        return (
          <div key={r.id} className="rounded-2xl bg-charcoal-900 p-4 ring-1 ring-charcoal-800">
            <div className="flex items-baseline justify-between gap-3">
              <p className="text-sm font-semibold text-charcoal-50">
                {r.targetType} · <span className="text-red-400">{r.reason}</span>
              </p>
              <span className="shrink-0 text-xs text-charcoal-500">{timeAgo(r.createdAt)}</span>
            </div>
            <p className="mt-1 text-xs text-charcoal-400">
              Target: <span className="font-mono">{r.targetId}</span>
            </p>
            {r.details && (
              <p className="mt-1.5 whitespace-pre-wrap text-sm text-charcoal-200">{r.details}</p>
            )}
            <div className="mt-3 flex items-center gap-3">
              {link && (
                <Link
                  to={link}
                  className="h-9 rounded-xl bg-charcoal-800 px-3.5 text-sm leading-9 text-charcoal-200 ring-1 ring-charcoal-600 hover:bg-charcoal-700"
                >
                  View target
                </Link>
              )}
              <button
                onClick={() => act.mutate({ id: r.id, status: 'resolved' })}
                disabled={act.isPending}
                className="h-9 rounded-xl bg-gold-500 px-3.5 text-sm font-semibold text-charcoal-950 hover:bg-gold-400 disabled:opacity-50"
              >
                Resolved
              </button>
              <button
                onClick={() => act.mutate({ id: r.id, status: 'dismissed' })}
                disabled={act.isPending}
                className="h-9 rounded-xl bg-charcoal-800 px-3.5 text-sm text-charcoal-300 ring-1 ring-charcoal-600 hover:bg-charcoal-700 disabled:opacity-50"
              >
                Dismiss
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
