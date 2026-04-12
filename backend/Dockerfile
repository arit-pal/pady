FROM golang:1.25-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o pady-backend .

FROM alpine:latest
WORKDIR /app
RUN apk --no-cache add ca-certificates tzdata
RUN addgroup -S padygroup && adduser -S padyuser -G padygroup
COPY --from=builder /app/pady-backend .
COPY --from=builder /app/db/migrations ./db/migrations
RUN chown -R padyuser:padygroup /app
USER padyuser
EXPOSE 8000
CMD ["./pady-backend"]