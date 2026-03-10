import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Job Reporter - Generate HTML reports for job analysis
 * Data parsing: screener.js | Analysis: LLM | Reporting: this module
 */

const PROJECT_ROOT = path.resolve(__dirname, '../..');
const DATA_DIR = path.join(__dirname, 'data');
const REPORTS_DIR = path.join(PROJECT_ROOT, 'reports', 'screening');
const DETAILED_REPORTS_DIR = path.join(PROJECT_ROOT, 'reports', 'detailed');

/**
 * Open file in default browser
 */
function openInBrowser(filepath) {
  const command = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start' : 'xdg-open';
  exec(`${command} "${filepath}"`, (err) => {
    if (err) {
      console.log('Failed to open browser. Please manually open:', filepath);
    }
  });
}

/**
 * Convert markdown to HTML
 */
function markdownToHtml(markdown) {
  if (!markdown) return '';

  let html = markdown
    // Escape HTML first
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

    // Headers
    .replace(/^### (.+)$/gm, '<h4>$1</h4>')
    .replace(/^## (.+)$/gm, '<h3>$1</h3>')
    .replace(/^# (.+)$/gm, '<h2>$1</h2>')

    // Bold
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')

    // Italic
    .replace(/\*(.+?)\*/g, '<em>$1</em>')

    // Lists (unordered)
    .replace(/^- (.+)$/gm, '<li>$1</li>')

    // Tables - convert markdown table to HTML table
    .replace(/^\|(.+)\|$/gm, (match) => {
      const cells = match.split('|').filter(c => c.trim());
      if (cells.some(c => c.match(/^-+$/))) {
        return '<!-- table-separator -->';
      }
      const isHeader = !match.includes('---');
      const tag = isHeader ? 'th' : 'td';
      const cellHtml = cells.map(c => `<${tag}>${c.trim()}</${tag}>`).join('');
      return `<tr>${cellHtml}</tr>`;
    })

    // Clean up table separator
    .replace(/<!-- table-separator -->\n/g, '')

    // Line breaks
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>');

  // Wrap lists
  html = html.replace(/(<li>.*?<\/li>)+/g, '<ul>$&</ul>');

  // Wrap tables
  html = html.replace(/(<tr>.*?<\/tr>)+/g, '<table>$&</table>');

  // Wrap in paragraphs
  html = '<p>' + html + '</p>';

  // Clean up empty paragraphs
  html = html.replace(/<p>\s*<\/p>/g, '');
  html = html.replace(/<p>\s*<(h[234]|ul|table|tr)/g, '<$1');
  html = html.replace(/<\/(h[234]|ul|table|tr)>\s*<\/p>/g, '</$1>');

  return html;
}

/**
 * Ensure directories exist
 */
function ensureDirectories() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(REPORTS_DIR)) {
    fs.mkdirSync(REPORTS_DIR, { recursive: true });
  }
  if (!fs.existsSync(DETAILED_REPORTS_DIR)) {
    fs.mkdirSync(DETAILED_REPORTS_DIR, { recursive: true });
  }
}

/**
 * Save jobs list as JSON for LLM processing
 */
export function saveJobsData(jobs, options = {}) {
  ensureDirectories();

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const { prefix = 'jobs' } = options;

  const filename = `${prefix}-${timestamp}.json`;
  const filepath = path.join(DATA_DIR, filename);

  fs.writeFileSync(filepath, JSON.stringify(jobs, null, 2), 'utf-8');
  console.log(`Jobs data saved to: ${filepath}`);

  return { filepath, filename };
}

/**
 * Save detailed job data as JSON for LLM processing
 */
export function saveDetailedJobData(job, options = {}) {
  ensureDirectories();

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const jobId = (job.id || 'unknown').substring(0, 8);

  // Create folder for this job
  const jobFolderName = `job-${jobId}-${timestamp}`;
  const jobFolderPath = path.join(DETAILED_REPORTS_DIR, jobFolderName);

  if (!fs.existsSync(jobFolderPath)) {
    fs.mkdirSync(jobFolderPath, { recursive: true });
  }

  // Save raw data
  const rawDataPath = path.join(jobFolderPath, 'raw-data.json');
  fs.writeFileSync(rawDataPath, JSON.stringify(job, null, 2), 'utf-8');

  console.log(`Detailed job data saved to: ${rawDataPath}`);

  return {
    jobFolderPath,
    jobFolderName,
    rawDataPath
  };
}

/**
 * Save analysis result from LLM
 */
export function saveAnalysisResult(jobId, analysisResult) {
  ensureDirectories();

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const jobFolder = path.join(DETAILED_REPORTS_DIR, `job-${jobId.substring(0, 8)}-${timestamp}`);

  if (!fs.existsSync(jobFolder)) {
    fs.mkdirSync(jobFolder, { recursive: true });
  }

  const analysisPath = path.join(jobFolder, 'llm-analysis.json');
  fs.writeFileSync(analysisPath, JSON.stringify(analysisResult, null, 2), 'utf-8');

  return analysisPath;
}

/**
 * Load job data from file
 */
export function loadJobsData(filepath) {
  if (!fs.existsSync(filepath)) {
    return null;
  }
  const data = fs.readFileSync(filepath, 'utf-8');
  return JSON.parse(data);
}

/**
 * Load profile data
 */
export function loadProfile() {
  const profilePath = path.join(DATA_DIR, '../profile/data/my-profile.json');
  if (!fs.existsSync(profilePath)) {
    return null;
  }
  const data = fs.readFileSync(profilePath, 'utf-8');
  return JSON.parse(data);
}

/**
 * Export jobs summary for quick review
 */
export function exportJobsSummary(jobs) {
  ensureDirectories();

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const filename = `summary-${timestamp}.json`;
  const filepath = path.join(REPORTS_DIR, filename);

  const summary = jobs.map((job, i) => ({
    index: i + 1,
    id: job.id,
    title: job.title,
    type: job.type,
    budget: job.budget,
    client: {
      rating: job.client?.rating,
      spent: job.client?.spent,
      hires: job.client?.hires
    },
    proposals: job.proposals,
    skills: job.skills
  }));

  fs.writeFileSync(filepath, JSON.stringify(summary, null, 2), 'utf-8');
  console.log(`Summary saved to: ${filepath}`);

  return { filepath, filename, summary };
}

/**
 * Generate HTML report for a single job analysis (with LLM analysis result)
 */
export function generateDetailedReport(job, analysis) {
  ensureDirectories();

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const jobId = (job.id || 'unknown').substring(0, 8);

  // Create folder for this job
  const jobFolderName = `job-${jobId}-${timestamp}`;
  const jobFolderPath = path.join(DETAILED_REPORTS_DIR, jobFolderName);

  if (!fs.existsSync(jobFolderPath)) {
    fs.mkdirSync(jobFolderPath, { recursive: true });
  }

  // Save raw data
  const rawDataPath = path.join(jobFolderPath, 'raw-data.json');
  fs.writeFileSync(rawDataPath, JSON.stringify(job, null, 2), 'utf-8');

  // Generate HTML report
  const filename = 'analysis.html';
  const filepath = path.join(jobFolderPath, filename);

  const budgetDisplay = job.budget?.amount
    ? `$${job.budget.amount}`
    : job.budget?.min && job.budget?.max
      ? `$${job.budget.min}-${job.budget.max}/hr`
      : 'N/A';

  const recommendation = analysis?.recommendation || 'N/A';
  const recommendationClass = recommendation.includes('推荐') || recommendation.includes('推荐') ? 'apply' : 'skip';

  let html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Job Analysis: ${job.title || 'Unknown'}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; color: #333; line-height: 1.6; padding: 20px; }
    .container { max-width: 900px; margin: 0 auto; }
    .header { background: white; border-radius: 8px; padding: 24px; margin-bottom: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
    .job-title { font-size: 24px; font-weight: 600; color: #1a1a2e; margin-bottom: 12px; }
    .job-budget { display: inline-block; background: #22c55e; color: white; padding: 6px 16px; border-radius: 4px; font-size: 18px; font-weight: 500; margin-bottom: 16px; }
    .recommendation-box { padding: 16px; border-radius: 8px; margin-top: 16px; }
    .recommendation-box.apply { background: #dcfce7; border: 1px solid #bbf7d0; }
    .recommendation-box.skip { background: #fee2e2; border: 1px solid #fecaca; }
    .recommendation-box .title { font-weight: 600; font-size: 18px; margin-bottom: 8px; }
    .section { background: white; border-radius: 8px; padding: 20px; margin-bottom: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
    .section h2 { font-size: 16px; color: #1a1a2e; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px solid #e5e7eb; }
    .info-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
    .info-item { display: flex; }
    .info-item .label { font-weight: 500; color: #6b7280; width: 140px; }
    .info-item .value { color: #333; }
    .tag { display: inline-block; padding: 4px 10px; border-radius: 4px; font-size: 13px; margin-right: 6px; margin-bottom: 6px; }
    .tag.positive { background: #dcfce7; color: #166534; }
    .tag.risk { background: #fee2e2; color: #991b1b; }
    .tag.neutral { background: #f3f4f6; color: #6b7280; }
    .analysis-content { font-size: 14px; line-height: 1.8; }
    .analysis-content h2 { font-size: 18px; margin: 20px 0 12px; color: #1a1a2e; border-bottom: none; }
    .analysis-content h3 { font-size: 16px; margin: 16px 0 8px; color: #1a1a2e; border-bottom: none; }
    .analysis-content h4 { font-size: 15px; margin: 14px 0 6px; color: #374151; }
    .analysis-content p { margin: 8px 0; }
    .analysis-content ul, .analysis-content ol { margin: 8px 0; padding-left: 24px; }
    .analysis-content li { margin: 4px 0; }
    .analysis-content strong { font-weight: 600; color: #1a1a2e; }
    .analysis-content table { width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 13px; }
    .analysis-content th, .analysis-content td { padding: 8px 12px; border: 1px solid #e5e7eb; text-align: left; }
    .analysis-content th { background: #f8fafc; font-weight: 600; }
    .analysis-content tr:nth-child(even) { background: #f9fafb; }
    .description { white-space: pre-wrap; font-size: 14px; color: #555; max-height: 300px; overflow-y: auto; background: #f9fafb; padding: 16px; border-radius: 4px; }
    .footer { text-align: center; margin-top: 32px; color: #999; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="job-title">${job.title || 'Unknown Job'}</div>
      <div class="job-budget">${budgetDisplay}</div>
      <div class="recommendation-box ${recommendationClass}">
        <div class="title">${recommendation.includes('推荐') ? '✅' : '⚠️'} ${recommendation}</div>
      </div>
    </div>

    <div class="section">
      <h2>Client Info</h2>
      <div class="info-grid">
        <div class="info-item"><span class="label">Name:</span><span class="value">${job.client?.name || 'N/A'}</span></div>
        <div class="info-item"><span class="label">Location:</span><span class="value">${job.client?.location || 'N/A'}</span></div>
        <div class="info-item"><span class="label">Rating:</span><span class="value">${job.client?.rating || 'N/A'} ★</span></div>
        <div class="info-item"><span class="label">Spent:</span><span class="value">$${job.client?.spent || 0}</span></div>
        <div class="info-item"><span class="label">Jobs Posted:</span><span class="value">${job.client?.jobsPosted || 0}</span></div>
        <div class="info-item"><span class="label">Hires:</span><span class="value">${job.client?.hires || 0}</span></div>
        <div class="info-item"><span class="label">Avg Hourly:</span><span class="value">$${job.client?.avgHourlyRate || 0}/hr</span></div>
        <div class="info-item"><span class="label">Payment:</span><span class="value">${job.client?.paymentVerified ? '✓ Verified' : '✗ Unverified'}</span></div>
      </div>
    </div>

    <div class="section">
      <h2>Job Details</h2>
      <div class="info-grid">
        <div class="info-item"><span class="label">Type:</span><span class="value">${job.type || 'N/A'}</span></div>
        <div class="info-item"><span class="label">Duration:</span><span class="value">${job.duration || 'N/A'}</span></div>
        <div class="info-item"><span class="label">Hours:</span><span class="value">${job.hours || 'N/A'}</span></div>
        <div class="info-item"><span class="label">Proposals:</span><span class="value">${job.proposals || '< 5'}</span></div>
        <div class="info-item"><span class="label">Posted:</span><span class="value">${job.postedAt || 'N/A'}</span></div>
        <div class="info-item"><span class="label">Skills:</span><span class="value">${(job.skills || []).join(', ') || 'N/A'}</span></div>
      </div>
    </div>

    <div class="section">
      <h2>LLM Analysis</h2>
      <div class="analysis-content">${markdownToHtml(analysis?.content) || 'No analysis available.'}</div>
    </div>

    ${analysis?.budgetProposal ? `
    <div class="section">
      <h2>💰 Budget Proposal</h2>
      <div class="analysis-content">${markdownToHtml(analysis.budgetProposal)}</div>
    </div>
    ` : ''}

    ${job.description ? `
    <div class="section">
      <h2>Description</h2>
      <div class="description">${job.description.substring(0, 3000)}</div>
    </div>
    ` : ''}

    <div class="footer">Generated: ${new Date().toLocaleString()} | Upwork Job Analyzer</div>
  </div>
</body>
</html>`;

  fs.writeFileSync(filepath, html, 'utf-8');

  // Auto-open in browser
  console.log(`\nReport saved to: ${filepath}`);
  console.log('Opening in browser...');
  openInBrowser(filepath);

  return {
    filepath,
    filename,
    jobFolderPath,
    jobFolderName,
    rawDataPath
  };
}

/**
 * Generate screening report for multiple jobs
 */
export function generateScreeningReport(jobs, analyses) {
  ensureDirectories();

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const filename = `screening-${timestamp}.html`;
  const filepath = path.join(REPORTS_DIR, filename);

  let html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Job Screening Report</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; color: #333; line-height: 1.6; padding: 20px; }
    .container { max-width: 900px; margin: 0 auto; }
    h1 { color: #1a1a2e; margin-bottom: 8px; }
    h2 { color: #1a1a2e; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px; margin: 24px 0 16px; }
    .meta { color: #666; font-size: 14px; margin-bottom: 24px; }
    .summary { display: flex; gap: 16px; margin-bottom: 32px; }
    .summary-card { background: white; padding: 16px 24px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); text-align: center; }
    .summary-card .num { font-size: 28px; font-weight: bold; }
    .summary-card .label { font-size: 12px; color: #666; text-transform: uppercase; }
    .job-card { background: white; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); margin-bottom: 20px; overflow: hidden; }
    .job-header { background: #f8fafc; padding: 16px 20px; border-bottom: 1px solid #e5e7eb; }
    .job-title { font-size: 18px; font-weight: 600; color: #1a1a2e; margin-bottom: 8px; }
    .job-budget { display: inline-block; background: #22c55e; color: white; padding: 4px 12px; border-radius: 4px; font-size: 14px; font-weight: 500; }
    .job-content { padding: 16px 20px; font-size: 14px; line-height: 1.6; }
    .recommendation { font-weight: 600; margin-bottom: 8px; }
    .recommendation.apply { color: #166534; }
    .recommendation.skip { color: #991b1b; }
    .footer { text-align: center; margin-top: 32px; color: #999; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Job Screening Report</h1>
    <p class="meta">Generated: ${new Date().toLocaleString()}</p>

    <div class="summary">
      <div class="summary-card">
        <div class="num">${jobs.length}</div>
        <div class="label">Total Jobs</div>
      </div>
    </div>

    <h2>Analysis Results</h2>`;

  for (let i = 0; i < jobs.length; i++) {
    const job = jobs[i];
    const analysis = analyses?.[i];
    const budgetDisplay = job.budget?.amount
      ? `$${job.budget.amount}`
      : job.budget?.min && job.budget?.max
        ? `$${job.budget.min}-${job.budget.max}/hr`
        : 'N/A';

    const rec = analysis?.recommendation || 'Pending';
    const recClass = rec.includes('推荐') ? 'apply' : 'skip';
    const summary = analysis?.summary || 'Analyzing...';

    html += `
    <div class="job-card">
      <div class="job-header">
        <div class="job-title">${i + 1}. ${job.title || 'Unknown'}</div>
        <span class="job-budget">${budgetDisplay}</span>
      </div>
      <div class="job-content">
        <div class="recommendation ${recClass}">${rec.includes('推荐') ? '✅' : '⚠️'} ${rec}</div>
        <div>${summary.substring(0, 300)}${summary.length > 300 ? '...' : ''}</div>
      </div>
    </div>`;
  }

  html += `
    <div class="footer">Upwork Job Analyzer</div>
  </div>
</body>
</html>`;

  fs.writeFileSync(filepath, html, 'utf-8');

  // Auto-open in browser
  console.log(`\nReport saved to: ${filepath}`);
  console.log('Opening in browser...');
  openInBrowser(filepath);

  return { filepath, filename };
}
