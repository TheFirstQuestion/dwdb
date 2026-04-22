import Fastify from 'fastify'
import dbPlugin from './plugins/db.js'
import swaggerPlugin from './plugins/swagger.js'

const fastify = Fastify({ logger: true })

await fastify.register(dbPlugin)
await fastify.register(swaggerPlugin)

fastify.get('/health', async () => ({ status: 'ok' }))

const port = process.env.PORT ? parseInt(process.env.PORT) : 3000
await fastify.listen({ port, host: '0.0.0.0' })
