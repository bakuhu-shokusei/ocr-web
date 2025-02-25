import axios, { AxiosError, type AxiosRequestConfig } from 'axios'

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
