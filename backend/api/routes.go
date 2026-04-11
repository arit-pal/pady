package api

import (
	"arit-pal/pady/domain"
	"arit-pal/pady/handlers"
	"arit-pal/pady/middleware"
	"arit-pal/pady/service"
	"net/http"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/rs/cors"
)

func NewRouter(dbPool *pgxpool.Pool) http.Handler {

	c := cors.New(cors.Options{
		AllowedOrigins:   []string{"*"},
		AllowedMethods:   []string{http.MethodGet, http.MethodPost, http.MethodPut, http.MethodDelete, http.MethodOptions},
		AllowedHeaders:   []string{"Content-Type", "Authorization"},
		AllowCredentials: true,
	})

	mux := http.NewServeMux()

	userRepo := domain.NewUserRepo(dbPool)
	userService := service.NewUserService(userRepo)
	userHandler := handlers.NewUserHandler(userService)

	mux.HandleFunc("POST /api/v1/signup", userHandler.UserSignUp)
	mux.HandleFunc("POST /api/v1/login", userHandler.UserSignIn)
	mux.HandleFunc("GET /api/v1/me", middleware.RequireAuth(userHandler.UserGetMe))
	mux.HandleFunc("DELETE /api/v1/delete", middleware.RequireAuth(userHandler.UserSoftDelete))
	mux.HandleFunc("GET /api/v1/users/search", middleware.RequireAuth(userHandler.SearchUsers))

	documentRepo := domain.NewDocumentRepo(dbPool)
	documentService := service.NewDocumentService(documentRepo)
	documentHandler := handlers.NewDocumentHandler(documentService)

	mux.HandleFunc("POST /api/v1/documents", middleware.RequireAuth(documentHandler.CreateDocument))
	mux.HandleFunc("GET /api/v1/documents", middleware.RequireAuth(documentHandler.GetMyDocuments))
	mux.HandleFunc("GET /api/v1/documents/{id}", middleware.RequireAuth(documentHandler.GetDocumentByID))
	mux.HandleFunc("PUT /api/v1/documents/{id}", middleware.RequireAuth(documentHandler.UpdateDocument))
	mux.HandleFunc("DELETE /api/v1/documents/{id}", middleware.RequireAuth(documentHandler.DeleteDocument))
	mux.HandleFunc("POST /api/v1/documents/{id}/share", middleware.RequireAuth(documentHandler.ShareDocument))

	return c.Handler(mux)
}
