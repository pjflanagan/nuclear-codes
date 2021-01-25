import React from 'react';

import { Slide } from '../../elements';

import Style from './style.module.css';

class RoomWidget extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      done: false,
      playerName: "",
    };

    this.onChange = this.onChange.bind(this);
    this.onKeyDown = this.onKeyDown.bind(this);
    this.onSubmit = this.onSubmit.bind(this);
  }

  componentDidMount() {
    this.input.focus();
  }

  onChange(e) {
    this.setState({
      playerName: e.target.value,
    });
  }

  onKeyDown(e) {
    if (e.key === 'Enter') {
      this.onSubmit();
    }
  }

  onSubmit() {
    const { playerName } = this.state;
    this.props.doneCallback({ playerName });
    this.props.socketService.setPlayerName({ playerName });
    this.setState({ done: true });
  }

  render() {
    const { done } = this.state;
    // TODO: auto tab into it when it shows up
    return (
      <Slide done={done}>
        <input
          ref={(input) => { this.input = input; }}
          type="text"
          placeholder="Your Secret Agent Name"
          tabIndex={0}
          className={Style.input}
          onChange={e => this.onChange(e)}
          onKeyDown={e => this.onKeyDown(e)}
          disabled={done}
        />
      </Slide>
    );
  }
}

export { RoomWidget };