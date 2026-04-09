import { buildUrl as _buildUrl } from '@/config/moonlight.js'

// 重新导出 buildUrl 供其他组件使用
export { _buildUrl as buildUrl }

const API_TIMEOUT = 12000

export class FetchError extends Error {
  constructor(type, endpoint, method, responseOrError, reason) {
    if (type === 'timeout') {
      super(`请求超时: ${method} ${endpoint}`)
    } else if (type === 'failed') {
      const response = responseOrError
      super(`请求失败: ${method} ${endpoint} 状态码 ${response?.status} ${reason || ''}`)
      this.response = response
    } else {
      super(`请求错误: ${method} ${endpoint} ${responseOrError}`)
    }
    this.type = type
  }

  getResponse() {
    return this.response || null
  }
}

// 构建请求
function buildRequest(endpoint, method, init = {}) {
  const queryObj = init.query || {}
  const queryParts = []
  
  for (const key in queryObj) {
    if (queryObj[key] != null) {
      queryParts.push(`${encodeURIComponent(key)}=${encodeURIComponent(queryObj[key])}`)
    }
  }
  
  const queryString = queryParts.length > 0 ? `?${queryParts.join('&')}` : ''
  const url = `${_buildUrl('/api')}${endpoint}${queryString}`
  
  const headers = {}
  if (init.json) {
    headers['Content-Type'] = 'application/json'
  }

  return [url, {
    method,
    headers,
    body: init.json ? JSON.stringify(init.json) : undefined,
    credentials: 'include'
  }]
}

// API 请求
export async function fetchApi(endpoint, method = 'GET', init = {}) {
  const [url, request] = buildRequest(endpoint, method, init)
  request.signal = AbortSignal.timeout(API_TIMEOUT)

  let response
  try {
    response = await fetch(url, request)
  } catch (e) {
    throw new FetchError('unknown', endpoint, method, e)
  }

  if (!response.ok) {
    throw new FetchError('failed', endpoint, method, response)
  }

  if (init.response === 'ignore') {
    return response
  }

  if (init.response === 'jsonStreaming') {
    return new StreamedJsonResponse(response.body.getReader())
  }

  if (!init.response || init.response === 'json') {
    return response.json()
  }

  return response
}

class StreamedJsonResponse {
  constructor(reader) {
    this._reader = reader
    this._decoder = new TextDecoder()
    this._buffer = ''
  }

  async next() {
    while (true) {
      const { done, value } = await this._reader.read()
      if (done) {
        // 处理缓冲区中剩余数据
        const text = this._buffer.trim()
        this._buffer = ''
        if (text) return JSON.parse(text)
        return null
      }
      this._buffer += this._decoder.decode(value)
      const split = this._buffer.split('\n', 2)
      if (split.length === 2) {
        this._buffer = split[1]
        const text = split[0].trim()
        if (text) return JSON.parse(text)
      }
    }
  }
}

// 登录
export async function apiLogin(username, password) {
  try {
    await fetchApi('/login', 'POST', {
      json: { name: username, password },
      response: 'ignore'
    })
    return true
  } catch (e) {
    if (e instanceof FetchError) {
      const response = e.getResponse()
      if (response && (response.status === 401 || response.status === 404)) {
        return false
      }
    }
    throw e
  }
}

// 验证会话
export async function apiAuthenticate() {
  try {
    const response = await fetchApi('/authenticate', 'GET', { response: 'ignore' })
    return response != null
  } catch (e) {
    if (e instanceof FetchError && e.getResponse()?.status === 401) {
      return false
    }
    throw e
  }
}

// 获取主机列表（流式 JSON）
export async function apiGetHosts() {
  return fetchApi('/hosts', 'GET', { response: 'jsonStreaming' })
}

// 获取主机详情
export async function apiGetHost(hostId) {
  const response = await fetchApi('/host', 'GET', { query: { host_id: hostId } })
  return response.host
}

// 获取应用列表
export async function apiGetApps(hostId) {
  const response = await fetchApi('/apps', 'GET', { query: { host_id: hostId } })
  return response.apps
}

// 启动游戏
export async function apiStartApp(hostId, appId) {
  return fetchApi('/host/cancel', 'POST', {
    json: { host_id: hostId, app_id: appId }
  })
}

// 获取应用图片
export async function apiGetAppImage(query) {
  const response = await fetchApi('/app/image', 'GET', {
    query,
    response: 'ignore'
  })
  return response.blob()
}

// 获取当前用户信息
export async function apiGetUser() {
  return fetchApi('/user', 'GET', { query: { name: null, user_id: null } })
}
