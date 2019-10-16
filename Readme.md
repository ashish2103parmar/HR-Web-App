Demo Web App

* Prerequisites
1. Set up AWS Account

2. Set up Environment

    a. Install AWS CLI, Node.js, React.js and other dependencies

    b. Configure aws credentials

    c. Setup Node.js Project
        Install Graphql, Express

    d. Setup React.js Project

* AWS Resources
1. Dynamodb Setup

    a. Directory Table (dir-table)
        partition key   : id
        gobal secondary index (type-index) : type

    b. Report Table (report-table)
        partition key   : reportid
        gobal secondary index (empid-index) : empid

2. S3
    a. Front-End Application Bucket
    b. Image Bucket

3. ACM SSL Configure

4. ELB - EC2 Configure

5. CloudFront Configure

6. Route 53 Configure

* Application
1. API server
    Express + GraphQL
    
    Setup:
        Configure and Zip API Server Folder
        Put Zip File in S3 and run Code Deploy

2. Front-End
    React.js with Material-ui