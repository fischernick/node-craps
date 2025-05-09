import chalk from "chalk";
import { Point, BetPoint, Payout } from "./consts.js";
import { BetDictionary } from "./bets.js";
import { Result } from "./consts.js";

export function buildHeaderLine(point: Point): string {
  let headerLine = "";
  const points = ["DC", "4", "5", "6", "8", "9", "10"];
  const pointValues = [
    Point.OFF,
    Point.FOUR,
    Point.FIVE,
    Point.SIX,
    Point.EIGHT,
    Point.NINE,
    Point.TEN,
  ];

  points.forEach((p, i) => {
    const isPoint =
      point === pointValues[i] || (i === 0 && point === Point.OFF);
    const pointText = p.padStart(2, " ");
    headerLine += isPoint
      ? ` ${chalk.yellowBright("*")}${pointText}  ┃`
      : `  ${pointText}  ┃`;
  });

  return headerLine;
}

export function dontComeBetsLine(bets: BetDictionary): string {
  let tots = "";
  const dcPoints = [
    BetPoint.DontCome,
    BetPoint.DontComePoint4,
    BetPoint.DontComePoint5,
    BetPoint.DontComePoint6,
    BetPoint.DontComePoint8,
    BetPoint.DontComePoint9,
    BetPoint.DontComePoint10,
  ];

  tots += dcPoints.reduce((acc, p) => {
    const betString: string = bets.getBet(p)
      ? `${chalk.inverse(bets.getBet(p)?.amount.toString().padStart(5))}`
      : "".padStart(5);
    return acc + `${betString} ┃`;
  }, "");
  return tots;
}

export function placeBetsLine(bets: BetDictionary): string {
  let tots = `      ┃`;
  const placeBetPoints = [
    BetPoint.Place4,
    BetPoint.Place5,
    BetPoint.Place6,
    BetPoint.Place8,
    BetPoint.Place9,
    BetPoint.Place10,
  ];
  tots += placeBetPoints.reduce((acc, p) => {
    const bet = bets.getBet(p);
    const amount: string = bet?.amount.toString() ?? "";
    return acc + `${chalk.green(amount.padStart(5, " "))} ┃`;
  }, "");
  return tots;
}

export function displayTable(
  preRoll: boolean,
  bets: BetDictionary,
  point: Point,
  balance: number,
  result?: Result,
  newPayouts?: Payout[],
): void {
  const pf = (value: BetPoint): string => {
    if (value === undefined) {
      return "     ";
    }
    const bet = bets.getBet(value);
    if (bet === undefined) {
      return "     ";
    }
    return "$" + bet.amount.toString().padStart(4, " ");
  };

  let balanceLine = `Balance: ${balance.toString().padStart(4, " ")}`;
  if (!preRoll) {
    const payoutSum = bets.payoutSum?.total ?? 0;
    const payoutColor = payoutSum > 0 ? chalk.greenBright : chalk.redBright;
    const sumColor = balance + payoutSum > 0 ? chalk.green : chalk.red;
    balanceLine += ` + ${payoutColor(`${payoutSum}`)} = ${sumColor(`${balance + payoutSum}`)}`;
  }

  const tableHeight = 7;
  const rollLine = preRoll
    ? ""
    : `Roll: ${result?.die1}+${result?.die2}> ${result?.diceSum} => ${result?.result}`;
  let payoutLine: string[] = [];
  if (newPayouts && newPayouts.length > 0) {
    if (newPayouts.length <= tableHeight) {
      payoutLine = newPayouts.map(
        (p) =>
          `${p.type}: ${p.principal} + ${p.profit} = ${p.principal + p.profit}`,
      );
    } else {
      const reducedPayouts = newPayouts.reduce(
        (acc, p) => {
          acc.principal += p.principal;
          acc.profit += p.profit;
          acc.total += p.principal + p.profit;
          return acc;
        },
        {
          principal: 0,
          profit: 0,
          total: 0,
        },
      );

      payoutLine = [
        `${newPayouts.length} payouts`,
        `${reducedPayouts.principal} + ${reducedPayouts.profit} = ${reducedPayouts.total}`,
      ];
    }
  }

  let table = "";
  table +=
    (preRoll
      ? "    EXISTING BETS  BEFORE ROLL "
      : "    ROLL RESULTS AND BETS SETTLED") + "\n";
  table += `┏━━┳━━━━━━┳━━━━━━┳━━━━━━┳━━━━━━┳━━━━━━┳━━━━━━┳━━━━━━┓\n`;
  table += `┃  ┃` + buildHeaderLine(point) + `    ${rollLine}\n`;
  table += `┃DC┃${dontComeBetsLine(bets)} ${payoutLine[0] ? payoutLine[0] : ""}\n`;
  table += `┃dO┃  n/a ┃      ┃      ┃      ┃      ┃      ┃      ┃ ${payoutLine[1] ? payoutLine[1] : ""}\n`;
  table += `┃PB┃${placeBetsLine(bets)} ${payoutLine[2] ? payoutLine[2] : ""}\n`;
  table += `┃ O┃      ┃      ┃      ┃      ┃      ┃      ┃      ┃ ${payoutLine[3] ? payoutLine[3] : ""}\n`;
  table += `┡━━╇━━━━━━┻━━━━━━┻━━━━━━╬━━━━━━┻━━━━━━┻━━━━━━┻━━━━━━┩ ${payoutLine[4] ? payoutLine[4] : ""}\n`;
  table += `│  ┇     Field:         ║      COME:                │ ${payoutLine[5] ? payoutLine[5] : ""}\n`;
  table += `│  ┇ Dont Pass:         ║ PASS LINE: ${pf(BetPoint.Pass)}          │ ${payoutLine[6] ? payoutLine[6] : ""}\n`;
  table += `│  ┇   DP Odds:         ║   PL Odds: ${pf(BetPoint.PassOdds)}          │ ${balanceLine}\n`;
  table += `╘══╧════════════════════╩═══════════════════════════╛\n`;

  console.log(table);
}
