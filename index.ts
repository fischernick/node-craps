import { inspect } from 'node:util'

import { settleAllBets } from './settle'
import { HandOptions, minPassLineMaxOdds, minPassLineOnly} from './betting'
import { HandResult, type Result, Point, diceResultAsPoint, DieResult, DiceResult, BetPoint } from "./consts"
import { BetDictionary } from "./bets"

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

export function playHand ( rules: any, bettingStrategy: BettingStrategy, roll = rollD6 ) : any {
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
    bets = bettingStrategy( {rules, bets, hand} )
    balance -= bets.newBetSum
    if (process.env.DEBUG && bets.newBetSum) console.log(`[bet] new bet $${bets.newBetSum} ($${balance})`)
    bets.newBetSum = 0



    hand = shoot(
      hand,
      [roll(), roll()]
    )

    displayTable(bets, hand.point, balance, hand);

    if (process.env.DEBUG) console.log(`[roll] ${hand.result} (${hand.diceSum})`)

    //bets = settle.all({ rules, bets, hand })
    bets = settleAllBets(  bets, hand, rules )

    if (bets?.payoutSum) {
      balance += bets.payoutSum.total
      if (process.env.DEBUG) console.log(`[payout] new payout $${bets.payoutSum} ($${balance})`)
      delete bets.payoutSum
    }

    history.push(hand)
  }

  return { history, balance }
}

export function buildHeaderLine(point: Point): string {
  let headerLine = '┃ ┃';
  const points = ['DC', '4', '5', '6', '8', '9', '10'];
  const pointValues = [Point.OFF, Point.FOUR, Point.FIVE, Point.SIX, Point.EIGHT, Point.NINE, Point.TEN];

  points.forEach((p, i) => {
    const isPoint = point === pointValues[i] || (i === 0 && point === Point.UNDEF);
    // "      "
    const prePad = (p === 'DC' || p === '10') ? ' ' : '  ';
    headerLine += isPoint ? `${prePad}*${p}  ┃` : `${prePad} ${p}  ┃`;
  });

  return headerLine;
}

function displayTable(bets: BetDictionary, point: Point, balance: number, result?: Result): void {
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
  table += `┏━┳━━━━━━┳━━━━━━┳━━━━━━┳━━━━━━┳━━━━━━┳━━━━━━┳━━━━━━┓\n`;
  table += buildHeaderLine(point) + '\n';
  table += `┃B┃      ┃      ┃      ┃      ┃      ┃      ┃      ┃\n`;
  table += `┃O┃      ┃      ┃      ┃      ┃      ┃      ┃      ┃\n`;
  table += `┡━╇━━━━━━┻━━━━━━┻━━━━━━╬━━━━━━┻━━━━━━┻━━━━━━┻━━━━━━┩\n`;
  table += `│ ┇     Field:         ║     COME:                 │\n`;
  table += `│ ┇ Dont Pass:         ║     PASS LINE: ${pf(BetPoint.Pass)}      │\n`;
  table += `│ ┇   DP Odds:         ║       PL Odds: ${pf(BetPoint.PassOdds)}      │\n`;
  table += `╘═╧════════════════════╩═══════════════════════════╛\n`;
  if (result) {
    table += `╱ ╱ handResult: ${result.die1} ${result.die2} ${result.diceSum} ${result.point} ${result.result}                 \n`;
  }
  table += `╲ ╲ Balance: ${balance.toString().padStart(4, ' ')}  \n`;
  console.log(table);
}

module.exports = {
  buildHeaderLine,
  rollD6,
  shoot,
  playHand,
  minPassLineMaxOdds, minPassLineOnly
}
