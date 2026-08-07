# Quiz "Invite a Friend" API

Lets a user invite a friend to play — whether that friend is online right now, has an
account but is offline, or has never signed up at all. Replaces the old raw
`?invite={userId}` link with a persisted, trackable, tokenized one.

Base path: `/api/quiz/invite`
Auth: `Authorization: Bearer <jwt>` header (same JWT as the rest of the app) unless
marked **Public** below.

---

## The big picture

1. **Sender** calls `POST /invite/create` → gets back `inviteUrl`
   (`{CLIENT_URL}/quiz/invite/{token}`) to share via WhatsApp/SMS/email/copy-link.
2. **Recipient clicks the link.** Before they're logged in, call
   `GET /invite/resolve/:token` (public) to render a landing page: *"Jane invited you
   to play — Sign up or Log in"*.
3. **Recipient signs up or logs in** (normal `/auth/signup` or `/auth/login` flow —
   unchanged). As soon as you have a JWT for them — **no matter which auth method was
   used** (signup, login, or Google OAuth) — call `POST /invite/claim` with the token.
4. **The claim response tells you what happened:**
   - `matched: true` → they've been instantly placed into a live match with the
     inviter. The response includes the full match payload (questions, opponent) —
     route straight into gameplay, no extra "accept challenge" step needed.
   - `matched: false` → no live match yet (inviter was offline, or the invitee hasn't
     completed quiz onboarding yet, etc.) — the inviter has been notified and will
     challenge them once both are ready. Just drop the invitee into the normal quiz
     lobby.

A convenience: `quizInviteToken` in the signup/login request body is also
auto-claimed server-side as a non-blocking fallback. **Don't rely on this alone** —
it doesn't cover OAuth, and errors there are swallowed silently. Always call
`POST /invite/claim` explicitly once you have a session.

---

## Endpoints

### `POST /invite/create`

Create a trackable invite link. If `wagerAmount` + `categoryId` are both given, a
successful claim can auto-start a real wagered match; if omitted, the invite is just
a "come join me" link and the inviter challenges the friend manually once they're in.

**Auth:** required

**Request body:**

