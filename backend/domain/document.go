package domain

import (
	"context"
	"time"

	"github.com/google/uuid"
)

type DocumentRepository interface {
	CreateDocument(ctx context.Context, doc *Document) error
}

type Document struct {
	ID         uuid.UUID `db:"id"`
	UserID     uuid.UUID `db:"user_id"`
	Title      string    `db:"title"`
	Metadata   []byte    `db:"metadata"`
	Visibility string    `db:"visibility"`
	CreatedAt  time.Time `db:"created_at"`
	UpdatedAt  time.Time `db:"updated_at"`
}
