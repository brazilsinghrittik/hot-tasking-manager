# HOT tasking-manager

## Intro
The app is split into a Client (AngularJS) and Server (Python) structure.  Each can be developed independently of each other.  See below for instructions on how to set up your deve environment.

[See our FAQ if you hit any problems getting setup](https://github.com/hotosm/tasking-manager/wiki/Dev-Environment-FAQ)


## Client Development
### Global Dependencies
Following must be available locally:

* NodeJS LTS v6+ [NodeJS LTS install here](https://nodejs.org/en/)
* [Gulp](http://gulpjs.com/) is used to run and build the app, install globally as follows:
    * ```npm install gulp -g```

### App Dependencies
You will now have to install all the app dependencies using [NPM](https://www.npmjs.com/)

```
cd client
npm install
```

### Running Locally
If you plan to do client development you can run the app using gulp, without having to worry too much about the server

```
cd client   [if not already in client]
gulp run
```

### Running Unit Tests
The client has a suite of [Jasmine](https://jasmine.github.io/) Unit Tests, that you can run using [Karma](https://karma-runner.github.io/1.0/index.html) as follows

```
 cd client    [if not already in client]
 karma start ..\tests\client\karma.conf.js
```

## Server Development
### Dependencies
Following must be available locally:

* Python 3.6 - [Python 3.6 install here](https://www.python.org/downloads/)

### Build the Server
* Create a Python Virtual Environment, using Python 3.6:
    * ```python -m venv ./venv```
* Activate your virtual environment:
    * Linux/Mac:
        * ```. ./venv/bin/activate```
    * Windows:
        * ```.\venv\scripts\activate```
* Install all dependencies:
    * ```pip install -r requirements.txt```
        
### Environment vars:
As the project is open source we have to keep secrets out of the repo.  You will need to setup the following env vars locally:

* **TM_DB** - This is the for the PostGIS connection string
* **TM_SECRET** - This is secret key for the TM app used by itsdangerous and flask-oauthlib for entropy
* **TM_CONSUMER_SECRET** - This is the OAUTH Consumer Secret used for authenticating the Tasking Manager App in OSM

* Linux/Mac
    * ```export TM_DB=postgresql://USER:PASSWORD@HOST/DATABASE```
    * ```export TM_SECRET=secret-key-here```
    * ```export TM_CONSUMER_SECRET=outh-consumer-secret-key-goes-here```
* Windows:
    * ```setx TM_DB "postgresql://USER:PASSWORD@HOST/DATABASE"```
    * ```setx TM_SECRET "secret-key-here"```
    * ```setx TM_CONSUMER_SECRET "outh-consumer-secret-key-goes-here"```

### Creating the DB
We use [Flask-Migrate](https://flask-migrate.readthedocs.io/en/latest/) to create the database from migrations directory.  Create the database as follows:

```
python manage.py db upgrade
```

### Running Locally

#### API Development only
If you plan to only work on the API you don't need to build the client and can run as follows:

* Run the server:
    * ``` python manage.py runserver -d ```
* Point your browser to:
    * [http://localhost:5000/api-docs](http://localhost:5000/api-docs)
    
#### Seeing the client
If you want to see the client you will need to follow all the instruction in **Client Development** section then build the client as follows:

* Build the client using gulp:
    * ```cd client```
    * ```gulp build```
* You can now run the server as above from the root dir:
    * ```cd ..```
    * ``` python manage.py runserver -d ```
* Point your browser to:
    * [http://localhost:5000](http://localhost:5000)

### Running Unit Tests
The project includes a suite of Unit and Integration tests that you should run after any changes

```
python -m unittest discover tests/server
```

## Dev Ops

### Server Config

#### Environment Vars

On boot the Tasking Manager App will look for the following environment vars:

* **TASKING_MANAGER_ENV** - Allows you to specify which config to load from ./server/config.py  Acceptable values:
    * **Dev** - This is the default
    * **Staging** - Use this for your staging/test environment
    * **Prod** - Use this for your production environment

