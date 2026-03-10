import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Job Data Parser - Extract and structure job data from raw text
 * This module only handles parsing, NOT analysis (analysis done by LLM)
 */

// Data file paths
const DATA_DIR = path.join(__dirname, 'data');
const ANALYZED_JOBS_FILE = path.join(DATA_DIR, 'analyzed-jobs.json');

/**
 * Ensure data directory exists
 */
function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

/**
 * Parse a single job from raw text
 */
export function parseJob(rawText, options = {}) {
  const job = {
    id: '',
    title: '',
    url: '',
    type: 'unknown',
    budget: {},
    duration: '',
    hours: '',
    skills: [],
    description: '',
    client: {},
    proposals: '',
    postedAt: '',
    raw: rawText,
    ...options
  };

  const lines = rawText.split('\n').map(l => l.trim()).filter(l => l);

  // Extract title (usually first non-empty line or contains "Job" or "Needed")
  for (const line of lines) {
    if (line.length > 10 && line.length < 200) {
      // Skip lines that are clearly metadata
      if (!/^\d+[\s.*)»/-]/.test(line) && !line.match(/^(Posted|Budget|Type|Skills)/i)) {
        job.title = line.replace(/^[\d.]+\s*/, '').replace(/»/g, '').trim();
        break;
      }
    }
  }

  // Extract budget
  const budgetPatterns = [
    /\$\s*(\d+(?:,\d{3})*(?:\.\d{2})?)\s*(?:[-–to]+\s*\$?(\d+(?:,\d{3})*)?)?/i,
    /(hourly|hour|hr)\s*\$?(\d+)/i,
    /(fixed|fixed-?price)\s*\$?(\d+)/i
  ];

  for (const line of lines) {
    // Fixed price
    const fixedMatch = line.match(/\$[\s]*(\d+(?:,\d{3})*)/i);
    if (fixedMatch && !line.toLowerCase().includes('hourly')) {
      job.budget.amount = parseFloat(fixedMatch[1].replace(/,/g, ''));
      job.type = 'fixed';
    }
    // Hourly
    const hourlyMatch = line.match(/\$[\s]*(\d+)\s*[-–to]+\s*\$[\s]*(\d+)/i);
    if (hourlyMatch) {
      job.budget.min = parseInt(hourlyMatch[1]);
      job.budget.max = parseInt(hourlyMatch[2]);
      job.type = 'hourly';
    }
  }

  // Extract client info
  for (const line of lines) {
    const ratingMatch = line.match(/(\d+(?:\.\d)?)\s*★/);
    if (ratingMatch) job.client.rating = parseFloat(ratingMatch[1]);

    const spentMatch = line.match(/\$[\s]*(\d+(?:,\d{3})*)K?\s*(?:total spent|spent)/i);
    if (spentMatch) {
      const val = spentMatch[1].replace(/,/g, '');
      job.client.spent = val.endsWith('K') ? parseInt(val) * 1000 : parseInt(val);
    }

    const jobsMatch = line.match(/(\d+)\s*jobs?\s*posted/i);
    if (jobsMatch) job.client.jobsPosted = parseInt(jobsMatch[1]);

    const hiresMatch = line.match(/(\d+)\s* hires/i);
    if (hiresMatch) job.client.hires = parseInt(hiresMatch[1]);

    // Extract location - could be country or city (before the time)
    // "United Kingdom" or "London 2:00 PM" format
    const countryMatch = line.match(/(United States|UK|United Kingdom|Canada|Australia|India|Germany|France)/i);
    const cityTimeMatch = line.match(/^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+\d{1,2}:\d{2}\s*(AM|PM)/i);

    if (countryMatch) {
      job.client.location = countryMatch[1];
    } else if (cityTimeMatch && !job.client.location) {
      // City before time like "London 2:00 PM"
      job.client.location = cityTimeMatch[1];
    }

    // Extract client name - only from lines that look like "Name" at start, not containing time
    // Client name often appears in reviews as "To freelancer: Name"
    const freelancerMatch = line.match(/To freelancer:\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i);
    if (freelancerMatch && !job.client.name) {
      // This is freelancer name, not client - skip
    }

    if (line.includes('verified') || line.includes('Payment')) {
      job.client.paymentVerified = !line.includes('not');
    }
  }

  // Try to extract client name from job title or description context
  // Many jobs don't show client name explicitly in the listing

  // Extract duration
  const durationPatterns = [
    /(less than|more than)?\s*(\d+)\s*(month|week|hour)/i,
    /(long-?term|ongoing|permanent)/i
  ];
  for (const line of lines) {
    const durMatch = line.match(/(less than|more than)?\s*(\d+)\s*(month|week|hour)/i);
    if (durMatch) {
      job.duration = line.match(/duration[:\s]*(.+)/i)?.[1] || line;
    }
  }

  // Extract hours
  const hoursMatch = rawText.match(/(\d+)\s*hours?\s*(per|\/)\s*week/i);
  if (hoursMatch) job.hours = `${hoursMatch[1]} hrs/week`;

  // Extract proposals
  const propMatch = rawText.match(/(\d+)\s*proposals?/i);
  if (propMatch) job.proposals = propMatch[1];

  // Extract posted time
  const timeMatch = rawText.match(/(posted|ago)\s*(\d+)\s*(hour|day|week|month)/i);
  if (timeMatch) job.postedAt = `${timeMatch[2]} ${timeMatch[3]} ago`;

  // Extract skills (keywords)
  const skillKeywords = [
    'react', 'vue', 'angular', 'javascript', 'typescript', 'python', 'java',
    'node.js', 'next.js', 'nestjs', 'express', 'django', 'flask',
    'postgresql', 'mysql', 'mongodb', 'redis', 'supabase', 'firebase',
    'aws', 'azure', 'gcp', 'docker', 'kubernetes',
    'wordpress', 'shopify', 'woocommerce',
    'n8n', 'zapier', 'make.com',
    'claude', 'cursor', 'chatgpt', 'gpt-',
    'ai', 'machine learning', 'ml',
    'chrome extension', 'browser extension',
    'api', 'rest', 'graphql'
  ];

  const lowerText = rawText.toLowerCase();
  job.skills = skillKeywords.filter(skill => lowerText.includes(skill));

  // Extract description (everything after title until metadata)
  const descStart = rawText.indexOf('\n');
  if (descStart > 0) {
    let desc = rawText.substring(descStart).trim();
    // Remove common metadata sections
    desc = desc.replace(/\n(Skills and Expertise|About the client|Job link|Copy link|How to apply).*/is, '');
    job.description = desc.substring(0, 5000); // Limit length
  }

  // Generate unique ID
  job.id = generateJobId(job);

  return job;
}

