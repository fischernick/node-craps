import { BetPoint, BetPointPayouts, DiceResult, HandResult, Memo, Rules, type Result, type Payout, diceResultAsPoint, Point, DontComePointBets } from './consts.js'
import { BetDictionary } from './bets.js'
import chalk from 'chalk'

export function passLine(bets: BetDictionary, hand: Result, rules: Rules): { bets: BetDictionary, payout?: Payout } {
  if (bets.getBet(BetPoint.Pass) === undefined) return { bets }

  const payoutActionResults = [HandResult.SEVEN_OUT, HandResult.POINT_WIN, HandResult.COMEOUT_WIN, HandResult.COMEOUT_LOSS]
  const betHasPayoutAction = payoutActionResults.includes(hand.result ?? HandResult.NEUTRAL)

  if (!betHasPayoutAction) return { bets } // keep bets intact if no action

  const payout: Payout = {
    type: hand.result ?? HandResult.NEUTRAL,
    principal: bets.getBet(BetPoint.Pass)?.amount ?? 0,
    profit: (bets.getBet(BetPoint.Pass)?.amount ?? 0) * 1
  }

  bets.clearBet(BetPoint.Pass) // clear pass line bet on action

  if (hand.result === HandResult.COMEOUT_LOSS || hand.result === HandResult.SEVEN_OUT) return { bets }

  return { payout, bets }
}

export function passOdds(bets: BetDictionary, hand: Result, rules: Rules) {
  const passOddsPoint = BetPoint.PassOdds
  if (bets.getBet(passOddsPoint) === undefined) return { bets }

  if (!hand.result || !hand.diceSum) throw new Error("no hand result or dice sum")

  const actionResults = [HandResult.SEVEN_OUT, HandResult.POINT_WIN]
  const betHasAction = actionResults.includes(hand.result ?? HandResult.NEW_GAME)
  if (!betHasAction) return { bets } // keep bets intact if no action

  const rbets = bets.copy()
  const passOddsBet = rbets.getBet(passOddsPoint)
  rbets.clearBet(passOddsPoint) // clear pass line bet on action

  if (hand.result === HandResult.SEVEN_OUT) return { bets }

  const payout = {
    type: 'pass odds win',
    principal: passOddsBet?.amount ?? 0,
    profit: (passOddsBet?.amount ?? 0) * (getPayout(passOddsPoint, hand.diceSum) ?? 0)
  }

  return { payout, bets: rbets }
}

function getDontComePointBet(diceSum: DiceResult): BetPoint | undefined {
  switch (diceSum) {
    case DiceResult.FOUR:
      return BetPoint.DontComePoint4
    case DiceResult.FIVE:
      return BetPoint.DontComePoint5
    case DiceResult.SIX:
      return BetPoint.DontComePoint6
    case DiceResult.EIGHT:
      return BetPoint.DontComePoint8
    case DiceResult.NINE:
      return BetPoint.DontComePoint9
    case DiceResult.TEN:
      return BetPoint.DontComePoint10
  }
  return undefined
}

