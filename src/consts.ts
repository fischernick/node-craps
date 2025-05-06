import { BetDictionary } from "./bets.ts";

enum DieResult {
    UNDEF = -1,
    ONE = 1,
    TWO = 2,
    THREE = 3,
    FOUR = 4,
    FIVE = 5,
    SIX = 6,
}

enum DiceResult {
    UNDEF = -1,
    TWO = 2,
    THREE = 3,
    FOUR = 4,
    FIVE = 5,
    SIX = 6,
    SEVEN = 7,
    EIGHT = 8,
    NINE = 9,
    TEN = 10,
    ELEVEN = 11,
    TWELVE = 12
}

enum Point {
    UNDEF = -1,
    OFF = 0,
    FOUR = 4,
    FIVE = 5,
    SIX = 6,
    EIGHT = 8,
    NINE = 9,
    TEN = 10,
}

export function diceResultAsPoint(diceResult: DiceResult) {
    switch (diceResult) {
        case DiceResult.FOUR:
            return Point.FOUR;
        case DiceResult.FIVE:
            return Point.FIVE;
        case DiceResult.SIX:
            return Point.SIX;
        case DiceResult.EIGHT:
            return Point.EIGHT;
        case DiceResult.NINE:
            return Point.NINE;
        case DiceResult.TEN:
            return Point.TEN;
        default:
            return Point.OFF;
    }
}

type Result = {
    die1: DieResult;
    die2: DieResult;
    diceSum: DiceResult;
    result?: HandResult;
    isComeOut?: boolean;
    point: Point;
}
/**
 * Represents a payout for a bet
 */
type Payout = {
    type: HandResult | string;
    principal: number;
    profit: number;
}
enum HandResult {
    NEW_GAME = 'new game',
    COMEOUT_LOSS = 'comeout loss',
    COMEOUT_WIN = 'comeout win',
    POINT_SET = 'point set',
    POINT_WIN = 'point win',
    NEUTRAL = 'neutral',
    SEVEN_OUT = 'seven out',
}

enum BetPoint {
    Pass = 0,
    PassOdds = 1,
    Come = 2,
    ComeOdds = 3,
    DontPass = 4,
    DontPassOdds = 5,
    DontCome = 6,
    DontComeOdds = 7,
    Place4 = 8,
    Place5 = 9,
    Place6 = 10,
    Place8 = 11,
    Place9 = 12,
    Place10 = 13,
    DontComePoint4 = 14,
    DontComePoint5 = 15,
    DontComePoint6 = 16,
    DontComePoint8 = 17,
    DontComePoint9 = 18,
    DontComePoint10 = 19,
}

const DontComeBetPoints = [BetPoint.DontComePoint4, BetPoint.DontComePoint5, BetPoint.DontComePoint6, BetPoint.DontComePoint8, BetPoint.DontComePoint9, BetPoint.DontComePoint10]
const PlaceBetPoints = [BetPoint.Place4, BetPoint.Place5, BetPoint.Place6, BetPoint.Place8, BetPoint.Place9, BetPoint.Place10]

// define function to get place bet point from dice sum
export function getPlaceBetPoint(diceSum: DiceResult): BetPoint | undefined {
    switch (diceSum) {
        case DiceResult.FOUR:
            return BetPoint.Place4;
        case DiceResult.FIVE:
            return BetPoint.Place5;
        case DiceResult.SIX:
            return BetPoint.Place6;
        case DiceResult.EIGHT:
            return BetPoint.Place8;
        case DiceResult.NINE:
            return BetPoint.Place9;
        case DiceResult.TEN:
            return BetPoint.Place10;
        default:
            return undefined;
    }
}


type PayoutMap = Partial<Record<DiceResult, number>>;

const passOddsPayouts: PayoutMap = {
    [DiceResult.FOUR]: 2,
    [DiceResult.FIVE]: 3 / 2,
    [DiceResult.SIX]: 6 / 5,
    [DiceResult.EIGHT]: 6 / 5,
    [DiceResult.NINE]: 3 / 2,
    [DiceResult.TEN]: 2
};

