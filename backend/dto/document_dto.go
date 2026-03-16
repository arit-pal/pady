package dto

import (
	"encoding/json"
	"time"

	"github.com/google/uuid"
)

type CreateDocumentRequest struct {
	Title    string          `json:"title"`
	Metadata json.RawMessage `json:"metadata"`
}

type DocumentResponse struct {
	ID         uuid.UUID       `json:"id"`
	UserID     uuid.UUID       `json:"user_id"`
	Title      string          `json:"title"`
	Metadata   json.RawMessage `json:"metadata"`
	Visibility string          `json:"visibility"`
	CreatedAt  time.Time       `json:"created_at"`
	UpdatedAt  time.Time       `json:"updated_at"`
}

type CreateDocumentResponse struct {
	Document *DocumentResponse `json:"document"`
	Message  string            `json:"message"`
}
