import { test } from "tap";
import { buildHeaderLine, dontComeBetsLine } from "../src/display.ts";
import { BetPoint, Point } from "../src/consts.ts";
import { BetDictionary } from "../src/bets.ts";

test("build header line", (suite) => {
  suite.test("Point.UNDEF", (t) => {
    const headerLine = buildHeaderLine(Point.UNDEF);
    t.equal(
      headerLine,
      " \x1b[93m*\x1b[39mDC  ┃   4  ┃   5  ┃   6  ┃   8  ┃   9  ┃  10  ┃",
    );
    t.end();
  });

  suite.test("Point.OFF", (t) => {
    const headerLine = buildHeaderLine(Point.OFF);
    t.equal(
      headerLine,
      " \x1b[93m*\x1b[39mDC  ┃   4  ┃   5  ┃   6  ┃   8  ┃   9  ┃  10  ┃",
    );
    t.end();
  });

  suite.test("Point.FOUR", (t) => {
    const headerLine = buildHeaderLine(Point.FOUR);
    t.equal(
      headerLine,
      "  DC  ┃ \x1b[93m*\x1b[39m 4  ┃   5  ┃   6  ┃   8  ┃   9  ┃  10  ┃",
    );
    t.end();
  });

  suite.test("Point.FIVE", (t) => {
    const headerLine = buildHeaderLine(Point.FIVE);
    t.equal(
      headerLine,
      "  DC  ┃   4  ┃ \x1b[93m*\x1b[39m 5  ┃   6  ┃   8  ┃   9  ┃  10  ┃",
    );
    t.end();
  });

  suite.test("Point.SIX", (t) => {
    const headerLine = buildHeaderLine(Point.SIX);
    t.equal(
      headerLine,
      "  DC  ┃   4  ┃   5  ┃ \x1b[93m*\x1b[39m 6  ┃   8  ┃   9  ┃  10  ┃",
    );
    t.end();
  });

  suite.test("Point.EIGHT", (t) => {
    const headerLine = buildHeaderLine(Point.EIGHT);
    t.equal(
      headerLine,
      "  DC  ┃   4  ┃   5  ┃   6  ┃ \x1b[93m*\x1b[39m 8  ┃   9  ┃  10  ┃",
    );
    t.end();
  });

  suite.test("Point.NINE", (t) => {
    const headerLine = buildHeaderLine(Point.NINE);
    t.equal(
      headerLine,
      "  DC  ┃   4  ┃   5  ┃   6  ┃   8  ┃ \x1b[93m*\x1b[39m 9  ┃  10  ┃",
    );
    t.end();
  });

  suite.test("Point.TEN", (t) => {
    const headerLine = buildHeaderLine(Point.TEN);
    t.equal(
      headerLine,
      "  DC  ┃   4  ┃   5  ┃   6  ┃   8  ┃   9  ┃ \x1b[93m*\x1b[39m10  ┃",
    );
    t.end();
  });

  suite.end();
});
//\x1b[32m1000\x1b[39m
test("dontComeBetsLine", (suite) => {
  const chalkInverse = { start: "\x1b[7m", end: "\x1b[27m" };
  suite.test("empty", (t) => {
    const bets = new BetDictionary();
    const result = dontComeBetsLine(bets);
    t.equal(result, "      ┃      ┃      ┃      ┃      ┃      ┃      ┃");
    t.end();
  });

  suite.test("with 3 digit bets", (t) => {
    const bets = new BetDictionary();
    bets.addBet(BetPoint.DontComePoint4, 100);
    const result = dontComeBetsLine(bets);
    t.equal(
      result,
      `      ┃${chalkInverse.start}  100${chalkInverse.end} ┃      ┃      ┃      ┃      ┃      ┃`,
    );
    t.end();
  });

  suite.test("with 4 digit bets", (t) => {
    const bets = new BetDictionary();
    bets.addBet(BetPoint.DontComePoint4, 1000);
    const result = dontComeBetsLine(bets);
    t.equal(
      result,
      `      ┃${chalkInverse.start} 1000${chalkInverse.end} ┃      ┃      ┃      ┃      ┃      ┃`,
    );
    t.end();
  });

  suite.test("with 3 DC digit bets", (t) => {
    const bets = new BetDictionary();
    bets.addBet(BetPoint.DontCome, 100);
    const result = dontComeBetsLine(bets);
    t.equal(
      result,
      `${chalkInverse.start}  100${chalkInverse.end} ┃      ┃      ┃      ┃      ┃      ┃      ┃`,
    );
    t.end();
  });
  suite.end();
});
