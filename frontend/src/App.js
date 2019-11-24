import React from 'react';
import axios from 'axios';
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Link
} from "react-router-dom";

import Home from './Pages/Home';
import Commands from './Pages/Commands';
import Dashboard from './Pages/Dashboard';

import './App.css';

class App extends React.Component {
  constructor() {
    super();
    this.state = {commands: null, info: null, menu: false};
  }

  async componentDidMount() {
    var commands = (await axios('/api/commands')).data;
    var info = (await axios('/api/info')).data;
    this.setState({commands: commands, info: info});
  }

  toggleMenu = (e) => {
    e.stopPropagation();
    this.setState({menu: !this.state.menu})
  }

  hideMenu = ()=> {
    this.setState({menu: false});
  }

  render() {
    if(!this.state.commands && !this.state.info) return null;
    return (
      <div className="App" onClick={()=> this.hideMenu()}>
        <Router>
          <nav>
            <button role="button" className="App-menutoggle" onClick={(e)=>this.toggleMenu(e)}>
              Menu
            </button>
            <ul className="App-navlinks">
              <Link to="/">Home</Link>
              <Link to="/commands">Commands</Link>
            </ul>
            <ul className="App-navbuttons">
              <Link to="/dashboard">Dashboard</Link>
            </ul>
          </nav>

          <div className={"App-sidebar" + (this.state.menu ? " show" : "")}>
            <h3>Nav</h3>
            <Link className="App-link" to="/">Home</Link>
            <Link className="App-link" to="/commands">Commands</Link>
            <h3>Commands</h3>
            {this.state.commands.map(c => {
              return <Link className="App-link" to={`/commands/${c.name}`} key={c.name} >{c.name[0].toUpperCase()+c.name.slice(1)}</Link>
            })}
          </div>

          <Switch>
            <Route path="/" exact>
              <Home />
            </Route>
            <Route path="/commands" component={()=> <Commands commands={this.state.commands} />} />
            <Route path="/dashboard">
              <Dashboard />
            </Route>
          </Switch>
        </Router>
      </div>
    );
  }
}

export default App;
