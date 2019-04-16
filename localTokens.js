import Cookies from 'js-cookie'
import _ from 'lodash'
import axios from 'axios'

export let LOGIN = process.env.REACT_APP_LOGIN
export let API_PREFIX = process.env.REACT_APP_API_PREFIX
export const COOKIE_GENIAM_ACCESS_TOKEN_KEY = 'geniam_accessToken'
export const COOKIE_GENIAM_REFRESH_TOKEN_KEY = 'geniam_refreshToken'
export const COOKIE_GENIAM_USER_INFO_KEY = 'geniam_userInfo'

export default function Token() {
    const geniam_accessToken = getCookie(COOKIE_GENIAM_ACCESS_TOKEN_KEY)
    const geniam_refreshToken = getCookie(COOKIE_GENIAM_REFRESH_TOKEN_KEY)
    const geniam_userInfo = getJSONCookie(COOKIE_GENIAM_USER_INFO_KEY)
    return { geniam_accessToken, geniam_refreshToken, geniam_userInfo }
}

export const isStrIncludes = (str, includes) => {
    if (!_.isString(str) || _.isEmpty(str)) return false
    if (!_.isString(includes) || _.isEmpty(includes)) return false
    return str.toLowerCase().includes(includes.toLowerCase())
}

/**
 *
 * @returns {Promise<null|*>}
 */
export const refreshToken = async () => {
    const { geniam_refreshToken } = Token()
    if (!geniam_refreshToken) {
        window.location.assign(LOGIN + '/login?redirect_url=' + window.location.href + '?cookies')
        return null
    }

    try {
        const res = await axios.post('/refresh', { refreshToken: geniam_refreshToken });
        setCookie(COOKIE_GENIAM_ACCESS_TOKEN_KEY, res.data.accessToken, { expires: 1 / 24 })
        return res.data
    } catch (e) {
        removeCookie(COOKIE_GENIAM_ACCESS_TOKEN_KEY)
        removeCookie(COOKIE_GENIAM_REFRESH_TOKEN_KEY)
        removeCookie(COOKIE_GENIAM_USER_INFO_KEY)
        window.location.assign(LOGIN + '/login?redirect_url=' + window.location.href + '?cookies')
        return null
    }
}


const isProd = process.env.NODE_ENV === 'production'
const domain = isProd ? '.geniam.com' : null
const expires = 365 //days

export function getCookie(name, options = {}) {
    return Cookies.get(name, { domain, ...options })
}

export function setCookie(name, value, options = {}) {
    return Cookies.set(name, value, { domain, expires, ...options })
}

export function removeCookie(name, options = {}) {
    return Cookies.remove(name, { domain, ...options })
}

export function getJSONCookie(name, options = {}) {
    return Cookies.getJSON(name, { domain, ...options });
}

