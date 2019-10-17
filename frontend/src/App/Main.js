import React from 'react';
import AppBar from '@material-ui/core/AppBar';
import Button from '@material-ui/core/Button';
import OfficeIcon from '@material-ui/icons/Business';
import CssBaseline from '@material-ui/core/CssBaseline';
import Grid from '@material-ui/core/Grid';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import { makeStyles } from '@material-ui/core/styles';
import Container from '@material-ui/core/Container';
import MaterialTable from 'material-table'

import Copyright from './Components/Copyright';
import IconButton from '@material-ui/core/IconButton';

import APIRequest from './js/APIRequest';

const useStyles = makeStyles(theme => ({
    title: {
        flexGrow: 1,
    },
    body: {
        padding: theme.spacing(8, 0, 6),
    },
    footer: {
        backgroundColor: theme.palette.background.paper,
        padding: theme.spacing(1),
    },
}));

var api;

var lockLoading = false
var roles = []
var employees = []

function loadRoles(Refresh, nextToken) {
    api.request(`
        query ListRoles($nextToken: String) {
            listRoles(nextToken: $nextToken) {
                roles {
                    id
                    name
                    description
                    perHourRate
                }
                error {
                    code
                    msg
                }
                nextToken
            }
        }
    `, { nextToken }).then(r => r.json()).then(d => {
        if (d.data && d.data.listRoles) {
            if (d.data.listRoles.error) {
                console.error(d.data.listRoles.error)
            } else {
                roles = [...roles, ...d.data.listRoles.roles]
                Refresh()
                if (d.data.listRoles.nextToken)
                    loadRoles(Refresh, d.data.listRoles.nextToken)
            }
        } else {
            console.error(d)
            if (d.error && d.error.code) {
                localStorage.removeItem("sessionCredentials")
                window.location.reload()
            } else {
                alert("Something Went Wrong")
            }
        }
    }).catch(error => {
        console.error(error)
    })
}

function loadEmployees(Refresh, nextToken) {
    api.request(`
            query ListEmployees($nextToken: String) {
                listEmployees(nextToken: $nextToken) {
                    employees {
                        id
                        name
                        roleID
                        isActive
                    }
                    error {
                        code
                        msg
                    }
                    nextToken
                }
            }
        `, { nextToken }).then(r => r.json()).then(d => {
        if (d.data && d.data.listEmployees) {
            if (d.data.listEmployees.error) {
                console.error(d.data.listEmployees.error)
            } else {
                employees = [...employees, ...d.data.listEmployees.employees]
                Refresh()
                if (d.data.listEmployees.nextToken)
                    loadEmployees(Refresh, d.data.listEmployees.nextToken)
            }
        } else {
            console.error(d)
            if (d.error && d.error.code) {
                localStorage.removeItem("sessionCredentials")
                window.location.reload()
            } else {
                alert("Something Went Wrong")
            }
        }
    }).catch(error => {
        console.error(error)
    })
}


