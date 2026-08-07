# Screenshots

Drop app captures in this folder and reference them from the root [README](../../README.md).

## Recommended set

| Filename | Route | What to capture |
|---|---|---|
| `lobby.png` | `/lobby` | Online players grid with the challenge board tab visible |
| `challenge-modal.png` | `/lobby` | Challenge modal with category + wager selected |
| `gameplay.png` | `/game` | A question mid-match with the countdown and opponent score bar |
| `results.png` | `/game` | Results screen with the score card and payout breakdown |
| `leaderboard.png` | `/leaderboard` | Global tab with rank badges |
| `wallet.png` | `/wallet` | Balance card plus the purchase tab |
| `identity.png` | `/identity` | Avatar picker open |
| `guide.png` | `/guide` | The 3D flip-book mid-turn |
| `campaign-quiz.png` | `/campaign/quiz` | A question with the 15s timer running |

## Capture tips

- Use a **1440×900** viewport for desktop shots so they scale cleanly in the README.
- Add a `-mobile.png` variant at **390×844** for the responsive layouts.
- The app is dark-first — capture on the dark background (`hsl(222 47% 6%)`), not a
  browser default white frame.
- Blur or replace real nicknames, balances, and emails before committing.

## Referencing them

```markdown
<div align="center">
  <img src="docs/screenshots/lobby.png" width="49%" alt="Lobby" />
  <img src="docs/screenshots/gameplay.png" width="49%" alt="Gameplay" />
</div>
```
