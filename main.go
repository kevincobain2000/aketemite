package main

import (
	"embed"
	"encoding/json"
	"flag"
	"fmt"
	"net/http"

	"github.com/jasonlvhit/gocron"
	"github.com/kevincobain2000/aketemite/pkg"
	"github.com/labstack/echo/v4"
	"github.com/peterbourgon/diskv/v3"
)

var version = "dev"

//go:embed all:ui/dist/*
var publicDir embed.FS

const (
	BASE_PATH  = "/aketemite"
	PUBLIC_DIR = "ui/dist"
)

var (
	port            string
	configPath      string
	cacheDir        string
	pingFreq        uint64
	deleteCacheFlag bool
)

func main() {
	cliArgs()
	cache := pkg.GetCache(cacheDir)
	if deleteCacheFlag {
		pkg.DeleteCache(cacheDir)
	}

	config := pkg.NewConfig(configPath)

	e := pkg.NewEcho()

	e.GET(BASE_PATH+"/api", func(c echo.Context) error {
		responseCache, err := cache.Read(pkg.CACHE_KEY_RESPONSE_DATA)
		responseData := []pkg.HttpResult{}
		json.Unmarshal(responseCache, &responseData)
		if err != nil {
			return c.JSON(http.StatusInternalServerError, err)
		}
		return c.JSON(http.StatusOK, responseData)
	})
	e.GET(BASE_PATH+"*", func(c echo.Context) error {
		embedPath := c.Request().URL.Path
		embedPath = embedPath[len(BASE_PATH):]
		filename := fmt.Sprintf("%s/%s", PUBLIC_DIR, embedPath)

		filename = pkg.SlashIndexFile(filename)
		filename = pkg.ReplaceDoubleSlash(filename)

		content, err := publicDir.ReadFile(filename)
		if err != nil {
			return c.String(http.StatusNotFound, "404 page not found")
		}

		return c.Blob(http.StatusOK, pkg.GetContentType(filename), content)

	})
	go pkg.GetResponseData(config, cache)
	go scheduler(config, cache)
	e.Start("localhost:" + port)

}

func scheduler(config pkg.Config, cache *diskv.Diskv) {
	gocron.Every(pingFreq).Seconds().Do(pkg.GetResponseData, config, cache)
	<-gocron.Start()
}

func cliArgs() {
	flag.StringVar(&port, "port", "3001", "port to serve")
	flag.StringVar(&configPath, "config-path", "sample.yml", "config path")
	flag.StringVar(&cacheDir, "cache-dir", "/tmp/aketemite", "cache dir")
	flag.Uint64Var(&pingFreq, "ping-freq", 300, "ping frequency")
	flag.BoolVar(&deleteCacheFlag, "delete-cache", false, "delete cache")
	flag.Parse()
}
