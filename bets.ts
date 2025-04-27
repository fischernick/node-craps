import { BetPoint, Memo } from './consts';

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

    constructor() {
        // Initialize all enum values with default bets
        Object.values(BetPoint).forEach(value => {
            if (typeof value === 'number') {
                this[value] = { amount: 0, isContract: false, set: false };
            }
        });

        this.newBetSum = 0;
    }

    /**
     * Add a bet to the dictionary
     * @param betPoint The type of bet
     * @param amount The amount of the bet
     */
    addBet(betPoint: BetPoint, amount: number): void {
        this[betPoint] = { amount, isContract: false, set: true };
        this.newBetSum += amount;
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

    displayTable(): void {
        const pf = (value: BetPoint): string => {
            if (value === undefined) {
                return "     ";
            }
            const bet = this.getBet(value);
            if (bet === undefined) {
                return "     ";
            }
            return "$" + bet.amount.toString().padStart(4, ' ');
        }

        let table = '';
        table += `+-+------+------+------+------+------+------+------+\n`;
        table += `| |  DC  |   4  |   5  |   6  |   8  |   9  |  10  |\n`;
        table += `|B|      |      |      |      |      |      |      |\n`;
        table += `|O|      |      |      |      |      |      |      |\n`;
        table += `+-+------+------+------+------+------+------+------+\n`;
        table += `/ /     Field:           ||  COME:                 |\n`;
        table += `/ / Dont Pass:           ||  PASS LINE: ${pf(BetPoint.Pass)}      |\n`;
        table += `/ /   DP Odds:           ||    PL Odds: ${pf(BetPoint.PassOdds)}      |\n`;
        table += `\\================================================//\n`;
        console.log(table);
    }
}

/*
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