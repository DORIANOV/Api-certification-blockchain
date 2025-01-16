const sinon = require('sinon');
const nodemailer = require('nodemailer');

let originalCreateTransport;
let mockTransporter;

function mockSmtp() {
  // Sauvegarder la fonction originale
  originalCreateTransport = nodemailer.createTransport;

  // Créer un mock du transporteur
  mockTransporter = {
    sendMail: sinon.stub().resolves({
      messageId: 'mock-message-id',
      response: 'mock-response'
    }),
    verify: sinon.stub().resolves(true),
    close: sinon.stub().resolves(),
    on: sinon.stub(),
    emit: sinon.stub()
  };

  // Remplacer la fonction createTransport
  nodemailer.createTransport = () => mockTransporter;
}

function restoreSmtp() {
  // Restaurer la fonction originale
  if (originalCreateTransport) {
    nodemailer.createTransport = originalCreateTransport;
    originalCreateTransport = null;
  }
  mockTransporter = null;
}

module.exports = {
  mockSmtp,
  restoreSmtp,
  getMockTransporter: () => mockTransporter
};
