package dto

import (
	"encoding/json"
	"time"

	"github.com/google/uuid"
)

type DocumentResponse struct {
	ID         uuid.UUID       `json:"id"`
	UserID     uuid.UUID       `json:"user_id"`
	Title      string          `json:"title"`
	Metadata   json.RawMessage `json:"metadata"`
	Visibility string          `json:"visibility"`
	IsStarred  bool            `json:"is_starred"`
	Permission string          `json:"permission"`
	CreatedAt  time.Time       `json:"created_at"`
	UpdatedAt  time.Time       `json:"updated_at"`
}

type CreateDocumentRequest struct {
	Title    string          `json:"title"`
	Metadata json.RawMessage `json:"metadata"`
}

type CreateDocumentResponse struct {
	Document *DocumentResponse `json:"document"`
	Message  string            `json:"message"`
}

type DocumentFilterDTO struct {
	SearchKey string `json:"search_key"`
	SortBy    string `json:"sort_by"`
	IsStarred bool   `json:"is_starred"`
	IsShared  bool   `json:"is_shared"`
	Size      int    `json:"size"`
	Page      int    `json:"page"`
}

type GetDocumentsResponse struct {
	TotalCount int                 `json:"total_count"`
	Documents  []*DocumentResponse `json:"documents"`
	Message    string              `json:"message"`
}

type GetDocumentResponse struct {
	Document *DocumentResponse `json:"document"`
	Message  string            `json:"message"`
}

type UpdateDocumentRequest struct {
	Title      string          `json:"title"`
	Metadata   json.RawMessage `json:"metadata"`
	Visibility string          `json:"visibility"`
	IsStarred  *bool           `json:"is_starred"`
}

type UpdateDocumentResponse struct {
	Document *DocumentResponse `json:"document"`
	Message  string            `json:"message"`
}

type ShareDocumentRequest struct {
	Emails     []string `json:"emails"`
	Permission string   `json:"permission"`
}

type CollaboratorResponse struct {
	UserID     uuid.UUID `json:"user_id"`
	FullName   string    `json:"full_name"`
	Email      string    `json:"email"`
	Permission string    `json:"permission"`
}

type GetCollaboratorsResponse struct {
	Collaborators []*CollaboratorResponse `json:"collaborators"`
	Message       string                  `json:"message"`
}
