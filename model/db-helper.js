var chatroom = require('./chatroom');
var user = require('./user');
var message = require('./message');

/**
 * Get all chatrooms of user
 * @param userId
 * @param callback
 */
function getAllChatroomsOfUser(userId, callback) {
    chatroom.find({users: {$in: [userId]}}, callback);
}

/**
 * Get the message query, which contains all new messages, grouped by the chatroom. Format:
 * { chatroom: [message, message, ...},
 *   ... }
 * 
 * @param userId
 * @param callback
 */
function getMessageQueryGroupedByChatroom(userId, callback) {
    // Get all the queried messages of the user
    user.findOne({_id: userId}, function(err, item) {
        if (err) {
            console.error(err);
        } else {
            if (item) {
                var query = item.messageQuery;
                message.aggregate([
                        {
                            $match: {
                                _id: {$in: query}
                            }
                        },
                        {
                            $sort: {
                                "created": -1
                            }
                        },
                        {
                            $group: {
                                _id: "$chatroomId",
                                "records": {$push: "$$ROOT"},
                                "count": {$sum: 1}
                            }
                        }
                    ], callback
                )
            }
        }
    });
}

/**
 * Clean the message query
 * @param userId
 * @param callback
 */
function deleteMessageQuery(userId, callback) {
    user.update({_id: userId}, {messageQuery: []}, callback);
}

/**
 * Create a new message and send it to all the messagequeries of the user in the chatroom
 * @param userId Author
 * @param chatroomId Chatroom which the message is related
 * @param body The message text
 * @param callback
 */
function createAndSendToUsers(userId, chatroomId, body, callback) {

    // Create the message
    message.create({userId: userId, chatroomId: chatroomId, body: body}, function (err, messageItem) {
        if (err) {
            console.error(err);
        } else {
            var messageId = messageItem._id;
            // Get the chatroom object associated with the message
            chatroom.findOne({_id: chatroomId}, function (err, chatroomItem) {
                if (err) {
                    console.error(err);
                } else {
                    var userIds = chatroomItem.users;
                    // Get the users in the chatroom
                    user.find({_id: {$in: userIds}}, function (err, userItems) {
                        if (err) {
                            console.error(err.stack);
                        } else {
                            // Add the message to the message query of each user
                            userItems.forEach(function (userItem) {
                                if (userItem.messageQuery == undefined) {
                                    userItem.messageQuery = [];
                                }
                                userItem.messageQuery.push(messageId);
                                userItem.save(function (err) {
                                    if (err)
                                        console.error(err);
                                })
                            });
                            callback(err, messageItem);
                        }
                    })
                }
            });
        }

    })
}


module.exports.getAllChatroomsofUser = getAllChatroomsOfUser;
module.exports.getMessageQueryGroupedByChatroom = getMessageQueryGroupedByChatroom;
module.exports.deleteMessageQuery = deleteMessageQuery;
module.exports.createAndSendToUsers = createAndSendToUsers;