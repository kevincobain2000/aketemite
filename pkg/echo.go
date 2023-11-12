package pkg

import (
	"os"
	"path/filepath"
	"strconv"
	"time"

	"github.com/fvbock/endless"
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
	"github.com/sirupsen/logrus"
)

func NewEcho() *echo.Echo {
	e := echo.New()
	SetupLogger(e)
	SetupCors(e)
	return e
}
func SetupCors(e *echo.Echo) {
	// enable cors for localhost:3000
	e.Use(middleware.CORSWithConfig(middleware.CORSConfig{
		AllowOrigins: []string{"http://localhost:3000"},
	}))
}
func SetupLogger(e *echo.Echo) {
	log := Logger()
	e.Use(middleware.RequestLoggerWithConfig(middleware.RequestLoggerConfig{
		LogMethod: true,
		LogURI:    true,
		LogStatus: true,
		LogValuesFunc: func(c echo.Context, values middleware.RequestLoggerValues) error {
			log.WithFields(logrus.Fields{
				"method": values.Method,
				"URI":    values.URI,
				"status": values.Status,
				"time":   time.Now().Format("2006-01-02 15:04:05"),
			}).Info("HTTP Request")

			return nil
		},
	}))
}

// GracefulServerWithPid reloads server with pid
// kill -HUP when binary is changed
// kill -9 when want to kill the process and make the application dead and want to restart
// kill -9 is NOT FOR FAINT HEARTED and must not be done on prod unless SOUT
func GracefulServerWithPid(e *echo.Echo, port string) {
	log := Logger()
	server := endless.NewServer("localhost:"+port, e)
	server.BeforeBegin = func(add string) {
		pidFile := filepath.Join(port + ".pid")
		_ = os.Remove(pidFile)
		err := os.WriteFile(pidFile, []byte(strconv.Itoa(os.Getpid())), 0600)
		if err != nil {
			log.Error("write pid file error: ", err)
		}
		log.Info("started server on localhost:", port)
	}
	if err := server.ListenAndServe(); err != nil {
		log.Error("graceful error: ", err)
	}
}
