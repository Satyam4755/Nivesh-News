require('dotenv').config(); // ✅ Ensure at the top
const User = require('../models/user');
const axios = require('axios');

// ✅ Use NewsAPI key from .env
const NEWS_API_URL = `https://newsapi.org/v2/everything?q=india&language=en&sortBy=publishedAt&pageSize=20&apiKey=${process.env.NEWS_API_KEY}`;

// ------------------------ HOME PAGE ------------------------
exports.homePage = async (req, res, next) => {
  let user = null;
  let showOptions = false;
  let likedUrls = [];
  let savedUrls = [];

  if (req.isLogedIn && req.session.user) {
    user = await User.findById(req.session.user._id);
    likedUrls = user.likedNews || [];
    savedUrls = user.savedNews || [];
    showOptions = true;
  }

  let articles = [];
  let apiError = false;
  try {
    const response = await axios.get(NEWS_API_URL);
    // console.log(response.data);
    articles = response.data.articles || [];
  } catch (error) {
    apiError = true;
    console.error("Failed to fetch news:", error.message);
  }

  res.render('./store/news-home', {
    articles,
    apiError,
    title: "News Home",
    currentPage: 'home',
    isLogedIn: req.isLogedIn,
    user,
    showOptions,
    likedUrls,
    savedUrls
  });
};

// ------------------------ NEWS DETAILS ------------------------
exports.newsDetails = async (req, res, next) => {
  if (!req.isLogedIn || !req.session.user) return res.redirect('/login');

  const encodedUrl = req.params.encodedUrl;
  const newsUrl = decodeURIComponent(encodedUrl);

  let article = null;
  try {
    const apiResponse = await axios.get(NEWS_API_URL);
    article = apiResponse.data.articles.find(a => a.url === newsUrl);
  } catch (error) {
    console.error("Error fetching article details", error.message);
  }

  if (!article) return res.redirect('/');

  const user = await User.findById(req.session.user._id);

  const likedUrls = user.likedNews || [];
  const savedUrls = user.savedNews || [];

  const isLiked = likedUrls.includes(newsUrl);
  const isSaved = savedUrls.includes(newsUrl);

  res.render('./store/news-details', {
    article,
    title: "News Details",
    isLogedIn: req.isLogedIn,
    user,
    isLiked,
    isSaved,
    likedUrls,      // ✅ Added for consistency with homepage
    savedUrls,      // ✅ Added for consistency with homepage
    messages: req.flash()
  });
};

// ------------------------ LIKED NEWS LIST ------------------------
exports.likedNewsList = async (req, res, next) => {
  if (!req.isLogedIn || !req.session.user) return res.redirect('/login');

  const user = await User.findById(req.session.user._id);
  const likedNewsUrls = user.likedNews;

  let likedArticles = [];
  try {
    const response = await axios.get(NEWS_API_URL);
    const allArticles = response.data.articles || [];
    likedArticles = allArticles.filter(article => likedNewsUrls.includes(article.url));
  } catch (error) {
    console.error("Error fetching liked news:", error.message);
  }

  res.render('./store/liked_news_list', {
    likedNews: likedArticles,
    title: "Liked News",
    currentPage: 'liked',
    isLogedIn: req.isLogedIn,
    user,
    messages: req.flash(),
  });
};

// ------------------------ POST LIKE TOGGLE ------------------------
exports.postLikedNews = async (req, res, next) => {
  if (!req.isLogedIn || !req.session.user) return res.redirect('/login');

  const newsUrl = req.body.newsUrl;
  const user = await User.findById(req.session.user._id);

  if (!user.likedNews.includes(newsUrl)) {
    user.likedNews.push(newsUrl);
  } else {
    user.likedNews.pull(newsUrl);
  }

  await user.save();
  res.redirect('/');
};

// ------------------------ REMOVE FROM LIKED ------------------------
exports.postUnlikedNews = async (req, res, next) => {
  if (!req.isLogedIn || !req.session.user) return res.redirect('/login');

  const encodedUrl = req.params.newsUrl;
  const newsUrl = decodeURIComponent(encodedUrl);

  const user = await User.findById(req.session.user._id);
  user.likedNews.pull(newsUrl);

  await user.save();
  req.flash('success', 'News removed from liked list successfully!');
  res.redirect('/user/liked_news');
};

// ------------------------ SAVED NEWS LIST ------------------------
exports.savedNewsList = async (req, res, next) => {
  if (!req.isLogedIn || !req.session.user) return res.redirect('/login');

  const user = await User.findById(req.session.user._id);
  const savedNewsUrls = user.savedNews;

  let savedArticles = [];
  try {
    const response = await axios.get(NEWS_API_URL);
    const allArticles = response.data.articles || [];
    savedArticles = allArticles.filter(article => savedNewsUrls.includes(article.url));
  } catch (error) {
    console.error("Error fetching saved news:", error.message);
  }

  res.render('./store/saved_news_list', {
    savedNews: savedArticles,
    title: "Saved News",
    currentPage: 'saved',
    isLogedIn: req.isLogedIn,
    user,
    messages: req.flash(),
  });
};

// ------------------------ POST SAVE TOGGLE ------------------------
exports.postSavedNews = async (req, res, next) => {
  if (!req.isLogedIn || !req.session.user) return res.redirect('/login');

  const newsUrl = req.body.newsUrl;
  const user = await User.findById(req.session.user._id);

  if (!user.savedNews.includes(newsUrl)) {
    user.savedNews.push(newsUrl);
  } else {
    user.savedNews.pull(newsUrl);
  }

  await user.save();
  res.redirect('/');
};

// ------------------------ REMOVE FROM SAVED ------------------------
exports.postUnsavedNews = async (req, res, next) => {
  if (!req.isLogedIn || !req.session.user) return res.redirect('/login');

  const encodedUrl = req.params.newsUrl;
  const newsUrl = decodeURIComponent(encodedUrl);

  const user = await User.findById(req.session.user._id);
  user.savedNews.pull(newsUrl);

  await user.save();
  req.flash('success', 'News removed from saved list successfully!');
  res.redirect('/user/saved_news');
};

// ------------------------ THEME TOGGLE ------------------------
exports.postHomePage = async (req, res, next) => {
  if (!req.isLogedIn || !req.session.user) return res.redirect('/login');

  const userId = req.session.user._id;
  const themeValue = req.body.theme === 'true';

  try {
    await User.findByIdAndUpdate(userId, { theme: themeValue });
    req.session.user.theme = themeValue;
    res.redirect('/');
  } catch (err) {
    console.error('Theme update failed:', err);
    res.status(500).send('Internal Server Error');
  }
};