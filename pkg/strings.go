package pkg

import (
	"crypto/md5"
	"fmt"
	"io"
	"net/url"
	"strings"
)

func ByteSliceToString(b []byte) string {
	return string(b)
}
func StringToByteSlice(s string) []byte {
	return []byte(s)
}

func StringToMD5Hash(s string) string {
	h := md5.New()
	_, err := io.WriteString(h, s)
	if err != nil {
		// Handle the error according to your needs.
		return ""
	}
	return fmt.Sprintf("%x", h.Sum(nil))
}

func IsURL2SubsetOfURL1(u1, u2 string) bool {
	// Parse both URLs
	parsedURL1, err := url.Parse(u1)
	if err != nil {
		return false
	}

	parsedURL2, err := url.Parse(u2)
	if err != nil {
		return false
	}

	// Normalize and check the scheme
	if parsedURL1.Scheme != parsedURL2.Scheme {
		return false
	}

	// Normalize hosts and check if u2's host is the same as or a subdomain of u1's host
	if !isSubdomainOrSame(normalizeHost(parsedURL1.Host), normalizeHost(parsedURL2.Host)) {
		return false
	}

	// Existing path prefix check
	if !strings.HasPrefix(parsedURL2.Path, parsedURL1.Path) {
		return false
	}

	// Existing query parameter check
	params1 := parsedURL1.Query()
	params2 := parsedURL2.Query()

	for key, values := range params1 {
		if val2, ok := params2[key]; !ok || !IsEqualSlice(values, val2) {
			return false
		}
	}

	return true
}

// NormalizeHost removes trailing dots from hosts.
func normalizeHost(host string) string {
	return strings.TrimSuffix(host, ".")
}

// isSubdomainOrSame checks if one host is a subdomain of another or they are identical.
func isSubdomainOrSame(baseHost, subHost string) bool {
	if baseHost == subHost {
		return true
	}
	if strings.HasSuffix(subHost, "."+baseHost) {
		return true
	}
	return false
}

func RemoveAnyQueryParam(u string) string {
	if strings.Contains(u, "?") {
		return strings.Split(u, "?")[0]
	}
	return u
}

func GetBaseURL(u string) string {
	parsedURL, err := url.Parse(u)
	if err != nil {
		return ""
	}
	return parsedURL.Scheme + "://" + parsedURL.Host
}
