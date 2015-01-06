package main

import (
	"bufio"
	"flag"
	"log"
	"math/rand"
	"net/http"
	"os"
	"strconv"
	"sync"
	"time"
)

var (
	queryFile = flag.String("query_file", "", "")
)


func worker(rootAddr string, queries []string, counter chan int) {
	for {
		term := queries[rand.Int() % len(queries)]
		query := rootAddr + "/?q=" + term
		resp, err := http.Get(query)
		counter <- 1
		if err == nil {
			resp.Body.Close()
		} else {
			log.Printf("Error querying root: %v", err)
		}
	}
}

func statusUpdate(updates chan int) {
	var counter int64
	for {
		counter += int64(<-updates)
		if counter % 1000 == 0 {
			log.Printf("Sent queries: %v at %v", counter, time.Now().Unix())
		}
	}
}


func loadQueries(s *bufio.Scanner) ([]string, error) {
	var queries []string
	for s.Scan() {
		line := s.Text()
		if len(line) > 3 {
			queries = append(queries, line)
		}
	}
	if err := s.Err(); err != nil {
		return []string{}, err
	}
	return queries, nil
}


func main() {
	flag.Parse()

	jobs, err := strconv.Atoi(os.Getenv("JOBS"))
	if err != nil { panic(err) }
	root := os.Getenv("ROOT_URL")

	log.Printf("Querying %v with %v jobs", root, jobs)

	log.Printf("Reading queries from %q", *queryFile)
	f, err := os.Open(*queryFile)
	if err != nil {
		panic(err)
	}
	defer f.Close()
	queries, err := loadQueries(bufio.NewScanner(f))
	if err != nil {
		panic(err)
	}

	counter := make(chan int, 1000)
	go statusUpdate(counter)

	var wg sync.WaitGroup
	for i := 0; i < jobs; i++ {
		wg.Add(1)
		go worker(root, queries, counter)
	}
	wg.Wait()
}