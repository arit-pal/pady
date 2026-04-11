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

	doc, err := h.documentService.CreateDocument(r.Context(), &req, userID)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": err.Error()})
		return
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(dto.CreateDocumentResponse{
		Document: doc,
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

	sortBy := r.URL.Query().Get("sortBy")

	isStarred := r.URL.Query().Get("is_starred") == "true"
	isShared := r.URL.Query().Get("is_shared") == "true"

	filter := &dto.DocumentFilterDTO{
		SearchKey: searchKey,
		SortBy:    sortBy,
		IsStarred: isStarred,
		IsShared:  isShared,
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

func (h *documentHandler) GetDocumentByID(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	userID, ok := r.Context().Value(middleware.IDKey).(uuid.UUID)
	if !ok {
		w.WriteHeader(http.StatusUnauthorized)
		json.NewEncoder(w).Encode(map[string]string{"error": "Unauthorized: Invalid user ID in context"})
		return
	}

	docID, err := uuid.Parse(r.PathValue("id"))
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "Invalid document ID format"})
		return
	}

	doc, err := h.documentService.GetDocumentByID(r.Context(), docID, userID)
	if err != nil {
		w.WriteHeader(http.StatusNotFound)
		json.NewEncoder(w).Encode(map[string]string{"error": err.Error()})
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(dto.GetDocumentResponse{
		Document: doc,
		Message:  "Document retrieved successfully",
	})
}

func (h *documentHandler) UpdateDocument(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	userID, ok := r.Context().Value(middleware.IDKey).(uuid.UUID)
	if !ok {
		w.WriteHeader(http.StatusUnauthorized)
		json.NewEncoder(w).Encode(map[string]string{"error": "Unauthorized: Invalid user ID in context"})
		return
	}

	docID, err := uuid.Parse(r.PathValue("id"))
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "Invalid document ID format"})
		return
	}

	var req dto.UpdateDocumentRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "Invalid JSON payload"})
		return
	}

	doc, err := h.documentService.UpdateDocument(r.Context(), docID, &req, userID)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": err.Error()})
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(dto.UpdateDocumentResponse{
		Document: doc,
		Message:  "Document updated successfully",
	})
}

func (h *documentHandler) DeleteDocument(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	userID, ok := r.Context().Value(middleware.IDKey).(uuid.UUID)
	if !ok {
		w.WriteHeader(http.StatusUnauthorized)
		json.NewEncoder(w).Encode(map[string]string{"error": "Unauthorized: Invalid user ID in context"})
		return
	}

	docID, err := uuid.Parse(r.PathValue("id"))
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "Invalid document ID format"})
		return
	}

	err = h.documentService.DeleteDocument(r.Context(), docID, userID)
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": err.Error()})
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{
		"message": "Document has been successfully deleted",
	})
}

func (h *documentHandler) ShareDocument(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	id, ok := r.Context().Value(middleware.IDKey).(uuid.UUID)
	if !ok {
		w.WriteHeader(http.StatusUnauthorized)
		json.NewEncoder(w).Encode(map[string]string{"error": "Unauthorized: Invalid user ID in context"})
		return
	}

	docID, err := uuid.Parse(r.PathValue("id"))
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "Invalid document ID format"})
		return
	}

	var req dto.ShareDocumentRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "Invalid JSON payload"})
		return
	}

	err = h.documentService.ShareDocument(r.Context(), docID, id, &req)
	if err != nil {
		w.WriteHeader(http.StatusForbidden)
		json.NewEncoder(w).Encode(map[string]string{"error": err.Error()})
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{
		"message": "Document shared successfully",
	})
}
