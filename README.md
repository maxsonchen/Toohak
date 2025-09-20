# Toohak Backend

<div align="center">

<img src="https://raw.githubusercontent.com/maxsonchen/Toohak/main/assets/toohak-logo.png" alt="Toohak Logo" width="200" height="200"/>

**Robust, scalable backend architecture powering an interactive Kahoot-style quiz platform**

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![Express.js](https://img.shields.io/badge/Express.js-4.0+-lightgrey.svg)](https://expressjs.com/)
[![Build Status](https://img.shields.io/badge/Grade-High_Distinction-green50C878.svg)](https://github.com/maxsonchen/Toohak)
[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/maxsonchen/Toohak/releases)

</div>

## 🎯 Project Overview

This repository contains the **backend infrastructure** for Toohak, a comprehensive quiz platform designed as a modern alternative to Kahoot. Developed as part of a collaborative university team project, this backend serves as the foundation for a dynamic, real-time multiplayer quiz experience that educators and trainers can use to create engaging learning environments.

The backend handles everything from user authentication and quiz management to real-time gameplay coordination and comprehensive analytics, built with modern Node.js/TypeScript architecture and industry-standard development practices.

## 🏆 Key Backend Contributions & Technical Achievements

### Core Backend Development
- **RESTful API Architecture**: Comprehensive API with 25+ endpoints handling all quiz platform functionality
- **Real-time Game Engine**: Custom game state management system supporting concurrent multiplayer sessions
- **Authentication System**: Secure session-based authentication with SHA256 password hashing
- **Data Management**: Robust data persistence with JSON-based storage and validation layers
- **Game State Machine**: Complex state management for quiz progression (LOBBY → QUESTION_COUNTDOWN → QUESTION_OPEN → QUESTION_CLOSE → ANSWER_SHOW → FINAL_RESULTS → END)

### Advanced Backend Features
- **Session Management**: Multi-session support allowing users to be logged in across devices
- **Input Validation**: Comprehensive validation middleware for all user inputs and data
- **Error Handling**: Centralized error handling with custom error classes and proper HTTP status codes
- **Game Timers**: Automated game progression with configurable timing systems
- **Real-time Analytics**: Live calculation of player scores, rankings, and question statistics
- **Auto-scaling Game Logic**: Support for variable player counts and automatic game start functionality

### Performance & Architecture
- **Modular Design**: Clean separation of concerns with dedicated modules for auth, quiz, game, and player logic
- **TypeScript Implementation**: Full type safety with comprehensive interfaces and type definitions
- **Efficient Data Structures**: Optimized data models for quiz questions, game sessions, and player management
- **Memory Management**: Proper cleanup of game timers and session data
- **Scalable Architecture**: Designed to handle multiple concurrent quiz sessions with hundreds of participants

## 🛠️ Technology Stack & Implementation

### Core Technologies
```typescript
// Backend Framework
Node.js + Express.js + TypeScript

// Data Management
JSON-based persistent storage
Custom data validation layers

// Authentication & Security
SHA256 cryptographic hashing
Session-based authentication
Input sanitization & validation

// Development & Quality
Jest (Testing Framework)
ESLint + Prettier (Code Quality)
Morgan (HTTP Logging)
CORS (Cross-Origin Support)
```

### System Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API   │    │   Data Store    │
│   (University)  │◄──►│   (Team Work)   │◄──►│   JSON Files    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │   Game Timers   │
                       │   & State Mgmt  │
                       └─────────────────┘
```

## 📡 API Endpoints Implementation

### Authentication & User Management
```typescript
POST   /v1/admin/auth/register     // User registration with validation
POST   /v1/admin/auth/login        // Session-based authentication  
POST   /v1/admin/auth/logout       // Session cleanup
GET    /v1/admin/user/details      // User profile retrieval
PUT    /v1/admin/user/details      // Profile updates with validation
PUT    /v1/admin/user/password     // Secure password updates
```

### Quiz Management System
```typescript
GET    /v1/admin/quiz/list         // User's quiz collection
POST   /v1/admin/quiz              // Quiz creation with validation
GET    /v1/admin/quiz/:id          // Quiz details and questions
PUT    /v1/admin/quiz/:id/name     // Quiz name updates
PUT    /v1/admin/quiz/:id/description  // Description management
DELETE /v1/admin/quiz/:id          // Quiz deletion (v1 & v2)
PUT    /v1/admin/quiz/:id/thumbnail    // Thumbnail URL management
```

### Question Management
```typescript
POST   /v1/admin/quiz/:id/question      // Question creation
PUT    /v1/admin/quiz/:id/question/:qid // Question updates
DELETE /v1/admin/quiz/:id/question/:qid // Question deletion
```

### Game Session Management
```typescript
POST   /v1/admin/quiz/:id/game/start    // Create game session
GET    /v1/admin/quiz/:id/game/:gid     // Game status monitoring
PUT    /v1/admin/quiz/:id/game/:gid     // Game state transitions
GET    /v1/admin/quiz/:id/game/:gid/results  // Final results
GET    /v1/admin/quiz/:id/games         // Active/inactive games list
```

### Player Interaction Endpoints
```typescript
POST   /v1/player/join                          // Join game session
GET    /v1/player/:id                           // Player status
GET    /v1/player/:id/question/:pos             // Question data
PUT    /v1/player/:id/question/:pos/answer      // Submit answers
GET    /v1/player/:id/question/:pos/results     // Question results
GET    /v1/player/:id/results                   // Final player results
```

## 🏗️ Data Architecture & Models

### Core Data Structures
```typescript
// User Management
interface UserProperties {
  userId: number;
  nameFirst: string;
  nameLast: string;
  email: string;
  password: string;          // SHA256 hashed
  usedPasswords: string[];   // Password history
  numSuccessfulLogins: number;
  numFailedPasswordsSinceLastLogin: number;
  sessions: Session[];       // Multi-session support
}

// Quiz Structure
interface Quiz {
  quizId: number;
  ownerId: number;
  name: string;
  description: string;
  timeCreated: number;
  timeLastEdited: number;
  thumbnailUrl: string;
  timeLimit: number;         // Calculated from questions
  numQuestions: number;
  questions: QuizQuestionsComplete[];
}

// Game Session Management
interface QuizGame extends Quiz {
  gameId: number;
  state: GameState;          // State machine implementation
  autoStartNum: number;      // Auto-start when X players join
  players: Player[];
  atQuestion: number;        // Current question index
  questionOpenTime?: number; // For timing calculations
  answerTimes: { [playerId: number]: number };
  questionResults: questionResults[];
  usersRankedByScore: userScoreDetails[];
}

// Game State Machine
enum GameState {
  LOBBY = 'LOBBY',
  QUESTION_COUNTDOWN = 'QUESTION_COUNTDOWN',
  QUESTION_OPEN = 'QUESTION_OPEN',
  QUESTION_CLOSE = 'QUESTION_CLOSE',
  ANSWER_SHOW = 'ANSWER_SHOW',
  FINAL_RESULTS = 'FINAL_RESULTS',
  END = 'END'
}
```

## 🧪 Testing & Quality Assurance

### Comprehensive Test Coverage
The project includes extensive testing across all major components:

- **Authentication Tests**: Registration, login, logout, session management
- **Quiz Management Tests**: CRUD operations, validation, permissions
- **Game Logic Tests**: State transitions, timing, player interactions
- **Player Function Tests**: Joining, answering, results retrieval
- **Integration Tests**: End-to-end game flow testing
- **Error Handling Tests**: Invalid inputs, unauthorized access, edge cases

## 🔒 Security Implementation

### Authentication & Data Protection
- **Password Security**: SHA256 cryptographic hashing with proper salt handling
- **Session Management**: Secure session tokens with automatic cleanup
- **Input Validation**: Comprehensive validation for all user inputs using custom validation functions
- **Authorization**: Role-based access control ensuring users can only access their own data
- **Data Sanitization**: Protection against injection attacks and malicious input

## 🎯 Complex Problem-Solving Examples

### Real-time Game State Management
**Challenge**: Managing complex game states across multiple concurrent sessions with proper timing
**Solution**: Implemented a comprehensive state machine with automated transitions and timer management

```typescript
// Game state transition logic
export function changeGameState(quizId: number, gameId: number, session: string, action: string) {
  const game = validateGameAndUser(quizId, gameId, session);
  
  switch(action) {
    case GameAction.NEXT_QUESTION:
      if (game.atQuestion >= game.numQuestions) {
        throw new FinalError(INCOMPATIBLE_GAME_STATE, 'No more questions');
      }
      questionCountdown(game, data);
      break;
    case GameAction.SKIP_COUNTDOWN:
      questionOpen(game, data);
      break;
    // ... additional state management
  }
}
```

### Multi-Session User Management
**Challenge**: Supporting users logged in across multiple devices simultaneously
**Solution**: Array-based session management with proper cleanup mechanisms

### Data Validation & Error Handling
**Challenge**: Ensuring data integrity across all user inputs and system operations
**Solution**: Centralized validation system with custom error types and HTTP status mapping

## 📊 System Performance Features

### Game Performance Optimization
- **Efficient Player Lookup**: Optimized data structures for quick player identification
- **Memory Management**: Automatic cleanup of completed games and expired sessions
- **Timer Optimization**: Efficient game timer management preventing memory leaks
- **Data Structure Efficiency**: Minimized data transfer and storage requirements

### Scalability Considerations
- **Concurrent Game Support**: Architecture supports multiple simultaneous quiz sessions
- **Player Limit Management**: Configurable limits with graceful handling of capacity
- **Resource Cleanup**: Proper disposal of game resources and timer objects
- **Stateless Design**: Core logic designed for horizontal scaling potential

## 🏆 Professional Skills Demonstrated

### Backend Development Expertise
- **API Design**: RESTful architecture with consistent response patterns
- **Data Modeling**: Complex relational data structures for educational applications
- **State Management**: Real-time game state synchronization across multiple players
- **Authentication Systems**: Secure user management with session handling
- **Error Handling**: Comprehensive error management with proper HTTP status codes

### Software Engineering Best Practices
- **TypeScript Proficiency**: Full type safety with sophisticated interface design
- **Test-Driven Development**: Extensive test coverage ensuring code reliability
- **Modular Architecture**: Clean separation of concerns with maintainable code structure
- **Documentation**: Comprehensive code documentation and API specifications
- **Version Control**: Professional Git workflow with feature-based development

### Problem-Solving & Innovation
- **Complex Algorithm Implementation**: Game scoring, timing, and progression logic
- **Real-time Systems**: Managing live quiz sessions with multiple concurrent users
- **Data Validation**: Robust input validation preventing system vulnerabilities
- **Performance Optimization**: Efficient resource management and cleanup

---

<div align="center">

*Showcasing expertise in Node.js, TypeScript, API Development, Real-time Systems, and Collaborative Software Development*

</div>
