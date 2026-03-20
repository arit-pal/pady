package service

import (
	"arit-pal/pady/domain"
	"arit-pal/pady/dto"
	"arit-pal/pady/mapper"
	"context"
	"fmt"

	"github.com/google/uuid"
)

type DocumentService interface {
	CreateDocument(ctx context.Context, req *dto.CreateDocumentRequest, userID uuid.UUID) (*dto.DocumentResponse, error)
	GetDocumentsByUserID(ctx context.Context, userID uuid.UUID, filter *dto.DocumentFilterDTO) ([]*dto.DocumentResponse, int, error)
}

type documentService struct {
	repo domain.DocumentRepository
}

func NewDocumentService(repo domain.DocumentRepository) DocumentService {
	return &documentService{
		repo: repo,
	}
}

func (s *documentService) CreateDocument(ctx context.Context, req *dto.CreateDocumentRequest, userID uuid.UUID) (*dto.DocumentResponse, error) {
	doc := mapper.ToDocumentDomain(req, userID)

	err := s.repo.CreateDocument(ctx, doc)
	if err != nil {
		return nil, fmt.Errorf("Failed to create document in database: %w", err)
	}

	return mapper.ToDocumentResponseDTO(doc), nil
}

func (s *documentService) GetDocumentsByUserID(ctx context.Context, userID uuid.UUID, filter *dto.DocumentFilterDTO) ([]*dto.DocumentResponse, int, error) {
	docs, totalCount, err := s.repo.GetDocumentsByUserID(ctx, userID, filter)
	if err != nil {
		return nil, 0, fmt.Errorf("Failed to retrieve documents: %w", err)
	}

	return mapper.ToDocumentResponseDTOs(docs), totalCount, nil
}
