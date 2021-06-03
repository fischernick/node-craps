# node-craps

[![Github Workflow Status](https://github.com/tphummel/node-craps/actions/workflows/ci.yaml/badge.svg)](https://github.com/tphummel/node-craps/actions/workflows/ci.yaml)


🎲🎲 craps simulator 💵

## simulate a hand

```
node hand.js

┌─────────┬───────────┬──────┬──────┬─────────┬───────────────┬───────┐
│ (index) │ isComeOut │ die1 │ die2 │ diceSum │    result     │ point │
├─────────┼───────────┼──────┼──────┼─────────┼───────────────┼───────┤
│    0    │   true    │      │      │         │               │       │
│    1    │   false   │  2   │  4   │    6    │  'point set'  │   6   │
│    2    │   false   │  4   │  5   │    9    │   'neutral'   │   6   │
│    3    │   false   │  2   │  3   │    5    │   'neutral'   │   6   │
│    4    │   false   │  3   │  5   │    8    │   'neutral'   │   6   │
│    5    │   false   │  2   │  6   │    8    │   'neutral'   │   6   │
│    6    │   true    │  2   │  4   │    6    │  'point win'  │       │
│    7    │   false   │  3   │  5   │    8    │  'point set'  │   8   │
│    8    │   false   │  5   │  6   │   11    │   'neutral'   │   8   │
│    9    │   false   │  4   │  5   │    9    │   'neutral'   │   8   │
│   10    │   true    │  3   │  5   │    8    │  'point win'  │       │
│   11    │   false   │  2   │  4   │    6    │  'point set'  │   6   │
│   12    │   true    │  1   │  5   │    6    │  'point win'  │       │
│   13    │   true    │  2   │  5   │    7    │ 'comeout win' │       │
│   14    │   true    │  2   │  5   │    7    │ 'comeout win' │       │
│   15    │   false   │  3   │  6   │    9    │  'point set'  │   9   │
│   16    │   true    │  3   │  6   │    9    │  'point win'  │       │
│   17    │   false   │  4   │  6   │   10    │  'point set'  │  10   │
│   18    │   true    │  2   │  5   │    7    │  'seven out'  │       │
└─────────┴───────────┴──────┴──────┴─────────┴───────────────┴───────┘
```

## dev

```
git clone git@github.com:tphummel/node-craps.git
cd node-craps
npm i
npm t
```
