const { getStrategy } = require('./activity');
require('dotenv').config;

const activities = ['1', '2', '3', '4'];
const budgets = [1, 2, 3];
const number1 = '\u0031\uFE0F\u20E3';
const number2 = '\u0032\uFE0F\u20E3';
const number3 = '\u0033\uFE0F\u20E3';
const number4 = '\u0034\uFE0F\u20E3';

const { Buttons } = require('whatsapp-web.js');

class Chat {
  constructor(state, conversationId, author, authorName, chatOwner) {
    this.conversationId = conversationId;
    this.activityId = '';
    this.sheetDataValues = []; // this array contains the data to write in google sheet
    this.budgetId = '';
    this.balance = 0;
    this.teacher = null;
    this.state = state;
    this.author = author;
    this.authorName = authorName;
    this.chatOwner = chatOwner;
    this.hasPaymentRegistered = false;
    this.attemtps = 0;
    state.setContext(this);
  }
  getHasPaymentRegistered() {
    return this.hasPaymentRegistered;
  }
  getConversationId() {
    return this.conversationId;
  }

  getSheetDataValues() {
    return this.sheetDataValues;
  }
  setTeacher(teacher) {
    this.teacher = teacher;
  }

  setActivity(activityId) {
    this.activityId = activityId;
  }
  setBudget(budgetId) {
    this.budgetId = budgetId;
  }
  setPayment(hasPayment) {
    this.hasPayment = hasPayment;
  }
  setBalance(balance) {
    this.balance = balance;
  }
  addAttempts() {
    this.attemtps++;
  }
  getAttempts() {
    return this.attemtps;
  }
  getTeacher() {
    return this.teacher;
  }
  changeState(state) {
    this.state = state;
  }
  getAuthor() {
    return this.author;
  }

  processMessage(message) {
    this.state.processMessage(message);
  }
}

class State {
  constructor(chat) {
    this.setContext(chat);
  }
  setContext(chat) {
    this.chat = chat;
  }
  processMessage(message) {}
}

class ShowActivitiesState extends State {
  constructor(chat) {
    super(chat);
  }
  setContext(chat) {
    this.chat = chat;
  }
  processMessage(message) {
    message.reply(
      `¡Gracias por tu interés en pagar! Por favor, responda con el numero de la actividad que desea abonar:\n${number1}- Running\n${number2}- Funcional\n${number3}- Combo\n${number4}- Kids \n\n Si queres finalizar en cualquier momento envia con la palabra "fin"`,
    );
    this.chat.changeState(new SelectActivityState(this.chat));
  }
}

class SelectActivityState extends State {
  constructor(chat) {
    super(chat);
    this.setContext(chat);
  }
  setContext(chat) {
    this.chat = chat;
  }
  processMessage(message) {
    const isActivityCorrect = activities.some((activity) =>
      message.body.includes(activity),
    );
    if (!isActivityCorrect) {
      this.chat.addAttempts();
      message.reply(
        `La actividad ${message.body} no es correcta, por favor seleccione el numero de la actividad que desea abonar:\n${number1}- Running\n${number2}- Funcional\n${number3}- Combo\n${number4}- Kids`,
      );
    } else {
      this.chat.changeState(new BudgetState(this.chat));
      this.chat.setActivity(message.body);
      this.chat.processMessage(message);
    }
  }
}

class BudgetState extends State {
  constructor(chat) {
    super(chat);
    this.setContext(chat);
  }
  setContext(chat) {
    this.chat = chat;
  }

  processMessage(message) {
    message.reply(
      'Tipo de abono:\n1- Mes Completo\n2- Medio Mes\n3- Una sola clase',
    );
    this.chat.changeState(new ResolveBudgetState(this.chat));
  }
}

