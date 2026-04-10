package domain

import (
	"arit-pal/pady/dto"
	"context"
	"time"

	"github.com/google/uuid"
)

type DocumentRepository interface {
	CreateDocument(ctx context.Context, doc *Document) error
	GetDocumentsByUserID(ctx context.Context, userID uuid.UUID, filter *dto.DocumentFilterDTO) ([]*Document, int, error)
	GetDocumentByID(ctx context.Context, id uuid.UUID, userID uuid.UUID) (*Document, error)
	UpdateDocument(ctx context.Context, doc *Document) error
	DeleteDocument(ctx context.Context, id uuid.UUID, userID uuid.UUID) error
}

type Document struct {
	ID         uuid.UUID `db:"id"`
	UserID     uuid.UUID `db:"user_id"`
	Title      string    `db:"title"`
	Metadata   []byte    `db:"metadata"`
	Visibility string    `db:"visibility"`
	IsStarred  bool      `json:"is_starred"`
	CreatedAt  time.Time `db:"created_at"`
	UpdatedAt  time.Time `db:"updated_at"`
}
