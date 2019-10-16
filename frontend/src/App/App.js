import React from 'react';
import { HashRouter, Switch, Route, Redirect } from 'react-router-dom'
import SignIn from './SignIn';
/**
 * Handle Routing
 */
function App() {
    return (
        <div className="App">
            <HashRouter>
                <Switch>
                    <Route path="/login" component={SignIn} />
                    <Route>
                        <Redirect to="/login" />
                    </Route>
                </Switch>
            </HashRouter>
        </div>
    );
}

export default App;
