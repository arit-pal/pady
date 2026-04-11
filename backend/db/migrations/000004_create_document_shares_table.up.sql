CREATE TABLE IF NOT EXISTS document_shares (
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    permission  VARCHAR(50) NOT NULL DEFAULT 'editor',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (document_id, user_id)
);

CREATE INDEX idx_document_shares_user_id ON document_shares(user_id);