export function dontComeBets(bets: BetDictionary, hand: Result, rules: Rules): { bets: BetDictionary, payout?: Payout } {

  const dontComeBet = bets.getBet(BetPoint.DontCome)
  // diceSum of 12 is a push on the dont come bet
  if (hand.diceSum === DiceResult.TWELVE) {
    if (process.env.DEBUG) console.log('PUSH')
    return { bets }
  }

  // Create copy of input bets
  const rbets = bets.copy()

  // diceSum of 7 and 11 is a loss of the dont come bet
  if (hand.diceSum === DiceResult.ELEVEN || hand.diceSum === DiceResult.SEVEN) {
    rbets.clearBet(BetPoint.DontCome)
    if (process.env.DEBUG) console.log('LOSS')
    // eleven has no other effect on set dont come bets
    if (hand.diceSum === DiceResult.ELEVEN) {
      return { bets: rbets }
    }
  }


  let hasPayout = false
  // check if any dont come bets are on the table that will pay out
  // 4,5,6,8,9,10.  DC will payout on craps {2,3} but not 12.
  for (const betPoint of [...DontComePointBets, BetPoint.DontCome]) {
    if (rbets.getBet(betPoint)) {
      hasPayout = true
      break
    }
  }

  // if no dont come bets are on the table, return the bets unchanged, aka no payout
  if (!hasPayout) return { bets: rbets }

  const payout = {
    type: 'dont come win',
    principal: 0,
    profit: 0
  }

  // craps {2,3} bar 12 payout on dont come bet
  if ([DiceResult.TWO, DiceResult.THREE].includes(hand.diceSum)) {
    if (dontComeBet) {
      console.log(`CRAPS dice: ${hand.diceSum} ; dont come bet::  ${JSON.stringify(dontComeBet)}`)
      payout.principal += dontComeBet?.amount ?? 0;
      payout.profit += (dontComeBet?.amount ?? 0) * (getPayout(BetPoint.DontCome, hand.diceSum) ?? 0)
      rbets.clearBet(BetPoint.DontCome)
      return { bets: rbets, payout }
    }
    return { bets: rbets }
  }

  // 7 out payout on pointed dont come point bets
  if (DiceResult.SEVEN === hand.diceSum) {
    for (const betPoint of DontComePointBets) {
      const bet = rbets.getBet(betPoint)
      if (bet) {
        payout.principal += bet.amount
        payout.profit += bet.amount * (getPayout(BetPoint.DontCome, hand.diceSum) ?? 0)
        // clear that bet when its a 7 win
        rbets.clearBet(betPoint)
      }
    }
  // this is a 7 so lets return
    return { bets: rbets, payout }
  }

  // 2,3,7,11,12 are accounted for above
  if ([DiceResult.TWO, DiceResult.THREE, DiceResult.SEVEN, DiceResult.ELEVEN, DiceResult.TWELVE].includes(hand.diceSum)) {
    throw new Error(`2,3,7,11,12 are accounted for above, done messed up`)
  }

  const point = diceResultAsPoint(hand.diceSum)
  if (point === Point.OFF) {
    throw new Error(`point is undefined or off for dice sum ${hand.diceSum}`)
  }

  const dontComePointBet = getDontComePointBet(hand.diceSum)
  if (dontComePointBet && bets.getBet(dontComePointBet)) {
    // if there is a dc point bet on the table, and that number is rolled, its a loss
    rbets.clearBet(dontComePointBet)
  }

  // if there a bet residing o DC, move it to dont come point bet
  if (dontComeBet) {
    if (!dontComePointBet) {
      throw new Error(`no dont come point bet for dice sum ${hand.diceSum}`)
    }

    // move that dont come bet to the numbered dont come bet point
    rbets.moveDCBet(dontComePointBet)
  }

  // clear the dont come bet
  rbets.clearBet(BetPoint.DontCome)
  return { bets: rbets }
}

export function getPayout(betPoint: BetPoint, diceSum: DiceResult) {
  const payouts = BetPointPayouts[betPoint]
  if (!payouts || !payouts[diceSum]) {
    throw new Error(`no payouts defined for bet point ${betPoint} for dice sum ${diceSum}`)
  }

  return payouts[diceSum]
}

export function settleAllBets ( bets: BetDictionary, hand: Result, rules:any ) : any {
  const payouts = []

  // when the hand establishes a point, set the pass and dont pass bets to contract
  if (hand.result === HandResult.POINT_SET) {
    bets.setContract([BetPoint.Pass, BetPoint.DontPass], true)
  }

  // when the hand is SEVEN_OUT or POINT_WIN, unset the contracts
  if (hand.result === HandResult.SEVEN_OUT || hand.result === HandResult.POINT_WIN) {
    bets.setContract([BetPoint.Pass, BetPoint.DontPass], false)
  }

  const dontComeResult = dontComeBets(bets, hand, rules)

  bets = dontComeResult.bets
  payouts.push(dontComeResult.payout)

  const passLineResult = passLine( bets, hand, rules )

  bets = passLineResult.bets
  payouts.push(passLineResult.payout)

  const passOddsResult = passOdds( bets, hand, rules )

  bets = passOddsResult.bets
  payouts.push(passOddsResult.payout)

  bets.payoutSum = payouts.reduce((memo: Memo, payout) => {
    if (!payout) return memo

    memo.principal += payout.principal
    memo.profit += payout.profit
    memo.total += payout.principal + payout.profit
    memo.ledger.push(payout)
    return memo
  }, {
    principal: 0,
    profit: 0,
    total: 0,
    ledger: [],
    rollCount: 0,
    neutrals: 0,
    comeOutWins: 0,
    comeOutLosses: 0,
    netComeOutWins: 0,
    pointsSet: 0,
    pointsWon: 0,
    dist: new Map()
  } as Memo)

  return bets
}
