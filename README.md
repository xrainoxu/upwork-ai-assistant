# Upwork AI Assistant

AI-powered Upwork career assistant to help you screen jobs, optimize your profile, and write better proposals.

> This project was fully executed by Claude Code + MiniMax-M2.1 — I only defined the product requirements, broke down features, and oversaw technical decisions.

## Features

| Feature | Description |
|---------|-------------|
| **Job Screening** | Analyze multiple jobs at once, get AI recommendations |
| **Job Deep Dive** | Detailed analysis of single job with client history |
| **Profile Optimization** | Get suggestions to improve your Upwork profile |

## How It Works

```
You: Paste Upwork data
    ↓
Scripts: Parse & extract → JSON
    ↓
LLM: Analyze + Profile → Insights
    ↓
Scripts: Generate HTML report → Auto-open browser
    ↓
You: View results
```

## Getting Started

Start Claude Code in your project directory:

```bash
claude
```

### 0. Sync Your Profile

1. Go to your Upwork profile page
2. Copy all content from your profile
3. Paste and send to Claude:

```
更新 profile，[paste your profile content here]
```

The AI will parse and store your profile locally for future analysis.

---

### 1. Screen Multiple Jobs

1. Go to Upwork **Find Works** page
2. Switch to **Most Recent** or **Saved** jobs
3. Copy the job list (select multiple jobs if supported)
4. Paste and send to Claude:

```
初筛这些 jobs

[paste job list here]
```

The AI will:
- Parse job data (title, budget, client info, skills)
- Deduplicate against previously analyzed jobs
- Analyze each job based on your profile
- Generate an HTML report with recommendations

---

### 2. Analyze a Specific Job

1. Open a job's detail page on Upwork
2. Expand any collapsed sections (click "more..." if collapsed)
3. Copy **all** content from the page (job description + client history)
4. Paste and send to Claude:

```
详细分析这个 job

[paste full job details here]
```

The AI will:
- Parse structured data
- Deep analyze client history and reviews
- Provide application recommendation + rate suggestion

---

## Data Privacy

All data is stored **locally** in your project directory only:
- `scripts/profile/data/my-profile.json`
- `scripts/jobs/data/analyzed-jobs.json`

**No data is sent to any external server.** Your profile and job data never leave your machine.

---

## Output Files

| Type | Location |
|------|----------|
| Screening Reports | `reports/screening/screening-{timestamp}.html` |
| Detailed Analysis | `reports/detailed/job-{id}-{timestamp}/analysis.html` |
| Parsed Data | `scripts/jobs/data/jobs-{timestamp}.json` |
| Analyzed Jobs | `scripts/jobs/data/analyzed-jobs.json` |

## Tech Stack

- **AI**: Claude Code + MiniMax-M2.1
- **Scripts**: Node.js (ES Modules)
- **Reports**: HTML + CSS

## License

ISC
