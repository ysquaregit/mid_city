'use strict';

var config = require('../../server/config.json');
var path = require('path');
var senderAddress = "noreply@loopback.com"; //Replace this address with your actual address

module.exports = function(Usermanagement) {
    //send verification email after registration
    Usermanagement.afterRemote('create', function(context, userInstance, next) {
  //  console.log('> Usermanagement.afterRemote triggered');

    var options = {
      type: 'email',
      to: userInstance.email,
      from: senderAddress,
      subject: 'Thanks for registering.',
      redirect: '/verified',
      user: Usermanagement
    };

    userInstance.verify(options, function(err, response, next) {
      if (err) return next(err);
      //console.log('> verification email sent:', response);

      context.res.render('response', {
        title: 'Signed up successfully',
        content: 'Please check your email and click on the verification link ' -
            'before logging in.',
        redirectTo: '/',
        redirectToLinkText: 'Log in'
      });
    });
  });

  //send password reset link when requested
  Usermanagement.on('resetPasswordRequest', function(info) {
    var url = 'http://' + config.host + ':' + config.port + '/reset-password';
    var html = 'Click <a href="' + url + '?access_token=' +
        info.accessToken.id + '">here</a> to reset your password';

    Usermanagement.app.models.Email.send({
      to: info.email,
      from: senderAddress,
      subject: 'Password reset',
      html: html
    }, function(err) {
      if (err) return console.log('> error sending password reset email');
      console.log('> sending password reset email to:', info.email);
    });
  });

  //render UI page after password change
  Usermanagement.afterRemote('changePassword', function(context, userInstance, next) {
    context.res.render('response', {
      title: 'Password changed successfully',
      content: 'Please login again with new password',
      redirectTo: '/',
      redirectToLinkText: 'Log in'
    });
  });

  //render UI page after password reset
  Usermanagement.afterRemote('setPassword', function(context, userInstance, next) {
    context.res.render('response', {
      title: 'Password reset success',
      content: 'Your password has been reset successfully',
      redirectTo: '/',
      redirectToLinkText: 'Log in'
    });
  });
};
