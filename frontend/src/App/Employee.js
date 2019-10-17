import React from 'react';
import AppBar from '@material-ui/core/AppBar';
import Button from '@material-ui/core/Button';
import OfficeIcon from '@material-ui/icons/Business';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import CssBaseline from '@material-ui/core/CssBaseline';
import Grid from '@material-ui/core/Grid';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import { makeStyles } from '@material-ui/core/styles';
import Container from '@material-ui/core/Container';

import Copyright from './Components/Copyright';
import IconButton from '@material-ui/core/IconButton';

import APIRequest from './js/APIRequest';
import { CardHeader, TextField, ButtonGroup, MenuItem, Switch, FormControlLabel } from '@material-ui/core';
import MaterialTable from 'material-table';
import SyncIcon from '@material-ui/icons/Sync'
import LockIcon from "@material-ui/icons/Lock"
import ChangePassword from './Components/ChangePassword'

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
var reports = []
var roles = []

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

function loadEmployeeInfo(id, setEmployee) {
    api.request(`
        query EmployeeInfo($id: ID!){
            employeeInfo (employeeID: $id) {
                id
                name
                roleID
                address
                email
                mobile
                bank {
                    name
                    IFSC
                    accNo
                }
                isActive
                error {
                    code
                    msg
                }
            }
        }
    `, { id }).then(r => r.json()).then(d => {
        if (d.data) {
            const emp = d.data.employeeInfo
            if (emp.error) {
                console.error(emp.error)
            } else {
                delete emp.error
                setEmployee(emp)
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

function loadReports(id, Refresh, nextToken) {
    api.request(`
        query ListReport($id: ID!, $nextToken: String) {
            listReport(employeeID: $id, nextToken: $nextToken) {
                reports {
                    id
                    workHours
                    description
                    role {
                        name
                        perHourRate
                    }
                    amount
                    status
                    paymentID
                }
                error {
                    code
                    msg
                }
                nextToken
            }
        }
    `, { id, nextToken }).then(r => r.json()).then(d => {
        if (d.data && d.data.listReport) {
            if (d.data.listReport.error) {
                console.error(d.data.listReport.error)
            } else {
                var report = d.data.listReport.reports.map(r => ({
                    id: r.id,
                    workHours: r.workHours,
                    description: r.description,
                    name: r.role.name,
                    perHourRate: r.role.perHourRate,
                    amount: r.amount,
                    status: r.status,
                    paymentID: r.paymentID,
                }))
                reports = [...reports, ...report]
                Refresh()
                if (d.data.listReport.nextToken)
                    loadReports(id, Refresh, d.data.listReport.nextToken)
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

function Employee(props) {
    const classes = useStyles();
    const user = props.user
    const id = props.match.params.id

    const [refresh, setRefresh] = React.useState(0)

    const Refresh = () => setRefresh(refresh + 1)

    const [refreshRoles, setRefreshRoles] = React.useState(0)

    const RefreshRoles = () => setRefreshRoles(refreshRoles + 1)

    const [employee, setEmployee] = React.useState({
        id: "",
        name: "",
        roleID: "",
        address: "",
        email: "",
        mobile: "",
        isActive: true,
        bank: {
            name: "",
            IFSC: "",
            accNo: ""
        }
    })

    const handleChange = (key, value) => {
        setEmployee({ ...employee, [key]: value })
    }

    api = new APIRequest("http://localhost:8080/graphql", props.user)

    if (user && user.type === "admin" && !roles.length)
        loadRoles(RefreshRoles);

    if (id !== "new" && employee.id === "") {
        loadEmployeeInfo(id, setEmployee);
        reports = []
        loadReports(id, Refresh);
    }

    var changePassword;

    return (
        <React.Fragment>
            <CssBaseline />
            <AppBar position="static">
                <Toolbar>
                    <IconButton color="inherit" onClick={() => {
                        if (user && user.type === "admin") {
                            props.history.push('/')
                        }
                    }} >
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
                <ChangePassword openCallback={(callback) => {
                    changePassword = callback
                }} onSubmit={(data) => {
                    api.request(`
                        mutation ChangePassword($oldPassword: String!, $newPassword: String!) {
                            changePassword(oldPassword: $oldPassword, newPassword: $newPassword) {
                                error {
                                    code
                                    msg
                                }
                            }
                        }
                    `, { oldPassword: data.oldPassword, newPassword: data.newPassword }).then(r => r.json()).then(d => {
                        if (d.data && d.data.changePassword) {
                            if (d.data.changePassword.error) {
                                console.error(d.data.changePassword.error)
                            } else {
                                alert("Change Password Successful")
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
                }} />
                <div className={classes.body}>
                    <Container>
                        <Grid container spacing={4} >
                            <Grid item sm={12}>
                                <Card>
                                    <CardHeader title={id === "new" ? "Register Employee" : "Employee Details"}
                                        action={
                                            id !== "new" && <ButtonGroup>
                                                <IconButton title="Sync"
                                                    onClick={() => {
                                                        reports = []
                                                        loadEmployeeInfo(id, setEmployee)
                                                        loadReports(id, Refresh)
                                                    }}>
                                                    <SyncIcon />
                                                </IconButton>
                                                <IconButton title={user && user.type === "admin" ? "Reset Password" : "Change Password"} onClick={() => {
                                                    if (user && user.type === "admin") {
                                                        api.request(`
                                                            mutation ResetPassword($id: ID!) {
                                                                resetPassword(employeeID: $id) {
                                                                    error {
                                                                        code
                                                                        msg
                                                                    }
                                                                }
                                                            }
                                                        `, { id }).then(r => r.json()).then(d => {
                                                            if (d.data && d.data.resetPassword) {
                                                                if (d.data.resetPassword.error) {
                                                                    console.error(d.data.resetPassword.error)
                                                                } else {
                                                                    alert("Password Reset Successful")
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
                                                    } else {
                                                        changePassword()
                                                    }
                                                }}>
                                                    <LockIcon />
                                                </IconButton>
                                            </ButtonGroup>
                                        } />
                                    <CardContent>
                                        <form onSubmit={event => {
                                            event.preventDefault()
                                            api.request(`
                                                mutation Employee ($employee: Employee!) {
                                                    ${ id === "new" ? "registerEmployee( newEmployee" : "updateEmployee(employee"}: $employee) {
                                                        id
                                                        error {
                                                            code
                                                            msg
                                                        }
                                                    }
                                                }
                                            `, {
                                                employee
                                            }).then(r => r.json()).then(d => {
                                                if (d.data) {
                                                    const emp = id === "new" ? d.data.registerEmployee : d.data.updateEmployee
                                                    if (emp.error) {
                                                        console.error(emp.error)
                                                    } else {
                                                        if (id === "new") {
                                                            props.history.push("/employee/" + emp.id)
                                                        }
                                                        else {
                                                            alert("Employee Details Updated")
                                                        }
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
                                        }}>
                                            <Grid container spacing={3}>
                                                <Grid item xs={8} sm={3} lg={2} >
                                                    <TextField
                                                        label="EmployeeID"
                                                        value={employee.id}
                                                        disabled
                                                        InputLabelProps={{
                                                            shrink: true,
                                                        }}
                                                        fullWidth
                                                    />
                                                </Grid>
                                                <Grid item xs={4} sm={2} lg={1}>
                                                    <FormControlLabel
                                                        labelPlacement="top"
                                                        control={
                                                            <Switch
                                                                size="small"
                                                                checked={employee.isActive}
                                                                onChange={(event) => handleChange("isActive", event.target.checked)}
                                                                color="primary"
                                                                disabled={user && user.type !== "admin"}
                                                            />
                                                        }
                                                        label="Active"
                                                    />
                                                </Grid>
                                                <Grid item xs={12} sm={7} lg={4}>
                                                    <TextField
                                                        label="Name"
                                                        value={employee.name}
                                                        InputLabelProps={{
                                                            shrink: true,
                                                        }}
                                                        fullWidth
                                                        disabled={user && user.type !== "admin"}
                                                        required
                                                        onChange={(event) => handleChange("name", event.target.value)}
                                                    />
                                                </Grid>
                                                <Grid item xs={8} sm={4} lg={2}>
                                                    {user && user.type === "admin" ?
                                                        <TextField
                                                            label="RoleID"
                                                            value={employee.roleID}
                                                            InputLabelProps={{
                                                                shrink: true,
                                                            }}
                                                            fullWidth
                                                            select
                                                            required
                                                            onChange={(event) => handleChange("roleID", event.target.value)}
                                                        >
                                                            {
                                                                roles.map((option => (
                                                                    <MenuItem key={option.id} value={option.id}>
                                                                        {option.id}
                                                                    </MenuItem>
                                                                )))
                                                            }
                                                        </TextField> :
                                                        <TextField
                                                            label="RoleID"
                                                            value={employee.roleID}
                                                            InputLabelProps={{
                                                                shrink: true,
                                                            }}
                                                            fullWidth
                                                            disabled={true}
                                                        />
                                                    }
                                                </Grid>
                                                <Grid item xs={12} sm={8} lg={3}>
                                                    <TextField
                                                        label="Mobile"
                                                        value={employee.mobile}
                                                        InputLabelProps={{
                                                            shrink: true,
                                                        }}
                                                        fullWidth
                                                        disabled={user && user.type !== "admin"}
                                                        required
                                                        onChange={(event) => handleChange("mobile", event.target.value)}
                                                    />
                                                </Grid>
                                                <Grid item xs={12} lg={7}>
                                                    <TextField
                                                        label="address"
                                                        value={employee.address}
                                                        InputLabelProps={{
                                                            shrink: true,
                                                        }}
                                                        fullWidth
                                                        disabled={user && user.type !== "admin"}
                                                        required
                                                        onChange={(event) => handleChange("address", event.target.value)}
                                                    />
                                                </Grid>
                                                <Grid item xs={12} md={6} lg={5}>
                                                    <TextField
                                                        label="Email"
                                                        value={employee.email}
                                                        InputLabelProps={{
                                                            shrink: true,
                                                        }}
                                                        type="email"
                                                        fullWidth
                                                        disabled={user && user.type !== "admin"}
                                                        required
                                                        onChange={(event) => handleChange("email", event.target.value)}
                                                    />
                                                </Grid>

                                                <Grid item xs={12} md={6} lg={4}>
                                                    <TextField
                                                        label="Bank"
                                                        value={employee.bank.name}
                                                        InputLabelProps={{
                                                            shrink: true,
                                                        }}
                                                        fullWidth
                                                        disabled={user && user.type !== "admin"}
                                                        required
                                                        onChange={(event) => handleChange("bank", { ...employee.bank, name: event.target.value })}
                                                    />
                                                </Grid>
                                                <Grid item xs={12} md={6} lg={4}>
                                                    <TextField
                                                        label="Account No"
                                                        value={employee.bank.accNo}
                                                        InputLabelProps={{
                                                            shrink: true,
                                                        }}
                                                        onChange={(event) => handleChange("bank", { ...employee.bank, accNo: event.target.value })}
                                                        fullWidth
                                                        disabled={user && user.type !== "admin"}
                                                        required
                                                    />
                                                </Grid>
                                                <Grid item xs={12} md={6} lg={4}>
                                                    <TextField
                                                        label="IFSC"
                                                        value={employee.bank.IFSC}
                                                        InputLabelProps={{
                                                            shrink: true,
                                                        }}
                                                        onChange={(event) => handleChange("bank", { ...employee.bank, IFSC: event.target.value })}
                                                        fullWidth
                                                        disabled={user && user.type !== "admin"}
                                                        required
                                                    />
                                                </Grid>
                                                <Grid item xs={false} md={2} />
                                                {
                                                    user && user.type === "admin" && <Grid item xs={12} md={8}>
                                                        <ButtonGroup fullWidth variant="contained">
                                                            <Button color="primary" type="submit">
                                                                {id === "new" ? "Register" : "Update"}
                                                            </Button>
                                                            <Button color="secondary" onClick={() => {
                                                                props.history.push("/")
                                                            }}>
                                                                Back
                                                            </Button>
                                                        </ButtonGroup>
                                                    </Grid>
                                                }
                                            </Grid>
                                        </form>
                                    </CardContent>
                                </Card>
                            </Grid>

                            {id !== "new" && <Grid item xs={12}>
                                <MaterialTable
                                    title="Report"
                                    columns={[
                                        { title: 'ReportID', field: 'id', editable: "never" },
                                        { title: 'Work Hours', field: 'workHours', type: "numeric" },
                                        { title: 'Description', field: 'description', },
                                        { title: "Role", field: "name", editable: "never" },
                                        { title: '$/Hour', field: 'perHourRate', editable: "never" },
                                        { title: 'Amount ($)', field: 'amount', editable: "never" },
                                        { title: 'Status', field: 'status', editable: "never" },
                                        { title: 'PaymentID', field: 'paymentID', editable: "never" }
                                    ]}
                                    data={reports}
                                    options={{
                                        actionsColumnIndex: -1,
                                    }}
                                    editable={user && user.type === "admin" ? {
                                        onRowAdd: report => new Promise((resolve, reject) => {
                                            if (report.workHours && report.description) {
                                                report.workHours = parseFloat(report.workHours)
                                                api.request(`
                                                        mutation ReportWorkHours($id: ID!, $workHours: Int!, $description: String!) {
                                                            reportWorkHours(employeeID: $id, workHours: $workHours, description: $description) {
                                                                id
                                                                workHours
                                                                description
                                                                role {
                                                                    name
                                                                    perHourRate
                                                                }
                                                                amount
                                                                status
                                                                paymentID
                                                                error {
                                                                    code
                                                                    msg
                                                                }
                                                            }
                                                        }
                                                    `, { id, workHours: report.workHours, description: report.description }).then(r => r.json()).then(d => {
                                                    if (d.data && d.data.reportWorkHours) {
                                                        if (d.data.reportWorkHours.error) {
                                                            console.error(d.data.reportWorkHours.error)
                                                            reject()
                                                        } else {
                                                            var report = {
                                                                id: d.data.reportWorkHours.id,
                                                                workHours: d.data.reportWorkHours.workHours,
                                                                description: d.data.reportWorkHours.description,
                                                                name: d.data.reportWorkHours.role.name,
                                                                perHourRate: d.data.reportWorkHours.role.perHourRate,
                                                                amount: d.data.reportWorkHours.amount,
                                                                status: d.data.reportWorkHours.status,
                                                                paymentID: d.data.reportWorkHours.paymentID,
                                                            }
                                                            reports = [...reports, report]
                                                            Refresh()
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
                                    } : {}}
                                    actions={user && user.type === "admin" ? [{
                                        icon: 'payment',
                                        tooltip: 'Make Payment',
                                        onClick: (event, data) => {
                                            if (data.status === "Pending") {
                                                api.request(`
                                                        mutation MakePayment($id: ID!) {
                                                            makePayment(reportID: $id) {
                                                                id
                                                                workHours
                                                                description
                                                                role {
                                                                    name
                                                                    perHourRate
                                                                }
                                                                amount
                                                                status
                                                                paymentID
                                                                error {
                                                                    code
                                                                    msg
                                                                }
                                                            }
                                                        }
                                                    `, { id: data.id }).then(r => r.json()).then(d => {
                                                    if (d.data && d.data.makePayment) {
                                                        if (d.data.makePayment.error) {
                                                            console.error(d.data.makePayment.error)
                                                        } else {
                                                            var report = {
                                                                id: d.data.makePayment.id,
                                                                workHours: d.data.makePayment.workHours,
                                                                description: d.data.makePayment.description,
                                                                name: d.data.makePayment.role.name,
                                                                perHourRate: d.data.makePayment.role.perHourRate,
                                                                amount: d.data.makePayment.amount,
                                                                status: d.data.makePayment.status,
                                                                paymentID: d.data.makePayment.paymentID,
                                                            }
                                                            const idx = reports.findIndex((value) => (value.id === data.id))
                                                            reports[idx] = report
                                                            Refresh()
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
                                        }
                                    }] : []}
                                />
                            </Grid>}
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

export default Employee;