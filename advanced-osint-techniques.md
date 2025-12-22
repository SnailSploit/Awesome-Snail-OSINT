# Advanced OSINT Techniques

Expert-level OSINT methodologies and operational security practices for professional investigations.

## Table of Contents

- [OSINT Methodology](#osint-methodology)
- [Target Profiling](#target-profiling)
- [Digital Footprint Analysis](#digital-footprint-analysis)
- [Metadata Analysis](#metadata-analysis)
- [Image Intelligence (IMINT)](#image-intelligence-imint)
- [Video Intelligence (VIDINT)](#video-intelligence-vidint)
- [Geolocation Techniques](#geolocation-techniques)
- [Social Media Intelligence (SOCMINT)](#social-media-intelligence-socmint)
- [Dark Web Intelligence](#dark-web-intelligence)
- [Cryptocurrency Intelligence](#cryptocurrency-intelligence)
- [DNS & Domain Intelligence](#dns--domain-intelligence)
- [Email Intelligence](#email-intelligence)
- [Phone Number Intelligence](#phone-number-intelligence)
- [Username Enumeration](#username-enumeration)
- [Network Reconnaissance](#network-reconnaissance)
- [OPSEC for OSINT](#opsec-for-osint)
- [Documentation & Reporting](#documentation--reporting)
- [Legal & Ethical Considerations](#legal--ethical-considerations)

---

## OSINT Methodology

### Intelligence Cycle

```
1. Planning & Direction
   ↓
2. Collection
   ↓
3. Processing
   ↓
4. Analysis
   ↓
5. Dissemination
   ↓
6. Feedback → (back to Planning)
```

### Collection Framework

**Primary Sources**:
- Direct observation
- Public records
- Official publications
- Interviews

**Secondary Sources**:
- News articles
- Academic papers
- Reports
- Books

**Tertiary Sources**:
- Databases
- Indexes
- Bibliographies

### Information Reliability Scale

**Source Reliability**:
- A: Completely reliable
- B: Usually reliable
- C: Fairly reliable
- D: Not usually reliable
- E: Unreliable
- F: Reliability cannot be judged

**Information Credibility**:
- 1: Confirmed by other sources
- 2: Probably true
- 3: Possibly true
- 4: Doubtful
- 5: Improbable
- 6: Truth cannot be judged

---

## Target Profiling

### Individual Profiling

**Basic Information**:
- Full name & aliases
- Date of birth
- Current & previous addresses
- Phone numbers
- Email addresses
- Social media profiles

**Professional Information**:
- Employment history
- Education
- Professional licenses
- Business registrations
- LinkedIn profile
- GitHub contributions

**Online Presence**:
- Websites owned
- Blog posts
- Forum participation
- Social media activity
- Comments on articles
- Product reviews

**Digital Footprint**:
- Domain registrations
- IP addresses
- Network infrastructure
- Mobile apps used
- Online purchases
- Subscription services

### Organization Profiling

**Corporate Information**:
- Legal name & DBA
- Registration number
- Address & locations
- Parent company
- Subsidiaries
- Officers & directors

**Financial Information**:
- Revenue & funding
- Investors
- Stock information
- Financial reports
- Bankruptcy records

**Digital Presence**:
- Website technology stack
- DNS records
- IP ranges
- Email servers
- Cloud services
- CDN usage

**Personnel**:
- Employee count
- Key personnel
- LinkedIn employees
- Job postings
- Organizational chart

---

## Digital Footprint Analysis

### Data Leaks & Breaches

**Sources**:
- HaveIBeenPwned
- DeHashed
- LeakCheck
- Intelligence X
- Snusbase

**Analysis**:
```
1. Search email/username
2. Identify compromised services
3. Extract exposed data
4. Correlate across breaches
5. Identify patterns
6. Build timeline
```

### Historical Data

**Web Archives**:
- Internet Archive (archive.org)
- Archive.today
- Wayback Machine
- Screenshots (via cached services)

**Social Media Archives**:
- Deleted tweets (via archives)
- Removed posts
- Historical profiles
- Timeline reconstruction

---

## Metadata Analysis

### Document Metadata

**EXIF Data** (Images):
- Camera make/model
- GPS coordinates
- Timestamp
- Software used
- Author information

**Office Documents**:
- Author name
- Organization
- Creation date
- Last modified
- Edit time
- Software version
- Internal paths
- Revision history

**PDF Documents**:
- Producer
- Creator
- Creation date
- Modification date
- Author
- Keywords

**Tools**:
```bash
# ExifTool
exiftool image.jpg
exiftool -all= image.jpg  # Strip metadata

# pdfinfo
pdfinfo document.pdf

# strings
strings document.pdf | grep -i "author"
```

---

## Image Intelligence (IMINT)

### Reverse Image Search

**Engines**:
- Google Images
- Yandex Images (best for faces)
- TinEye
- Bing Visual Search
- Baidu Images

**Specialized**:
- PimEyes (face search)
- Social Catfish
- Berify
- RevEye (browser extension)

### Image Analysis

**Geolocation from Images**:
1. EXIF GPS data
2. Landmarks identification
3. Language on signs
4. Architecture style
5. Vegetation type
6. Vehicle models/plates
7. Business names
8. Phone numbers on signs
9. Street furniture
10. Shadow analysis

**Tools**:
- Google Earth
- Google Street View
- Yandex Panorama
- Baidu Maps
- Mapillary
- GeoGuessr techniques

### Image Verification

**Check for**:
- Reverse image search results
- Earlier instances
- Modifications (forensics)
- EXIF consistency
- Error Level Analysis (ELA)
- Copy-Move detection

**Tools**:
- FotoForensics
- Forensically
- InVID verification plugin
- JPEGsnoop

---

## Video Intelligence (VIDINT)

### Video Analysis

**Frame Extraction**:
```bash
# FFmpeg
ffmpeg -i video.mp4 -vf fps=1 frame%04d.png

# Extract audio
ffmpeg -i video.mp4 -vn -acodec copy audio.aac
```

**Metadata**:
- Upload date
- Duration
- Resolution
- Codec information
- GPS coordinates (if embedded)

**Content Analysis**:
- Landmarks
- License plates
- Faces
- Audio (language, accents)
- Shadows (time estimation)
- Weather conditions
- Clothing/uniforms

### Video Verification

**Techniques**:
1. Reverse video search (InVID)
2. Keyframe extraction & search
3. Audio analysis
4. Metadata examination
5. Weather verification
6. Sun/shadow analysis
7. Chronolocation

**Tools**:
- InVID/WeVerify plugin
- YouTube DataViewer
- Amnesty YouTube DataViewer
- FFmpeg
- Google Earth Pro

---

## Geolocation Techniques

### Methods

**1. GPS Coordinates**:
- EXIF data
- Social media posts
- Check-ins

**2. Visual Landmarks**:
- Buildings
- Monuments
- Mountains
- Water bodies

**3. Text Clues**:
- Street signs
- Business names
- Phone area codes
- License plates
- Language/script

**4. Environmental**:
- Vegetation
- Weather
- Sun position
- Shadows

**5. Infrastructure**:
- Road markings
- Street furniture
- Utility poles
- Architecture style

### Shadow Analysis

```
1. Measure shadow length
2. Determine shadow direction
3. Use SunCalc.org
4. Cross-reference with location
5. Estimate time of day/year
```

### Tools

- Google Earth Pro
- Google Street View
- Yandex Panorama
- Bing Maps
- Baidu Maps
- Mapillary
- OpenStreetMap
- What3Words
- SunCalc
- ShadowCalculator
- PeakVisor (mountain identification)

---

## Social Media Intelligence (SOCMINT)

### Facebook Intelligence

**Techniques**:
- Graph Search (archived)
- ID-based searches
- Photo map exploration
- Friend list analysis
- Group membership
- Page likes
- Timeline scraping

**Tools**:
- Social-Searcher
- IntelTechniques Facebook tools
- Sowdust FB Search
- SearchIsBack

**URLs**:
```
Profile by ID: facebook.com/profile.php?id=USERID
Photo by ID: facebook.com/photo.php?fbid=PHOTOID
```

### Twitter/X Intelligence

**Advanced Search**:
```
from:username           Tweets from user
to:username             Tweets to user
@username               Mentions
since:2024-01-01       After date
until:2024-12-31       Before date
min_faves:100          Minimum likes
min_retweets:50        Minimum retweets
filter:media           Has media
filter:links           Has links
filter:replies         Only replies
filter:verified        Only verified
lang:en                Language
near:"New York"        Location
geocode:lat,long,radius Geographic search
```

**Tools**:
- TweetDeck
- Advanced Twitter Search
- Social Bearing
- Foller.me
- TweetBeaver
- Twitter ID (Tweeterid.com)

### LinkedIn Intelligence

**Techniques**:
- Company employee enumeration
- Job title mapping
- Organizational chart building
- Contact information gathering
- Technology stack identification

**Search Operators**:
```
site:linkedin.com/in/ "company"
site:linkedin.com/company/companyname
"email" site:linkedin.com
```

### Instagram Intelligence

**Tools**:
- Osintgram
- InstaLoader
- StoriesDown
- Pikdo
- ImgInn
- SearchMyBio

**Techniques**:
- Hashtag tracking
- Location tracking
- Story archiving
- Comment analysis
- Follower/following analysis

### TikTok Intelligence

**Tools**:
- TikTok Scraper
- Mavekite
- Snaptik

**Techniques**:
- Username search
- Hashtag monitoring
- Sound tracking
- Video downloading
- Metadata extraction

---

## Dark Web Intelligence

### Accessing Safely

**Requirements**:
- Tor Browser
- VPN (before Tor)
- Virtual Machine
- Disposable system
- No personal information

**Safety Practices**:
1. Never use real identity
2. Don't download files
3. Don't enable JavaScript
4. Don't maximize window
5. Use bridge relays
6. Verify Tor circuit

### Dark Web Search Engines

- Ahmia.fi
- DarkSearch.io
- Torch
- Haystak
- Not Evil
- Candle
- Excavator

### Monitoring Services

- Intel471
- Flashpoint
- Recorded Future
- DarkOwl
- Webz.io

### Investigation Techniques

**Forum Analysis**:
- User profiles
- Post history
- Language patterns
- Time zones
- Connections

**Marketplace Monitoring**:
- Vendor tracking
- Product listings
- Review analysis
- Transaction patterns

**Paste Sites**:
- Pastebin
- JustPaste.it
- Ghostbin
- PrivateBin

---

## Cryptocurrency Intelligence

### Blockchain Analysis

**Bitcoin**:
- blockchain.com
- blockchair.com
- btc.com
- walletexplorer.com

**Ethereum**:
- etherscan.io
- ethplorer.io
- etherchain.org

**Multi-Chain**:
- blockchair.com
- blockchain.com
- tokenview.com

### Address Investigation

```
1. Identify address
2. Check balance
3. Transaction history
4. Input/output addresses
5. Clustering analysis
6. Exchange identification
7. Mixing service detection
```

### Tools

- CipherTrace
- Chainalysis
- Elliptic
- Coinpath (Bitquery)
- Bitcoin Who's Who
- Wallet Explorer

### Exchange Investigation

- Deposit addresses
- Withdrawal patterns
- Trading volumes
- KYC requirements
- Historical data

---

## DNS & Domain Intelligence

### DNS Reconnaissance

**Record Types**:
```
A       IPv4 address
AAAA    IPv6 address
MX      Mail servers
NS      Name servers
TXT     Text records
CNAME   Canonical name
SOA     Start of authority
SPF     Sender Policy Framework
DMARC   Email authentication
```

**Tools**:
```bash
# DNS lookup
dig example.com
nslookup example.com
host example.com

# Reverse DNS
dig -x 1.2.3.4

# Zone transfer (if misconfigured)
dig @ns1.example.com example.com AXFR

# DNS history
securitytrails.com
dnsdumpster.com
```

### WHOIS Investigation

**Information**:
- Registrar
- Registration date
- Expiration date
- Registrant details
- Name servers
- Status

**Tools**:
- whois.com
- whois.domaintools.com
- viewdns.info
- who.is

### Subdomain Enumeration

**Tools**:
```bash
# Subfinder
subfinder -d example.com

# Amass
amass enum -d example.com

# Assetfinder
assetfinder --subs-only example.com

# Certificate transparency
crt.sh
censys.io
```

### Historical DNS Data

- SecurityTrails
- DNSHistory
- Complete DNS

---

## Email Intelligence

### Email Validation

**Verification**:
- Syntax validation
- Domain validation
- MX record check
- SMTP verification
- Disposable email detection

**Tools**:
- Hunter.io
- VoilaNorbert
- Clearbit Connect
- EmailHippo
- Verifalia

### Email Breaches

**Sources**:
- HaveIBeenPwned
- DeHashed
- LeakCheck
- Snusbase
- Intelligence X

### Email Header Analysis

**Key Headers**:
```
From:               Sender
To:                 Recipient
Subject:            Email subject
Date:               Send date
Message-ID:         Unique ID
Received:           Mail server path
Return-Path:        Return address
X-Originating-IP:   Sender IP
```

**Tools**:
- MXToolbox Header Analyzer
- Google Admin Toolbox
- Mail Header Analyzer

### Email OSINT Tools

- GHunt (Google account enumeration)
- Holehe (account finder)
- Maigret
- BlackBird

---

## Phone Number Intelligence

### Number Analysis

**Information**:
- Country code
- Area code
- Carrier
- Line type
- Location
- Validity

**Tools**:
- Truecaller
- Carrier Lookup
- NumLookup
- PhoneInfoga
- TextMagic

### Reverse Phone Lookup

- Whitepages
- Spokeo
- TruePeopleSearch
- FastPeopleSearch
- AnyWho

### Social Media Linkage

- Facebook phone search
- WhatsApp number check
- Telegram username finder
- Signal contact discovery
- Viber contact check

---

## Username Enumeration

### Username Search Engines

- Namechk
- KnowEm
- Namecheckr
- CheckUsernames
- WhatsMyName

### Automated Tools

```bash
# Sherlock
sherlock username

# Maigret
maigret username

# Social-Analyzer
social-analyzer --username "target"

# BlackBird
blackbird -u username
```

### Manual Verification

**Platforms to Check**:
- GitHub
- Twitter/X
- Instagram
- TikTok
- Reddit
- LinkedIn
- YouTube
- Twitch
- Steam
- Discord
- Snapchat
- Pinterest

---

## Network Reconnaissance

### Passive Reconnaissance

**Tools**:
- Shodan
- Censys
- ZoomEye
- FOFA
- BinaryEdge
- GreyNoise

**Information Gathering**:
- IP ranges
- Open ports
- Services
- Banners
- Certificates
- Technologies

### Active Reconnaissance

**Port Scanning**:
```bash
# Nmap
nmap -sS -p- target.com
nmap -sV -sC -p 80,443 target.com
nmap --script vuln target.com

# Masscan
masscan -p1-65535 target.com --rate=1000
```

**Service Enumeration**:
```bash
# Nmap scripts
nmap -p 445 --script smb-enum-shares target.com
nmap -p 3306 --script mysql-info target.com
```

### Infrastructure Mapping

- Autonomous System (AS) number
- IP ranges (CIDR)
- BGP information
- Route tracing
- CDN identification
- Cloud provider detection

**Tools**:
- BGPView
- Hurricane Electric
- RIPEstat
- ipinfo.io
- Netify

---

## OPSEC for OSINT

### Anonymization Layers

**Network Layer**:
1. VPN (before Tor)
2. Tor Browser
3. ProxyChains
4. Public WiFi (rotating)

**System Layer**:
- Virtual machines
- Whonix
- Tails OS
- Qubes OS

**Account Layer**:
- Burner emails
- Fake personas
- Anonymous payments
- Compartmentalization

### Avoiding Detection

**Browser OPSEC**:
- Disable JavaScript (when possible)
- Block WebRTC
- Use privacy extensions
- Clear cookies/cache
- Use containers (Firefox)
- Randomize user-agent

**Social Media OPSEC**:
- Create realistic personas
- Age accounts
- Build believable history
- Use appropriate images
- Match demographics
- Limit activity rate

### Data Management

**Organization**:
- Case folders
- Screenshot naming
- URL documentation
- Timestamp everything
- Chain of custody
- Backup procedures

---

## Documentation & Reporting

### Evidence Collection

**Screenshot Best Practices**:
- Full page capture
- Include URL
- Include timestamp
- Original resolution
- No editing
- Hash verification

**Tools**:
- Hunchly
- SnagIt
- Greenshot
- Screenshot.guru
- Archive.today

### Report Structure

```
1. Executive Summary
2. Methodology
3. Findings
   - Source reliability
   - Information credibility
   - Evidence (screenshots/archives)
4. Analysis
5. Conclusions
6. Recommendations
7. Appendices
   - Tools used
   - URLs
   - Timestamps
```

### Data Visualization

- Maltego (link analysis)
- Gephi (network graphs)
- Graphistry
- i2 Analyst's Notebook
- Timeline tools

---

## Legal & Ethical Considerations

### Legal Boundaries

**Generally Legal**:
- Publicly available information
- Website viewing
- Search engines
- Public records
- Social media public posts

**Gray Area**:
- Web scraping (check ToS)
- Sock puppet accounts
- Automated tools
- Data aggregation

**Illegal**:
- Unauthorized access
- Identity theft
- Harassment
- Social engineering
- Bypassing access controls

### Ethical Guidelines

1. **Necessity**: Is OSINT appropriate?
2. **Proportionality**: Is method appropriate?
3. **Legality**: Is it legal?
4. **Privacy**: Respect privacy rights
5. **Accuracy**: Verify information
6. **Transparency**: Document methods
7. **Responsibility**: Use ethically

### Jurisdictional Considerations

- GDPR (EU)
- CCPA (California)
- Local privacy laws
- Terms of Service
- Computer Fraud laws
- Data protection regulations

---

## OSINT Workflow Example

```
1. Define Objectives
   - What do we need to know?
   - Why do we need to know it?

2. Identify Sources
   - Where can we find information?
   - What tools are appropriate?

3. Collection
   - Gather data systematically
   - Document everything
   - Maintain OPSEC

4. Processing
   - Organize data
   - Remove duplicates
   - Verify authenticity

5. Analysis
   - Identify patterns
   - Correlate data
   - Draw conclusions

6. Reporting
   - Document findings
   - Present evidence
   - Make recommendations

7. Feedback
   - Review process
   - Improve methodology
   - Update tools/techniques
```

---

## Continuous Learning

**Resources**:
- OSINT Curious Webcasts
- Bellingcat
- Intelligence Studies journals
- Security conferences (DEF CON, BSides)
- SANS OSINT Summit
- Social Engineer Podcast

**Practice Platforms**:
- TraceLabs
- OSINT Exercises
- Bellingcat's tutorial
- Quiztime (@quiztime)
- GeoGuessr

---

**Disclaimer**: This guide is for educational and authorized use only. Always operate within legal and ethical boundaries. Unauthorized access or misuse of information can result in civil and criminal penalties.
