package dto

import (
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
