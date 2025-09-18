import fs from 'fs';
import { Data } from './interface';

// YOU MAY MODIFY THIS OBJECT BELOW
let data: Data = {
  users: [],
  quizzes: [],
  games: [],
};

// YOU MAY MODIFY THIS OBJECT ABOVE

// YOU SHOULDNT NEED TO MODIFY THE FUNCTIONS BELOW IN ITERATION 1
// Timer constants
export const QUESTION_COUNTDOWN_TIME = 3;

// Timers
export const gameTimers: { [gameId: number]: ReturnType<typeof setTimeout> } = {};

/*
Example usage
  let store = getData()
  console.log(store) # Prints { 'names': ['Hayden', 'Tam', 'Rani', 'Giuliana', 'Rando'] }

  store.names.pop() // Removes the last name from the names array
  store.names.push('Jake') // Adds 'Jake' to the end of the names array

  console.log(store) # Prints { 'names': ['Hayden', 'Tam', 'Rani', 'Giuliana', 'Jake'] }
*/

// Save data to json file - called after data is changed. For post, put, and delete req
function save(data: Data) {
  // Writes local data to database
  const jsonstr = JSON.stringify(data);
  fs.writeFileSync('./database.json', jsonstr);
}

// Use getData() to access the data
function getData() {
  // Check if data file exists and updates data locally
  if (fs.existsSync('./database.json')) {
    const dbstr = fs.readFileSync('./database.json');
    data = JSON.parse(String(dbstr));
  }
  return data;
}

export { getData, save };
