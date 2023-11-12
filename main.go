package main

import (
	"encoding/json"
	"flag"
	"net/http"

	"github.com/jasonlvhit/gocron"
	"github.com/kevincobain2000/aketemite/pkg"
	"github.com/labstack/echo/v4"
)

const (
	DEFAULT_PORT = "3001"
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

	e.GET("/aketemite/api", func(c echo.Context) error {
		responseCache, err := cache.Read(pkg.CACHE_KEY_RESPONSE_DATA)
		responseData := []pkg.HttpResult{}
		json.Unmarshal(responseCache, &responseData)
		if err != nil {
			return c.JSON(http.StatusInternalServerError, err)
		}
		return c.JSON(http.StatusOK, responseData)
	})
	go pkg.GetResponseData(config, cache)
	go pkg.GracefulServerWithPid(e, port)
	gocron.Every(pingFreq).Seconds().Do(pkg.GetResponseData, config, cache)
	<-gocron.Start()
}

func cliArgs() {
	flag.StringVar(&port, "port", "3001", "port to serve")
	flag.StringVar(&configPath, "config-path", "sample.yml", "config path")
	flag.StringVar(&cacheDir, "cache-dir", "/tmp/aketemite", "cache dir")
	flag.Uint64Var(&pingFreq, "ping-freq", 60, "ping frequency in seconds")
	flag.BoolVar(&deleteCacheFlag, "delete-cache", false, "delete cache")
	flag.Parse()
}
