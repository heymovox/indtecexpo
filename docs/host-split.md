# Host split: public site, login gateway, admin dashboard

The app is served from three hostnames so the public site carries no admin
surface at all.

| Host | Serves | Anything else |
| --- | --- | --- |
| `indtecexpo.com` | Public marketing site | `/admin` and `/api/admin/*` return **404** |
| `secure.indtecexpo.com` | Login form only | Everything else redirects to `/admin/login` |
| `app.indtecexpo.com` | Admin dashboard | Everything else redirects to `/admin` |

## Why a separate gateway

Typing `indtecexpo.com/admin` returns 404 rather than a redirect, so the public
site never confirms that an admin exists. The login form lives on its own host
so the public site serves no admin code at all.

## The session handover

Login happens on `secure.` but the dashboard is on `app.`, so the session cookie
is issued with `Domain=.indtecexpo.com`. It is `HttpOnly`, `Secure` and
`SameSite=Lax` in production. Without that domain the cookie set on `secure.`
would never be sent to `app.` and every login would bounce.

The post-login redirect is the constant `https://app.indtecexpo.com/admin`. It
is never read from the browser, so it cannot be turned into an open redirect.

The login page navigates with `window.location.assign` rather than
`router.push`, because the App Router cannot navigate across origins.

## Required configuration

### 1. DNS

Add three records pointing at the deployment:

| Type | Name | Value |
| --- | --- | --- |
| `A` (or `CNAME`) | `app` | same target as the apex |
| `A` (or `CNAME`) | `secure` | same target as the apex |
| `A` (or `CNAME`) | apex | existing site target |

### 2. Vercel domains

Attach all three hostnames to the project so each reaches this deployment.

### 3. Environment variable

```
NEXT_PUBLIC_APP_ENV=production
```

This is the important one. It is inlined at build time and is what stops the
development host rules from applying. Without it on a production build,
`localhost` and friends would be treated as admin hosts and the admin would be
blocked on the public site.

Rebuild after setting it. Existing environment variables are inherited by newly
attached domains automatically.

## Maintenance mode

The maintenance flag only ever affects `indtecexpo.com`. The gateway and the
dashboard are always exempt, so a public outage can never take the admin
offline and leave you unable to switch it back off.

## Local development

`localhost` and `127.0.0.1` resolve to the **admin** host so `next dev` behaves
as before, and the login form renders locally instead of bouncing to the live
gateway.

| Host header | Treats as |
| --- | --- |
| `localhost`, `127.0.0.1` | admin |
| `admin.localhost`, `admin.indtecexpo.local` | admin |
| `secure.localhost`, `secure.indtecexpo.local` | gateway |
| anything else | public |

To exercise the public site locally, point `indtecexpo.com` at `127.0.0.1` in
your hosts file and request it by name.

### Testing public endpoints locally

`localhost` resolves to the **admin** host, so the public form endpoints
(`/api/visitor-registration`, `/api/contact`, `/api/exhibitor-enquiry`)
correctly return 404 there. To test them you have to present the public Host,
either through the hosts file or with curl:

```bash
# macOS / Linux
curl -X POST http://localhost:3000/api/visitor-registration \
  -H 'Host: indtecexpo.com' \
  -H 'Content-Type: application/json' \
  -d '{"fullName":"Test", ...}'
```

Note that `isSameOrigin` still compares `Origin` against the origin Next.js
saw, which locally is `localhost`. When faking the `Host` header, send
`Origin: http://localhost:3000` as well or the request is rejected with
`403 Request blocked`. This only affects local testing; in production both
headers carry the real domain.