import { playHand, rollD6 } from './index.js';
import { minPassLineMaxOdds, dontComeWithPlaceBets } from './betting.js';
import { HandResult, DiceResult, Memo, Result, distObj } from './consts.js';
import fs from 'fs';

let numHands = parseInt(process.argv.slice(2)[0], 10)
const showDetail = process.argv.slice(2)[1]
const handsFile = process.argv.slice(2)[2]
console.log(`handsFile: ${handsFile}`)  

console.log(`Simulating ${numHands} Craps Hand(s)`)
console.log('Using betting strategy: dontComeWithPlaceBets')
console.log(`Show detail: ${showDetail}`)


class Summary {
  balance: number;
  rollCount: number;
  pointsSet: number;
  pointsWon: number;
  comeOutWins: number;
  comeOutLosses: number;
  netComeOutWins: number;
  neutrals: number;
  handCount: number;
  dist?: Map<DiceResult, distObj>;

  constructor() {
    this.balance = 0
    this.rollCount = 0
    this.pointsSet = 0
    this.pointsWon = 0
    this.comeOutWins = 0
    this.comeOutLosses = 0
    this.netComeOutWins = 0
    this.neutrals = 0
    this.handCount = 0
    this.dist = new Map();
    this.dist.set(DiceResult.TWO, new distObj(0, 1 / 36));
    this.dist.set(DiceResult.THREE, new distObj(0, 2 / 36));
    this.dist.set(DiceResult.FOUR, new distObj(0, 3 / 36));
    this.dist.set(DiceResult.FIVE, new distObj(0, 4 / 36));
    this.dist.set(DiceResult.SIX, new distObj(0, 5 / 36));
    this.dist.set(DiceResult.SEVEN, new distObj(0, 6 / 36));
    this.dist.set(DiceResult.EIGHT, new distObj(0, 5 / 36));
    this.dist.set(DiceResult.NINE, new distObj(0, 4 / 36));
    this.dist.set(DiceResult.TEN, new distObj(0, 3 / 36));
    this.dist.set(DiceResult.ELEVEN, new distObj(0, 2 / 36));
    this.dist.set(DiceResult.TWELVE, new distObj(0, 1 / 36));
  }
}

// if the handsFile is provided and is valid json {d1: 1, d2: 2}, read the hands from the file and put them in a roll array
let rolls: { d1: number, d2: number }[] = [];
if (handsFile) {
  try {
    const fileContents = fs.readFileSync(handsFile, 'utf8');
    const parsedRolls = JSON.parse(fileContents);
    if (Array.isArray(parsedRolls) && parsedRolls.every(roll =>
      typeof roll === 'object' &&
      typeof roll.d1 === 'number' &&
      typeof roll.d2 === 'number'
    )) {
      rolls = parsedRolls;
      numHands = 1;
      console.log(`[rolls] loaded ${rolls.length} rolls from ${handsFile}`)
      console.log(`[rolls] ${JSON.stringify(rolls)}`)
    } else {
      throw new Error('Invalid roll format - each roll must have d1 and d2 numbers');
    }
  } catch (err) {
    console.error('Error reading rolls file:', err);
    process.exit(1);
  }
}

let shootCount = 0;
let rollCount = 0;
const roller = (): number => {
  if (shootCount >= rolls.length) {
    console.log(`[roller] shootCount: ${shootCount} >= rolls.length: ${rolls.length}`)
    return rollD6();
  }
  if (rolls.length > 0) {
    if (rollCount % 2 === 0) {
      rollCount++;
      return rolls[shootCount].d1;
    }
    rollCount++;
    return rolls[shootCount++].d2;
  }
  return rollD6();
}

const sessionSummary = new Summary();
sessionSummary.balance = 5000;
const hands = []
const rules = {
  minBet: 5,
  maxOddsMultiple: {
    4: 3,
    5: 4,
    6: 5,
    8: 5,
    9: 4,
    10: 3
  }
}

console.log(`[table rules] minimum bet: $${rules.minBet}`)

for (let i = 0; i < numHands; i++) {
  let hand
  if (rolls.length > 0) {
    hand = playHand(rules, dontComeWithPlaceBets, roller)
  } else {
    hand = playHand(rules, dontComeWithPlaceBets)
  }
  hand.summary = new Summary()

  sessionSummary.balance += hand.balance
  hand.summary.balance = hand.balance

  hand.history.reduce((memo: Memo, roll: Result) => {
    memo.rollCount++
    hand.summary.rollCount++
    const distObj = memo.dist.get(roll.diceSum)
    if (distObj) distObj.ct++

    switch (roll.result) {
      case HandResult.NEUTRAL:
        memo.neutrals++
        hand.summary.neutrals++
        break
      case HandResult.POINT_SET:
        memo.pointsSet++
        hand.summary.pointsSet++
        break
      case HandResult.POINT_WIN:
        memo.pointsWon++
        hand.summary.pointsWon++
        break
      case HandResult.COMEOUT_WIN:
        memo.comeOutWins++
        hand.summary.comeOutWins++
        memo.netComeOutWins++
        hand.summary.netComeOutWins++
        break
      case HandResult.COMEOUT_LOSS:
        memo.comeOutLosses++
        hand.summary.comeOutLosses++
        memo.netComeOutWins--
        hand.summary.netComeOutWins--
        break
    }

    return memo
  }, sessionSummary)

  hands.push(hand)
}

