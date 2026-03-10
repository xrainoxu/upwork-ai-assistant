// Skill categories and keywords mapping
export const SKILL_CATEGORIES = {
  frontend: {
    name: 'Frontend Development',
    keywords: ['react', 'vue', 'angular', 'javascript', 'typescript', 'html', 'css', 'next.js', 'nuxt', 'svelte', 'tailwind', 'bootstrap', 'responsive', 'ui', 'frontend', 'front-end']
  },
  backend: {
    name: 'Backend Development',
    keywords: ['node.js', 'python', 'java', 'golang', 'go', 'ruby', 'php', 'c#', '.net', 'express', 'django', 'flask', 'spring', 'rails', 'laravel', 'api', 'rest', 'graphql', 'backend', 'back-end', 'server', 'nestjs']
  },
  chrome_extension: {
    name: 'Chrome Extension Development',
    keywords: ['chrome extension', 'browser extension', 'chromium', 'manifest', 'background script', 'content script', 'popup', 'chrome', 'extension']
  },
  saas: {
    name: 'SaaS Development',
    keywords: ['saas', 'software as a service', 'web app', 'dashboard', 'mvp', 'startup', 'product', 'b2b', 'b2c', 'subscription']
  },
  mobile: {
    name: 'Mobile Development',
    keywords: ['react native', 'flutter', 'ios', 'android', 'swift', 'kotlin', 'xamarin', 'mobile app', 'iphone', 'ipad', 'app development']
  },
  devops: {
    name: 'DevOps & Cloud',
    keywords: ['aws', 'azure', 'gcp', 'docker', 'kubernetes', 'k8s', 'ci/cd', 'jenkins', 'terraform', 'ansible', 'cloud', 'devops', 'linux', 'nginx', '部署', '自动化']
  },
  database: {
    name: 'Database',
    keywords: ['mysql', 'postgresql', 'mongodb', 'redis', 'elasticsearch', 'sql', 'nosql', 'database', '数据', 'oracle', 'firebase', 'supabase']
  },
  ai_ml: {
    name: 'AI & Machine Learning',
    keywords: ['machine learning', 'deep learning', 'ai', 'artificial intelligence', 'nlp', 'chatgpt', 'llm', 'gpt', 'tensorflow', 'pytorch', 'neural network', 'python', '数据科学', 'ai']
  },
  data_analysis: {
    name: 'Data Analysis',
    keywords: ['data analysis', 'analytics', 'excel', 'tableau', 'power bi', 'bi', 'visualization', 'dashboard', 'etl', '数据']
  },
  blockchain: {
    name: 'Blockchain',
    keywords: ['solidity', 'web3', 'blockchain', 'ethereum', 'smart contract', 'nft', 'defi', 'crypto']
  },
  qa: {
    name: 'QA & Testing',
    keywords: ['testing', 'qa', 'selenium', 'cypress', 'jest', 'unit test', '自动化测试', 'manual testing', 'test']
  },
  product: {
    name: 'Product & Design',
    keywords: ['figma', 'sketch', 'adobe', 'ui/ux', 'ux', 'product', 'wireframe', 'prototype', 'mockup', '设计', 'product management']
  }
};

// Job risk thresholds
export const RISK_THRESHOLDS = {
  client: {
    rating: { min: 4.0, label: 'Client Rating' },
    ratingLow: { threshold: 3.5, label: 'Low Rating' },
    hires: { min: 5, label: 'Total Hires' },
    spent: { min: 5000, label: 'Client Spent' },
    jobsPosted: { min: 1, label: 'Jobs Posted' }
  },
  budget: {
    fixed: { min: 100, label: 'Fixed Budget' },
    fixedGood: { min: 1000, label: 'Good Fixed Budget' },
    hourlyMin: { min: 30, label: 'Hourly Rate' },
    hourlyMax: { max: 200, label: 'Hourly Rate (cap)' }
  },
  job: {
    descriptionMinLength: 50,
    proposalsWarningThreshold: 50,
    proposalsDangerThreshold: 100,
    ageWarningDays: 30,
    durationLongTerm: '6 months'
  }
};

// Description keyword signals
export const DESCRIPTION_SIGNALS = {
  positive: [
    { pattern: /long-?term|ongoing|6 months|more than 6 months/i, text: 'Long-term opportunity (6+ months)', weight: -15 },
    { pattern: /mvp|startup|seed/i, text: 'Startup/MVP project', weight: -5 },
    { pattern: /pilot|trial|paid trial/i, text: 'Paid trial available', weight: -5 },
    { pattern: /full-?time|40 hours/i, text: 'Full-time commitment', weight: -5 },
    { pattern: /contract-?to-?hire|convert to full/i, text: 'Contract-to-hire', weight: -10 },
    { pattern: /fixed price|fixed-?price/i, text: 'Clear scope', weight: -3 },
    { pattern: /production|live|existing/i, text: 'Production system', weight: -3 }
  ],
  negative: [
    { pattern: /urgent|immediately|asap|right away/i, text: 'Urgency signals', weight: 15 },
    { pattern: /will pay after|milestone|first|upfront/i, text: 'Suspicious payment terms', weight: 20 },
    { pattern: /no budget|negotiable|discuss/i, text: 'Unclear budget', weight: 10 },
    { pattern: /easy|simple|quick/i, text: 'May underestimate scope', weight: 5 },
    { pattern: /test|evaluation|trial project/i, text: 'Test/eval project', weight: 5 },
    { pattern: /outside upwork|off platform|pay directly/i, text: 'Off-platform payment', weight: 30 },
    { pattern: /small project|initial|evaluate|limited budget/i, text: 'Small/eval project', weight: 10 }
  ]
};

export const SKILL_WEIGHTS = {
  // Higher weight = better match
  exact: 2.0,
  partial: 1.0,
  category: 0.5
};

// AI/Automation tools that should be treated as hard requirements when listed
export const AI_TOOLS = [
  'claude', 'cursor', 'chatgpt', 'gpt-4', 'gpt-3.5',
  'n8n', 'zapier', 'make.com', 'make',
  'langchain', 'autogen', 'crewai', 'agent',
  'openai', 'gemini', 'kimi', 'glm'
];

// Tools that are explicitly NOT in user's profile (for rejection)
export const EXCLUDED_TOOLS = [
  'wordpress', 'wp', 'woocommerce', 'shopify',
  'gohighlevel', 'zapier', 'make.com', 'bubble',
  'webflow', 'squarespace', 'wix',
  'php', 'laravel', 'codeigniter',
  'solidity', 'ethereum', 'web3', 'solana'
];
