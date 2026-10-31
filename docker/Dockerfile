# Tallkeep in Docker: for a Synology, a Linux server or any computer that runs Docker.
# Build and start with docker compose (see README.md). Everything is downloaded from the
# official sources and checked against its fingerprint.
ARG PG=17
FROM node:22-bookworm-slim AS node
FROM postgres:${PG}-bookworm
ARG PG=17
ARG TALLKEEP_DOWNLOADS=https://raw.githubusercontent.com/sunnyneon/tallkeep-desktop/main

COPY --from=node /usr/local/bin/node /usr/local/bin/node
RUN set -eux; \
    apt-get update; \
    apt-get install -y --no-install-recommends ca-certificates curl xz-utils; \
    rm -rf /var/lib/apt/lists/*

# PostgREST 12.2.3 (Tallkeep's database web service).
RUN set -eux; \
    case "$(dpkg --print-architecture)" in \
      amd64) f=postgrest-v12.2.3-linux-static-x64.tar.xz; sha=9f71269e61ac3a940281e93ff415760f5957e430e475ba4c3889f3ede7d5527c ;; \
      arm64) f=postgrest-v12.2.3-ubuntu-aarch64.tar.xz; sha=4afb4d96aa77b35f7a079b5a692b6284ae4c99c066e9722f73f20fa9368dff8e ;; \
      *) echo "Tallkeep runs on 64-bit Intel/AMD or ARM computers."; exit 1 ;; \
    esac; \
    mkdir -p /opt/tallkeep/bin/pgsql; \
    curl -fsSL -o /tmp/pgrst.tar.xz "https://github.com/PostgREST/postgrest/releases/download/v12.2.3/$f"; \
    echo "$sha  /tmp/pgrst.tar.xz" | sha256sum -c -; \
    tar xJf /tmp/pgrst.tar.xz -C /opt/tallkeep/bin; \
    rm /tmp/pgrst.tar.xz; \
    ln -s "/usr/lib/postgresql/$PG/bin" /opt/tallkeep/bin/pgsql/bin

# The Tallkeep server and app (the same one as in Tallkeep for Windows).
COPY get-server.mjs entrypoint.sh /opt/tallkeep/
RUN set -eux; \
    curl -fsSL -o /tmp/latest.json "$TALLKEEP_DOWNLOADS/latest.json"; \
    file=$(node -p "require('/tmp/latest.json').server.file"); \
    sha=$(node -p "require('/tmp/latest.json').server.sha256"); \
    v=$(node -p "require('/tmp/latest.json').version"); \
    curl -fsSL -o /tmp/server.tgz "$TALLKEEP_DOWNLOADS/v$v/$file"; \
    echo "$sha  /tmp/server.tgz" | sha256sum -c -; \
    mkdir -p /opt/tallkeep/server; \
    tar xzf /tmp/server.tgz -C /opt/tallkeep/server --strip-components=1; \
    rm /tmp/server.tgz /tmp/latest.json; \
    chmod +x /opt/tallkeep/entrypoint.sh

ENV TALLKEEP_DATA=/data \
    TALLKEEP_BACKUPS=/backups \
    TALLKEEP_BIN=/opt/tallkeep/bin \
    TALLKEEP_DOWNLOADS=$TALLKEEP_DOWNLOADS \
    NODE_ENV=production
VOLUME ["/data", "/backups"]
EXPOSE 4600
STOPSIGNAL SIGTERM
HEALTHCHECK --interval=30s --timeout=5s --start-period=120s --retries=3 \
  CMD curl -fsS http://127.0.0.1:4600/tallkeep/health > /dev/null || exit 1
ENTRYPOINT ["/opt/tallkeep/entrypoint.sh"]
