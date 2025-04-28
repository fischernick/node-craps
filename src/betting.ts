import { type Result, BetPoint, DontComePointBets, Rules } from "./consts.js";
import { BetDictionary } from "./bets.js";

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
  if (!hand.isComeOut) {
    // check all the dont come point bets for an existing dont come bet
    const dontComeBet = DontComePointBets.find(bet => bets?.getBet(bet))
    let theseBets = bets ?? new BetDictionary()

    if (!dontComeBet) {
    // no dont come bet, add one
      theseBets.addBet(BetPoint.DontCome, 60)      
    }

    // if there is not a dont come bet on the same number, add the place bet
    if (!bets?.getBet(BetPoint.DontComePoint5) && !bets?.getBet(BetPoint.Place5)) theseBets.addBet(BetPoint.Place5, 15)
    if (!bets?.getBet(BetPoint.DontComePoint6) && !bets?.getBet(BetPoint.Place6)) theseBets.addBet(BetPoint.Place6, 18)
    if (!bets?.getBet(BetPoint.DontComePoint8) && !bets?.getBet(BetPoint.Place8)) theseBets.addBet(BetPoint.Place8, 18)
    if (!bets?.getBet(BetPoint.DontComePoint9) && !bets?.getBet(BetPoint.Place9)) theseBets.addBet(BetPoint.Place9, 15)
    return theseBets
  }
  return bets ? bets : new BetDictionary()
}
