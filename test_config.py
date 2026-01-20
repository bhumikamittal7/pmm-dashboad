#!/usr/bin/env python3
"""
Configuration Test Script
Tests that your GitHub token and repository configuration work correctly.
Run this before deploying to verify your setup.
"""

import os
from dotenv import load_dotenv

# Load environment variables (ignore if .env doesn't exist)
try:
    load_dotenv()
except Exception:
    pass

def test_configuration():
    """Test the configuration setup."""
    print("🔍 Testing Configuration...\n")

    # Check for GitHub token
    github_token = os.getenv("GITHUB_TOKEN", "")
    if github_token:
        masked_token = github_token[:8] + "..." + github_token[-4:] if len(github_token) > 12 else "***"
        print(f"✅ GITHUB_TOKEN found: {masked_token}")

        # Basic token format validation
        if github_token.startswith(('ghp_', 'github_pat_')):
            print("✅ Token format looks correct (GitHub PAT)")
        elif len(github_token) >= 20:
            print("✅ Token format looks correct (long token)")
        else:
            print("⚠️  Token format may be incorrect")
    else:
        print("❌ GITHUB_TOKEN not found in environment variables")
        print("   Make sure to set GITHUB_TOKEN in your .env file")

    # Check for repository configuration
    repository = os.getenv("GITHUB_REPOSITORY", "")
    if repository:
        if '/' in repository and len(repository.split('/')) == 2:
            owner, repo = repository.split('/')
            if owner and repo:
                print(f"✅ GITHUB_REPOSITORY found: {repository}")
            else:
                print("❌ GITHUB_REPOSITORY format invalid (empty owner or repo)")
        else:
            print("❌ GITHUB_REPOSITORY format invalid (should be owner/repo)")
    else:
        # Check alternative format
        owner = os.getenv("GITHUB_OWNER", "")
        repo = os.getenv("GITHUB_REPO", "")
        if owner and repo:
            repository = f"{owner}/{repo}"
            print(f"✅ Repository configured via GITHUB_OWNER + GITHUB_REPO: {repository}")
        else:
            print("❌ Repository not configured")
            print("   Set GITHUB_REPOSITORY=owner/repo OR both GITHUB_OWNER and GITHUB_REPO")

    print("\n📋 Configuration Summary:")
    print(f"   Token: {'✅' if github_token else '❌'}")
    print(f"   Repository: {'✅' if repository else '❌'}")

    if github_token and repository:
        print("\n🎉 Configuration looks good! You can proceed with deployment.")
        print("\nFor Streamlit Cloud deployment:")
        print("1. Add these secrets to your Streamlit Cloud app:")
        print(f"   GITHUB_TOKEN = \"{github_token}\"")
        print(f"   GITHUB_REPOSITORY = \"{repository}\"")
        print("2. Redeploy your app")
    else:
        print("\n❌ Configuration incomplete. Please fix the issues above before deploying.")

if __name__ == "__main__":
    test_configuration()