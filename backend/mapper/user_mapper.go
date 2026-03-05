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
