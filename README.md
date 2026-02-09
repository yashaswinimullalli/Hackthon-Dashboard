# Hackthon-Registration-Dashboard

A frontend-only web application that simulates how a real hackathon is managed — from participant registration to live check-in/check-out and team formation during the event.

This project is built using only frontend technologies and browser storage, without any backend services or authentication.

---

## Tech Stack
- HTML
- CSS
- Bootstrap
- JavaScript

---

## Project Scope
- Frontend-only application
- No backend
- No authentication
- All data is handled using frontend state and browser storage (`localStorage` / `sessionStorage`)

---

## 1. Hackathon Registration Module

### Registration Form Fields
- Full Name
- Email ID
- College / Organization
- Primary Skill
- Hackathon Track  
  (Web, AI/ML, Blockchain, Open Innovation)

### Registration Rules
- All fields are mandatory
- Email must be in a valid format
- Duplicate email registrations are not allowed
- Clear success and error messages are displayed
- The form resets automatically after successful registration

---

## 2. Participant Dashboard

### Information Displayed
- Name
- Email
- Hackathon Track
- Primary Skill
- Check-In Status (Checked-In / Checked-Out)
- Team Status (Assigned / Not Assigned)

### Dashboard Features
- Search participants by name or email
- Filter participants by hackathon track
- Sort participants alphabetically by name

---

## 3. Check-In / Check-Out Management

### Organizer Actions
- Check-in a participant when they arrive
- Check-out a participant when they leave

### Rules
- Only checked-out participants can be checked-in
- Only checked-in participants can be checked-out
- Checked-out participants:
  - Cannot be assigned to any team
  - Are automatically removed from their team if already assigned

---

## 4. Team Management Module

### Organizer Capabilities
- Create teams with a unique and non-empty team name
- Assign checked-in participants to teams
- Remove participants from teams
- View all teams and their respective members

---

## 5. Constraints (Frontend Logic Only)

The following constraints are strictly enforced through frontend logic:
- A participant can belong to only one team at a time
- A participant must be registered and checked-in before being assigned to a team
- Team names must be unique
- On participant check-out:
  - They are automatically unassigned from their team
- Team member lists update immediately
- Participant status and team data remain consistent at all times

---

## Data Storage
- All application data is stored and managed using browser storage (`localStorage` / `sessionStorage`)
