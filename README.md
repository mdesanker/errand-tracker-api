# Errand App API

This is a REST API for an errand tracking app. It allows users to create errands, organize errands into projects, and share projects with friends. This API features user authentication with jsonwebtoken, password hashing with bcryptjs, and monster avatars with gravatar.

Users can create errands with title, description, due date, priority, project, and completion attributes. Projects can be created with title, description, and member attributes.A user can only edit an errand if they are the author, or are a member of the project the errand is assigned to. Members cannot modify the parent project themselves.

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
DB_URI={{database URI}}
KEY={{jwt key}}
```

To run all tests, remove the path. To run tests for a specific file, modify path in `test` script with desired fileName:

```json
"test": "cross-env NODE_ENV=test jest ./routes/__test__/user.test.js --testTimeout=10000 --detectOpenHandles --forceExit",
```

```bash
npm test
```

## Built with

- NodeJS/Express
- JWT Authentication
- MongoDB/Mongoose
- supertest

### To implement:

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
