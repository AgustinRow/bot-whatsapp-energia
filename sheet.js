const { google } = require('googleapis');
const fs = require('fs');
require('dotenv').config;

const sheetName = process.env.SHEET_NAME;

class GoogleSheet {
  constructor() {
    this.spreadsheetId = process.env.SPREADSHEET_ID;
    this.googleSheets = null;
    this.initialize();
  }

  async initialize() {
    const auth = new google.auth.GoogleAuth({
      keyFile: process.env.GOOGLE_SHEET_KEYS,
      scopes: 'https://www.googleapis.com/auth/spreadsheets',
    });

    const client = await auth.getClient();
    this.googleSheets = google.sheets({ version: 'v4', auth: client });
  }

  async getLastRowFromSheet(sheetName) {
    try {
      const response = await this.googleSheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: `${sheetName}!A:A`,
        valueRenderOption: 'UNFORMATTED_VALUE',
        dateTimeRenderOption: 'FORMATTED_STRING',
      });

      const values = response.data.values;
      if (!values || values.length === 0) {
        return 0;
      }

      return values.length;
    } catch (error) {
      console.log(error);
    }
  }

  async writeToSheet(values) {
    try {
      let lastRow = (await this.getLastRowFromSheet(sheetName)) + 1;
      for (const item of values) {
        const range = `${sheetName}!A${lastRow}:F${lastRow}`;
        const resource = {
          values: [Object.values(item)],
        };

        const response = this.googleSheets.spreadsheets.values.update({
          spreadsheetId: this.spreadsheetId,
          range,
          valueInputOption: 'RAW',
          resource,
        });

        lastRow++;
      }
    } catch (err) {
      console.error('Ocurrió un error al escribir en la hoja de cálculo:', err);
    }
  }

  handleErrorPayment(valores) {
    const columnas = [
      'NOMBRE Y APELLIDO',
      'RUNNING',
      'FUNCIONAL',
      'AMBAS',
      'KIDS',
      'PAGA',
    ];

    const data = {};
    columnas.forEach((columna, index) => {
      data[columna] = valores[index];
    });

    const jsonData = JSON.stringify(data);

    fs.writeFileSync('payment_faileds.json', jsonData);
  }
}

module.exports.GoogleSheet = GoogleSheet;
