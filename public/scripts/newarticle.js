let articleParagraphs = document.querySelectorAll(".article > div > div > *");
let submitCommentForm = document.querySelector(".submitComments");
let firstSubmit = true;
let url =
  "https://8rj0xswzt3.execute-api.eu-west-1.amazonaws.com/dev/commentative";

// This is an ongoing check to see which element is in the middle of the screen.
// Then it adds a class 'selected'.
// .selected is the state used so styling knows what to highlight
// and so commenting functionality knows which paragraph index to set as the reference
window.addEventListener("scroll", (event) => {
  let fromTop = window.scrollY;
  articleParagraphs.forEach((para) => {
    let paragraphHeight = para.offsetHeight;
    let middleOfWindow = window.innerHeight / 2;
    let viewportTopOffset = para.getBoundingClientRect().top;
    let topBoundary = middleOfWindow - paragraphHeight;
    let bottomBoundary = middleOfWindow;
    if (
      viewportTopOffset <= bottomBoundary &&
      viewportTopOffset >= topBoundary
    ) {
      para.classList.add("selected");
    } else {
      para.classList.remove("selected");
    }
  });
});

// This is a one-off process that happens when an article is first added.
// TODO: Perhaps this should happen as part of the Readability parser process, rather than here.
function addIndexToParagraphs() {
  articleParagraphs.forEach((element, index) => {
    element.setAttribute("data-article-element-index", index + 1);
  });
}

// function to submit comments to backend
function submitComment(e) {
  e.preventDefault();
  //reference is the id of the currently highlighted paragraph
  const reference = document
    .querySelector(".selected")
    .getAttribute("data-article-element-index");
  //body is the text content of the comment
  const body = document.querySelector(".addCommentText").value;
  const user = "🖊️";
  if (firstSubmit) {
    //articleBody is a text only copy of the article(minus unnecessary html tags)
    //   const articleBody = document.querySelector(".articleBody").value;
    const articleBody = document.querySelector(".article").textContent;

    // TODO: This `firstSubmit` thing feels weird.
    // Why does the user go through different journeys depending on whether they've submitted already?
    // the first time the user posts a comment, the articleBody gets posted to the db, i.e, this is the first time the database creates an entry for this user
    // the database then generates a unique url for this particular article(which will become our sharable link)
    // the problem is that the express app is unaware of this, so currently the requests to the comment database are being done from the frontend. not ideal.
    //the unique address for the database is being pulled from the address bar, but currently our app doesnt handle a refresh of this link
    // ideally the "new article" process should involve submitting the article content to the comment api, and then the link that the frontend gets sent to, instead of "newarticle?=articlelink" will be the unique link generated by our api
    // maybe the frontend talks only to the express app, and the express app communicates to the database - this seems to make more sense right now, may change this later
    firstSubmit = false;
    const params = { user, articleBody, commentData: [{ body, reference }] };

    fetch(url, {
      method: "POST",
      body: JSON.stringify(params),
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((res) => res.json())
      .then((articleObj) => {
        console.log(articleObj);
        //TODO - move this step to backend
        history.pushState(null, "", "/" + articleObj.uuid);
        addNewComment(articleObj.comments[0].body, user);
        document.querySelector(".addCommentText").value = "";
      });
  } else {
    const path = window.location.pathname.split("/");
    const uuid = path[path.length - 1];
    const params = { user, commentData: [{ body, reference }] };
    console.log("hello", url + "/" + uuid);
    fetch(url + "/" + uuid, {
      method: "PUT",
      body: JSON.stringify(params),
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((res) => res.json())
      .then((commentObj) => {
        //the api returns the body and the paragraph index(reference) of the newly created comment
        console.log(commentObj);
        console.log(commentObj[0].body);
        addNewComment(commentObj[0].body, user);
        document.querySelector(".addCommentText").value = "";
      });
  }
}

//function to add a new comment to the frontend display
function addNewComment(content = "This is a comment", name = "Jamie") {
  const newCommentBox = document.querySelector(".new-comment");

  const commentBlock = document.createElement("div");
  commentBlock.classList.add("comment-block");
  const commentName = document.createElement("div");
  commentName.classList.add("comment-name");
  const commentContent = document.createElement("div");
  commentContent.classList.add("comment-content");
  commentContent.innerHTML = content;
  commentName.innerHTML = name;

  commentBlock.appendChild(commentName);
  commentBlock.appendChild(commentContent);

  newCommentBox.appendChild(commentBlock);
}

addIndexToParagraphs();
document.querySelector(".addComment").addEventListener("click", submitComment);
