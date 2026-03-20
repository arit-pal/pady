package handlers

import (
	"arit-pal/pady/dto"
	"arit-pal/pady/middleware"
	"arit-pal/pady/service"
	"encoding/json"
	"net/http"
	"strconv"

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

func (h *documentHandler) GetMyDocuments(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	userID, ok := r.Context().Value(middleware.IDKey).(uuid.UUID)
	if !ok {
		w.WriteHeader(http.StatusUnauthorized)
		json.NewEncoder(w).Encode(map[string]string{"error": "Unauthorized: Invalid user ID in context"})
		return
	}

	size := 10
	page := 1

	if s, err := strconv.Atoi(r.URL.Query().Get("size")); err == nil && s > 0 {
		size = s
	}
	if size > 100 {
		size = 100
	}
	if p, err := strconv.Atoi(r.URL.Query().Get("page")); err == nil && p > 0 {
		page = p
	}

	searchParam := r.URL.Query().Get("searchKey")
	searchKey := "%" + searchParam + "%"

	filter := &dto.DocumentFilterDTO{
		SearchKey: searchKey,
		Size:      size,
		Page:      (page - 1) * size,
	}

	docs, totalCount, err := h.documentService.GetDocumentsByUserID(r.Context(), userID, filter)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": err.Error()})
		return
	}

	if docs == nil {
		docs = []*dto.DocumentResponse{}
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(dto.GetDocumentsResponse{
		TotalCount: totalCount,
		Documents:  docs,
		Message:    "Documents retrieved successfully",
	})
}
