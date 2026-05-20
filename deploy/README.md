# Deploy — Hostinger VPS (mahjong.irfan-f.com)

Static build output (`dist/`) is served by nginx at `/var/www/mahjong-frontend`. Deploy manually from your machine via SSH/rsync.

| Role | Linux user | Web root | nginx site name | Deploy key (Mac) |
|------|------------|----------|-----------------|------------------|
| This app | `deploy-mahjong` | `/var/www/mahjong-frontend` | `mahjong-front` | `~/.ssh/id_ed25519_mahjong_deploy` |
| Portfolio | `deploy-portfolio` | `/var/www/portfolio-site` | `portfolio-site` | `~/.ssh/id_ed25519_portfolio_deploy` |

Admin tasks (nginx, certbot, backend `CORS_ORIGIN`) use your normal VPS login (e.g. `irf`). API stays on **`https://irfquake.tech`**.

GitHub Actions runs **CI only** (lint, test, build) — it does not deploy. Production hosting is the VPS subdomain only.

## Deploy (every release)

```bash
cp .env.example .env   # Firebase keys for build; local API URL can stay in .env.local
npm run build          # uses .env.production → VITE_API_URL=https://irfquake.tech
rsync -avz --delete \
  -e "ssh -i ~/.ssh/id_ed25519_mahjong_deploy" \
  dist/ deploy-mahjong@YOUR_VPS_IP:/var/www/mahjong-frontend/
```

## One-time VPS setup

### 1. Create `deploy-mahjong` (VPS — SSH as `irf`)

```bash
sudo adduser --disabled-password --gecos "" deploy-mahjong
sudo mkdir -p /home/deploy-mahjong/.ssh
sudo chmod 700 /home/deploy-mahjong/.ssh
```

### 2. Deploy key (your Mac)

```bash
ssh-keygen -t ed25519 -C "mahjong-frontend-deploy" -f ~/.ssh/id_ed25519_mahjong_deploy
cat ~/.ssh/id_ed25519_mahjong_deploy.pub   # paste into authorized_keys on VPS
```

On the VPS:

```bash
sudo nano /home/deploy-mahjong/.ssh/authorized_keys
sudo chmod 600 /home/deploy-mahjong/.ssh/authorized_keys
sudo chown -R deploy-mahjong:deploy-mahjong /home/deploy-mahjong/.ssh
```

### 3. Web root

```bash
sudo mkdir -p /var/www/mahjong-frontend
sudo chown deploy-mahjong:www-data /var/www/mahjong-frontend
sudo chmod 2775 /var/www/mahjong-frontend
```

### 4. nginx (`mahjong-front` site name)

```bash
sudo cp deploy/nginx/mahjong-front.conf /etc/nginx/sites-available/mahjong-front
sudo ln -sf /etc/nginx/sites-available/mahjong-front /etc/nginx/sites-enabled/mahjong-front
sudo nginx -t && sudo systemctl reload nginx
```

Do **not** put `mahjong.irfan-f.com` in `default-catchall` or `portfolio-site`. One vhost only, in `mahjong-front`.

**No cert yet?** Use `deploy/nginx/mahjong-front.http-only.conf`, run `sudo certbot --nginx -d mahjong.irfan-f.com`, then switch to `mahjong-front.conf`.

### 5. Cloudflare DNS + TLS

1. **`mahjong`** → **A** → VPS IPv4 (grey cloud for first certbot if needed).
2. `sudo certbot --nginx -d mahjong.irfan-f.com` (if not already issued).
3. SSL/TLS **Full (strict)** when proxied.

### 6. Backend CORS

On the VPS Mahjong API `.env`:

```bash
CORS_ORIGIN=https://mahjong.irfan-f.com,http://localhost:3001
```

Restart the API container after editing.

### 7. Firebase Auth

**Authentication → Settings → Authorized domains** → include `mahjong.irfan-f.com`.

## Retire GitHub Pages

After VPS is live:

1. **GitHub** → repo **Settings → Pages** → Source: **None** (both `mahjong-frontend` and any org/user site path).
2. Remove `https://irfan-f.github.io` from API `CORS_ORIGIN` if still listed.
3. Optional: remove `irfan-f.github.io` from Firebase authorized domains once you no longer need the old URL.
4. Update links (portfolio, READMEs) to `https://mahjong.irfan-f.com`.

Old URL `https://irfan-f.github.io/mahjong-frontend/` will stop updating; it may 404 until Pages is disabled.

## Verify

```bash
curl -sI --resolve mahjong.irfan-f.com:443:127.0.0.1 https://mahjong.irfan-f.com/
```

Browser: sign in, lobby, game (`/#/...` routes).

## Troubleshooting

| Symptom | Likely fix |
|---------|------------|
| Cloudflare 520 | Origin HTTPS broken; check `mahjong-front` enabled, not duplicate in `default-catchall` |
| `conflicting server name` | Remove mahjong blocks from `default-catchall` / `portfolio-site` |
| Blank page | Wrong build (old `/mahjong-frontend/` base); run `npm run build` and rsync again |
| **Connection refused** / API calls to `localhost:3000` | Rebuild after fixing env: `.env.local` overrides `.env`; production uses `.env.production`. Verify with `strings dist/assets/*.js \| grep irfquake` |
| CORS errors | `CORS_ORIGIN` + API restart |
| Auth fails | Firebase authorized domain `mahjong.irfan-f.com` |
