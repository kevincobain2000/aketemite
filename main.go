package main

import (
	"flag"
	"net/http"

	"github.com/kevincobain2000/aketemite/pkg"
	"github.com/labstack/echo/v4"
)

const (
	DEFAULT_PORT = "3001"
)

var (
	port       string
	configPath string
)

func main() {
	cliArgs()

	config := pkg.NewConfig(configPath)
	responseData := pkg.GetResponseData(config)

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
