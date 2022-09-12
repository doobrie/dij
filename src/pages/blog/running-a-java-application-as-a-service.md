---
layout: $/layouts/post.astro
title: Running a Java Application as a Service
description: In this article, I'm going to show how to deploy an application to
  a service such as EC2 where we have full control over the platform. I'll be
  deploying onto a Linux EC2 instance that already has Java installed and
  concentrating on configuring a stable environment for a Java application.
tags:
  - aws
  - ec2
  - services
  - systemd
author: David Salter
authorTwitter: davidmsalter
date: 2021-06-27T21:22:19.987Z
image: https://res.cloudinary.com/davidsalter/image/upload/v1628719594/0_cR9_dkctpEzI6Vfo_wem4iq.jpg
category: development
---
With the advent of cloud computing, we now have many ways that we can deploy Java applications. For example, we can deploy them to an Iaas (Infrastructure as a service) such as Amazon [EC2](https://aws.amazon.com/ec2), or to a Paas (Platform as a service) such as [Amazon Elastic Beanstalk](https://aws.amazon.com/elasticbeanstalk) or also to a variety of other solutions.

In this article, I'm going to show how to deploy an application to a service such as EC2 where we have full control over the platform. I'll be deploying onto a Linux EC2 instance that already has Java installed and concentrating on configuring a stable environment for a Java application.

There are many ways that a Java application can be controlled within Linux. It can be started manually via the `java` command, or it can be deployed and ran as an executable (for example, via SpringBoot), or it can be ran as a service.

In this post, I'm going to show how to run a Java application (or any other application for that matter) as a system service. When running as a system service, we get the following benefits:

- We can specify the user the application runs as
- We can easily start and stop the application
- We can configure the application to automatically start up when the system boot
- We can configure the application to start again in the case of failure.

## Creating a Service

To create a service, I'm going to assume that we have a Jar packaged version of the application. This can be created by Maven with the package command:

```bash
mvn package
```

To control our application, we're going to run it as a systemd service. Wikipedia defines systemd as:

> a software suite that provides an array of system components for Linux operating systems. Its main aim is to unify service configuration and behavior across Linux distributions; systemd's primary component is a "system and service manager" - an init system used to bootstrap user space and manage user processes.

To create a service, we need to have the relevant access to the server, so we need to ensure we have `sudo` access.

The first stage in defining the application as a service, is to create a file within the `/etc/systemd/system` directory with a name of `myapp.service`

```bash
/etc/systemd/system/myapp.service
```

Within this file, we need to add 3 sections. `[Unit]` defines the description of the service, `[Service]` defines how the service is executed and `[Install]` tells the operating system when to run the application. For example

```bash
[Unit]
Description=My Application As A Service

[Service]
User=myapp_user
Group=myapp_group
Type=simple
ExecStart= java -jar /home/ubuntu/myapp/myapp.jar -Xmx512m –Xms512m -XX:MaxNewSize=384m -XX:MaxPermSize=128m
SuccessExitStatus=143

[Install]
WantedBy=multi-user.target
```

Let's take a look at each of these sections in turn.

## [Unit]

This section simply contains one entry which is the description of the service. Note, the name of the service is defined by the name of the file within the `/etc/systemd/system` directory.

## [Service]

This section defines details that the operating system requires to be able to start the service. Firstly, the User and Group specify the security details for the application to run. The application is run as this specified user and group and has their permissions.

`Type` can be set to `simple` for most cases. This defines that the application will run immediately without forking any other processes. For a definition of the other options available here, check out the [man pages](http://manpages.ubuntu.com/manpages/cosmic/man5/systemd.service.5.html) for systemd.

Next, `ExecStart` specifies the command that is used to run the application. Here, we specify the entire command line (including `java` and any parameters) to run the application. This can be very useful as we can specify which version of Java to use here, so an application can be configured to run with any required JVM, and not only with the system's default JVM. Any JVM properties or application variables can be configured here.

Finally, as we're running a Java application, we need to tell it how to play properly with systemd. When a Java application is killed via a SIGTERM event, the JVM will close down cleanly but will return an exit code of 143. Adding this as a `SuccessExitStatus` tells systemd that the application has closed cleanly in this situation.

## [Install]

The last section basically tells systemd that if the application is configured to start at server boot time, then do so as part of the normal boot process. This tells systemd that the application can start at boot time, but not that it necessarily will. Read on for how we do that.

## Controlling the Service

Once the `.service` file has been created, we need to tell systemd that we have a new service. This is achieved by executing:

```bash
sudo systemctl daemon-reload
```

Once executed, we can start and stop the service via:

```bash
sudo systemctl start myapp
sudo systemctl stop myapp
```

We can get the status of the application by executing:

```bash
sudo systemctl status myapp
```

Finally, if we want to tell the systemd to start the application at boot time, we can execute the following command:

```bash
sudo systemctl enable myapp
```

## Restarting upon Failure

Now that we've seen how to create and manage a service, the only thing remaining is to tell systemd to restart the service in case of a failure.

That can be achieved by adding the following entries into the `[Service]` section of the file.

```bash
Restart=on-failure
RestartSec=10s
```

This configuration tells systemd to restart the service 10s after a failure (you can obviously customise this to your required time interval).

There are other options available here, for example, when the service is to restart and how many attempts to be made. For more information, check out the [man pages](http://manpages.ubuntu.com/manpages/cosmic/man5/systemd.service.5.html) for systemd.

## Conclusion

In this post we've seen how to run a Java application as a service using systemd, and how to control it. We've seen how to start the service at boot time and how to restart the service upon failure.

## Credits

Photo by [Erik Mclean](https://unsplash.com/@introspectivedsgn?utm_source=medium&utm_medium=referral) on [Unsplash](https://unsplash.com?utm_source=medium&utm_medium=referral)