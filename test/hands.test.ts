import { test } from "tap";
import { buildHandsSummary } from "../src/hands.js";
import { Summary } from "../src/consts.js";

test("buildHandsSummary", function (t) {
  // Test case 1: Single hand
  const singleHand = [
    {
      history: [],
      balance: 100,
      summary: {
        balance: 100,
        rollCount: 5,
        pointsSet: 2,
        pointsWon: 1,
        comeOutWins: 1,
        comeOutLosses: 0,
        netComeOutWins: 1,
        neutrals: 1,
      } as Summary,
    },
  ];

  const singleHandResult = buildHandsSummary(singleHand, 0, 1);
  t.equal(
    singleHandResult.length,
    11,
    "should return 11 lines for the summary table",
  );
  t.match(
    singleHandResult[0],
    /┌─────────────────────┬───────┐/,
    "should have correct top border",
  );
  t.match(singleHandResult[1], /│ HAND.*│ +1 │/, "should show hand number");
  t.match(singleHandResult[2], /│ Balance:.*│ +\$100 │/, "should show balance");
  t.match(
    singleHandResult[3],
    /│ Roll Count:.*│ +5 │/,
    "should show roll count",
  );
  t.match(
    singleHandResult[10],
    /└─────────────────────┴───────┘/,
    "should have correct bottom border",
  );

  // Test case 2: Multiple hands
  const multipleHands = [
    {
      history: [],
      balance: 100,
      summary: {
        balance: 100,
        rollCount: 5,
        pointsSet: 2,
        pointsWon: 1,
        comeOutWins: 1,
        comeOutLosses: 0,
        netComeOutWins: 1,
        neutrals: 1,
      } as Summary,
    },
    {
      history: [],
      balance: 150,
      summary: {
        balance: 150,
        rollCount: 7,
        pointsSet: 3,
        pointsWon: 2,
        comeOutWins: 2,
        comeOutLosses: 1,
        netComeOutWins: 1,
        neutrals: 2,
      } as Summary,
    },
  ];

  const multipleHandsResult = buildHandsSummary(multipleHands, 0, 2);
  t.equal(
    multipleHandsResult.length,
    11,
    "should return 11 lines for multiple hands",
  );
  t.match(
    multipleHandsResult[0],
    /┌─────────────────────┬───────┬───────┐/,
    "should have correct top border for multiple columns",
  );
  t.match(
    multipleHandsResult[1],
    /│ HAND.*│ +1.*│ +2/,
    "should show multiple hand numbers",
  );
  t.match(
    multipleHandsResult[2],
    /│ Balance:.*│ +\$100.*│ +\$150/,
    "should show multiple balances",
  );
  t.match(
    multipleHandsResult[10],
    /└─────────────────────┴───────┴───────┘/,
    "should have correct bottom border for multiple columns",
  );

  // Test case 3: Partial row
  const partialRowResult = buildHandsSummary(multipleHands, 1, 2);
  t.equal(
    partialRowResult.length,
    11,
    "should return 11 lines for partial row",
  );
  t.match(
    partialRowResult[0],
    /┌─────────────────────┬───────┐/,
    "should have correct top border for partial row",
  );
  t.match(
    partialRowResult[1],
    /│ HAND.*│ +2/,
    "should show correct hand number for partial row",
  );
  t.match(
    partialRowResult[2],
    /│ Balance:.*│ +\$150/,
    "should show correct balance for partial row",
  );
  t.match(
    partialRowResult[10],
    /└─────────────────────┴───────┘/,
    "should have correct bottom border for partial row",
  );

  t.end();
});
