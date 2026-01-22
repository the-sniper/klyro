/**
 * Portfolio/Website content fetcher
 * Extracts relevant information from portfolio websites for AI context
 */

export interface JobEntry {
  title: string;
  company: string;
  dateRange: string;
  isCurrent: boolean;
}

export interface PortfolioInfo {
  title: string;
  description: string;
  currentRoles: JobEntry[];
  pastRoles: JobEntry[];
  workExperience: string[];
  skills: string[];
  projects: string[];
  education: string[];
  contact: string[];
  rawContent: string;
}

/**
 * Fetch and parse content from a portfolio/website URL
 * Returns structured information the AI can use to answer questions
 */
export async function fetchPortfolioContent(url: string): Promise<PortfolioInfo | null> {
  try {
    // Normalize URL
    let normalizedUrl = url;
    if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
      normalizedUrl = `https://${normalizedUrl}`;
    }

    console.log('[Portfolio] Fetching:', normalizedUrl);

    const response = await fetch(normalizedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      next: { revalidate: 300 }, // Cache for 5 minutes only for fresher data
    });

    if (!response.ok) {
      console.error(`Failed to fetch portfolio: ${response.status} ${response.statusText}`);
      return null;
    }

    const html = await response.text();
    console.log('[Portfolio] Fetched HTML length:', html.length);
    
    // Extract text content from HTML
    const textContent = extractTextFromHtml(html);
    console.log('[Portfolio] Extracted text length:', textContent.length);
    
    // Parse structured information
    const info = parsePortfolioContent(html, textContent);
    
    console.log('[Portfolio] Parsed info:', {
      title: info.title,
      currentRoles: info.currentRoles,
      pastRoles: info.pastRoles?.length || 0,
      workExperience: info.workExperience?.length || 0
    });
    
    return info;
  } catch (error) {
    console.error('Error fetching portfolio content:', error);
    return null;
  }
}

/**
 * Extract clean text from HTML, preserving structure better
 */
function extractTextFromHtml(html: string): string {
  return html
    // Remove script tags and content
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    // Remove style tags and content
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    // Remove comments
    .replace(/<!--[\s\S]*?-->/g, '')
    // Remove SVG elements
    .replace(/<svg[^>]*>[\s\S]*?<\/svg>/gi, '')
    // Remove noscript
    .replace(/<noscript[^>]*>[\s\S]*?<\/noscript>/gi, '')
    // Convert common block elements to newlines for structure
    .replace(/<\/(p|div|h[1-6]|li|tr|section|article|header|footer)>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    // Remove remaining tags
    .replace(/<[^>]+>/g, ' ')
    // Decode common HTML entities
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&mdash;/g, '-')
    .replace(/&ndash;/g, '-')
    // Clean up whitespace
    .replace(/\s+/g, ' ')
    .replace(/\n\s+/g, '\n')
    .replace(/\n+/g, '\n')
    .trim();
}

/**
 * Parse portfolio content to extract structured information
 */
function parsePortfolioContent(html: string, textContent: string): PortfolioInfo {
  // Extract title
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  const title = titleMatch ? titleMatch[1].trim() : '';

  // Extract meta description
  const metaDescMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i) ||
                        html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']description["']/i);
  const description = metaDescMatch ? metaDescMatch[1].trim() : '';

  // Extract structured job entries (looking for "Present" to identify current roles)
  const { currentRoles, pastRoles } = extractJobEntries(textContent);

  // Extract work experience mentions (fallback)
  const workExperience = extractWorkSection(textContent);

  // Extract skills
  const skills = extractSection(textContent, [
    'skills', 'technologies', 'tech stack', 'expertise', 'proficient',
    'languages', 'frameworks', 'tools'
  ]);

  // Extract projects
  const projects = extractSection(textContent, [
    'projects', 'portfolio', 'work samples', 'case studies', 'built', 'created', 'developed'
  ]);

  // Extract education
  const education = extractSection(textContent, [
    'education', 'degree', 'university', 'college', 'school', 'graduated', 'bachelor', 'master', 'phd'
  ]);

  // Extract contact info
  const contact = extractContactInfo(textContent, html);

  return {
    title,
    description,
    currentRoles,
    pastRoles,
    workExperience,
    skills,
    projects,
    education,
    contact,
    rawContent: textContent.slice(0, 5000),
  };
}

/**
 * Extract structured job entries, identifying current vs past roles
 */
