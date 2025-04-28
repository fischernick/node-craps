import chalk from 'chalk'
import { settleAllBets } from './settle.js'
import { HandOptions, minPassLineMaxOdds, minPassLineOnly } from './betting.js'
import { HandResult, type Result, Point, diceResultAsPoint, DieResult, DiceResult, BetPoint } from "./consts.js"
import { BetDictionary } from "./bets.js"

export function rollD6() {
  return 1 + Math.floor(Math.random() * 6)
}

export function shoot(before: Result, dice: DieResult[]): Result {
  const sortedDice = dice.sort()

  const after: Result = {
    die1: sortedDice[0],
    die2: sortedDice[1],
    diceSum: dice.reduce((m: number, r: number) => { return m + r }, 0),
    result: undefined,
    isComeOut: undefined,
    point: before.point
  }

  // game logic based on: https://github.com/tphummel/dice-collector/blob/master/PyTom/Dice/logic.py

  if (before.isComeOut) {
    if ([2, 3, 12].indexOf(after.diceSum) !== -1) {
      after.result = HandResult.COMEOUT_LOSS
      after.isComeOut = true
    } else if ([7, 11].indexOf(after.diceSum) !== -1) {
      after.result = HandResult.COMEOUT_WIN
      after.isComeOut = true
    } else {
      after.result = HandResult.POINT_SET
      after.isComeOut = false
      after.point = diceResultAsPoint(after.diceSum)
    }
  } else {
    if (before.point === diceResultAsPoint(after.diceSum)) {
      after.result = HandResult.POINT_WIN
      after.isComeOut = true
      after.point = Point.OFF
    } else if (after.diceSum === 7) {
      after.result = HandResult.SEVEN_OUT
      after.isComeOut = true
      after.point = Point.OFF
    } else {
      after.result = HandResult.NEUTRAL
      after.point = before.point
      after.isComeOut = false
    }
  }

  return after
}

export type BettingStrategy = (param1: HandOptions) => BetDictionary

export function playHand(rules: any, bettingStrategy: BettingStrategy, roll = rollD6): any {
  const history = []
  let balance = 0

  let hand: Result = {
    result: HandResult.NEW_GAME,
    isComeOut: true,
    die1: DieResult.UNDEF,
    die2: DieResult.UNDEF,
    diceSum: DiceResult.UNDEF,
    point: Point.OFF,
  }

  let bets = new BetDictionary();

  while (hand.result !== HandResult.SEVEN_OUT) {
    if (process.env.DEBUG) console.log(`[NEW HAND]`)
    bets = bettingStrategy({ rules, bets, hand })
    balance -= bets.newBetSum
    if (process.env.DEBUG && bets.newBetSum) console.log(`[bet] new bet $${bets.newBetSum} ($${balance})`)
    bets.newBetSum = 0

    displayTable(true, bets, hand.point, balance, hand);


    hand = shoot(
      hand,
      [roll(), roll()]
    )


    if (process.env.DEBUG) console.log(`[roll] ${hand.result} (${hand.diceSum})`)

    //bets = settle.all({ rules, bets, hand })
    bets = settleAllBets(bets, hand, rules)

    displayTable(false, bets, hand.point, balance, hand);

    if (bets?.payoutSum) {
      balance += bets.payoutSum.total
      delete bets.payoutSum
    }

    history.push(hand)
  }

  return { history, balance }
}

export function buildHeaderLine(point: Point): string {
  let headerLine = '┃  ┃';
  const points = ['DC', '4', '5', '6', '8', '9', '10'];
  const pointValues = [Point.OFF, Point.FOUR, Point.FIVE, Point.SIX, Point.EIGHT, Point.NINE, Point.TEN];

  points.forEach((p, i) => {
    const isPoint = point === pointValues[i] || (i === 0 && point === Point.UNDEF);
    // "      "
    const prePad = (p === 'DC' || p === '10') ? ' ' : '  ';
    headerLine += isPoint ? `${prePad}${chalk.yellowBright("*")}${p}  ┃` : `${prePad} ${p}  ┃`;
  });

  return headerLine;
}

