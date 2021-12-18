const axios = require('axios')
const logger = require('../utils/signale')
const http = require('http')
const https = require('https')

const MAX_REQUESTS_COUNT = 1
const INTERVAL_MS = Number(process.env.INTERVAL_MS) || 333
logger.log('INTERVAL : ', INTERVAL_MS)
let PENDING_REQUESTS = 0

logger.log('Axios instantiated')

const getCookie = () => {
  if (process.env.API_KEY_FIRST) return `api_key=${process.env.API_KEY_FIRST}`
  else if (process.env.SPIP_SESSION) return `spip_session=${process.env.SPIP_SESSION}`
  else return `api_key=${process.env.API_KEY}`
}

const instance = axios.create({
  baseURL: process.env.ROOTME_API_URL,
  timeout: 5000,
  headers: { Cookie: getCookie(), 'cache-control': 'max-age=0' },
  withCredentials: true,
  httpAgent: new http.Agent({ keepAlive: true }),
  httpsAgent: new https.Agent({ keepAlive: true })
})

instance.interceptors.request.use(function(config) {
  return new Promise((resolve) => {
    const interval = setInterval(() => {
      if (PENDING_REQUESTS < MAX_REQUESTS_COUNT) {
        PENDING_REQUESTS++
        clearInterval(interval)
        resolve(config)
      }
    }, INTERVAL_MS)
  })
})

/**
 * Axios Response Interceptor
 */
instance.interceptors.response.use(function(response) {
  PENDING_REQUESTS = Math.max(0, PENDING_REQUESTS - 1)
  return Promise.resolve(response)
}, function(error) {
  PENDING_REQUESTS = Math.max(0, PENDING_REQUESTS - 1)
  return Promise.reject(error)
})

module.exports = instance

