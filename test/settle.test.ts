import { test } from 'tap'
import { BetDictionary } from '../src/bets.js'
import { BetPoint, DiceResult, DieResult, HandResult, Point, Result, Rules } from '../src/consts.js'
import { dontComeBets, passLine, passOdds, settleAllBets } from '../src/settle.js'

const defaultRules: Rules = {
  minBet: 5,
  maxOddsMultiple: {
    [Point.UNDEF]: 0,
    [Point.OFF]: 0,
    [Point.FOUR]: 3,
    [Point.FIVE]: 4,
    [Point.SIX]: 5,
    [Point.EIGHT]: 5,
    [Point.NINE]: 4,
    [Point.TEN]: 3
  }
}

// Common bet objects
const emptyBets: BetDictionary = new BetDictionary()

const passLineBet: BetDictionary = new BetDictionary()
passLineBet.addBet(BetPoint.Pass, 5)


const passLineContractBet: BetDictionary = new BetDictionary()
passLineContractBet.addBet(BetPoint.Pass, 5)
passLineContractBet.setContract([BetPoint.Pass], true)

const passLineWithOddsBet: BetDictionary = new BetDictionary()
passLineWithOddsBet.addBet(BetPoint.Pass, 5)
passLineWithOddsBet.addBet(BetPoint.PassOdds, 15)


const passLineWithOddsBet4: BetDictionary = new BetDictionary()
passLineWithOddsBet4.addBet(BetPoint.Pass, 5)
passLineWithOddsBet4.addBet(BetPoint.PassOdds, 15)
passLineWithOddsBet4.setContract([BetPoint.Pass], true)

const passLineWithOddsBet5: BetDictionary = new BetDictionary()
passLineWithOddsBet5.addBet(BetPoint.Pass, 5)
passLineWithOddsBet5.addBet(BetPoint.PassOdds, 20)
passLineWithOddsBet5.setContract([BetPoint.Pass], true)

const passLineWithOddsBet6: BetDictionary = new BetDictionary()
passLineWithOddsBet6.addBet(BetPoint.Pass, 5)
passLineWithOddsBet6.addBet(BetPoint.PassOdds, 25)
passLineWithOddsBet6.setContract([BetPoint.Pass], true)

const passLineWithOddsBet8: BetDictionary = new BetDictionary()
passLineWithOddsBet8.addBet(BetPoint.Pass, 5)
passLineWithOddsBet8.addBet(BetPoint.PassOdds, 25)
passLineWithOddsBet8.setContract([BetPoint.Pass], true)



test('passLine', (suite) => {
  suite.test('comeout win', function (t) {
    const hand: Result = {
      result: HandResult.COMEOUT_WIN,
      diceSum: 7,
      die1: DieResult.UNDEF,
      die2: DieResult.UNDEF,
      point: Point.OFF
    }

    const result = passLine(passLineBet, hand, defaultRules)
    t.equal(result.payout?.type, 'comeout win')
    t.equal(result.payout?.principal, 5)
    t.equal(result.payout?.profit, 5)
    t.notOk(result.bets.getBet(BetPoint.Pass), 'pass line bet is cleared upon comeout win')

    t.end()
  })

  suite.test('comeout loss', function (t) {
    const hand: Result = {
      result: HandResult.COMEOUT_LOSS,
      diceSum: 3,
      die1: DieResult.UNDEF,
      die2: DieResult.UNDEF,
      point: Point.OFF
    }

    const result = passLine(passLineBet.copy(), hand, defaultRules)
    t.notOk(result.payout, 'no payout on a comeout loss')
    t.notOk(result.bets.getBet(BetPoint.Pass), 'pass line bet is cleared upon comeout loss')

    t.end()
  })

  suite.test('point win', function (t) {
    const hand: Result = {
      result: HandResult.POINT_WIN,
      diceSum: 10,
      die1: DieResult.UNDEF,
      die2: DieResult.UNDEF,
      point: Point.TEN
    }

    const result = passLine(passLineContractBet, hand, defaultRules)

    t.equal(result.payout?.type, 'point win')
    t.equal(result.payout?.principal, 5)
    t.equal(result.payout?.profit, 5)
    t.notOk(result.bets.getBet(BetPoint.Pass), 'pass line bet is cleared upon point win')

    t.end()
  })

  suite.test('point loss', function (t) {
    const hand: Result = {
      result: HandResult.SEVEN_OUT,
      diceSum: 7,
      die1: DieResult.UNDEF,
      die2: DieResult.UNDEF,
      point: Point.FIVE
    }

    const result = passLine(passLineContractBet.copy(), hand, defaultRules)
    t.notOk(result.payout, 'no payout on seven out')
    t.notOk(result.bets.getBet(BetPoint.Pass), 'pass line bet is cleared upon seven out')

    t.end()
  })

  suite.test('no bet', function (t) {
    const hand: Result = {
      result: HandResult.POINT_WIN,
      diceSum: 8,
      die1: DieResult.UNDEF,
      die2: DieResult.UNDEF,
      point: Point.EIGHT
    }

    const result = passLine(emptyBets, hand, defaultRules)
    t.notOk(result.payout)
    t.end()
  })

  suite.test('bet, no win', function (t) {
    const hand: Result = {
      result: HandResult.NEUTRAL,
      diceSum: 11,
      die1: DieResult.UNDEF,
      die2: DieResult.UNDEF,
      point: Point.FIVE
    }

    const result = passLine(passLineContractBet, hand, defaultRules)
    t.notOk(result.payout)
    t.end()
  })

  suite.end()
})

