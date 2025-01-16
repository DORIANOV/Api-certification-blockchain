const EventEmitter = require('events');
const sinon = require('sinon');

class MockRedisClient extends EventEmitter {
  constructor() {
    super();
    this.data = new Map();
    this.connected = true;

    // Méthodes de base
    this.get = sinon.stub().callsFake(key => Promise.resolve(this.data.get(key)));
    this.set = sinon.stub().callsFake((key, value) => {
      this.data.set(key, value);
      return Promise.resolve('OK');
    });
    this.del = sinon.stub().callsFake(key => {
      const existed = this.data.delete(key);
      return Promise.resolve(existed ? 1 : 0);
    });
    this.exists = sinon.stub().callsFake(key => 
      Promise.resolve(this.data.has(key) ? 1 : 0)
    );

    // Méthodes de TTL
    this.expire = sinon.stub().resolves(1);
    this.ttl = sinon.stub().resolves(3600);

    // Méthodes de transaction
    this.multi = sinon.stub().returns({
      exec: sinon.stub().resolves([]),
      get: sinon.stub(),
      set: sinon.stub(),
      del: sinon.stub()
    });

    // Méthodes de connexion
    this.connect = sinon.stub().resolves();
    this.quit = sinon.stub().resolves();
    this.disconnect = sinon.stub().resolves();
  }

  // Simuler une déconnexion
  simulateDisconnect() {
    this.connected = false;
    this.emit('error', new Error('Redis connection lost'));
  }

  // Simuler une reconnexion
  simulateReconnect() {
    this.connected = true;
    this.emit('ready');
  }

  // Simuler une latence
  simulateLatency(ms) {
    const originalGet = this.get;
    this.get = sinon.stub().callsFake(async key => {
      await new Promise(resolve => setTimeout(resolve, ms));
      return originalGet.call(this, key);
    });
  }

  // Vider les données
  flushall() {
    this.data.clear();
    return Promise.resolve('OK');
  }
}

let originalRedis;
let mockClient;

function mockRedis() {
  // Sauvegarder le module Redis original
  originalRedis = require('../../src/services/cache').client;

  // Créer une nouvelle instance du mock
  mockClient = new MockRedisClient();

  // Remplacer le client Redis
  require('../../src/services/cache').client = mockClient;
}

function restoreRedis() {
  if (originalRedis) {
    require('../../src/services/cache').client = originalRedis;
    originalRedis = null;
  }
  mockClient = null;
}

module.exports = {
  mockRedis,
  restoreRedis,
  getMockClient: () => mockClient,
  MockRedisClient
};
