# Other Search Engines Dorks - Comprehensive Collection

Expert-level search queries for Censys, Bing, FOFA, ZoomEye, and other alternative search engines.

## Table of Contents

- [Censys](#censys)
- [Bing](#bing)
- [FOFA](#fofa)
- [ZoomEye](#zoomeye)
- [GreyNoise](#greynoise)
- [BinaryEdge](#binaryedge)
- [Criminal IP](#criminal-ip)
- [Netlas](#netlas)
- [ONYPHE](#onyphe)
- [Wigle](#wigle)
- [Hunter.how](#hunterhow)
- [PublicWWW](#publicwww)
- [DuckDuckGo](#duckduckgo)
- [Yandex](#yandex)
- [Baidu](#baidu)

---

## Censys

**Website**: https://search.censys.io/

### Basic Syntax

```
services.port:          Port number
services.service_name:  Service name
location.country:       Country code
location.city:          City name
autonomous_system.name: ASN name
autonomous_system.asn:  ASN number
ip:                     IP address
labels:                 Service labels
```

### Certificate Searches

```
services.tls.certificates.leaf_data.subject.common_name:     Common Name
services.tls.certificates.leaf_data.subject_dn:               Subject DN
services.tls.certificates.leaf_data.issuer_dn:                Issuer DN
services.tls.certificates.leaf_data.issuer.common_name:      Issuer CN
services.tls.certificates.leaf_data.fingerprint:             Certificate fingerprint
```

### HTTP/HTTPS Searches

```
services.http.response.html_title:        Page title
services.http.response.body:              Response body content
services.http.response.headers:           HTTP headers
services.http.response.status_code:       HTTP status code
services.software.product:                Software product
services.software.version:                Software version
```

### Example Queries

#### Web Servers

```
services.port:80 and services.service_name:HTTP
services.port:443 and location.country:US
services.software.product:nginx
services.software.product:"Apache httpd"
services.http.response.status_code:200
services.http.response.html_title:"Welcome"
```

#### Databases

```
services.port:3306 and services.service_name:MYSQL
services.port:27017 and services.service_name:MONGODB
services.port:5432 and services.service_name:POSTGRES
services.port:6379 and services.service_name:REDIS
services.port:9200 and services.service_name:ELASTICSEARCH
```

#### Remote Access

```
services.port:3389 and location.country:US
services.port:22 and services.ssh.server_host_key.fingerprint_sha256:*
services.port:5900 and services.service_name:VNC
services.port:23 and services.service_name:TELNET
```

#### SSL Certificates

```
services.tls.certificates.leaf_data.subject.common_name:"*.example.com"
services.tls.certificates.leaf_data.issuer.common_name:"Let's Encrypt"
services.tls.certificates.leaf_data.subject.organization:"Example Inc"
```

#### Industrial Control Systems

```
services.port:502 and services.service_name:MODBUS
services.port:47808
services.port:102
```

#### Specific Countries/Regions

```
location.country:CN and services.port:80
location.country:US and services.port:3306
location.city:"New York" and services.port:22
```

#### Autonomous Systems

```
autonomous_system.name:"Amazon.com"
autonomous_system.name:"Google LLC"
autonomous_system.asn:15169
```

#### Vulnerable Services

```
services.software.product:Apache and services.software.version:"2.4.49"
services.software.product:"Microsoft IIS" and services.software.version:"7.5"
```

---

## Bing

**Website**: https://www.bing.com/

### Basic Operators

```
site:         Limit to specific domain
filetype:     Search for file types
intitle:      Search page titles
inurl:        Search URLs
inbody:       Search page body
inanchor:     Search anchor text
ip:           Find sites hosted on specific IP
contains:     Find pages that link to specific file type
linkfromdomain: Find pages linking from a domain
loc:          Search specific location
language:     Search specific language
feed:         Find RSS/Atom feeds
hasfeed:      Sites with RSS/Atom feeds
url:          Index status of URL
```

### Example Queries

#### File Types

```
site:example.com filetype:pdf
filetype:xls "confidential"
filetype:doc site:.gov
intitle:"index of" filetype:sql
```

#### Login Portals

```
intitle:"login" site:example.com
inurl:admin intitle:login
intitle:"Dashboard" inurl:admin
```

#### Specific Locations

```
loc:US "company name"
language:en loc:UK
```

#### IP-Based

```
ip:1.2.3.4
ip:192.168.1.0/24
```

#### Feeds

```
feed:example.com
hasfeed:example.com
```

#### Link Analysis

```
linkfromdomain:example.com
link:example.com
```

#### Advanced Combinations

```
site:.gov filetype:xls "internal"
intitle:"index of" site:.edu
ip:1.2.3.4 intitle:"admin"
```

---

## FOFA

**Website**: https://fofa.info/

### Basic Syntax

```
title=          Page title
body=           Page body
domain=         Domain
host=           Host
ip=             IP address
port=           Port number
protocol=       Protocol
country=        Country code
city=           City
region=         Region
cert=           Certificate
header=         HTTP header
server=         Server header
app=            Application
os=             Operating system
banner=         Service banner
```

### Example Queries

#### Web Applications

```
title="login"
title="管理后台"
app="WordPress"
app="Apache-Tomcat"
app="phpMyAdmin"
server="nginx"
server="Microsoft-IIS/7.5"
```

#### Databases

```
port=3306 && country="US"
port=27017
port=5432
protocol=mysql
app="MongoDB"
```

#### IoT Devices

```
app="Hikvision-Webs"
app="JAWS/1.0"
body="DVR_H264"
title="Network Camera"
```

#### Certificates

```
cert="example.com"
cert="Let's Encrypt"
```

#### Geographic

```
country="CN"
city="Beijing"
region="California"
country="US" && city="New York"
```

#### Protocols

```
protocol=telnet
protocol=ftp
protocol=rdp
protocol=vnc
```

#### Combined Queries

```
title="login" && country="US"
port=22 && country="CN"
protocol=http && port=8080
app="Apache" && country="US" && port=80
```

#### Specific Services

```
banner="220" && protocol=ftp
body="default password"
header="realm"
```

---

## ZoomEye

**Website**: https://www.zoomeye.org/

### Basic Syntax

```
app:            Application
ver:            Version
os:             Operating system
service:        Service
ip:             IP address
cidr:           CIDR range
port:           Port number
city:           City
country:        Country
asn:            ASN
hostname:       Hostname
site:           Website content
title:          Page title
keywords:       Keywords
desc:           Description
header:         HTTP header
device:         Device type
```

### Example Queries

#### Applications

```
app:"Apache httpd"
app:"nginx"
app:"Microsoft IIS"
app:"Tomcat"
```

#### Services

```
service:http
service:ssh
service:ftp
service:mysql
```

#### Devices

```
device:router
device:webcam
device:printer
```

#### Geographic

```
country:US
city:"New York"
country:CN +port:80
```

#### Ports

```
port:22
port:3389
port:80,443
```

#### Combined

```
app:"Apache" +country:US
port:3306 +country:CN
service:ssh +country:US
```

#### Headers

```
header:"realm"
header:"WWW-Authenticate"
```

#### Titles

```
title:"login"
title:"admin"
```

---

## GreyNoise

**Website**: https://www.greynoise.io/

### Basic Syntax

```
ip:                 IP address
classification:     benign, malicious, unknown
tags:               Scanner tags
spoofable:          true/false
actor:              Threat actor
cve:                CVE number
metadata.asn:       ASN
metadata.city:      City
metadata.country:   Country
metadata.org:       Organization
raw_data.scan:      Scan data
```

### Example Queries

#### Classification

```
classification:malicious
classification:benign
classification:unknown
```

#### Tags

```
tags:"Shodan Scanner"
tags:"Censys Scanner"
tags:"Masscan"
tags:"SSH Bruteforce"
tags:"Web Scanner"
```

#### CVEs

```
cve:CVE-2021-44228
cve:CVE-2020-1472
```

#### Geographic

```
metadata.country:US
metadata.city:"New York"
metadata.asn:AS15169
```

#### Actors

```
actor:"Chinese State-Sponsored"
actor:"Cobalt Strike"
```

#### Combined

```
classification:malicious AND tags:"SSH Bruteforce"
metadata.country:CN AND classification:malicious
tags:"Web Scanner" AND metadata.org:"Amazon.com"
```

---

## BinaryEdge

**Website**: https://www.binaryedge.io/

### Basic Syntax

```
port:               Port number
country:            Country code
product:            Product name
ip:                 IP address
asn:                ASN
type:               Service type
tag:                Tag
protocol:           Protocol
```

### Example Queries

```
port:22
product:"OpenSSH"
country:US
type:ssh
port:3306 AND country:CN
product:"nginx" AND country:US
asn:15169
```

---

## Criminal IP

**Website**: https://www.criminalip.io/

### Search Types

- IP/Domain Search
- Technology Search
- Certificate Search
- Exploit Search
- Banner Search

### Example Queries

```
title:"admin panel"
port:3389
country:US
product:"Apache"
cert:"example.com"
cve:CVE-2021-44228
```

---

## Netlas

**Website**: https://netlas.io/

### Basic Syntax

```
port:               Port number
host:               Hostname
http.title:         Page title
http.body:          Page body
geo.country:        Country
geo.city:           City
tag:                Tag
cve:                CVE
certificate:        Certificate info
```

### Example Queries

```
port:22
http.title:"login"
geo.country:US
tag:iot
cve:CVE-2021-44228
port:3389 AND geo.country:US
```

---

## ONYPHE

**Website**: https://www.onyphe.io/

### Categories

- Datascan: Services and banners
- Synscan: SYN scan results
- Resolver: DNS resolutions
- Threatlist: Threat intelligence
- Pastries: Pastebin data
- Whois: WHOIS information

### Example Queries

```
category:datascan port:22
category:synscan country:US
category:resolver domain:example.com
category:threatlist
ip:1.2.3.4
os:"Windows"
product:"Apache"
```

---

## Wigle

**Website**: https://wigle.net/

WiFi network search engine.

### Search Types

- SSID search
- BSSID search
- Location-based search
- Network encryption search

### Example Usage

```
Search by SSID: "Starbucks WiFi"
Search by location: Lat/Long coordinates
Filter by encryption: WPA2, Open, WEP
```

---

## Hunter.how

**Website**: https://hunter.how/

### Search Syntax

```
ip=                 IP address
domain=             Domain
port=               Port
protocol=           Protocol
country=            Country
city=               City
isp=                ISP
product=            Product
```

### Example Queries

```
port=22
country=US
product=nginx
domain=example.com
port=3306 AND country=CN
```

---

## PublicWWW

**Website**: https://publicwww.com/

Source code search engine.

### Search Types

- Search HTML/CSS/JavaScript code
- Find websites using specific technologies
- Track code changes
- Analytics tracking codes

### Example Queries

```
"google-analytics.com/analytics.js"
"UA-12345678"
"GTM-"
"facebook.com/connect"
code:"API_KEY"
```

---

## DuckDuckGo

**Website**: https://duckduckgo.com/

### Basic Operators

```
site:         Limit to domain
filetype:     File type
intitle:      In title
inurl:        In URL
-             Exclude term
""            Exact match
OR            Boolean OR
```

### Bang Commands (!commands)

```
!g            Redirect to Google
!gh           GitHub
!so           Stack Overflow
!w            Wikipedia
!yt           YouTube
!gi           Google Images
```

### Example Queries

```
site:example.com intitle:login
filetype:pdf site:.gov
"admin panel" -demo
site:.edu filetype:xls
```

---

## Yandex

**Website**: https://yandex.com/

### Operators

```
site:         Site search
mime:         File type
lang:         Language
domain:       Domain zone
title:        Title
url:          URL
inurl:        In URL
```

### Example Queries

```
site:example.com
mime:pdf
lang:ru
title:admin
url:login
```

---

## Baidu

**Website**: https://www.baidu.com/

### Operators

```
site:         Site search
filetype:     File type
intitle:      In title
inurl:        In URL
```

### Example Queries

```
site:example.com
filetype:doc
intitle:管理
inurl:admin
```

---

## Comparison Table

| Feature | Google | Shodan | Censys | FOFA | ZoomEye | Bing |
|---------|--------|---------|---------|------|---------|------|
| Web Search | ✓ | - | - | ✓ | ✓ | ✓ |
| Device Search | - | ✓ | ✓ | ✓ | ✓ | - |
| SSL Certs | - | ✓ | ✓ | ✓ | - | - |
| API Access | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Free Tier | ✓ | Limited | Limited | Limited | Limited | ✓ |
| ICS/SCADA | - | ✓ | ✓ | ✓ | ✓ | - |
| Geographic | Limited | ✓ | ✓ | ✓ | ✓ | ✓ |

---

## Multi-Engine Search Strategies

### Cross-Verification

1. Search on multiple engines
2. Compare results
3. Verify findings
4. Document differences

### Engine Selection

- **Google/Bing**: Website content, documents
- **Shodan/Censys**: Internet-connected devices
- **FOFA/ZoomEye**: Chinese focus, different coverage
- **GreyNoise**: Internet noise, scanners
- **BinaryEdge**: IoT devices
- **PublicWWW**: Source code

### Automation

```bash
# Multi-engine search script
engines=("shodan" "censys" "fofa" "zoomeye")
for engine in "${engines[@]}"; do
    echo "Searching on $engine..."
    # Your search logic here
done
```

---

## Tips for Effective Searching

1. **Know Your Engine**: Each has strengths
2. **Combine Results**: Use multiple sources
3. **Update Regularly**: Indexes change
4. **Respect Limits**: API rate limits vary
5. **Verify Data**: Always confirm findings
6. **Stay Legal**: Only authorized research
7. **Document**: Keep track of queries
8. **Iterate**: Refine based on results

---

## API Access

Most engines offer APIs for automation:

- **Shodan**: https://developer.shodan.io/
- **Censys**: https://search.censys.io/api
- **FOFA**: https://fofa.info/api
- **ZoomEye**: https://www.zoomeye.org/api
- **BinaryEdge**: https://docs.binaryedge.io/
- **Netlas**: https://netlas.io/api/

---

**Disclaimer**: This collection is for educational and authorized security research purposes only. Always obtain proper authorization before conducting security assessments.
