import chalk from 'chalk'
import { settleAllBets } from './settle.js'
import { HandResult, type Result, Point, diceResultAsPoint, DieResult, DiceResult, BetPoint, Payout } from "./consts.js"
import { BetDictionary } from "./bets.js"
import { BettingStrategyName, getBettingStrategy } from "./betting.js"
import { displayTable } from "./display.js"

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

