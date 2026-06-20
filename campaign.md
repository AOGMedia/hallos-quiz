PART 2 — QUIZ
How the quiz link works
The email contains a link:


https://www.hallos.net/campaign/quiz?token=<64-char-token>
When the user visits this page:


1. Read `token` from URL query params
2. Check if user is logged into hallos
   → NOT logged in: redirect to /signin?redirect=/campaign/quiz?token=<token>
   → After login, redirect back to /campaign/quiz?token=<token>
3. User is logged in → call GET /api/campaigns/quiz/:token/status
4. Render the correct screen based on status (see below)
If any quiz endpoint returns 401, redirect to login then back to the quiz URL.

Step 1 — Check Session Status

GET /api/campaigns/quiz/:token/status
Authorization: Bearer <jwt>
status	What to show
pending	"Ready to start" screen → show Start button
active	User already started — call /start to get questions back and resume
completed	Results screen (score already known)
expired	"Link expired" screen
200 — pending:


{
  "success": true,
  "status": "pending",
  "tokenExpiresAt": "2026-06-23T10:00:00.000Z"
}
200 — active (mid-quiz, browser refreshed):


{
  "success": true,
  "status": "active",
  "startedAt": "2026-06-20T10:00:00.000Z",
  "answersSubmitted": 7,
  "totalQuestions": 20,
  "secondsPerQuestion": 15
}
→ Call /start to get the full question list back and resume. The 15s timer per question runs from the original startedAt — time already elapsed counts. Show a warning: "You have a quiz in progress. Resuming..."

200 — completed:


{
  "success": true,
  "status": "completed",
  "score": 15,
  "totalCorrect": 15,
  "totalQuestions": 20,
  "totalTimeMs": 198340,
  "completedAt": "2026-06-20T10:05:00.000Z"
}
410 — expired:


{ "success": false, "expired": true, "message": "This quiz link has expired. Quiz links are valid for 72 hours." }
404 — invalid token:


{ "success": false, "message": "Quiz link is invalid or has already been used." }
Step 2 — Start the Quiz

GET /api/campaigns/quiz/:token/start
Authorization: Bearer <jwt>
Returns all 20 questions with shuffled options and question text. No correct answers included. Call this once to begin, or again if the user refreshes mid-quiz (idempotent for the same user).

200:


{
  "success": true,
  "sessionId": "uuid",
  "startedAt": "2026-06-20T10:00:00.000Z",
  "status": "active",
  "secondsPerQuestion": 15,
  "totalQuestions": 20,
  "maxDurationSeconds": 300,
  "questions": [
    {
      "questionIndex": 0,
      "questionId": "uuid-q1",
      "questionText": "Which of the following best describes inflation?",
      "shuffledOptions": {
        "a": "A rise in unemployment rates",
        "b": "A general increase in price levels",
        "c": "A reduction in government spending",
        "d": "An increase in foreign reserves",
        "e": "A drop in consumer confidence"
      }
    },
    {
      "questionIndex": 1,
      "questionId": "uuid-q2",
      "questionText": "Who is known as the father of the modern computer?",
      "shuffledOptions": {
        "a": "Nikola Tesla",
        "b": "Alan Turing",
        "c": "Thomas Edison",
        "d": "Bill Gates",
        "e": "Steve Jobs"
      }
    }
    // ... indices 0–19
  ]
}
409 — already completed:


{ "success": false, "alreadyCompleted": true, "message": "You have already completed this quiz." }
403 — token claimed by a different account:


{ "success": false, "message": "This quiz link has already been claimed by another account." }
Step 3 — Submit One Answer (call for each question)

POST /api/campaigns/quiz/:token/answer
Authorization: Bearer <jwt>
Content-Type: application/json
Body:


