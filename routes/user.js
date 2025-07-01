const express = require('express');
const userRouter = express.Router();
const {
  homePage,
  newsDetails,
  likedNewsList,
  savedNewsList,
  postLikedNews,
  postUnlikedNews,
  postSavedNews,
  postUnsavedNews,
  postHomePage,
} = require('../controller/user');

// GET routes
userRouter.get('/', homePage); // Home page with top news
userRouter.get('/news/details/:encodedUrl', newsDetails); // News details page
userRouter.get('/user/saved_news', savedNewsList); // Show saved articles

// POST routes
userRouter.post('/news/save', postSavedNews); // Save/unsave toggle
userRouter.post('/news/unsave/:newsUrl', postUnsavedNews); // Remove from saved page
userRouter.post('/', postHomePage); // Theme change toggle

module.exports = userRouter;
