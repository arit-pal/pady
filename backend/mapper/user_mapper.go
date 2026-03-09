package mapper

import (
	"arit-pal/pady/domain"
	"arit-pal/pady/dto"
)

func ToUserDomain(req *dto.SignUpRequest, passwordHash string) *domain.User {
	return &domain.User{
		FullName:     req.FullName,
		Email:        req.Email,
		PasswordHash: passwordHash,
	}
}

func ToUserResponseDTO(user *domain.User) *dto.UserResponse {
	return &dto.UserResponse{
		ID:        user.ID,
		FullName:  user.FullName,
		Email:     user.Email,
		Status:    user.Status,
		CreatedAt: user.CreatedAt,
		UpdatedAt: user.UpdatedAt,
		DeletedAt: user.DeletedAt,
	}
}
