package mapper

import (
	"arit-pal/pady/domain"
	"arit-pal/pady/dto"

	"github.com/google/uuid"
)

func ToDocumentDomain(req *dto.CreateDocumentRequest, userID uuid.UUID) *domain.Document {
	title := req.Title
	if title == "" {
		title = "Untitled Document"
	}

	metadata := req.Metadata
	if len(metadata) == 0 {
		metadata = []byte(`{}`)
	}

	return &domain.Document{
		UserID:     userID,
		Title:      title,
		Metadata:   metadata,
		Visibility: "private",
		IsStarred:  false,
		Permission: "owner",
	}
}

func ToDocumentResponseDTO(doc *domain.Document) *dto.DocumentResponse {
	return &dto.DocumentResponse{
		ID:         doc.ID,
		UserID:     doc.UserID,
		Title:      doc.Title,
		Metadata:   doc.Metadata,
		Visibility: doc.Visibility,
		IsStarred:  doc.IsStarred,
		Permission: doc.Permission,
		CreatedAt:  doc.CreatedAt,
		UpdatedAt:  doc.UpdatedAt,
	}
}

func ToDocumentResponseDTOs(docs []*domain.Document) []*dto.DocumentResponse {
	var responses []*dto.DocumentResponse
	for _, doc := range docs {
		responses = append(responses, ToDocumentResponseDTO(doc))
	}
	return responses
}

func ToCollaboratorResponseDTO(collaborator *domain.Collaborator) *dto.CollaboratorResponse {
	return &dto.CollaboratorResponse{
		UserID:     collaborator.UserID,
		Name:       collaborator.Name,
		Email:      collaborator.Email,
		Permission: collaborator.Permission,
	}
}

func ToCollaboratorResponseDTOs(collaborators []*domain.Collaborator) []*dto.CollaboratorResponse {
	var responses []*dto.CollaboratorResponse
	for _, collaborator := range collaborators {
		responses = append(responses, ToCollaboratorResponseDTO(collaborator))
	}

	if responses == nil {
		responses = []*dto.CollaboratorResponse{}
	}
	return responses
}
