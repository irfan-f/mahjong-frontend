export function githubRepoRootUrl(githubUrl: string): string | null {
  const m = githubUrl.trim().match(/^https?:\/\/github\.com\/([^/]+)\/([^/#?]+)/i);
  if (!m) return null;
  const repo = m[2].replace(/\.git$/i, '');
  return `https://github.com/${m[1]}/${repo}`;
}

export type NewIssueQuery = {
  template?: string;
  title?: string;
  body?: string;
  labels?: string[];
};

export function buildNewIssueUrl(githubRepoUrl: string, query?: NewIssueQuery): string {
  const root = githubRepoRootUrl(githubRepoUrl);
  const base = (root ?? githubRepoUrl.replace(/\/$/, '')) + '/issues/new';
  const url = new URL(base);
  if (query?.template) url.searchParams.set('template', query.template);
  if (query?.title) url.searchParams.set('title', query.title);
  if (query?.body) url.searchParams.set('body', query.body);
  if (query?.labels?.length) url.searchParams.set('labels', query.labels.join(','));
  return url.toString();
}

export function buildGithubIssueTemplateChooserUrl(githubRepoUrl: string): string {
  const root = githubRepoRootUrl(githubRepoUrl);
  const base = (root ?? githubRepoUrl.replace(/\/$/, '')) + '/issues/new/choose';
  return base;
}

export const MAHJONG_REPO_URL = 'https://github.com/irfan-f/mahjong-frontend';
