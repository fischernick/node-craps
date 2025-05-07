import { playHand, rollD6 } from './index.js';
import { BettingStrategy } from './betting.js';
import { HandResult, Summary, Result } from './consts.js';
import fs from 'fs';
import chalk from 'chalk';

// Configuration type for hands.ts execution
export type HandsConfig = {
  numHands: number;
  showDetail: boolean;
  startingBalance: number;
  bettingStrategy: BettingStrategy;
  handsFile?: string;
  displayTables?: boolean;
};

// Default configuration values
const defaultConfig: HandsConfig = {
  numHands: 10,
  showDetail: false,
  startingBalance: 5000,
  bettingStrategy: BettingStrategy.DontComeWithPlaceBets,
  handsFile: undefined,
  displayTables: false
};

// Parse command line arguments or load from config file
const parseArgs = (): HandsConfig => {
  const args = process.argv.slice(2);
  const config: HandsConfig = { ...defaultConfig };

  // Parse named arguments
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const nextArg = args[i + 1];

    switch (arg) {
      case '-n':
      case '--num-hands':
        if (nextArg) {
          const numHandsArg = parseInt(nextArg, 10);
          if (!isNaN(numHandsArg)) {
            config.numHands = numHandsArg;
          }
        }
        i++;
        break;

      case '-d':
      case '--show-detail':
        config.showDetail = true;
        break;

      case '-b':
      case '--balance':
        if (nextArg) {
          const startingBalanceArg = parseInt(nextArg, 10);
          if (!isNaN(startingBalanceArg)) {
            config.startingBalance = startingBalanceArg;
          }
        }
        i++;
        break;

      case '-s':
      case '--strategy':
        if (nextArg) {
          if (['dontComeWithPlaceBets', 'minPassLineMaxOdds', 'minPassLineOnly'].includes(nextArg)) {
            config.bettingStrategy = nextArg as HandsConfig['bettingStrategy'];
          } else {
            console.log(`Unknown betting strategy: ${nextArg}`);
            process.exit(1);
          }
        }
        i++;
        break;

      case '-f':
      case '--file':
        if (nextArg) {
          config.handsFile = nextArg;
        }
        i++;
        break;

      case '-t':
      case '--tables':
        config.displayTables = true;
        break;

      case '-h':
      case '--help':
        console.log(`
Usage: node --loader ts-node/esm src/hands.ts [options]

Options:
  -n, --num-hands <number>    Number of hands to simulate (default: 10)
  -d, --show-detail          Show detailed hand information
  -b, --balance <number>     Starting balance (default: 5000)
  -s, --strategy <name>      Betting strategy: dontComeWithPlaceBets, minPassLineMaxOdds, minPassLineOnly
  -f, --file <path>          Path to hands file
  -t, --tables               Display tables
  -h, --help                 Show this help message
        `);
        process.exit(0);
        break;
    }
  }

  return config;
};

const config = parseArgs();
let numHands: number = config.numHands ?? defaultConfig.numHands;
const showDetail = config.showDetail ?? defaultConfig.showDetail;
const startingBalance: number = config.startingBalance ?? defaultConfig.startingBalance;
const bettingStrategy = config.bettingStrategy ?? defaultConfig.bettingStrategy;

console.log(`handsFile: ${config.handsFile}`);

console.log(`Simulating ${numHands} Craps Hand(s)`);
console.log(`Using betting strategy: ${bettingStrategy}`);
console.log(`Show detail: ${showDetail} // displayTables: ${config.displayTables}`);
console.log(`Starting balance: $${startingBalance}`);

