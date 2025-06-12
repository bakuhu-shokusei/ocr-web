import { Pool } from 'pg'
import { DB_USER, DB_HOST, DB_NAME, DB_PASSWORD } from '../env'

// Database configuration
const pool = new Pool({
  user: DB_USER,
  host: DB_HOST,
  database: DB_NAME,
  password: DB_PASSWORD,
  port: 5432,
})

// Pagination interface
interface PaginationOptions {
  page?: number // Page number (1-based)
  limit?: number // Items per page
}

interface PaginatedResult<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

// Type definitions
interface Book {
  id?: number
  name: string
  created_at?: Date
  updated_at?: Date
}

// OCR format: [x, y, width, height, text]
type OCRInfo = [number, number, number, number, string]

interface Page {
  id?: number
  book_id: number
  page_number: number
  name?: string
  image_url: string
  image_width: number
  image_height: number
  ocr_info: OCRInfo[]
  text?: string
  created_at?: Date
  updated_at?: Date
}

// Database helper class
class BooksDatabase {
  private pool: Pool

  constructor(pool: Pool) {
    this.pool = pool
  }

  // Insert a new book
  async insertBook(name: string): Promise<Book> {
    const query = `
      INSERT INTO books (name) 
      VALUES ($1) 
      RETURNING id, name, created_at, updated_at
    `

    try {
      const result = await this.pool.query(query, [name])
      return result.rows[0]
    } catch (error) {
      if (error instanceof Error && 'code' in error && error.code === '23505') {
        throw new Error(`Book with name "${name}" already exists`)
      }
      throw error
    }
  }

  async deleteBook(bookId: number) {
    const query = `
      DELETE FROM books 
      WHERE id = $1
    `
    await this.pool.query(query, [bookId])
  }

  // Insert a new page
  async insertPage(
    pageData: Omit<Page, 'id' | 'created_at' | 'updated_at'>,
  ): Promise<Page> {
    const query = `
      INSERT INTO pages (book_id, page_number, name, image_url, image_width, image_height, ocr_info, text)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, book_id, page_number, name, image_url, image_width, image_height, ocr_info, text, created_at, updated_at
    `

    const values = [
      pageData.book_id,
      pageData.page_number,
      pageData.name || null,
      pageData.image_url,
      pageData.image_width,
      pageData.image_height,
      JSON.stringify(pageData.ocr_info),
      pageData.text || null,
    ]

    try {
      const result = await this.pool.query(query, values)
      return result.rows[0]
    } catch (error) {
      if (error instanceof Error && 'code' in error && error.code === '23505') {
        throw new Error(
          `Page ${pageData.page_number} already exists for this book`,
        )
      }
      if (error instanceof Error && 'code' in error && error.code === '23503') {
        throw new Error(`Book with ID ${pageData.book_id} does not exist`)
      }
      throw error
    }
  }

