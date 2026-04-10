package domain

import (
	"arit-pal/pady/dto"
	"context"
	"errors"

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
		INSERT INTO documents (user_id, title, metadata, visibility, is_starred)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING id, created_at, updated_at
	`
	err := r.pool.QueryRow(
		ctx,
		query,
		doc.UserID,
		doc.Title,
		doc.Metadata,
		doc.Visibility,
		doc.IsStarred,
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
		WHERE user_id = $1 AND title ILIKE $2 AND (is_starred = true OR $3 = false)
	`
	var totalCount int
	err := r.pool.QueryRow(
		ctx,
		countQuery,
		userID,
		filter.SearchKey,
		filter.IsStarred,
	).Scan(
		&totalCount,
	)
	if err != nil {
		return nil, 0, err
	}

	selectQuery := `
		SELECT id, user_id, title, metadata, visibility, is_starred, created_at, updated_at 
		FROM documents 
		WHERE user_id = $1 AND title ILIKE $2 AND (is_starred = true OR $3 = false)
		ORDER BY
			CASE WHEN $4 = 'updated_at' THEN updated_at ELSE created_at END DESC
		LIMIT $5 OFFSET $6
	`
	rows, err := r.pool.Query(
		ctx,
		selectQuery,
		userID,
		filter.SearchKey,
		filter.IsStarred,
		filter.SortBy,
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
			&doc.IsStarred,
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

func (r *documentRepo) GetDocumentByID(ctx context.Context, id uuid.UUID, userID uuid.UUID) (*Document, error) {
	query := `
		SELECT id, user_id, title, metadata, visibility, is_starred, created_at, updated_at
		FROM documents
		WHERE id = $1 AND user_id = $2
	`
	doc := &Document{}
	err := r.pool.QueryRow(
		ctx,
		query,
		id,
		userID,
	).Scan(
		&doc.ID,
		&doc.UserID,
		&doc.Title,
		&doc.Metadata,
		&doc.Visibility,
		&doc.IsStarred,
		&doc.CreatedAt,
		&doc.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}

	return doc, nil
}

func (r *documentRepo) UpdateDocument(ctx context.Context, doc *Document) error {
	query := `
		UPDATE documents
		SET title = $1, metadata = $2, visibility = $3, is_starred = $4, updated_at = NOW()
		WHERE id = $5 AND user_id = $6
		RETURNING updated_at
	`
	err := r.pool.QueryRow(
		ctx,
		query,
		doc.Title,
		doc.Metadata,
		doc.Visibility,
		doc.IsStarred,
		doc.ID,
		doc.UserID,
	).Scan(
		&doc.UpdatedAt,
	)
	if err != nil {
		return err
	}

	return nil
}

func (r *documentRepo) DeleteDocument(ctx context.Context, id uuid.UUID, userID uuid.UUID) error {
	query := `
		DELETE FROM documents
		WHERE id = $1 AND user_id = $2
	`
	resp, err := r.pool.Exec(ctx, query, id, userID)
	if err != nil {
		return err
	}

	if resp.RowsAffected() == 0 {
		return errors.New("Document not found or you do not have permission to delete it")
	}

	return nil
}
