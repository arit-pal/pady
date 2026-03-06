package service

import (
	"arit-pal/pady/config"
	"arit-pal/pady/domain"
	"arit-pal/pady/dto"
	"arit-pal/pady/mapper"
	"context"
	"errors"
	"fmt"
	"strings"

	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

type UserService interface {
	UserSignUp(ctx context.Context, req *dto.SignUpRequest) (uuid.UUID, error)
	UserSignIn(ctx context.Context, req *dto.SignInRequest) (string, error)
}

type userService struct {
	repo domain.UserRepository
}

func NewUserService(repo domain.UserRepository) UserService {
	return &userService{
		repo: repo,
	}
}

func (s *userService) UserSignUp(ctx context.Context, req *dto.SignUpRequest) (uuid.UUID, error) {
	req.Email = strings.TrimSpace(strings.ToLower(req.Email))

	if req.Email == "" || req.FullName == "" {
		return uuid.Nil, errors.New("Invalid input: missing required fields")
	}

	if len(req.Password) < 8 {
		return uuid.Nil, errors.New("Invalid input: password must be at least 8 characters long")
	}

	exists, err := s.repo.CheckEmailExists(ctx, req.Email)
	if err != nil {
		return uuid.Nil, fmt.Errorf("Failed to check email existence: %w", err)
	}
	if exists {
		return uuid.Nil, errors.New("An user with this email already exists")
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return uuid.Nil, fmt.Errorf("Failed to hash password: %w", err)
	}

	user := mapper.ToUserDomain(req, string(hashedPassword))

	err = s.repo.UserSignUp(ctx, user)
	if err != nil {
		return uuid.Nil, fmt.Errorf("Failed to create user in database: %w", err)
	}

	return user.ID, nil
}

func (s *userService) UserSignIn(ctx context.Context, req *dto.SignInRequest) (string, error) {
	req.Email = strings.TrimSpace(strings.ToLower(req.Email))

	if req.Email == "" || req.Password == "" {
		return "", errors.New("Invalid input: missing required fields")
	}

	user, err := s.repo.GetUserByEmail(ctx, req.Email)
	if err != nil {
		return "", errors.New("Invalid email or password")
	}

	err = bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password))
	if err != nil {
		return "", errors.New("Invalid email or password")
	}

	token, err := config.GenerateToken(user.ID, user.Email)
	if err != nil {
		return "", fmt.Errorf("Failed to generate token: %w", err)
	}

	return token, nil
}
