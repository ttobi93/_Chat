var express = require('express');
var user = require('../model/user.js');
var router = express.Router();

/* GET users listing. */
router.route("/")

    .get(function (req, res, next) {
        // Get all users
        user.find({}, { name: 1},
        function (err, item) {
            if (err) {
                console.log(err.stack);
                next(err);
            } else {
                res.json(item);
            }
        })
    })

    // Post a new User or change name
    .post(function (req, res, next) {
        var username = req.body.username.trim();
        if (username.length == 0) {
            res.redirect("/welcome");
            console.error("Username cannot be empty.");
        } else {
            if (req.session.userId == undefined) {
                // If no user is linked to session, create a new one
                user.create({
                    name: username
                }, function (err, user) {
                    if (err) {
                        console.error(err.stack);
                        next(err);
                    } else {
                        console.log("POST creating new user: " + user);
                        // Link session with user
                        req.session.userId = user._id;
                        res.redirect("/");
                    }

                })
            } else {
                // Else modify the username
                var userId = req.session.userId;
                user.update({_id: userId}, {
                    $set: {
                        name: username
                    }
                }, function (err) {
                    if (err) {
                        console.error(err.stack);
                        next(err);
                    } else {
                        console.log("POST updating user with id " + userId);
                        res.redirect("/");
                    }
                })

            }
        }
    });

router.route("/objects")

    // Gets a list of users ids and returns the objects
    .post(function (req, res, next) {
        console.log(req.body);
        var userIds = req.body.userIds;
        console.log(userIds);
        user.find({
            _id: { $in: userIds }
        }, function (err, items) {
            if (err) {
                next(err);
            } else {
                res.json(items);
            }
        })
    })

router.route("/current")

    // Get the currrent user
    .get(function (req, res, next) {
        user.findOne({
                _id: req.session.userId
            },
            function (err, item) {
                if (err) {
                    console.log(err.stack);
                    next(err);
                } else {
                    res.json(item);
                }
            })
    });

module.exports = router;