# GitHub Dorks - Comprehensive Collection

Expert-level GitHub search queries for OSINT, security research, and exposed credentials hunting.

## Table of Contents

- [Basic Search Operators](#basic-search-operators)
- [Advanced Search Operators](#advanced-search-operators)
- [AWS Keys & Secrets](#aws-keys--secrets)
- [API Keys & Tokens](#api-keys--tokens)
- [Database Credentials](#database-credentials)
- [Private Keys & Certificates](#private-keys--certificates)
- [Configuration Files](#configuration-files)
- [Environment Files](#environment-files)
- [Cloud Platform Credentials](#cloud-platform-credentials)
- [Email & SMTP Credentials](#email--smtp-credentials)
- [OAuth & Authentication](#oauth--authentication)
- [Payment Gateway Keys](#payment-gateway-keys)
- [Third-Party Service Keys](#third-party-service-keys)
- [Internal Network Information](#internal-network-information)
- [Passwords in Code](#passwords-in-code)
- [Backup & SQL Files](#backup--sql-files)
- [Mobile App Secrets](#mobile-app-secrets)
- [Hardcoded URLs & Endpoints](#hardcoded-urls--endpoints)
- [Debug & Error Messages](#debug--error-messages)
- [Organization-Specific Searches](#organization-specific-searches)
- [Language-Specific Searches](#language-specific-searches)
- [Time-Based Searches](#time-based-searches)
- [Advanced Query Combinations](#advanced-query-combinations)

---

## Basic Search Operators

```
filename:       Search by filename
extension:      Search by file extension
path:           Search in specific path
language:       Filter by programming language
user:           Search in user's repositories
org:            Search in organization repositories
repo:           Search in specific repository
size:           Filter by file size
stars:          Filter by star count
forks:          Filter by fork count
created:        Filter by creation date
pushed:         Filter by last push date
topic:          Search by repository topic
license:        Filter by license
is:             Filter by public/private/fork
archived:       Include archived repositories
```

---

## Advanced Search Operators

```
in:file         Search in file contents
in:path         Search in file path
in:name         Search in repository name
in:description  Search in description
in:readme       Search in README

NOT             Exclude term
OR              Either term
""              Exact match
..              Range (for numbers/dates)
>               Greater than
>=              Greater than or equal
<               Less than
<=              Less than or equal
```

---

## AWS Keys & Secrets

### AWS Access Keys

```
filename:.env AWS_ACCESS_KEY_ID
extension:env AWS_SECRET_ACCESS_KEY
filename:credentials aws_access_key_id
"AKIA" extension:json
"aws_access_key_id"
"aws_secret_access_key"
AKIA[0-9A-Z]{16}
AWS_ACCESS_KEY_ID language:python
AWS_SECRET extension:yml
filename:config.php AWS_SECRET_ACCESS_KEY
```

### AWS-Specific Files

```
filename:aws_credentials
filename:.aws/credentials
path:.aws/ credentials
filename:config.yml AWS
extension:json "aws_access_key_id"
filename:terraform.tfvars aws
```

### AWS S3 Buckets

```
filename:s3cfg
extension:s3cfg
s3.amazonaws.com
"s3://" language:bash
filename:aws_s3_config
```

---

## API Keys & Tokens

### Generic API Keys

```
"api_key" extension:json
"apikey" extension:yml
"api_secret"
"apiSecret"
filename:api_key
api_key language:javascript
"Authorization: Bearer"
"X-API-Key"
api_token language:python
```

### GitHub Tokens

```
filename:.env GITHUB_TOKEN
"github_token"
"GH_TOKEN"
"GITHUB_API_KEY"
ghp_ extension:txt
"github_pat_" extension:env
```

### GitLab Tokens

```
"gitlab_token"
"GITLAB_API_TOKEN"
filename:.env GITLAB_TOKEN
glpat- extension:yml
```

### Slack Tokens

```
"xoxb-" extension:json
"xoxp-" language:javascript
SLACK_API_TOKEN
filename:.env SLACK_TOKEN
slack_token extension:yml
```

### Discord Tokens

```
"discord_token"
filename:.env DISCORD_BOT_TOKEN
"Bot " language:javascript
discord webhook
```

### Telegram Bot Tokens

```
"telegram_bot_token"
filename:config.py TELEGRAM_TOKEN
telegram bot api
```

### Twitter API Keys

```
"twitter_api_key"
"TWITTER_CONSUMER_KEY"
"TWITTER_CONSUMER_SECRET"
filename:.env TWITTER_ACCESS_TOKEN
```

---

## Database Credentials

### MySQL

```
filename:database.yml password
"mysql://" user:pass
DB_PASSWORD language:php
MYSQL_ROOT_PASSWORD
filename:config.php mysql_password
"mysql_password"
```

### PostgreSQL

```
"postgresql://" password
POSTGRES_PASSWORD
filename:.env DATABASE_URL
postgres://user:pass
```

### MongoDB

```
"mongodb://" password
MONGO_PASSWORD
filename:.env MONGODB_URI
mongodb+srv://
```

### Redis

```
filename:redis.conf requirepass
REDIS_PASSWORD
redis://password@
```

### SQL Server

```
"Server=;Database=;User ID=;Password="
"Data Source=;Initial Catalog=;User ID=;Password="
SQL_SERVER_PASSWORD
```

---

## Private Keys & Certificates

### SSH Private Keys

```
filename:id_rsa
filename:id_dsa
"BEGIN RSA PRIVATE KEY"
"BEGIN DSA PRIVATE KEY"
"BEGIN EC PRIVATE KEY"
"BEGIN OPENSSH PRIVATE KEY"
extension:pem private
filename:id_ed25519
```

### SSL/TLS Certificates

```
"BEGIN PRIVATE KEY"
"BEGIN CERTIFICATE"
extension:key
extension:pem
extension:p12
extension:pfx
filename:server.key
filename:certificate.pem
```

### PGP Keys

```
"BEGIN PGP PRIVATE KEY"
filename:secring.gpg
extension:asc
```

### PuTTY Keys

```
extension:ppk
"PuTTY-User-Key-File"
```

---

## Configuration Files

### General Config

```
filename:config.json password
filename:configuration.yml
filename:settings.php
filename:.config
extension:ini password
filename:app.config
filename:web.config connectionString
```

### Application-Specific

```
filename:wp-config.php DB_PASSWORD
filename:config.inc.php
filename:parameters.yml
filename:database.yml
filename:config.py
filename:settings.py SECRET_KEY
```

### Docker & Container Configs

```
filename:docker-compose.yml environment
filename:Dockerfile ENV
filename:.dockerenv
```

---

## Environment Files

```
filename:.env
filename:.env.production
filename:.env.dev
filename:.env.local
filename:.env.example password
extension:env DB_PASSWORD
path:.env
".env" language:shell
filename:.envrc
```

---

## Cloud Platform Credentials

### Azure

```
"AZURE_CLIENT_ID"
"AZURE_CLIENT_SECRET"
"AZURE_TENANT_ID"
filename:.env AZURE_
extension:json azure password
```

### Google Cloud

```
"type": "service_account"
filename:credentials.json
GOOGLE_APPLICATION_CREDENTIALS
"private_key" extension:json
"client_email" extension:json
```

### DigitalOcean

```
"DIGITALOCEAN_ACCESS_TOKEN"
"DO_TOKEN"
filename:.env DIGITALOCEAN
```

### Heroku

```
"HEROKU_API_KEY"
filename:.env HEROKU_
```

### IBM Cloud

```
"IBM_CLOUD_API_KEY"
"BLUEMIX_"
```

---

## Email & SMTP Credentials

```
"smtp_password"
"SMTP_PASSWORD"
"MAIL_PASSWORD"
filename:.env MAIL_USERNAME
"smtp://"
"email_password"
extension:yml smtp
```

---

## OAuth & Authentication

```
"oauth_token"
"client_secret"
"CLIENT_ID"
"CLIENT_SECRET"
"refresh_token"
"access_token"
filename:oauth.json
extension:json oauth
```

---

## Payment Gateway Keys

### Stripe

```
"sk_live_"
"pk_live_"
"STRIPE_SECRET_KEY"
"STRIPE_API_KEY"
filename:.env STRIPE_
```

### PayPal

```
"PAYPAL_CLIENT_ID"
"PAYPAL_SECRET"
paypal_api
```

### Square

```
"SQUARE_ACCESS_TOKEN"
"SQUARE_APPLICATION_SECRET"
```

### Braintree

```
"BRAINTREE_MERCHANT_ID"
"BRAINTREE_PUBLIC_KEY"
"BRAINTREE_PRIVATE_KEY"
```

---

## Third-Party Service Keys

### SendGrid

```
"SENDGRID_API_KEY"
"SG."
```

### Twilio

```
"TWILIO_ACCOUNT_SID"
"TWILIO_AUTH_TOKEN"
```

### Mailgun

```
"MAILGUN_API_KEY"
"key-"
```

### Amazon SES

```
"SES_SMTP_USERNAME"
"SES_SMTP_PASSWORD"
```

### Firebase

```
"firebase" extension:json
"FIREBASE_API_KEY"
filename:google-services.json
filename:firebase-config.json
```

### Algolia

```
"ALGOLIA_API_KEY"
"ALGOLIA_APPLICATION_ID"
```

### New Relic

```
"NEW_RELIC_LICENSE_KEY"
```

### Datadog

```
"DATADOG_API_KEY"
"DD_API_KEY"
```

### Sentry

```
"SENTRY_DSN"
"sentry.io"
```

---

## Internal Network Information

```
filename:hosts
filename:.ssh/known_hosts
"10.0.0." language:python
"192.168." language:bash
"172.16." extension:conf
vpn_password
internal_network
```

---

## Passwords in Code

### Hardcoded Passwords

```
"password =" language:python
"password:" language:yaml
"passwd" extension:js
"pwd" language:java
hardcoded password
```

### Default Credentials

```
"admin" "admin" language:sql
"root" "root"
"user" "password"
default password extension:md
```

### Test Credentials

```
"test_password"
"dummy_password"
filename:test password
```

---

## Backup & SQL Files

```
extension:sql
filename:backup.sql
filename:dump.sql
extension:bak
"INSERT INTO" extension:sql
"CREATE TABLE" filename:database.sql
*.sql.gz
filename:db_backup
```

---

## Mobile App Secrets

### Android

```
filename:app/src/main/res/values/strings.xml api_key
filename:google-services.json
extension:gradle apiKey
filename:AndroidManifest.xml
```

### iOS

```
filename:Credentials.plist
filename:Info.plist API
extension:xcconfig
filename:Podfile
```

### React Native

```
filename:.env.production language:javascript
"REACT_APP_" extension:js
```

### Flutter

```
filename:pubspec.yaml
filename:android/app/google-services.json
```

---

## Hardcoded URLs & Endpoints

```
"https://api." language:javascript
"http://localhost" extension:js
"BASE_URL" language:python
"endpoint" extension:json
"api_url"
```

---

## Debug & Error Messages

```
extension:log error
filename:debug.log
"Exception" extension:log
"stacktrace" language:java
```

---

## Organization-Specific Searches

```
org:target filename:.env
org:company extension:pem
org:organization "api_key"
org:target filename:config language:python
```

---

## Language-Specific Searches

### Python

```
language:python "password"
language:python api_key
language:python "SECRET_KEY"
filename:settings.py SECRET
```

### JavaScript/Node.js

```
language:javascript "api_key"
filename:package.json
language:javascript "password"
filename:.npmrc
```

### Java

```
language:java "password"
extension:properties password
filename:application.properties
```

### PHP

```
language:php "password"
filename:config.php
extension:php mysql_password
```

### Go

```
language:go "password"
language:go "api_key"
```

### Ruby

```
language:ruby "password"
filename:database.yml
filename:secrets.yml
```

### C#

```
language:c# "password"
extension:config connectionString
```

---

## Time-Based Searches

```
created:>2024-01-01 filename:.env
pushed:>2024-06-01 api_key
created:2024-01-01..2024-12-31 password
pushed:>2024-01-01 AWS_SECRET
```

---

## Advanced Query Combinations

### Recently Pushed Sensitive Files

```
filename:.env pushed:>2024-01-01
extension:pem created:>2024-06-01
"api_key" pushed:>2024-11-01
```

### Large Organizations

```
org:google "password" extension:js
org:microsoft api_key language:python
org:amazon AWS_SECRET
```

### Specific File in Path

```
path:config/ filename:database.yml
path:src/main/resources/ extension:properties
path:.ssh/ filename:id_rsa
```

### High-Value Targets

```
stars:>1000 "api_key"
forks:>500 filename:.env
stars:>5000 "password" language:javascript
```

### Size-Based Searches

```
size:>1000000 extension:sql
size:<1000 filename:.env
```

### Combined Multi-Filter

```
org:target filename:.env language:javascript pushed:>2024-01-01
extension:json "private_key" created:>2024-06-01 NOT test
"aws_access_key" language:python stars:>100
```

---

## GitHub Code Search Syntax

### Regex Support (Limited)

```
/secret[_-]?key/
/api[_-]?token/
/[a-zA-Z0-9]{32}/
```

### Symbol Search

```
symbol:password
symbol:apiKey
```

### Content Search

```
in:file api_key
in:path config
in:name secret
```

---

## GitHub Advanced Search Interface

Access via: `https://github.com/search/advanced`

### Useful Filters

```
Language:        Python, JavaScript, Java, etc.
Stars:           >1000, <100, etc.
Forks:           >500
Size:            >1000 (KB)
Created:         >2024-01-01
Pushed:          <2023-01-01
License:         mit, apache-2.0, etc.
Topics:          security, api, config, etc.
```

---

## GitHub API for Advanced Searches

```bash
# Using GitHub API v3
curl -H "Authorization: token YOUR_TOKEN" \
  "https://api.github.com/search/code?q=api_key+extension:env"

# Using gh CLI
gh api search/code -f q="password extension:yml"

# Rate limits
# Authenticated: 30 requests/minute
# Unauthenticated: 10 requests/minute
```

---

## Automation Tools

### GitDorker
```bash
python3 GitDorker.py -tf target.txt -d dorks.txt -o output.txt
```

### GitLeaks
```bash
gitleaks detect --source . --report-path report.json
```

### TruffleHog
```bash
trufflehog git https://github.com/target/repo
trufflehog github --org=target-org
```

### Gitrob
```bash
gitrob -github-access-token TOKEN target-org
```

### GitHound
```bash
echo "target-org" | git-hound --subdomain-file subdomains.txt
```

### GitAllSecrets
```bash
python3 gitallsecrets.py -token TOKEN -org target-org
```

---

## GitHub Dorking Best Practices

1. **Start Specific**: Begin with organization/user searches
2. **Use Exclusions**: Remove false positives with NOT
3. **Combine Operators**: Use multiple filters for precision
4. **Check Recent**: Focus on recently pushed code
5. **Verify Findings**: Always validate discovered credentials
6. **Report Responsibly**: Use responsible disclosure
7. **Respect Rate Limits**: Don't hammer the API
8. **Use Automation**: Tools like GitLeaks for large-scale scans
9. **Monitor Continuously**: Set up alerts for your organization
10. **Document Everything**: Keep track of findings

---

## GitHub Security Features to Bypass

### Secret Scanning

GitHub automatically scans for:
- API keys
- Access tokens
- Private keys
- Certificates

But misses:
- Obfuscated secrets
- Base64 encoded credentials
- Split strings
- Environment-specific secrets

### Search Limitations

- Only searches default branch (usually main/master)
- Limited regex support
- File size limits (384 KB)
- Rate limiting
- No search in private repos (without access)

---

## Remediation

If you find exposed secrets:

1. **Rotate Immediately**: Change all exposed credentials
2. **Revoke Access**: Invalidate compromised tokens
3. **Remove from History**: Use tools like BFG Repo-Cleaner
4. **Update .gitignore**: Prevent future exposure
5. **Use Secrets Management**: Implement proper secret management
6. **Enable Scanning**: Use GitHub's secret scanning
7. **Educate Team**: Train on secure coding practices

---

## Related Resources

- [GitHub Search Syntax](https://docs.github.com/en/search-github)
- [GitHub Secret Scanning](https://docs.github.com/en/code-security/secret-scanning)
- [GitGuardian](https://www.gitguardian.com/)
- [GitHub Security Lab](https://securitylab.github.com/)
- [OWASP Secure Coding Practices](https://owasp.org/www-project-secure-coding-practices-quick-reference-guide/)

---

**Disclaimer**: This collection is for educational and authorized security research purposes only. Always obtain proper authorization before conducting security assessments. Report findings responsibly through proper channels.
