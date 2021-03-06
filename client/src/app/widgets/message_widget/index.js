import React from 'react';

import { Slide, TitleLarge, Title, Typeable, Text, Pill, PillCopy } from '../../elements';
import { GameWidget } from '../../game';

const TITLE_DELAY = 100;

class MessageRoundTitle extends React.Component {
  constructor(props) {
    super(props);
    this.state = { round: 1 }
  }
  componentDidMount() {
    setTimeout(this.props.doneCallback, TITLE_DELAY);
    this.setState({
      round: this.props.gameState.round + 1 // display round starts at 1
    })
  }
  render() {
    const { round } = this.state;
    return (
      <Slide>
        <TitleLarge>
          {`Round ${round}`}
        </TitleLarge>
      </Slide>
    );
  }
}

class MessageWidget extends React.Component {
  render() {
    const { data: { title, text } } = this.props;
    return (
      <Slide isPrompt={true}>
        {!!title && <Title>{title}</Title>}
        <Typeable doneTypingCallback={this.props.doneCallback}>
          <Text>
            {text}
          </Text>
        </Typeable>
      </Slide>
    );
  }
}

class MessageWidgetWelcome extends React.Component {
  render() {
    const { data: { playerName, roomName } } = this.props;
    return (
      <Slide isPrompt={true}>
        <Title>{'Begin Transmission'}</Title>
        <Typeable doneTypingCallback={this.props.doneCallback}>
          <Text>{'Welcome to Briefing Room '}</Text>
          <Pill>{roomName}</Pill>
          <Text>{' agent '}</Text>
          <Pill>{playerName}</Pill>
          <Text>{'. You can invite friends to this game by sharing the url: '}</Text>
          <PillCopy copyText={window.location.href}>{`${window.location.host}${window.location.pathname}`}</PillCopy>
        </Typeable>
      </Slide>
    );
  }
}

class MessageWidgetLetterReveal extends GameWidget {
  render() {
    const { data: { roomID, realLetter, fakeLetter } } = this.props;
    const me = this.getMe();
    // if a spy, highlight the letter with color,
    // if not a spy, present the letter truthfully
    let content = (<></>);
    if (!!me && me.isSpy) {
      content = (
        <Typeable doneTypingCallback={this.props.doneCallback}>
          <Text>{'You saw '}</Text>
          <Pill>{realLetter}</Pill>
          <Text>{' and '}</Text>
          <Pill color="red">{fakeLetter}</Pill>
          <Text>{' in room '}</Text>
          <Pill>{`${roomID + 1}`}</Pill>
          <Text>{'. You may choose to lie and possibly accuse your roommate of being a spy. In the next round your code entry will be fake, be sure to pretend to enter a code.'}</Text>
        </Typeable>
      )
    } else {
      content = (
        <Typeable doneTypingCallback={this.props.doneCallback}>
          <Text>{'You saw '}</Text>
          <Pill>{realLetter}</Pill>
          <Text>{' in room '}</Text>
          <Pill>{`${roomID + 1}`}</Pill>
          <Text>{`. Talk it over and vote on a code to enter. Remember, the code changes every round.`}</Text>
        </Typeable>
      );
    }
    return (
      <Slide isPrompt={true}>
        <Title>{'Code Entry'}</Title>
        {content}
      </Slide>
    );
  }
}

class MessageWidgetDefcon extends GameWidget {
  render() {
    const { data: { guessedCode, charsCorrect } } = this.props;
    let message = '';
    switch (this.props.gameState.round) {
      case 1:
        message = "and that's okay, let's just try and not let it go any higher."
        break;
      case 2:
        message = "which is typical of a post-Reagan presidency, we still have some time."
        break;
      case 3:
        message = "which is not great, we're never going to hear the end of this at the next UN conference."
        break;
      case 4:
        message = "so, like, this is our last chance. The fate of a nation rests in your hands."
        break;
      default:
        break;
    }
    return (
      <Slide isPrompt={true}>
        <Title>{'Code Entry Result'}</Title>
        <Typeable doneTypingCallback={this.props.doneCallback}>
          <Text>{"The majority voted for "}</Text>
          <Pill>{guessedCode}</Pill>
          <Text>{" which contained "}</Text>
          <Pill>{charsCorrect}</Pill>
          <Text>{`
            correct characters, and failed to unlock the nuclear football, the code has now changed. 
            We've moved up to defcon `}</Text>
          <Pill color="red">{this.props.gameState.round}</Pill>
          <Text>{` ${message}`}</Text>
        </Typeable>
      </Slide>
    )
  }
}


export {
  MessageRoundTitle,
  MessageWidget,
  MessageWidgetWelcome,
  MessageWidgetLetterReveal,
  MessageWidgetDefcon,
};