package domain

import (
	"arit-pal/pady/dto"
	"context"

	"github.com/google/uuid"
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

func (r *documentRepo) GetDocumentsByUserID(ctx context.Context, userID uuid.UUID, filter *dto.DocumentFilterDTO) ([]*Document, int, error) {
	countQuery := `
		SELECT COUNT(*) 
		FROM documents 
		WHERE user_id = $1 AND title ILIKE $2
	`
	var totalCount int
	err := r.pool.QueryRow(
		ctx,
		countQuery,
		userID,
		filter.SearchKey,
	).Scan(
		&totalCount,
	)
	if err != nil {
		return nil, 0, err
	}

	selectQuery := `
		SELECT id, user_id, title, metadata, visibility, created_at, updated_at 
		FROM documents 
		WHERE user_id = $1 AND title ILIKE $2
		ORDER BY updated_at DESC 
		LIMIT $3 OFFSET $4
	`
	rows, err := r.pool.Query(
		ctx,
		selectQuery,
		userID,
		filter.SearchKey,
		filter.Size,
		filter.Page,
	)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var docs []*Document
	for rows.Next() {
		doc := &Document{}
		err := rows.Scan(
			&doc.ID,
			&doc.UserID,
			&doc.Title,
			&doc.Metadata,
			&doc.Visibility,
			&doc.CreatedAt,
			&doc.UpdatedAt,
		)
		if err != nil {
			return nil, 0, err
		}
		docs = append(docs, doc)
	}

	if err = rows.Err(); err != nil {
		return nil, 0, err
	}

	return docs, totalCount, nil
}