function Main(props) {

    const classes = useStyles();
    const [refreshRole, setRefreshRole] = React.useState(0)
    const [refreshEmployee, setRefreshEmployee] = React.useState(0)

    const RefreshRole = () => setRefreshRole(refreshRole + 1)
    const RefreshEmployee = () => setRefreshEmployee(refreshEmployee + 1)

    if (!lockLoading) {
        lockLoading = true
        api = new APIRequest("http://localhost:8080/graphql", props.user)
        loadRoles(RefreshRole);
        loadEmployees(RefreshEmployee);
    }

    return (
        <React.Fragment>
            <CssBaseline />
            <AppBar position="static">
                <Toolbar>
                    <IconButton color="inherit" onClick={() => props.history.push('/')} >
                        <OfficeIcon />
                    </IconButton>
                    <Typography variant="h6" color="inherit" noWrap className={classes.title}>
                        Company
                    </Typography>
                    <Button color="inherit" onClick={() => {
                        localStorage.removeItem("sessionCredentials")
                        props.setUser()
                    }} >Log Out</Button>
                </Toolbar>
            </AppBar>
            <main>
                <div className={classes.body}>
                    <Container>
                        <Grid container spacing={4} >
                            <Grid item sm={12}>
                                <MaterialTable
                                    title="Roles"
                                    columns={[
                                        { title: 'RoleID', field: 'id', editable: "never" },
                                        { title: 'Name', field: 'name', },
                                        { title: 'Description', field: 'description', },
                                        { title: '$/Hour', field: 'perHourRate', type: "numeric" }
                                    ]}
                                    data={roles}
                                    options={{
                                        actionsColumnIndex: -1,
                                    }}
                                    editable={{
                                        onRowAdd: newRole => new Promise((resolve, reject) => {
                                            if (newRole.perHourRate && newRole.name && newRole.description) {
                                                newRole.perHourRate = parseFloat(newRole.perHourRate)
                                                api.request(`
                                                        mutation CreateRole($newRole: Role!) {
                                                            createRole(newRole: $newRole) {
                                                                id
                                                                name
                                                                description
                                                                perHourRate
                                                                error {
                                                                    code
                                                                    msg
                                                                }
                                                            }
                                                        }
                                                    `, { newRole }).then(r => r.json()).then(d => {
                                                    if (d.data && d.data.createRole) {
                                                        if (d.data.createRole.error) {
                                                            console.error(d.data.createRole.error)
                                                        } else {
                                                            roles = [...roles, d.data.createRole]
                                                            RefreshRole()
                                                            resolve()
                                                        }
                                                    } else {
                                                        console.error(d)
                                                        if (d.error && d.error.code) {
                                                            localStorage.removeItem("sessionCredentials")
                                                            window.location.reload()
                                                        } else {
                                                            alert("Something Went Wrong")
                                                            reject()
                                                        }
                                                    }
                                                }).catch(error => {
                                                    console.error(error)
                                                    reject()
                                                })
                                            } else {
                                                reject("All Parameters Required")
                                            }

                                        }),
                                        onRowUpdate: (role, oldData) => new Promise((resolve, reject) => {
                                            if (role.perHourRate && role.name && role.description) {
                                                role.perHourRate = parseFloat(role.perHourRate)
                                                api.request(`
                                                        mutation UpdateRole($role: Role!) {
                                                            updateRole(role: $role) {
                                                                id
                                                                name
                                                                description
                                                                perHourRate
                                                                error {
                                                                    code
                                                                    msg
                                                                }
                                                            }
                                                        }
                                                    `, { role }).then(r => r.json()).then(d => {
                                                    if (d.data && d.data.updateRole) {
                                                        if (d.data.updateRole.error) {
                                                            console.error(d.data.updateRole.error)
                                                        } else {
                                                            const idx = roles.findIndex((value) => value.id === role.id)
                                                            roles[idx] = d.data.updateRole
                                                            RefreshRole()
                                                            resolve()
                                                        }
                                                    } else {
                                                        console.error(d)
                                                        if (d.error && d.error.code) {
                                                            localStorage.removeItem("sessionCredentials")
                                                            window.location.reload()
                                                        } else {
                                                            alert("Something Went Wrong")
                                                            reject()
                                                        }
                                                    }
                                                }).catch(error => {
                                                    console.error(error)
                                                    reject()
                                                })
                                            } else {
                                                reject("All Parameters Required")
                                            }

                                        })
                                    }}
                                />
                            </Grid>
                            <Grid item sm={12}>
                                <MaterialTable
                                    title="Employees"
                                    columns={[
                                        { title: 'EmployeeID', field: 'id' },
                                        { title: 'Name', field: 'name', },
                                        { title: 'RoleID', field: 'roleID', },
                                        { title: 'Active', field: 'isActive', type: 'boolean' }
                                    ]}
                                    data={employees}
                                    options={{
                                        actionsColumnIndex: -1,
                                    }}
                                    onRowClick={(event, rowData) => {
                                        props.history.push("/employee/" + rowData.id)
                                    }}
                                    actions={[{
                                        icon: 'add',
                                        tooltip: 'Register Employee',
                                        isFreeAction: true,
                                        onClick: (event) => {
                                            props.history.push("/employee/new")
                                        }
                                    }, {
                                        icon: 'sync',
                                        tooltip: 'Sync Employees',
                                        isFreeAction: true,
                                        onClick: (event) => {
                                            employees = []
                                            loadEmployees(RefreshEmployee)
                                        }
                                    }]}
                                />
                            </Grid>
                        </Grid>
                    </Container>
                </div>
            </main>
            <footer className={classes.footer}>
                <Copyright />
            </footer>
        </React.Fragment>
    );
}

export default Main;