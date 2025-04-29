import { BetPoint, Memo, Point } from './consts.js';

export type Bet = {
    amount: number;
    payout?: number;
    isContract: boolean;
    set: boolean;
}

/**
 * Determines if a bet is a contract bet (Pass or Come)
 */
function isContractBet(betPoint: BetPoint): boolean {
    return betPoint === BetPoint.Pass || betPoint === BetPoint.Come;
}

/**
 * Class to manage a collection of bets
 */
export class BetDictionary {
    [key: number]: Bet;
    newBetSum: number;
    payoutSum?: Memo;
    // bag of keys for specific strategies
    notes: Record<string, string>;

    constructor() {
        // Initialize all enum values with default bets
        Object.values(BetPoint).forEach(value => {
            if (typeof value === 'number') {
                this[value] = { amount: 0, isContract: false, set: false };
            }
        });

        this.newBetSum = 0;
        this.notes = {};
    }

    /**
     * Copy the bet dictionary
     * @returns A copy of the bet dictionary
     */
    copy(): BetDictionary {
        const copy = new BetDictionary()
        copy.newBetSum = this.newBetSum
        copy.payoutSum = this.payoutSum
        Object.values(BetPoint).forEach(betPoint => {
            if (typeof betPoint === 'number') {
                copy[betPoint] = { amount: this[betPoint].amount, isContract: this[betPoint].isContract, set: this[betPoint].set };
            }
        })
        copy.notes = { ...this.notes };
        return copy
    }

    /**
     * Add a bet to the dictionary
     * @param betPoint The type of bet
     * @param amount The amount of the bet
     */
    addBet(betPoint: BetPoint, amount: number): void {
        if (amount === 0) {
            return;
        }
        this[betPoint] = { amount, isContract: false, set: true };
        this.newBetSum += amount;
    }

    /**
     * Add a bet to the dictionary
     * @param betPoint The type of bet
     * @param amount The amount of the bet
     */
    moveDCBet(betPoint: BetPoint): void {
        const bp = this[BetPoint.DontCome];
        if (bp.amount === 0) {
            return;
        }
        this[betPoint] = { amount: bp.amount, isContract: true, set: true };
        this[BetPoint.DontCome] = { amount: 0, isContract: false, set: false };
    }

    /**
     * Get a bet
     * @param betPoint The type of bet
     * @returns The bet, or undefined if no bet is set
     */
    getBet(betPoint: BetPoint): (Bet | undefined) {
        return this[betPoint]?.set ? this[betPoint] : undefined;
    }

    /**
     * Clear a bet
     * @param betPoint The type of bet to clear
     */
    clearBet(betPoint: BetPoint): void {
        if (process.env.DEBUG) console.log(`clearBet: ${BetPoint[betPoint].toString()}`);
        this[betPoint] = { amount: 0, isContract: false, set: false };
    }

    /**
     * Clear all bets
     */
    clearAllBets(): void {
        Object.values(BetPoint).forEach(value => {
            if (typeof value === 'number') {
                this.clearBet(value);
            }
        });
    }

    /**
     * Reset the bet sum
     */
    resetBetSum(): void {
        this.newBetSum = 0;
    }

    /** Set contract for a bet point */
    setContract(betPoints: BetPoint[], on: boolean): void {
        betPoints.forEach(betPoint => {
            this[betPoint] = {
                amount: this[betPoint].amount,
                isContract: true,
                set: this[betPoint].set
            };
        });
    }

    toString(): string {
        let str = 'Bets::\n'
        Object.values(BetPoint).forEach(value => {
            if (typeof value === 'number' && this[value].set) {
                str += ` ${BetPoint[value].toString()}: amt: ${this[value].amount}, ctrt: ${this[value].isContract}, set: ${this[value].set} \n`
            }
        })
        str += `newBetSum: ${this.newBetSum}, payoutSum: ${this.payoutSum}\n`
        return str
    }

}

/* ideas
const CRAPS_TABLE_ASCII = `
    Don't Pass Bar -------|  Field  |-------- Don't Come Bar
    [===========================================]
    |                 COME                      |
    |------------------------------------------|
    |         4    5    6    8    9   10       |
    |        [4]  [5]  [6]  [8]  [9]  [10]    |
    |------------------------------------------|
    |                 PASS LINE                 |
    [===========================================]
    |              PLAYER POSITION              |
`;

+-+-----+------+------+------+------+------+------+
| | DC  |   4  |   5  |   6  |   8  |   9  |  10  |
|P|     |      |      |      |      |      |      |
|O|     |      |      |      |      |      |      |
+-+-----+------+------+------+------+------+------+
/ /     Field:        |||  COME:                  |
/ / Dont Pass:        |||  PASS LINE:             |
/ /   DP Odds:        |||    PL Odds:             |
\\===============================================//
*/