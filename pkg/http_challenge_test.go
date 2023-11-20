package pkg

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
)

func TestNewHttpChallenge(t *testing.T) {
	timeout := 100 // timeout in milliseconds
	crawl := true

	hc := NewHttpChallenge(time.Duration(timeout), crawl)

	assert.NotNil(t, hc)
	assert.Equal(t, crawl, hc.crawl)
	// Add more assertions here if you have specific configurations to test in the `browse` object
}

func TestGetResponseDataSingleURL(t *testing.T) {
	// Mock HTTP server
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte("Test Response"))
	}))
	defer server.Close()

	config := Config{
		URLs: []URLConfig{
			{
				Name:    server.URL,
				Timeout: 100, // Set a suitable timeout
				Crawl:   false,
			},
		},
	}

	// Assuming cache is already initialized
	cache := GetCache("../cache_test")

	results := GetResponseData(config, cache)

	assert.Len(t, results, 1)
	assert.Equal(t, http.StatusOK, results[0].ResponseCode)
}

func TestGetOGImageWithOGTag(t *testing.T) {
	// Mock HTML with OG image
	htmlContent := `<html><head><meta property="og:image" content="http://example.com/image.jpg"></head></html>`

	// Mock HTTP server
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		_, _ = w.Write([]byte(htmlContent))
	}))
	defer server.Close()

	// Initialize HttpChallenge
	hc := NewHttpChallenge(time.Duration(1000), true)
	hc.browse.Open(server.URL)

	ogImage := hc.getOGImage()

	assert.Equal(t, "http://example.com/image.jpg", ogImage)
}

func TestPingSuccess(t *testing.T) {
	// Mock HTTP server
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte("Test Response"))
	}))
	defer server.Close()

	hc := NewHttpChallenge(time.Duration(1000), true)

	urlConfig := URLConfig{
		Name:    server.URL,
		Timeout: 1000,
		Crawl:   true,
	}
	hc.ping(server.URL, urlConfig)

	assert.True(t, hc.Result.IsAlive)
	assert.Equal(t, http.StatusOK, hc.Result.ResponseCode)
}

func TestPingFail(t *testing.T) {
	hc := NewHttpChallenge(time.Duration(1000), true)

	urlConfig := URLConfig{
		Name:    "http://nonexistenturl.test",
		Timeout: 1000,
		Crawl:   true,
	}
	hc.ping("http://nonexistenturl.test", urlConfig)

	assert.False(t, hc.Result.IsAlive)
	assert.Equal(t, 0, hc.Result.ResponseCode)
}

func TestResponseSize(t *testing.T) {
	hc := NewHttpChallenge(time.Duration(1000), true)

	// Test for empty body
	sizeEmpty := hc.responseSize("")
	assert.Equal(t, 0, sizeEmpty)

	// Test for non-empty body (e.g., 1024 bytes)
	sizeNonEmpty := hc.responseSize(strings.Repeat("a", 1024))
	assert.Equal(t, 1, sizeNonEmpty)
}

func TestIsStatusSuccess(t *testing.T) {
	hc := NewHttpChallenge(time.Duration(1000), true)

	assert.True(t, hc.isStatusSuccess(200))
	assert.False(t, hc.isStatusSuccess(404))
}

func TestRelativeToAbsoluteURL(t *testing.T) {
	hc := NewHttpChallenge(time.Duration(1000), true)
	// Mock HTTP server
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte("Test Response"))
	}))
	defer server.Close()

	absoluteURL := server.URL + "/page"
	relativeURL := "/page"
	hc.browse.Open(absoluteURL)

	assert.Equal(t, absoluteURL, hc.relativeToAbsoluteURL(absoluteURL))
	assert.Equal(t, absoluteURL, hc.relativeToAbsoluteURL(relativeURL))
}
