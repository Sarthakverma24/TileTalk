package db

import (
	"context"
	"github.com/gocql/gocql"
	"github.com/pkg/errors"
	"go.uber.org/zap"
	"log"
	"time"
)

func zapLogger() *zap.Logger {
	logger, _ := zap.NewDevelopment(
	//zap.AddStacktrace(zap.PanicLevel)
	)
	return logger
}

var Logger = zapLogger()

func Sugar() *zap.SugaredLogger {
	return Logger.Sugar()
}

var logger = Logger

func CreateUserTable(session *gocql.Session) error {
	query := `
		CREATE TABLE IF NOT EXISTS Game.user_data (
		    user_name TEXT,
			name TEXT,
			phone_no TEXT,
			gmail TEXT,
			age INT,
			password TEXT,
			PRIMARY KEY (user_name)
		)
	`
	return session.Query(query).Exec()
}
func CreateRoomTable(session *gocql.Session) error {
	query := `
		CREATE TABLE IF NOT EXISTS Game.room  (
			  room_id TEXT,
			  row INT,
			  col INT,
			  tile_type TEXT,
			  PRIMARY KEY (room_id, row, col)
				)`
	return session.Query(query).Exec()
}

func CreateCharacterTable(session *gocql.Session) error {
	query := `
		CREATE TABLE IF NOT EXISTS Game.characters   (
		    character_id TEXT,
			  room_id TEXT,
			  x INT,
			  y INT,
			  name TEXT,
			  PRIMARY KEY (room_id, character_id)
				)`
	return session.Query(query).Exec()
}

func init() {
	// Initialize the logger
	var err error
	logger := Sugar()
	if err != nil {
		log.Fatal("Failed to initialize logger")
	}
	defer func(logger *zap.SugaredLogger) {
		err := logger.Sync()
		if err != nil {

		}
	}(logger) // flushes buffer, if any
}

type ScyllaDB struct {
	cluster *gocql.ClusterConfig
	session *gocql.Session
}

func CreateCluster(consistency gocql.Consistency, hosts ...string) *gocql.ClusterConfig {
	retryPolicy := &gocql.ExponentialBackoffRetryPolicy{
		Min:        time.Second,
		Max:        10 * time.Second,
		NumRetries: 5,
	}
	cluster := gocql.NewCluster(hosts...)
	cluster.Timeout = 5 * time.Second
	cluster.Port = 9042
	cluster.RetryPolicy = retryPolicy
	cluster.Consistency = consistency
	return cluster
}

func createKeyspace(session *gocql.Session) error {
	err := session.Query(`CREATE KEYSPACE IF NOT EXISTS game WITH replication = {'class': 'SimpleStrategy', 'replication_factor': 3}`).Exec()
	if err != nil {
		return errors.Wrapf(err, "failed to create keyspace")
	}
	return nil
}

func NewScyllaDBSession() (Database, *gocql.Session) {
	// Create the ScyllaDB cluster configuration
	cluster := CreateCluster(gocql.One, "localhost")
	session, err := cluster.CreateSession()
	if err != nil {
		logger.Fatal("Failed to create session", zap.Error(err))
	}

	err = createKeyspace(session)
	if err != nil {
		log.Fatalf("failed to create keyspace: %v", err)
	}

	// Add the keyspace to the cluster configuration
	cluster.Keyspace = "Game"

	err = CreateUserTable(session)
	if err != nil {
		log.Fatalf("failed to create table: %v", err)
	}
	err = CreateRoomTable(session)
	if err != nil {
		log.Fatalf("failed to create table: %v", err)
	}
	err = CreateCharacterTable(session)
	if err != nil {
		log.Fatalf("failed to create table: %v", err)
	}

	// Return the session and the ScyllaDB database instance
	return &ScyllaDB{
		cluster: cluster,
		session: session,
	}, session
}

func (c *ScyllaDB) SetData(ctx context.Context, key string, values ...interface{}) error {

	if len(values) == 0 {
		return errors.New("no values provided")
	}

	if err := c.session.Query(key, values...).WithContext(ctx).Exec(); err != nil {
		logger.Error("Error in SetData (ScyllaDB)", zap.Error(err))
		return err
	}
	return nil
}

func (c *ScyllaDB) UpdateData(ctx context.Context, key string, values ...interface{}) error {
	query := key // Always use the key as the query

	if err := c.session.Query(query, values...).WithContext(ctx).Exec(); err != nil {
		logger.Error("Error in UpdateData (ScyllaDB)", zap.Error(err))
		return err
	}
	return nil
}

func (c *ScyllaDB) GetData(ctx context.Context, query string, values ...interface{}) (interface{}, error) {

	iter := c.session.Query(query, values...).WithContext(ctx).Iter()

	var results []map[string]interface{}

	for {
		m := make(map[string]interface{})
		if !iter.MapScan(m) {
			break
		}
		results = append(results, m)
	}

	if err := iter.Close(); err != nil {
		logger.Warn("Error while closing iterator", zap.Error(err))
		return nil, err
	}

	return results, nil
}

func (c *ScyllaDB) DeleteData(ctx context.Context, key string, values ...interface{}) error {
	if len(values) == 0 {
		return errors.New("no values provided")
	}

	err := c.session.Query(key, values...).WithContext(ctx).Exec()
	if err != nil {
		logger.Error("Error in DeleteData (ScyllaDB)", zap.Error(err))
		return err
	}
	return nil
}
