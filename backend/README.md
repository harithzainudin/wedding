# Wedding Backend

SST v3 backend with AWS Lambda, API Gateway, and DynamoDB.

## Prerequisites

- Node.js 18+
- pnpm
- AWS credentials configured

## Setup

1. Install dependencies:
   ```bash
   pnpm install
   ```

2. Set the admin password secret (required for each stage):
   ```bash
   # For dev stage
   pnpm sst secret set AdminPassword 'your-secure-password'

   # For prod stage
   pnpm sst secret set AdminPassword 'your-secure-password' --stage prod
   ```

## Deployment

### Development
```bash
# Start local development with live reload
pnpm dev

# Deploy to dev stage
pnpm deploy
```

### Production
```bash
pnpm deploy:prod
```

### New Stage Deployment

When deploying to a new stage (e.g., `staging`):

1. Set the admin password secret for the new stage:
   ```bash
   pnpm sst secret set AdminPassword 'your-secure-password' --stage staging
   ```

2. Deploy to the new stage:
   ```bash
   pnpm sst deploy --stage staging
   ```

## Secrets Management

Secrets are stored in AWS SSM Parameter Store under the path:
```
/sst/<app-name>/<stage>/Secret/<secret-name>/value
```

### View current secret value
```bash
# Dev stage
pnpm sst secret list

# Specific stage
pnpm sst secret list --stage prod
```

### Update a secret
```bash
pnpm sst secret set AdminPassword 'new-password' --stage prod
```

After updating a secret, redeploy the affected functions:
```bash
pnpm sst deploy --stage prod
```

## Admin Authentication

The admin system supports two authentication methods:

1. **Master Login** (for initial setup)
   - Username: `master`
   - Password: The `AdminPassword` secret value
   - Use this to create the first admin user

2. **Regular Admin Users** (stored in DynamoDB)
   - Created via the admin dashboard
   - Passwords are hashed with bcrypt
   - Can be managed (create/delete) from the dashboard

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/rsvp` | Submit RSVP |
| GET | `/rsvp` | List all RSVPs |
| POST | `/admin/login` | Admin login |
| POST | `/admin/users` | Create admin user |
| GET | `/admin/users` | List admin users |
| DELETE | `/admin/users/{username}` | Delete admin user |

## DynamoDB Schema

Single table design with the following patterns:

### RSVP Records
| Key | Pattern | Example |
|-----|---------|---------|
| PK | `RSVP#<uuid>` | `RSVP#abc123` |
| SK | `METADATA` | `METADATA` |
| GSI1PK | `STATUS#<status>` | `STATUS#attending` |

### Admin Records
| Key | Pattern | Example |
|-----|---------|---------|
| PK | `ADMIN#<username>` | `ADMIN#john` |
| SK | `PROFILE` | `PROFILE` |
| GSI1PK | `ADMIN` | `ADMIN` |

## Troubleshooting

### "Secret not found" error
Make sure you've set the `AdminPassword` secret for the stage you're deploying to:
```bash
pnpm sst secret set AdminPassword 'your-password' --stage <stage>
```

### CORS errors
Check that your frontend URL is in the allowed origins in `infra/api.ts`.

### Remove a stage
```bash
pnpm sst remove --stage <stage>
```
