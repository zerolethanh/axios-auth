import axios from "axios"
import Token, {
    API_PREFIX,
    COOKIE_GENIAM_ACCESS_TOKEN_KEY,
    COOKIE_GENIAM_REFRESH_TOKEN_KEY,
    COOKIE_GENIAM_USER_INFO_KEY,
    isStrIncludes,
    LOGIN,
    refreshToken,
    removeCookie
} from "./localTokens"

import { toast } from "react-toastify";

axios.defaults.baseURL = API_PREFIX

/**
 *  axios config
 */
export default () => {
    //REQUEST
    axios.interceptors.request.use(
        async function (config) {

            if (
                isStrIncludes(config.url, '/refresh')
                || isStrIncludes(config.url, '/login')
                || isStrIncludes(config.url, '/register')
            ) {
                return config
            }

            const { geniam_accessToken, geniam_refreshToken } = Token()

            if (isStrIncludes(config.url, '/logout')) {
                config.headers['Authorization'] = `Bearer ${geniam_accessToken}`
                removeCookie(COOKIE_GENIAM_ACCESS_TOKEN_KEY)
                removeCookie(COOKIE_GENIAM_REFRESH_TOKEN_KEY)
                removeCookie(COOKIE_GENIAM_USER_INFO_KEY)
                return config
            }
            if (geniam_accessToken) {
                config.headers['Authorization'] = `Bearer ${geniam_accessToken}`
                return config
            }

            if (geniam_refreshToken) {
                const data = await refreshToken()
                if (data) {
                    config.headers['Authorization'] = `Bearer ${data.accessToken}`
                    return config
                }
            }

            window.location.assign(LOGIN + '/login?redirect_url=' + window.location.href + '?cookies')
            return null
        },
        error => {
            if (error && error.request) {
                console.log(error)
                console.log(error.request)
                toast.error(error.message)
            }
            return Promise.reject(error)
        })

    //RESPONSE
    axios.interceptors.response.use(
        function (response) {
            return response;
        },
        async function (error) {
            const originalRequest = error.config
            console.log(error.response)

            //if /refresh error then reject error
            if (isStrIncludes(originalRequest.url, '/refresh')) {
                return Promise.reject(error);
            }

            const { status, data = {} } = error.response;
            //else other error
            if (status === 400 && data.error_code === 'NotAuthorizedException') {
                if (data.error_message.indexOf('Refresh Token') > -1) {
                    removeCookie(COOKIE_GENIAM_ACCESS_TOKEN_KEY)
                    removeCookie(COOKIE_GENIAM_REFRESH_TOKEN_KEY)
                    removeCookie(COOKIE_GENIAM_USER_INFO_KEY)
                    window.location.assign(LOGIN + '/login?redirect_url=' + window.location.href + '?cookies')
                    return null
                }
                const data = await refreshToken()
                if (data) {
                    originalRequest.headers['Authorization'] = `Bearer ${data.accessToken}`;
                    return axios(originalRequest)
                } else {
                    return Promise.reject(error)
                }
            }
            return Promise.reject(error);
        }
    )
}
