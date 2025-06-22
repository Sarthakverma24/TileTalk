package db

import (
	"context"
)

type Database interface {
	// SetData stores data in the database with expiration
	SetData(ctx context.Context, key string, values ...interface{}) error

	// UpdateData updates data in the database
	UpdateData(ctx context.Context, key string, values ...interface{}) error

	// GetData retrieves data from the database based on the key
	GetData(ctx context.Context, key string, values ...interface{}) (interface{}, error)

	//DeleteData delete entry in the database based on the key
	DeleteData(ctx context.Context, key string, values ...interface{}) error
}
