package domain

import (
	"context"

	"github.com/jackc/pgx/v5/pgxpool"
)

type UserRepo struct {
	pool *pgxpool.Pool
}

func NewUserRepo(pool *pgxpool.Pool) UserRepository {
	return &UserRepo{
		pool: pool,
	}
}

func (r *UserRepo) UserSignUp(ctx context.Context, user *User) error {
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

func (r *UserRepo) CheckEmailExists(ctx context.Context, email string) (bool, error) {
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
