<p align="center">
  <a href="https://github.com/kevincobain2000/aketemite">
    <img alt="gobrew" src="https://imgur.com/rcEV0qE.png" width="360">
  </a>
</p>
<p align="center">
  Simple tool written in Go, to ping urls and get the status code.
  <br>
  Monitor up status for websites, api and URLs, with automatic crawling capability.
</p>

**Quick Setup:** One command to ping multiple urls and monitor result.

**Monitor periodically:** Monitor the urls periodically and get the status code.

**Crawling capability:** Crawls entire page, finds the links and obtains the status code.

**Beautiful:** Beautiful and simple dashboard.


# Build Status


## Getting Started

**Step 1)** Install aketemite

```sh
curl -sLk https://raw.githubusercontent.com/kevincobain2000/aketemite/master/install.sh | sh
```

**Step 2)** Prepare config.yml

```yml
# config.yml
urls:
  - name: https://kevincobain2000.github.io
    timeout: 2000
    crawl: false
  - name: https://kevincobain2000.github.io/404
    timeout: 2000
    crawl: true
  - name: https://coveritup.app
    timeout: 2000
    crawl: true
  - name: https://github.com
    timeout: 2000
    crawl: false

```

**Step 3)** Start application

```sh
./aketemite --config=path=config.yml
```

**Step 4)** Confirm application

**UI:** localhost:3000/aketemite
**API:** localhost:3000/aketemite/api
**Logs:** `tail -f logs/app.log`

## Screenshots

![Screenshot](https://imgur.com/cdKYfYK.png)

## Advanced Options

```sh
   Usage of ./aketemite:
   Example ./aketemite --config-path=config.yml --port=3000 --delete-cache --cache-dir=/tmp/aketemite
  -cache-dir string
    	cache dir (default "/tmp/aketemite")
  -config-path string
    	config path (default "config.yml")
  -delete-cache
    	delete cache
  -ping-freq uint
    	ping frequency (default 300)
  -port string
    	port to serve (default "3001")
```

## Development Notes

**API**

```sh
#starts api on port localhost:3001/aketemite/api
air
```

**UI**

```sh
cd ui/
npm install
#starts ui on port localhost:3001/aketemite
npm run dev
```