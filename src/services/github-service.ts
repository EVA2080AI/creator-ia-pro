/**
 * GitHub Service
 * Interfaz nativa para interactuar con la API de GitHub desde Genesis Studio.
 */

export interface GitHubConfig {
  token: string;
}

export class GitHubService {
  private token: string;
  private baseUrl = 'https://api.github.com';

  constructor(config: GitHubConfig) {
    this.token = config.token;
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    if (!this.token) {
      throw new Error("No se ha configurado el token de GitHub (PAT).");
    }

    const res = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'Authorization': `Bearer ${this.token}`,
        'X-GitHub-Api-Version': '2022-11-28',
        ...(options.headers || {}),
      },
    });

    if (!res.ok) {
        let errorText = await res.text();
        try {
            const parsed = JSON.parse(errorText);
            errorText = parsed.message || errorText;
        } catch { /* ignore */ }
        throw new Error(`GitHub Error (${res.status}): ${errorText}`);
    }

    if (res.status === 204) return null;
    return res.json();
  }

  async searchRepositories(query: string, perPage = 10) {
    return this.request(`/search/repositories?q=${encodeURIComponent(query)}&per_page=${perPage}`);
  }

  async getRepoContents(owner: string, repo: string, path: string = '') {
    return this.request(`/repos/${owner}/${repo}/contents/${path}`);
  }

  async writeFile(owner: string, repo: string, path: string, message: string, content: string, branch: string = 'main', sha?: string) {
    // Generar base64 seguro para UTF-8
    const bytes = new TextEncoder().encode(content);
    const binString = Array.from(bytes, (byte) => String.fromCodePoint(byte)).join('');
    const base64Content = btoa(binString);
    
    const body: Record<string, any> = {
      message,
      content: base64Content,
      branch
    };

    if (sha) {
        body.sha = sha;
    }

    return this.request(`/repos/${owner}/${repo}/contents/${path}`, {
      method: 'PUT',
      headers: {
          'Content-Type': 'application/json'
      },
      body: JSON.stringify(body),
    });
  }

  async createPullRequest(owner: string, repo: string, title: string, head: string, base: string, bodyText: string) {
    return this.request(`/repos/${owner}/${repo}/pulls`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title,
        head,
        base,
        body: bodyText
      })
    });
  }
}
