```javascript
let data = {
    // TODO: insert your data structure that contains 
    // users + quizzes here
  users: [
    {
      userId: 1,
      nameFirst: 'Alex',
      nameLast: 'Alex',
      password: 'passwordhash2',
      email: 'alex.alex@gmail.com',
      usedPasswords: ['passwordhash2'],
      numSuccessfulLogins: 4,
      numFailedPasswordsSinceLastLogin: 2,
      sessions: ['session1', 'session2'],
    },
    {
      userId: 2,
      nameFirst: 'Daniel',
      nameLast: 'Daniel',
      password: 'passwordhash2',
      email: 'daniel.daniel@gmail.com',
      usedPasswords: ['passwordhash2'],
      numSuccessfulLogins: 4,
      numFailedPasswordsSinceLastLogin: 2,
      sessions: ['session3'],
    },
  ],
  quizzes: [
    {
      quizId: 5546,
      name: "This is the name of the quiz",
      timeCreated: 1683019484,
      timeLastEdited: 1683019484,
      description: "This quiz is so we can have a lot of fun",
      numQuestions: 1,
      questions: [
        {
          questionId: 5546,
          question: "Who is the Monarch of England?",
          timeLimit: 4,
          thumbnailUrl: "http://google.com/some/image/path.jpg",
          points: 5,
          answerOptions: [
            {
              answerId: 2384,
              answer: "Prince Charles",
              colour: "red",
              correct: true
            }
          ]
        }
      ],
      timeLimit: 4,
      thumbnailUrl: "http://google.com/some/image/path.jpg"
    }
  ],
}
```

[Optional] short description: How we will store our user and quiz data.