  // Insert book with multiple pages in a transaction
  async insertBookWithPages(
    bookName: string,
    pages: Omit<Page, 'id' | 'book_id' | 'created_at' | 'updated_at'>[],
  ): Promise<{ book: Book; pages: Page[] }> {
    const client = await this.pool.connect()

    try {
      await client.query('BEGIN')

      // Insert book
      const bookResult = await client.query(
        'INSERT INTO books (name) VALUES ($1) RETURNING id, name, created_at, updated_at',
        [bookName],
      )
      const book = bookResult.rows[0]

      // Insert pages
      const insertedPages: Page[] = []
      for (const pageData of pages) {
        const pageResult = await client.query(
          `
          INSERT INTO pages (book_id, page_number, name, image_url, image_width, image_height, ocr_info, text)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          RETURNING id, book_id, page_number, name, image_url, image_width, image_height, ocr_info, text, created_at, updated_at
        `,
          [
            book.id,
            pageData.page_number,
            pageData.name || null,
            pageData.image_url,
            pageData.image_width,
            pageData.image_height,
            JSON.stringify(pageData.ocr_info),
            pageData.text || null,
          ],
        )
        insertedPages.push(pageResult.rows[0])
      }

      await client.query('COMMIT')
      return { book, pages: insertedPages }
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  }

  // Batch insert pages for existing book
  async insertMultiplePages(
    bookId: number,
    pages: Omit<Page, 'id' | 'book_id' | 'created_at' | 'updated_at'>[],
  ): Promise<Page[]> {
    const client = await this.pool.connect()

    try {
      await client.query('BEGIN')

      const insertedPages: Page[] = []
      for (const pageData of pages) {
        const result = await client.query(
          `
          INSERT INTO pages (book_id, page_number, name, image_url, image_width, image_height, ocr_info, text)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          RETURNING id, book_id, page_number, name, image_url, image_width, image_height, ocr_info, text, created_at, updated_at
        `,
          [
            bookId,
            pageData.page_number,
            pageData.name || null,
            pageData.image_url,
            pageData.image_width,
            pageData.image_height,
            JSON.stringify(pageData.ocr_info),
            pageData.text || null,
          ],
        )
        insertedPages.push(result.rows[0])
      }

      await client.query('COMMIT')
      return insertedPages
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  }

  // Update page OCR info
  async updatePageOCR(pageId: number, ocrInfo: OCRInfo[]): Promise<Page> {
    const query = `
      UPDATE pages 
      SET ocr_info = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING id, book_id, page_number, name, image_url, image_width, image_height, ocr_info, text, created_at, updated_at
    `

    try {
      const result = await this.pool.query(query, [
        JSON.stringify(ocrInfo),
        pageId,
      ])
      if (result.rows.length === 0) {
        throw new Error(`Page with ID ${pageId} not found`)
      }
      return result.rows[0]
    } catch (error) {
      throw error
    }
  }

  // Update page text
  async updatePageText(pageId: number, text: string): Promise<Page> {
    const query = `
      UPDATE pages 
      SET text = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING id, book_id, page_number, name, image_url, image_width, image_height, ocr_info, text, created_at, updated_at
    `

    try {
      const result = await this.pool.query(query, [text, pageId])
      if (result.rows.length === 0) {
        throw new Error(`Page with ID ${pageId} not found`)
      }
      return result.rows[0]
    } catch (error) {
      throw error
    }
  }

  // Update both OCR info and text
  async updatePageOCRAndText(
    pageId: number,
    ocrInfo: OCRInfo[],
    text: string,
  ): Promise<Page> {
    const query = `
      UPDATE pages 
      SET ocr_info = $1, text = $2, updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING id, book_id, page_number, name, image_url, image_width, image_height, ocr_info, text, created_at, updated_at
    `

    try {
      const result = await this.pool.query(query, [
        JSON.stringify(ocrInfo),
        text,
        pageId,
      ])
      if (result.rows.length === 0) {
        throw new Error(`Page with ID ${pageId} not found`)
      }
      return result.rows[0]
    } catch (error) {
      throw error
    }
  }

  // Search books by regex pattern
  async searchBooksByRegex(pattern: string): Promise<Book[]> {
    const query = `
      SELECT id, name, created_at, updated_at 
      FROM books 
      WHERE name ~ $1
      ORDER BY name
    `

    try {
      const result = await this.pool.query(query, [pattern])
      return result.rows
    } catch (error) {
      if (error instanceof Error && 'code' in error && error.code === '2201B') {
        throw new Error(`Invalid regex pattern: ${pattern}`)
      }
      throw error
    }
  }

  // Get first page image URLs for multiple books by name
  async getFirstPageImages(bookNames: string[]): Promise<(string | null)[]> {
    if (bookNames.length === 0) {
      return []
    }

    // Create placeholders for the query ($1, $2, $3, etc.)
    const placeholders = bookNames.map((_, index) => `$${index + 1}`).join(', ')

    const query = `
      SELECT DISTINCT ON (b.name) 
        b.name, 
        p.image_url
      FROM books b
      LEFT JOIN pages p ON b.id = p.book_id
      WHERE b.name = ANY(ARRAY[${placeholders}])
      ORDER BY b.name, p.page_number ASC
    `

    try {
      const result = await this.pool.query(query, bookNames)

      // Create a map of book name to image URL
      const imageMap = new Map<string, string | null>()
      result.rows.forEach((row) => {
        imageMap.set(row.name, row.image_url)
      })

      // Return image URLs in the same order as input book names
      return bookNames.map((name) => imageMap.get(name) || null)
    } catch (error) {
      throw error
    }
  }

  // Check if multiple books exist by name
  async checkBooksExist(bookNames: string[]): Promise<(number | null)[]> {
    if (bookNames.length === 0) {
      return []
    }

    // Create placeholders for the query ($1, $2, $3, etc.)
    const placeholders = bookNames.map((_, index) => `$${index + 1}`).join(', ')

    const query = `
      SELECT name, id
      FROM books 
      WHERE name = ANY(ARRAY[${placeholders}])
    `

    try {
      const result = await this.pool.query(query, bookNames)
      const existingBooks: Record<string, number> = {}
      result.rows.forEach((row) => {
        existingBooks[row.name] = row.id
      })

      // Return boolean array in the same order as input
      return bookNames.map((name) => existingBooks[name] ?? null)
    } catch (error) {
      throw error
    }
  }

  async listDirectoryContents(
    directory: string,
  ): Promise<
    { success: true; data: string[] } | { success: false; error: string }
  > {
    // Basic validation
    if (typeof directory !== 'string') {
      return { success: false, error: 'Invalid directory parameter' }
    }

    // Remove trailing slash if present
    const cleanDirectory = directory.replace(/\/$/, '')

    // Handle empty string case - return top-level directories
    if (cleanDirectory === '') {
      const query = `
      SELECT DISTINCT 
        SPLIT_PART(name, '/', 1) as child_path
      FROM books 
      ORDER BY child_path;
    `

      try {
        const result = await pool.query(query)
        return {
          success: true,
          data: result.rows.map((row) => row.child_path),
        }
      } catch (error) {
        console.error('Database error:', error)
        return {
          success: false,
          error:
            error instanceof Error ? error.message : 'Unknown database error',
        }
      }
    }

    // Handle non-empty directory case
    const query = `
    SELECT DISTINCT 
      $1 || '/' || SPLIT_PART(
        SUBSTRING(name, LENGTH($1) + 2), 
        '/', 
        1
      ) as child_path
    FROM books 
    WHERE name LIKE $1 || '/%'
      AND LENGTH(name) > LENGTH($1) + 1
    ORDER BY child_path;
  `

    try {
      const result = await pool.query(query, [cleanDirectory])
      return {
        success: true,
        data: result.rows.map((row) => row.child_path),
      }
    } catch (error) {
      console.error('Database error:', error)
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Unknown database error',
      }
    }
  }

  async getBookById(pageId: number): Promise<Book | null> {
    const query = `
      SELECT id, name
      FROM books 
      WHERE id = $1
    `
    const result = await this.pool.query(query, [pageId])
    return result.rows.length > 0 ? result.rows[0] : null
  }

  // Get page by ID (helper method)
  async getPageById(pageId: number): Promise<Page | null> {
    const query = `
      SELECT id, book_id, page_number, name, image_url, image_width, image_height, ocr_info, text, created_at, updated_at
      FROM pages 
      WHERE id = $1
    `
    const result = await this.pool.query(query, [pageId])
    return result.rows.length > 0 ? result.rows[0] : null
  }

  // Search methods with pagination
  async searchBooks(
    searchTerm: string,
    options: PaginationOptions = {},
  ): Promise<PaginatedResult<Book>> {
    const page = options.page || 1
    const limit = options.limit || 10
    const offset = (page - 1) * limit

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM books 
      WHERE name ILIKE $1 OR name % $2
    `
    const countResult = await this.pool.query(countQuery, [
      `%${searchTerm}%`,
      searchTerm,
    ])
    const total = parseInt(countResult.rows[0].total)

    // Get paginated results
    const query = `
      SELECT id, name, created_at, updated_at 
      FROM books 
      WHERE name ILIKE $1 OR name % $2
      ORDER BY similarity(name, $2) DESC, name
      LIMIT $3 OFFSET $4
    `
    const result = await this.pool.query(query, [
      `%${searchTerm}%`,
      searchTerm,
      limit,
      offset,
    ])

    const totalPages = Math.ceil(total / limit)

    return {
      data: result.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    }
  }

  async searchPages(
    searchTerm: string,
    bookIds: number[],
    options: PaginationOptions = {},
  ): Promise<PaginatedResult<Page & { book_name: string }>> {
    const page = options.page || 1
    const limit = options.limit || 10
    const offset = (page - 1) * limit

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM pages p
      JOIN books b ON p.book_id = b.id
      WHERE (p.text ILIKE $1 OR p.name ILIKE $1 OR p.text % $2 OR p.name % $2)
    `
    const queryParams: (string | number)[] = [`%${searchTerm}%`, searchTerm]
    let paramIndex = 3

    let extraQuery = ''
    let extraParams: (string | number)[] = []
    if (bookIds.length > 0) {
      const bookIdPlaceholders = bookIds
        .map(() => `$${paramIndex++}`)
        .join(', ')
      extraQuery = ` AND p.book_id IN (${bookIdPlaceholders})`
      extraParams = [...bookIds]
    }

    const countResult = await this.pool.query(countQuery + extraQuery, [
      ...queryParams,
      ...extraParams,
    ])
    const total = parseInt(countResult.rows[0].total)

    // Get paginated results
    paramIndex = 5
    if (bookIds.length > 0) {
      const bookIdPlaceholders = bookIds
        .map(() => `$${paramIndex++}`)
        .join(', ')
      extraQuery = ` AND p.book_id IN (${bookIdPlaceholders})`
    }
    const query = `
      SELECT p.*, b.name as book_name
      FROM pages p
      JOIN books b ON p.book_id = b.id
      WHERE (p.text ILIKE $1 OR p.name ILIKE $1 OR p.text % $2 OR p.name % $2)${extraQuery}
      ORDER BY GREATEST(
        similarity(COALESCE(p.text, ''), $2),
        similarity(COALESCE(p.name, ''), $2)
      ) DESC, b.name, p.page_number
      LIMIT $3 OFFSET $4
    `
    const result = await this.pool.query(query, [
      `%${searchTerm}%`,
      searchTerm,
      limit,
      offset,
      ...extraParams,
    ])

    const totalPages = Math.ceil(total / limit)

    return {
      data: result.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    }
  }

  // Get all books with pagination
  async getAllBooks(
    options: PaginationOptions = {},
  ): Promise<PaginatedResult<Book>> {
    const page = options.page || 1
    const limit = options.limit || 10
    const offset = (page - 1) * limit

    // Get total count
    const countQuery = 'SELECT COUNT(*) as total FROM books'
    const countResult = await this.pool.query(countQuery)
    const total = parseInt(countResult.rows[0].total)

    // Get paginated results
    const query = `
      SELECT id, name, created_at, updated_at 
      FROM books 
      ORDER BY created_at DESC
      LIMIT $1 OFFSET $2
    `
    const result = await this.pool.query(query, [limit, offset])

    const totalPages = Math.ceil(total / limit)

    return {
      data: result.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    }
  }

  async getNumberOfPages(bookId: number): Promise<number> {
    const countQuery = 'SELECT COUNT(*) as total FROM pages WHERE book_id = $1'
    const countResult = await this.pool.query(countQuery, [bookId])
    const total = parseInt(countResult.rows[0].total)
    return total
  }

  // Get pages for a specific book with pagination
  async getBookPages(
    bookId: number,
    options: PaginationOptions = {},
  ): Promise<PaginatedResult<Page>> {
    const page = options.page || 1
    const limit = options.limit || 10
    const offset = (page - 1) * limit

    // Get total count
    const total = await this.getNumberOfPages(bookId)

    // Get paginated results
    const query = `
      SELECT id, book_id, page_number, name, image_url, image_width, image_height, ocr_info, text, created_at, updated_at
      FROM pages 
      WHERE book_id = $1
      ORDER BY page_number
      LIMIT $2 OFFSET $3
    `
    const result = await this.pool.query(query, [bookId, limit, offset])

    const totalPages = Math.ceil(total / limit)

    return {
      data: result.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    }
  }

  async getBookText(bookId: number): Promise<string> {
    const query = `
      SELECT STRING_AGG(text, E'\n\n' ORDER BY page_number) AS full_text
      FROM pages 
      WHERE book_id = $1
      GROUP BY book_id
    `
    const result = await this.pool.query(query, [bookId])
    return result.rows[0].full_text
  }

  // Close the pool
  async close(): Promise<void> {
    await this.pool.end()
  }
}

const db = new BooksDatabase(pool)

// Export for use in other modules
export { Book, Page, OCRInfo, db }
