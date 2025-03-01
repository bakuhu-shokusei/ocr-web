import axios, { AxiosError, type AxiosRequestConfig } from 'axios'
import { type JsonOutput } from '../utils'

export async function login(userName: string, password: string) {
  try {
    const result = await axios.post('/api/login', { userName, password })
    return result.data.status === 'success'
  } catch {
    return false
  }
}

export async function listAssets() {
  try {
    const result = await axios.get('/api/list-assets', {
      withCredentials: true,
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

export async function uploadFiles(
  bookName: string,
  files: File[],
  onProgress: (p: number) => void,
) {
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
    location.href = '/login'
  }
}

export async function getOCRJson(url: string): Promise<JsonOutput> {
  try {
    const response = await axios.get<JsonOutput>(url)
    return response.data
  } catch (e) {
    handleError(e as any)
    return {} as any
  }
}

export async function saveOCRJson(
  bookName: string,
  page: string,
  data: JsonOutput,
) {
  try {
    await axios.post('/api/save-ocr-info', {
      bookName,
      page,
      data,
    })
  } catch (e) {
    handleError(e as any)
  }
}

export async function deleteBook(bookName: string) {
  try {
    await axios.delete('/api/delete-book', {
      data: { bookName },
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
