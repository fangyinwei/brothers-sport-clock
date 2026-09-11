import app from './app';

function resolvePort(value: string | undefined): number {
  const port = Number(value ?? '8080');
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`PORT must be an integer between 1 and 65535; received ${value}`);
  }
  return port;
}

const port = resolvePort(process.env.PORT);

app.listen(port, '0.0.0.0', () => {
  console.info(JSON.stringify({ event: 'service_started', port }));
});
