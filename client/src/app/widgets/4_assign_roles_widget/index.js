import React from 'react';

import { Slide, Typeable, Text, Pill, Player } from '../../elements';

class AssignRolesWidget extends React.Component {
  spyContent() {
    const { me } = this.props;
    const spyPlayers = this.props.gameState.players.filter(p => p.isSpy && p.id !== me.id);
    return (
      <Typeable doneTypingCallback={this.props.doneCallback}>
        <Text>{'I guess you hate America. You are a'}</Text>
        <Pill color="red">{'SPY'}</Pill>
        <Text>{'along with:'}</Text>
        {
          spyPlayers.map((p, i) => (
            <Player
              key={i}
              me={me}
              player={p}
            />
          ))
        }
      </Typeable>
    );
  }

  agentContent() {
    return (
      <Typeable doneTypingCallback={this.props.doneCallback}>
        <Text>{'You are an'}</Text>
        <Pill>{'AGENT'}</Pill>
        <Text>{', be on the lookout for spies.'}</Text>
      </Typeable>
    );
  }

  render() {
    const { me } = this.props;
    const content = me.isSpy ? this.spyContent() : this.agentContent();
    return (
      <Slide>
        { content}
      </Slide>
    );
  }
}

export { AssignRolesWidget };