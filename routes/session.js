'use strict';

const bcrypt = require('bcrypt-as-promised');
const boom = require('boom');
const express = require('express');
const knex = require('../knex');
const { camelizeKeys } = require('humps');

const router = express.Router(); // eslint-disable-line new-cap

router.get('/session', (req, res) => {
  if (req.session.userId) {
    return res.send(true);
  }

  res.send(false);
});

router.post('/session', (req, res, next) => {
  let user;

  knex('users')
    .where('email', req.body.email)
    .first()
    .then((row) => {
      if (!row) {
        throw boom.create(401, 'Bad email or password');
      }

      user = camelizeKeys(row);

      return bcrypt.compare(req.body.password, user.hashedPassword);
    })
    .then(() => {
      delete user.hashedPassword;

      req.session.userId = user.id;

      res.send(user);
    })
    .catch(bcrypt.MISMATCH_ERROR, () => {
      throw boom.create(401, 'Bad email or password');
    })
    .catch((err) => {
      next(err);
    });
});

router.delete('/session', (req, res) => {
  req.session = null;
  res.send(true);
});

module.exports = router;