{
  "questionId": "uuid-q1",
  "questionIndex": 0,
  "selectedAnswer": "b",
  "clientTimestamp": 1718870408123
}
selectedAnswer: one of a, b, c, d, e
clientTimestamp: Date.now() in milliseconds at the moment the user taps the answer
Call this as soon as the user selects an answer — don't wait for the 15s to run out
If 15s elapses client-side with no answer, send selectedAnswer: "timeout" immediately
200:


{
  "success": true,
  "message": "Answer recorded.",
  "answersSubmitted": 1,
  "totalQuestions": 20,
  "timedOut": false
}
200 — timed out (server detected it was past the 15s window):


{
  "success": true,
  "message": "Time expired — question marked as unanswered.",
  "answersSubmitted": 1,
  "totalQuestions": 20,
  "timedOut": true
}
No correct/incorrect feedback is given per answer. Results are only revealed after the full quiz is submitted.

409 — already answered this question:


{ "success": false, "message": "Question 1 has already been answered." }
Step 4 — Submit the Quiz

POST /api/campaigns/quiz/:token/submit
Authorization: Bearer <jwt>
No body needed. Call this after the user answers all 20 questions, OR when the full 300 seconds are up. Any unanswered questions are auto-marked as wrong. Results email is sent automatically.

200:


{
  "success": true,
  "message": "Quiz submitted! Check your email for your results.",
  "score": 15,
  "totalCorrect": 15,
  "totalQuestions": 20,
  "totalTimeMs": 198340
}
Show: "Quiz submitted! Your results have been sent to your email."

PART 3 — ADMIN ENDPOINTS
All admin endpoints require auth + admin role.

Results Leaderboard

GET /api/campaigns/quiz/admin/results?status=completed&page=1&limit=50&search=ada@example.com
Authorization: Bearer <admin-jwt>
200:


{
  "success": true,
  "total": 1432,
  "page": 1,
  "limit": 50,
  "results": [
    {
      "rank": 1,
      "email": "ada@example.com",
      "firstName": "Ada",
      "lastName": "Okonkwo",
      "talent": "Music",
      "location": "Lagos",
      "status": "completed",
      "score": 20,
      "totalCorrect": 20,
      "totalTimeMs": 145230,
      "completedAt": "2026-06-20T10:05:00.000Z"
    }
  ]
}
Sorted: highest score first, then fastest time as tiebreaker. This is the shortlist source for Round 2.

Send Quiz Links (bulk)

POST /api/campaigns/quiz/admin/send-links
Authorization: Bearer <admin-jwt>
Sends quiz access emails to all paid registrants who don't have a session yet. Fully idempotent — safe to call multiple times.

Body (optional — omit to target ALL paid without sessions):


{
  "registrationIds": ["uuid1", "uuid2"]
}
200:


{
  "success": true,
  "message": "Quiz links sent: 234. Failed: 2. Already had session: 1180.",
  "sent": 234,
  "failed": 2,
  "alreadyHadSession": 1180,
  "errors": [
    { "email": "bad@email.com", "error": "SMTP connection refused" }
  ]
}
Get Detailed Answers for One Session (admin investigation)

GET /api/campaigns/quiz/admin/session/:sessionId/answers
Authorization: Bearer <admin-jwt>
200:


{
  "success": true,
  "session": {
    "id": "uuid",
    "email": "ada@example.com",
    "status": "completed",
    "score": 15,
    "totalTimeMs": 198340,
    "startedAt": "...",
    "completedAt": "...",
    "participant": {
      "firstName": "Ada",
      "lastName": "Okonkwo",
      "talent": "Music",
      "location": "Lagos"
    }
  },
  "answers": [
    {
      "questionIndex": 0,
      "questionId": "uuid",
      "selectedAnswer": "b",
      "isCorrect": true,
      "responseTimeMs": 8450
    }
  ]
}
Error Reference
Code	Meaning
401	Not logged in → redirect to login then back to quiz URL
403	Token belongs to a different account
404	Token invalid / not found
409	Already completed (no retake) or already answered that question
410	Token expired (72 hours passed)
400	Bad request (invalid answer value, wrong question index, etc.)