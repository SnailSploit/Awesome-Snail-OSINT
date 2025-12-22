# Google Dorks - Comprehensive Collection

Expert-level Google search operators and dorks for OSINT investigations.

## Table of Contents

- [Basic Operators](#basic-operators)
- [Advanced Operators](#advanced-operators)
- [Authentication & Login Portals](#authentication--login-portals)
- [Exposed Files & Directories](#exposed-files--directories)
- [Database Files](#database-files)
- [Configuration Files](#configuration-files)
- [Log Files](#log-files)
- [Backup Files](#backup-files)
- [Email Lists & Contact Information](#email-lists--contact-information)
- [Network & Server Information](#network--server-information)
- [Vulnerable Servers](#vulnerable-servers)
- [Government & Education](#government--education)
- [Financial Information](#financial-information)
- [Personal Information](#personal-information)
- [Social Media Intelligence](#social-media-intelligence)
- [Document Intelligence](#document-intelligence)
- [Code Repositories](#code-repositories)
- [IoT & Cameras](#iot--cameras)
- [VPN & Proxy](#vpn--proxy)
- [Cloud Storage](#cloud-storage)
- [E-commerce & Shopping](#e-commerce--shopping)
- [Medical & Healthcare](#medical--healthcare)
- [Advanced Combinations](#advanced-combinations)

---

## Basic Operators

```
site:         Limit results to specific domain
"exact"       Exact phrase match
-word         Exclude term
OR            Either term (must be uppercase)
*             Wildcard
..            Number range (e.g., 2020..2024)
```

## Advanced Operators

```
filetype:     Search specific file types
ext:          Alternative to filetype
intitle:      Word in page title
allintitle:   All words in page title
inurl:        Word in URL
allinurl:     All words in URL
intext:       Word in page body
allintext:    All words in page body
inanchor:     Word in link anchor text
allinanchor:  All words in anchor text
cache:        Google's cached version
related:      Similar websites
info:         Information about a page
define:       Dictionary definition
stocks:       Stock information
map:          Map results
movie:        Movie information
weather:      Weather information
source:       News source
location:     News from location
before:       Results before date (YYYY-MM-DD)
after:        Results after date (YYYY-MM-DD)
```

---

## Authentication & Login Portals

### Admin Panels

```
intitle:"index of" "admin"
intitle:"login" "admin" site:.com
inurl:admin intitle:login
inurl:administrator intitle:login
inurl:admin/login.php
inurl:admin/index.php
inurl:admin/dashboard
intitle:"Admin Panel" +"username" +"password"
inurl:wp-admin intitle:login
intitle:"Dashboard" inurl:admin
inurl:"/phpmyadmin" intitle:"phpMyAdmin"
intitle:"cPanel Login"
intitle:"DirectAdmin Login"
intitle:"Plesk Login"
intitle:"ISPConfig Login"
intitle:"Webmin Login"
inurl:"/administrator" "Joomla"
inurl:"/admin" "WordPress"
inurl:"/ghost/signin" "Ghost"
```

### Authentication Portals

```
intitle:"Sign in" "Azure Active Directory"
intitle:"Sign in to your account" site:login.microsoftonline.com
intitle:"Outlook Web App"
intitle:"Exchange" inurl:owa
intitle:"VMware vCenter"
intitle:"Citrix Gateway"
intitle:"FortiGate Login"
intitle:"Palo Alto Networks Login"
intitle:"SonicWall Login"
intitle:"Cisco" inurl:login
intitle:"Juniper" inurl:webauth
inurl:vpn intitle:login
intitle:"GlobalProtect Portal"
inurl:remote intitle:"Remote Desktop Web"
```

### Database Admin Interfaces

```
intitle:"phpMyAdmin" "Welcome to phpMyAdmin"
inurl:"/phpmyadmin/index.php"
intitle:"Adminer" inurl:adminer
intitle:"MongoDB" inurl:27017
intitle:"RethinkDB Administration Console"
intitle:"Redis Commander"
inurl:solr/admin
intitle:"pgAdmin"
intitle:"SQL Server Management"
```

---

## Exposed Files & Directories

### Directory Listings

```
intitle:"index of" "parent directory"
intitle:"index of" inurl:ftp
intitle:"index of" "backup"
intitle:"index of" "upload"
intitle:"index of" "downloads"
intitle:"index of" "password"
intitle:"index of" "credentials"
intitle:"index of" "ssh"
intitle:"index of" ".git"
intitle:"index of" ".svn"
intitle:"index of" "database"
intitle:"index of" "config"
intitle:"index of" "private"
intitle:"index of" "secret"
intitle:"index of" ".env"
intitle:"index of" "wallet"
intitle:"index of" "token"
```

### Specific File Types

```
intitle:"index of" (jpg|jpeg|png|gif|bmp)
intitle:"index of" (mp3|mp4|avi|mkv|flv)
intitle:"index of" (pdf|doc|docx|xls|xlsx|ppt)
intitle:"index of" (sql|db|mdb|sqlite)
intitle:"index of" (log|logs)
intitle:"index of" (zip|rar|tar|gz|7z)
intitle:"index of" (conf|config|cfg|ini)
intitle:"index of" (key|pem|p12|pfx)
intitle:"index of" (bak|old|backup|~)
```

---

## Database Files

```
filetype:sql "CREATE TABLE"
filetype:sql "INSERT INTO"
filetype:sql intext:password
filetype:sql intext:"password" | "username" | "email"
filetype:mdb inurl:database
filetype:db
filetype:sqlite
filetype:dbf
ext:sql intext:"-- phpMyAdmin SQL Dump"
ext:sql intext:"MySQL dump"
filetype:bak intext:database
"index of" sql.gz
"index of" dump.sql
inurl:backup filetype:sql
site:.gov filetype:sql
site:.edu filetype:sql
```

---

## Configuration Files

### General Config Files

```
filetype:conf
filetype:config
filetype:cfg
filetype:ini
ext:xml inurl:web.config
filetype:yaml
filetype:yml
filetype:toml
filetype:json intext:password
```

### Application Config

```
filetype:env "DB_PASSWORD"
intext:"api_key" filetype:json
intext:"apikey" filetype:xml
filetype:properties intext:password
inurl:wp-config.php intext:DB_PASSWORD
filetype:conf inurl:proftpd
filetype:conf inurl:sshd_config
filetype:cnf intext:password
filetype:reg "HKEY_"
```

### Cloud Config

```
filetype:json "aws_access_key_id"
filetype:json "aws_secret_access_key"
filetype:yaml "azure" "password"
filetype:xml "google" "credentials"
ext:json "private_key"
filetype:pem "BEGIN PRIVATE KEY"
filetype:ppk "PuTTY-User-Key-File"
filetype:rdp
```

---

## Log Files

```
filetype:log
filetype:log intext:password
filetype:log inurl:access.log
filetype:log inurl:error.log
filetype:log inurl:auth.log
filetype:log "username" "password"
ext:log intext:"HTTP" "200"
ext:log intext:"failed"
ext:log intext:"error"
intitle:"index of" "error.log"
intitle:"index of" "access.log"
intitle:"index of" "debug.log"
site:.gov filetype:log
inurl:log/ ext:log
```

---

## Backup Files

```
filetype:bak
filetype:old
filetype:backup
ext:bak inurl:backup
inurl:backup filetype:sql
inurl:backup filetype:zip
intitle:"index of" backup
filetype:tar.gz inurl:backup
filetype:7z inurl:backup
site:backup.*
inurl:dump.sql
intext:"-- Database backup"
filetype:rar inurl:backup
```

---

## Email Lists & Contact Information

```
filetype:xls "email" "name"
filetype:xlsx "email" | "mail"
filetype:csv "email"
filetype:mdb "email"
site:.com filetype:csv email
site:.edu filetype:xls email
intext:"@gmail.com" filetype:txt
intext:"@yahoo.com" filetype:txt
intext:"@outlook.com" filetype:txt
"email list" filetype:csv
"contact list" filetype:xls
filetype:vcf
intitle:"index of" "email.txt"
```

---

## Network & Server Information

```
intitle:"Apache Status"
intitle:"IIS Server Status"
intitle:"nginx status"
intitle:"Server Statistics"
intitle:"Munin" inurl:munin
intitle:"Nagios" inurl:nagios
intitle:"Cacti"
intitle:"Grafana"
intitle:"Prometheus"
inurl:server-status
inurl:server-info
filetype:conf inurl:httpd.conf
filetype:conf inurl:nginx.conf
site:.gov inurl:server-status
```

---

## Vulnerable Servers

```
inurl:/proc/self/cwd
inurl:shell.php
inurl:cmd.php
inurl:c99.php
inurl:r57.php
inurl:webshell
intitle:"Shell" inurl:shell
"Index of /" +".sh_history"
intitle:"index of" "ws_ftp.ini"
inurl:"/axfr.php"
inurl:phpshell
"powered by DreamHost"
intitle:"Welcome to nginx!" "CentOS"
```

---

## Government & Education

```
site:.gov filetype:pdf "confidential"
site:.gov filetype:xls "internal"
site:.gov filetype:doc "classified"
site:.mil filetype:pdf
site:.edu filetype:xls
site:.edu inurl:admin
site:.gov inurl:login
site:.gov intitle:"index of"
site:.mil intext:password
site:.edu filetype:sql
site:.gov "not for public release"
site:.gov "for official use only"
```

---

## Financial Information

```
filetype:xls "invoice"
filetype:xls "payment"
filetype:xls "credit card"
filetype:pdf "invoice" "total"
filetype:pdf "bank statement"
filetype:csv "transaction"
intext:"card number" filetype:xls
intext:"account number" filetype:pdf
"purchase order" filetype:xls
"financial statement" filetype:pdf
site:.gov filetype:xls budget
```

---

## Personal Information

```
filetype:xls "SSN"
filetype:pdf "social security"
filetype:xls "date of birth"
filetype:pdf "passport"
filetype:doc "resume" "phone" "email"
filetype:pdf CV "address" "phone"
"driver's license" filetype:pdf
filetype:xls "salary"
intext:"patient" filetype:pdf
filetype:csv "name" "address" "phone"
```

---

## Social Media Intelligence

```
site:facebook.com intitle:"person name"
site:linkedin.com inurl:"/in/"
site:twitter.com "email" OR "phone"
site:instagram.com intext:"@username"
site:reddit.com intext:keyword
site:pinterest.com inurl:/pin/
site:youtube.com intitle:"company name"
site:github.com "company" "password"
site:pastebin.com "email" | "password"
site:scribd.com filetype:pdf
```

---

## Document Intelligence

```
filetype:pdf "confidential"
filetype:pdf "internal use only"
filetype:pdf "not for distribution"
filetype:doc site:.gov
filetype:docx "classified"
filetype:ppt "internal"
filetype:pptx "confidential"
filetype:xls "restricted"
filetype:xlsx "proprietary"
ext:pdf intext:"draft"
ext:doc intext:"company name" "confidential"
```

---

## Code Repositories

```
site:github.com "password"
site:github.com "api_key"
site:github.com "secret_key"
site:gitlab.com "password"
site:bitbucket.org "credentials"
"index of" ".git"
inurl:.git/config
filetype:bash history
ext:sh intext:password
filetype:py "password" | "passwd"
filetype:js "apiKey"
filetype:java "password"
```

---

## IoT & Cameras

```
inurl:"/view/index.shtml"
intitle:"Live View / - AXIS"
inurl:ViewerFrame?Mode=
inurl:MultiCameraFrame?Mode=Motion
intitle:"EvoCam" inurl:webcam
intitle:"Live NetCams"
intitle:"Network Camera" inurl:home
inurl:"/view/viewer_index.shtml"
inurl:indexFrame.shtml Axis
intitle:"my webcamXP server!" inurl:":8080"
intitle:"WebcamXP 5"
inurl:"lvappl.htm"
```

---

## VPN & Proxy

```
intitle:"OpenVPN" inurl:login
intitle:"SoftEther VPN"
intitle:"pfSense" inurl:login
intitle:"Pritunl"
inurl:"/squid/" intitle:"Squid"
intitle:"Proxy Server" inurl:status
inurl:vpn/index.html
intitle:"GlobalProtect"
```

---

## Cloud Storage

```
site:s3.amazonaws.com "company"
site:s3.amazonaws.com filetype:pdf
site:blob.core.windows.net
site:storage.googleapis.com
site:digitaloceanspaces.com
inurl:s3.amazonaws.com "backup"
inurl:s3.amazonaws.com "database"
site:s3.amazonaws.com ext:sql
site:s3.amazonaws.com ext:bak
site:s3.amazonaws.com "config"
```

---

## E-commerce & Shopping

```
inurl:product.php?id=
inurl:category.php?id=
inurl:cart.php
inurl:checkout.php
inurl:order.php
intitle:"Magento" inurl:admin
intitle:"WooCommerce" inurl:shop
intitle:"Shopify" inurl:products
intitle:"PrestaShop"
inurl:"/catalog/product/"
```

---

## Medical & Healthcare

```
filetype:xls "patient" "diagnosis"
filetype:pdf "medical record"
site:.gov "health information"
intitle:"EMR" OR "EHR"
filetype:xls "prescription"
"patient portal" inurl:login
intitle:"HL7" OR "FHIR"
site:.gov filetype:pdf "hipaa"
```

---

## Advanced Combinations

### Leaked Credentials

```
site:pastebin.com "password" "email" "2024"
site:pastebin.com "database dump"
site:trello.com "password"
site:justpaste.it "credentials"
filetype:txt inurl:password
filetype:log intext:"username" intext:"password"
```

### Network Cameras by Country

```
inurl:"/view/index.shtml" site:.jp
inurl:"/view/index.shtml" site:.de
inurl:"/view/index.shtml" site:.uk
inurl:"/view/index.shtml" site:.kr
```

### Company Intelligence

```
site:linkedin.com "company name" "employees"
site:facebook.com "company name" "phone"
site:crunchbase.com "company name"
filetype:pdf "company name" "financial"
site:sec.gov "company name"
```

### Subdomain Enumeration

```
site:*.target.com
site:*.*.target.com
site:target.com -www
-site:www.target.com site:target.com
```

### Time-based Searches

```
after:2024-01-01 before:2024-12-31
intext:"published" 2024
daterange:2460676-2461041
```

### Advanced File Hunting

```
(ext:doc | ext:docx | ext:odt | ext:rtf | ext:sxw | ext:psw | ext:ppt | ext:pptx | ext:pps | ext:csv) "company"
(ext:php | ext:asp | ext:aspx | ext:jsp) inurl:admin
(ext:conf | ext:config | ext:cfg) intext:password
```

---

## OSINT-Specific Dorks

### Username Investigation

```
"username" site:facebook.com
"username" site:twitter.com
"username" site:instagram.com
"username" site:linkedin.com
"username" site:github.com
intext:"username" (site:reddit.com | site:hackernews.com)
```

### Email Investigation

```
"email@example.com"
"email@example.com" -site:example.com
"email@example.com" (site:pastebin.com | site:github.com)
"email@example.com" filetype:pdf
```

### Phone Number Investigation

```
"phone-number"
"+1-555-555-5555"
"555-555-5555" (site:facebook.com | site:linkedin.com)
```

### Location-based

```
"city name" "company name"
"address" "city" "state"
"coordinates" "lat" "long"
```

---

## Tips for Effective Dorking

1. **Combine Operators**: Use multiple operators for precise results
2. **Use Quotes**: For exact phrase matching
3. **Exclude Noise**: Use `-` to remove irrelevant results
4. **Time Range**: Use `before:` and `after:` for temporal searches
5. **Wildcards**: Use `*` for unknown parts
6. **Boolean Logic**: Combine with `OR`, `AND` (AND is implicit)
7. **Iterate**: Refine searches based on initial results
8. **Verify Results**: Always verify findings before reporting
9. **Respect Privacy**: Use for legitimate security research only
10. **Stay Updated**: Google updates algorithms regularly

---

## Automation Tools

- [GooFuzz](https://github.com/m3n0sd0n4ld/GooFuzz)
- [Pagodo](https://github.com/opsdisk/pagodo)
- [dork-cli](https://github.com/jgor/dork-cli)
- [GHDB-Scraper](https://github.com/NoDataFound/GHDB-Scraper)
- [Dorks-Eye](https://github.com/BullsEye0/dorks-eye)

---

**Disclaimer**: This collection is for educational and authorized security research purposes only. Always obtain proper authorization before conducting security assessments.
