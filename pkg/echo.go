package pkg

import (
	"time"

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
