package pkg

import (
	"fmt"
	"os"

	"gopkg.in/yaml.v3"
)

// URLConfig holds the structure of each URL configuration.
type URLConfig struct {
	Name        string `yaml:"name"`
	Timeout     int    `yaml:"timeout"`
	Crawl       bool   `yaml:"crawl"`
	CrawlAssets bool   `yaml:"crawl_assets"`
	Enabled     bool   `yaml:"enabled"`
}

// Config represents the top-level configuration structure.
type Config struct {
	URLs []URLConfig `yaml:"urls"`
}

func NewConfig(configPath string) Config {
	var config Config
	// #nosec
	yamlContent, err := os.ReadFile(configPath)

	if err != nil {
		fmt.Println("Error reading YAML file:", err)
		fmt.Println("Please make sure you have a config.yaml file in the current directory. Or you can specify the path to the config file using the --config-path=/path/config.yml flag.")
		os.Exit(1)
	}
	err = yaml.Unmarshal([]byte(yamlContent), &config)
	if err != nil {
		fmt.Println("Error parsing YAML file:", err)
		os.Exit(1)
	}
	return config
}
