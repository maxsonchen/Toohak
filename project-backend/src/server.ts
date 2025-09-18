import express, { json, NextFunction, Request, Response } from 'express';
import { echo } from './newecho';
import morgan from 'morgan';
import config from './config.json';
import cors from 'cors';
import YAML from 'yaml';
import sui from 'swagger-ui-express';
import fs from 'fs';
import path from 'path';
import process from 'process';
import { FinalError, errorStatusCodeMap } from './errorHandling';
import {
  adminAuthRegister,
  adminAuthLogin,
  adminUserDetails,
  adminUserDetailsUpdate,
  adminUserPasswordUpdate,
  adminAuthLogout
} from './auth';
import { clear } from './other';
import {
  adminQuizCreate, adminQuizInfo,
  adminQuizDescriptionUpdate, adminQuizList,
  adminQuizThumbnailUpdate, adminQuizQuestionDelete,
  adminQuizQuestion, adminQuizNameUpdate,
  adminQuizRemove, adminQuizQuestionUpdate
} from './quiz';
import {
  adminGamesInfo, adminQuizGameStart,
  adminQuizGameResults, changeGameState,
  adminQuizGameStatus
} from './game';
import {
  playerJoin, getQuestionPosition, getPlayerStatus, playerSubmitAnswers,
  playerQuestionResults, playerFinalResults
} from './player';
import { gameTimers } from './dataStore';

// Set up web app
const app = express();

// Use middleware that allows us to access the JSON body of requests
app.use(json());
// Use middleware that allows for access from other domains
app.use(cors());
// for logging errors (print to terminal)
app.use(morgan('dev'));

// for producing the docs that define the API
const file = fs.readFileSync(path.join(process.cwd(), 'swagger.yaml'), 'utf8');
app.get('/', (req: Request, res: Response) => res.redirect('/docs'));
app.use(
  '/docs',
  sui.serve,
  sui.setup(YAML.parse(file),
    { swaggerOptions: { docExpansion: config.expandDocs ? 'full' : 'list' } }
  ));

const PORT: number = parseInt(process.env.PORT || config.port);
const HOST: string = process.env.IP || '127.0.0.1';

// ====================================================================
//  ================= WORK IS DONE BELOW THIS LINE ===================
// ====================================================================

// Example get request
app.get('/echo', (req: Request, res: Response) => {
  const result = echo(req.query.echo as string);

  if ('error' in result && result.error === 'INVALID_ECHO') {
    return res.status(400).json(result);
  }

  return res.json(result);
});

