FROM golang:1.23 AS builder

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY ./app ./app

RUN go build -o main ./app

FROM debian:bookworm-slim

RUN useradd -m appuser

COPY --from=builder /app/main /usr/local/bin/main

USER appuser

EXPOSE 8080

CMD ["main"]