```json
{
  "channel": "whatsapp",
  "toEmail": null,
  "toPhone": null,
  "wagerAmount": 50,
  "categoryId": "3f2e9c10-1234-4a5b-9abc-1234567890ab",
  "expiresInDays": 30
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `channel` | string | no (default `"link"`) | `"email"` \| `"sms"` \| `"whatsapp"` \| `"link"` |
| `toEmail` | string | only if `channel: "email"` | |
| `toPhone` | string | only if `channel: "sms"` | E.164 preferred, e.g. `+2347012345678` |
| `wagerAmount` | number | no (default `0`) | Chuta. Soft-checked against balance now; re-checked for real at claim time. |
| `categoryId` | uuid | no | From `GET /api/quiz/categories`. Required for auto-match to be possible on claim. |
| `expiresInDays` | number | no (default `30`) | Clamped 1–90 |

**Response `201`:**

```json
{
  "success": true,
  "invite": {
    "id": "9e1a...uuid",
    "channel": "whatsapp",
    "wagerAmount": 50,
    "categoryId": "3f2e9c10-1234-4a5b-9abc-1234567890ab",
    "expiresAt": "2026-09-06T12:00:00.000Z"
  },
  "inviteUrl": "https://hallos.net/quiz/invite/AbCdEf123...",
  "whatsappUrl": "https://wa.me/?text=%F0%9F%8E%AE...",
  "smsUri": "sms:?body=..."
}
```

**Errors:** `400` — invalid channel/missing contact for that channel, invalid
`categoryId`, insufficient balance for the wager, or too many active invites
(cap: 25). `401` — not authenticated.

---

### `GET /invite/resolve/:token`

**Public — no auth.** Call this when the link is opened, before the user has logged
in, to render the landing page.

**Response `200`:**

```json
{
  "success": true,
  "found": true,
  "valid": true,
  "expired": false,
  "revoked": false,
  "channel": "whatsapp",
  "wagerAmount": 50,
  "categoryId": "3f2e9c10-1234-4a5b-9abc-1234567890ab",
  "categoryName": "General Knowledge",
  "recipientHasAccount": null,
  "inviter": {
    "userId": 42,
    "nickname": "QuizKing",
    "avatarUrl": "https://api.dicebear.com/9.x/avataaars/svg?seed=QuizKing",
    "online": true
  }
}
```

- `recipientHasAccount`: `true`/`false` only if the invite was created with a
  specific `toEmail`; otherwise `null` (link/WhatsApp/SMS shares don't know who's
  clicking). Use it to default the landing page to "Log in" vs "Sign up".
- `inviter.online`: whether the inviter is connected right now — useful for copy
  like *"Jane's online now — join instantly!"*.
- If `valid: false` (expired/revoked), still let the user sign up/log in normally —
  just don't show "you'll be matched instantly" messaging.

**Response `404`:** `{ "success": false, "message": "Invite not found" }` — token
doesn't exist (typo'd/tampered link). Treat as a dead link, not a hard error.

---

### `POST /invite/claim`

Call once the invitee has a JWT, regardless of how they got it.

**Auth:** required

**Request body:**

```json
{ "token": "AbCdEf123..." }
```

**Response `200` — matched instantly:**

```json
{
  "success": true,
  "outcome": "matched",
  "matched": true,
  "matchId": "7c1b...uuid",
  "inviterUserId": 42,
  "matchPayload": {
    "success": true,
    "matchId": "7c1b...uuid",
    "challengeId": "7c1b...uuid",
    "startTime": "2026-08-07T10:15:00.000Z",
    "questions": [
      { "id": "q1-uuid", "questionText": "...", "options": { "a": "...", "b": "...", "c": "...", "d": "..." }, "difficulty": "medium" }
    ],
    "challenger": { "userId": 42, "nickname": "QuizKing", "avatarUrl": "https://..." }
  }
}
```

→ Route directly into the game screen using `matchPayload`, same shape the game
screen already consumes from `acceptChallenge`.

**Response `200` — not matched yet (most common when inviter is offline):**

```json
{
  "success": true,
  "outcome": "pending_notify",
  "matched": false,
  "matchId": null,
  "inviterUserId": 42
}
```

→ Drop the user into the normal quiz lobby. The inviter has been emailed and will
get a live nudge next time they're online; they can challenge the friend manually
from the players list once both are around.

**Other `outcome` values** (all still `success: true`, `matched: false` — never treat
these as errors, just let the user into the app normally):

| `outcome` | Meaning |
|---|---|
| `self_blocked` | Someone clicked their own invite link. Silently ignored. |
| `expired` | Link is past its expiry window. |
| `revoked` | Inviter cancelled the invite. |

**Repeat calls are safe** — claiming the same token twice as the same user returns
`"alreadyClaimed": true` with the original `outcome`/`matchId`, and does **not**
create a second match or re-notify the inviter. Note: `matchPayload` is only
included on the *first* successful claim — on a replay, if `matched: true`, fetch
match details via `GET /api/quiz/lobby/match/:matchId` instead.

**Response `404`:** invite token not found.
**Response `401`:** not authenticated.

---

### `GET /invite/mine`

List invites the current user has sent (their own dashboard — "who have I invited,
did they join?"). Excludes the auto-managed "standing" share link used by the
passive lobby CTAs.

**Auth:** required
**Query:** `page` (default 1), `limit` (default 20)

**Response `200`:**

```json
{
  "success": true,
  "invites": [
    {
      "id": "9e1a...uuid",
      "inviteUrl": "https://hallos.net/quiz/invite/AbCdEf123...",
      "channel": "whatsapp",
      "toEmail": null,
      "toPhone": null,
      "wagerAmount": 50,
      "categoryId": "3f2e9c10-...",
      "status": "active",
      "clicksCount": 3,
      "claimsCount": 1,
      "expiresAt": "2026-09-06T12:00:00.000Z",
      "createdAt": "2026-08-07T10:00:00.000Z"
    }
  ],
  "totalCount": 1,
  "page": 1,
  "totalPages": 1
}
```

---

### `POST /invite/:id/revoke`

Cancel an invite you created (`:id` is the `invite.id`, not the token).

**Auth:** required (must be the inviter)

**Response `200`:** `{ "success": true }`
**Errors:** `400` — not found / not yours / already inactive.

---

### Legacy endpoints (still work, now backed by the same tokenized system)

These predate the tokenized system and are kept for compatibility. Prefer
`/invite/create` for new work — it's a superset (tracked, revocable, optionally
wagered).

- `POST /invite/email` — body `{ "toEmail": "friend@example.com" }` → sends one email, returns `{ success, channel: "email", inviteUrl }`
- `POST /invite/sms` — body `{ "toPhone": "+2347012345678" }` → sends one SMS via Twilio, returns `{ success, channel: "sms", inviteUrl }`
- `GET /invite/share-links` — no body/query needed → returns `{ success, whatsappUrl, smsUri, inviteUrl }` built from the user's one reusable "standing" link (same link every time you call this — safe to poll)

Note: `inviterName` is no longer accepted as a request param on any endpoint — it's
always resolved server-side from the sender's own quiz nickname / account name, so
it can't be spoofed in emails/texts sent to real people.

---

## Socket events

### `quiz_invite_claimed` (server → inviter)

Fired at the inviter's socket when someone claims their invite, in two situations:
live (right at claim time, if the inviter is online) or as a catch-up flush the
next time the inviter connects if they were offline. Purely a "nice to know" toast —
don't gate any critical flow on it, since sockets can be missed; the durable channel
is the email the inviter also receives.

```json
{
  "inviteId": "9e1a...uuid",
  "friendName": "Amaka",
  "inviteeUserId": 108,
  "matched": false,
  "matchId": null
}
```

### `challenge_accepted` (server → inviter) — already exists, reused here

When a claim results in `matched: true`, the inviter's client also receives the
**existing** `challenge_accepted` event (same one fired by the normal accept-a-
challenge flow), with the full match/questions payload — this is the reliable way
for the inviter's side to jump into the match live. See existing lobby socket docs
if you have them; shape matches `matchPayload` above minus the `success` wrapper.

Don't rely on `challenge_received` for the invitee's side of an invite-triggered
match — by the time it fires, the invitee's socket usually isn't connected yet
(they just landed from signup). Use the HTTP `matchPayload` from `/invite/claim`
instead, which is guaranteed.

---

## Things to keep in mind

- **No extra "accept" step for invite-triggered matches.** Claiming an invite that
  results in `matched: true` has already gone through create *and* accept
  server-side — funds are escrowed for both sides and the match is `active`. Don't
  call `POST /lobby/challenge/:id/accept` again.
- **Rate limits apply**: `/invite/create` and `/invite/claim` are capped at 200
  req/min per user (100/min per IP for the public `resolve` endpoint). Normal usage
  won't come close.
- **Wager amount is optional.** An invite with no `wagerAmount`/`categoryId` is just
  a "come join me" link — it will never auto-match, only notify. Good default for a
  generic "invite friends" button; use `/invite/create` with both fields set for a
  "challenge a specific friend for X Chuta" flow.