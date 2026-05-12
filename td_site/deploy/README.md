# TD Site Production Deploy

Production domain: https://td-energoeffect.ru

## Stack

- Ubuntu 22.04
- Nginx
- Gunicorn
- Django
- React / Vite
- SQLite MVP
- Let's Encrypt SSL

## Paths

Project:

/var/www/td_site/td_site

Backend:

/var/www/td_site/td_site/backend

Frontend:

/var/www/td_site/td_site/frontend

Nginx config:

/etc/nginx/sites-available/td_site

Systemd service:

/etc/systemd/system/td_site.service

## Update backend

cd /var/www/td_site
git pull

cd /var/www/td_site/td_site/backend
source .venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py collectstatic --noinput
systemctl restart td_site

## Update frontend

cd /var/www/td_site/td_site/frontend
npm install
npm run build
systemctl restart nginx

## Check services

systemctl status td_site
systemctl status nginx
nginx -t

## SSL

SSL was issued with Certbot:

certbot --nginx -d td-energoeffect.ru -d www.td-energoeffect.ru

Auto-renewal is configured by Certbot.
