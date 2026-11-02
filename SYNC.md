# Data Sync Pipeline

This document describes how Awesome Agent Skills automatically stays up-to-date by syncing from multiple upstream sources.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    GitHub Actions (cron)                  │
│                                                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐              │
│  │ GitHub   │  │ MCP      │  │ Web      │              │
│  │ Awesome  │  │ Registry │  │ Scrapers │              │
│  │ Lists    │  │ API      │  │          │              │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘              │
│       │              │              │                    │
│       └──────────────┼──────────────┘                    │
│                      │                                   │
│              ┌───────▼───────┐                           │
│              │   Normalize   │                           │
│              │   & Dedupe    │                           │
│              └───────┬───────┘                           │
│                      │                                   │
│              ┌───────▼───────┐                           │
│              │  data/*.json  │                           │
│              └───────┬───────┘                           │
│                      │                                   │
│              ┌───────▼───────┐                           │
│              │  Generate     │                           │
│              │  README.md    │                           │
│              └───────────────┘                           │
└─────────────────────────────────────────────────────────┘
```

## Data Sources

### Tier 1: API-based (most reliable)

| Source | Method | Frequency | Script |
|--------|--------|-----------|--------|
| Official MCP Registry | REST API | Daily | `scripts/sync-mcp-registry.js` |
| GitHub API (stars, metadata) | GraphQL | Daily | `scripts/sync-github-stars.js` |

### Tier 2: Structured data (reliable)

| Source | Method | Frequency | Script |
|--------|--------|-----------|--------|
| GitHub awesome-lists | Markdown parsing | Daily | `scripts/sync-awesome-lists.js` |
| toolsdk-mcp-registry | JSON configs | Daily | `scripts/sync-toolsdk.js` |
| LobeChat plugins | JSON index | Weekly | `scripts/sync-lobechat.js` |

### Tier 3: Web scraping (less reliable)

| Source | Method | Frequency | Script |
|--------|--------|-----------|--------|
| MCP.so | Supabase/scrape | Weekly | `scripts/sync-mcpso.js` |
| SkillsMP | Web scrape | Weekly | `scripts/sync-skillsmp.js` |
| cursor.directory | Git clone | Weekly | `scripts/sync-cursor-directory.js` |

## Data Format

All synced data is normalized to JSON in `data/`:

```json
{
  "id": "unique-skill-id",
  "name": "Skill Name",
  "description": "Short description",
  "url": "https://github.com/owner/repo",
  "category": "mcp-server|agent-skill|cursor-rule|...",
  "platforms": ["claude-code", "codex-cli", "gemini-cli"],
  "source": "awesome-mcp-servers",
  "stars": 1234,
  "lastUpdated": "2026-02-27T00:00:00Z",
  "license": "MIT",
  "tags": ["database", "postgresql"]
}
```

## Running Locally

```bash
# Install dependencies
npm install

# Run all syncs
npm run sync

# Run specific sync
node scripts/sync-awesome-lists.js

# Test orchestration with local stub scripts only (no sync/network)
npm run test:sync-runner
```

## GitHub Actions

The sync runs automatically via `.github/workflows/sync.yml`:
- **Daily**: Tier 1 & 2 sources (API + structured data)
- **Weekly**: Tier 3 sources (web scraping)
- **On PR**: Validates links and format


### Runner failure behavior

The runner invokes scripts with the current Node executable and argv, without a shell, so checkout paths with spaces or shell metacharacters remain literal. It continues later sources after an error, but exits nonzero if any child fails, is signaled, times out or cannot start. This intentionally replaces the former false-success result. The nonexistent `generate-readme.js` command has been removed; no README generator is provided by this snapshot. These runner fixtures do not validate remote data sources or the web application.