test('passOdds', (suite) => {
  suite.test('odds bet, no win', function (t) {
    const hand: Result = {
      result: HandResult.NEUTRAL,
      isComeOut: false,
      point: Point.EIGHT,
      diceSum: 10,
      die1: DieResult.UNDEF,
      die2: DieResult.UNDEF
    }

    const result = passOdds(passLineWithOddsBet, hand, defaultRules)
    t.notOk(result.payout)
    t.strictSame(result.bets, passLineWithOddsBet, 'settled bets are same as initial bets')
    t.end()
  })

  suite.test('odds bet win (4)', function (t) {
    const hand: Result = {
      result: HandResult.POINT_WIN,
      isComeOut: true,
      point: Point.FOUR,
      diceSum: 4,
      die1: DieResult.UNDEF,
      die2: DieResult.UNDEF
    }

    const result = passOdds(passLineWithOddsBet4, hand, defaultRules)
    t.equal(result.payout?.type, 'pass odds win')
    t.equal(result.payout?.principal, 15)
    t.equal(result.payout?.profit, 30)
    t.notOk(result.bets.getBet(BetPoint.PassOdds), 'pass odds bet is cleared')
    t.end()
  })

  suite.test('odds bet win (5)', function (t) {
    const hand: Result = {
      result: HandResult.POINT_WIN,
      isComeOut: true,
      point: Point.FIVE,
      diceSum: 5,
      die1: DieResult.UNDEF,
      die2: DieResult.UNDEF
    }

    const result = passOdds(passLineWithOddsBet5, hand, defaultRules)
    t.equal(result.payout?.type, 'pass odds win')
    t.equal(result.payout?.principal, 20)
    t.equal(result.payout?.profit, 30)
    t.notOk(result.bets.getBet(BetPoint.PassOdds), 'pass odds bet is cleared')
    t.end()
  })

  suite.test('odds bet win (6)', function (t) {
    const hand: Result = {
      result: HandResult.POINT_WIN,
      isComeOut: true,
      point: Point.SIX,
      diceSum: 6,
      die1: DieResult.UNDEF,
      die2: DieResult.UNDEF
    }

    const result = passOdds(passLineWithOddsBet6, hand, defaultRules)
    t.equal(result.payout?.type, 'pass odds win')
    t.equal(result.payout?.principal, 25)
    t.equal(result.payout?.profit, 30)
    t.notOk(result.bets.getBet(BetPoint.PassOdds), 'pass odds bet is cleared')
    t.end()
  })

  suite.test('odds bet win (8)', function (t) {
    const hand: Result = {
      result: HandResult.POINT_WIN,
      isComeOut: true,
      point: Point.EIGHT,
      diceSum: 8,
      die1: DieResult.UNDEF,
      die2: DieResult.UNDEF
    }

    const result = passOdds(passLineWithOddsBet8, hand, defaultRules)
    t.equal(result.payout?.type, 'pass odds win')
    t.equal(result.payout?.principal, 25)
    t.equal(result.payout?.profit, 30)
    t.notOk(result.bets.getBet(BetPoint.PassOdds), 'pass odds bet is cleared')
    t.end()
  })

  suite.end()
})

