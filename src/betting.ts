import { type Result, BetPoint, DontComeBetPoints, Rules } from "./consts.js";
import { BetDictionary } from "./bets.js";

export type BettingStrategy = (opts: HandOptions) => BetDictionary
export type BettingStrategyName = 'minPassLineOnly' | 'minPassLineMaxOdds' | 'dontComeWithPlaceBets';

export function getBettingStrategy(strategyName: BettingStrategyName): (opts: HandOptions) => BetDictionary {
  switch (strategyName) {
    case 'minPassLineOnly':
      return minPassLineOnly;
    case 'minPassLineMaxOdds':
      return minPassLineMaxOdds;
    case 'dontComeWithPlaceBets':
      return dontComeWithPlaceBets;
    default:
      throw new Error(`Unknown betting strategy: ${strategyName}`);
  }
}

export type HandOptions = {
  rules?: Rules;
  hand: Result;
  bets?: BetDictionary;
}

export function minPassLineOnly (opts: HandOptions): BetDictionary {
  const { rules, bets: existingBets, hand } = opts 
  // Create a new bets object
  let bets = existingBets ?? new BetDictionary();


  if (process.env.DEBUG) {
    const shouldMakeNewPassLineBet = hand.isComeOut && !bets.getBet(BetPoint.Pass);
    console.log(`[MPLO decision] Make new pass line bet? isComeOut=${hand.isComeOut}, noExistingBet=${!bets.getBet(BetPoint.Pass)} => ${shouldMakeNewPassLineBet}`);
  }

  if ((hand?.isComeOut ?? false) && bets.getBet(BetPoint.Pass) === undefined) {
    if (!rules) throw new Error("Rules are required");
    bets.addBet(BetPoint.Pass, rules.minBet);
    if (process.env.DEBUG) console.log(`[MPLO did] bet: ${JSON.stringify(bets)}`);
  }

  return bets
}


export function minPassLineMaxOdds (opts: HandOptions): BetDictionary {
  const bets = minPassLineOnly(opts)
  const { rules, hand } = opts

  if (process.env.DEBUG) console.log(`[MPLMO decision] make a new pass odds bet?: ${!hand.isComeOut} && ${!bets.getBet(BetPoint.PassOdds)} => ${(!hand.isComeOut) && (!bets.getBet(BetPoint.PassOdds))}`)

  if ((hand?.isComeOut ?? false) === false && !bets.getBet(BetPoint.PassOdds)) {
    if (!rules) throw new Error("Rules are required");
    // max odds is the rules mulitplier allowed for the point * the pass line bet
    const oddsAmount = rules.maxOddsMultiple[hand.point] * (bets.getBet(BetPoint.Pass)?.amount ?? 0);
    bets.addBet(BetPoint.PassOdds, oddsAmount);
  }

  return bets
}

export function dontComeWithPlaceBets(opts: HandOptions): BetDictionary {
  // 15 5&9
  // 18 6&8
  // dc 60
  const { rules, hand, bets } = opts
  let theseBets = bets ?? new BetDictionary()

  // is there any pointed/numbered don't come bet
  const dontComePointedBet: boolean = !(!DontComeBetPoints.find(bet => theseBets?.getBet(bet)))

  // is there a dont come bet
  let dontComeBet: boolean = !(!theseBets?.getBet(BetPoint.DontCome))

  // if the hand is not a come out, we need to add a dont come bet
  if (!hand.isComeOut) {
    // check all the dont come point bets for an existing dont come bet

    if (!dontComePointedBet && !theseBets.notes.dontCome) {
    // no dont come bet, add one
      theseBets.addBet(BetPoint.DontCome, 60)
      theseBets.notes.dontCome = "set"
      dontComeBet = true
    }
  }

  if (dontComePointedBet || dontComeBet) {
    // if there is not a dont come bet on the same number, add the place bet
    if (!bets?.getBet(BetPoint.DontComePoint5) && !bets?.getBet(BetPoint.Place5)) theseBets.addBet(BetPoint.Place5, 15)
    if (!bets?.getBet(BetPoint.DontComePoint6) && !bets?.getBet(BetPoint.Place6)) theseBets.addBet(BetPoint.Place6, 18)
    if (!bets?.getBet(BetPoint.DontComePoint8) && !bets?.getBet(BetPoint.Place8)) theseBets.addBet(BetPoint.Place8, 18)
    if (!bets?.getBet(BetPoint.DontComePoint9) && !bets?.getBet(BetPoint.Place9)) theseBets.addBet(BetPoint.Place9, 15)
  }
  return theseBets
}

