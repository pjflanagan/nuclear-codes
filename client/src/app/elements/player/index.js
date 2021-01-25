import React from 'react';

import Style from './style.module.css';

const Player = ({
  index,
  name,
}) => (
  <div className={Style.player}>
    <div className={Style.playerName}>
      {!!name ? name : index}
    </div>
  </div>
);

export { Player }