# Deployment Guide

This document covers how to deploy the project for the first time and how to switch domains later.

The app runs as two Docker containers (backend on port 3001, frontend on port 3000) behind Caddy as a reverse proxy on the host.

---

## Architecture overview

```
Internet
  └── Caddy (host, port 80/443, TLS termination)
        ├── misc2026.dulare.com  → localhost:3000  (Next.js frontend)
        └── misc2026-be.dulare.com → localhost:3001 (Express backend)

Server
  ├── Docker container: frontend  (Next.js, port 3000)
  └── Docker container: backend   (Express + SQLite, port 3001)
        └── volume: ~/misc2026/database/
```

Deployments are triggered by pushing to `master`. GitHub Actions SSHs into the server and the server runs `deploy-upgrade.sh` (forced-command pattern), which does a `git pull` + `docker compose up --build`.

---

## Server prerequisites

- Ubuntu 24
- Docker Engine + Docker Compose plugin (`docker compose` v2)
- Git
- Caddy (installed on the host, not in Docker)
- A `deploy` user who is a member of the `docker` group

To add an existing user to the docker group:
```bash
sudo usermod -aG docker deploy
```

---

## GitHub repository secrets

Add the following secrets in the repository settings under **Settings > Secrets and variables > Actions**:

| Secret | Value |
|--------|-------|
| `MISC2026_SSH_HOST` | Server IP address or hostname |
| `MISC2026_SSH_USER` | Deploy user on the server (e.g. `deploy`) |
| `MISC2026_SSH_PRIVATE_KEY` | Private SSH key used by GitHub Actions (see key setup below) |
| `MISC2026_SSH_PORT` | SSH port (usually `22`) |

---

## SSH key setup (forced-command pattern)

Generate a dedicated key pair for GitHub Actions - do not reuse any existing key:

```bash
ssh-keygen -t ed25519 -C "github-actions-misc2026" -f ~/.ssh/misc2026_deploy
```

On the server, add the public key to `~deploy/.ssh/authorized_keys` with a forced command so this key can only trigger deployments:

```
command="/home/deploy/misc2026/deploy-upgrade.sh",no-port-forwarding,no-X11-forwarding,no-agent-forwarding ssh-ed25519 AAAA...your-public-key...
```

Add the **private** key (`~/.ssh/misc2026_deploy`) as the `MISC2026_SSH_PRIVATE_KEY` GitHub secret (paste the full content including the `-----BEGIN...` and `-----END...` lines).

---

## First-time deployment

### 1. Clone the repository on the server

```bash
ssh deploy@your-server
git clone git@github.com:your-org/misc-nextjs-express.git ~/misc2026
cd ~/misc2026
chmod +x deploy-upgrade.sh
```

### 2. Create the production `.env` file

```bash
cp .env.example .env
nano .env
```

Set these values (all others can stay at their defaults or be filled in as needed):

```env
# Do NOT include COMPOSE_FILE= here (that is only for local dev)

NODE_ENV=production
PORT=3001
FRONTEND_PORT=3000

WEBSITE_URL=https://misc2026.dulare.com
API_URL=https://misc2026-be.dulare.com
GOOGLE_CALLBACK_URL=https://misc2026-be.dulare.com/auth/google/callback

COOKIE_DOMAIN=.dulare.com
SESSION_SECRET=<generate with: openssl rand -hex 32>

SMTP_HOST=your-smtp-host
SMTP_PORT=587
SMTP_USER=your-smtp-user
SMTP_PASS=your-smtp-password
SMTP_FROM=noreply@dulare.com

# Optional: Google OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Optional: Backblaze B2
BACKBLAZE_KEY_ID=
BACKBLAZE_APPLICATION_KEY=
BACKBLAZE_BUCKET_ID=
BACKBLAZE_PUBLIC_URL=
```

### 3. Build and start the containers

```bash
docker compose up --build -d
```

### 4. Seed the initial admin user

Run once after the first start:

```bash
docker compose exec backend pnpm seed
```

Follow the prompts to create the admin account.

### 5. Configure Caddy

Add two site blocks to `/etc/caddy/Caddyfile` (or a new file in `/etc/caddy/sites/`):

```caddy
misc2026.dulare.com {
    reverse_proxy localhost:3000
}

misc2026-be.dulare.com {
    reverse_proxy localhost:3001
}
```

Reload Caddy:

```bash
sudo systemctl reload caddy
```

Caddy will automatically obtain and renew TLS certificates via Let's Encrypt once DNS is pointed at the server.

### 6. Verify

```bash
curl https://misc2026-be.dulare.com/health
# Expected: {"status":"ok"}
```

Open `https://misc2026.dulare.com` in a browser and confirm the frontend loads and login works.

---

## Ongoing deployments

Push to `master` - the GitHub Actions workflow connects via SSH, the forced command on the server runs `deploy-upgrade.sh`, which:

1. Fetches and hard-resets to `origin/master`
2. Stops all containers (`docker compose down`)
3. Rebuilds images and starts containers (`docker compose up --build -d`)
4. Verifies at least one container is running

Docker build output and container status are visible in the GitHub Actions log.

---

## Switching to permanent domains (misc.dulare.com)

When the old `misc.dulare.com` site is decommissioned and data is migrated, follow these steps:

### 1. Update `.env` on the server

```bash
ssh deploy@your-server
cd ~/misc2026
nano .env
```

Change:
```env
WEBSITE_URL=https://misc.dulare.com
API_URL=https://misc-be.dulare.com
GOOGLE_CALLBACK_URL=https://misc-be.dulare.com/auth/google/callback
```

### 2. Update Caddy

Replace the `misc2026` blocks with the permanent domains:

```caddy
misc.dulare.com {
    reverse_proxy localhost:3000
}

misc-be.dulare.com {
    reverse_proxy localhost:3001
}
```

Reload Caddy:
```bash
sudo systemctl reload caddy
```

### 3. Update DNS

Point `misc.dulare.com` and `misc-be.dulare.com` A records to the server IP.

### 4. Update Google OAuth (if used)

In the Google Cloud Console, add `https://misc-be.dulare.com/auth/google/callback` as an authorised redirect URI.

### 5. Trigger a rebuild

The frontend image must be rebuilt because `API_URL` is baked in at build time. Either push a commit to `master` or run the deploy script manually:

```bash
ssh deploy@your-server
cd ~/misc2026
./deploy-upgrade.sh
```

### 6. Verify

```bash
curl https://misc-be.dulare.com/health
# Expected: {"status":"ok"}
```

Open `https://misc.dulare.com` and confirm everything works.

Once confirmed, you can remove the `misc2026` Caddy blocks and let the certificates for those domains expire.

---

## Troubleshooting

**Containers not starting**
```bash
docker compose logs backend
docker compose logs frontend
```

**Check running containers**
```bash
docker compose ps
```

**Restart without rebuild**
```bash
docker compose restart
```

**Rebuild and restart a single service**
```bash
docker compose up --build -d backend
```

**Check Caddy logs**
```bash
sudo journalctl -u caddy -f
```
