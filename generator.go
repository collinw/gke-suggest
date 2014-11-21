package main

import (
	"bufio"
	"encoding/json"
	"flag"
	"os"
	"strconv"
	"strings"

	"github.com/serialx/hashring"
)

var (
	dict = flag.String("dict", "/usr/share/dict/words", "Dict file to use")
	numLeaves = flag.Int64("num_leaves", 10, "")
)

type suggestTable map[string][]string

type suggestEntry struct {
	Key string
	Suggestions []string
	Leaf string
}

func buildSuggestions(s *bufio.Scanner) (*suggestTable, error) {
	table := suggestTable{}
	for s.Scan() {
		line := s.Text()
		if len(line) > 3 {
			key := strings.ToLower(line)
			table[key] = []string{key, key, key, key}
		}
	}
	if err := s.Err(); err != nil {
		return nil, err
	}
	return &table, nil
}

func writeSuggestions(w *bufio.Writer, t *suggestTable, ring *hashring.HashRing) error {
	for key, suggestions := range *t {
		node, ok := ring.GetNode(key)
		if !ok { panic("Failed to get node") }
		jsonData, err := json.Marshal(&suggestEntry{
			Key: key,
			Suggestions: suggestions,
			Leaf: node,
		})
		if err != nil {
			return err
		}
		jsonData = append(jsonData, byte('\n'))
		if _, err := w.Write(jsonData); err != nil {
			return err
		}
	}
	return nil
}

func buildLeaves(numLeaves int) []string {
	var leaves []string
	for i := 0; i <= numLeaves; i++ {
		leaves = append(leaves, strconv.Itoa(i))
	}
	return leaves
}


func main() {
	flag.Parse()

	ring := hashring.New(buildLeaves(int(*numLeaves)))

	f, err := os.Open(*dict)
	if err != nil {
		panic(err)
	}
	defer f.Close()
	scanner := bufio.NewScanner(f)
	table, err := buildSuggestions(scanner)
	if err != nil {
		panic(err)
	}

	writer := bufio.NewWriter(os.Stdout)
	err = writeSuggestions(writer, table, ring)
	if err != nil {
		panic(err)
	}
}