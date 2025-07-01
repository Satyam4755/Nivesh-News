require('dotenv').config(); // ✅ Ensure at the top
const User = require('../models/user');
const axios = require('axios');

// ✅ Use NewsAPI key from .env
const NEWS_API_URL = `https://newsapi.org/v2/everything?q=india&language=en&sortBy=publishedAt&pageSize=20&apiKey=${process.env.NEWS_API_KEY}`;

// ------------------------ HOME PAGE ------------------------
exports.homePage = async (req, res, next) => {
  let user = null;
  let showOptions = false;
  let savedUrls = [];

  if (req.isLogedIn && req.session.user) {
    user = await User.findById(req.session.user._id);


    // 🛠️ Extract URLs from saved articles
    savedUrls = (user.savedNews || []).map(article => article.url);

    showOptions = true;
  }

  let articles = [];
  let apiError = false;

  try {
    const response = await axios.get(NEWS_API_URL);
    articles = response.data.articles || [];
  } catch (error) {
    apiError = true;
    console.error("Failed to fetch news:", error.message);
  }

  res.render('./store/news-home', {
    articles,
    apiError,
    title: "Nivesh News",
    currentPage: 'home',
    isLogedIn: req.isLogedIn,
    user,
    showOptions,
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

// ------------------------ SAVED NEWS LIST ------------------------
exports.savedNewsList = async (req, res, next) => {
  if (!req.isLogedIn || !req.session.user) return res.redirect('/login');

  const user = await User.findById(req.session.user._id);
  const savedArticles = user.savedNews || [];

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

  // Avoid duplicates
  const alreadySaved = user.savedNews.find(article => article.url === newsUrl);
  if (!alreadySaved) {
    try {
      const response = await axios.get(NEWS_API_URL);
      const allArticles = response.data.articles || [];
      const articleToSave = allArticles.find(article => article.url === newsUrl);

      if (articleToSave) {
        user.savedNews.push(articleToSave);
        await user.save();
      }
    } catch (err) {
      console.error("Error fetching article for saving:", err.message);
    }
  } else {
    // Toggle off (unsave)
    user.savedNews = user.savedNews.filter(article => article.url !== newsUrl);
    await user.save();
  }

  res.redirect('/user/saved_news');
};

// ------------------------ REMOVE FROM SAVED ------------------------
exports.postUnsavedNews = async (req, res, next) => {
  if (!req.isLogedIn || !req.session.user) return res.redirect('/login');

  const encodedUrl = req.params.newsUrl;
  const newsUrl = decodeURIComponent(encodedUrl);

  const user = await User.findById(req.session.user._id);
  user.savedNews = user.savedNews.filter(article => article.url !== newsUrl);

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