sessionSummary.handCount = hands.length
if (!sessionSummary) { throw "missin summary"; }
if (!sessionSummary.dist) { throw "missin summary"; }

for (const k of sessionSummary.dist.keys()) {

  const dist = sessionSummary.dist.get(k)
  if (!dist) { throw "missin dist"; }
  dist.ref = Number((dist.prob * sessionSummary.rollCount).toFixed(1))
  dist.diff = Number((dist.ct - dist.ref).toFixed(1))
  dist.diff_pct = Number((((dist.ct - dist.ref) / dist.ref) * 100).toFixed(1))
  if (showDetail) {
    dist.ref_work = `${(dist.prob * sessionSummary.rollCount).toFixed(1)} (${sessionSummary.rollCount} * ${dist.prob.toFixed(2)})`
  }
  //delete dist.prob
  sessionSummary.dist?.set(k, dist);
}

console.log('\nDice Roll Distribution')
console.log(`┌─────┬───────┬──────────┬──────┬────────┐`);
console.log(`│ Key │ Count │ Expected │ Diff │ Diff % │`);
console.log(`├─────┼───────┼──────────┼──────┼────────┤`);
for (const [key, value] of sessionSummary.dist.entries()) {
  console.log(`│ ${key.toString().padStart(3)} | ${value.ct.toString().padStart(5)} │ ${value.ref?.toString().padStart(8)} │ ${value.diff?.toString().padStart(4)} │ ${value.diff_pct?.toString().padStart(5)}% │`);
}
console.log(`└─────┴───────┴──────────┴──────┴────────┘`);
delete sessionSummary.dist

console.log('\nSession Summary')
console.log(`┌───────────────────┬──────────┐`);
console.log(`│ Key               │ Values   │`);
console.log(`├───────────────────┼──────────┤`);
console.log(`│ Balance:          │ $${sessionSummary.balance.toString().padStart(7)} │`)
console.log(`│ Roll Count:       │ ${sessionSummary.rollCount.toString().padStart(8)} │`)
console.log(`│ Points Set:       │ ${sessionSummary.pointsSet.toString().padStart(8)} │`)
console.log(`│ Points Won:       │ ${sessionSummary.pointsWon.toString().padStart(8)} │`)
console.log(`│ Come Out Wins:    │ ${sessionSummary.comeOutWins.toString().padStart(8)} │`)
console.log(`│ Come Out Losses:  │ ${sessionSummary.comeOutLosses.toString().padStart(8)} │`)
console.log(`│ Net Come Out Wins:│ ${sessionSummary.netComeOutWins.toString().padStart(8)} │`)
console.log(`│ Neutrals:         │ ${sessionSummary.neutrals.toString().padStart(8)} │`)
console.log(`│ Hand Count:       │ ${sessionSummary.handCount.toString().padStart(8)} │`)
console.log(`└───────────────────┴──────────┘`);
console.log('\nHands Summary')

hands.forEach((hand, index) => {
  delete hand.summary.dist
  console.log(`\nHand ${index + 1}:`)
  console.log(`  Balance: $${hand.summary.balance}`)
  console.log(`  Roll Count: ${hand.summary.rollCount}`)
  console.log(`  Points Set: ${hand.summary.pointsSet}`)
  console.log(`  Points Won: ${hand.summary.pointsWon}`)
  console.log(`  Come Out Wins: ${hand.summary.comeOutWins}`)
  console.log(`  Come Out Losses: ${hand.summary.comeOutLosses}`)
  console.log(`  Net Come Out Wins: ${hand.summary.netComeOutWins}`)
  console.log(`  Neutrals: ${hand.summary.neutrals}`)
})

if (showDetail === '1' || showDetail === 'true') {
  console.log('\nDetailed Hand History:');
  hands.forEach((hand, handIndex) => {
    console.log(`\nHand ${handIndex + 1} History:`);
    hand.history.forEach((roll: Result, rollIndex: number) => {
      console.log(`  Roll ${rollIndex + 1}:`);
      console.log(`    Dice: ${roll.die1} + ${roll.die2} = ${roll.diceSum}`);
      console.log(`    Result: ${roll.result}`);
      console.log(`    Point: ${roll.point}`);
      console.log(`    Come Out: ${roll.isComeOut}`);
    });
  });
}
