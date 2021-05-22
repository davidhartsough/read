import React, { useState } from "react";
import axios from "axios";

const urlPattern = /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_+.~#?&//=]*)$/;
const elementsToRemove = [
  "script",
  "style",
  "area",
  "audio",
  "img",
  "map",
  "track",
  "video",
  "embed",
  "iframe",
  "object",
  "param",
  "picture",
  "source",
  "canvas",
  "noscript",
  "button",
  "datalist",
  "fieldset",
  "form",
  "input",
  "label",
  "legend",
  "meter",
  "optgroup",
  "option",
  "output",
  "progress",
  "select",
  "textarea",
  "menu",
  "applet",
  "bgsound",
  "image",
];
const goodElements = [
  "address",
  "article",
  "aside",
  "footer",
  "header",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "hgroup",
  "main",
  "nav",
  "section",
  "blockquote",
  "dd",
  "div",
  "dl",
  "dt",
  "figcaption",
  "figure",
  "hr",
  "li",
  "ol",
  "p",
  "pre",
  "ul",
  "a",
  "abbr",
  "b",
  "bdi",
  "bdo",
  "br",
  "cite",
  "code",
  "data",
  "dfn",
  "em",
  "i",
  "kbd",
  "mark",
  "q",
  "s",
  "samp",
  "small",
  "span",
  "strong",
  "sub",
  "sup",
  "time",
  "u",
  "var",
  "wbr",
  "del",
  "ins",
  "caption",
  "col",
  "colgroup",
  "table",
  "tbody",
  "td",
  "tfoot",
  "th",
  "thead",
  "tr",
  "details",
  "dialog",
  "summary",
  "slot",
  "template",
];

let initialUrl = "";
const potentialUrl = window.location.pathname.slice(6);
if (potentialUrl && urlPattern.test(potentialUrl)) {
  initialUrl = potentialUrl;
}

export default function App() {
  const [url, setUrl] = useState(initialUrl);
  const [html, setHtml] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [showCorsLink, setShowCorsLink] = useState(false);
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
      setErrorMessage("Please enter a URL for an HTML page.");
      return;
    }
    const doc = new DOMParser().parseFromString(data, "text/html");
    setTitle(doc.title);
    const { body } = doc;
    elementsToRemove.forEach((tag) => {
      Array.from(body.getElementsByTagName(tag)).forEach((e) => e.remove());
    });
    Array.from(body.getElementsByTagName("*")).forEach((e) => {
      e.removeAttribute("style");
      if (!goodElements.includes(e.tagName.toLowerCase())) e.remove();
    });
    const { origin } = new URL(url.trim());
    Array.from(body.getElementsByTagName("a")).forEach((e) => {
      e.setAttribute("target", "_blank");
      e.setAttribute("rel", "noreferrer");
      const href = e.getAttribute("href");
      if (href && href.startsWith("/")) {
        e.setAttribute("href", `${origin}${href}`);
      }
    });
    const content = doc.getElementById("content");
    let newHtml = content || body;
    if (data.includes("<article")) {
      [newHtml] = body.getElementsByTagName("article");
    }
    setHtml(newHtml.innerHTML);
  }
  async function read() {
    setTitle("Loading ...");
    setShowCorsLink(false);
    setErrorMessage(null);
    setHtml(null);
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
        setErrorMessage("Are you sure the URL is correct?");
        setShowCorsLink(true);
      }
    }
  }
  function handleSubmit(e) {
    e.preventDefault();
    if (url) {
      if (!inputError) read();
    } else {
      setInputError(true);
    }
  }
  const createMarkup = () => ({ __html: html });
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
      {title.length > 0 && <h1 id="title">{title}</h1>}
      {errorMessage && <p>{errorMessage}</p>}
      {showCorsLink && (
        <p>
          <span>If so, then </span>
          <a
            href="https://cors-anywhere.herokuapp.com/corsdemo"
            target="_blank"
            rel="noreferrer"
          >
            go here and click the button to &quot;Request temporary access to
            the demo server&quot;.
          </a>
          <span> Then try again!</span>
        </p>
      )}
      {/* eslint-disable-next-line react/no-danger */}
      <article dangerouslySetInnerHTML={createMarkup()} />
    </>
  );
}
