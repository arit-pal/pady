package domain

import (
	"context"

	"github.com/jackc/pgx/v5/pgxpool"
)

type documentRepo struct {
	pool *pgxpool.Pool
}

func NewDocumentRepo(pool *pgxpool.Pool) DocumentRepository {
	return &documentRepo{
		pool: pool,
	}
}

func (r *documentRepo) CreateDocument(ctx context.Context, doc *Document) error {
	query := `
		INSERT INTO documents (user_id, title, metadata, visibility)
		VALUES ($1, $2, $3, $4)
		RETURNING id, created_at, updated_at
	`
	err := r.pool.QueryRow(
		ctx,
		query,
		doc.UserID,
		doc.Title,
		doc.Metadata,
		doc.Visibility,
	).Scan(
		&doc.ID,
		&doc.CreatedAt,
		&doc.UpdatedAt,
	)

	return err
}
