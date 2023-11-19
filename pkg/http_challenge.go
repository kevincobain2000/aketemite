package pkg

import (
	"encoding/json"
	"fmt"
	"strings"
	"sync"
	"time"

	"github.com/PuerkitoBio/goquery"
	"github.com/headzoo/surf"
	"github.com/headzoo/surf/browser"
	"github.com/peterbourgon/diskv/v3"
)

const (
	DEFAULT_USERAGENT       = "Go/aketemite"
	CACHE_KEY_RESPONSE_DATA = "response-data"
	CACHE_KEY_LAST_SUCCESS  = "last-success"
	CACHE_KEY_LAST_FAILED   = "last-failed"
)

type HttpResult struct {
	IsAlive      bool       `json:"is_alive"`
	ResponseCode int        `json:"response_code"`
	ResponseTime string     `json:"response_time"`
	ResponseSize int        `json:"response_size"`
	Title        string     `json:"title"`
	Url          string     `json:"url"`
	LastFailed   string     `json:"last_failed"`
	LastSuccess  string     `json:"last_success"`
	HttpAssets   HttpAssets `json:"http_assets"`
}

type HttpChallenge struct {
	browse *browser.Browser
	crawl  bool
	Result HttpResult
}
type HttpAsset struct {
	Alive int `json:"alive"`
	Dead  int `json:"dead"`
}
type HttpAssets struct {
	JsAssets  HttpAsset `json:"js_assets"`
	ImgAssets HttpAsset `json:"img_assets"`
	CssAssets HttpAsset `json:"css_assets"`
}

func NewHttpChallenge(timeout time.Duration, crawl bool) *HttpChallenge {
	b := surf.NewBrowser()
	b.SetUserAgent(DEFAULT_USERAGENT)
	b.SetTimeout(timeout * time.Millisecond)

	return &HttpChallenge{
		browse: b,
		crawl:  crawl,
		Result: HttpResult{},
	}
}

func GetResponseData(config Config, cache *diskv.Diskv) []HttpResult {
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
			Logger().Info("Crawling: ", url.Name)
			urls := []string{url.Name}
			if url.Crawl {
				urls = hc.crawlhrefs(url.Name)
			}
			Logger().Info("Located: ", len(urls), " urls")

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
					Logger().Info("Pinging: ", u)
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

	newResponseData := updateCache(responseData, cache)
	return newResponseData
}

func updateCache(responseData []HttpResult, cache *diskv.Diskv) []HttpResult {
	newResponseData := []HttpResult{}
	for i, result := range responseData {
		sk := StringToMD5Hash(result.Url + CACHE_KEY_LAST_SUCCESS)
		if result.LastSuccess == "" {
			v, err := cache.Read(sk)
			if err == nil {
				responseData[i].LastSuccess = ByteSliceToString(v)
			}
		} else {
			cache.Write(sk, StringToByteSlice(result.LastSuccess))
		}

		fk := StringToMD5Hash(result.Url + CACHE_KEY_LAST_FAILED)
		if result.LastFailed == "" {
			v, err := cache.Read(fk)
			if err == nil {
				responseData[i].LastFailed = ByteSliceToString(v)
			}
		} else {
			cache.Write(fk, StringToByteSlice(result.LastFailed))
		}
		newResponseData = append(newResponseData, responseData[i])
	}
	j, err := json.Marshal(newResponseData)
	if err != nil {
		Logger().Error("Error marshalling json: ", err)
	}
	Logger().Info("Writing to cache")
	cache.Write(CACHE_KEY_RESPONSE_DATA, j)
	return newResponseData
}

func (hc *HttpChallenge) pingHttpAssets(url URLConfig) HttpAssets {
	assets := HttpAssets{}

	tagsAttribute := map[string]string{
		"script": "src",
		"img":    "src",
		"link":   "href",
	}
	for tag, attribute := range tagsAttribute {
		hc.browse.Find(tag).Each(func(_ int, s *goquery.Selection) {
			src, exists := s.Attr(attribute)
			if !exists {
				return
			}

			hcc := NewHttpChallenge(time.Duration(url.Timeout), false)
			src = hc.relativeToAbsoluteURL(src)

			if !strings.HasPrefix(src, "http") && !strings.HasPrefix(src, "//") {
				src = fmt.Sprintf("%s://%s%s", hc.browse.Url().Scheme, hc.browse.Url().Host, src)
			} else if strings.HasPrefix(src, "//") {
				src = fmt.Sprintf("%s:%s", hc.browse.Url().Scheme, src)
			} else if strings.HasPrefix(src, "/") {
				src = fmt.Sprintf("%s://%s%s", hc.browse.Url().Scheme, hc.browse.Url().Host, src)
			} else if strings.HasPrefix(src, "./") {
				src = fmt.Sprintf("%s://%s%s", hc.browse.Url().Scheme, hc.browse.Url().Host, src[1:])
			} else if strings.HasPrefix(src, "../") {
				src = fmt.Sprintf("%s://%s%s", hc.browse.Url().Scheme, hc.browse.Url().Host, src[2:])
			}

			if !IsURL2SubsetOfURL1(hc.browse.Url().Scheme+"://"+hc.browse.Url().Host, src) {
				return
			}
			Logger().Info("Pinging asset: ", src)

			hcc.ping(src)

			// if src endswith .js
			if strings.HasSuffix(src, ".js") {
				if hcc.Result.IsAlive {
					assets.JsAssets.Alive++
				} else {
					assets.JsAssets.Dead++
				}
			} else if strings.HasSuffix(src, ".css") {
				if hcc.Result.IsAlive {
					assets.CssAssets.Alive++
				} else {
					assets.CssAssets.Dead++
				}
			} else if strings.HasSuffix(src, ".png") || strings.HasSuffix(src, ".jpg") || strings.HasSuffix(src, ".jpeg") || strings.HasSuffix(src, ".gif") || strings.HasSuffix(src, ".svg") {
				if hcc.Result.IsAlive {
					assets.ImgAssets.Alive++
				} else {
					assets.ImgAssets.Dead++
				}
			}
		})
	}
	return assets
}
func (hc *HttpChallenge) ping(url string) {
	// response timer
	start := time.Now()
	err := hc.browse.Open(url)
	elapsed := time.Since(start).Round(time.Millisecond)

	var result HttpResult

	if err != nil {
		Logger().Error("Error opening URL: ", err)
		result = HttpResult{
			IsAlive:      false,
			ResponseCode: 0,
			Title:        "",
			Url:          url,
			ResponseTime: elapsed.String(),
			ResponseSize: 0,
			LastFailed:   "",
			LastSuccess:  "",
			HttpAssets:   HttpAssets{},
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
		if hc.crawl {
			result.HttpAssets = hc.pingHttpAssets(URLConfig{
				Name:    url,
				Timeout: 10000,
				Crawl:   false,
			})
		} else {
			result.HttpAssets = HttpAssets{}
		}
	}
	if !result.IsAlive {
		result.LastFailed = time.Now().Format("2006-01-02 15:04:05")
	} else {
		result.LastSuccess = time.Now().Format("2006-01-02 15:04:05")
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
		Logger().Error("Error opening URL: ", err)
		return urls
	}

	// crawl the page and print all links
	hc.browse.Find("a").Each(func(_ int, s *goquery.Selection) {
		href, exists := s.Attr("href")
		if !exists {
			return
		}
		href = hc.relativeToAbsoluteURL(href)

		isSubset := IsURL2SubsetOfURL1(url, href)
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
