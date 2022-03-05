# Errand Tracker App API

An errand tracking app where you can share lists with friends.

The [Errand Tracker App](https://mdesanker.github.io/errand-tracker-frontend)

## Table of Contents

- [Description](#Description)
- [Motivation](#Motivation)
- [How to set up locally](#How-to-set-up-locally)
- [Built with](#Built-with)
- [Challenges](#Challenges)
- [Links](#Links)

## Description

This the API for the [Errand Tracking App](https://github.com/mdesanker/errand-tracker-frontend).

This errand tracking app allows users to create errands with titles, due dates, and priorities. Errand completion status is toggled by clicking or pressing (mobile) the errand. Errands can be added to projects, which can be shared with and updated by friends.

## Motivation

This app was created to facilitate errand sharing with my partner. After the birth of our daughter, the number of errands we need to do has increased, while my ability to keep track of lists has decreased.

Using a shared project on this app, we can keep each other updated in real time on what needs to be bought and where.

## How to set up locally

```bash
git clone git@github.com:mdesanker/errand-tracker-api.git
cd errand-tracker-api
npm install
npm run serverstart
```

Running this API locally will require you to create a .env file in the root directory with the following variables:

```bash
PORT={{server port}}
DB_URI={{MongoDB URI}}
KEY={{JWT key}}
```

To run all tests, remove the path. To run tests for a specific file, modify path in `test` script with desired fileName:

```json
"test": "cross-env NODE_ENV=test jest ./routes/__test__/user.test.js --testTimeout=10000 --detectOpenHandles --forceExit",
```

```bash
npm test
```

## Built with

- NodeJS
- ExpressJS
- JWT Authentication
- MongoDB/Mongoose
- supertest

## Challenges

- The importance of planning - I started this project with only a rough idea of what I wanted to be able to do with the app, and what the model schemas should include, and then started coding. I could have saved a lot of time and effort by not writing endpoints that I ended up not using in the frontend.

## Links

- [Frontend repository](https://github.com/mdesanker/errand-tracker-frontend)
