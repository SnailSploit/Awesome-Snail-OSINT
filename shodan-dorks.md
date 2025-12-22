# Shodan Dorks - Comprehensive Collection

Expert-level Shodan search queries for finding internet-connected devices and services.

## Table of Contents

- [Basic Filters](#basic-filters)
- [Advanced Filters](#advanced-filters)
- [Industrial Control Systems (ICS)](#industrial-control-systems-ics)
- [Databases](#databases)
- [Web Servers & Frameworks](#web-servers--frameworks)
- [Remote Access](#remote-access)
- [Network Devices](#network-devices)
- [Security Devices](#security-devices)
- [IoT Devices](#iot-devices)
- [Webcams & Surveillance](#webcams--surveillance)
- [VOIP Systems](#voip-systems)
- [Printers](#printers)
- [Smart Home Devices](#smart-home-devices)
- [Medical Devices](#medical-devices)
- [Building Automation](#building-automation)
- [Cloud Services](#cloud-services)
- [Version-Specific Vulnerabilities](#version-specific-vulnerabilities)
- [Default Credentials](#default-credentials)
- [Misconfigured Services](#misconfigured-services)
- [Country-Specific Searches](#country-specific-searches)
- [Organization Searches](#organization-searches)

---

## Basic Filters

```
port:           Search by port number
country:        Filter by country code (US, GB, CN, etc.)
city:           Filter by city name
geo:            Search by coordinates (lat,lon,radius)
hostname:       Search by hostname
net:            Search IP range (CIDR notation)
os:             Search by operating system
org:            Search by organization name
product:        Search by product/service name
version:        Search by version number
before/after:   Filter by date (DD/MM/YYYY)
asn:            Search by ASN number
vuln:           Search by CVE number
has_screenshot: Filter devices with screenshots
has_ssl:        Filter devices with SSL certificates
```

## Advanced Filters

```
http.favicon.hash:    Search by favicon hash
http.html:            Search HTML content
http.html_hash:       Search by HTML hash
http.title:           Search page title
http.status:          Filter by HTTP status code
http.component:       Search by web component
ssl:                  Search SSL certificates
ssl.cert.subject.cn:  SSL certificate CN
ssl.cert.issuer.cn:   SSL certificate issuer
tag:                  Search by tag (database, camera, ics, etc.)
```

---

## Industrial Control Systems (ICS)

### SCADA Systems

```
scada
port:102
port:502 "Modbus"
port:20000 DNP3
port:47808
port:44818
"SCADA" port:80
ICS
tag:scada
product:"Siemens"
product:"Allen-Bradley"
product:"Schneider Electric"
```

### Programmable Logic Controllers (PLCs)

```
"PLC"
port:44818
product:"Siemens S7"
product:"Modicon"
port:502 country:US
"Rockwell Automation"
"GE Fanuc"
"Mitsubishi Electric"
"Omron"
tag:ics
```

### Human Machine Interface (HMI)

```
"HMI"
"Human Machine Interface"
port:5900 HMI
product:"Wonderware"
product:"WinCC"
"Cimplicity"
"FactoryTalk"
```

### Building Management Systems

```
"Building Management System"
"BACnet"
port:47808
"Tridium Niagara"
product:"Johnson Controls"
product:"Honeywell"
"Automated Logic"
```

---

## Databases

### MySQL

```
port:3306 "mysql"
product:"MySQL"
port:3306 -authentication
port:3306 "5.5"
port:3306 country:CN
mysql version
```

### MongoDB

```
product:"MongoDB"
port:27017 "MongoDB Server Information"
port:27017 -authentication
"MongoDB Server Information" port:27017 -authentication
mongodb port:27017
```

### PostgreSQL

```
port:5432 "PostgreSQL"
product:"PostgreSQL"
port:5432 country:US
```

### Redis

```
product:"Redis"
port:6379 "redis_version"
port:6379 -authentication
redis
```

### Elasticsearch

```
port:9200 "elastic"
product:"Elasticsearch"
port:9200 json
"You Know, for Search"
```

### Memcached

```
port:11211 "stats"
product:"Memcached"
```

### CouchDB

```
port:5984 "couchdb"
product:"CouchDB"
```

### Microsoft SQL Server

```
port:1433 "Microsoft SQL Server"
product:"Microsoft SQL Server"
```

### Oracle Database

```
port:1521 "oracle"
product:"Oracle Database"
```

### Cassandra

```
port:9042 "Cassandra"
product:"Apache Cassandra"
```

---

## Web Servers & Frameworks

### Apache

```
product:"Apache httpd"
apache
port:80 "Apache"
apache country:US
```

### Nginx

```
product:"nginx"
nginx
port:80 nginx
```

### IIS

```
product:"Microsoft IIS"
"Microsoft-IIS"
IIS
```

### Tomcat

```
product:"Apache Tomcat"
port:8080 "Apache Tomcat"
```

### WebLogic

```
product:"Oracle WebLogic"
"WebLogic Server"
```

### JBoss

```
product:"JBoss"
port:8080 JBoss
```

### Django

```
"DisallowedHost at"
"Django Administration"
```

### Laravel

```
"Laravel" http.title
"Whoops! There was an error"
```

---

## Remote Access

### RDP (Remote Desktop)

```
port:3389
product:"Microsoft Terminal Services"
"\x03\x00\x00\x0b\x06\xd0\x00\x00\x124\x00"
port:3389 country:US
```

### VNC

```
port:5900 "VNC"
product:"VNC"
port:5900 "authentication disabled"
vnc
```

### SSH

```
port:22
product:"OpenSSH"
ssh
port:22 country:CN
```

### TeamViewer

```
port:5938
"TeamViewer"
```

### AnyDesk

```
"AnyDesk"
port:7070
```

### Telnet

```
port:23
telnet
port:23 console
```

### FTP

```
port:21
product:"FileZilla"
port:21 "220" "FTP"
port:21 "anonymous"
```

---

## Network Devices

### Routers

```
"cisco" port:23
product:"Cisco IOS"
"MikroTik RouterOS"
"Juniper" port:23
"NETGEAR"
http.title:"Router"
product:"DD-WRT"
```

### Switches

```
product:"Cisco IOS Switch"
"HP Switch"
"Dell Switch"
port:161 "Cisco"
```

### Firewalls

```
product:"Fortinet FortiGate"
product:"Palo Alto"
product:"pfSense"
product:"SonicWall"
product:"Checkpoint"
http.title:"Firewall"
```

### Load Balancers

```
product:"F5 BIG-IP"
product:"HAProxy"
"nginx load balancer"
product:"Citrix NetScaler"
```

### Modems

```
http.title:"modem"
"cable modem"
"DSL modem"
```

---

## Security Devices

### Intrusion Detection/Prevention

```
product:"Snort"
"IDS"
"IPS"
product:"Suricata"
```

### Antivirus

```
http.title:"antivirus"
"antivirus console"
```

### Security Cameras (NVR/DVR)

```
product:"Hikvision"
product:"Dahua"
"DVR" port:80
"NVR" port:80
http.title:"Network Video Recorder"
```

---

## IoT Devices

### General IoT

```
"IoT"
port:1883 "MQTT"
port:8883
"Raspberry Pi"
"Arduino"
```

### Smart Plugs/Switches

```
"TP-Link"
http.title:"Smart Plug"
"Belkin WeMo"
```

### Smart Lighting

```
"Philips Hue"
"LIFX"
http.title:"smart light"
```

### Environmental Sensors

```
"temperature sensor"
"humidity sensor"
"air quality"
```

---

## Webcams & Surveillance

### IP Cameras

```
"webcam"
http.title:"IP Camera"
port:554 "rtsp"
http.title:"Live View"
product:"Axis Camera"
"Foscam"
http.component:"webcamXP"
title:"Network Camera"
```

### Webcam Software

```
"webcamXP"
"Yawcam"
"iSpy"
http.title:"Blue Iris"
```

### Specific Camera Brands

```
product:"Hikvision IP Camera"
product:"Dahua IP Camera"
"Axis Communications"
"Panasonic Network Camera"
"Sony Network Camera"
"D-Link Camera"
"Vivotek"
```

---

## VOIP Systems

```
port:5060 "SIP"
product:"Asterisk"
"FreePBX"
product:"Cisco Unified"
"3CX Phone System"
port:5060 country:US
"Avaya"
```

---

## Printers

```
"hp printer"
"Canon Printer"
"Xerox"
"Lexmark"
port:9100
http.title:"printer"
product:"CUPS"
"Brother Printer"
"Ricoh"
"Epson"
```

---

## Smart Home Devices

### Smart TVs

```
"Samsung Smart TV"
"LG Smart TV"
"Sony Bravia"
```

### Smart Thermostats

```
"Nest Thermostat"
"Ecobee"
"Honeywell Thermostat"
```

### Smart Doorbells

```
"Ring Doorbell"
"Nest Hello"
```

### Home Automation Hubs

```
"Home Assistant"
"SmartThings"
"Hubitat"
"Wink"
```

---

## Medical Devices

```
"medical device"
http.title:"cardiology"
"patient monitor"
"MRI"
"CT Scanner"
"infusion pump"
"GE Healthcare"
"Philips Medical"
"ultrasound"
```

---

## Building Automation

```
port:47808 "Niagara"
"BACnet"
"HVAC"
"Access Control"
"Honeywell"
http.title:"building automation"
"elevator control"
```

---

## Cloud Services

### Amazon AWS

```
org:"Amazon.com"
org:"Amazon Data Services"
```

### Microsoft Azure

```
org:"Microsoft Azure"
org:"Microsoft Corporation"
```

### Google Cloud

```
org:"Google Cloud"
org:"Google LLC"
```

### DigitalOcean

```
org:"DigitalOcean"
```

---

## Version-Specific Vulnerabilities

### Heartbleed (OpenSSL)

```
vuln:CVE-2014-0160
```

### Shellshock

```
vuln:CVE-2014-6271
```

### SMBv1 (WannaCry, NotPetya)

```
port:445 "SMB"
vuln:CVE-2017-0144
```

### Apache Struts

```
product:"Apache Struts" version:"2.3"
vuln:CVE-2017-5638
```

### Drupal

```
product:"Drupal" version:"7"
vuln:CVE-2018-7600
```

---

## Default Credentials

```
"default password"
http.html:"admin:admin"
http.html:"root:root"
"login" "admin" port:80
```

---

## Misconfigured Services

### Open Directories

```
http.title:"Index of /"
http.title:"Directory listing for /"
```

### Anonymous FTP

```
port:21 "220" "anonymous"
```

### Open Databases

```
port:3306 -authentication
port:27017 -authentication
port:5432 -authentication
port:6379 -authentication
port:9200 -authentication
```

### Unauthenticated Admin Panels

```
http.title:"admin" -authentication
http.title:"dashboard" -authentication
```

### Exposed Docker APIs

```
port:2375 "Docker"
port:2376 "Docker"
```

### Kubernetes Dashboards

```
http.title:"Kubernetes Dashboard"
port:8080 "kubernetes"
```

### Jenkins

```
product:"Jenkins"
http.title:"Dashboard [Jenkins]"
```

### Git Exposed

```
http.title:"Git"
http.html:".git/config"
```

### SVN Exposed

```
http.html:".svn/entries"
```

### Environment Files

```
http.html:".env"
```

---

## Country-Specific Searches

```
country:US port:22
country:CN port:3389
country:RU port:23
country:KR port:80
country:JP port:80
country:DE port:3306
country:GB port:3389
country:IN port:21
country:BR port:80
country:CA port:22
```

---

## Organization Searches

```
org:"Google LLC"
org:"Amazon.com"
org:"Microsoft Corporation"
org:"Facebook"
org:"Cloudflare"
org:"Akamai"
org:"Alibaba"
org:"Tencent"
```

---

## Advanced Query Combinations

### Vulnerable Routers in US

```
product:"Cisco IOS" country:US vuln:CVE-2018-0171
```

### Exposed Databases by Country

```
port:3306 -authentication country:US
```

### Webcams with Default Credentials

```
"IP Camera" "admin" "admin"
```

### Industrial Systems in Europe

```
tag:ics (country:DE OR country:FR OR country:UK OR country:IT)
```

### Cloud Instances Running Vulnerable Software

```
org:"Amazon.com" product:"Apache httpd" version:"2.4.29"
```

### Recent Scans

```
after:01/01/2024 port:22
```

### Multiple Port Scan

```
port:80,443,8080,8443
```

### SSL Certificate Searches

```
ssl.cert.subject.cn:"*.example.com"
ssl.cert.issuer.cn:"Let's Encrypt"
ssl.cert.expired:true
```

### Screenshot-based Searches

```
has_screenshot:true http.title:"login"
```

---

## Shodan Facets

Use facets to get statistics:

```
country:     Count by country
org:         Count by organization
port:        Count by port
product:     Count by product
version:     Count by version
asn:         Count by ASN
os:          Count by OS
city:        Count by city
```

Example: `apache facet:country`

---

## Shodan CLI Commands

```bash
# Search
shodan search "apache"

# Count results
shodan count "port:22"

# Download results
shodan download --limit 1000 apache_servers "apache"

# Parse downloaded data
shodan parse --fields ip_str,port,org --separator , apache_servers.json.gz

# Get host information
shodan host 8.8.8.8

# Get your API info
shodan info

# Initialize API key
shodan init YOUR_API_KEY

# Stream real-time data
shodan stream --limit 10

# Alert creation
shodan alert create "My Network" 1.2.3.0/24

# Scan network
shodan scan submit 1.2.3.0/24
```

---

## Shodan Filters Reference

### Network Filters

```
asn:          Autonomous system number
net:          Network range (CIDR)
port:         Port number
```

### Location Filters

```
city:         City name
country:      Country code
geo:          Lat,lon,radius
postal:       Postal code
region:       Region/State
```

### Organization Filters

```
org:          Organization name
isp:          ISP name
```

### Product/Service Filters

```
product:      Product name
version:      Version number
os:           Operating system
```

### Web Filters

```
http.component:     Web component
http.favicon.hash:  Favicon hash
http.html:          HTML content
http.html_hash:     HTML hash
http.status:        HTTP status code
http.title:         Page title
```

### SSL Filters

```
ssl.cert.expired:       Certificate expired
ssl.cert.issuer.cn:     Issuer CN
ssl.cert.subject.cn:    Subject CN
ssl.version:            SSL/TLS version
has_ssl:                Has SSL
```

### Vulnerability Filters

```
vuln:         CVE number
```

### Other Filters

```
before:       Before date
after:        After date
has_screenshot: Has screenshot
hostname:     Hostname
tag:          Device tag
```

---

## Tips for Effective Shodan Searches

1. **Start Broad, Then Narrow**: Begin with general searches and refine
2. **Combine Filters**: Use multiple filters for precision
3. **Use Facets**: Understand data distribution
4. **Check Screenshots**: Visual verification is helpful
5. **Verify Results**: Always confirm findings
6. **Monitor Changes**: Set up alerts for your assets
7. **Respect Scope**: Only scan authorized networks
8. **Stay Updated**: New filters and features are added regularly
9. **Use API**: Automate repetitive tasks
10. **Export Data**: Download results for offline analysis

---

## Shodan API Libraries

- **Python**: `shodan`
- **Ruby**: `shodan-ruby`
- **Node.js**: `shodan-client`
- **Go**: `go-shodan`
- **PowerShell**: `PSShodan`

---

## Related Tools

- [Shodan CLI](https://cli.shodan.io/)
- [Shodan Filters](https://www.shodan.io/search/filters)
- [Shodan Images](https://images.shodan.io/)
- [Shodan Maps](https://maps.shodan.io/)
- [Shodan Monitor](https://monitor.shodan.io/)
- [Shodan Developer Portal](https://developer.shodan.io/)

---

**Disclaimer**: This collection is for educational and authorized security research purposes only. Unauthorized access to computer systems is illegal. Always obtain proper authorization before conducting security assessments.
