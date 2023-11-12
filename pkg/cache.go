package pkg

import "github.com/peterbourgon/diskv/v3"

func GetCache(cacheDir string) *diskv.Diskv {
	// Simplest transform function: put all the data files into the base dir.
	flatTransform := func(s string) []string { return []string{} }
	return diskv.New(diskv.Options{
		BasePath:     cacheDir,
		Transform:    flatTransform,
		CacheSizeMax: 1024 * 1024,
	})
}

func DeleteCache(cacheDir string) {
	d := GetCache(cacheDir)
	d.EraseAll()
}
