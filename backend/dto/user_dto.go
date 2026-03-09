package dto

import (
	"time"

	"github.com/google/uuid"
)

type SignUpRequest struct {
	FullName string `json:"full_name"`
	Email    string `json:"email"`
	Password string `json:"password"`
}

type SignUpResponse struct {
	ID      uuid.UUID `json:"id"`
	Message string    `json:"message"`
}

type SignInRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type SignInResponse struct {
	Token   string `json:"token"`
	Message string `json:"message"`
}

type UserResponse struct {
	ID        uuid.UUID  `json:"id"`
	FullName  string     `json:"full_name"`
	Email     string     `json:"email"`
	Status    string     `json:"status"`
	CreatedAt time.Time  `json:"created_at"`
	UpdatedAt time.Time  `json:"updated_at"`
	DeletedAt *time.Time `json:"deleted_at,omitempty"`
}

type GetMeResponse struct {
	UserResponse *UserResponse `json:"user"`
	Message      string        `json:"message"`
}
