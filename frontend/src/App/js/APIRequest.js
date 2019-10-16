/**
 * Make API Request
 */

export default class APIRequest {
    constructor(path, sessionCredentials) {
        this.path = path
        this.sessionCredentials = sessionCredentials
    }

    setSessionKey(sessionCredentials) {
        this.sessionCredentials = sessionCredentials
    }

    request(query, variables) {
        var headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        }
        if (this.sessionCredentials)
            headers["X-Session-Key"] = this.sessionCredentials.sessionKey

        return fetch(this.path, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                query,
                variables
            })
        })
    }
}