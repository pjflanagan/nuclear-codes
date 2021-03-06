import React from 'react';
import {
  FaTrophy
} from 'react-icons/fa';
import {
  GiNuclearBomb,
  GiHandcuffs
} from 'react-icons/gi'

import { Slide, Title, Typeable, Text, Pill } from '../../elements';
import { GameWidget } from '../../game';

class MessageGameOver extends GameWidget {
  render() {
    const { data: { result, code, spies } } = this.props;
    const me = this.getMe();
    let pill = (<></>)
    let message1 = '';
    let message2 = '';
    if (!!me && me.isSpy) {
      if (result === 'victory') {
        pill = (<Pill><GiHandcuffs />{'DEFEAT'}</Pill>);
        message1 = ' , your treachery was no match for American ingenuity. Our agents guessed '
        message2 = ' and foiled your terrorist and/or communist plot.'
      } else {
        pill = (<Pill color="red"><FaTrophy />{'VICTORY'}</Pill>);
        message1 = ' Nice going, you managed to prevent our agents from guessing the code: '
        message2 = ". And in one fell swoop, America, a beacon of hope to the world, has fallen. I hope you're happy."
      }
    } else {
      if (result === 'victory') {
        pill = (<Pill><FaTrophy />{'VICTORY'}</Pill>);
        message1 = ' Mission Accomplished! Our agents guessed '
        message2 = ' and put an end to the terrorist and/or communist scheme spearheaded by '
      } else {
        pill = (<Pill color="red"><GiNuclearBomb />{'DEFEAT'}</Pill>);
        message1 = " It's over, the great American experiment has crumbled before our eyes. All because we couldn't guess the final code correctly: "
        message2 = ". You've let your nation down. We now bow to our new leaders: "
      }
    }
    return (
      <Slide>
        <Title>{'Game Over'}</Title>
        <Typeable doneTypingCallback={() => this.props.doneCallback({ result })}>
          {pill}
          <Text>{`${message1}`}</Text>
          <Pill>{code}</Pill>
          <Text>{`${message2}`}</Text>
          {
            !!me && !me.isSpy && spies.map((p, i) => (
              <Pill key={i} color="red">{p.name}</Pill>
            ))
          }
        </Typeable>
      </Slide>
    )
  }
}


export {
  MessageGameOver
};