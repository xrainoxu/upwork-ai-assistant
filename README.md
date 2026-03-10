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

## Usage

### 0. Update Your Profile

Paste your Upwork profile content and say:

> "更新 profile，xxx"

The AI will parse and store your profile for future analysis.

---

### 1. Screen Multiple Jobs

Paste a list of job summaries and say:

> "初筛这些 jobs"

The AI will:
- Parse job data (title, budget, client info, skills)
- Deduplicate against previously analyzed jobs
- Analyze each job based on your profile
- Generate an HTML report with recommendations

---

### 2. Analyze a Specific Job

Paste a job's full details (including client history) and say:

> "详细分析这个 job"

The AI will:
- Parse structured data
- Deep analyze client history and reviews
- Provide application recommendation + rate suggestion

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
