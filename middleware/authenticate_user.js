/**
 * Handle the user authentication
 * @param redirect Link to redirect if no user is authenticated
 * @param white_list Links that can be accessed without a user login
 */
function authenticateUser(redirect, white_list) {
    // Check if user is linked to the session
    return function(req, res, next) {
        var sess = req.session;
        if (sess.userId == undefined) {
            // Check if target is in whitelist or is redirect url
            var url = req.url;
            if (white_list.indexOf(url) > -1 || redirect == url) {
                // Allow access without user
                next();
            } else {
                res.redirect(redirect);
            }
        } else {
            next();
        }
    }
}

module.exports = authenticateUser;