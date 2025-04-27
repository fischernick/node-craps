import { BetPoint, BetPointPayouts, DiceResult, HandResult, Memo, Rules, type Result, type Payout } from './consts'
import { BetDictionary } from './bets'

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

  bets.clearBet(passOddsPoint) // clear pass line bet on action

  if (hand.result === HandResult.SEVEN_OUT) return { bets }

  const payout = {
    type: 'pass odds win',
    principal: bets.getBet(passOddsPoint)?.amount ?? 0,
    profit: (bets.getBet(passOddsPoint)?.amount ?? 0) * getPayout(passOddsPoint, hand.diceSum)
  }

  return { payout, bets }
}

export function dontComeBets(bets: BetDictionary, hand: Result, rules: Rules): { bets: BetDictionary, payout?: Payout } {

  if (bets.getBet(BetPoint.DontCome) === undefined) {
    console.log('no dont come bet')
    return { bets }
  }

  const dontComeBet = bets.getBet(BetPoint.DontCome)

  // diceSum of 12 is a push on the dont come bet
  if (hand.diceSum === DiceResult.TWELVE) {
    console.log('PUSH')
    return { bets }
  }

  // Create copy of input bets
  const rbets = bets.copy()

  if ([DiceResult.SEVEN, DiceResult.ELEVEN, DiceResult.TWO, DiceResult.THREE].includes(hand.diceSum)) {

    const payout = {
      type: 'dont come win',
      principal: dontComeBet?.amount ?? 0,
      profit: (dontComeBet?.amount ?? 0) * getPayout(BetPoint.DontCome, hand.diceSum)
    }
    rbets.clearBet(BetPoint.DontCome)
    return { bets: rbets, payout }
  }

  let dontComePointBet = undefined
  switch (hand.diceSum) {
    case DiceResult.FOUR:
      dontComePointBet = BetPoint.DontComePoint4
      break
    case DiceResult.FIVE:
      dontComePointBet = BetPoint.DontComePoint5
      break
    case DiceResult.SIX:
      dontComePointBet = BetPoint.DontComePoint6
      break
    case DiceResult.EIGHT:
      dontComePointBet = BetPoint.DontComePoint8
      break
    case DiceResult.NINE:
      dontComePointBet = BetPoint.DontComePoint9
      break
    case DiceResult.TEN:
      dontComePointBet = BetPoint.DontComePoint10
      break
  }

  if (!dontComePointBet) {
    throw new Error(`no dont come point bet for dice sum ${hand.diceSum}`)
  }

  rbets.addBet(dontComePointBet, dontComeBet?.amount ?? 0)
  rbets.clearBet(BetPoint.DontCome)
  return { bets: rbets }
}

export function getPayout(betPoint: BetPoint, diceSum: DiceResult) {
  const payouts = BetPointPayouts[betPoint]
  if (!payouts || !payouts[diceSum]) {
    throw new Error(`no payouts defined for bet point for dice sum`)
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

  const passLineResult = passLine( bets, hand, rules )

  bets = passLineResult.bets
  payouts.push(passLineResult.payout)

  const passOddsResult = passOdds( bets, hand, rules )

  bets = passOddsResult.bets
  payouts.push(passOddsResult.payout)

  const dontComeResult = dontComeBets(bets, hand, rules)

  bets = dontComeResult.bets
  payouts.push(dontComeResult.payout)

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

module.exports = {
  passLine,
  passOdds,
  settleAllBets,
  dontComeBets
}
