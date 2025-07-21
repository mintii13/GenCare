import { logger, log, LogLevel } from './logger';

describe('Logger', () => {
  let logSpy: jest.SpyInstance;
  let infoSpy: jest.SpyInstance;
  let warnSpy: jest.SpyInstance;
  let errorSpy: jest.SpyInstance;

  beforeEach(() => {
    logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    infoSpy = jest.spyOn(console, 'info').mockImplementation(() => {});
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    logger.setLogLevel(LogLevel.DEBUG);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('debug logs with DEBUG level', () => {
    logger.debug('CTX', 'debug message', { a: 1 });
    expect(logSpy).toHaveBeenCalled();
  });

  test('info logs with INFO level', () => {
    logger.info('CTX', 'info message', { b: 2 });
    expect(infoSpy).toHaveBeenCalled();
  });

  test('warn logs with WARN level', () => {
    logger.warn('CTX', 'warn message', { c: 3 });
    expect(warnSpy).toHaveBeenCalled();
  });

  test('error logs with ERROR level', () => {
    logger.error('CTX', 'error message', { d: 4 });
    expect(errorSpy).toHaveBeenCalled();
  });

  test('api logs API debug', () => {
    log.api('GET', '/api/test', { foo: 'bar' });
    expect(logSpy).toHaveBeenCalled();
  });

  test('apiResponse logs error for status >= 400', () => {
    log.apiResponse('POST', '/api/test', 404, { err: true });
    expect(errorSpy).toHaveBeenCalled();
  });

  test('apiResponse logs debug for status < 400', () => {
    log.apiResponse('GET', '/api/test', 200, { ok: true });
    expect(logSpy).toHaveBeenCalled();
  });

  test('component logs component debug', () => {
    log.component('Comp', 'mounted', { id: 1 });
    expect(logSpy).toHaveBeenCalled();
  });

  test('userAction logs user info', () => {
    log.userAction('clicked', { btn: 'ok' });
    expect(infoSpy).toHaveBeenCalled();
  });

  test('setLogLevel disables lower level logs', () => {
    logger.setLogLevel(LogLevel.ERROR);
    logger.debug('CTX', 'should not log');
    expect(logSpy).not.toHaveBeenCalled();
    logger.error('CTX', 'should log');
    expect(errorSpy).toHaveBeenCalled();
  });
}); 