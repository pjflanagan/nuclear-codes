
import {
  POLL,
  MAX_PLAYERS_PER_GAME,
  TOTAL_ROUNDS,
  makeCode,
  makeFakeCode,
} from './gameHelpers.js';
import {
  RoundLobbyHandlers,
  RoundChooseRoomHandlers,
  RoundEnterCodeHandlers
} from './gameRound.js';
import { PlayerList } from './playerModel.js';

class GameRoom {
  constructor(socketServer, roomName) {
    this.socketServer = socketServer;
    this.name = roomName;

    // pass in handlers here, these can be replaced in a test
    this.handlers = {
      lobby: RoundLobbyHandlers,
      room: RoundChooseRoomHandlers,
      code: RoundEnterCodeHandlers
    };

    // game state
    this.players = new PlayerList();
    this.poll = POLL.LOBBY;
    this.round = 0;
    this.codeLength = 0;
    this.code = "";
    this.fakeCode = "";

    this.setupGame = this.setupGame.bind(this);
    this.moveGameState = this.moveGameState.bind(this);
  }

  // ADMIN

  joinRoom(socket) {
    this.players.addPlayer(socket);
    this.updateGameState();
    this.socketServer.nextSlide(socket.id, {
      slideID: 'name-prompt'
    });
  }

  disconnect(socket) {
    // TODO: removing a player should not mean removing them from the list
    // it needs to instead make the player a ghost and wait for someone
    // else to take over it's body
    const player = this.players.removePlayer(socket);
    // update the game state so people know they left
    this.updateGameState();
    // we won't move the gamestate if a player leaves, we need them to rejoin
    return player;
  }

  setPlayerName(socket, playerName) {
    const playerSetName = this.players.setPlayerName(socket, playerName);
    // this is why gamestate and slide need to be separate
    // players waiting for other people to update just need gamestate updates
    this.updateGameState();
    this.socketServer.nextSlide(socket.id, {
      slideID: 'welcome-agent', data: {
        playerName: playerSetName,
        roomName: this.name
      }
    });
  }

  // GAMEPLAY

  // make a game with spies, agents
  setupGame() {
    // set a new group of players to be spies
    this.players.setSpies();

    // reset the rounds and round data
    this.round = 0;
    this.setupRound();
  }

  setupRound() {
    // change the code length if someone drops
    this.codeLength = this.players.getAgentCount();
    // make a code and a fake code that share no letters
    this.code = makeCode(this.codeLength);
    this.fakeCode = makeFakeCode(this.code);

    this.updateGameState();
  }

  // players respond to polls and the data gets recorded here
  pollResponse(socket, response) {
    const player = this.players.findPlayer(socket);

    // if a player responds to a poll we are not polling, then ignore
    if (response.type !== this.poll) {
      console.error(`GameRoom.pollResponse: Not currently polling for '${response.type}', poll is ${this.poll}.`);
      return;
    }

    switch (response.type) {
      case POLL.LOBBY:
      case POLL.ROUND_CHOOSE_ROOM:
      case POLL.ROUND_ENTER_CODE:
        // just record the response they give here
        // this would be a good place for some error checking about response shape
        player.recordResponse(response.data);
        break;
      // if we ever have a response that might need prevention, like room limitations used to, would go here ina handler
      default:
        console.error(`gameRoom.pollResponse: Response for poll '${response.type}' not recoginzed.`);
        return;
    }

    this.updateGameState();
    this.moveIfPollOver();
  }

  // simple function for moving the gamestate if the poll is over
  // and moving any data over with it
  moveIfPollOver() {
    const [isPollOver, data] = this.isPollOver();
    if (isPollOver) {
      this.moveGameState(data);
    }
  }

  // check if the poll is over
  isPollOver() {
    switch (this.poll) {
      case POLL.LOBBY:
        return this.handlers.lobby.isPollOver(this.players)

      // if they are voting for rooms
      case POLL.ROUND_CHOOSE_ROOM:
        return this.handlers.room.isPollOver(this.codeLength, this.players);

      // if they are entering codes, make sure they all have responded
      case POLL.ROUND_ENTER_CODE:
        return this.handlers.code.isPollOver(this.players);

      // otherwise something is wrong with the gamestate
      default:
        console.error(`gameRoom.isPollOver: poll '${this.poll}' not accounted for in isPollOver.`);
        return false
    }
  }

  // move the gamestate forward, this happens when we are done a poll
  moveGameState(data) {
    this.clearResponses();
    switch (this.poll) {
      // if we are all ready
      case POLL.LOBBY:
        this.poll = POLL.ROUND_CHOOSE_ROOM;
        this.setupGame();
        // update the game state, it will name the spies
        this.socketServer.nextSlide(this.name, {
          slideID: 'introduction' // leads to vote
        });
        this.updateGameState();
        break;

      // if we have all picked rooms
      case POLL.ROUND_CHOOSE_ROOM:
        this.poll = POLL.ROUND_ENTER_CODE;
        const { rooms } = data;
        this.handlers.room.moveGameState({
          rooms,
          socketServer: this.socketServer,
          code: this.code,
          fakeCode: this.fakeCode
        });
        this.updateGameState();
        break;

      // if we just entered codes
      case POLL.ROUND_ENTER_CODE:
        this.round += 1;
        const { guessedCode, charsCorrect } = this.handlers.code.moveGameState({
          codeResponses: data.codeResponses,
          code: this.code
        });

        // if they are correct: ROUND_LOBBY, 'victory'
        if (charsCorrect === this.code.length) {
          this.poll = POLL.LOBBY;
          this.socketServer.nextSlide(this.name, {
            slideID: 'gameover', data: {
              result: 'victory',
              code: this.code,
              spies: this.players.getSpies()
            }
          });
          this.updateGameState(); // increment the rounds and clear responses
          return;
        }
        // if they are wrong and it is round 5: ROUND_LOBBY, 'gameover'
        if (this.round === TOTAL_ROUNDS) {
          this.poll = POLL.LOBBY;
          this.socketServer.nextSlide(this.name, {
            slideID: 'gameover', data: {
              result: 'defeat',
              code: this.code,
              spies: this.players.getSpies()
            }
          });
          this.updateGameState(); // increment the rounds and clear responses
          return;
        }
        // otherwise: ROUND_CHOOSE_ROOM, 'start-next-round'
        this.setupRound();
        this.poll = POLL.ROUND_CHOOSE_ROOM;
        this.socketServer.nextSlide(this.name, {
          slideID: 'start-next-round', data: { guessedCode, charsCorrect }
        });
        this.updateGameState(); // increment the rounds and clear responses
        break;

      default:
        console.error(`gameRoom.moveGameState: poll '${this.poll}' not accounted for in moveGameState.`);
        break;
    }
  }

  // HELPERS

  updateGameState() {
    this.socketServer.updateGameState(this.name, this.getState());
  }

  getState() {
    return {
      codeLength: this.codeLength,
      players: this.players.getPlayersAsData(),
      code: this.code,
      fakeCode: this.fakeCode,
      round: this.round,
      poll: this.poll
    };
  }

  clearResponses() {
    this.players.clearResponses();
  }

  isStarted() {
    return this.poll !== POLL.LOBBY;
  }

  isFull() {
    return this.players.count() >= MAX_PLAYERS_PER_GAME;
  }

  isEmpty() {
    return this.players.count() === 0;
  }
}

export { GameRoom };