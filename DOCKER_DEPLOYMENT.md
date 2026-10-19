# Docker Deployment

The repository-root `Dockerfile` builds the React frontend and Laravel API into one image. The container listens on `PORT` (default `8080`) and serves both the UI and `/api/v1` from the same origin. PostgreSQL is external; Redis is not required.

## Build and Run

Create a local `.env` using `.env.example`, then set a unique `APP_KEY` and your database connection values. Generate an application key with:

```sh
php artisan key:generate --show
```

Build and run the image:

```sh
docker build -t bit-hrms .
docker run --rm -p 8080:8080 --env-file .env -e PORT=8080 bit-hrms
```

Apply database migrations once before using the app:

```sh
docker run --rm --env-file .env bit-hrms php artisan migrate --force
```

The health endpoint is `/up`.

## Required Runtime Configuration

Set these as environment variables on your container platform. Never commit real credentials or `.env` files.

| Variable | Example / purpose |
| --- | --- |
| `APP_KEY` | Generated Laravel key (`base64:...`) |
| `APP_ENV` | `production` |
| `APP_DEBUG` | `false` |
| `APP_URL` | Public HTTPS URL of the deployed service |
| `DB_CONNECTION` | `pgsql` |
| `DB_HOST` | External PostgreSQL hostname |
| `DB_PORT` | `5432` |
| `DB_DATABASE` | Database name |
| `DB_USERNAME` | Database user |
| `DB_PASSWORD` | Database password |
| `DB_SSLMODE` | `require` for Supabase; use the provider's required setting |
| `CACHE_STORE` | `file` (default for this container) |
| `SESSION_DRIVER` | `file` |
| `QUEUE_CONNECTION` | `sync` |
| `PORT` | Set by many platforms; image defaults to `8080` |

The image includes both PostgreSQL and MySQL PDO drivers. PostgreSQL is the recommended production database. Supabase connection details are available in its project database settings; use its direct connection or a supported pooler and matching port/SSL settings.

## Render

For a regular Render Web Service, connect the Git repository, select **Docker** as the runtime/language, and use the repository-root `Dockerfile`. Leave the Docker build and start command overrides empty: the image defines both. Add the required environment variables above and set the health check path to `/up`. Render supplies `PORT`, which the container honors.

To deploy from `render.yaml`, use **New > Blueprint**. It defines one Docker web service and prompts for the app key, public URL, and external PostgreSQL credentials; it does not provision a database or Redis instance.

Apply migrations before serving traffic. On platforms with a pre-deploy/release command, use `php artisan migrate --force`. Otherwise run that Artisan command once from a one-off container using the same environment variables.

## Password Recovery

Quick Access Testing Roles is disabled by `QUICK_ACCESS_ENABLED = false` in `src/components/LoginPortal.jsx`; the demo code remains available in source. Existing usernames and passwords are unchanged. Do not rerun user seeders when deploying this change, since they can overwrite passwords.

Run `php artisan migrate --force` against the deployed database to create `password_reset_tokens`. This migration does not modify existing accounts.

Configure these runtime variables to deliver password reset links:

| Variable | Purpose |
| --- | --- |
| `APP_URL` | Public HTTPS frontend URL, used in reset links |
| `MAIL_MAILER` | `smtp` |
| `MAIL_HOST` | SMTP provider hostname |
| `MAIL_PORT` | Provider's supported SMTP port |
| `MAIL_SCHEME` | `smtp` for STARTTLS, or `smtps` for implicit TLS |
| `MAIL_USERNAME` | SMTP username |
| `MAIL_PASSWORD` | SMTP password, stored only as a runtime secret |
| `MAIL_FROM_ADDRESS` | Verified sender address |
| `MAIL_FROM_NAME` | `BIT-HRMS` |

On Render free services, standard SMTP ports may be blocked. Use a provider supporting port 2525 if available, or configure a supported HTTPS mail transport instead. The default `log` mailer does not deliver email and must not be used for production recovery. If configuration is cached, rebuild the cache after changing runtime settings.

Users select **Forgot password?**, enter the email registered on their account, and follow the emailed link. Reset tokens expire after 60 minutes and can only be used once. Successful resets revoke existing API tokens. Accounts must be active; response messages do not disclose whether an email exists. Seeded placeholder addresses must be replaced with real, reachable account addresses before recovery can be used for those accounts.

Run the isolated recovery tests with `php vendor/bin/phpunit tests/Feature/PasswordRecoveryTest.php`. They use SQLite in memory, not the configured production database.

## Persistent Uploads

Staff documents are stored on Laravel's local `public` disk at `storage/app/public`. Container filesystems are commonly ephemeral. Attach a persistent volume at `/var/www/html/storage/app/public` or configure durable object storage before relying on uploaded documents in production. This is separate from the external database, which stores document metadata, not file contents.

## Other Docker Platforms

Any platform that builds a repository-root Dockerfile can use the same image. Configure its web process to route traffic to the container's `PORT`, provide the runtime variables above, and run migrations as a release/pre-deploy task. For local persistence, mount the upload volume path described above.
