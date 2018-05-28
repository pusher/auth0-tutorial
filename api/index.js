const Chatkit = require('@pusher/chatkit-server').default
const jwt = require('express-jwt')
const jwks = require('jwks-rsa')
const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')

const AUTH0_DOMAIN = 'bookercodes.eu.auth0.com'
const AUTH0_IDENTIFIER = 'booker.codes'

const chatkit = new Chatkit({
  instanceLocator: 'v1:us1:e480b6f7-c2a7-4e60-ad6c-5b6fa330567d',
  key:
    '54330ad1-71a6-406c-bbbf-b51938a0944f:HEfp7VtBySXu/VttQzYgoNq+A9CZVxHidJgVQY0Ut6Q='
})

const authenticate = jwt({
  secret: jwks.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri: 'https://bookercodes.eu.auth0.com/.well-known/jwks.json'
  }),
  audience: 'booker.codes',
  issuer: 'https://bookercodes.eu.auth0.com/',
  algorithms: ['RS256']
})

const authorize = (req, res, next) => {
  if (req.user.sub !== req.query.user_id) {
    return res.sendStatus(401)
  }
  return next()
}

const main = async () => {
  const server = express()

  server.use(bodyParser.urlencoded({ extended: false }))
  server.use(bodyParser.json())
  server.use(cors())

  server.post('/users', authenticate, async (req, res) => {
    const users = await chatkit.getUsersByIds({
      userIds: [req.user.sub]
    })
    if (users.length === 0) {
      const user = await chatkit.createUser({
        id: req.user.sub,
        name: req.user['http://hermes.com/email'],
        avatarURL: req.user['http://hermes.com/picture']
      })
      return res.sendStatus(201)
    }
    return res.sendStatus(200)
  })

  server.post('/token', authenticate, authorize, (req, res) => {
    const data = chatkit.authenticate({
      userId: req.query.user_id
    })
    return res.status(data.status).json(data.body)
  })

  const port = 8080
  server.listen(port, error => {
    if (error) {
      console.error(error)
    } else {
      console.log('Running on port', port)
    }
  })
}
main()
