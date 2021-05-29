import React, { useState, useEffect } from "react";
import axios from "axios";
import Joke from "./Joke";
import "./JokeList.css";

function JokeList({ numJokesToGet = 10 }) {
  const [jokes, setJokes] = useState([]);

  /* get jokes if there are no jokes */

  useEffect(function() {
    async function getJokes() {
      let j = [...jokes];
      // local storage of data
      let jokeVotes = JSON.parse(
        window.localStorage.getItem("jokeVotes") || "{}" );
      let seenJokes = new Set();
      try {
        while (j.length < numJokesToGet) {
          let res = await axios.get("https://icanhazdadjoke.com", {
            headers: { Accept: "application/json" }
          });
          let { status, ...jokeObj } = res.data;
  
          if (!seenJokes.has(jokeObj.id)) {
            seenJokes.add(jokeObj.id);
            jokeVotes[jokeObj.id] = jokeVotes[jokeObj.id] || 0;
            j.push({ ...jokeObj, votes: jokeVotes[jokeObj.id], locked: false });
          } else {
            console.error("duplicate found!");
          }
        }
        setJokes(j);
        window.localStorage.setItem("jokeVotes", JSON.stringify(jokeVotes));
      } catch (e) {
        console.log(e);
      }
    }

    if (jokes.length === 0) getJokes();
  }, [jokes, numJokesToGet]);

  /* empty joke list and then call getJokes */

  function generateNewJokes() {
    // apply the locked filler option
    setJokes(jokes => [ ...jokes.filter(joke => joke.locked)]);
    // setJokes([]);
  }

  function resetVotes() {
    window.localStorage.setItem("jokeVotes", "{}");
    setJokes(jokes => [...jokes.map(joke => ({ ...joke, votes: 0 }))
    ]);
  }

  function clickLock(id) {
    setJokes(jokes => [...jokes.map(j => (j.id === id ? { ...j, locked: !j.locked } : j))
    ]);
  }
  /* change vote for this id by delta (+1 or -1) */

  function vote(id, delta) {
    // local storage data
    let jokeVotes = JSON.parse(window.localStorage.getItem("jokeVotes"));
    jokeVotes[id] = (jokeVotes[id] || 0) + delta;
    window.localStorage.setItem("jokeVotes", JSON.stringify(jokeVotes));
    setJokes(allJokes =>
      allJokes.map(j => (j.id === id ? { ...j, votes: j.votes + delta } : j))
    );
  }

  /* render: either loading spinner or list of sorted jokes. */

  if (jokes.length) {
    let sortedJokes = [...jokes].sort((a, b) => b.votes - a.votes);
    let lockAllJ = sortedJokes.filter(j => j.locked).length === numJokesToGet;

    return (
      <div className="JokeList">
        <button className="JokeList-getmore" 
                onClick={generateNewJokes} 
                disabled={lockAllJ}>
          Get New Jokes
        </button>
        <button className="JokeList-getmore" onClick={resetVotes}>
          Reset Vote Count
        </button>
  
        {sortedJokes.map(j => (
          <Joke text={j.joke} key={j.id} id={j.id} votes={j.votes} vote={vote} locked={j.locked} clickLock={clickLock}/>
        ))}
        {sortedJokes.length < numJokesToGet ? (
          <div className="loading">
            <i className="fas fa-4x fa-spinner fa-spin" />
          </div>
        ) : null}
      </div>
    );
  }
  return null;
}

export default JokeList;
