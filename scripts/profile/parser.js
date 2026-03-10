import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { SKILL_CATEGORIES, SKILL_WEIGHTS } from '../utils/constants.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Parse raw profile text and extract structured information
 */
export function parseProfile(rawText) {
  const lines = rawText.split('\n').map(l => l.trim()).filter(l => l);

  const profile = {
    title: '',
    skills: [],
    categories: [],
    experience: [],
    hourlyRate: null,
    summary: '',
    raw: rawText
  };

  // Try to extract title (usually first line or contains "title" keyword)
  profile.title = extractTitle(lines);

  // Extract skills
  profile.skills = extractSkills(rawText);

  // Map skills to categories
  profile.categories = mapSkillsToCategories(profile.skills);

  // Extract hourly rate
  profile.hourlyRate = extractHourlyRate(rawText);

  // Extract experience/summary
  profile.summary = extractSummary(rawText);

  // Calculate skill strength
  profile.skillStrength = calculateSkillStrength(profile.categories);

  return profile;
}

/**
 * Extract profile title
 */
function extractTitle(lines) {
  // First non-empty line often contains name/title
  if (lines.length > 0) {
    const firstLine = lines[0];
    // If it looks like a name or title (no special chars, reasonable length)
    if (firstLine.length < 100 && !firstLine.includes(':')) {
      return firstLine;
    }
  }
  return '';
}

/**
 * Extract skills from profile text
 */
function extractSkills(text) {
  const lowerText = text.toLowerCase();
  const foundSkills = new Set();

  // Check each skill category and keywords
  for (const [categoryName, category] of Object.entries(SKILL_CATEGORIES)) {
    for (const keyword of category.keywords) {
      if (lowerText.includes(keyword.toLowerCase())) {
        foundSkills.add(keyword.toLowerCase());
      }
    }
  }

  // Also try to find explicit skill lists (often after "Skills:" or similar)
  const skillSectionPatterns = [
    /(?:skills|technologies|tech stack|tools)[\s:]+([^\n]+)/gi,
    /- ([\w+#.]+)/g  // Bullet points
  ];

  for (const pattern of skillSectionPatterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const skillText = match[1] || match[0];
      const potentialSkills = skillText.split(/[,;|]/).map(s => s.trim().toLowerCase()).filter(s => s.length > 1);
      potentialSkills.forEach(s => foundSkills.add(s));
    }
  }

  return Array.from(foundSkills);
}

/**
 * Map extracted skills to categories
 */
function mapSkillsToCategories(skills) {
  const categories = {};

  for (const skill of skills) {
    for (const [categoryKey, category] of Object.entries(SKILL_CATEGORIES)) {
      for (const keyword of category.keywords) {
        if (skill.includes(keyword) || keyword.includes(skill)) {
          if (!categories[categoryKey]) {
            categories[categoryKey] = {
              name: category.name,
              key: categoryKey,
              skills: [],
              weight: 0
            };
          }
          if (!categories[categoryKey].skills.includes(skill)) {
            categories[categoryKey].skills.push(skill);
          }
          categories[categoryKey].weight += (skill === keyword) ? SKILL_WEIGHTS.exact : SKILL_WEIGHTS.partial;
          break;
        }
      }
    }
  }

  return Object.values(categories).sort((a, b) => b.weight - a.weight);
}

/**
 * Extract hourly rate from profile
 */
function extractHourlyRate(text) {
  const ratePatterns = [
    /\$?(\d+)[-/]?(\d+)?\s*\/\s*hour/i,
    /(\d+)\s*hourly/i,
    /hourly[:\s]+\$?(\d+)/i,
    /rate[:\s]+\$?(\d+)/i
  ];

  for (const pattern of ratePatterns) {
    const match = text.match(pattern);
    if (match) {
      const rate = parseInt(match[1], 10);
      if (rate > 0 && rate < 500) {
        return rate;
      }
    }
  }
  return null;
}

/**
 * Extract summary/description
 */
function extractSummary(text) {
  // Remove common headers
  let summary = text
    .replace(/^(name|title|skills|experience|about)[\s:]+/gim, '')
    .replace(/^[-•*]\s+/gm, '')
    .trim();

  // Take first 500 chars as summary
  if (summary.length > 500) {
    summary = summary.substring(0, 500) + '...';
  }

  return summary;
}

/**
 * Calculate overall skill strength
 */
function calculateSkillStrength(categories) {
  if (categories.length === 0) return 0;

  let totalWeight = 0;
  for (const cat of categories) {
    totalWeight += cat.weight;
  }

  // Normalize to 0-100
  return Math.min(100, Math.round(totalWeight * 5));
}

/**
 * Save profile data to file
 */
export function saveProfile(profile, filepath = null) {
  const outputPath = filepath || path.join(__dirname, 'profile', 'data', 'my-profile.json');
  const dir = path.dirname(outputPath);

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(outputPath, JSON.stringify(profile, null, 2), 'utf-8');
  console.log(`Profile saved to: ${outputPath}`);
  return outputPath;
}

/**
 * Load profile data from file
 */
export function loadProfile(filepath = null) {
  const inputPath = filepath || path.join(__dirname, 'profile', 'data', 'my-profile.json');

  if (!fs.existsSync(inputPath)) {
    throw new Error(`Profile file not found: ${inputPath}`);
  }

  const data = fs.readFileSync(inputPath, 'utf-8');
  return JSON.parse(data);
}

/**
 * Main function for CLI usage
 */
export function main(rawProfileText) {
  if (!rawProfileText) {
    console.error('Please provide profile text as argument');
    process.exit(1);
  }

  const profile = parseProfile(rawProfileText);
  saveProfile(profile);

  console.log('\n=== Profile Analysis ===');
  console.log(`Title: ${profile.title}`);
  console.log(`Hourly Rate: ${profile.hourlyRate ? '$' + profile.hourlyRate : 'N/A'}`);
  console.log(`Skill Strength: ${profile.skillStrength}/100`);
  console.log('\nSkills by Category:');

  for (const cat of profile.categories) {
    console.log(`  ${cat.name}: ${cat.skills.join(', ')}`);
  }

  return profile;
}
