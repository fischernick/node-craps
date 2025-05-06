import chalk from 'chalk'
import { settleAllBets } from './settle.js'
import { HandResult, type Result, Point, diceResultAsPoint, DieResult, DiceResult, BetPoint, Payout, BettingStrategy, BettingStrategyName } from "./consts.js"
import { BetDictionary } from "./bets.js"
import { getBettingStrategy } from "./betting.js"

export function rollD6(): number {
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


export type RollOptions = {
  displayTables?: boolean
}

export function playHand(rules: any, bettingStrategyName: BettingStrategyName, roll = rollD6, opts: RollOptions = { displayTables: false }): any {
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
  const bettingStrategy = getBettingStrategy(bettingStrategyName);

  while (hand.result !== HandResult.SEVEN_OUT) {
    if (process.env.DEBUG) console.log(`[NEW HAND]`)
    bets = bettingStrategy({ rules, bets, hand })
    balance -= bets.newBetSum
    if (process.env.DEBUG && bets.newBetSum) console.log(`[bet] new bet $${bets.newBetSum} ($${balance})`)
    bets.newBetSum = 0

    if (opts.displayTables) displayTable(true, bets, hand.point, balance, hand);


    hand = shoot(
      hand,
      [roll(), roll()]
    )


    if (process.env.DEBUG) console.log(`[roll] ${hand.result} (${hand.diceSum})`)

    var newPayouts: Payout[] | undefined = [];
    var actions: string[] | undefined = [];
    ({ bets, newPayouts, actions } = settleAllBets(bets, hand, rules));

    if (opts.displayTables) {
      actions?.forEach(action => {
        console.log(" " + action)
      });
    }

    if (opts.displayTables) displayTable(false, bets, hand.point, balance, hand, newPayouts);

    if (bets?.payoutSum) {
      balance += bets.payoutSum.total
      delete bets.payoutSum
    }

    history.push(hand)
  }

  return { history, balance }
}

export function buildHeaderLine(point: Point): string {
  let headerLine = '';
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

export function dontComeBetsLine(bets: BetDictionary): string {
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
      tots += ` ${chalk.inverse(bet.amount.toString().padStart(4, ' '))} ┃`;
    } else {
      tots += `      ┃`;
    }

  });
  return tots;
}

export function placeBetsLine(bets: BetDictionary): string {
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


function displayTable(preRoll: boolean, bets: BetDictionary, point: Point, balance: number, result?: Result, newPayouts?: Payout[]): void {
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

  let balanceLine = `Balance: ${balance.toString().padStart(4, ' ')}`
  if (!preRoll) {
    const payoutSum = bets.payoutSum?.total ?? 0
    const payoutColor = payoutSum > 0 ? chalk.greenBright : chalk.redBright
    const sumColor = balance + payoutSum > 0 ? chalk.green : chalk.red
    balanceLine += ` + ${payoutColor(`${payoutSum}`)} = ${sumColor(`${balance + payoutSum}`)}`;
  }

  const tableHeight = 7;
  let rollLine = preRoll ? '' : `Roll: ${result?.die1}+${result?.die2}> ${result?.diceSum} => ${result?.result}`;
  let payoutLine: string[] = [];
  if (newPayouts && newPayouts.length > 0) {
    if (newPayouts.length <= tableHeight) {
      payoutLine = newPayouts.map(p => `${p.type}: ${p.principal} + ${p.profit} = ${p.principal + p.profit}`);
    } else {
      const reducedPayouts = newPayouts.reduce((acc, p) => {
        acc.principal += p.principal;
        acc.profit += p.profit;
        acc.total += p.principal + p.profit;
        return acc;
      }, {
        principal: 0,
        profit: 0,
        total: 0
      })

      payoutLine = [
        `${newPayouts.length} payouts`,
        `${reducedPayouts.principal} + ${reducedPayouts.profit} = ${reducedPayouts.total}`
      ];
    }
  }


  let table = '';
  table += (preRoll ? '    EXISTING BETS  BEFORE ROLL ' : '    ROLL RESULTS AND BETS SETTLED') + '\n';
  table += `┏━━┳━━━━━━┳━━━━━━┳━━━━━━┳━━━━━━┳━━━━━━┳━━━━━━┳━━━━━━┓\n`;
  table += `┃  ┃` + buildHeaderLine(point) + `    ${rollLine}\n`;
  table += `┃DC┃${dontComeBetsLine(bets)} ${payoutLine[0] ? payoutLine[0] : ''}\n`;
  table += `┃dO┃  n/a ┃      ┃      ┃      ┃      ┃      ┃      ┃ ${payoutLine[1] ? payoutLine[1] : ''}\n`;
  table += `┃PB┃${placeBetsLine(bets)} ${payoutLine[2] ? payoutLine[2] : ''}\n`;
  table += `┃ O┃      ┃      ┃      ┃      ┃      ┃      ┃      ┃ ${payoutLine[3] ? payoutLine[3] : ''}\n`;
  table += `┡━━╇━━━━━━┻━━━━━━┻━━━━━━╬━━━━━━┻━━━━━━┻━━━━━━┻━━━━━━┩ ${payoutLine[4] ? payoutLine[4] : ''}\n`;
  table += `│  ┇     Field:         ║      COME:                │ ${payoutLine[5] ? payoutLine[5] : ''}\n`;
  table += `│  ┇ Dont Pass:         ║ PASS LINE: ${pf(BetPoint.Pass)}          │ ${payoutLine[6] ? payoutLine[6] : ''}\n`;
  table += `│  ┇   DP Odds:         ║   PL Odds: ${pf(BetPoint.PassOdds)}          │ ${balanceLine}\n`;
  table += `╘══╧════════════════════╩═══════════════════════════╛\n`;
  // if (!preRoll && result) {
  //   table += `╱ ╱ handResult: ${result.die1} + ${result.die2} == ${result.diceSum} => ${result.result}\n`;
  // } else {
  //   table += `╱ ╱ PREROLL \n`;
  // }

  console.log(table);
}
