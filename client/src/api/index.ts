import axios, { AxiosError, type AxiosRequestConfig } from 'axios'
import { type BoxOutput } from '../utils'

export async function login(userName: string, password: string) {
  try {
    const result = await axios.post('/api/login', { userName, password })
    return result.data.status === 'success'
  } catch {
    return false
  }
}

// A
export async function listDirectories(path: string) {
  try {
    const result = await axios.get('/api/list-directory', {
      withCredentials: true,
      params: { path },
    })
    if (result.data.status === 'success') {
      return result.data.data
    } else {
      return false
    }
  } catch (e) {
    handleError(e as any)
    return false
  }
}

// B1
export async function listPages(bookId: number) {
  try {
    const result = await axios.get('/api/list-pages', {
      withCredentials: true,
      params: { bookId },
    })
    if (result.data.status === 'success') {
      return result.data.data
    } else {
      return false
    }
  } catch (e) {
    handleError(e as any)
    return false
  }
}

// B2
export async function getPageInfo(bookId: number, page: number) {
  try {
    const result = await axios.get('/api/get-page-info', {
      withCredentials: true,
      params: { bookId, page },
    })
    if (result.data.status === 'success') {
      return result.data.data
    } else {
      return false
    }
  } catch (e) {
    handleError(e as any)
    return false
  }
}

// C1
export async function saveOCRJson(
  pageId: number,
  data: BoxOutput[],
  text: string,
) {
  try {
    await axios.post('/api/save-ocr-info', {
      pageId,
      data,
      text,
    })
  } catch (e) {
    handleError(e as any)
  }
}

// D1
export async function getBookName(bookId: number) {
  try {
    const result = await axios.get('/api/get-book-name', {
      params: {
        bookId,
      },
    })
    if (result.data.status === 'success') {
      return result.data.name
    } else {
      return false
    }
  } catch (e) {
    handleError(e as any)
    return false
  }
}

export async function uploadFiles(
  bookName: string,
  files: File[],
  onProgress: (p: number) => void,
) {
  return
  try {
    const form = new FormData()
    form.append('bookName', bookName)
    files.forEach((file) => {
      form.append('image', file, encodeURIComponent(file.name))
    })

    const config: AxiosRequestConfig = {
      onUploadProgress: function (progressEvent) {
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total!,
        )
        onProgress(percentCompleted)
      },
    }

    const result = await axios.post('/api/upload', form, config)
    return result.data.status === 'success'
  } catch (e) {
    handleError(e as any)
    return false
  }
}

function handleError(e: AxiosError) {
  if (e.response?.status === 401) {
    location.href = '/#/login'
  }
}

export async function deleteBook(bookId: number) {
  try {
    await axios.delete('/api/delete-book', {
      data: { bookId },
    })
    return true
  } catch (e) {
    handleError(e as any)
    return false
  }
}

export async function searchKeyword(bookNames: string[], keyword: string) {
  try {
    const result = await axios.post('/api/search', {
      bookNames,
      keyword,
    })
    if (result.data.status === 'success') {
      return result.data.data
    } else {
      return {}
    }
  } catch (e) {
    handleError(e as any)
    return {}
  }
}
