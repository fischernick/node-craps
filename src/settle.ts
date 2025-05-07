import {
  BetPoint,
  BetPointPayouts,
  DiceResult,
  HandResult,
  Summary,
  Rules,
  type Result,
  type Payout,
  diceResultAsPoint,
  Point,
  DontComeBetPoints,
  PlaceBetPoints,
  getPlaceBetPoint,
} from "./consts.js";
import { BetDictionary } from "./bets.js";

export type Settlement = {
  bets: BetDictionary;
  payout?: Payout;
  actions?: string[];
};

export function passLine(
  bets: BetDictionary,
  hand: Result,
  rules: Rules,
): Settlement {
  if (bets.getBet(BetPoint.Pass) === undefined) return { bets };

  const payoutActionResults = [
    HandResult.SEVEN_OUT,
    HandResult.POINT_WIN,
    HandResult.COMEOUT_WIN,
    HandResult.COMEOUT_LOSS,
  ];
  const betHasPayoutAction = payoutActionResults.includes(
    hand.result ?? HandResult.NEUTRAL,
  );

  if (!betHasPayoutAction) return { bets }; // keep bets intact if no action

  const passLineBet = bets.getBet(BetPoint.Pass);
  bets.clearBet(BetPoint.Pass); // clear pass line bet on action
  const actions: string[] = ["clear pass line bet"];

  if (
    hand.result === HandResult.COMEOUT_LOSS ||
    hand.result === HandResult.SEVEN_OUT
  )
    return { bets };

  const payout: Payout = {
    type: hand.result ?? HandResult.NEUTRAL,
    principal: passLineBet?.amount ?? 0,
    profit: (passLineBet?.amount ?? 0) * 1,
  };
  actions.push(`payout ${payout.principal}+${payout.profit}`);

  return { payout, bets, actions };
}

export function passOdds(
  bets: BetDictionary,
  hand: Result,
  rules: Rules,
): Settlement {
  const passOddsPoint = BetPoint.PassOdds;
  if (bets.getBet(passOddsPoint) === undefined) return { bets };

  if (!hand.result || !hand.diceSum)
    throw new Error("no hand result or dice sum");

  const actionResults = [HandResult.SEVEN_OUT, HandResult.POINT_WIN];
  const betHasAction = actionResults.includes(
    hand.result ?? HandResult.NEW_GAME,
  );
  if (!betHasAction) return { bets }; // keep bets intact if no action

  const rbets = bets.copy();
  const passOddsBet = rbets.getBet(passOddsPoint);
  rbets.clearBet(passOddsPoint); // clear pass line bet on action
  const actions: string[] = ["clear pass odds bet"];

  if (hand.result === HandResult.SEVEN_OUT) return { bets };

  const payout = {
    type: "pass odds win",
    principal: passOddsBet?.amount ?? 0,
    profit:
      (passOddsBet?.amount ?? 0) *
      (getPayout(passOddsPoint, hand.diceSum) ?? 0),
  };
  actions.push(`payout ${payout.principal}+${payout.profit}`);
  return { payout, bets: rbets, actions };
}

function getDontComePointBet(diceSum: DiceResult): BetPoint | undefined {
  switch (diceSum) {
    case DiceResult.FOUR:
      return BetPoint.DontComePoint4;
    case DiceResult.FIVE:
      return BetPoint.DontComePoint5;
    case DiceResult.SIX:
      return BetPoint.DontComePoint6;
    case DiceResult.EIGHT:
      return BetPoint.DontComePoint8;
    case DiceResult.NINE:
      return BetPoint.DontComePoint9;
    case DiceResult.TEN:
      return BetPoint.DontComePoint10;
  }
  return undefined;
}

