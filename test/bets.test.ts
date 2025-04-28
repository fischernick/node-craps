import { beforeEach, test } from "tap";
import { BetPoint } from "../src/consts.js";
import { BetDictionary } from "../src/bets.js";

// Tests

let bets: BetDictionary;

beforeEach(() => {
    bets = new BetDictionary();
});

test('constructor initializes with empty bets', (t) => {
    t.equal(bets.newBetSum, 0);
    t.equal(bets[BetPoint.Pass].amount, 0);
    t.equal(bets[BetPoint.Pass].isContract, false);
    t.equal(bets[BetPoint.Pass].set, false);
    t.end()
});

test('addBet adds a bet correctly', (t) => {
    bets.addBet(BetPoint.Pass, 100);
    t.equal(bets[BetPoint.Pass].amount, 100);
    t.equal(bets[BetPoint.Pass].isContract, false);
    t.equal(bets[BetPoint.Pass].set, true);
    t.equal(bets.newBetSum, 100);
    t.end()
});

test('getBet returns undefined for unset bet', (t) => {
    t.equal(bets.getBet(BetPoint.Pass), undefined);
    t.end()
});

test('getBet returns bet for set bet', (t) => {
    bets.addBet(BetPoint.Pass, 100);
    t.equal(bets.getBet(BetPoint.Pass)?.amount, 100);
    t.equal(bets.getBet(BetPoint.Pass)?.isContract, false);
    t.equal(bets.getBet(BetPoint.Pass)?.set, true);
    t.end()
});

test('clearBet clears a specific bet', (t) => {
    bets.addBet(BetPoint.Pass, 100);
    bets.clearBet(BetPoint.Pass);
    t.equal(bets[BetPoint.Pass].amount, 0);
    t.equal(bets[BetPoint.Pass].isContract, false);
    t.equal(bets[BetPoint.Pass].set, false);
    t.end()
});

test('clearAllBets clears all bets', (t) => {
    bets.addBet(BetPoint.Pass, 100);
    bets.addBet(BetPoint.Come, 200);
    bets.clearAllBets();
    t.equal(bets[BetPoint.Pass].amount, 0);
    t.equal(bets[BetPoint.Pass].isContract, false);
    t.equal(bets[BetPoint.Pass].set, false);
    t.end();
});

test('resetBetSum resets sum to zero', (t) => {
    bets.addBet(BetPoint.Pass, 100);
    t.equal(bets.newBetSum, 100);
    bets.resetBetSum();
    t.equal(bets.newBetSum, 0);
    t.end();
});

test('setContract sets contract flag', (t) => {
    bets.addBet(BetPoint.Pass, 100);
    bets.setContract([BetPoint.Pass], true);
    t.equal(bets[BetPoint.Pass].isContract, true);
    t.end();
});

test('setContract handles multiple bet points', (t) => {
    bets.addBet(BetPoint.Pass, 100);
    bets.addBet(BetPoint.Come, 200);
    bets.setContract([BetPoint.Pass, BetPoint.Come], true);
    t.equal(bets[BetPoint.Pass].isContract, true);
    t.equal(bets[BetPoint.Come].isContract, true);
    t.end();
});
