# deploy/setup.sh
# One-shot setup for AdmitSimple on Ubuntu 22.04
# Usage: bash setup.sh
set -eu

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ENV_FILE="$SCRIPT_DIR/.env"

if [ ! -f "$ENV_FILE" ]; then
  cp "$SCRIPT_DIR/.env.template" "$ENV_FILE"
  echo "Edit $ENV_FILE, replace CHANGE_ME values, then re-run."
  exit 1
fi

set -a; source "$ENV_FILE"; set +a

for var in DATABASE_URL SESSION_SECRET POSTGRES_PASSWORD DOMAIN; do
  val="$(eval echo '$'$var)"
  [ -z "$val" ] && { echo "ERROR: $var not set"; exit 1; }
done

NGINX="$SCRIPT_DIR/nginx.conf"
grep -q "YOUR_DOMAIN" "$NGINX" 2>/dev/null && sed -i "s/YOUR_DOMAIN/$DOMAIN/g" "$NGINX"

echo "Starting services..."
docker compose --env-file "$ENV_FILE" -f "$SCRIPT_DIR/docker-compose.yml" up -d --build

echo "Running migrations..."
docker compose --env-file "$ENV_FILE" -f "$SCRIPT_DIR/docker-compose.yml" exec -T app npm run db:push

echo "Done. Visit: https://$DOMAIN"