export function dcbets(bets: BetDictionary): string {
  let tots = "";
  //const pointValues = [Point.FOUR, Point.FIVE, Point.SIX, Point.EIGHT, Point.NINE, Point.TEN];
  const dcPoints = [
    BetPoint.DontCome,
    BetPoint.DontComePoint4,
    BetPoint.DontComePoint5,
    BetPoint.DontComePoint6,
    BetPoint.DontComePoint8,
    BetPoint.DontComePoint9,
    BetPoint.DontComePoint10
  ];
  dcPoints.forEach((p, i) => {
    const bet = bets.getBet(p);
    if (bet) {
      tots += ` ${chalk.green(bet.amount.toString().padStart(4, ' '))} ┃`;
    } else {
      tots += `      ┃`;
    }

  });
  return tots;
}

export function pbets(bets: BetDictionary): string {
  let tots = `      ┃`;
  //const pointValues = [Point.FOUR, Point.FIVE, Point.SIX, Point.EIGHT, Point.NINE, Point.TEN];
  const dcPoints = [
    BetPoint.Place4,
    BetPoint.Place5,
    BetPoint.Place6,
    BetPoint.Place8,
    BetPoint.Place9,
    BetPoint.Place10
  ];
  dcPoints.forEach((p, i) => {
    const bet = bets.getBet(p);
    if (bet) {
      tots += ` ${chalk.green(bet.amount.toString().padStart(4, ' '))} ┃`;
    } else {
      tots += `      ┃`;
    }

  });
  return tots;
}


function displayTable(preRoll: boolean, bets: BetDictionary, point: Point, balance: number, result?: Result): void {
  const pf = (value: BetPoint): string => {
    if (value === undefined) {
      return "     ";
    }
    const bet = bets.getBet(value);
    if (bet === undefined) {
      return "     ";
    }
    return "$" + bet.amount.toString().padStart(4, ' ');
  }



  let table = '';
  table += (preRoll ? '    EXISTING BETS  BEFORE ROLL ' : '    ROLL RESULTS AND BETS SETTLED') + '\n';
  table += `┏━━┳━━━━━━┳━━━━━━┳━━━━━━┳━━━━━━┳━━━━━━┳━━━━━━┳━━━━━━┓\n`;
  table += buildHeaderLine(point) + '\n';
  table += `┃DC┃${dcbets(bets)}\n`;
  table += `┃dO┃  n/a ┃      ┃      ┃      ┃      ┃      ┃      ┃\n`;
  table += `┃PB┃${pbets(bets)}\n`;
  table += `┃ O┃      ┃      ┃      ┃      ┃      ┃      ┃      ┃\n`;
  table += `┡━━╇━━━━━━┻━━━━━━┻━━━━━━╬━━━━━━┻━━━━━━┻━━━━━━┻━━━━━━┩\n`;
  table += `│  ┇     Field:         ║      COME:                │\n`;
  table += `│  ┇ Dont Pass:         ║ PASS LINE: ${pf(BetPoint.Pass)}          │\n`;
  table += `│  ┇   DP Odds:         ║   PL Odds: ${pf(BetPoint.PassOdds)}          │\n`;
  table += `╘══╧════════════════════╩═══════════════════════════╛\n`;
  if (!preRoll && result) {
    table += `╱ ╱ handResult: ${result.die1} + ${result.die2} == ${result.diceSum} => ${result.result}\n`;
  } else {
    table += `╱ ╱ PREROLL \n`;
  }
  if (preRoll) {
    table += `╲ ╲ Balance: ${balance.toString().padStart(4, ' ')}\n`;
  } else {
    table += `╲ ╲ Balance: ${balance.toString().padStart(4, ' ')} + ${bets.payoutSum?.total} = ${balance + (bets.payoutSum?.total ?? 0)}\n`;
  }
  console.log(table);
}
