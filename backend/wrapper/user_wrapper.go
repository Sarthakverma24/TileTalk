package wrapper

import (
	"WorkBhaarat/db"
	"context"
	"fmt"
	"log"
	"math"
)

type UserWrapper struct {
	db db.Database
}

func NewUserWrapper(db db.Database) UserWrapper { //for future use
	return UserWrapper{db: db}
}

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

func (d *UserWrapper) SetUserData(ctx context.Context, user *User) error {
	query := `
		INSERT INTO Game.user_data (
			user_name, name, phone_no, gmail, age, password
		) VALUES (?, ?, ?, ?, ?, ?)
	`

	err := d.db.SetData(ctx, query,
		user.Username,
		user.Name,
		user.Phone_no,
		user.Gmail,
		user.Age,
		user.Password,
	)
	if err != nil {
		return err
	}
	return nil

}

func (d *UserWrapper) GetUserData(ctx context.Context, registeredUser *RegisteredUser) error {
	log.Println("🔍 Checking credentials for:", registeredUser.Username)

	query := `SELECT password FROM Game.user_data WHERE user_name = ?`

	// Run query
	result, err := d.db.GetData(ctx, query, registeredUser.Username)
	if err != nil {
		return fmt.Errorf("database query failed: %w", err)
	}

	// Assert result type
	rows, ok := result.([]map[string]interface{})
	if !ok || len(rows) == 0 {
		return fmt.Errorf("user not found or unexpected result type")
	}

	// Get first row
	row := rows[0]
	dbPasswordRaw, ok := row["password"]
	if !ok || dbPasswordRaw == nil {
		return fmt.Errorf("password not found in DB row")
	}

	// Assert password is string
	dbPassword, ok := dbPasswordRaw.(string)
	if !ok {
		return fmt.Errorf("invalid password format")
	}

	// Compare passwords
	if registeredUser.Password != dbPassword {
		return fmt.Errorf("invalid password")
	}

	log.Println("✅ User authenticated successfully")
	return nil
}

func (d *UserWrapper) GetOrCreatePlayerPosition(ctx context.Context, username string) (int, int, string, error) {
	query := `SELECT x, y, room_id FROM Game.characters WHERE name = ? ALLOW FILTERING`

	result, err := d.db.GetData(ctx, query, username)
	if err == nil && result != nil {
		// You need to type assert result into what your DB returns —
		// typically a map or a struct slice, depending on your db layer

		if row, ok := result.(map[string]interface{}); ok {
			x, _ := row["x"].(int)
			y, _ := row["y"].(int)
			roomID, _ := row["room_id"].(string)
			return x, y, roomID, nil
		}
	}

	insertQuery := `
		INSERT INTO Game.characters (character_id, room_id, x, y, name)
		VALUES (?, ?, ?, ?, ?)
	`
	roomID := "room1"
	x, y := 0, 7
	err = d.db.SetData(ctx, insertQuery, username, roomID, x, y, username)
	if err != nil {
		return 0, 0, "", err
	}

	return x, y, roomID, nil
}

func (d *UserWrapper) GetRoomData(ctx context.Context, roomID string) ([][]string, error) {
	log.Println("📦 Fetching room data for room_id:", roomID)

	query := `SELECT row, col, tile_type FROM Game.room WHERE room_id = ?`
	result, err := d.db.GetData(ctx, query, roomID)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch room data: %w", err)
	}

	rows, ok := result.([]map[string]interface{})
	if !ok {
		return nil, fmt.Errorf("unexpected result type")
	}

	// Handle empty room case
	if len(rows) == 0 {
		return [][]string{{"G"}}, nil
	}

	// Find min/max coordinates
	minRow, maxRow := math.MaxInt32, math.MinInt32
	minCol, maxCol := math.MaxInt32, math.MinInt32

	for _, row := range rows {
		r, okR := row["row"].(int)
		c, okC := row["col"].(int)
		if !okR || !okC {
			continue
		}

		if r < minRow {
			minRow = r
		}
		if r > maxRow {
			maxRow = r
		}
		if c < minCol {
			minCol = c
		}
		if c > maxCol {
			maxCol = c
		}
	}

	// Calculate grid dimensions
	rowsCount := maxRow - minRow + 1
	colsCount := maxCol - minCol + 1
	log.Println(rowsCount, colsCount)
	// Initialize grid with grass
	grid := make([][]string, rowsCount)
	for r := range grid {
		grid[r] = make([]string, colsCount)
		for c := range grid[r] {
			grid[r][c] = "G"
		}
	}

	// Populate grid with tiles
	for _, row := range rows {
		r, okR := row["row"].(int)
		c, okC := row["col"].(int)
		tileType, okT := row["tile_type"].(string)

		if !okR || !okC || !okT {
			continue
		}

		adjR := r - minRow
		adjC := c - minCol

		if adjR >= 0 && adjR < rowsCount && adjC >= 0 && adjC < colsCount {
			grid[adjR][adjC] = tileType
		}
	}

	log.Println("✅ Room data loaded successfully")
	return grid, nil
}
