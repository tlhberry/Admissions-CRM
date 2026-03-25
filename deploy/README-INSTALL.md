─────────────────────────────────────────────────────────────────────────────────────────────────────–───────────────────────────────────────────────────────────────────────────────────────────────────–───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────# AdmitSimple – Self-Hosted Installation Guide

## Prerequisites

- Ubuntu 22.04 LTS (or compatible)
- Docker Engine 24+ with the Compose plugin (`docker compose`)
- A domain name with DNS A-record pointing to your server's public IP
- Ports 80 and 443 open in your firewall

## Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/tlhberry/Admissions-CRM.git admitsimple
cd admitsimple/deploy

# 2. Copy and fill in the environment template
cp .env.template .env
nano .env   # fill in every CHANGE_ME value

# 3. Run the setup script (handles SSL, builds, migrations, seed)
bash setup.sh
```

After setup completes, open `https://YOUR_DOMAIN` in your browser.

## Environment Variables

See `.env.template` for a full list with descriptions. The minimum required variables are:

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `SESSION_SECRET` | 64-char random string (use `openssl rand -base64 64`) |
| `POSTGRES_PASSWORD` | Password for the Postgres container |
| `DOMAIN` | Your public domain (e.g. `app.example.com`) |
| `ANTHROPIC_API_KEY` | Anthropic API key for AI features (optional) |

## Architecture

```
Internet
  └── Nginx (port 80/443, SSL termination, rate limiting)
          └── Node.js app (port 5000, internal only)
                        └── PostgreSQL (internal only)
                        ```

                        ## AI Features (HIPAA)

                        All data sent to Anthropic is de-identified via `server/lib/deidentify.ts`
                        before leaving the server. The `ai_logs` table records token usage for
                        audit purposes. AI can be disabled per-center via `center_config.ai_enabled`.

                        ## Database Migrations

                        After upgrading the codebase:

                        ```bash
                        cd deploy
                        docker compose exec app npm run db:push
                        ```

                        ## Updating

                        ```bash
                        git pull
                        docker compose build --no-cache
                        docker compose up -d
                        docker compose exec app npm run db:push
                        ```

                        ## HIPAA Checklist

                        - [ ] SSL/TLS enabled (TLSv1.2+ only)
                        - [ ] `SESSION_SECRET` is unique and random
                        - [ ] Database not exposed to public internet
                        - [ ] Audit logs enabled (`auditLogs` table, `hipaaAuditMiddleware`)
                        - [ ] AI de-identification active (`deidentifyInquiry` used in `aiRoutes.ts`)
                        - [ ] Backups configured for the `postgres_data` Docker volume
                        - [ ] Access logs reviewed regularly

                        ## Troubleshooting

                        **App won't start:** Check `docker compose logs app` for missing env vars.

                        **SSL certificate fails:** Ensure port 80 is open and DNS is propagated.

                        **Database migrations fail:** Check `docker compose logs db` for Postgres errors.

                        ## Support

                        Open an issue at https://github.com/tlhberry/Admissions-CRM/issues