// adminAuthRegister
app.post('/v1/admin/auth/register', (req: Request, res: Response, next: NextFunction) => {
  const { email, password, nameFirst, nameLast } = req.body;
  try {
    const result = adminAuthRegister(email, password, nameFirst, nameLast);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// adminAuthLogin
app.post('/v1/admin/auth/login', (req: Request, res: Response, next: NextFunction) => {
  const { email, password } = req.body;
  try {
    const result = adminAuthLogin(email, password);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// adminUserDetails
app.get('/v1/admin/user/details', (req: Request, res: Response, next: NextFunction) => {
  const session = req.get('session');
  try {
    const result = adminUserDetails(session);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// adminUserDetailsUpdate
app.put('/v1/admin/user/details', (req: Request, res: Response, next: NextFunction) => {
  const { email, nameFirst, nameLast } = req.body;
  const session = req.get('session');
  try {
    const result = adminUserDetailsUpdate(session, email, nameFirst, nameLast);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// adminUserPasswordUpdate
app.put('/v1/admin/user/password', (req: Request, res: Response, next: NextFunction) => {
  const session = req.get('session');
  const { oldPassword, newPassword } = req.body;
  try {
    const result = adminUserPasswordUpdate(session, oldPassword, newPassword);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// adminQuizList
app.get('/v1/admin/quiz/list', (req: Request, res: Response, next: NextFunction) => {
  const session = req.get('session');
  try {
    const result = adminQuizList(session);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// adminQuizCreate
app.post('/v1/admin/quiz', (req: Request, res: Response, next: NextFunction) => {
  const session = req.get('session');
  const { name, description } = req.body;
  try {
    const result = adminQuizCreate(session, name, description);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// adminQuizDelete
app.delete('/v1/admin/quiz/:quizid', (req: Request, res: Response, next: NextFunction) => {
  const session = req.get('session');
  const quizId = parseInt(req.params.quizid as string);
  try {
    const result = adminQuizRemove(session, quizId, false);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// adminQuizDelete
app.delete('/v2/admin/quiz/:quizid', (req: Request, res: Response, next: NextFunction) => {
  const session = req.get('session');
  const quizId = parseInt(req.params.quizid as string);
  try {
    const result = adminQuizRemove(session, quizId, true);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// adminQuizInfo
app.get('/v1/admin/quiz/:quizid', (req: Request, res: Response, next: NextFunction) => {
  const session = req.get('session');
  const quizId = parseInt(req.params.quizid as string);
  try {
    const result = adminQuizInfo(session, quizId);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// adminQuizNameUpdate
app.put('/v1/admin/quiz/:quizid/name', (req: Request, res: Response, next: NextFunction) => {
  const session = req.get('session');
  const quizId = parseInt(req.params.quizid, 10);
  const { name } = req.body;
  try {
    const result = adminQuizNameUpdate(session, quizId, name);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// adminQuizDescriptionUpdate
app.put('/v1/admin/quiz/:quizid/description', (req: Request, res: Response, next: NextFunction) => {
  const session = req.get('session');
  const quizId = parseInt(req.params.quizid as string);
  const { description } = req.body;
  try {
    const result = adminQuizDescriptionUpdate(session, quizId, description);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// Clear
app.delete('/v1/clear', (req: Request, res: Response, next: NextFunction) => {
  const result = clear();
  res.json(result);
});

// adminAuthLogout
app.post('/v1/admin/auth/logout', (req: Request, res: Response, next: NextFunction) => {
  const session = req.get('session');
  try {
    const result = adminAuthLogout(session);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// adminQuizThumbnailUpdate
app.put('/v1/admin/quiz/:quizid/thumbnail', (req: Request, res: Response, next: NextFunction) => {
  const quizId = parseInt(req.params.quizid);
  const session = req.get('session');
  const { thumbnailUrl } = req.body;
  try {
    const result = adminQuizThumbnailUpdate(session, quizId, thumbnailUrl);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// adminQuizQuestion
app.post('/v1/admin/quiz/:quizid/question', (req: Request, res: Response, next: NextFunction) => {
  const session = req.get('session');
  const quizId = parseInt(req.params.quizid as string);
  try {
    const result = adminQuizQuestion(session, quizId, req.body);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// adminQuizQuestionUpdate
app.put('/v1/admin/quiz/:quizid/question/:questionid',
  (req: Request, res: Response, next: NextFunction) => {
    const session = req.get('session');
    const quizId = parseInt(req.params.quizid as string);
    const questionId = parseInt(req.params.questionid as string);
    try {
      const result = adminQuizQuestionUpdate(session, quizId, questionId, req.body);
      res.json(result);
    } catch (err) {
      next(err);
    }
  });

// adminQuizQuestionDelete
app.delete('/v1/admin/quiz/:quizid/question/:questionid',
  (req: Request, res: Response, next: NextFunction) => {
    const session = req.get('session');
    const quizId = parseInt(req.params.quizid as string);
    const questionId = parseInt(req.params.questionid as string);
    try {
      const result = adminQuizQuestionDelete(session, quizId, questionId, false);
      res.json(result);
    } catch (err) {
      next(err);
    }
  });

// adminQuizQuestionDelete
app.delete('/v2/admin/quiz/:quizid/question/:questionid',
  (req: Request, res: Response, next: NextFunction) => {
    const session = req.get('session');
    const quizId = parseInt(req.params.quizid as string);
    const questionId = parseInt(req.params.questionid as string);
    try {
      const result = adminQuizQuestionDelete(session, quizId, questionId, true);
      res.json(result);
    } catch (err) {
      next(err);
    }
  });

// adminQuizGameStart
app.post('/v1/admin/quiz/:quizid/game/start', (req: Request, res: Response, next: NextFunction) => {
  const session = req.get('session');
  const quizId = parseInt(req.params.quizid as string);
  const autoStartNum = req.body.autoStartNum;
  try {
    const result = adminQuizGameStart(session, quizId, autoStartNum);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// adminQuizGameStatus
app.get(
  '/v1/admin/quiz/:quizid/game/:gameid', (req: Request, res: Response, next: NextFunction
  ) => {
    const session = req.get('session');
    const quizId = parseInt(req.params.quizid as string);
    const gameId = parseInt(req.params.gameid as string);
    try {
      const result = adminQuizGameStatus(session, quizId, gameId);
      res.json(result);
    } catch (err) {
      next(err);
    }
  });

// adminQuizGameResults
app.get(
  '/v1/admin/quiz/:quizid/game/:gameid/results', (req: Request, res: Response, next: NextFunction
  ) => {
    const session = req.get('session');
    const quizId = parseInt(req.params.quizid as string);
    const gameId = parseInt(req.params.gameid as string);
    try {
      const result = adminQuizGameResults(session, quizId, gameId);
      res.json(result);
    } catch (err) {
      next(err);
    }
  });

// adminGamesInfo
app.get('/v1/admin/quiz/:quizid/games', (req: Request, res: Response, next: NextFunction) => {
  const session = req.get('session');
  const quizId = parseInt(req.params.quizid as string);
  try {
    const result = adminGamesInfo(session, quizId);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// changeGameState
app.put('/v1/admin/quiz/:quizid/game/:gameid',
  (req: Request, res: Response, next: NextFunction) => {
    const session = req.get('session');
    const quizId = parseInt(req.params.quizid as string);
    const gameId = parseInt(req.params.gameid as string);
    const action = req.body.action;
    try {
      const result = changeGameState(quizId, gameId, session, action);
      res.json(result);
    } catch (err) {
      next(err);
    }
  });

// playerJoin
app.post('/v1/player/join', (req: Request, res: Response, next: NextFunction) => {
  const { gameId, playerName } = req.body;
  try {
    const result = playerJoin(gameId, playerName);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// playerIdQuestionPosition
app.get(
  '/v1/player/:playerid/question/:questionposition',
  (req: Request, res: Response, next: NextFunction) => {
    const playerid = parseInt(req.params.playerid as string);
    const questionid = parseInt(req.params.questionposition as string);
    try {
      const result = getQuestionPosition(playerid, questionid);
      res.json(result);
    } catch (err) {
      next(err);
    }
  });

// getPlayerStatus
app.get('/v1/player/:playerid', (req: Request, res: Response, next: NextFunction) => {
  const playerid = parseInt(req.params.playerid as string);
  try {
    const result = getPlayerStatus(playerid);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// playerSubmitAnswers
app.put('/v1/player/:playerid/question/:questionposition/answer',
  (req: Request, res: Response, next: NextFunction) => {
    const playerId = parseInt(req.params.playerid as string);
    const questionPosition = parseInt(req.params.questionposition as string);
    const answerIds = req.body.answerIds;
    try {
      const result = playerSubmitAnswers(answerIds, playerId, questionPosition);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
);

// playerQuestionResults
app.get('/v1/player/:playerid/question/:questionposition/results',
  (req: Request, res: Response, next: NextFunction) => {
    const playerId = parseInt(req.params.playerid as string);
    const questionPosition = parseInt(req.params.questionposition as string);
    try {
      const result = playerQuestionResults(playerId, questionPosition);
      res.json(result);
    } catch (err) {
      next(err);
    }
  });

// playerFinalResults
app.get('/v1/player/:playerid/results', (req: Request, res: Response, next: NextFunction) => {
  const playerId = parseInt(req.params.playerid as string);
  try {
    const result = playerFinalResults(playerId);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// ====================================================================
//  ================= WORK IS DONE ABOVE THIS LINE ===================
// ====================================================================

app.use((req: Request, res: Response) => {
  const message = `
    Route not found - This could be because:
      0. You have defined routes below (not above) this middleware in server.ts
      1. You have not implemented the route ${req.method} ${req.path}
      2. There is a typo in either your test or server, e.g. /posts/list in one
         and, incorrectly, /post/list in the other
      3. You are using 'npm start' (instead of 'npm run dev') to start your server and
         have forgotten to manually restart to load the new changes
      4. You've forgotten a leading slash (/), e.g. you have posts/list instead
         of /posts/list in your server.ts or test file
  `;

  res.status(404).json({ error: 'ROUTE_NOT_FOUND', message });
});

// Error middleware
app.use((err: unknown, req: express.Request,
  res: express.Response, next: express.NextFunction) => {
  if (res.headersSent) {
    return next(err);
  }

  if (err instanceof FinalError) {
    const statusCode = errorStatusCodeMap[err.error] || 500;
    console.log('EROR CHECKING');
    console.log(err.error);
    console.log(err.message);
    return res.status(statusCode).json({
      error: err.error,
      message: err.message,
    });
  }

  // if (err instanceof Error) {
  //   console.error(err.stack);
  // } else {
  //   console.error('unknown err', err);
  // }
  // res.status(500).json({
  //   error: 'internal svr err',
  //   message: 'smth weird went wrong',
  // });
});

// start server
const server = app.listen(PORT, HOST, () => {
  // DO NOT CHANGE THIS LINE
  console.log(`⚡️ Server started on port ${PORT} at ${HOST}`);
});

// For coverage, handle Ctrl+C gracefully
process.on('SIGINT', () => {
  server.close(() => {
    for (const gameId in gameTimers) {
      clearTimeout(gameTimers[gameId]);
      delete gameTimers[gameId];
    }
    console.log('Shutting down server gracefully.');
    process.exit();
  });
});
