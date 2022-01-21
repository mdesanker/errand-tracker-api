# Errand App API

This is a REST API for an errand tracking app. It allows users to create errands, organize errands into projects, and share projects with friends.

Users can create errands with title, description, due date, priority,project, and completion attributes. Projects can be created with title, description, and member attributes. Members have the ability to edit project errands, but cannot modify the parent project themselves.

## Functionality/Endpoints

### Users

- [x] Register account
- [x] Login
- [x] Send friend request
- [x] Accept friend request
- [] Decline friend request
- [x] Unfriend

### Errands

- [x] Get all errands
- [x] Get errands for user
- [x] Get errands for project
- [x] Get errand by id
- [x] Create errand
- [x] Update errand (author or member)
- [x] Toggle errand complete status (author or member)
- [x] Delete errand (author or member)

### Projects

- [x] Get all projects
- [x] Get all projects for user
- [x] Get project by id
- [x] Create project
- [x] Update project title/description
- [x] Add member to project
- [x] Remove member from project
- [x] Delete project (deletes all associated errands)

## Built with

- NodeJS/Express
- JWT Authentication
- MongoDB/Mongoose
- supertest
