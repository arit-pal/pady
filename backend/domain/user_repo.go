package domain

import (
	"context"

	"github.com/jackc/pgx/v5/pgxpool"
)

type userRepo struct {
	pool *pgxpool.Pool
}

func NewUserRepo(pool *pgxpool.Pool) UserRepository {
	return &userRepo{
		pool: pool,
	}
}

func (r *userRepo) UserSignUp(ctx context.Context, user *User) error {
	query := `
		INSERT INTO users (full_name, email, password_hash)
		VALUES ($1, $2, $3)
		RETURNING id, status, created_at, updated_at
	`
	err := r.pool.QueryRow(
		ctx,
		query,
		user.FullName,
		user.Email,
		user.PasswordHash,
	).Scan(
		&user.ID,
		&user.Status,
		&user.CreatedAt,
		&user.UpdatedAt,
	)

	return err
}

func (r *userRepo) CheckEmailExists(ctx context.Context, email string) (bool, error) {
	query := `
		SELECT EXISTS(SELECT 1 FROM users WHERE email = $1)
	`

	var exists bool
	err := r.pool.QueryRow(
		ctx,
		query,
		email,
	).Scan(
		&exists,
	)
	if err != nil {
		return false, err
	}

	return exists, nil
}

func (r *userRepo) GetUserByEmail(ctx context.Context, email string) (*User, error) {
	query := `
		SELECT id, full_name, email, password_hash, status, created_at, updated_at, deleted_at
		FROM users
		WHERE email = $1 AND status = 'active'
	`

	user := &User{}
	err := r.pool.QueryRow(
		ctx,
		query,
		email,
	).Scan(
		&user.ID,
		&user.FullName,
		&user.Email,
		&user.PasswordHash,
		&user.Status,
		&user.CreatedAt,
		&user.UpdatedAt,
		&user.DeletedAt,
	)

	if err != nil {
		return nil, err
	}

	return user, nil
}