export function placeBets(
  bets: BetDictionary,
  hand: Result,
  rules: Rules,
): Settlement {
  //const placeBets = PlaceBetPoints.map(bet => bets.getBet(bet))
  if (PlaceBetPoints.every((betPoint) => bets.getBet(betPoint) === undefined)) {
    return { bets };
  }

  const actions: string[] = [];
  // if the dice sum is 7, clear all place bets
  if (hand.diceSum === DiceResult.SEVEN) {
    for (const bet of PlaceBetPoints) {
      if (bets.getBet(bet)) {
        bets.clearBet(bet);
        actions.push(`clear place bet ${BetPoint[bet]}`);
      }
    }
  }

  // if the dice sum has a matching place bet, pay it out and clear it
  const matchingPlaceBet = getPlaceBetPoint(hand.diceSum);
  if (!matchingPlaceBet) {
    return { bets };
  }
  const winningPlaceBet = bets.getBet(matchingPlaceBet);
  if (!winningPlaceBet) {
    return { bets };
  }
  const payout = {
    type: "place win",
    principal: winningPlaceBet.amount,
    profit:
      winningPlaceBet.amount * (getPayout(matchingPlaceBet, hand.diceSum) ?? 0),
  };
  if (process.env.DEBUG)
    console.log(`clearing winning place bet ${BetPoint[matchingPlaceBet]}`);
  bets.clearBet(matchingPlaceBet);
  actions.push(`clear place bet ${BetPoint[matchingPlaceBet]}`);
  return { bets, payout, actions };
}

export function dontComeBets(
  bets: BetDictionary,
  hand: Result,
  rules: Rules,
): Settlement {
  const dontComeBet = bets.getBet(BetPoint.DontCome);
  // diceSum of 12 is a push on the dont come bet
  if (hand.diceSum === DiceResult.TWELVE) {
    return { bets };
  }

  // Create copy of input bets
  const rbets = bets.copy();
  const actions: string[] = [];
  // diceSum of 7 and 11 is a loss of the dont come bet
  if (hand.diceSum === DiceResult.ELEVEN || hand.diceSum === DiceResult.SEVEN) {
    if (dontComeBet) {
      rbets.clearBet(BetPoint.DontCome);
      actions.push(`clear dont come bet`);
    }
    // eleven has no other effect on set dont come bets
    if (hand.diceSum === DiceResult.ELEVEN) {
      return { bets: rbets, actions };
    }
  }

  let hasPayout = false;
  // check if any dont come bets are on the table that will pay out
  // 4,5,6,8,9,10.  DC will payout on craps {2,3} but not 12.
  for (const betPoint of [...DontComeBetPoints, BetPoint.DontCome]) {
    if (rbets.getBet(betPoint)) {
      hasPayout = true;
      break;
    }
  }

  // if no dont come bets are on the table, return the bets unchanged, aka no payout
  if (!hasPayout) {
    return { bets: rbets, actions };
  }

  const payout = {
    type: "dont come win",
    principal: 0,
    profit: 0,
  };

  // craps {2,3} bar 12 payout on dont come bet
  if ([DiceResult.TWO, DiceResult.THREE].includes(hand.diceSum)) {
    if (dontComeBet) {
      payout.principal += dontComeBet?.amount ?? 0;
      payout.profit +=
        (dontComeBet?.amount ?? 0) *
        (getPayout(BetPoint.DontCome, hand.diceSum) ?? 0);
      rbets.clearBet(BetPoint.DontCome);
      actions.push(`clear dont come bet`);
      actions.push(`payout ${payout.principal}+${payout.profit}`);
      return { bets: rbets, payout, actions };
    }
    return { bets: rbets, actions };
  }

  // 7 out payout on pointed dont come point bets
  if (DiceResult.SEVEN === hand.diceSum) {
    for (const betPoint of DontComeBetPoints) {
      const bet = rbets.getBet(betPoint);
      if (bet) {
        payout.principal += bet.amount;
        payout.profit +=
          bet.amount * (getPayout(BetPoint.DontCome, hand.diceSum) ?? 0);
        // clear that bet when its a 7 win
        rbets.clearBet(betPoint);
        actions.push(`clear dont come point bet ${BetPoint[betPoint]}`);
        actions.push(`payout ${payout.principal}+${payout.profit}`);
      }
    }

    return { bets: rbets, payout, actions };
  }

  // 2,3,7,11,12 are accounted for above
  if (
    [
      DiceResult.TWO,
      DiceResult.THREE,
      DiceResult.SEVEN,
      DiceResult.ELEVEN,
      DiceResult.TWELVE,
    ].includes(hand.diceSum)
  ) {
    throw new Error(`2,3,7,11,12 are accounted for above, done messed up`);
  }

  const point = diceResultAsPoint(hand.diceSum);
  if (point === Point.OFF) {
    throw new Error(`point is undefined or off for dice sum ${hand.diceSum}`);
  }

  const dontComePointBet = getDontComePointBet(hand.diceSum);
  if (dontComePointBet && bets.getBet(dontComePointBet)) {
    // if there is a dc point bet on the table, and that number is rolled, its a loss
    rbets.clearBet(dontComePointBet);
    actions.push(`clear dont come point bet ${BetPoint[dontComePointBet]}`);
  }

  // if there a bet residing o DC, move it to dont come point bet
  if (dontComeBet) {
    if (!dontComePointBet) {
      throw new Error(`no dont come point bet for dice sum ${hand.diceSum}`);
    }

    // move that dont come bet to the numbered dont come bet point
    rbets.moveDCBet(dontComePointBet);
    actions.push(
      `move dont come bet to dont come point bet ${BetPoint[dontComePointBet]}`,
    );
  }
  // clear the dont come bet
  rbets.clearBet(BetPoint.DontCome);
  actions.push(`clear dont come bet`);
  return { bets: rbets, actions };
}

