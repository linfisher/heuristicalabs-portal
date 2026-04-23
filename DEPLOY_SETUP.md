# Deploy Setup — One-Time VPS + GitHub Prep

This document walks you through the **one-time setup** so that every `git push` to `main` auto-deploys to the VPS via GitHub Actions.

**You do this once.** After that, you never touch the VPS to deploy — just push code.

---

## What the pipeline does

On every push to `main`:

1. GitHub Actions starts a short-lived Ubuntu runner.
2. The runner SSHes into your VPS using a dedicated deploy key.
3. On the VPS it runs: `git fetch → git reset --hard origin/main → npm ci → npm run build → pm2 restart portal`.
4. If anything fails, the workflow turns red with the exact error.

No secrets are stored in the repo. The VPS keeps owning `/var/www/portal/.env.local`.

---

## Checklist overview

- [ ] **Step 1** — Generate an SSH deploy key on the VPS
- [ ] **Step 2** — Authorize that key for your VPS user
- [ ] **Step 3** — Make sure the app folder + PM2 process exist
- [ ] **Step 4** — Add GitHub Secrets
- [ ] **Step 5** — Test with a trivial push

---

## Prerequisites (already true on your VPS)

- `/var/www/portal/` exists and is a git clone of `linfisher/heuristicalabs-portal`
- Node.js 20+ and `npm` installed
- `pm2` installed globally (`npm i -g pm2`)
- `.env.local` already populated at `/var/www/portal/.env.local` (stays as-is — GitHub will not touch it)
- Your SSH login `ssh wildcard@160.153.189.109` already works from your laptop

If any of those are false, fix them before continuing.

---

## Step 1 — Generate the deploy key (on the VPS)

SSH in as your normal user:

```bash
ssh wildcard@160.153.189.109
```

Then run these commands **on the VPS**:

```bash
# Create a fresh key dedicated to GitHub Actions
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/gh_actions_deploy -N ""

# Show the PUBLIC key (safe to share) — copy this whole line
cat ~/.ssh/gh_actions_deploy.pub

# Show the PRIVATE key (SECRET — treat like a password)
cat ~/.ssh/gh_actions_deploy
```

You should see two outputs:

- **Public key**: one line starting with `ssh-ed25519 AAAA…`
- **Private key**: a multi-line block starting with `-----BEGIN OPENSSH PRIVATE KEY-----` and ending with `-----END OPENSSH PRIVATE KEY-----`

Keep this terminal open — you'll paste the private key into GitHub in Step 4.

---

## Step 2 — Authorize the key (still on the VPS)

Add the public key to the list of keys that are allowed to log in as `wildcard`:

```bash
# Append the new public key to authorized_keys
cat ~/.ssh/gh_actions_deploy.pub >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
chmod 700 ~/.ssh
```

Quick sanity check — from your **laptop**, try to SSH in using only this key:

```bash
# Copy the private key from the VPS to your laptop temporarily
scp wildcard@160.153.189.109:~/.ssh/gh_actions_deploy /tmp/test_deploy_key
chmod 600 /tmp/test_deploy_key
ssh -i /tmp/test_deploy_key wildcard@160.153.189.109 "echo OK from deploy key"
rm /tmp/test_deploy_key
```

If that prints `OK from deploy key`, the key works.

---

## Step 3 — Confirm app folder + PM2 process

**On the VPS**, confirm the app is already set up the way the pipeline expects:

```bash
cd /var/www/portal
git remote -v           # should show linfisher/heuristicalabs-portal
git status              # should be on 'main' and clean
ls .env.local           # should exist
pm2 list                # should show a process named 'portal' online
```

If the PM2 process doesn't exist yet, start it once manually:

```bash
cd /var/www/portal
npm ci --prefer-offline
npm run build
pm2 start npm --name portal -- start -- -p 3001
pm2 save
# Run this once so PM2 restarts on reboot
pm2 startup systemd -u wildcard --hp /home/wildcard
# (copy and run the command it prints)
```

After this, `pm2 list` must show `portal` as `online`.

---

## Step 4 — Add GitHub Secrets

Go to: **https://github.com/linfisher/heuristicalabs-portal/settings/secrets/actions**

Click **"New repository secret"** and add these one at a time:

| Secret name | Value | Notes |
|---|---|---|
| `VPS_HOST` | `160.153.189.109` | The VPS IP address |
| `VPS_USER` | `wildcard` | Your SSH username |
| `VPS_SSH_KEY` | *paste the full private key* | From Step 1. Include the `-----BEGIN…` and `-----END…` lines. No extra spaces. |
| `VPS_PORT` | `22` | Optional — only add if you use a non-standard port |
| `VPS_APP_PATH` | `/var/www/portal` | Optional — defaults to this if omitted |
| `PM2_APP_NAME` | `portal` | Optional — defaults to this if omitted |

**Required**: `VPS_HOST`, `VPS_USER`, `VPS_SSH_KEY`. The rest have sensible defaults.

⚠️ **After you paste the private key into GitHub, delete it from the VPS terminal scrollback** (`clear` the screen or close the terminal) and do NOT email/paste it anywhere else.

---

## Step 5 — Test deploy

Back on your laptop in this repo:

```bash
# Merge this setup branch into main (if you haven't yet)
git checkout main
git merge claude/setup-deploy-pipeline-pj7YV
git push origin main
```

Then watch the run at:
**https://github.com/linfisher/heuristicalabs-portal/actions**

A successful run looks like:
- ✅ Check required secrets
- ✅ Set up SSH key
- ✅ Deploy over SSH (the long step — this pulls, builds, restarts)
- ✅ Cleanup SSH key

After green, visit https://heuristicalabs.com and confirm the site is up.

---

## Troubleshooting

**"Permission denied (publickey)"**
→ The private key in `VPS_SSH_KEY` doesn't match what's in `authorized_keys` on the VPS. Redo Steps 1–2. Make sure you copied the **whole** private key including the BEGIN/END lines.

**"ssh-keyscan returned no host key"**
→ The VPS isn't reachable from GitHub's runner, or the port is wrong. Verify `VPS_HOST` is correct and SSH is listening on port 22.

**"PM2 process 'portal' not found"**
→ Step 3 wasn't completed. SSH in and run the `pm2 start` block.

**Build fails with "Cannot find module" or env var errors**
→ `/var/www/portal/.env.local` is missing a variable. Check against `.env.local.example` in the repo.

**The deploy succeeds but the site shows old content**
→ PM2 restarted but didn't pick up new env vars. The workflow uses `--update-env`, but if you changed `.env.local` you may need `pm2 delete portal && pm2 start npm --name portal -- start -- -p 3001 && pm2 save`.

**Actions run succeeds but site is down (502 from nginx)**
→ Check `pm2 logs portal` on the VPS for the real error.

---

## How to disable / re-enable the pipeline

- **Pause it**: rename `.github/workflows/deploy.yml` → `deploy.yml.disabled` and push.
- **Revoke access**: on the VPS, remove the `github-actions-deploy` line from `~/.ssh/authorized_keys`. GitHub can no longer SSH in until you re-add a key.

---

## Security notes

- The deploy key **only** authorizes login as `wildcard` on this one VPS. It has no access to anything else.
- If you ever suspect the key leaked, delete the line from `~/.ssh/authorized_keys` on the VPS — that instantly revokes it — then redo Steps 1–2 and update the `VPS_SSH_KEY` secret in GitHub.
- `.env.local` stays on the VPS and is never read by GitHub Actions. Secrets never transit the CI runner.
