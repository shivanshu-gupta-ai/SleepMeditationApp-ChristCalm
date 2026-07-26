# Contributing to ChristCalm

You can explore the app and improve **onboarding, themes, screens, and UX** without touching the owner’s AWS account. Infra stays on the owner’s AWS (Lambda, Cognito, DynamoDB, Bedrock, SSM).

---

## Two different “config” systems (read this once)

| System | What it is | Stores app `EXPO_PUBLIC_*`? | For contributors |
|--------|------------|----------------------------|------------------|
| **[GitHub MCP Server](https://github.com/github/github-mcp-server)** | AI tools for PRs, issues, code, Actions | **No** | Optional — helps AI open PRs / review |
| **GitHub Actions Variables** | Public repo settings (Settings → Secrets and variables → Actions → **Variables**) | **Yes (public only)** | **Yes** — `./scripts/sync-env-from-github.sh` |
| **GitHub Secrets** | Encrypted CI secrets | Only if you put them there (avoid for Apple/AWS private keys) | CI only; values not readable after save |
| **Owner AWS SSM** | Real secrets + stack | No (server-side) | **No access needed** |

**Bottom line:** store **public** client config (`EXPO_PUBLIC_*`) as GitHub **Variables**. Keep Apple `.p8`, JWT, AWS keys on the **owner’s SSM** only. The GitHub MCP server is for collaboration (issues/PRs), not for shipping env files to laptops.

---

## Quick start (friend / collaborator)

### 1. Tools

- Git, Node 20+, npm  
- [GitHub CLI](https://cli.github.com/) (`gh`)  
- Optional: Expo Go on a phone  

### 2. Clone & branch

```bash
git clone https://github.com/shivanshu-gupta-ai/SleepMeditationApp-ChristCalm.git
cd SleepMeditationApp-ChristCalm
git checkout main && git pull
git checkout -b feature/your-change-name
```

### 3. Point the app at the shared backend (owner’s AWS)

```bash
gh auth login          # once
./scripts/sync-env-from-github.sh
```

This writes **gitignored** `frontend/.env` from GitHub Actions Variables (API URL, Cognito public IDs, public RevenueCat keys). **No AWS login.**

### 4. Run & explore

```bash
cd frontend
npm install
npx expo start
```

| Test login | Password |
|------------|----------|
| `test@christcalm.dev` | `Test1234` |

Explore onboarding, home, meditations, journal, Wisdom, etc. Traffic hits the **owner’s** API and Cognito.

### 5. Change UI safely

| Goal | Where |
|------|--------|
| Onboarding flow | `frontend/app/onboarding.tsx`, `frontend/src/features/onboarding/` |
| Colors / theme | `frontend/src/theme/`, `frontend/src/context/ThemeContext.tsx` |
| Screens / tabs | `frontend/app/(tabs)/`, `frontend/src/components/ui/` |

### 6. Push a feature branch & open a PR

```bash
git add -A
git status   # confirm no .env / secrets
git commit -m "Describe the UX change."
git push -u origin HEAD
gh pr create --base main --fill
```

Owner reviews and merges. Revert is easy via the merge commit on `main`.

---

## What you must not do

- Do **not** run `./scripts/deploy-aws.sh`, Terraform, or bootstrap  
- Do **not** commit `frontend/.env`, `backend/.env`, `*.tfvars`, Apple `.p8`  
- Do **not** put AWS access keys or Apple private keys in GitHub Variables (use **Secrets** only for CI if ever needed — owner owns that)  
- Prefer **feature branches + PRs** over pushing to `main`  

---

## Owner-only (infra + env refresh)

```bash
# After Cognito/API changes on AWS:
./scripts/sync-env-from-aws.sh          # refresh local public .env from SSM/outputs
./scripts/push-env-to-github.sh         # publish public vars for collaborators

# Backend code (owner laptop only):
./scripts/deploy-aws.sh code
```

Test user reset: `./scripts/seed-test-user.sh`

---

## GitHub MCP (optional, for AI agents)

Project configs (no secrets committed):

| Host | Config |
|------|--------|
| **Grok** | `.grok/config.toml` → `[mcp_servers.github]` remote URL |
| **VS Code / Copilot** | `.vscode/mcp.json` |

Remote server: `https://api.githubcopilot.com/mcp/`  
Docs: [github/github-mcp-server](https://github.com/github/github-mcp-server)

**Auth:** OAuth in the IDE, or a Personal Access Token in the host’s credential store (`repo` scope). Each person uses **their own** GitHub login — never commit a PAT.

**What agents can do with it:** list/create PRs, issues, comment, read CI status, search code.  
**What it does not do:** inject `frontend/.env` onto a laptop (use `sync-env-from-github.sh` for that).

Local Docker alternative (if remote OAuth is unavailable):

```json
{
  "command": "docker",
  "args": ["run", "-i", "--rm", "-e", "GITHUB_PERSONAL_ACCESS_TOKEN", "ghcr.io/github/github-mcp-server"],
  "env": { "GITHUB_PERSONAL_ACCESS_TOKEN": "${GITHUB_PERSONAL_ACCESS_TOKEN}" }
}
```

---

## Architecture reminder

```
Collaborator laptop                 Owner AWS (shared for all UI work)
┌──────────────────────┐            ┌─────────────────────────┐
│ Expo (feature branch)│── HTTPS ──►│ API Gateway + Lambda    │
│ GitHub Variables →   │            │ Cognito + DynamoDB      │
│   frontend/.env      │            │ Bedrock / S3 / SSM      │
└──────────────────────┘            └─────────────────────────┘
         │
         └── PR → main (owner merges)
```
