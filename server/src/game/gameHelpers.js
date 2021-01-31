
const GAME_STATES = {
  LOBBY: 'LOBBY', // after here we will set spies and game code, introduce the rules
  ROUND_VOTE: 'ROUND_VOTE', // vote on which room to go into
  ROUND_TURN_KEY: 'ROUND_TURN_KEY', // vote on which key to turn
  ROUND_ENTER_CODE: 'ROUND_ENTER_CODE', // enter a code into the game
  // no round game over, just move them to a gameover slide -> credits -> play again prompt -> lobby
};

const PLAYERS_PER_GAME = 8;
const SPIES_PER_GAME = 3;
const CODE_LENGTH = 5;
const TOTAL_ROUNDS = 5;
const CHARSET = 'BCDFGHJKLMNPQRSTVWXYZ'; // no vowels

const makeRandomArray = (length, range) => {
  var arr = [];
  while (arr.length < length) {
    let c = Math.floor(Math.random() * range);
    if (arr.indexOf(c) === -1) arr.push(c);
  }
  return arr;
}

const makeCode = (codeLength, charset = CHARSET) => {
  const arr = makeRandomArray(codeLength, charset.length);
  return arr.map(c => charset[c]).join('');
}

const makeFakeCode = (realCode) => {
  const fakeCharset = CHARSET.split(realCode).join('')
  return makeCode(realCode.length, fakeCharset);
}

export {
  GAME_STATES,
  PLAYERS_PER_GAME,
  SPIES_PER_GAME,
  CODE_LENGTH,
  TOTAL_ROUNDS,
  makeCode,
  makeFakeCode,
  makeRandomArray
};