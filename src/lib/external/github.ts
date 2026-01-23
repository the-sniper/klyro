export interface GitHubRepo {
  name: string;
  description: string;
  html_url: string;
  stargazers_count: number;
  updated_at: string;
  language: string;
}

/**
 * Fetch latest public repositories for a given GitHub username or URL
 */
export async function fetchLatestRepos(githubInput: string, limit: number = 5): Promise<GitHubRepo[]> {
  try {
    // Extract username from URL if necessary
    let username = githubInput;
    if (githubInput.includes('github.com/')) {
      username = githubInput.split('github.com/')[1].split('/')[0];
    }

    if (!username) return [];

    const response = await fetch(`https://api.github.com/users/${username}/repos?sort=updated&per_page=${limit}`, {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Klyro-App',
        // Optional: Add GITHUB_TOKEN if you have one to avoid rate limiting
        ...(process.env.GITHUB_TOKEN ? { 'Authorization': `token ${process.env.GITHUB_TOKEN}` } : {})
      }
    });

    if (!response.ok) {
      console.error('GitHub API error:', await response.text());
      return [];
    }

    const data = await response.json();
    
    return data.map((repo: any) => ({
      name: repo.name,
      description: repo.description,
      html_url: repo.html_url,
      stargazers_count: repo.stargazers_count,
      updated_at: repo.updated_at,
      language: repo.language
    }));
  } catch (error) {
    console.error('Failed to fetch GitHub repos:', error);
    return [];
  }
}
/**
 * Fetch README content for a specific repository and decode it from base64
 */
export async function fetchRepoReadme(githubInput: string, repo: string): Promise<string | null> {
  try {
    // Extract username from URL if necessary
    let username = githubInput;
    if (githubInput.includes('github.com/')) {
      username = githubInput.split('github.com/')[1].split('/')[0];
    }

    if (!username || !repo) return null;

    const response = await fetch(`https://api.github.com/repos/${username}/${repo}/readme`, {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Klyro-App',
        ...(process.env.GITHUB_TOKEN ? { 'Authorization': `token ${process.env.GITHUB_TOKEN}` } : {})
      }
    });

    if (!response.ok) {
      if (response.status === 404) {
        console.log(`No README found for ${username}/${repo}`);
        return null;
      }
      console.error('GitHub API error (README):', await response.text());
      return null;
    }

    const data = await response.json();
    
    // GitHub API returns README content in base64 encoding
    if (data.content && data.encoding === 'base64') {
      const decoded = Buffer.from(data.content, 'base64').toString('utf-8');
      return decoded;
    }

    return null;
  } catch (error) {
    console.error('Failed to fetch GitHub README:', error);
    return null;
  }
}
