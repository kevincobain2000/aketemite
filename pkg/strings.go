package pkg

import (
	"crypto/md5"
	"fmt"
	"io"
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
