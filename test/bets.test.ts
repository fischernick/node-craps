import { beforeEach, test } from "tap";
import { BetPoint, DiceResult } from "../src/consts.js";
import { BetDictionary } from "../src/bets.js";

// Tests

let bets: BetDictionary;

beforeEach(() => {
  bets = new BetDictionary();
});

test("constructor initializes with empty bets", (t) => {
  t.equal(bets.newBetSum, 0);
  t.equal(bets[BetPoint.Pass].amount, 0);
  t.equal(bets[BetPoint.Pass].isContract, false);
  t.equal(bets[BetPoint.Pass].set, false);
  t.end();
});

test("addBet adds a bet correctly", (t) => {
  bets.addBet(BetPoint.Pass, 100);
  t.equal(bets[BetPoint.Pass].amount, 100);
  t.equal(bets[BetPoint.Pass].isContract, false);
  t.equal(bets[BetPoint.Pass].set, true);
  t.equal(bets.newBetSum, 100);
  t.end();
});

test("getBet returns undefined for unset bet", (t) => {
  t.equal(bets.getBet(BetPoint.Pass), undefined);
  t.end();
});

test("getBet returns bet for set bet", (t) => {
  bets.addBet(BetPoint.Pass, 100);
  t.equal(bets.getBet(BetPoint.Pass)?.amount, 100);
  t.equal(bets.getBet(BetPoint.Pass)?.isContract, false);
  t.equal(bets.getBet(BetPoint.Pass)?.set, true);
  t.end();
});

test("clearBet clears a specific bet", (t) => {
  bets.addBet(BetPoint.Pass, 100);
  bets.clearBet(BetPoint.Pass);
  t.equal(bets[BetPoint.Pass].amount, 0);
  t.equal(bets[BetPoint.Pass].isContract, false);
  t.equal(bets[BetPoint.Pass].set, false);
  t.end();
});

test("clearAllBets clears all bets", (t) => {
  bets.addBet(BetPoint.Pass, 100);
  bets.addBet(BetPoint.Come, 200);
  bets.clearAllBets();
  t.equal(bets[BetPoint.Pass].amount, 0);
  t.equal(bets[BetPoint.Pass].isContract, false);
  t.equal(bets[BetPoint.Pass].set, false);
  t.end();
});

test("resetBetSum resets sum to zero", (t) => {
  bets.addBet(BetPoint.Pass, 100);
  t.equal(bets.newBetSum, 100);
  bets.resetBetSum();
  t.equal(bets.newBetSum, 0);
  t.end();
});

test("setContract sets contract flag", (t) => {
  bets.addBet(BetPoint.Pass, 100);
  bets.setContract([BetPoint.Pass], true);
  t.equal(bets[BetPoint.Pass].isContract, true);
  t.end();
});

test("setContract handles multiple bet points", (t) => {
  bets.addBet(BetPoint.Pass, 100);
  bets.addBet(BetPoint.Come, 200);
  bets.setContract([BetPoint.Pass, BetPoint.Come], true);
  t.equal(bets[BetPoint.Pass].isContract, true);
  t.equal(bets[BetPoint.Come].isContract, true);
  t.end();
});
test("moveDCBet moves dont come bet to point", (t) => {
  bets.addBet(BetPoint.DontCome, 100);
  bets.moveDCBet(BetPoint.DontComePoint4);
  t.equal(bets[BetPoint.DontCome].amount, 0);
  t.equal(bets[BetPoint.DontComePoint4].amount, 100);
  t.equal(bets[BetPoint.DontComePoint4].set, true);
  t.equal(bets[BetPoint.DontComePoint4].isContract, true);

  t.end();
});

test("moveDCBet handles all valid point numbers", (t) => {
  const testPoints = [
    { roll: DiceResult.FOUR, point: BetPoint.DontComePoint4 },
    { roll: DiceResult.FIVE, point: BetPoint.DontComePoint5 },
    { roll: DiceResult.SIX, point: BetPoint.DontComePoint6 },
    { roll: DiceResult.EIGHT, point: BetPoint.DontComePoint8 },
    { roll: DiceResult.NINE, point: BetPoint.DontComePoint9 },
    { roll: DiceResult.TEN, point: BetPoint.DontComePoint10 }
  ];

  testPoints.forEach(({ roll, point }) => {
    bets.addBet(BetPoint.DontCome, 100);
    bets.moveDCBet(point);
    t.equal(bets[BetPoint.DontCome].amount, 0);
    t.equal(bets[point].amount, 100);
    t.equal(bets[point].set, true);
    // bets moved to dc points are contracts
    t.equal(bets[point].isContract, true);
    bets.clearAllBets();
  });
  t.end();
});

test("moveDCBet does nothing for invalid point numbers", (t) => {
  bets.addBet(BetPoint.DontCome, 100);
  bets.moveDCBet(BetPoint.Come);
  t.equal(bets[BetPoint.DontCome].amount, 100);
  t.end();
});

