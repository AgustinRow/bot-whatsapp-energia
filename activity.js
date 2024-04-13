require('dotenv').config();

class ActivityStrategy {
  constructor(fullMonthPrice, halfMonthPrice, individualPrice) {
    this.fullMonthPrice = fullMonthPrice;
    this.halfMonthPrice = halfMonthPrice;
    this.individualPrice = individualPrice;
  }

  calculate(payment) {
    switch (payment) {
      case '1':
        return this.fullMonthPrice;
      case '2':
        return this.halfMonthPrice;
      case '3':
        return this.individualPrice;
      default:
        return 0;
    }
  }

  formatValuesForSheet(from, amount) {}
}

class RunningStrategy extends ActivityStrategy {
  constructor() {
    super(
      process.env.RUNNING_FULL_MONTH,
      process.env.RUNNING_HALF_MONTH,
      process.env.RUNNING_ONE_SESSION,
    );
  }
  formatValuesForSheet(from, amount) {
    return [from, amount, '', '', '', ''];
  }
}

class FuncionalStrategy extends ActivityStrategy {
  constructor() {
    super(
      process.env.FUNCIO_FULL_MONTH,
      process.env.FUNCIO_HALF_MONTH,
      process.env.FUNCIO_ONE_SESSION,
    );
  }
  formatValuesForSheet(from, amount) {
    return [from, '', amount, '', '', ''];
  }
}

class ComboStrategy extends ActivityStrategy {
  constructor() {
    super(process.env.COMBO_FULL_MONTH, process.env.COMBO_HALF_MONTH);
  }
  formatValuesForSheet(from, amount) {
    return [from, '', '', amount, '', ''];
  }
}
class KidsStrategy extends ActivityStrategy {
  constructor() {
    super(
      process.env.KIDS_FULL_MONTH,
      process.env.KIDS_HALF_MONTH,
      process.env.KIDS_ONE_SESSION,
    );
  }
  formatValuesForSheet(from, amount) {
    return [from, '', '', '', amount, ''];
  }
}

const getStrategy = (discipline) => {
  switch (discipline) {
    case '1':
      return new RunningStrategy();
    case '2':
      return new FuncionalStrategy();
    case '3':
      return new ComboStrategy();
    case '4':
      return new KidsStrategy();
    default:
      return null;
  }
};

module.exports.getStrategy = getStrategy;
