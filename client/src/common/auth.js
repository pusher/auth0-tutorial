import decodeToken from 'jwt-decode'
import moment from 'moment'
import history from './history'
import { WebAuth } from 'auth0-js'

class Auth {
  auth0 = new WebAuth({
    domain: 'bookercodes.eu.auth0.com',
    clientID: 'EZzK4011mOnTQT5wgFUt7cWr4lyF5Sth',
    redirectUri: 'http://localhost:3001/callback',
    audience: 'booker.codes',
    responseType: 'token id_token',
    scope: 'openid'
  })

  authorize() {
    this.auth0.authorize()
  }

  async handleCallback() {
    this.auth0.parseHash((error, result) => {
      if (error) {
        console.error('Oh noes. An error occured: ', error.error)
        return
      }

      localStorage.setItem('access_token', result.accessToken)
      localStorage.setItem('id_token', result.idToken)
      history.replace('/')
    })
  }

  getAccessToken() {
    return localStorage.getItem('access_token')
  }

  hasTokenExpired(encodedToken) {
    const exp = moment.unix(decodeToken(encodedToken).exp)
    const now = moment()
    const secondsUntilExp = exp.diff(now, 'seconds')
    console.log('secondsUntilExp', secondsUntilExp)
    return secondsUntilExp <= 0
  }

  isAuthorized() {
    const token = localStorage.getItem('id_token')

    if (token && !this.hasTokenExpired(token)) {
      this.userId = decodeToken(token).sub
      return true
    }
    return false
  }
}

export default new Auth()
