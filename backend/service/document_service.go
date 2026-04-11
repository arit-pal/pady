package service

import (
	"arit-pal/pady/domain"
	"arit-pal/pady/dto"
	"arit-pal/pady/mapper"
	"context"
	"errors"
	"fmt"

	"github.com/google/uuid"
)

type DocumentService interface {
	CreateDocument(ctx context.Context, req *dto.CreateDocumentRequest, userID uuid.UUID) (*dto.DocumentResponse, error)
	GetDocumentsByUserID(ctx context.Context, userID uuid.UUID, filter *dto.DocumentFilterDTO) ([]*dto.DocumentResponse, int, error)
	GetDocumentByID(ctx context.Context, id uuid.UUID, userID uuid.UUID) (*dto.DocumentResponse, error)
	UpdateDocument(ctx context.Context, id uuid.UUID, req *dto.UpdateDocumentRequest, userID uuid.UUID) (*dto.DocumentResponse, error)
	DeleteDocument(ctx context.Context, id uuid.UUID, userID uuid.UUID) error
	ShareDocument(ctx context.Context, docID uuid.UUID, userID uuid.UUID, req *dto.ShareDocumentRequest) error
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

func (s *documentService) GetDocumentByID(ctx context.Context, id uuid.UUID, userID uuid.UUID) (*dto.DocumentResponse, error) {
	doc, err := s.repo.GetDocumentByID(ctx, id, userID)
	if err != nil {
		return nil, fmt.Errorf("Document not found: %w", err)
	}

	return mapper.ToDocumentResponseDTO(doc), nil
}

func (s *documentService) UpdateDocument(ctx context.Context, id uuid.UUID, req *dto.UpdateDocumentRequest, userID uuid.UUID) (*dto.DocumentResponse, error) {
	doc, err := s.repo.GetDocumentByID(ctx, id, userID)
	if err != nil {
		return nil, fmt.Errorf("Document not found or access denied: %w", err)
	}

	if doc.Permission == "viewer" {
		return nil, errors.New("Access denied: viewers cannot modify documents")
	}

	if req.Title != "" {
		doc.Title = req.Title
	}
	if len(req.Metadata) > 0 {
		doc.Metadata = req.Metadata
	}
	if req.Visibility != "" {
		doc.Visibility = req.Visibility
	}
	if req.IsStarred != nil {
		doc.IsStarred = *req.IsStarred
	}

	err = s.repo.UpdateDocument(ctx, doc, userID)
	if err != nil {
		return nil, fmt.Errorf("Failed to update document: %w", err)
	}

	return mapper.ToDocumentResponseDTO(doc), nil
}

func (s *documentService) DeleteDocument(ctx context.Context, id uuid.UUID, userID uuid.UUID) error {
	err := s.repo.DeleteDocument(ctx, id, userID)
	if err != nil {
		return fmt.Errorf("Failed to delete document: %w", err)
	}

	return nil
}

func (s *documentService) ShareDocument(ctx context.Context, docID uuid.UUID, userID uuid.UUID, req *dto.ShareDocumentRequest) error {
	if len(req.Emails) == 0 {
		return errors.New("No emails provided for sharing")
	}

	permission := req.Permission
	if permission != "editor" && permission != "viewer" {
		permission = "viewer"
	}

	err := s.repo.ShareDocument(ctx, docID, userID, req.Emails, permission)
	if err != nil {
		return fmt.Errorf("Failed to share document: %w", err)
	}

	return nil
}