let roll: () => number = rollD6;
let shootCount: number = 0;
let rollCount: number = 0;
// if the handsFile is provided and is valid json {d1: 1, d2: 2}, read the hands from the file and put them in a roll array
if (config.handsFile) {
  try {
    const fileContents = fs.readFileSync(config.handsFile, 'utf8');
    const parsedRolls = JSON.parse(fileContents);
    if (Array.isArray(parsedRolls) && parsedRolls.every(roll =>
      typeof roll === 'object' &&
      typeof roll.d1 === 'number' &&
      typeof roll.d2 === 'number'
    )) {
      // if the file loaded successfully, set the rolls for the roller function
      numHands = 1;
      roll = () => {
        if (shootCount >= parsedRolls.length) {
          console.log(`[roller] shootCount: ${shootCount} >= rolls.length: ${parsedRolls.length}`)
          return rollD6();
        }
        if (parsedRolls.length > 0) {
          if (rollCount % 2 === 0) {
            rollCount++;
            return parsedRolls[shootCount].d1;
          }
          rollCount++;
          return parsedRolls[shootCount++].d2;
        }
        return rollD6();
      }
      console.log(`[rolls] loaded ${parsedRolls.length} rolls from ${config.handsFile}`);
      console.log(`[rolls] ${JSON.stringify(parsedRolls)}`);
    } else {
      throw new Error('Invalid roll format - each roll must have d1 and d2 numbers');
    }
  } catch (err) {
    console.error('Error reading rolls file:', err);
    process.exit(1);
  }
}

