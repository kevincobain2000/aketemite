package pkg

import (
	"reflect"
	"testing"
)

func TestByteSliceToString(t *testing.T) {
	tests := []struct {
		bytes    []byte
		expected string
	}{
		{[]byte("hello"), "hello"},
		{[]byte(""), ""},
	}

	for _, test := range tests {
		t.Run(test.expected, func(t *testing.T) {
			if got := ByteSliceToString(test.bytes); got != test.expected {
				t.Errorf("ByteSliceToString(%v) = %s, want %s", test.bytes, got, test.expected)
			}
		})
	}
}

func TestStringToByteSlice(t *testing.T) {
	tests := []struct {
		str      string
		expected []byte
	}{
		{"hello", []byte("hello")},
		{"", []byte("")},
	}

	for _, test := range tests {
		t.Run(test.str, func(t *testing.T) {
			if got := StringToByteSlice(test.str); !reflect.DeepEqual(got, test.expected) {
				t.Errorf("StringToByteSlice(%s) = %v, want %v", test.str, got, test.expected)
			}
		})
	}
}

func TestStringToMD5Hash(t *testing.T) {
	tests := []struct {
		str      string
		expected string
	}{
		{"hello", "5d41402abc4b2a76b9719d911017c592"},
		{"", "d41d8cd98f00b204e9800998ecf8427e"},
	}

	for _, test := range tests {
		t.Run(test.str, func(t *testing.T) {
			if got := StringToMD5Hash(test.str); got != test.expected {
				t.Errorf("StringToMD5Hash(%s) = %s, want %s", test.str, got, test.expected)
			}
		})
	}
}
