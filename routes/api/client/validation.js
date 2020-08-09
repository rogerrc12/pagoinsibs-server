const express = require('express');
const router = express.Router();
const User = require('../../../models/user');

router.post('/cedula', async (req, res, next) => {

  const { cedula } = req.body;

  try {
    const user = await User.findOne({ where: { cedula } });
    
    res.json(user ? true : user);
  } catch (error) {
    res.statusCode = 500;
    next(error);
  }
  
});

router.post('/username', async (req, res) => {

  const { pay_id } = req.body;

  try {
    const user = await User.findOne({ where: { username: pay_id } });

    res.json(user ? true : user);
  } catch (error) {
    res.status(500).send(true);
  }
  
});

router.post('/email', async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ where: { email } });

    res.json(user ? true : user);
  } catch (error) {
    console.error(error.message);
    res.status(500).send(false);
  }
  
});

module.exports = router;