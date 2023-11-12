package pkg

import (
	"sync"

	"github.com/sirupsen/logrus"
)

var (
	once sync.Once
	log  *logrus.Logger
)

func Logger() *logrus.Logger {
	once.Do(func() {
		log = logrus.New()
		log.SetFormatter(&logrus.TextFormatter{
			DisableColors:   false,
			FullTimestamp:   true,
			TimestampFormat: "2006-01-02 15:04:05",
		})
		log.SetReportCaller(false)
	})
	return log
}
