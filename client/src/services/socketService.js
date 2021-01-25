
import io from "socket.io-client";

import {
  addPlayer,
  nextSlide,
  updateGameState,
} from '../actions';

const ENDPOINT = '//localhost:5000';
const socket = io(ENDPOINT, {
  withCredentials: true,
});

class SocketServiceClass {
  startService() {
    return (dispatch) => {
      socket.on('ADD_PLAYER', (data) => {
        dispatch(addPlayer(data));
      });
      socket.on('NEXT_SLIDE', (data) => {
        dispatch(nextSlide(data));
      });
      socket.on('GAME_STATE', data => {
        dispatch(updateGameState(data));
      });
    }
  }

  joinRoom(data) {
    socket.emit('JOIN_ROOM', data);
  }

  setPlayerName(data) {
    socket.emit('SET_PLAYER_NAME', data);
  }
}

const SocketService = new SocketServiceClass();

export { SocketService, socket };
