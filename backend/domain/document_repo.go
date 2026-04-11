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
		FROM documents d
		LEFT JOIN document_shares ds ON d.id = ds.document_id AND ds.user_id = $1
		WHERE d.title ILIKE $2 AND (d.is_starred = true OR $3 = false)
		AND (
			($4 = false AND d.user_id = $1) OR 
			($4 = true AND ds.user_id IS NOT NULL)
		)
	`
	var totalCount int
	err := r.pool.QueryRow(
		ctx,
		countQuery,
		userID,
		filter.SearchKey,
		filter.IsStarred,
		filter.IsShared,
	).Scan(
		&totalCount,
	)
	if err != nil {
		return nil, 0, err
	}

	selectQuery := `
		SELECT 
			d.id, d.user_id, d.title, d.metadata, d.visibility, d.is_starred, d.created_at, d.updated_at,
			COALESCE(ds.permission, 'owner') AS permission
		FROM documents d
		LEFT JOIN document_shares ds ON d.id = ds.document_id AND ds.user_id = $1
		WHERE d.title ILIKE $2 AND (d.is_starred = true OR $3 = false)
		AND (
			($4 = false AND d.user_id = $1) OR 
			($4 = true AND ds.user_id IS NOT NULL)
		)
		ORDER BY
			CASE WHEN $5 = 'updated_at' THEN d.updated_at ELSE d.created_at END DESC
		LIMIT $6 OFFSET $7
	`
	rows, err := r.pool.Query(
		ctx,
		selectQuery,
		userID,
		filter.SearchKey,
		filter.IsStarred,
		filter.IsShared,
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
			&doc.Permission,
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
		SELECT 
			d.id, d.user_id, d.title, d.metadata, d.visibility, d.is_starred, d.created_at, d.updated_at,
			CASE 
				WHEN d.user_id = $2 THEN 'owner'
				WHEN ds.permission IS NOT NULL THEN ds.permission
				WHEN d.visibility = 'public' THEN 'viewer'
			END AS permission
		FROM documents d
		LEFT JOIN document_shares ds ON d.id = ds.document_id AND ds.user_id = $2
		WHERE d.id = $1 AND (
			d.user_id = $2 OR 
			ds.user_id IS NOT NULL OR 
			d.visibility = 'public'
		)
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
		&doc.Permission,
	)
	if err != nil {
		return nil, err
	}

	return doc, nil
}

func (r *documentRepo) UpdateDocument(ctx context.Context, doc *Document, userID uuid.UUID) error {
	query := `
        UPDATE documents
        SET title = $1, metadata = $2, visibility = $3, is_starred = $4, updated_at = NOW()
        WHERE id = $5 AND (
            user_id = $6 OR 
            EXISTS (SELECT 1 FROM document_shares WHERE document_id = $5 AND user_id = $6 AND permission = 'editor')
        )
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
		userID,
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
	resp, err := r.pool.Exec(
		ctx,
		query,
		id,
		userID,
	)
	if err != nil {
		return err
	}

	if resp.RowsAffected() == 0 {
		return errors.New("Document not found or you do not have permission to delete it")
	}

	return nil
}

func (r *documentRepo) ShareDocument(ctx context.Context, docID uuid.UUID, userID uuid.UUID, emails []string, permission string) error {
	var isOwner bool
	checkQuery := `SELECT EXISTS(SELECT 1 FROM documents WHERE id = $1 AND user_id = $2)`

	err := r.pool.QueryRow(
		ctx,
		checkQuery,
		docID,
		userID,
	).Scan(
		&isOwner,
	)
	if err != nil {
		return err
	}

	if !isOwner {
		return errors.New("Access denied: only the document owner can manage sharing")
	}

	query := `
		INSERT INTO document_shares (document_id, user_id, permission)
		SELECT $1, id, $2 FROM users WHERE email = ANY($3) AND status = 'active' AND id != $4
		ON CONFLICT (document_id, user_id) DO UPDATE SET permission = EXCLUDED.permission
	`
	_, err = r.pool.Exec(ctx,
		query,
		docID,
		permission,
		emails,
		userID,
	)
	if err != nil {
		return err
	}

	return nil
}

func (r *documentRepo) GetCollaborators(ctx context.Context, docID uuid.UUID, userID uuid.UUID) ([]*Collaborator, error) {
	var isOwner bool
	checkQuery := `SELECT EXISTS(SELECT 1 FROM documents WHERE id = $1 AND user_id = $2)`

	err := r.pool.QueryRow(
		ctx,
		checkQuery,
		docID,
		userID,
	).Scan(
		&isOwner,
	)
	if err != nil {
		return nil, err
	}

	if !isOwner {
		return nil, errors.New("Access denied: only the document owner can view collaborators")
	}

	query := `
		SELECT u.id, u.full_name, u.email, ds.permission
		FROM document_shares ds
		JOIN users u ON ds.user_id = u.id
		WHERE ds.document_id = $1
		ORDER BY ds.permission ASC, u.full_name ASC
	`
	rows, err := r.pool.Query(
		ctx,
		query,
		docID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var collaborators []*Collaborator
	for rows.Next() {
		collaborator := &Collaborator{}
		err := rows.Scan(
			&collaborator.UserID,
			&collaborator.Name,
			&collaborator.Email,
			&collaborator.Permission,
		)
		if err != nil {
			return nil, err
		}
		collaborators = append(collaborators, collaborator)
	}

	if err = rows.Err(); err != nil {
		return nil, err
	}

	return collaborators, nil
}

func (r *documentRepo) RemoveCollaborator(ctx context.Context, docID uuid.UUID, collaboratorID uuid.UUID, userID uuid.UUID) error {
	var isOwner bool
	checkQuery := `SELECT EXISTS(SELECT 1 FROM documents WHERE id = $1 AND user_id = $2)`

	err := r.pool.QueryRow(
		ctx,
		checkQuery,
		docID,
		userID,
	).Scan(
		&isOwner,
	)
	if err != nil {
		return err
	}

	if !isOwner {
		return errors.New("Access denied: only the document owner can manage sharing")
	}

	query := `DELETE FROM document_shares WHERE document_id = $1 AND user_id = $2`
	resp, err := r.pool.Exec(
		ctx,
		query,
		docID,
		collaboratorID,
	)
	if err != nil {
		return err
	}

	if resp.RowsAffected() == 0 {
		return errors.New("Collaborator not found or already removed")
	}

	return nil
}
