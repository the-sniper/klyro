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
        'User-Agent': 'Chatfolio-App',
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
