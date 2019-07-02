import React from 'react';
import * as fetch from 'node-fetch';
import './App.css';

import Commands from './components/commands';
import Stats from './components/stats';

function App() {
  return (
    <div className="App">
      <div className="App-header">
        <img src="/icon.png" className="App-avatar"/>
        <p className="App-title">Herobrine </p>
        <a className="App-button" href="https://discord.gg/EvDmXGt">need help?</a>
        <a className="App-button" href="https://github.com/greys-bots/herobrine">view source</a>
      </div>
      <div className="App-container">
        <section className="App-about">
          <div>
          <h1>Herobrine</h1>
          <h3><em>A <span className="App-color">multi-purpose</span> bot for Discord</em></h3>
          <p><strong>Herobrine</strong> is a Discord bot created by <a href="https://github.com/greysdawn">@greysdawn</a>{" "}
            and inspired by bots like Tatsumaki. He can be used for custom colors, welcome messages, [hack]banning, self-roles, and more.{" "}
            His default prefix is <em>hh!</em>, but servers can set their own using the prefix command.<br/>Right now, Herobrine is only{" "}
            available to a handful of servers, as he's still an active work in progess.
          </p>
          </div>
        </section>
        <Stats />
        <Commands />
        <div className="App-note">
        <h1>Notes</h1>
        <p>Click on a command above to get more info on it</p>
        <p><strong>Prefix:</strong> Herobrine's prefix is hh!</p>
        <p><strong>Permissions:</strong> The permissions that Herobrine needs are Manage Messages (for pruning),{" "}
                   Manage Roles (for creating, editing, etc roles), Send Messages (obviously), Embed Links (for the color embeds),{" "}
                   and Ban Members (speaks for itself). Giving him admin permissions may be the easiest way to go.
        </p>
        </div>
        <section className="App-footer">
          <div>
          <h1>Want to support the bot?</h1>
          <p>
            Currently, Herobrine is being run on our Raspberry Pi along with a few other bots. This means that{" "}
            it only has 1gb of RAM to share with the other bots, and will eventually need a dedicated/upgraded{" "}
            environment to run in. We're also without a job right now, and rely on patrons and donations to get by.<br/>
            If you'd like to donate, you can send money to our Ko-Fi or choose to become a Patron.
          </p>
          </div>
          <div className="App-links">
            <a href="https://ko-fi.com/greysdawn" className="App-button">Ko-Fi</a><br/>
            <a href="https://patreon.com/greysdawn" className="App-button">Patreon</a><br/>
          </div>
        </section>
      </div>
    </div>
  );
}

export default App;
