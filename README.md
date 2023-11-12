<p align="center">
  <a href="https://github.com/kevincobain2000/aketemite">
    <img alt="gobrew" src="https://imgur.com/rcEV0qE.png" width="360">
  </a>
</p>
<p align="center">
  Simple CLI tool written in Go, to ping a url and get the status code.
  <br>
  Monitor up status for websites, api and URLs, with automatic crawling capability.
</p>

**Quick Setup:** One command to ping multiple urls and get the result.

**Monitor periodically:** Monitor the urls periodically and get the status code.

**Crawling capability:** Crawls entire page, finds the links and obtains the status code.

**Beautiful:** Beautiful and simple UI.


# Build Status


## Installation


## Screenshots

```yml
# sample.yml
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

![Screenshot](https://imgur.com/HkJsFQU.png)

## Development Notes

```sh
air

cd ui/
npm install
npm run dev
```

## Release Notes

```sh
cd ui/
npm install
npm run build

cd ..
go build -o aketemite main.go
```