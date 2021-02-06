
import { PlayerModel } from '../player/player.js';

const PLAYER_NAMES = [
  'JamesBond',
  'AustinPowers',
  'JasonBourne',
  'EthanHunt',
  'AlexRider',
  'BlackWidow',
  'KimPossible',
  'MacGyver',
  'CarmenCortez',
  'Archer'
];

class RoomModel {
  constructor($scope, roomName, playerCount) {
    this.$scope = $scope;
    this.roomName = roomName;
    this.roomURL = `${CLIENT_ENDPOINT}/${roomName}`;
    this.players = [];
    this.makePlayers(playerCount);
  }

  makePlayers(playerCount) {
    for (let i = 0; i < playerCount; ++i) {
      this.players.push(new PlayerModel(this.$scope, this, PLAYER_NAMES[i]));
    }
  }

  sendReadyUp() {
    this.players.forEach(p => {
      p.sendReadyUp();
    });
  }

  sendRoomChoices() {
    this.players.forEach((p, i) => {
      p.response.roomID = Math.floor(i / 2);
      p.sendRoomChoice();
    });
  }

  sendCode(isCorrect) {
    this.players.forEach(p => {
      p.sendEnterCode(isCorrect);
    })
  }
}

export { RoomModel, PLAYER_NAMES };