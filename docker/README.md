# Tallkeep in Docker

Run Tallkeep on a Synology, a Linux server or any computer with Docker. It's the same Tallkeep
as the Windows version (same books, same license, same backups). It keeps running day and night,
whether anyone is signed in or not.

You need: Docker with Docker Compose, a 64-bit Intel/AMD or ARM processor, and 2 GB of memory.

## Start Tallkeep

1. Make a folder for Tallkeep, for example `/volume1/docker/tallkeep` on a Synology.
2. Download [tallkeep-docker.zip](https://raw.githubusercontent.com/sunnyneon/tallkeep-desktop/main/tallkeep-docker.zip)
   and put the files from it in that folder.
3. In docker-compose.yml, change `TZ` to your time zone.
4. In that folder run `docker compose up -d --build` (the first time takes a few minutes).
5. Open `http://<the server>:4600` in a browser, then set up the owner's login and your company.
6. Settings → Plan & computer: paste your license key.

Your books are in the `data` folder next to docker-compose.yml, and the nightly backups in
`backups`. Keep both.

### On a Synology (DSM 7.2 or newer)

1. Package Center: install **Container Manager**.
2. File Station: in the `docker` shared folder, make a folder named `tallkeep`, and upload the 5
   files from [tallkeep-docker.zip](https://raw.githubusercontent.com/sunnyneon/tallkeep-desktop/main/tallkeep-docker.zip) into it.
   Inside `tallkeep`, also make two empty folders: `data` and `backups` (a Synology doesn't make
   them by itself).
3. Container Manager → **Project** → **Create**. Name: `tallkeep`. Path: the folder from step 2.
   Source: **Use existing docker-compose.yml**.
4. Change `TZ` to your time zone if needed, then **Next**, **Next**, **Done**. It builds and starts Tallkeep (the first time takes a few minutes).
5. Open `http://<your Synology>:4600`.

If the Synology firewall is on: Control Panel → Security → Firewall → Edit rules → allow port
4600 from your local network.

## Updates

Settings → Updates shows when a new version is out. **Update now** saves a backup of the books,
then Tallkeep closes and starts again with the new version (a minute or two). Restarting the
container (`docker compose restart`) picks it up too. Updates follow your license's update date.

To stop automatic pick-up of new versions, set `TALLKEEP_AUTO_UPDATE: "0"`; then
`docker compose build --pull && docker compose up -d` updates when you choose.

## Backups and putting the books back

Tallkeep backs up all the books every night to the `backups` folder (the newest 30 are kept). To
keep them on another drive, change `./backups` in docker-compose.yml to that folder (for example
`/volume2/backup/tallkeep:/backups`).

To put the books back: Settings → Nightly backup → **Put back…** next to the backup you want (all
companies, or just one). Tallkeep saves a backup of the books as they are first, so you can undo
it.

## Tallkeep Connect

Works the same as on Windows: Settings → Tallkeep Connect. Nothing to open on the router.

## Moving from Tallkeep for Windows

1. On the Windows office computer: Settings → Nightly backup → **Back up all companies now**.
2. Copy the newest `Tallkeep-Backup-….tkb` file into the `backups` folder here.
3. Here: Settings → Nightly backup → **Put back…** next to that file.
4. Settings → Plan & computer: paste your license key. A license works on one office computer at a
   time; uninstall Tallkeep on the old one, or ask us to move it.

## Settings you can change (docker-compose.yml → environment)

| Setting | What it does |
| --- | --- |
| `TALLKEEP_PUBLIC_URL` | The address(es) shown in Settings for people to open, comma-separated |
| `TZ` | Time zone (for the nightly backup time) |
| `TALLKEEP_AUTO_UPDATE` | `1` picks up new versions when the container starts; `0` doesn't |

Tallkeep uses the server's own network (`network_mode: host`), so other Tallkeep computers in the
office find it by themselves. It uses port 4600; make sure nothing else on the server uses it.