export function getPayout(betPoint: BetPoint, diceSum: DiceResult) {
  const payouts = BetPointPayouts[betPoint];
  if (!payouts || !payouts[diceSum]) {
    throw new Error(
      `no payouts defined for bet point ${betPoint} for dice sum ${diceSum}`,
    );
  }

  return payouts[diceSum];
}

export function settleAllBets(
  bets: BetDictionary,
  hand: Result,
  rules: any,
): { bets: BetDictionary; newPayouts?: Payout[]; actions?: string[] } {
  const payouts: Payout[] = [];

  // when the hand establishes a point, set the pass and dont pass bets to contract
  if (hand.result === HandResult.POINT_SET) {
    bets.setContract([BetPoint.Pass, BetPoint.DontPass], true);
  }

  // when the hand is SEVEN_OUT or POINT_WIN, unset the contracts
  if (
    hand.result === HandResult.SEVEN_OUT ||
    hand.result === HandResult.POINT_WIN
  ) {
    bets.setContract([BetPoint.Pass, BetPoint.DontPass], false);
  }
  const actions: string[] = [];
  const allTheSettlements = [placeBets, dontComeBets, passLine, passOdds];
  for (const betSettler of allTheSettlements) {
    const result = betSettler(bets, hand, rules);
    bets = result.bets;
    if (result.payout) {
      payouts.push(result.payout);
    }
    if (result.actions) {
      actions.push(...result.actions);
    }
  }

  if (
    !DontComeBetPoints.find((bet) => bets.getBet(bet)) &&
    !PlaceBetPoints.find((bet) => bets.getBet(bet))
  ) {
    if (process.env.DEBUG)
      console.log(`no dont come or place bets on the table`);
    delete bets.notes.dontCome;
  }

  bets.payoutSum = payouts.reduce((memo: Summary, payout) => {
    if (!payout) return memo;

    memo.principal += payout.principal;
    memo.profit += payout.profit;
    memo.total += payout.principal + payout.profit;
    //memo.ledger.push(payout)
    return memo;
  }, new Summary());

  return { bets, newPayouts: payouts, actions };
}