/**
 * Parse multiple jobs from raw text
 */
export function parseJobs(rawText) {
  const jobs = [];

  // Try to split by job boundaries (double newline or numbered patterns)
  const blocks = rawText.split(/\n\n(?=\d+[\s.*)»/-]|<div|Client:|Job:)/);

  for (const block of blocks) {
    if (block.trim().length < 50) continue;
    const job = parseJob(block.trim());
    if (job.title) {
      jobs.push(job);
    }
  }

  return jobs;
}

/**
 * Parse client reviews/history from detailed job info
 */
export function parseClientHistory(text) {
  const reviews = [];
  const lines = text.split('\n');

  // Extract individual reviews
  const reviewPatterns = [
    /(.+?)\s+Rating is (\d+\.\d+)\s*★/,
    /To freelancer:\s*(.+?)\s+Rating is (\d+\.\d+)/,
    /(.+?)\s+-\s*(.+?)\s+(\w+\s+\d{4})/
  ];

  for (const line of lines) {
    const ratingMatch = line.match(/Rating is (\d+\.\d+)/);
    if (ratingMatch) {
      reviews.push({
        rating: parseFloat(ratingMatch[1]),
        text: line.substring(0, 200),
        date: line.match(/(\w+\s+\d{4})/)?.[1] || ''
      });
    }
  }

  return reviews;
}

/**
 * Generate unique ID for a job
 */
export function generateJobId(job) {
  const key = `${job.title || ''}-${job.client?.name || ''}-${job.budget?.amount || job.budget?.min || ''}`;
  return crypto.createHash('md5').update(key).digest('hex').substring(0, 12);
}

/**
 * Load analyzed jobs
 */
export function loadAnalyzedJobs() {
  ensureDataDir();
  if (!fs.existsSync(ANALYZED_JOBS_FILE)) {
    return {};
  }
  try {
    const data = fs.readFileSync(ANALYZED_JOBS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (e) {
    return {};
  }
}

/**
 * Save analyzed jobs
 */
export function saveAnalyzedJobs(jobs) {
  ensureDataDir();
  fs.writeFileSync(ANALYZED_JOBS_FILE, JSON.stringify(jobs, null, 2), 'utf-8');
}

/**
 * Filter out already analyzed jobs
 */
export function filterNewJobs(jobs) {
  const analyzed = loadAnalyzedJobs();
  const newJobs = [];

  for (const job of jobs) {
    const jobId = job.id || generateJobId(job);
    if (!analyzed[jobId]) {
      newJobs.push({ ...job, id: jobId });
    }
  }

  return newJobs;
}

/**
 * Mark jobs as analyzed
 */
export function markJobsAnalyzed(jobs, result) {
  const analyzed = loadAnalyzedJobs();
  for (const job of jobs) {
    const jobId = job.id || generateJobId(job);
    analyzed[jobId] = {
      title: job.title,
      analyzedAt: new Date().toISOString(),
      result
    };
  }
  saveAnalyzedJobs(analyzed);
}

/**
 * Main function to parse and prepare jobs for LLM analysis
 */
export function prepareJobs(rawText) {
  const jobs = parseJobs(rawText);
  const newJobs = filterNewJobs(jobs);

  console.log(`\n=== Data Parsing ===`);
  console.log(`Parsed: ${jobs.length} jobs`);
  console.log(`New (not analyzed): ${newJobs.length}`);

  return {
    jobs: newJobs,
    total: jobs.length,
    newCount: newJobs.length,
    alreadyAnalyzed: jobs.length - newJobs.length
  };
}
