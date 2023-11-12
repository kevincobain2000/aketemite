package pkg

import (
	"fmt"
	"net/url"
	"strings"
	"sync"
	"time"

	"github.com/PuerkitoBio/goquery"
	"github.com/headzoo/surf"
	"github.com/headzoo/surf/browser"
	"github.com/sirupsen/logrus"
)

const (
	DEFAULT_USERAGENT = "Go/aketemite"
	CACHE_DIR         = "/tmp/aketemite"
)

type HttpResult struct {
	IsAlive      bool   `json:"is_alive"`
	ResponseCode int    `json:"response_code"`
	ResponseTime string `json:"response_time"`
	ResponseSize int    `json:"response_size"`
	Title        string `json:"title"`
	Url          string `json:"url"`
	LastFailed   string `json:"last_failed"`
	LastSuccess  string `json:"last_success"`
}

type HttpChallenge struct {
	browse *browser.Browser
	crawl  bool
	Result HttpResult
	log    *logrus.Logger
}

func NewHttpChallenge(timeout time.Duration, crawl bool) *HttpChallenge {
	l := logrus.New()
	b := surf.NewBrowser()
	b.SetUserAgent(DEFAULT_USERAGENT)
	b.SetTimeout(timeout * time.Millisecond)

	return &HttpChallenge{
		browse: b,
		crawl:  crawl,
		Result: HttpResult{},
		log:    l,
	}
}

func GetResponseData(config Config) []HttpResult {
	alreadyPingUrls := make(map[string]struct{})
	var mu sync.Mutex // To protect concurrent access to alreadyPingUrls
	var wg sync.WaitGroup
	responseData := []HttpResult{}
	resultsChan := make(chan HttpResult)

	// Crawling urls
	for _, url := range config.URLs {
		wg.Add(1)
		go func(url URLConfig) {
			defer wg.Done()
			hc := NewHttpChallenge(time.Duration(url.Timeout), url.Crawl)
			hc.log.Info("Crawling: ", url.Name)
			urls := []string{url.Name}
			if url.Crawl {
				urls = hc.crawlhrefs(url.Name)
			}
			hc.log.Info("Located: ", len(urls), " urls")

			for _, u := range urls {
				mu.Lock()
				if _, exists := alreadyPingUrls[u]; exists {
					mu.Unlock()
					continue
				}
				alreadyPingUrls[u] = struct{}{}
				mu.Unlock()

				wg.Add(1)
				go func(u string) {
					defer wg.Done()
					hc.log.Info("Pinging: ", u)
					hc.ping(u)
					resultsChan <- hc.Result
				}(u)
			}
		}(url)
	}

	// Collecting results
	go func() {
		wg.Wait()
		close(resultsChan)
	}()

	for result := range resultsChan {
		responseData = append(responseData, result)
	}

	return responseData
}

func (hc *HttpChallenge) ping(url string) {
	// response timer
	start := time.Now()
	err := hc.browse.Open(url)
	elapsed := time.Since(start).Round(time.Millisecond)

	var result HttpResult

	if err != nil {
		hc.log.Error("Error opening URL: ", err)
		result = HttpResult{
			IsAlive:      false,
			ResponseCode: 0,
			Title:        "",
			Url:          url,
			ResponseTime: elapsed.String(),
			ResponseSize: 0,
			LastFailed:   time.Now().Format(time.RFC3339),
			LastSuccess:  "",
		}
	} else {
		result = HttpResult{
			IsAlive:      hc.isStatusSuccess(hc.browse.StatusCode()),
			ResponseCode: hc.browse.StatusCode(),
			Title:        hc.browse.Title(),
			Url:          url,
			ResponseTime: elapsed.String(),
			ResponseSize: hc.responseSize(hc.browse.Body()),
			LastFailed:   "",
			LastSuccess:  "",
		}
		if !result.IsAlive {
			result.LastFailed = time.Now().Format(time.RFC3339)
		} else {
			result.LastSuccess = time.Now().Format(time.RFC3339)
		}
	}

	hc.Result = result
}

func (hc *HttpChallenge) responseSize(body string) int {
	bytes := len(body)
	kb := bytes / 1024
	return kb
}
func (hc *HttpChallenge) isStatusSuccess(code int) bool {
	return code >= 200 && code < 400
}

func (hc *HttpChallenge) crawlhrefs(url string) []string {
	urls := []string{}
	urls = append(urls, url)
	err := hc.browse.Open(url)
	if err != nil {
		hc.log.Error("Error opening URL: ", err)
		return urls
	}

	// crawl the page and print all links
	hc.browse.Find("a").Each(func(_ int, s *goquery.Selection) {
		href, exists := s.Attr("href")
		if !exists {
			return
		}
		href = hc.relativeToAbsoluteURL(href)

		isSubset := hc.isURL2SubsetOfURL1(url, href)
		if isSubset {
			urls = append(urls, href)
		}
	})
	urls = UniqueStrings(urls)
	return urls
}

func (hc *HttpChallenge) relativeToAbsoluteURL(href string) string {
	if !strings.HasPrefix(href, "http") && !strings.HasPrefix(href, "//") {
		href = fmt.Sprintf("%s://%s%s", hc.browse.Url().Scheme, hc.browse.Url().Host, href)
	}
	return href
}

func (hc *HttpChallenge) isURL2SubsetOfURL1(url1 string, url2 string) bool {
	// Parse both URLs
	parsedURL1, err := url.Parse(url1)
	if err != nil {
		return false
	}

	parsedURL2, err := url.Parse(url2)
	if err != nil {
		return false
	}

	// Check the scheme and host
	if parsedURL1.Scheme != parsedURL2.Scheme || parsedURL1.Host != parsedURL2.Host {
		return false
	}

	if !strings.HasPrefix(parsedURL2.Path, parsedURL1.Path) {
		return false
	}

	// Check query parameters
	params1 := parsedURL1.Query()
	params2 := parsedURL2.Query()

	for key, values := range params1 {
		if val2, ok := params2[key]; !ok || !IsEqualSlice(values, val2) {
			return false
		}
	}

	return true
}
