
import { GameRoom } from "./game/index.js";

// https://socket.io/docs/emit-cheatsheet/

class ServerSocket {
  constructor(io) {
    this.io = io;
    this.gameRooms = [];
    this.roomAssignments = [];

    this.setup = this.setup.bind(this);
    this.setup();
  }

  setup() {
    this.io.on('connection', (socket) => {
      this.connection(socket);
      socket.on('JOIN_ROOM', (data) => this.joinRoom(socket, data));
      socket.on('SET_PLAYER_NAME', (data) => this.shareName(socket, data));
      socket.on('POLL_RESPONSE', (response) => this.pollResponse(socket, response));
      socket.on('disconnect', () => this.disconnect(socket));
    });
  }

  // ADMIN

  connection(socket) {
    console.info('connection:', socket.id);
  }

  disconnect(socket) {
    console.info('disconnect:', socket.id);

    const gameRoom = this.getUserRoom(socket);
    if (!gameRoom) {
      // if they aren't in a room then do nothing, not considered error
      return;
    }

    // if there is a room, disconnect them from it
    this.roomAssignments = this.roomAssignments.filter(ra => socket.id !== ra.socketID);
    const player = gameRoom.disconnect(socket);

    if (gameRoom.isEmpty()) {
      console.info('close room:', gameRoom.name);
      // if the room is empty, delete the room
      this.gameRooms = this.gameRooms.filter(gr => gr.name !== gameRoom.name);
    } else {
      // otherwise alert the room in the form of an error
      this.sendError(gameRoom.name, {
        type: 'ServerSocket.disconnect',
        errors: [`${player.name} has left the game.`]
      });
      // TODO: if the game is going while they are in the room
      // prepare the room for them to come back, player.setIsConnected(false)
      // every time we set slide, set the room's lastSlide = slideID
      // the next player to show up replaces that player, replaces their name and id but take the role
      // send that new player this room's lastSlide
    }
  }

  // ROOMS

  joinRoom(socket, data) {
    const { roomName } = data;

    let gameRoom = this.getRoomByName(roomName);
    switch (true) {
      case !gameRoom:
        console.info('open room:', roomName);
        // if this room does not exist then create it
        // and send a new room state to the user
        gameRoom = new GameRoom(this, roomName);
        this.gameRooms.push(gameRoom);
        break;
      case gameRoom.isFull():
        console.error(`serverSocket.joinRoom: gameroom '${roomName}' is full.`);
        this.sendError(socket.id, {
          type: 'ServerSocket.joinRoom',
          errors: [`Game room '${roomName}' is full.`]
        });
        return;
      case gameRoom.isStarted():
        // TODO: remove this error, allow join started game if it is not full
        // replace isConnected=false player if they are rejoining
        // otherwise just allow them in, the code length should change the following round
        // just be sure to send them the slide they are currently on?
        console.error(`serverSocket.joinRoom: gameroom '${roomName}' has started.`);
        this.sendError(socket.id, {
          type: 'ServerSocket.joinRoom',
          errors: [`Game room '${roomName}' has started, you may join next round.`]
        });
        return;
    }

    socket.join(roomName);
    this.roomAssignments.push({
      socketID: socket.id,
      roomName
    });
    gameRoom.joinRoom(socket);
  }

  shareName(socket, { playerName }) {
    const gameRoom = this.getUserRoom(socket);
    if (!gameRoom) {
      console.error(`serverSocket.shareName: No gameroom for socket ${socket.id}.`);
      return;
    }
    gameRoom.setPlayerName(socket, playerName);
  }

  // GAMEPLAY

  pollResponse(socket, response) {
    const gameRoom = this.getUserRoom(socket);
    if (!gameRoom) {
      console.error(`serverSocket.pollResponse: No gameroom for socket ${socket.id}.`);
      return;
    }
    gameRoom.pollResponse(socket, response);
  }

  nextSlide(id, data) {
    // data is { slideID, data: {} }
    this.io.to(id).emit('NEXT_SLIDE', data);
  }

  updateGameState(roomName, gameState) {
    this.io.to(roomName).emit('GAME_STATE', gameState);
  }

  sendError(receiver, { type, errors }) {
    this.io.to(receiver).emit('SET_ERRORS', { type, errors });
  }

  // HELPERS

  getRoomAssignment(socket) {
    const roomAssignment = this.roomAssignments.find(ra => socket.id === ra.socketID);
    if (!!roomAssignment) {
      return roomAssignment.roomName;
    }
    return false;
  }

  getRoomByName(roomName) {
    return this.gameRooms.find(gameRoom => gameRoom.name === roomName);
  }

  getUserRoom(socket) {
    const gameRoomName = this.getRoomAssignment(socket);
    if (!!gameRoomName) {
      return this.getRoomByName(gameRoomName);
    }
    return false;
  }

}

export { ServerSocket }