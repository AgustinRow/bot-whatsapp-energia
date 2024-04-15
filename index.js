const { Client, LocalAuth, Buttons } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const { Chat, ShowActivitiesState } = require('./chat');
const { GoogleSheet } = require('./sheet');
require('dotenv').config;

const agus = process.env.AGUS_NAME;
const nati = process.env.NATI_NAME;
const agusPhone = process.env.AGUS_PHONE;
const natiPhone = process.env.NATI_PHONE;

const googleSheet = new GoogleSheet();

const clientNati = new Client({
  authStrategy: new LocalAuth({
    clientId: nati,
  }),
  webVersionCache: {
    type: 'remote',
    remotePath:
      'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html',
  },
});

const clientAgus = new Client({
  authStrategy: new LocalAuth({
    clientId: agus,
  }),
  webVersionCache: {
    type: 'remote',
    remotePath:
      'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html',
  },
});

const listOfConversations = new Map();

async function handleChatMessage(message) {
  const owner = findOwner(message.to);
  const contactInfo = await message.getContact();
  const conversacionId = message.from;
  const body = message.body.toLowerCase();
  if (listOfConversations.has(conversacionId)) {
    const chat = listOfConversations.get(conversacionId);
    if (
      contactInfo.number == chat.getAuthor() &&
      chat.getAttempts() < 4 &&
      body !== 'fin'
    ) {
      chat.processMessage(message);

      if (chat.getHasPaymentRegistered()) {
        const values = chat.getSheetDataValues();
        await googleSheet.writeToSheet(values);
        listOfConversations.delete(conversacionId);
      }
    } else {
      const chatRemoved = listOfConversations.delete(conversacionId);
      if (chatRemoved)
        message.reply('Gracias por ser parte de Energia, te esperamos pronto');
    }
  } else if (body === 'pago' || body === 'pagos') {
    const initialState = new ShowActivitiesState();
    const chat = new Chat(
      initialState,
      conversacionId,
      contactInfo.number,
      contactInfo.name,
      owner,
    );

    listOfConversations.set(conversacionId, chat);
    chat.processMessage(message);
  }
}

const findOwner = (receiver) => {
  switch (receiver) {
    case agusPhone:
      return agus;
    case natiPhone:
      return nati;
  }
};

/* clientNati.on('qr', (qr) => {
  qrcode.generate(qr, { small: true });
}); */

clientAgus.on('message', handleChatMessage);
/* clientNati.on('message', handleChatMessage); */

clientAgus.on('ready', () => {
  console.log('¡El bot de Agus listo!');
});
/* clientNati.on('ready', () => {
  console.log('¡El bot de Nati listo!');
});
 */
const qrCodes = async (qr) => {
  return await qrcode.toDataURL(qr);
};

clientAgus.initialize();
/* clientNati.initialize(); */

let qrCodeData = null;

// Event listener to capture the QR code
clientAgus.on('qr', async (qr) => {
  qrCodeData = await qrCodes(qr);
});

function runClient(req, res) {
  if (qrCodeData) {
    // Render the QR code view and pass the QR code data
    console.log(qrCodeData);
    res.render('qr', { qrCode: qrCodeData });
  } else {
    // If QR code data is not available yet, you can render a loading page or handle it as needed
    res.send('QR code not available yet. Please try again later.');
  }
}
module.exports.runClient = runClient;
