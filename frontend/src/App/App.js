import React from 'react';
import { HashRouter, Switch, Route, Redirect } from 'react-router-dom'
import LogIn from './LogIn';
import Main from './Main';
import Employee from './Employee';

/**
 * Handle Routing
 */
function App() {
    const [user, setUser] = React.useState(JSON.parse(localStorage.getItem("sessionCredentials")))
    return (
        <div className="App">
            <HashRouter>
                {
                    user ?
                        (user.type === "employee" && <Redirect to={"/employee/" + user.username} />) || <Redirect from="/login" to="/" />
                        : <Redirect to="/login" />
                }
                <Switch>
                    <Route path="/" exact render={(props) => <Main setUser={setUser} user={user} {...props} />} />
                    <Route path="/login" render={(props) => <LogIn setUser={setUser} {...props} />} />
                    <Route path="/employee/:id" render={(props) => <Employee setUser={setUser} user={user} {...props} />} />
                    <Route>
                        <Redirect to="/" />
                    </Route>
                </Switch>
            </HashRouter>
        </div>
    );
}

export default App;