test('dontCome', function (t) {
  t.test('comeout loss, Craps 2', function (t) {
    const hand: Result = {
      result: HandResult.COMEOUT_LOSS,
      diceSum: DiceResult.TWO,
      die1: DieResult.UNDEF,
      die2: DieResult.UNDEF,
      point: Point.OFF
    }

    const dontComeBet: BetDictionary = new BetDictionary()
    dontComeBet.addBet(BetPoint.DontCome, 5)

    const result = dontComeBets(dontComeBet, hand, defaultRules)
    t.equal(result.payout?.type, 'dont come win')
    t.equal(result.payout?.principal, 5)
    t.equal(result.payout?.profit, 5)
    t.notOk(result.bets.getBet(BetPoint.DontCome), 'dont come bet is cleared')
    t.end()
  })

  t.test('comeout loss, Craps 3', function (t) {
    const hand: Result = {
      result: HandResult.COMEOUT_LOSS,
      diceSum: DiceResult.THREE,
      die1: DieResult.UNDEF,
      die2: DieResult.UNDEF,
      point: Point.OFF
    }

    const dontComeBet: BetDictionary = new BetDictionary()
    dontComeBet.addBet(BetPoint.DontCome, 5)

    const result = dontComeBets(dontComeBet, hand, defaultRules)
    t.equal(result.payout?.type, 'dont come win')
    t.equal(result.payout?.principal, 5)
    t.equal(result.payout?.profit, 5)
    t.notOk(result.bets.getBet(BetPoint.DontCome), 'dont come bet is cleared')
    t.end()
  })

  t.test('comeout win, 7', function (t) {
    const hand: Result = {
      result: HandResult.COMEOUT_WIN,
      diceSum: DiceResult.SEVEN,
      die1: DieResult.UNDEF,
      die2: DieResult.UNDEF,
      point: Point.OFF
    }

    const dontComeBet: BetDictionary = new BetDictionary()
    dontComeBet.addBet(BetPoint.DontCome, 5)

    const result = dontComeBets(dontComeBet, hand, defaultRules)
    t.notOk(result.payout)
    t.notOk(result.bets.getBet(BetPoint.DontCome), 'dont come bet is cleared')
    t.end()
  })

  t.test('comeout win, Yo 11', function (t) {
    const hand: Result = {
      result: HandResult.COMEOUT_WIN,
      diceSum: DiceResult.ELEVEN,
      die1: DieResult.UNDEF,
      die2: DieResult.UNDEF,
      point: Point.OFF
    }
    const dontComeBet: BetDictionary = new BetDictionary()
    dontComeBet.addBet(BetPoint.DontCome, 5)
    const result = dontComeBets(dontComeBet, hand, defaultRules)
    t.notOk(result.payout)
    t.notOk(result.bets.getBet(BetPoint.DontCome), 'dont come bet is cleared')
    t.end()
  })

  t.test('comeout loss, Push 12', function (t) {
    const hand: Result = {
      result: HandResult.COMEOUT_LOSS,
      diceSum: DiceResult.TWELVE,
      die1: DieResult.UNDEF,
      die2: DieResult.UNDEF,
      point: Point.OFF
    }
    const dontComeBet: BetDictionary = new BetDictionary()
    dontComeBet.addBet(BetPoint.DontCome, 5)
    const result = dontComeBets(dontComeBet, hand, defaultRules)
    t.notOk(result.payout)
    t.ok(result.bets.getBet(BetPoint.DontCome), 'dont come bet is not cleared')
    t.end()
  })

  t.test('dont come to point 4', function (t) {
    const hand: Result = {
      result: HandResult.NEUTRAL,
      diceSum: DiceResult.FOUR,
      die1: DieResult.UNDEF,
      die2: DieResult.UNDEF,
      point: Point.FIVE,
    }
    const dontComeBet: BetDictionary = new BetDictionary()
    dontComeBet.addBet(BetPoint.DontCome, 5)
    const result = dontComeBets(dontComeBet, hand, defaultRules)

    t.notOk(result.payout)
    t.notOk(result.bets.getBet(BetPoint.DontCome), 'dont come bet is cleared')
    t.equal(result.bets.getBet(BetPoint.DontComePoint4)?.amount, 5)
    t.end()
  })

  t.test('dont come to point 5', function (t) {
    const hand: Result = {
      result: HandResult.NEUTRAL,
      diceSum: DiceResult.FIVE,
      die1: DieResult.UNDEF,
      die2: DieResult.UNDEF,
      point: Point.SIX,
    }
    const dontComeBet: BetDictionary = new BetDictionary()
    dontComeBet.addBet(BetPoint.DontCome, 5)
    const result = dontComeBets(dontComeBet, hand, defaultRules)

    t.notOk(result.payout)
    t.notOk(result.bets.getBet(BetPoint.DontCome), 'dont come bet is cleared')
    t.equal(result.bets.getBet(BetPoint.DontComePoint5)?.amount, 5)
    t.end()
  })

  t.test('dont come to point 6', function (t) {
    const hand: Result = {
      result: HandResult.NEUTRAL,
      diceSum: DiceResult.SIX,
      die1: DieResult.UNDEF,
      die2: DieResult.UNDEF,
      point: Point.EIGHT,
    }
    const dontComeBet: BetDictionary = new BetDictionary()
    dontComeBet.addBet(BetPoint.DontCome, 5)
    const result = dontComeBets(dontComeBet, hand, defaultRules)

    t.notOk(result.payout)
    t.notOk(result.bets.getBet(BetPoint.DontCome), 'dont come bet is cleared')
    t.equal(result.bets.getBet(BetPoint.DontComePoint6)?.amount, 5)
    t.end()
  })

  t.test('dont come to point 8', function (t) {
    const hand: Result = {
      result: HandResult.NEUTRAL,
      diceSum: DiceResult.EIGHT,
      die1: DieResult.UNDEF,
      die2: DieResult.UNDEF,
      point: Point.NINE,
    }
    const dontComeBet: BetDictionary = new BetDictionary()
    dontComeBet.addBet(BetPoint.DontCome, 5)
    const result = dontComeBets(dontComeBet, hand, defaultRules)

    t.notOk(result.payout)
    t.notOk(result.bets.getBet(BetPoint.DontCome), 'dont come bet is cleared')
    t.equal(result.bets.getBet(BetPoint.DontComePoint8)?.amount, 5)
    t.end()
  })

  t.test('dont come to point 9', function (t) {
    const hand: Result = {
      result: HandResult.NEUTRAL,
      diceSum: DiceResult.NINE,
      die1: DieResult.UNDEF,
      die2: DieResult.UNDEF,
      point: Point.TEN,
    }
    const dontComeBet: BetDictionary = new BetDictionary()
    dontComeBet.addBet(BetPoint.DontCome, 5)
    const result = dontComeBets(dontComeBet, hand, defaultRules)

    t.notOk(result.payout)
    t.notOk(result.bets.getBet(BetPoint.DontCome), 'dont come bet is cleared')
    t.equal(result.bets.getBet(BetPoint.DontComePoint9)?.amount, 5)
    t.end()
  })

  t.test('dont come to point 10', function (t) {
    const hand: Result = {
      result: HandResult.NEUTRAL,
      diceSum: DiceResult.TEN,
      die1: DieResult.UNDEF,
      die2: DieResult.UNDEF,
      point: Point.FOUR,
    }
    const dontComeBet: BetDictionary = new BetDictionary()
    dontComeBet.addBet(BetPoint.DontCome, 5)
    const result = dontComeBets(dontComeBet, hand, defaultRules)

    t.notOk(result.payout)
    t.notOk(result.bets.getBet(BetPoint.DontCome), 'dont come bet is cleared')
    t.equal(result.bets.getBet(BetPoint.DontComePoint10)?.amount, 5)
    t.end()
  })

  t.test('dont come on 4, seven out', function (t) {
    const hand: Result = {
      result: HandResult.SEVEN_OUT,
      diceSum: DiceResult.SEVEN,
      die1: DieResult.UNDEF,
      die2: DieResult.UNDEF,
      point: Point.OFF
    }
    const dontComeBet: BetDictionary = new BetDictionary()
    dontComeBet.addBet(BetPoint.DontComePoint4, 5)
    const result = dontComeBets(dontComeBet, hand, defaultRules)
    t.equal(result.payout?.type, 'dont come win')
    t.equal(result.payout?.principal, 5)
    t.equal(result.payout?.profit, 5)
    t.notOk(result.bets.getBet(BetPoint.DontComePoint4))
    t.end()
  })

  t.test('dont come on 6, 3 craps', function (t) {

    const hand: Result = {
      result: HandResult.COMEOUT_LOSS,
      isComeOut: true,
      diceSum: DiceResult.THREE,
      die1: DieResult.UNDEF,
      die2: DieResult.UNDEF,
      point: Point.OFF
    }
    const dontComeBet: BetDictionary = new BetDictionary()
    dontComeBet.addBet(BetPoint.DontComePoint6, 5)
    const result = dontComeBets(dontComeBet, hand, defaultRules)
    t.notOk(result.payout)
    t.ok(result.bets.getBet(BetPoint.DontComePoint6))
    t.equal(result.bets.getBet(BetPoint.DontComePoint6)?.amount, 5)
    t.end()
  })
  t.end()
})
