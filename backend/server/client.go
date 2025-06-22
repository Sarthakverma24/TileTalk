package main

import (
	"log"
	"net/http"
	"sync"

	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool { return true },
}

type Position struct {
	Row int
	Col int
}

var playerPositions = make(map[string]Position)
var adjacentPairs = make(map[string]bool)

type Message struct {
	Username  string `json:"username"`
	Row       int    `json:"row"`
	Col       int    `json:"col"`
	Type      string `json:"type"`
	Target    string `json:"target,omitempty"`
	Action    string `json:"action,omitempty"`
	Message   string `json:"message,omitempty"`
	Sender    string `json:"sender,omitempty"`
	Recipient string `json:"recipient,omitempty"`
}

var (
	clients   = make(map[string]*websocket.Conn)
	clientsMu sync.Mutex
	broadcast = make(chan Message)
)

func handleConnections(w http.ResponseWriter, r *http.Request) {
	username := r.URL.Query().Get("username")
	if username == "" {
		http.Error(w, "username required", http.StatusBadRequest)
		return
	}
	log.Printf("🔌 Incoming WebSocket request for username: %s\n", username)

	ws, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println("❌ Upgrade error:", err)
		return
	}
	defer ws.Close()

	clientsMu.Lock()
	clients[username] = ws
	clientsMu.Unlock()

	log.Printf("✅ WebSocket connection established for %s\n", username)

	for {
		var msg Message
		err := ws.ReadJSON(&msg)
		if err != nil {
			log.Printf("❌ %s disconnected: %v\n", username, err)
			clientsMu.Lock()
			delete(clients, username)
			clientsMu.Unlock()
			delete(playerPositions, username)

			for other := range playerPositions {
				key := generatePairKey(username, other)
				delete(adjacentPairs, key)
			}
			break
		}

		playerPositions[msg.Username] = Position{Row: msg.Row, Col: msg.Col}

		for otherUsername, pos := range playerPositions {
			if otherUsername == msg.Username {
				continue
			}
			if msg.Type == "chat" {
				if recipientConn, ok := clients[msg.Recipient]; ok {
					chatMsg := Message{
						Type:      "chat",
						Sender:    msg.Username,
						Message:   msg.Message,
						Recipient: msg.Recipient,
					}
					recipientConn.WriteJSON(chatMsg)
				}
				continue
			}
			key := generatePairKey(msg.Username, otherUsername)
			adjacentNow := arePlayersAdjacent(msg.Row, msg.Col, pos.Row, pos.Col)
			adjacentBefore := adjacentPairs[key]

			if adjacentNow && !adjacentBefore {
				log.Printf("👥 %s approached %s", msg.Username, otherUsername)
				adjacentPairs[key] = true

				proximityMsg := Message{
					Type:     "proximity",
					Username: msg.Username,
					Target:   otherUsername,
					Action:   "approach",
				}
				broadcast <- proximityMsg

				proximityMsg2 := Message{
					Type:     "proximity",
					Username: otherUsername,
					Target:   msg.Username,
					Action:   "approach",
				}
				broadcast <- proximityMsg2

			} else if !adjacentNow && adjacentBefore {
				log.Printf("🚶 %s moved away from %s", msg.Username, otherUsername)
				delete(adjacentPairs, key)

				broadcast <- Message{
					Type:     "proximity",
					Username: msg.Username,
					Target:   otherUsername,
					Action:   "leave",
				}
				broadcast <- Message{
					Type:     "proximity",
					Username: otherUsername,
					Target:   msg.Username,
					Action:   "leave",
				}
			}

		}

		broadcast <- msg
	}
}

func handleMessages() {
	log.Println("📡 WebSocket broadcaster started")
	for {
		msg := <-broadcast
		clientsMu.Lock()
		for uname, client := range clients {
			err := client.WriteJSON(msg)
			if err != nil {
				log.Printf("⚠️ Failed to send message to %s: %v\n", uname, err)
				client.Close()
				delete(clients, uname)
			}
		}
		clientsMu.Unlock()
	}
}

func arePlayersAdjacent(p1Row, p1Col, p2Row, p2Col int) bool {
	rowDiff := abs(p1Row - p2Row)
	colDiff := abs(p1Col - p2Col)
	return (rowDiff+colDiff == 1)
}

func abs(x int) int {
	if x < 0 {
		return -x
	}
	return x
}

func generatePairKey(a, b string) string {
	if a < b {
		return a + "|" + b
	}
	return b + "|" + a
}