function extractJobEntries(text: string): { currentRoles: JobEntry[]; pastRoles: JobEntry[] } {
  const currentRoles: JobEntry[] = [];
  const pastRoles: JobEntry[] = [];
  
  // Common patterns for job listings on portfolio sites
  // Pattern: "Job Title @ Company" or "Job Title at Company" with date ranges
  
  // Look for lines containing "Present" (case insensitive) - these are current jobs
  const lines = text.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const lowerLine = line.toLowerCase();
    
    // Check if this line mentions "present" - indicates current role
    if (lowerLine.includes('present')) {
      // Try to extract job info from surrounding context
      const contextStart = Math.max(0, i - 2);
      const contextEnd = Math.min(lines.length, i + 2);
      const context = lines.slice(contextStart, contextEnd).map(l => l.trim()).filter(l => l.length > 0);
      
      // Look for date pattern
      const dateMatch = line.match(/(\w+\s*\d{4})\s*[-–—]\s*present/i) ||
                        context.join(' ').match(/(\w+\s*\d{4})\s*[-–—]\s*present/i);
      
      if (dateMatch) {
        // Try to find job title and company
        const jobInfo = extractJobFromContext(context, dateMatch[0]);
        if (jobInfo) {
          currentRoles.push({
            ...jobInfo,
            dateRange: dateMatch[0],
            isCurrent: true
          });
        }
      }
    }
    
    // Also look for date ranges that end with a year (past jobs)
    const pastDateMatch = line.match(/(\w+\s*\d{4})\s*[-–—]\s*(\w+\s*\d{4})/i);
    if (pastDateMatch && !lowerLine.includes('present')) {
      const contextStart = Math.max(0, i - 2);
      const contextEnd = Math.min(lines.length, i + 2);
      const context = lines.slice(contextStart, contextEnd).map(l => l.trim()).filter(l => l.length > 0);
      
      const jobInfo = extractJobFromContext(context, pastDateMatch[0]);
      if (jobInfo) {
        pastRoles.push({
          ...jobInfo,
          dateRange: pastDateMatch[0],
          isCurrent: false
        });
      }
    }
  }
  
  // Deduplicate by company name
  const uniqueCurrentRoles = deduplicateJobs(currentRoles);
  const uniquePastRoles = deduplicateJobs(pastRoles);
  
  return { currentRoles: uniqueCurrentRoles, pastRoles: uniquePastRoles };
}

/**
 * Extract job title and company from context lines
 */
function extractJobFromContext(context: string[], dateRange: string): { title: string; company: string } | null {
  const contextText = context.join(' ');
  
  // Common company separators
  const separators = ['@', ' at ', ' - ', '|'];
  
  for (const line of context) {
    // Skip the date line itself
    if (line.toLowerCase().includes(dateRange.toLowerCase())) continue;
    
    for (const sep of separators) {
      if (line.includes(sep)) {
        const parts = line.split(sep).map(p => p.trim());
        if (parts.length >= 2 && parts[0].length > 3 && parts[1].length > 2) {
          return {
            title: parts[0],
            company: parts[1].split(/\s*[-–—]\s*/)[0].trim() // Remove date part if present
          };
        }
      }
    }
    
    // If no separator, the line might be just the job title
    if (line.length > 5 && line.length < 100 && !line.match(/\d{4}/)) {
      // Check the next non-date line for company
      const nextLines = context.filter(l => l !== line && !l.toLowerCase().includes(dateRange.toLowerCase()));
      for (const nextLine of nextLines) {
        if (nextLine.length > 2 && !nextLine.match(/\d{4}/) && nextLine !== line) {
          return {
            title: line,
            company: nextLine
          };
        }
      }
    }
  }
  
  // Fallback: just return the context as description
  const cleanContext = contextText.replace(dateRange, '').trim();
  if (cleanContext.length > 5) {
    return {
      title: cleanContext.slice(0, 50),
      company: ''
    };
  }
  
  return null;
}

/**
 * Deduplicate job entries by company name
 */
