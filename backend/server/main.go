package main

import (
	"WorkBhaarat/db"
	"WorkBhaarat/wrapper"
	"encoding/json"
	"log"
	_ "log"
	"net/http"
	_ "net/http"

	"github.com/gorilla/mux"
	_ "github.com/gorilla/mux"
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

func GetRoomMapHandler(w http.ResponseWriter, r *http.Request) {
	enableCORS(&w)
	w.Header().Set("Content-Type", "application/json")

	roomID := mux.Vars(r)["room_id"]
	if roomID == "" {
		http.Error(w, "Missing room_id", http.StatusBadRequest)
		return
	}

	grid, err := userWrapper.GetRoomData(r.Context(), roomID)
	if err != nil {
		http.Error(w, "Failed to get room data: "+err.Error(), http.StatusInternalServerError)
		return
	}

	if err := json.NewEncoder(w).Encode(grid); err != nil {
		http.Error(w, "Failed to encode room data: "+err.Error(), http.StatusInternalServerError)
	}
}

func SignInHandler(w http.ResponseWriter, r *http.Request) {
	enableCORS(&w)
	w.Header().Set("Content-Type", "application/json")

	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}

	switch r.Method {

	case http.MethodGet:
		// Send all registered users
		if err := json.NewEncoder(w).Encode(user); err != nil {
			http.Error(w, "Failed to encode users: "+err.Error(), http.StatusInternalServerError)
			return
		}

	case http.MethodPost:
		var newUser User
		if err := json.NewDecoder(r.Body).Decode(&newUser); err != nil {
			http.Error(w, "Invalid input: "+err.Error(), http.StatusBadRequest)
			return
		}

		// Add user to the in-memory list
		user = append(user, newUser)

		err := userWrapper.SetUserData(r.Context(), (*wrapper.User)(&newUser))
		if err != nil {
			http.Error(w, "Database error: "+err.Error(), http.StatusInternalServerError)
			return
		}
		db.Logger.Sugar().Infoln(user)

		// Send the saved user back in response
		if err := json.NewEncoder(w).Encode(newUser); err != nil {
			http.Error(w, "Failed to encode response: "+err.Error(), http.StatusInternalServerError)
			return
		}
	}
}

func LogInHandler(w http.ResponseWriter, r *http.Request) {
	enableCORS(&w)
	w.Header().Set("Content-Type", "application/json")

	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}

	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	log.Println("✅ POST /api/login called")

	// Decode login request
	var loginUser RegisteredUser
	if err := json.NewDecoder(r.Body).Decode(&loginUser); err != nil {
		http.Error(w, "Invalid input: "+err.Error(), http.StatusBadRequest)
		return
	}

	log.Println("📩 Received login for:", loginUser.Username)

	if loginUser.Username == "" || loginUser.Password == "" {
		http.Error(w, "Username or password missing", http.StatusBadRequest)
		return
	}

	// Validate credentials
	err := userWrapper.GetUserData(r.Context(), (*wrapper.RegisteredUser)(&loginUser))
	if err != nil {
		log.Println("❌ Login failed DB lookup:", err)
		http.Error(w, "Invalid credentials", http.StatusUnauthorized)
		return
	}

	if loginUser.Username == "" || loginUser.Password == "" {
		log.Println("❌ User not found in DB")
		http.Error(w, "Invalid credentials", http.StatusUnauthorized)
		return
	}

	log.Println("✅ Login successful for:", loginUser.Username)

	// Fetch or create player position
	x, y, roomID, err := userWrapper.GetOrCreatePlayerPosition(r.Context(), loginUser.Username)
	if err != nil {
		log.Println("❌ Failed to get or create player position:", err)
		http.Error(w, "Failed to get player position", http.StatusInternalServerError)
		return
	}

	// Send response with login + player position
	resp := map[string]interface{}{
		"user":     loginUser,
		"position": map[string]interface{}{"x": x, "y": y, "room_id": roomID},
	}

	if err := json.NewEncoder(w).Encode(resp); err != nil {
		http.Error(w, "Failed to encode response", http.StatusInternalServerError)
	}
}

func enableCORS(w *http.ResponseWriter) {
	(*w).Header().Set("Access-Control-Allow-Origin", "*")
	(*w).Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
	(*w).Header().Set("Access-Control-Allow-Headers", "Content-Type")
}

func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		enableCORS(&w)
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusOK)
			return
		}
		next.ServeHTTP(w, r)
	})
}