const passPayouts: PayoutMap = {
    [DiceResult.FOUR]: 1,
    [DiceResult.FIVE]: 1,
    [DiceResult.SIX]: 1,
    [DiceResult.EIGHT]: 1,
    [DiceResult.NINE]: 1,
    [DiceResult.TEN]: 1,
}

const dontComePayouts: PayoutMap = {
    [DiceResult.TWO]: 1,
    [DiceResult.THREE]: 1,
    [DiceResult.SEVEN]: 1,
    [DiceResult.ELEVEN]: 1,
    [DiceResult.FOUR]: 1,
    [DiceResult.FIVE]: 1,
    [DiceResult.SIX]: 1,
    [DiceResult.EIGHT]: 1,
    [DiceResult.NINE]: 1,
    [DiceResult.TEN]: 1,
}

const dontComeOddsPayouts: PayoutMap = {
    [DiceResult.FOUR]: 2,
    [DiceResult.FIVE]: 3 / 2,
    [DiceResult.SIX]: 6 / 5,
    [DiceResult.EIGHT]: 6 / 5,
    [DiceResult.NINE]: 3 / 2,
    [DiceResult.TEN]: 2,
}

const placePayouts: PayoutMap = {
    [DiceResult.FOUR]: 9 / 5,
    [DiceResult.FIVE]: 7 / 5,
    [DiceResult.SIX]: 7 / 6,
    [DiceResult.EIGHT]: 7 / 6,
    [DiceResult.NINE]: 7 / 5,
    [DiceResult.TEN]: 9 / 5,
}

const BetPointPayouts: Partial<Record<BetPoint, PayoutMap>> = {
    [BetPoint.Pass]: passPayouts,
    [BetPoint.PassOdds]: passOddsPayouts,
    //[BetPoint.Come]: passOddsPayouts,
    //[BetPoint.ComeOdds]: passOddsPayouts,
    //[BetPoint.DontPass]: passOddsPayouts,
    //[BetPoint.DontPassOdds]: passOddsPayouts,
    [BetPoint.DontCome]: dontComePayouts,
    [BetPoint.DontComeOdds]: dontComeOddsPayouts,
    [BetPoint.Place4]: placePayouts,
    [BetPoint.Place5]: placePayouts,
    [BetPoint.Place6]: placePayouts,
    [BetPoint.Place8]: placePayouts,
    [BetPoint.Place9]: placePayouts,
    [BetPoint.Place10]: placePayouts,
};

interface Rules {
    minBet: number;
    maxOddsMultiple: Record<Point, number>;
}


class Summary {
    principal: number = 0;
    profit: number = 0;
    balance: number;
    total: number = 0;
    //ledger: Result[] = [];
    rollCount: number = 0;
    pointsSet: number = 0;
    pointsWon: number = 0;
    comeOutWins: number = 0;
    comeOutLosses: number = 0;
    netComeOutWins: number = 0;
    neutrals: number;
    handCount: number;
    dist?: Map<DiceResult, distObj>;

    constructor() {
        this.balance = 0;
        this.rollCount = 0;
        this.pointsSet = 0;
        this.pointsWon = 0;
        this.comeOutWins = 0;
        this.comeOutLosses = 0;
        this.netComeOutWins = 0;
        this.neutrals = 0;
        this.handCount = 0;
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

class distObj {
    ct: number;
    prob: number;
    ref?: number;
    diff?: number;
    diff_pct?: number;
    ref_work?: string;
    constructor(count: number, probability: number) {
        this.ct = count;
        this.prob = probability
    }
}

export {
    HandResult,
    DiceResult,
    BetPoint,
    Result,
    BetPointPayouts,
    Point,
    DieResult,
    distObj,
    Rules,
    DontComeBetPoints,
    PlaceBetPoints,
    Summary, Payout
}
