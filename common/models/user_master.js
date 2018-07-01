'use strict';

var config = require('../../server/config.json');
var path = require('path');
var senderAddress = "noreply@loopback.com"; //Replace this address with your actual address
var DEFAULT_TTL = 1209600; // 2 weeks in seconds
var DEFAULT_RESET_PW_TTL = 15 * 60; // 15 mins in seconds
var DEFAULT_MAX_TTL = 31556926; // 1 year in seconds

module.exports = function(Usermaster) {
    Usermaster.afterRemote('create', function(context, userInstance, next) {
    var ttl = DEFAULT_RESET_PW_TTL;
    var where = {
      email: userInstance.email,
    };
    Usermaster.findOne({where: where}, function(err, user) {
      if (err) {
        return cb(err);
      }
      if (!user) {
        err = new Error(g.f('Email not found'));
        err.statusCode = 404;
        err.code = 'EMAIL_NOT_FOUND';
        return cb(err);
      }
      user.createAccessToken(ttl, onTokenCreated);
      function onTokenCreated(err, accessToken) {
        console.log("Test 4");
        if (err) {
          return cb(err);
        }
        console.log("Register");
        console.log(accessToken);
        Usermaster.passwordreset = false;
        var options = {
          type: 'email',
          to: userInstance.email,
          from: senderAddress,
          subject: 'Thanks for registering.',
          redirect: 'http://localhost:4200'+'?access_token='+ accessToken.id,
          user: Usermaster,
        };
        user.verify(options, function(err, response, next) {
          if (err) return next(err);
          context.res.render('response', {
            title: 'Signed up successfully',
            content: 'Please check your email and click on the verification link ' -
                'before logging in.',
            redirectTo: '/',
            redirectToLinkText: 'Log in'
     });
          console.log("Verified");
        });
        console.log("Test 4 out");
      }
      console.log("Test 5");
    });
  });


    //send password reset link when requested
    Usermaster.on('resetPasswordRequest', function(info) {
      console.log("Reset password");
      var url = 'http://' + config.host + ':' + config.port + '/reset-password';
      var html = 'Click <a href="' + url + '?access_token=' +
          info.accessToken.id + '">here</a> to reset your password';
    //  Usermaster.passwordreset = false;
    //  console.log(Usermaster);
  //    console.log(Usermaster.app.models.user_master);
      Usermaster.app.models.Email.send({
          to: info.email,
          from: senderAddress,
          subject: 'Password reset',
          html: html
        }, function(err) {
        if (err) return console.log('> error sending password reset email');
        console.log('> sending password reset email to:', info.email);
      });
    });

    //send password reset link when requested
  /*  Usermaster.on('registerPasswordRequest', function(info) {
      console.log("Register password");

    });*/

    Usermaster.registerPassword = function(options, cb) {
      cb = cb || utils.createPromiseCallback();
      var UserModel = this;
      var ttl = UserModel.settings.resetPasswordTokenTTL || DEFAULT_RESET_PW_TTL;
      options = options || {};
      console.log("Test");
      try {
        if (options.password) {
          UserModel.validatePassword(options.password);
        }
      } catch (err) {
        return cb(err);
      }
      var where = {
        email: options.email,
      };
      if (options.realm) {
        where.realm = options.realm;
      }
      UserModel.findOne({where: where}, function(err, user) {
        console.log("Testing");
        console.log(err);
        console.log(user);
        if (err) {
          return cb(err);
        }
        if (!user) {
          err = new Error(g.f('Email not found'));
          err.statusCode = 404;
          err.code = 'EMAIL_NOT_FOUND';
          return cb(err);
        }
        // create a short lived access token for temp login to change password
        // TODO(ritch) - eventually this should only allow password change
        console.log("TestModel" + UserModel.settings.restrictResetPasswordTokenScope);
        if (UserModel.settings.restrictResetPasswordTokenScope) {
          console.log("Test 3");
          const tokenData = {
            ttl: ttl,
            scopes: ['reset-password'],
          };
          user.createAccessToken(tokenData, options, onTokenCreated);
        } else {
          console.log("Test 3a");
          // We need to preserve backwards-compatibility with
          // user-supplied implementations of "createAccessToken"
          // that may not support "options" argument (we have such
          // examples in our test suite).
          user.createAccessToken(ttl, onTokenCreated);
        }
        function onTokenCreated(err, accessToken) {
          console.log("Test 4");
          if (err) {
            return cb(err);
          }
          cb ();
          var info = {
            email: options.email,
            accessToken: accessToken,
            user: user,
            options: options,
          };
          console.log("Test 4 out");
        }
        console.log("Test 5");
      });
      console.log("Test 6");
      return cb.promise;
  };

  //render UI page after password change
  Usermaster.afterRemote('changePassword', function(context, userInstance, next) {
    context.res.render('response', {
      title: 'Password changed successfully',
      content: 'Please login again with new password',
      redirectTo: '/',
      redirectToLinkText: 'Log in'
    });
  });

  //render UI page after password reset
  Usermaster.afterRemote('setPassword', function(context, userInstance, next) {
  //  Usermaster.passwordreset = true;
  context.res.render('response', {
     title: 'Password reset success',
     content: 'Your password has been reset successfully',
     redirectTo: '/',
     redirectToLinkText: 'Log in'
   });
  });
  //remote methods
  Usermaster.getrole = function(id, cb) {
     Usermaster.findById(id, function (err, instance) {
         response = "The role of user is " + instance.role;
         cb(null, response);
         console.log(response);
     });
   }
   Usermaster.remoteMethod (
     'getRole',
     {
       accepts: {arg: 'id', type: 'Number', http: { source: 'body' } },
       returns: {arg: 'role', type: 'string'},
       http: {path: '/getrole', verb: 'get'},
       }
   );
};