class ResolveBudgetState extends State {
  constructor(chat) {
    super(chat);
    this.setContext(chat);
  }
  setContext(chat) {
    this.chat = chat;
  }
  processMessage(message) {
    const isBudgetCorrect = budgets.some((budget) =>
      message.body.includes(budget),
    );
    if (isBudgetCorrect) {
      this.chat.setBudget(message.body);
      const budgetStrategy = getStrategy(this.chat.activityId);
      const budget = budgetStrategy.calculate(this.chat.budgetId);
      const balance = this.chat.balance + Number(budget);
      const dataValues = budgetStrategy.formatValuesForSheet(
        this.chat.authorName,
        budget,
      );

      this.chat.sheetDataValues.push(dataValues);
      this.chat.setBalance(balance);
      message.reply(
        `El monto a abonar es ${budget} - Desea registrar otro pago? \n Si - No`,
      );
      this.chat.changeState(new RepeatProcessState(this.chat));
    } else {
      this.chat.addAttempts();
      message.reply(
        `El tipo de abono seleccionado no es correcto, por favor seleccione uno de las siguientes opciones:\n1- Mes complet\n2- Medio mes\n3- Clase individual `,
      );
    }
  }
}

class RepeatProcessState extends State {
  constructor(chat) {
    super(chat);
    this.setContext(chat);
  }
  setContext(chat) {
    this.chat = chat;
  }
  processMessage(message) {
    switch (message.body.toLowerCase()) {
      case 'si': {
        message.reply(
          'Por favor, elige una de las siguientes actividades:\n1- Running\n2- Funcional\n3- Combo\n4- Kids',
        );
        this.chat.changeState(new SelectActivityState(this.chat));
        break;
      }
      case 'no': {
        message.reply(
          `Seleccione a que profesor le va a realizar el deposito:\n1- Agus \n2- Nati \n3- Tomi`,
        );
        this.chat.changeState(new SelectTeacherState(this.chat));
        break;
      }
      default:
        this.chat.addAttempts();
        message.reply(
          'Opcion incorrecta. Escriba "Si" en caso que desee hacer otro pago, o "No" en caso que desee enviar el comprobante y finalizar',
        );
        break;
    }
  }
}

class SelectTeacherState extends State {
  constructor(chat) {
    super(chat);
    this.setContext(chat);
  }
  setContext(chat) {
    this.chat = chat;
  }
  processMessage(message) {
    switch (message.body.toLowerCase()) {
      case '1':
      case 'agus':
      case 'aguss':
      case 'ags':
      case 'agu':
        this.chat.setTeacher(process.env.AGUS_NAME);
        break;
      case '2':
      case 'nati':
      case 'natii':
      case 'nat':
      case 'naty':
        this.chat.setTeacher(process.env.NATI_NAME);
        break;
      case '3':
      case 'tom':
      case 'tomi':
      case 'tomy':
        this.chat.setTeacher(process.env.TOMI_NAME);
        break;
      default:
        this.chat.addAttempts();
        message.reply(
          'Opcion incorrecta. Debe seleccionar uno de los 3 profesores:\n1- Agus \n2- Nati \n3- Tomi',
        );
        break;
    }
    if (this.chat.teacher !== null) {
      this.chat.sheetDataValues.map((sheetValue) => {
        const value = sheetValue;
        if (sheetValue[value.length - 1] === '') {
          sheetValue[value.length - 1] = this.chat.teacher;
        }
      });
      message.reply(`Adjuntar el comprobante de pago`);
      this.chat.changeState(new PaymentCaptureState(this.chat));
    }
  }
}

class PaymentCaptureState extends State {
  constructor(chat) {
    super(chat);
    this.setContext(chat);
  }
  setContext(chat) {
    this.chat = chat;
  }
  processMessage(message) {
    if (message.hasMedia && message.type === 'image') {
      message.reply(
        'Gracias por enviar el comprobante de pago. ¡Abono registrado con éxito!',
      );
      this.chat.hasPaymentRegistered = true;
    } else {
      message.reply('Estamos esperando el comprobante para poder finalizar:)');
      this.chat.addAttempts();
    }
  }
}

module.exports.Chat = Chat;
module.exports.ShowActivitiesState = ShowActivitiesState;
module.exports.SelectActivityState = SelectActivityState;
module.exports.BudgetState = BudgetState;
module.exports.ResolveBudgetState = ResolveBudgetState;
module.exports.PaymentCaptureState = PaymentCaptureState;
module.exports.RepeatProcessState = RepeatProcessState;
