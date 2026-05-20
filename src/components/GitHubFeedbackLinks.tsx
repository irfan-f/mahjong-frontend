import { buildGithubIssueTemplateChooserUrl, MAHJONG_REPO_URL } from '../lib/githubIssues';

const linkClass =
  'text-xs font-medium text-muted hover:text-on-surface underline-offset-2 hover:underline';

const mahjongFeedbackIssuesUrl = buildGithubIssueTemplateChooserUrl(MAHJONG_REPO_URL);
const feedbackTitle =
  'Report feedback or bugs for Mahjong with Friends on GitHub (opens in a new tab — choose a template)';

export function GitHubFeedbackLinks({ className }: { className?: string }) {
  return (
    <a
      href={mahjongFeedbackIssuesUrl}
      className={['inline-flex', linkClass, className].filter(Boolean).join(' ')}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={feedbackTitle}
      title={feedbackTitle}
    >
      Report feedback
    </a>
  );
}
