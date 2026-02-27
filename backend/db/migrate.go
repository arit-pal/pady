package db

import (
	"errors"
	"fmt"
	"log"

	"github.com/golang-migrate/migrate/v4"
	_ "github.com/golang-migrate/migrate/v4/database/postgres"
	_ "github.com/golang-migrate/migrate/v4/source/file"
)

func RunMigrations() {
	dsn := GetDSN()

	m, err := migrate.New("file://db/migrations", dsn)
	if err != nil {
		log.Fatalf("Could not create migration instance: %v", err)
	}

	err = m.Up()
	if err != nil && !errors.Is(err, migrate.ErrNoChange) {
		log.Fatalf("Failed to run migrations: %v", err)
	}

	if errors.Is(err, migrate.ErrNoChange) {
		fmt.Println("Database schema is already up to date.")
	} else {
		fmt.Println("Database migrations applied successfully!")
	}
}

func Rollback() {
	dsn := GetDSN()

	m, err := migrate.New("file://db/migrations", dsn)
	if err != nil {
		log.Fatalf("Could not create migration instance: %v", err)
	}

	err = m.Steps(-1)
	if err != nil {
		log.Fatalf("Failed to rollback migration: %v", err)
	}

	fmt.Println("Successfully rolled back the last database migration!")
}
