---
layout: $/layouts/post.astro
title: An Application Structure for Python REST APIs
description: In this article, I'm going to show the structure that I use for REST based APIs using Python. In Python, I use Flask to create APIs as I find this is easy to use, yet very powerful. This article isn't a tutorial on using Flask, rather I'm showcasing the project structure I currently use that allows me to develop and test Flask applications easily.
date: 2021-10-03
tags:
  - api
  - flask
  - python
author: David Salter
authorTwitter: davidmsalter
category: development
image: https://davidsalterassets.s3.eu-west-2.amazonaws.com/raghav-bhasin-c3sMNpS2-Dg-unsplash.jpg
---

## Introduction

In this article, I'm going to show the structure that I use for REST based APIs using Python. In Python, I use [Flask](https://flask.palletsprojects.com/en/2.0.x/) to create APIs as I find this is easy to use, yet very powerful. This article isn't a tutorial on using Flask, rather I'm showcasing the project structure I currently use that allows me to develop and test Flask applications easily.

If you've never used Flask before, its a lightweight framework that allows Python developers to create both Web Applications and Web APIs. It includes all the tools necessary and allows you to write easily testable applications. Flask can easily be installed into an application using `pip`

```bash
pip install flask
```

## Top level structure

The basic structure I like to use is shown below.

```text
.
├── application
│   ├── api
│   │   ├── <api definition>
│   │   └── <api definition>
│   ├── factory.py
│   ├── <logic classes>
├── app.py
├── Makefile
├── requirements.txt
└── tests
    ├── api
    │   ├── <api test>
    │   └── <api test>
    ├── context.py
    └── test_<logic classes>.py
```

Within this structure, there are two top level folders, `application` and `tests`. These are used for storing the application code and the test code respectively. I like to keep the test code separate from the application code and use this structure rather than placing the tests in the same folder as the application code.

Within the `application` and `tests` folders, there are individual files for each api I want to develop. Each of these corresponds to a different url.

## Main Python Classes

Within this directory structure, there are 3 Python files that are standard across each application:

- `app.py`
- `application/factory.py`
- `tests/context.py`

Lets take a look at each of these in turn.

### app.py

This is the main file to bootstrap the application and invokes the `create_app()` method in the `application/factory.py` class:

```python
from application.factory import create_app

app = create_app()

if __name__ == '__main__':
    app.run()
```

### application/factory.py

```python
from flask import Flask
from application.api.moon import moon
from application.api.sun import sun


def create_app():
    app = Flask(__name__)
    app.register_blueprint(api1, url_prefix=<api1>.url_prefix)
    app.register_blueprint(api2, url_prefix=<api2>.url_prefix)

    return app
```

This file creates a Flask application and registers the [Blueprints](https://flask.palletsprojects.com/en/2.0.x/blueprints/) for the different API endpoints.

Flask describes a blueprint as

> a set of operations which can be registered on an application, even multiple times.

Essentially in this example, this means that we can register a set of APIs within the application with each API being stored in a separate file. This allows us to easily create larger applications whilst maintaining smaller testable components.

### tests/context.py

This file allows the tests to be able to import the application logic when the tests are stored in a different folder to the applicaton source code.

```python
import application
import os
import sys


sys.path.insert(0, os.path.abspath(
    os.path.join(os.path.dirname(__file__), '..')))
```

## An example API

Using the [ephem](https://rhodesmill.org/pyephem/) library and the basic API structure above, lets see how we can write an API to return the phase of the moon on a given date.

### Defining Endpoints

To obtain the phase of the moon, I'm going to create three endpoints:

- /moon/
- /moon/phase
- /moon/phase/**yyyy**/**mm**/**dd**

To create the API, create a file called `application/api/moon.py`. To initialise the API with Flask, we need to register the Blueprint:

```python
from flask import Blueprint, Response
import json
import ephem
from ..moonphase import MoonPhase
import datetime
from datetime import date

moon = Blueprint('moon', __name__)
moon.url_prefix = '/moon'
```

This creates a `Blueprint` called `moon` at the endpoint of `/moon`

To create the first of our endpoints (`/moon/`), we need to define a method with a route of `/` (as the API itself has the url_prefix of `/moon`).

```python
@moon.route('/')
def index():
    return Response(json.dumps("Moon API"), mimetype=APPLICATION_JSON)
```

To create our second endpoint (`/moon/phase`), we're going to return the Moon phase for the current date. This can be achieved with the following code:

```python
@moon.route('/phase')
def phase_today():
    m = ephem.Moon()
    today = date.today()
    m.compute(today.strftime('%Y/%m/%d'))
    return Response(json.dumps(MoonPhase(round(m.moon_phase * 100, 1), today.year, today.month, today.day).__dict__),
                    mimetype=APPLICATION_JSON)
```

In this code, the method is decorated with the route `/phase` making the url end with `/moon/phase`. This method uses the `json.dumps` method to return a JSON representation of an instance of a `MoonPhase` class as the response.

`MoonPhase` is a `@dataclass` defined within the `application/moonphase.py` file

```python
from dataclasses import dataclass

@dataclass
class MoonPhase:
    '''Data object to be passed out from the api to the caller'''
    phase: float
    year: int
    month: int
    day: int
```

Finally, getting back to `moon.py`, the final API endpoint (`/moon/phase/yyyy/mm/dd`) can be defined as:

```python
@moon.route('/phase/<year>/<month>/<day>')
def phase_specific_day(year, month, day):
    m = ephem.Moon()
    m.compute(f'{year}/{month}/{day}')
    return Response(json.dumps(MoonPhase(round(m.moon_phase * 100, 1), year, month, day).__dict__),
                    mimetype=APPLICATION_JSON)
```

This method is almost identical to the previous, except that the year, month and day are passed in as parameters into the REST API.

## Testing the API

To test the API, we can use [PyTest](https://docs.pytest.org/en/6.2.x/) and write a test within the `tests/api` folder, for example:

```python
from application.factory import create_app
import pytest
from ..context import application


@pytest.fixture
def client():
    return create_app().test_client()


def test_home_route(client):
    response = client.get('/moon/')
    assert response.get_json() == 'Moon API', 'Route should return "Moon API"'


def test_moon_phase_today(client):
    response = client.get('/moon/phase')
    assert response.status_code == 200, 'Invalid status code'
    assert float(response.get_json()['phase']) > 0.0, 'Invalid phase'
    assert int(response.get_json()['year']) > 0, 'Invalid year'
    assert int(response.get_json()['month']) > 0, 'Invalid month'
    assert int(response.get_json()['day']) > 0, 'Invalid day'
```

## Conclusion

In this article, I've shown a standard template that can be used to develop and test Flask applications. I've then shown an example of adding an API using this template.

The code is stored in a modular fashion so the application can easily be enhanced with more APIs. Also, test application is structured so that tests can easily be written for each of the APIs and other classes within the application.

The complete source code associated with this article is available on [GitHub](https://github.com/doobrie/flask-api-template)

## Credits

Photo by <a href="https://unsplash.com/@myphotocave?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText">Raghav Bhasin</a> on <a href="https://unsplash.com/s/photos/flask?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText">Unsplash</a>
