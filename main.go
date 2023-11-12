package main

import (
	"flag"
	"net/http"

	"github.com/kevincobain2000/aketemite/pkg"
	"github.com/labstack/echo/v4"
	"github.com/peterbourgon/diskv/v3"
)

const (
	DEFAULT_PORT = "3001"
	CACHE_DIR    = "/tmp/aketemite"
)

var (
	port       string
	configPath string
)

func main() {
	cliArgs()
	cache := getCache()

	config := pkg.NewConfig(configPath)
	responseData := pkg.GetResponseData(config, cache)

	e := pkg.NewEcho()

	e.GET("/aketemite/api", func(c echo.Context) error {
		return c.JSON(http.StatusOK, responseData)
	})
	pkg.GracefulServerWithPid(e, port)
}

func cliArgs() {
	flag.StringVar(&port, "port", "3001", "port to serve")
	flag.StringVar(&configPath, "config-path", "sample.yml", "config path")
	flag.Parse()
}

func getCache() *diskv.Diskv {
	// Simplest transform function: put all the data files into the base dir.
	flatTransform := func(s string) []string { return []string{} }

	// Initialize a new diskv store, rooted at "my-data-dir", with a 1MB cache.
	d := diskv.New(diskv.Options{
		BasePath:     CACHE_DIR,
		Transform:    flatTransform,
		CacheSizeMax: 1024 * 1024,
	})

	return d
}
