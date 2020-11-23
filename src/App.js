import React, { useState } from "react";
import axios from "axios";

const urlPattern = /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_+.~#?&//=]*)$/;

export default function App() {
  const [url, setUrl] = useState("");
  const [text, setText] = useState("");
  const [title, setTitle] = useState("");
  const [inputError, setInputError] = useState(false);
  function handleChange({ target: { value } }) {
    setUrl(value);
    setInputError(!urlPattern.test(value));
  }
  function parseHtml(data) {
    if (
      typeof data !== "string" &&
      data.toLowerCase().indexOf("<!doctype") === -1
    ) {
      setTitle("Error: Sorry, wrong type of webpage.");
      setText("Please enter a URL for an HTML page.");
      return;
    }
    const doc = new DOMParser().parseFromString(data, "text/html");
    setTitle(doc.title);
    const { body } = doc;
    Array.from(body.getElementsByTagName("script")).forEach((se) => {
      se.remove();
    });
    Array.from(body.getElementsByTagName("style")).forEach((se) => {
      se.remove();
    });
    let html = body;
    if (data.includes("<article")) {
      [html] = body.getElementsByTagName("article");
    }
    setText(html.innerText);
  }
  async function read() {
    setTitle("Loading ...");
    setText("");
    try {
      const { data } = await axios.get(url.trim());
      parseHtml(data);
    } catch {
      try {
        const { data } = await axios.get(
          `https://cors-anywhere.herokuapp.com/${url.trim()}`
        );
        parseHtml(data);
      } catch (error) {
        const errorResponse = { message: error.message };
        if (error.response) {
          errorResponse.status = error.response.status;
          errorResponse.statusText = error.response.statusText;
          errorResponse.data = error.response.data;
        }
        // eslint-disable-next-line no-console
        console.log(errorResponse);
        setTitle("Uh oh. Bummer. Can't get the text from that web page.");
        setText("Are you sure the URL is correct?");
      }
    }
  }
  function handleSubmit(e) {
    e.preventDefault();
    if (!inputError) read();
  }
  return (
    <>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Enter a URL"
          value={url}
          onChange={handleChange}
          className={inputError ? "error" : ""}
        />
        <button type="submit" disabled={inputError}>
          READ
        </button>
      </form>
      <article id="read">
        <h1 id="title">{title}</h1>
        <p id="text">{text}</p>
      </article>
    </>
  );
}
