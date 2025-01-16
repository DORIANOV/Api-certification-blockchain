const EventEmitter = require('events');
const sinon = require('sinon');

class MockQueue extends EventEmitter {
  constructor() {
    super();
    this.jobs = new Map();
    this.jobCounter = 0;

    // Méthodes de base
    this.add = sinon.stub().callsFake((name, data, opts = {}) => {
      const jobId = ++this.jobCounter;
      const job = {
        id: jobId,
        name,
        data,
        opts,
        status: 'waiting',
        progress: 0,
        timestamp: Date.now(),
        attempts: 0,
        remove: sinon.stub().resolves(),
        retry: sinon.stub().resolves()
      };
      this.jobs.set(jobId, job);
      return Promise.resolve(job);
    });

    this.process = sinon.stub().callsFake((name, concurrency, handler) => {
      this.handler = handler;
      return Promise.resolve();
    });

    this.getJob = sinon.stub().callsFake(jobId => 
      Promise.resolve(this.jobs.get(jobId))
    );

    this.getJobs = sinon.stub().callsFake(types => {
      const jobs = Array.from(this.jobs.values())
        .filter(job => types.includes(job.status));
      return Promise.resolve(jobs);
    });

    // Méthodes de gestion de file
    this.pause = sinon.stub().resolves();
    this.resume = sinon.stub().resolves();
    this.close = sinon.stub().resolves();
    this.clean = sinon.stub().resolves();
  }

  // Simuler le traitement d'un job
  async simulateProcess(jobId, result = {}) {
    const job = this.jobs.get(jobId);
    if (!job) return;

    try {
      job.status = 'active';
      this.emit('active', job);

      if (this.handler) {
        await this.handler(job);
      }

      job.status = 'completed';
      this.emit('completed', job, result);
    } catch (error) {
      job.status = 'failed';
      job.attempts++;
      this.emit('failed', job, error);

      if (job.attempts < (job.opts.attempts || 3)) {
        job.status = 'waiting';
        this.emit('waiting', job);
      }
    }
  }

  // Simuler une erreur de traitement
  simulateError(jobId, error) {
    const job = this.jobs.get(jobId);
    if (job) {
      job.status = 'failed';
      job.attempts++;
      this.emit('failed', job, error);
    }
  }

  // Simuler la progression
  simulateProgress(jobId, progress) {
    const job = this.jobs.get(jobId);
    if (job) {
      job.progress = progress;
      this.emit('progress', job, progress);
    }
  }

  // Vider la file
  clear() {
    this.jobs.clear();
    this.jobCounter = 0;
  }
}

let originalQueue;
let mockQueue;

function mockQueue() {
  // Sauvegarder la queue originale
  originalQueue = require('../../src/services/queue').queue;

  // Créer une nouvelle instance du mock
  mockQueue = new MockQueue();

  // Remplacer la queue
  require('../../src/services/queue').queue = mockQueue;
}

function restoreQueue() {
  if (originalQueue) {
    require('../../src/services/queue').queue = originalQueue;
    originalQueue = null;
  }
  mockQueue = null;
}

module.exports = {
  mockQueue,
  restoreQueue,
  getMockQueue: () => mockQueue,
  MockQueue
};
