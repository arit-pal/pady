package handlers

import (
	"arit-pal/pady/dto"
	"arit-pal/pady/middleware"
	"arit-pal/pady/service"
	"encoding/json"
	"net/http"

	"github.com/google/uuid"
)

type documentHandler struct {
	documentService service.DocumentService
}

func NewDocumentHandler(documentService service.DocumentService) *documentHandler {
	return &documentHandler{
		documentService: documentService,
	}
}

func (h *documentHandler) CreateDocument(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	userID, ok := r.Context().Value(middleware.IDKey).(uuid.UUID)
	if !ok {
		w.WriteHeader(http.StatusUnauthorized)
		json.NewEncoder(w).Encode(map[string]string{"error": "Unauthorized: Invalid user ID in context"})
		return
	}

	var req dto.CreateDocumentRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "Invalid JSON payload"})
		return
	}

	docRes, err := h.documentService.CreateDocument(r.Context(), &req, userID)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": err.Error()})
		return
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(dto.CreateDocumentResponse{
		Document: docRes,
		Message:  "Document created successfully",
	})
}
