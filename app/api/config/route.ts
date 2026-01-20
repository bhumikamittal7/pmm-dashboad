import { NextResponse } from 'next/server';

export async function GET() {
  // Support both GITHUB_REPOSITORY (owner/repo) and separate GITHUB_OWNER + GITHUB_REPO
  const repository = process.env.GITHUB_REPOSITORY || 
    (process.env.GITHUB_OWNER && process.env.GITHUB_REPO
      ? `${process.env.GITHUB_OWNER}/${process.env.GITHUB_REPO}`
      : null);

  return NextResponse.json({
    repository: repository || null,
    githubTokenConfigured: !!process.env.GITHUB_TOKEN,
  });
}
