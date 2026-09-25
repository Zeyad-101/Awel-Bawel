# Awel Bawel

A single-page tool that ranks your exams and projects by how urgently they need attention. Add each item with a deadline and a readiness level, and it sorts the list live as you adjust two weighting sliders.

**Live:** [awel-bawel.vercel.app](https://awel-bawel.vercel.app/)

## How it works

Every item gets an urgency score from 0–100:

```
urgency = timeWeight × timeScore + prepWeight × prepScore
```

- **timeScore** rises as the deadline gets closer. At 0 days left (or overdue) it's maxed out at 1; otherwise it's `1 / daysLeft`, capped at 1.
- **prepScore** rises as readiness falls. Readiness runs 1 (barely started) to 5 (fully ready), so `prepScore = (5 - readiness) / 4`.
- **timeWeight** and **prepWeight** come from the two sliders in the "Weighting" panel and always sum to 1.

Exams and projects share the same formula. A project's "% complete" slider is mapped onto the same 1–5 readiness scale exams use (`readiness = 1 + (pct / 100) * 4`), so both item types sort against each other consistently.

Scores are grouped into three tiers: 66+ is "Now", 33–65 is "Soon", below 33 is "Later". Anything scoring 80 or above also gets an "Urgent" stamp on its card.

There's no backend and no storage — `items` lives in a plain JS array in memory, so the list resets on every page reload.

## Usage

1. Open the page.
2. Set the two weighting sliders to how much you care about time pressure versus how unprepared you are.
3. Pick the **Exam** or **Project** tab, fill in a name and days remaining, and set knowledge level (exams) or percent complete (projects).
4. Click **+ Add to Stack**. The list re-sorts by urgency, highest first, with an animated re-order (a FLIP transition in `render()`) instead of an instant snap.
5. Click the **×** on a card to remove it.

## Running locally

The project is plain HTML/CSS/JS with no build step and no dependencies. Clone it and open `index.html` in a browser, or serve the folder with any static file server:

```bash
git clone https://github.com/Zeyad-101/Awel-Bawel
cd Awel-Bawel
python3 -m http.server
```

## Project structure

```
index.html   – markup: weighting panel, intake form, results list
style.css    – styling (light/dark theme via prefers-color-scheme)
script.js    – state, urgency formula, rendering, and the FLIP re-sort animation
```

Fonts (Special Elite, IBM Plex Sans, IBM Plex Mono) are loaded from Google Fonts; everything else is self-contained.