function deduplicateJobs(jobs: JobEntry[]): JobEntry[] {
  const seen = new Set<string>();
  return jobs.filter(job => {
    const key = `${job.company.toLowerCase()}-${job.title.toLowerCase()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * Extract work/experience section specifically
 */
function extractWorkSection(text: string): string[] {
  const results: string[] = [];
  const lines = text.split('\n').filter(line => line.trim().length > 5);
  
  let inExperienceSection = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const lowerLine = line.toLowerCase();
    
    // Detect experience section start
    if (lowerLine === 'experience' || lowerLine === 'work experience' || 
        lowerLine === 'employment' || lowerLine === 'work history') {
      inExperienceSection = true;
      continue;
    }
    
    // Detect section end (next major section)
    if (inExperienceSection && 
        (lowerLine === 'education' || lowerLine === 'skills' || 
         lowerLine === 'projects' || lowerLine === 'contact')) {
      inExperienceSection = false;
      continue;
    }
    
    // Capture lines in experience section
    if (inExperienceSection && line.length > 10) {
      results.push(line);
    }
    
    // Also capture lines mentioning "Present" anywhere
    if (lowerLine.includes('present') && line.length > 10) {
      results.push(line);
    }
  }
  
  return [...new Set(results)].slice(0, 10);
}

/**
 * Extract a section of content based on keyword proximity
 */
function extractSection(text: string, keywords: string[]): string[] {
  const results: string[] = [];
  const lines = text.split('\n').filter(line => line.trim().length > 10);
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].toLowerCase();
    const hasKeyword = keywords.some(kw => line.includes(kw.toLowerCase()));
    
    if (hasKeyword) {
      const contextStart = Math.max(0, i - 1);
      const contextEnd = Math.min(lines.length, i + 3);
      const contextLines = lines.slice(contextStart, contextEnd).join(' ').trim();
      
      if (contextLines.length > 20 && contextLines.length < 500) {
        results.push(contextLines);
      }
    }
  }
  
  return [...new Set(results)].slice(0, 5);
}

/**
 * Extract contact information from content
 */
function extractContactInfo(text: string, html: string): string[] {
  const contacts: string[] = [];
  
  // Email patterns
  const emailMatch = text.match(/[\w.-]+@[\w.-]+\.\w+/g);
  if (emailMatch) {
    contacts.push(...emailMatch.slice(0, 2));
  }
  
  // Phone patterns
  const phoneMatch = text.match(/\+?[\d\s()-]{10,}/g);
  if (phoneMatch) {
    contacts.push(...phoneMatch.filter(p => p.replace(/\D/g, '').length >= 10).slice(0, 1));
  }
  
  // LinkedIn from href
  const linkedinMatch = html.match(/href=["']([^"']*linkedin\.com[^"']*)["']/i);
  if (linkedinMatch) {
    contacts.push(`LinkedIn: ${linkedinMatch[1]}`);
  }
  
  // GitHub from href
  const githubMatch = html.match(/href=["']([^"']*github\.com\/[\w-]+)["']/i);
  if (githubMatch) {
    contacts.push(`GitHub: ${githubMatch[1]}`);
  }
  
  return [...new Set(contacts)];
}

/**
 * Format portfolio info into a readable string for the AI
 * PRIORITIZES current roles at the top
 */
export function formatPortfolioForAI(info: PortfolioInfo): string {
  const sections: string[] = [];
  
  if (info.title) {
    sections.push(`Website Title: ${info.title}`);
  }
  
  if (info.description) {
    sections.push(`Description: ${info.description}`);
  }
  
  // CURRENT ROLES - Most important, put first!
  if (info.currentRoles && info.currentRoles.length > 0) {
    const currentJobsText = info.currentRoles.map(job => {
      if (job.company) {
        return `- ${job.title} at ${job.company} (${job.dateRange}) [CURRENT]`;
      }
      return `- ${job.title} (${job.dateRange}) [CURRENT]`;
    }).join('\n');
    sections.push(`**CURRENT EMPLOYMENT (Present roles):**\n${currentJobsText}`);
  }
  
  // Past roles
  if (info.pastRoles && info.pastRoles.length > 0) {
    const pastJobsText = info.pastRoles.slice(0, 3).map(job => {
      if (job.company) {
        return `- ${job.title} at ${job.company} (${job.dateRange})`;
      }
      return `- ${job.title} (${job.dateRange})`;
    }).join('\n');
    sections.push(`Past Employment:\n${pastJobsText}`);
  }
  
  // Fallback work experience if structured extraction didn't work
  if ((!info.currentRoles || info.currentRoles.length === 0) && info.workExperience.length > 0) {
    sections.push(`Work Experience:\n${info.workExperience.map(w => `- ${w}`).join('\n')}`);
  }
  
  if (info.skills.length > 0) {
    sections.push(`Skills & Technologies:\n${info.skills.map(s => `- ${s}`).join('\n')}`);
  }
  
  if (info.projects.length > 0) {
    sections.push(`Projects:\n${info.projects.map(p => `- ${p}`).join('\n')}`);
  }
  
  if (info.education.length > 0) {
    sections.push(`Education:\n${info.education.map(e => `- ${e}`).join('\n')}`);
  }
  
  if (info.contact.length > 0) {
    sections.push(`Contact Info:\n${info.contact.map(c => `- ${c}`).join('\n')}`);
  }
  
  // Add raw content summary if we didn't extract much
  if (sections.length < 3 && info.rawContent) {
    sections.push(`Page Content Summary:\n${info.rawContent.slice(0, 2000)}`);
  }
  
  return sections.join('\n\n');
}
