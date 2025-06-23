package main

import (
	"WorkBhaarat/db"
	"WorkBhaarat/wrapper"
	"github.com/gorilla/mux"
	"log"
	"net/http"
)

type User struct {
	Username string `json:"username"`
	Name     string `json:"name"`
	Phone_no string `json:"phone_no"`
	Gmail    string `json:"gmail"`
	Age      int    `json:"age"`
	Password string `json:"password"`
}
type RegisteredUser struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

var userWrapper wrapper.UserWrapper

var user []User

func main() {
	loggers := db.Logger.Sugar()

	scyllaWrapper, _ := db.NewScyllaDBSession()
	if scyllaWrapper == nil {
		loggers.Fatal("Failed to initialize scyllaWrapper")
	}
	loggers.Infoln("Successfully initialized ScyllaDB connection")
	userWrapper = wrapper.NewUserWrapper(scyllaWrapper)

	r := mux.NewRouter()

	// REST API routes
	r.HandleFunc("/api/signin", SignInHandler).Methods("GET", "POST", "OPTIONS")
	r.HandleFunc("/api/login", LogInHandler).Methods("GET", "POST", "OPTIONS")
	r.HandleFunc("/api/room/{room_id}", GetRoomMapHandler).Methods("GET", "OPTIONS")

	r.HandleFunc("/ws", handleConnections)

	// Start the broadcaster
	go handleMessages()
	log.Println("📡 WebSocket broadcaster started")

	// Wrap router with CORS
	handlerWithCORS := corsMiddleware(r)

	log.Println("🚀 WebSocket server running on :8080")
	if err := http.ListenAndServe(":8080", handlerWithCORS); err != nil {
		log.Fatal("Server error:", err)
	}
}
