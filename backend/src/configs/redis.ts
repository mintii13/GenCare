import {createClient} from 'redis';
import {ChildProcess, spawn} from 'child_process';

export function startRedisServer(): Promise<ChildProcess> {
  return new Promise((resolve, reject) => {
    const pathLine = process.env.REDIS_PATH_LINE || '';
    const redisProcess = spawn(pathLine + '/backend/src/bin/redis-server.exe');

    redisProcess.stdout.setEncoding('utf8');
    redisProcess.stderr.setEncoding('utf8');

    redisProcess.stdout.on('data', (data) => {
      console.log(`Redis stdout: ${data}`);
      if (data.includes('Ready to accept connections')) {
        resolve(redisProcess);
      }
    });

    redisProcess.stderr.on('data', (data) => {
      console.error(`Redis stderr: ${data}`);
    });

    redisProcess.on('error', (err) => {
      reject(err);
    });

    redisProcess.on('close', (code) => {
      console.log(`Redis server exited with code ${code}`);
    });
  });
}

const redisClient = createClient({
  socket: {
    host: '127.0.0.1',
    port: 6379
  }
});

export default redisClient;