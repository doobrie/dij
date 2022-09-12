---
layout: $/layouts/post.astro
title: Accessing a RDS Database Locally
description: Elastic Beanstalk (EB) is a Platform As A Service from AWS that allows you to easily deploy applications without having to worry about setting up the base infrastructure, such as HTTP servers, or load balancers. One of the benefits of EB is that is allows us to create a database on RDS when creating a new application, making the entire deployment of an application much easier.
tags:
  - aws
  - database
  - rds
author: David Salter
authorTwitter: davidmsalter
date: 2021-08-27T08:10:40.636Z
image: /assets/platter.jpg
category: development
---

## Introduction

Elastic Beanstalk (EB) is a Platform As A Service from AWS that allows you to easily deploy applications without having to worry about setting up the base infrastructure, such as HTTP servers, or load balancers. One of the benefits of EB is that is allows us to create a database on RDS when creating a new application, making the entire deployment of an application much easier.

## RDS

RDS however does not provide a user interface to execute SQL against a created database (unless its been created as an Aurora Serverless Database), so how can we execute SQL commands against the database? If we were deploying our application to an EC2 instance, we could simply log onto the instance and connect directly to the database using a tool such as `mysql`. We can’t do this with EB, however, but we can connect to the database from our local PC.

When creating the database from EB, we get the option of specifying whether we want the database to be publicly accessible. This is the first step to being able to connect to an RDS database. So, let’s try and connect and see what happens.

### RDS Console

Browsing to the RDS console, we can see the connection details for all our RDS databases, for example:

![RDS Connectivity](https://davidsalterassets.s3.eu-west-2.amazonaws.com/rds/rds1.png)

On this screen, we can see the endpoint, so let’s try connecting from the MySQL Workbench client. (Don’t try connecting to my database – I’ve deleted it for security purposes so the endpoint in this article doesn’t exist anymore).

### RDS endpoint

If we enter the endpoint and username and password in MySQL Workbench, we’ll see an error indicating that a connection could not be made to the database.

![MySQL Workbench Connection Error](https://davidsalterassets.s3.eu-west-2.amazonaws.com/rds/rds2.png)

So why do we get this error? Well, when we created the EB application, AWS created a VPC and added some security groups that explicitly deny access from outside of the VPC.

## RDS security

From the RDS Console, we can see the `Security Group Rules` and can see that we have both an Inbound and Outbound set of rules.

### Outbound rules

The outbound rule is set to allow all traffic to any address, however the inbound rule only allows inbound traffic from within the VPC.

### Inbound rules

We can change this by editing the Inbound Rules and adding a new rule, specifying the address we will allow inbound data to originate from.

![Security Group Inbound Rules](https://davidsalterassets.s3.eu-west-2.amazonaws.com/rds/rds3.png)

This `source` address can be any custom IP address, however, the option `My IP` is available to explicitly only allow access from your current IP address.

![Source IP Address](https://davidsalterassets.s3.eu-west-2.amazonaws.com/rds/rds4.png)

Note, if you have a dynamic IP address, next time you connect to the internet your IP address may change and you won’t be allowed to access, but the user with your previous IP address will. Please be aware of this!

![Inbound Security Rules](https://davidsalterassets.s3.eu-west-2.amazonaws.com/rds/rds5.png)

Once we’ve added a new rule, we can connect from MySQL workbench on our local PC and execute the required SQL against the database.

## Conclusion

In this post, I’ve shown how you can connect to a RDS instance from a local application (MySQL Workbench in this example).

_Please be careful when editing Security Groups in AWS, as you can lock yourself out of your system, or can easily allow access for potentially malicious users_. For more information, please checkout the documentation at [AWS](https://docs.aws.amazon.com/vpc/latest/userguide/VPC_SecurityGroups.html).

## Credits

Photo by [benjamin lehman](https://unsplash.com/@benjaminlehman?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText) on [Unsplash](https://unsplash.com/s/photos/database?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText").
