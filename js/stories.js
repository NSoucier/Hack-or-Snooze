"use strict";

// This is the global list of the stories, an instance of StoryList
let storyList;

/** Get and show stories when site first loads. */

async function getAndShowStoriesOnStart() {
  storyList = await StoryList.getStories();
  $storiesLoadingMsg.remove();

  putStoriesOnPage();
}

/**
 * A render method to render HTML for an individual Story instance
 * - story: an instance of Story
 *
 * Returns the markup for the story.
 */

function generateStoryMarkup(story) {
  console.debug("generateStoryMarkup", story);

  const hostName = story.getHostName();
  if (currentUser && currentUser.favorites.some(val => val.storyId === story.storyId)) { // returns true is it's previously favorited
    return $(`
    <li id="${story.storyId}">
      <hr>
      <a href="${story.url}" target="a_blank" class="story-link">
        ${story.title}
      </a>
      <small class="story-hostname">(${hostName})</small>
      <small class="story-author">by ${story.author}</small>
      <small class="story-user">posted by ${story.username}</small>
      <i class="fa-star fa-solid"></i>
    </li>`);

  }
  else { // not favorited
    return $(`
      <li id="${story.storyId}">
        <hr>
        <a href="${story.url}" target="a_blank" class="story-link">
          ${story.title}
        </a>
        <small class="story-hostname">(${hostName})</small>
        <small class="story-author">by ${story.author}</small>
        <small class="story-user">posted by ${story.username}</small>
        <i class="fa-regular fa-star"></i>
      </li>`);
  }
}

/** Gets list of stories from server, generates their HTML, and puts on page. */

function putStoriesOnPage() {
  console.debug("putStoriesOnPage");

  $allStoriesList.empty();

  // loop through all of our stories and generate HTML for them
  for (let story of storyList.stories) {
    const $story = generateStoryMarkup(story);
    $allStoriesList.append($story);

    // check if user is logged in and if story was created by user. Then add optional trash box
    if (currentUser && story.username == currentUser.username) {
      let trash = document.createElement('i');
      trash.className = 'fa-solid fa-trash-can trash';
      document.getElementById(`${story.storyId}`).appendChild(trash)
    }
  }


  $allStoriesList.show();
  
  // listen for use of trash can
  let $trash = $('.trash');
  $trash.on('click', removeStory);

  //listen for use of favorites check
  let $favs = $('.fa-star');
  $favs.on('click', toggleFavs);

}

/** Handle new story form submission. */

async function newStory(evt) {
  console.debug("new story", evt);
  evt.preventDefault();
  if (!currentUser) { // Doesn't let user post story if they're not logged in
    alert('Please login before adding a new story.')
  }
  // grab the new story info and make new Story instance
  let newStoryInput = await storyList.addStory(currentUser, {title: $('#story-title').val(), author: $('#story-author').val(), url: $('#story-url').val()});

  hidePageComponents();
  
  getAndShowStoriesOnStart();
  
}

$newStoryForm.on("submit", newStory);


// Remove story from user click
async function removeStory(evt) {
  await storyList.deleteStory(currentUser, evt.target.parentElement.id);
  evt.target.parentElement.remove();
}

// add/remove story to favorites
async function toggleFavs(evt) {
  if (currentUser) {
    evt.target.classList.toggle('fa-solid'); // class of favorite
    evt.target.classList.toggle('fa-regular'); // class of non-favorite
    let storyID = evt.target.parentElement.id;
    if (evt.target.classList.value.indexOf('fa-solid') !== -1 ) { // add to favorites
      let user = await User.addToFavorites(currentUser, storyID);
      currentUser.favorites.push({storyId: storyID});
    } else { // removes from favorites
      let user = await User.deleteFromFavorites(currentUser, storyID);
      currentUser.favorites = currentUser.favorites.filter(st => st.storyId !== storyID);
    }
  } else {
    alert("Please login first.")
  }

}

// display page of favs when the nav button is clicked
function displayFavs () {
  if (!currentUser) {
    alert('Please login first.')
  } else {
    hidePageComponents();
    putStoriesOnPage()
    $('.fa-regular.fa-star').parent().remove(); // remove non-favorite stories
  }
}

$myfavs.on('click', displayFavs);
