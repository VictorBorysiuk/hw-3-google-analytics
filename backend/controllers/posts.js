const Post = require("../models/post");
const fetch = require('node-fetch');

async function getDataAboutNBUExchange() {
  let dataAboutNBUExchange;
  const urlNBU = 'https://bank.gov.ua/NBU_Exchange/exchange_site?&valcode=usd&sort=exchangedate&order=desc&json';
  const today = new Date();
  const yyyy = today.getFullYear();
  let mm = today.getMonth() + 1;
  let dd = today.getDate();
  if (dd < 10) dd = '0' + dd;
  if (mm < 10) mm = '0' + mm;
  const formattedToday = dd + '.' + mm + '.' + yyyy;
  const bodyNBU = { "r030":840,"txt":"Долар США","cc":"USD","exchangedate": `${ formattedToday }`};
  await fetch(urlNBU,{method: 'GET', body: JSON.stringify(bodyNBU)}).then((response) => {
    return response.json();
  })
  .then((data) => {
    dataAboutNBUExchange = data;
  });

  return dataAboutNBUExchange || {};
}
exports.createPost = (req, res, next) => {
  const url = req.protocol + "://" + req.get("host");
  const post = new Post({
    title: req.body.title,
    content: req.body.content,
    imagePath: url + "/images/" + req.file.filename,
    creator: req.userData ? req.userData.userId : ''
  });
  post
    .save()
    .then(createdPost => {
      res.status(201).json({
        message: "Post added successfully",
        post: {
          ...createdPost,
          id: createdPost._id
        }
      });
    })
    .catch(error => {
      res.status(500).json({
        message: "Creating a post failed!"
      });
    });
};

exports.createPostWithoutAuth = (req, res, next) => {
  const url = req.protocol + "://" + req.get("host");
  const post = new Post({
    title: req.query.title,
    content: req.query.content,
    imagePath: '',
  });
  console.log('post', post);
  post
    .save()
    .then(createdPost => {
      res.status(201).json({
        message: "Post added successfully",
        post: {
          ...createdPost,
          id: createdPost._id
        }
      });
    })
    .catch(error => {
      res.status(500).json({
        message: "Creating a post failed!"+ error
      });
    });
};

exports.updatePost = (req, res, next) => {
  let imagePath = req.body.imagePath;
  if (req.file) {
    const url = req.protocol + "://" + req.get("host");
    imagePath = url + "/images/" + req.file.filename;
  }
  const post = new Post({
    _id: req.body.id,
    title: req.body.title,
    content: req.body.content,
    imagePath: imagePath,
    creator: req.userData ? req.userData.userId : ''
  });
  Post.updateOne({ _id: req.params.id, creator: req.userData ? req.userData.userId : '' }, post)
    .then(result => {
      if (result.n > 0) {
        res.status(200).json({ message: "Update successful!" });
      } else {
        res.status(401).json({ message: "Not authorized!" });
      }
    })
    .catch(error => {
      res.status(500).json({
        message: "Couldn't udpate post!"
      });
    });
};

exports.getPosts = async (req, res, next) => {
  const pageSize = +req.query.pagesize;
  const currentPage = +req.query.page;
  const postQuery = Post.find();
  let fetchedPosts;
  let dataAboutNBUExchange = await getDataAboutNBUExchange()
 /* getDataAboutNBUExchange().then(documents => {
    console.log({documents});
    dataAboutNBUExchange = documents;
  });*/
  console.log({dataAboutNBUExchange});
  if (pageSize && currentPage) {
    postQuery.skip(pageSize * (currentPage - 1)).limit(pageSize);
  }
  postQuery
    .then(documents => {
      fetchedPosts = documents;
      return Post.count();
    })
    .then(count => {
      res.status(200).json({
        message: "Posts fetched successfully!",
        posts: fetchedPosts,
        maxPosts: count,
        dataAboutNBUExchange
      });
    })
    .catch(error => {
      res.status(500).json({
        message: "Fetching posts failed!" + error
      });
    });
};

exports.getPost = (req, res, next) => {
  Post.findById(req.params.id)
    .then(post => {
      if (post) {
        res.status(200).json(post);
        
      } else {
        res.status(404).json({ message: "Post not found!" });
      }
    })
    .catch(error => {
      res.status(500).json({
        message: "Fetching post failed!"
      });
    });
};

exports.deletePost = (req, res, next) => {
  Post.deleteOne({ _id: req.params.id, creator: req.userData.userId })
    .then(result => {
      if (result.n > 0) {
        res.status(200).json({ message: "Deletion successful!" });
      } else {
        res.status(401).json({ message: "Not authorized!" });
      }
    })
    .catch(error => {
      res.status(500).json({
        message: "Deleting posts failed!"
      });
    });
};
