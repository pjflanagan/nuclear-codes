
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
    console.log('[INFO] connection:', socket.id);
  }

  disconnect(socket) {
    console.log('[INFO] disconnect:', socket.id);

    const gameRoom = this.getUserRoom(socket);
    if (!gameRoom) {
      // if they aren't in a room then do nothing, not considered error
      return;
    }

    // if there is a room, disconnect them from it
    this.roomAssignments = this.roomAssignments.filter(ra => socket.id !== ra.socketID);
    gameRoom.disconnect(socket);

    if (gameRoom.isEmpty()) {
      console.log('[INFO] close room:', gameRoom.name);
      // if the room is empty, delete the room
      this.gameRooms = this.gameRooms.filter(gr => gr.name !== gameRoom.name);
    } else {
      // otherwise alert the room
      this.io.to(gameRoom.name).emit('GAME_STATE', gameRoom.getState());
      // TODO: if the game is going while they are in the room
      // prepare the room for them to come back, put thier player data into a
      // gameRoom.ghosts array and if that playerName comes back then 
      // re-add them
    }
  }

  // ROOMS

  joinRoom(socket, data) {
    const { roomName } = data;

    let gameRoom = this.getRoomByName(roomName);
    if (!gameRoom) {
      console.log('[INFO] open room:', roomName);
      // if this room does not exist then create it
      // and send a new room state to the user
      gameRoom = new GameRoom(this, roomName);
      this.gameRooms.push(gameRoom);
    } else if (gameRoom.isFull()) {
      // TODO: handle ERROR emits
      console.error(`serverSocket.joinRoom: gameroom '${roomName}' is full.`);
      this.io.to(socket.id).emit('ERROR', { message: `Game room '${roomName}' is full.` });
      return;
    } else if (gameRoom.isStarted()) {
      console.error(`serverSocket.joinRoom: gameroom '${roomName}' has started.`);
      this.io.to(socket.id).emit('ERROR', { message: `Game room '${roomName}' has started, you may join next round.` });
      return;
    }
    this.roomAssignments.push({
      socketID: socket.id,
      roomName
    });
    gameRoom.joinRoom(socket);
    socket.join(roomName);
    this.io.to(roomName).emit('GAME_STATE', gameRoom.getState());
    this.io.to(socket.id).emit('NEXT_SLIDE', {
      slideID: 'name-prompt'
    });
  }

  shareName(socket, { playerName }) {
    const gameRoom = this.getUserRoom(socket);
    if (!gameRoom) {
      console.error(`serverSocket.shareName: No gameroom for socket ${socket.id}.`);
      return;
    }

    const playerSetName = gameRoom.setPlayerName(socket, playerName);
    this.io.to(gameRoom.name).emit('GAME_STATE', gameRoom.getState());
    this.io.to(socket.id).emit('NEXT_SLIDE', {
      slideID: 'welcome-agent',
      data: {
        playerName: playerSetName,
        roomName: gameRoom.name
      }
    });
  }

  // Gameplay

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


  // Helpers

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