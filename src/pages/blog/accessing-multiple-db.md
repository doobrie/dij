---
layout: $/layouts/post.astro
title: Accessing Multiple Databases From a Spring Boot Application
description: When developing any application, it’s quite common to have to access multiple databases. Out of the box, Spring Boot provides easy access to a single datasource, in the simplest case just by specifying the JDBC driver on the class path!
date: 2021-07-11
tags:
  - spring
  - database
  - springboot
author: David Salter
authorTwitter: davidmsalter
category: development
image: /assets/0__O6IcRxOYfU2xiiD_pnjge8.jpeg
---

## Introduction

When developing any application, it’s quite common to have to access multiple databases. Out of the box, Spring Boot provides easy access to a single datasource, in the simplest case just by specifying the JDBC driver on the class path!

Accessing multiple databases however, is still straightforward with Spring Boot. This article shows how to connect to two different MySql datasources from a Spring Boot application.

To showcase how to connect to to different databases, consider a products database and a customer database, with the following simplistic schema and data.

### Database One - Products Database

#### Schema

```sql
create table PRODUCT(id integer, name varchar(255));
```

#### Data

```sql
insert into PRODUCT(id, name) values (1, ‘XBox');
```

### Database Two - Customer Database

#### Schema

```sql
create table CUSTOMER(id integer, name varchar(255));
```

#### Data

```sql
insert into CUSTOMER(id, name) values (1, 'Daphne Jefferson’);
```

To access the databases, we need to declare a `JdbcTemplate` for each database. In Spring, JdbcTemplates are created from a `DataSource` which has a set of connection properties (url, username, password etc.)

```java
@Configuration
public class DataSourceConfig {

  Bean
  @Qualifier("customerDataSource")
  @Primary
  @ConfigurationProperties(prefix="customer.datasource")
  DataSource customerDataSource() {
    return DataSourceBuilder.create().build();
  }

  @Bean
  @Qualifier("productDataSource")
  @ConfigurationProperties(prefix="product.datasource")
  DataSource productDataSource() {
    return DataSourceBuilder.create().build();
  }

  @Bean
  @Qualifier("customerJdbcTemplate")
  JdbcTemplate customerJdbcTemplate(@Qualifier("customerDataSource")DataSource customerDataSource) {
    return new JdbcTemplate(customerDataSource);
  }

  @Bean
  @Qualifier("productJdbcTemplate")
  JdbcTemplate productJdbcTemplate(@Qualifier("productDataSource")DataSource productDataSource) {
    return new JdbcTemplate(productDataSource);
  }
}
```

In the above code we can see that a `@Configuration` bean has been declared that defines a `customerDatasource` and a `customerJdbcTemplate`. Each of these beans are annotated with the `@Qualifier('customer...')` to identify them as relating to the customer database.

Similarly, the above code defines a `productDataSource` and a `productJdbcTemplate`. Again these are annotated with `@Qualifier('product...')` to identify them as relating to the product database.

Finally, each `DataSource` Bean is annotated with the `@ConfigurationProperties(prefix="...datasource")` annotation. This tells Spring Boot what properties within the `application.properties` file should be used for connecting to each database. The `application.properties` file therefore looks like the following:

```properties
product.datasource.url = jdbc:mysql://localhost:3306/dbOne
product.datasource.username = user1
product.datasource.password = password
product.datasource.driverClassName = com.mysql.jdbc.Driver

customer.datasource.url = jdbc:mysql://localhost:3306/dbTwo
customer.datasource.username = user2
customer.datasource.password = password
customer.datasource.driverClassName = com.mysql.jdbc.Driver
```

Now that we've seen how to create a `DataSource` and `JdbcTemplate`, the `JdbcTemplate` can be injected into a `@Repository` for use, e.g.

```java
@Repository
public class CustomerRepository {

  private static final String SELECT_SQL = "select NAME from CUSTOMER where ID=?";
  @Autowired
  @Qualifier("customerJdbcTemplate")
  JdbcTemplate customerJdbcTemplate;

  public String getCustomerName(int id) {
    String name = customerJdbcTemplate.queryForObject(SELECT_SQL, new Object[] {id}, String.class);

    return name;
  }
}
```

Again, note the use of the `@Qualifier` annotation to specify which `JdbcTemplate` is required for the different repositories.

The `ProductRepository` is similarly written to access the `productJdbcTemplate`

```java
@Repository
public class ProductRepository {

  private static final String SELECT_SQL = "select NAME from PRODUCT where ID=?";
  @Autowired
  @Qualifier("productJdbcTemplate")
  JdbcTemplate productJdbcTemplate;

  public String getProductName(int id) {
    String name = productJdbcTemplate.queryForObject(SELECT_SQL, new Object[] {id}, String.class);

    return name;
  }
}
```

With a few simple steps, Spring Boot allows us to easily connect to multiple databases when using JdbcTemplates.

## Credits

Photo by [Jan Antonin Kolar](https://unsplash.com/@jankolar?utm_source=medium&utm_medium=referral) on [Unsplash](https://unsplash.com/?utm_source=medium&utm_medium=referral)
