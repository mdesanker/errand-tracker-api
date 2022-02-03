# Errand Tracker App API

An errand tracking app where you can share lists with friends.

The [Errand Tracker App](https://mdesanker.github.io/errand-tracker-frontend)

## Table of Contents

- [Description](#Description)
- [Motivation](#Motivation)
- [How to set up locally](#How-to-set-up-locally)
- [Built with](#Built-with)
- [Endpoint checklist](#Endpoint-checklist)
- [Lessons learned](#Lessons-learned)
- [Links](#Links)

## Description

This the API for the [Errand Tracking App](https://github.com/mdesanker/errand-tracker-frontend).

This errand tracking app allows users to create errands with titles, due dates, and priorities. Errand completion status is toggled by clicking or pressing (mobile) the errand. Errands can be added to projects, which can be shared with and updated by friends.

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

## Endpoint checklist:

**Users**

- [x] Register account
- [x] Login
- [x] Send friend request
- [x] Accept friend request
- [x] Decline friend request
- [x] Unfriend

**Errands**

- [x] Get all errands
- [x] Get errands for user
- [x] Get errands for project
- [x] Get errand by id
- [x] Create errand
- [x] Update errand (author or member)
- [x] Toggle errand complete status (author or member)
- [x] Delete errand (author or member)

**Projects**

- [x] Get all projects
- [x] Get all projects for user
- [x] Get project by id
- [x] Create project
- [x] Update project title/description
- [x] Add member to project
- [x] Remove member from project
- [x] Delete project (deletes all associated errands)

## Lessons learned

- The importance of planning - I started this project with only a rough idea of what I wanted to be able to do with the app, and what the model schemas should include, and then started coding. I could have saved a lot of time and effort by not writing endpoints that I ended up not using in the frontend.

- Test driven development of the REST API using the supertest library makes writing endpoints much more efficient.

## Links

- [Frontend repository](https://github.com/mdesanker/errand-tracker-frontend)
