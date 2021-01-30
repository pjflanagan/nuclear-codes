
import React from 'react';

import { Pill, Slide, Button } from '../../elements';

import Style from './style.module.css';

// "waiting for all players to turn keys"
// 8s timeout for spies

class KeyChoiceWidget extends React.Component {
  constructor(props) {
    super(props);
    this.onSubmit = this.onSubmit.bind(this);
  }

  onSubmit(e, keyChoice) {
    this.props.socketService.pollResponse({
      type: 'ROUND_TURN_KEY',
      data: {
        isSpyKey: keyChoice === 'spyKey'
      }
    });
  }

  render() {
    return (
      <Slide>
        <div className={Style.keyOptions}>
          <div className={Style.keyOption}>
            <Button onClick={e => this.onSubmit(e, 'agentKey')}>
              <Pill
                doNotType={true}
              >
                Agent Key
            </Pill>
            </Button>
          </div>
          <div className={Style.keyOption}>
            <Button onClick={e => this.onSubmit(e, 'spyKey')}>
              <Pill
                doNotType={true}
                color="red"
              >
                Spy Key
              </Pill>
            </Button>
          </div>
        </div>
      </Slide>
    );
  }
}

export { KeyChoiceWidget }