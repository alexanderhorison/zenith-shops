# Setting up MCP for GitHub and Vercel

To allow your AI agent (like Cursor or Windsurf) to interact with GitHub and Vercel, you need to configure the **Model Context Protocol (MCP)** servers.

## 1. Install Prerequisites

You verify you have `npx` (comes with Node.js) installed:
```bash
node -v
npm -v
```

## 2. GitHub MCP Server

This allows the agent to search code, read issues, and manage pull requests.

### Configuration (e.g., for Cursor)
Add this to your MCP settings (usually found in Settings > Features > MCP or `~/.cursor/mcp.json`):

```json
{
  "github": {
    "command": "npx",
    "args": [
      "-y",
      "@modelcontextprotocol/server-github"
    ],
    "env": {
      "GITHUB_PERSONAL_ACCESS_TOKEN": "your_github_pat_here"
    }
  }
}
```

> **Note**: You need to generate a [GitHub Personal Access Token (Classic)](https://github.com/settings/tokens) with `repo` scope.

## 3. Vercel MCP Server

This allows the agent to manage deployments and project settings.

### Configuration
Add this to your MCP settings:

```json
{
  "vercel": {
    "command": "npx",
    "args": [
      "-y",
      "@vercel/mcp-server"
    ],
    "env": {
      "VERCEL_API_TOKEN": "your_vercel_token_here"
    }
  }
}
```

> **Note**: You can generate a token in your [Vercel Account Settings > Tokens](https://vercel.com/account/tokens).

## 4. Alternate: CLI Installation (Recommended for Deployment Support)

If you want the agent to specifically help you **run deployment commands directly** (like `vercel deploy`), it is often easier to just install the CLI tools globally on your machine:

```bash
# Install Vercel CLI
npm i -g vercel

# Install GitHub CLI (Homebrew)
brew install gh
```

Once installed and authenticated (`vercel login`, `gh auth login`), the agent can run these tools directly without needing complex MCP bridging.
