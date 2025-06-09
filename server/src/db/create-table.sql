-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Books table
CREATE TABLE books (
    id SERIAL PRIMARY KEY,
    name VARCHAR(500) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index for fast searching by book name
CREATE INDEX idx_books_name ON books(name);

-- Pages table
CREATE TABLE pages (
    id SERIAL PRIMARY KEY,
    book_id INTEGER NOT NULL,
    page_number INTEGER NOT NULL,
    name VARCHAR(500), -- Optional page name/title
    image_url TEXT NOT NULL,
    image_width INTEGER NOT NULL CHECK (image_width > 0),
    image_height INTEGER NOT NULL CHECK (image_height > 0),
    ocr_info JSONB NOT NULL,
    text TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key constraint
    CONSTRAINT fk_pages_book_id 
        FOREIGN KEY (book_id) 
        REFERENCES books(id) 
        ON DELETE CASCADE,
    
    -- Ensure unique page numbers within each book
    CONSTRAINT unique_book_page 
        UNIQUE (book_id, page_number)
);

-- Create indexes for better query performance
CREATE INDEX idx_pages_book_id ON pages(book_id);
CREATE INDEX idx_pages_book_page ON pages(book_id, page_number);

-- JSONB indexes for OCR data queries
CREATE INDEX idx_pages_ocr_gin ON pages USING gin(ocr_info);

-- For Japanese text search, use trigram matching (works best with Japanese)
CREATE INDEX idx_pages_text_trigram ON pages USING gin(text gin_trgm_ops);

-- Trigram index for page names as well
CREATE INDEX idx_pages_name_trigram ON pages USING gin(name gin_trgm_ops);

-- For book names trigram search
CREATE INDEX idx_books_name_trigram ON books USING gin(name gin_trgm_ops);

-- Example trigger to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_books_updated_at 
    BEFORE UPDATE ON books 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pages_updated_at 
    BEFORE UPDATE ON pages 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