const sessionSummary = new Summary();
sessionSummary.balance = startingBalance;
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
  let hand: {
    summary: Summary,
    balance: number,
    history: Result[]
  }

  hand = playHand(rules, config.bettingStrategy, roll, { displayTables: config.displayTables })

  hand.summary = new Summary()

  sessionSummary.balance += hand.balance
  hand.summary.balance = hand.balance


  hand.history.reduce((memo: Summary, roll: Result) => {
    memo.rollCount++
    hand.summary.rollCount++
    const distObj = memo.dist?.get(roll.diceSum)
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

const gor = (s: number | undefined, len: number, sfx: string = ""): string => {
  if (s === undefined) {
    return " ".padStart(len + sfx.length);
  }
  const sumColor = s > 0 ? chalk.green : chalk.red
  return sumColor((s.toString() + sfx).padStart(len));
}
const psCt = (s: number, len: number) => s.toString().padStart(len)

console.log('\nDice Roll Distribution')
console.log(`┌─────┬───────┬──────────┬────────┬────────┐`);
console.log(`│ Key │ Count │ Expected │ Diff   │ Diff % │`);
console.log(`├─────┼───────┼──────────┼────────┼────────┤`);
for (const [key, value] of sessionSummary.dist.entries()) {
  const keyStr = key.toString().padStart(3);
  const countStr = value.ct.toString().padStart(5);
  const expectedStr = value.ref?.toString().padStart(8);
  const diffStr = gor(value.diff, 6);
  const diffPctStr = gor(value.diff_pct, 6, "%");
  console.log(`│ ${keyStr} | ${countStr} │ ${expectedStr} │ ${diffStr} │ ${diffPctStr} │`);
}
console.log(`└─────┴───────┴──────────┴────────┴────────┘`);
delete sessionSummary.dist

console.log('\nSession Summary')
console.log(`┌───────────────────┬──────────┐`);
console.log(`│ Key               │ Values   │`);
console.log(`├───────────────────┼──────────┤`);
console.log(`│ Starting balance: │ $${psCt(startingBalance, 7)} │`)
let balanceStr = sessionSummary.balance > startingBalance ? chalk.green(psCt(sessionSummary.balance, 7)) : chalk.red(psCt(sessionSummary.balance, 7))
console.log(`│ Balance:          │ $${balanceStr} │`)
console.log(`│ Roll Count:       │ ${psCt(sessionSummary.rollCount, 8)} │`)
console.log(`│ Points Set:       │ ${psCt(sessionSummary.pointsSet, 8)} │`)
console.log(`│ Points Won:       │ ${psCt(sessionSummary.pointsWon, 8)} │`)
console.log(`│ Come Out Wins:    │ ${psCt(sessionSummary.comeOutWins, 8)} │`)
console.log(`│ Come Out Losses:  │ ${psCt(sessionSummary.comeOutLosses, 8)} │`)
console.log(`│ Net Come Out Wins:│ ${psCt(sessionSummary.netComeOutWins, 8)} │`)
console.log(`│ Neutrals:         │ ${psCt(sessionSummary.neutrals, 8)} │`)
console.log(`│ Hand Count:       │ ${psCt(sessionSummary.handCount, 8)} │`)
console.log(`└───────────────────┴──────────┘`);

if (showDetail) {
  const pr = (s: string): string => s.padEnd(19);
  const pd = (s: string): string => s.padStart(6);


  let row = 0
  let handCount = 0
  const handsPerRow = 15
  while (row <= hands.length / handsPerRow && handCount < hands.length) {
    let handsSummary = []
    //───────┬───────┬───────┬───────┬───────┐
    //───────┴───────┴───────┴───────┴───────┘
    handsSummary.push('┌─────────────────────');
    handsSummary.push('│ ' + pr('HAND'));
    handsSummary.push('│ ' + pr('Balance:'));
    handsSummary.push('│ ' + pr('Roll Count:'));
    handsSummary.push('│ ' + pr('Points Set:'));
    handsSummary.push('│ ' + pr('Points Won:'));
    handsSummary.push('│ ' + pr('Come Out Wins:'));
    handsSummary.push('│ ' + pr('Come Out Losses:'));
    handsSummary.push('│ ' + pr('Net Come Out Wins:'));
    handsSummary.push('│ ' + pr('Neutrals:'));
    handsSummary.push('└─────────────────────');
    for (let i = 0; i < handsPerRow && handCount < hands.length; i++) {
      const hand = hands[handCount++]
      delete hand.summary.dist
      handsSummary[0] += '┬───────'
      handsSummary[1] += ' │' + pd(handCount.toString());
      handsSummary[2] += ' │' + pd('$' + hand.summary.balance.toString());
      handsSummary[3] += ' │' + pd(hand.summary.rollCount.toString());
      handsSummary[4] += ' │' + pd(hand.summary.pointsSet.toString());
      handsSummary[5] += ' │' + pd(hand.summary.pointsWon.toString());
      handsSummary[6] += ' │' + pd(hand.summary.comeOutWins.toString());
      handsSummary[7] += ' │' + pd(hand.summary.comeOutLosses.toString());
      handsSummary[8] += ' │' + pd(hand.summary.netComeOutWins.toString());
      handsSummary[9] += ' │' + pd(hand.summary.neutrals.toString());
      handsSummary[10] += '┴───────'
    }
    handsSummary[0] += '┐'
    handsSummary[1] += ' │'
    handsSummary[2] += ' │'
    handsSummary[3] += ' │'
    handsSummary[4] += ' │'
    handsSummary[5] += ' │'
    handsSummary[6] += ' │'
    handsSummary[7] += ' │'
    handsSummary[8] += ' │'
    handsSummary[9] += ' │'
    handsSummary[10] += '┘'

    for (let i = 0; i < handsSummary.length; i++) {
      console.log(handsSummary[i])
    }
    row += 1
  }
}

// if (showDetail) {
//   console.log('\nDetailed Hand History:');
//   hands.forEach((hand, handIndex) => {
//     console.log(`\nHand ${handIndex + 1} History:`);
//     hand.history.forEach((roll: Result, rollIndex: number) => {
//       console.log(`  Roll ${rollIndex + 1}:`);
//       console.log(`    Dice: ${roll.die1} + ${roll.die2} = ${roll.diceSum}`);
//       console.log(`    Result: ${roll.result}`);
//       console.log(`    Point: ${roll.point}`);
//       console.log(`    Come Out: ${roll.isComeOut}`);
//     });
//   });
// }
