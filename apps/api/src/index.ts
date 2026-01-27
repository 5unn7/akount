import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';

const server: FastifyInstance = Fastify({
    logger: true
});

server.register(cors, {
    origin: '*'
});

server.get('/', async (request, reply) => {
    return { hello: 'world', system: 'Akount API' };
});

const start = async () => {
    try {
        await server.listen({ port: 3001 });
    } catch (err) {
        server.log.error(err);
        process.exit(1);
    }
};

start();
