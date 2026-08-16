# BDWIN Web Predictor

This is a browser conversion of the prediction logic in the supplied Telegram bot.

## Run locally

```bash
pip install -r requirements.txt
python app.py
```

Open `http://127.0.0.1:5000`.

## Deploy

Deploy the folder to a Python/Flask host such as Render, Railway, or another VPS.
Use the host's start command:

```bash
gunicorn app:app
```

The `/api/live` endpoint proxies the game-history request server-side, avoiding a browser CORS dependency.

## Important

The original source contained Telegram bot credentials and an admin password. They were intentionally NOT copied into this web version. Rotate/revoke those credentials in the original bot before deploying it again.

This is a heuristic predictor dashboard, not an exploit or a guarantee of winning. It does not change BDWIN's server-side result or bypass its security.
