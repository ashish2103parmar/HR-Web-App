import React from 'react';

import Modal from "@material-ui/core/Modal"
import Card from '@material-ui/core/Card';
import Container from '@material-ui/core/Container';
import { ButtonGroup, Button, TextField, Typography, Grid } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles(theme => ({
    paper: {
        position: 'absolute',
        maxWidth: "600px",
        top: "50%",
        left: "50%",
        transform: `translate(-50%, -50%)`,
        padding: theme.spacing(2, 4, 4),
        outline: 'none',
    },
    header: {
        marginTop: "20px"
    },
    btnGroup: {
        marginBottom: "20px"
    }
}));

export default function ChangePassword(props) {
    const classes = useStyles();

    const [values, setValues] = React.useState({
        open: false,
        newPassword: "",
        oldPassword: "",
    });

    props.openCallback(() => {
        setValues({
            newPassword: "",
            oldPassword: "",
            open: true
        })
    })

    const handleChange = name => event => {
        setValues({ ...values, [name]: event.target.value });
    };

    return (
        <Modal open={values.open}>
            <div className={classes.paper}>
                <Card>

                    <form className={classes.container} autoComplete="off" onSubmit={(event) => {
                        event.preventDefault();
                        if (props.onSubmit) {
                            props.onSubmit(values)
                        }
                        setValues({
                            ...values,
                            open: false
                        })
                    }}>
                        <Container fixed>
                            <Typography className={classes.header} variant="h5" component="h2">
                                Change Password
                            </Typography>
                            <Grid container spacing={1}>
                                <Grid item xs={12}>
                                    <TextField
                                        label="Old Password"
                                        value={values.oldPassword}
                                        onChange={handleChange('oldPassword')}
                                        margin="normal"
                                        InputLabelProps={{
                                            shrink: true,
                                        }}
                                        type="password"
                                        fullWidth
                                        required
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <TextField
                                        label="New Password"
                                        type="password"
                                        value={values.newPassword}
                                        onChange={handleChange('newPassword')}
                                        margin="normal"
                                        InputLabelProps={{
                                            shrink: true,
                                        }}
                                        fullWidth
                                        required
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <ButtonGroup className={classes.btnGroup} fullWidth variant="contained">
                                        <Button type="submit" color="primary">Submit</Button>
                                        <Button color="secondary" onClick={() => {
                                            setValues({ ...values, open: false })
                                        }}>Cancel</Button>
                                    </ButtonGroup>
                                </Grid>
                            </Grid>
                        </Container>
                    </form>
                </Card>
            </div>
        </Modal>
    );
}
