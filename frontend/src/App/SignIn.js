import React from 'react';
import Avatar from '@material-ui/core/Avatar';
import Button from '@material-ui/core/Button';
import CssBaseline from '@material-ui/core/CssBaseline';
import TextField from '@material-ui/core/TextField';
import Box from '@material-ui/core/Box';
import LockOutlinedIcon from '@material-ui/icons/LockOutlined';
import Typography from '@material-ui/core/Typography';
import { makeStyles } from '@material-ui/core/styles';
import Container from '@material-ui/core/Container';

import Copyright from './Components/Copyright';
import APIRequest from './js/APIRequest';

const useStyles = makeStyles(theme => ({
    '@global': {
        body: {
            backgroundColor: theme.palette.common.white,
        },
    },
    paper: {
        marginTop: theme.spacing(8),
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
    },
    avatar: {
        margin: theme.spacing(1),
        backgroundColor: theme.palette.secondary.main,
    },
    form: {
        width: '100%', // Fix IE 11 issue.
        marginTop: theme.spacing(1),
    },
    submit: {
        margin: theme.spacing(3, 0, 2),
    },
}));

function SignIn(props) {
    var API = new APIRequest("http://localhost:8080/graphql")
    const classes = useStyles();

    const defaultValues = {
        username: "",
        password: ""
    }
    const [variables, setVariables] = React.useState(defaultValues)

    const onVariableChange = (key) => (event) => {
        setVariables({ ...variables, [key]: event.target.value })
    }

    return (
        <Container component="main" maxWidth="xs">
            <CssBaseline />
            <div className={classes.paper}>
                <Avatar className={classes.avatar}>
                    <LockOutlinedIcon />
                </Avatar>
                <Typography component="h1" variant="h5">
                    Log in
                </Typography>
                <form className={classes.form} onSubmit={event => {
                    event.preventDefault()
                    API.request(`
                            mutation SignIn($email: String!, $password: String!) {
                                signin(email: $email, password: $password) {
                                    error {
                                        code
                                        msg
                                    }
                                    credentials {
                                        sessionKey
                                        sessionExpire
                                    }
                                }
                            }
                        `, variables).then((response) => response.json()).then(resp => {
                        if (resp.data) {
                            if (resp.data.signin.error) {
                                alert(resp.data.signin.error.msg)
                                console.error(resp.data.signin.error)
                            } else {
                                localStorage.setItem("sessionCredentials", JSON.stringify(resp.data.signin.credentials))
                                console.log(resp.data.signin.credentials)
                                props.history.push("/")
                            }
                        } else {
                            console.error(resp)
                            alert("Some thing went wrong")
                        }
                    }).catch((error) => {
                        console.error(error)
                        alert("Some thing went wrong")
                    })
                }}>
                    <TextField
                        variant="outlined"
                        margin="normal"
                        required
                        fullWidth
                        id="username"
                        label="Username"
                        name="username"
                        value={variables.username}
                        onChange={onVariableChange("username")}
                    />
                    <TextField
                        variant="outlined"
                        margin="normal"
                        required
                        fullWidth
                        name="password"
                        label="Password"
                        type="password"
                        id="password"
                        inputProps={{
                            minLength: 6
                        }}
                        autoComplete="current-password"
                        value={variables.password}
                        onChange={onVariableChange("password")}
                    />
                    <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        color="primary"
                        className={classes.submit}
                    >
                        Log In
                    </Button>
                </form>
            </div>
            <Box mt={8}>
                <Copyright />
            </Box>
        </Container>
    );
}

export default SignIn;