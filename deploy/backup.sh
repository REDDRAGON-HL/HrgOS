#!/bin/sh
set -eu
umask 077
mkdir -p backups
stamp=$(date -u +%Y%m%dT%H%M%SZ)
docker compose --env-file deploy/.env -f deploy/compose.yml exec -T db pg_dump -U hrg -d hrg_tests > "backups/hrg-tests-$stamp.sql"
sha256sum "backups/hrg-tests-$stamp.sql" > "backups/hrg-tests-$stamp.sql.sha256"
printf '%s\n' "已保存 backups/hrg-tests-$stamp.sql"
